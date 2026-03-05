import express from 'express';
import Note from '../models/Note.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
const MAX_NOTE_CONTENT_BYTES = 12 * 1024 * 1024;

function validateNoteSize(content) {
  const bytes = Buffer.byteLength(content || '', 'utf8');
  return bytes <= MAX_NOTE_CONTENT_BYTES;
}

function accessFilter(userId) {
  return {
    $or: [{ owner: userId }, { 'collaborators.user': userId }, { collaborators: userId }],
  };
}

function getPermission(note, userId) {
  if (note.owner?.toString() === userId.toString()) return 'edit';
  for (const c of note.collaborators || []) {
    if (c?.user && c.user.toString() === userId.toString()) return c.permission || 'edit';
    if (c?.toString && c.toString() === userId.toString()) return 'edit'; // legacy docs
  }
  return null;
}

function canEdit(note, userId) {
  return getPermission(note, userId) === 'edit';
}

function withPermission(note, userId) {
  const obj = note.toObject ? note.toObject() : note;
  return { ...obj, currentUserPermission: getPermission(note, userId) };
}

// Get all notes (owned + shared)
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Full-text search (falls back to regex if text index is not ready)
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const baseFilter = {
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    };
    let notes;
    try {
      notes = await Note.find(
        { ...baseFilter, $text: { $search: q } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .lean();
    } catch (textErr) {
      // Text index may not exist yet; fall back to regex search
      const regex = new RegExp(escapeRegex(q), 'i');
      notes = await Note.find({
        ...baseFilter,
        $or: [{ title: regex }, { content: regex }],
      })
        .sort({ updatedAt: -1 })
        .populate('owner', 'name email')
        .populate('collaborators.user', 'name email')
        .lean();
    }
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get trashed notes (owned + shared)
router.get('/trash', async (req, res) => {
  try {
    const notes = await Note.find({
      ...accessFilter(req.user._id),
      isTrashed: true,
    })
      .sort({ trashedAt: -1, updatedAt: -1 })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get favorite notes (owned + shared)
router.get('/favorites', async (req, res) => {
  try {
    const notes = await Note.find({
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
      isFavorite: true,
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email')
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    })
      .populate('owner', 'name email')
      .populate('collaborators.user', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const nextContent = req.body.content || '';
    if (!validateNoteSize(nextContent)) {
      return res.status(413).json({ message: 'Note is too large. Reduce image size/quantity and try again.' });
    }
    const note = await Note.create({
      title: req.body.title || 'Untitled',
      content: nextContent,
      owner: req.user._id,
    });
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.status(201).json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update note (owner or collaborator)
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!canEdit(note, req.user._id)) {
      return res.status(403).json({ message: 'You have view-only access to this note.' });
    }
    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.content !== undefined) {
      if (!validateNoteSize(req.body.content)) {
        return res.status(413).json({ message: 'Note is too large. Reduce image size/quantity and try again.' });
      }
      note.content = req.body.content;
    }
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    if (err?.code === 10334 || /BSONObj size/i.test(err?.message || '')) {
      return res.status(413).json({ message: 'Note exceeded storage limit. Reduce image size/quantity.' });
    }
    res.status(500).json({ message: err.message });
  }
});

// Favorite/unfavorite note (owner or collaborator)
router.put('/:id/favorite', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (req.body?.isFavorite !== undefined) note.isFavorite = !!req.body.isFavorite;
    else note.isFavorite = !note.isFavorite;
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Move note to trash (owner or collaborator)
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...accessFilter(req.user._id),
      isTrashed: { $ne: true },
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!canEdit(note, req.user._id)) {
      return res.status(403).json({ message: 'You have view-only access to this note.' });
    }
    note.isTrashed = true;
    note.trashedAt = new Date();
    await note.save();
    res.json({ message: 'Note moved to trash', noteId: note._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Restore note from trash (owner or collaborator)
router.post('/:id/restore', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      ...accessFilter(req.user._id),
      isTrashed: true,
    });
    if (!note) return res.status(404).json({ message: 'Note not found in trash' });
    if (!canEdit(note, req.user._id)) {
      return res.status(403).json({ message: 'You have view-only access to this note.' });
    }
    note.isTrashed = false;
    note.trashedAt = null;
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Permanently delete note from trash (owner only)
router.delete('/:id/permanent', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id, isTrashed: true });
    if (!note) return res.status(404).json({ message: 'Note not found in trash' });
    await note.deleteOne();
    res.json({ message: 'Note permanently deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add collaborator (owner only)
router.post('/:id/collaborators', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const permission = req.body?.permission === 'view' ? 'view' : 'edit';
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.equals(req.user._id))
      return res.status(400).json({ message: 'Cannot add yourself' });
    if (
      note.collaborators.some(
        (c) =>
          (c?.user && c.user.toString() === user._id.toString()) ||
          (c?.toString && c.toString() === user._id.toString())
      )
    )
      return res.status(400).json({ message: 'Already a collaborator' });
    note.collaborators.push({ user: user._id, permission });
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update collaborator permission (owner only)
router.put('/:id/collaborators/:userId/permission', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const permission = req.body?.permission;
    if (!['view', 'edit'].includes(permission)) {
      return res.status(400).json({ message: 'Permission must be view or edit' });
    }
    const collab = note.collaborators.find(
      (c) => c?.user && c.user.toString() === req.params.userId
    );
    if (!collab) return res.status(404).json({ message: 'Collaborator not found' });
    collab.permission = permission;
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove collaborator (owner only)
router.delete('/:id/collaborators/:userId', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    note.collaborators = note.collaborators.filter(
      (c) =>
        !(
          (c?.user && c.user.toString() === req.params.userId) ||
          (c?.toString && c.toString() === req.params.userId)
        )
    );
    await note.save();
    await note.populate([
      { path: 'owner', select: 'name email' },
      { path: 'collaborators.user', select: 'name email' },
    ]);
    res.json(withPermission(note, req.user._id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
