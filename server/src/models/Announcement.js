import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  published: { type: Boolean, default: true },
}, { timestamps: true });
schema.index({ course: 1, published: 1, createdAt: -1 });
export const Announcement = mongoose.model('Announcement', schema);
