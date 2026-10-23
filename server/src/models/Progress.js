import mongoose from 'mongoose';
const schema=new mongoose.Schema({student:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},course:{type:mongoose.Schema.Types.ObjectId,ref:'Course',required:true},completedLessons:[{type:mongoose.Schema.Types.ObjectId}]},{timestamps:true});schema.index({student:1,course:1},{unique:true});export const Progress=mongoose.model('Progress',schema);
