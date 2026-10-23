import mongoose from 'mongoose';

// Course discussions can be read by active students in the course and the
// assigned instructor. A direct message is scoped to exactly one student.
const schema = new mongoose.Schema({
  course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true},
  scope: {type: String, enum: ['course','direct'], required: true},
  student: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
  sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  body: {type: String, required: true, trim: true, maxlength: 4000},
  deletedAt: {type: Date, default: null},
}, {timestamps: true});
schema.index({course:1,scope:1,student:1,createdAt:-1});
export const Message = mongoose.model('Message',schema);
