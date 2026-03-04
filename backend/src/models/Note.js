import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isTrashed: { type: Boolean, default: false, index: true },
    trashedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Full-text search on title and content
noteSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('Note', noteSchema);
