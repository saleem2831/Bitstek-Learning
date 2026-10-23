import mongoose from 'mongoose';
import {countLessons} from '../utils/course.js';
const lessonSchema=new mongoose.Schema({title:{type:String,required:true},provider:{type:String,enum:['youtube','drive'],required:true},url:{type:String,required:true},isPreview:{type:Boolean,default:false},durationMinutes:{type:Number,min:0,default:0}}, {_id:true});
const moduleSchema=new mongoose.Schema({title:{type:String,required:true},lessons:{type:[lessonSchema],default:[]}}, {_id:true});
const schema=new mongoose.Schema({title:{type:String,required:true,trim:true},slug:{type:String,required:true,unique:true},category:{type:String,default:'Development'},summary:{type:String,required:true},description:{type:String,default:''},image:{type:String,default:''},duration:{type:String,default:'Self-paced'},level:{type:String,default:'Beginner'},outcomes:[String],instructor:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null},modules:{type:[moduleSchema],default:[]},published:{type:Boolean,default:false},featured:{type:Boolean,default:false}}, {timestamps:true,toJSON:{virtuals:true}});
// Populated course projections such as `.populate('course', 'title')` do not
// contain modules. A virtual getter must NOT assume a field was selected.
// Also tolerate null arrays in course documents created by older versions.
schema.virtual('lessonsCount').get(function () {
  return countLessons(this.modules);
});
export const Course=mongoose.model('Course',schema);
