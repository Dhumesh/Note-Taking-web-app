import express from 'express';
import Note from '../models/Note.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// Get all notes (owned + shared)
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .sort({ updatedAt: -1 })
      .populate('owner', 'name email')
      .populate('collaborators', 'name email')
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Full-text search
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const notes = await Note.find(
      {
        $text: { $search: q },
        $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('owner', 'name email')
      .populate('collaborators', 'name email')
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    })
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create note
router.post('/', async (req, res) => {
  try {
    const note = await Note.create({
      title: req.body.title || 'Untitled',
      content: req.body.content || '',
      owner: req.user._id,
    });
    await note.populate(['owner', 'collaborators']);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update note (owner or collaborator)
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (req.body.title !== undefined) note.title = req.body.title;
    if (req.body.content !== undefined) note.content = req.body.content;
    await note.save();
    await note.populate(['owner', 'collaborators']);
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete note (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await note.deleteOne();
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add collaborator (owner only)
router.post('/:id/collaborators', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.equals(req.user._id))
      return res.status(400).json({ message: 'Cannot add yourself' });
    if (note.collaborators.some((c) => c.equals(user._id)))
      return res.status(400).json({ message: 'Already a collaborator' });
    note.collaborators.push(user._id);
    await note.save();
    await note.populate('owner', 'name email').populate('collaborators', 'name email');
    res.json(note);
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
      (id) => id.toString() !== req.params.userId
    );
    await note.save();
    await note.populate('owner', 'name email').populate('collaborators', 'name email');
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
