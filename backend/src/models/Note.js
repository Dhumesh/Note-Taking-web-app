import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        permission: { type: String, enum: ['view', 'edit'], default: 'edit' },
      },
    ],
    isFavorite: { type: Boolean, default: false, index: true },
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

function normalizeCollaborator(entry) {
  if (!entry) return null;
  if (entry.user) {
    return {
      user: entry.user._id || entry.user,
      permission: entry.permission === 'view' ? 'view' : 'edit',
    };
  }
  return {
    user: entry._id || entry,
    permission: 'edit',
  };
}

// Backward compatibility: convert legacy collaborators [ObjectId] to
// [{ user: ObjectId, permission: 'edit' }] before validation/save.
noteSchema.pre('validate', function (next) {
  if (!Array.isArray(this.collaborators)) return next();
  this.collaborators = this.collaborators
    .map(normalizeCollaborator)
    .filter((c) => c && c.user);
  next();
});

// Full-text search on title and content
noteSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Note', noteSchema);
