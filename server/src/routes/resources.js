import {Router} from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {promises as fsp} from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {Course} from '../models/Course.js';
import {Enrollment} from '../models/Enrollment.js';
import {Resource} from '../models/Resource.js';
import {Session} from '../models/Session.js';
import {authenticate,permit,wrap} from '../middleware/auth.js';
import {fail,isHttpUrl,validObjectId,validateVideo} from '../utils/validation.js';
import {canEditLearning,canReadLearning,safeFileName,safeResourceKind} from '../utils/learning-access.js';

const router=Router();router.use(authenticate,permit('admin','instructor','student'));
const root=path.resolve(process.env.PRIVATE_UPLOAD_DIR||path.join(process.cwd(),'private_uploads'));
const extensions={'.pdf':'application/pdf','.txt':'text/plain','.md':'text/markdown','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','.mp4':'video/mp4','.webm':'video/webm'};
const videos=new Set(['.mp4','.webm']);
const upload=multer({
  storage:multer.diskStorage({destination:(_req,_file,cb)=>{fs.mkdirSync(root,{recursive:true,mode:0o700});cb(null,root);},filename:(_req,_file,cb)=>cb(null,crypto.randomUUID()+'.bin')}),
  limits:{fileSize:120*1024*1024,files:1,fields:10,fieldSize:2000},
  fileFilter:(_req,file,cb)=>{const ext=path.extname(file.originalname||'').toLowerCase();if(!extensions[ext])return cb(new Error('Only PDF, TXT, MD, DOCX, PPTX, XLSX, MP4 or WEBM files are supported.'));cb(null,true)}
}).single('file');
const runUpload=(req,res,next)=>upload(req,res,error=>{if(error){error.status=error.code==='LIMIT_FILE_SIZE'?413:400;return next(error)}next()});
async function courseAccess(req,courseId,edit=false){
  if(!validObjectId(courseId))fail('Invalid course ID.');
  const course=await Course.findById(courseId).select('instructor modules');
  if(!course)fail('Course not found.',404);
  const enrolled=req.user.role==='student'&&Boolean(await Enrollment.exists({student:req.user._id,course:course._id,status:{$in:['active','completed']}}));
  if(edit?!canEditLearning(req.user,course):!canReadLearning(req.user,course,enrolled))fail('You do not have access to this course.',403);
  return course;
}
function moduleExists(course,moduleId){return validObjectId(moduleId)&&Array.isArray(course.modules)&&course.modules.some(m=>String(m._id)===String(moduleId))}
async function ensureSession(courseId,id){if(!id)return null;if(!validObjectId(id)||!await Session.exists({_id:id,course:courseId}))fail('Recorded session must belong to this course.');return id}
function validateExternal(kind,url){
  if(!isHttpUrl(url))fail('A valid HTTPS link is required.');
  if(new URL(url).protocol!=='https:')fail('Use HTTPS links for lesson resources.');
  if(kind==='recording'&&!validateVideo('youtube',url)&&!validateVideo('drive',url))fail('Use a YouTube or Google Drive recording link.');
}
async function validateContent(file,kind){
  const ext=path.extname(file.originalname).toLowerCase();
  const expected=videos.has(ext)?'recording':'document';
  if(kind!==expected)fail('Selected resource type does not match the file.');
  if(kind==='document'&&file.size>20*1024*1024)fail('Documents must be 20 MB or smaller.',413);
  if(kind==='recording'&&file.size>120*1024*1024)fail('Recording exceeds 120 MB.',413);
  const fd=await fsp.open(file.path,'r');let bytes;
  try{bytes=Buffer.alloc(16);await fd.read(bytes,0,16,0)}finally{await fd.close()}
  const start=bytes.toString('utf8');
  const valid=ext==='.pdf'?start.startsWith('%PDF-'):
    ['.docx','.xlsx','.pptx'].includes(ext)?bytes[0]===0x50&&bytes[1]===0x4b:
    ext==='.mp4'?bytes.toString('ascii',4,8)==='ftyp':
    ext==='.webm'?bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):
    !bytes.includes(0); // txt/md only; reject binary-like files
  if(!valid)fail('File content does not match its extension.');
  return extensions[ext];
}
const exposed=(r)=>({
  _id:r._id,course:r.course,moduleId:r.moduleId,session:r.session,title:r.title,description:r.description,
  kind:r.kind,source:r.source,externalUrl:r.source==='link'?r.externalUrl:undefined,
  originalName:r.originalName,mimeType:r.mimeType,sizeBytes:r.sizeBytes,createdAt:r.createdAt,
  uploadedBy:r.uploadedBy,
});
router.get('/courses/:courseId',wrap(async(req,res)=>{
  await courseAccess(req,req.params.courseId);
  const items=await Resource.find({course:req.params.courseId}).populate('uploadedBy','name').sort({createdAt:-1}).limit(500);
  res.setHeader('Cache-Control','no-store');res.json({items:items.map(exposed)});
}));
router.post('/courses/:courseId/links',wrap(async(req,res)=>{
  const course=await courseAccess(req,req.params.courseId,true);
  const {moduleId,session,title,description='',kind,url}=req.body||{};
  if(!moduleExists(course,moduleId))fail('Choose a module in this course.');
  if(!safeResourceKind(kind)||typeof title!=='string'||!title.trim()||title.length>160||typeof description!=='string'||description.length>800)fail('Title, resource type and description are invalid.');
  validateExternal(kind,url);
  const sessionId=await ensureSession(course._id,session);
  const item=await Resource.create({course:course._id,moduleId,session:sessionId,title:title.trim(),description,kind,source:'link',externalUrl:url,uploadedBy:req.user._id});
  res.status(201).json({item:exposed(item)});
}));
router.post('/courses/:courseId/uploads',runUpload,wrap(async(req,res)=>{
  try{
    const course=await courseAccess(req,req.params.courseId,true);
    const {moduleId,session,title,description='',kind}=req.body||{};
    if(!moduleExists(course,moduleId))fail('Choose a module in this course.');
    if(!req.file)fail('Choose a file to upload.');
    if(!safeResourceKind(kind)||typeof title!=='string'||!title.trim()||title.length>160||typeof description!=='string'||description.length>800)fail('Invalid title or resource details.');
    const mimeType=await validateContent(req.file,kind);
    const sessionId=await ensureSession(course._id,session);
    const item=await Resource.create({course:course._id,moduleId,session:sessionId,title:title.trim(),description,kind,source:'upload',storageName:req.file.filename,originalName:safeFileName(req.file.originalname),mimeType,sizeBytes:req.file.size,uploadedBy:req.user._id});
    res.status(201).json({item:exposed(item)});
  }catch(error){if(req.file)await fsp.unlink(req.file.path).catch(()=>{});throw error}
}));
router.get('/:id/file',wrap(async(req,res)=>{
  if(!validObjectId(req.params.id))fail('Invalid file ID.');
  const resource=await Resource.findById(req.params.id);
  if(!resource||resource.source!=='upload')fail('File not found.',404);
  await courseAccess(req,resource.course);
  const filePath=path.join(root,path.basename(resource.storageName));
  const stat=await fsp.stat(filePath).catch(()=>null);
  if(!stat||!stat.isFile())fail('The stored file is missing. Contact your administrator.',404);
  res.setHeader('Content-Type',resource.mimeType||'application/octet-stream');
  res.setHeader('Content-Disposition',`attachment; filename="${safeFileName(resource.originalName).replace(/[^\x20-\x7e]/g,'_')}"`);
  res.setHeader('Content-Length',stat.size);res.setHeader('Cache-Control','private, no-store');
  fs.createReadStream(filePath).on('error',e=>{if(!res.headersSent)res.status(500).end('Failed to read file.');else res.destroy(e)}).pipe(res);
}));
router.delete('/:id',wrap(async(req,res)=>{
  if(!validObjectId(req.params.id))fail('Invalid resource ID.');
  const item=await Resource.findById(req.params.id);if(!item)fail('Resource not found.',404);
  await courseAccess(req,item.course,true);
  await Resource.deleteOne({_id:item._id});
  if(item.storageName)await fsp.unlink(path.join(root,path.basename(item.storageName))).catch(error=>console.warn('Resource cleanup:',error.message));
  res.json({message:'Resource removed.'});
}));
export default router;
