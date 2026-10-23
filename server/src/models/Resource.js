import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  course: {type:mongoose.Schema.Types.ObjectId,ref:'Course',required:true,index:true},
  moduleId: {type:mongoose.Schema.Types.ObjectId,required:true},
  session: {type:mongoose.Schema.Types.ObjectId,ref:'Session',default:null},
  title: {type:String,trim:true,required:true,maxlength:160},
  description: {type:String,default:'',maxlength:800},
  kind: {type:String,enum:['document','recording'],required:true},
  source: {type:String,enum:['upload','link'],required:true},
  externalUrl: {type:String,default:''},
  storageName: {type:String,default:''},
  originalName: {type:String,default:''},
  mimeType: {type:String,default:''},
  sizeBytes: {type:Number,default:0},
  uploadedBy: {type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
}, {timestamps:true});
schema.index({course:1,moduleId:1,createdAt:-1});
export const Resource=mongoose.model('Resource',schema);
