import {Router} from 'express';
import {Course} from '../models/Course.js';
import {Enrollment} from '../models/Enrollment.js';
import {Message} from '../models/Message.js';
import {authenticate,permit,wrap} from '../middleware/auth.js';
import {fail,validObjectId} from '../utils/validation.js';
import {canReadLearning,isAssignedInstructor,validateMessage} from '../utils/learning-access.js';
import rateLimit from 'express-rate-limit';

const router=Router();router.use(authenticate,permit('admin','instructor','student'));
const postLimiter=rateLimit({windowMs:60_000,limit:30,standardHeaders:'draft-7',legacyHeaders:false});
async function context(req){
  if(!validObjectId(req.params.courseId))fail('Invalid course ID.',400);
  const course=await Course.findById(req.params.courseId).select('instructor title');
  if(!course)fail('Course not found.',404);
  const enrolled=req.user.role==='student' && Boolean(await Enrollment.exists({student:req.user._id,course:course._id,status:{$in:['active','completed']}}));
  if(!canReadLearning(req.user,course,enrolled))fail('You cannot access this course.',403);
  return {course,enrolled};
}
async function authorizeThread(req,course){
  const scope=req.query.scope||req.body?.scope||'course';
  if(!['course','direct'].includes(scope))fail('Invalid conversation type.');
  if(scope==='course')return {scope,student:null};
  if(req.user.role==='admin')fail('Administrators cannot read private student messages.',403);
  if(!course.instructor)fail('No instructor is assigned to this course.',400);
  const studentId=req.user.role==='student'?String(req.user._id):String(req.query.student||req.body?.student||'');
  if(!validObjectId(studentId))fail('Choose a student for private messages.');
  if(req.user.role==='instructor'&&!isAssignedInstructor(req.user,course))fail('Not assigned to this course.',403);
  const active=await Enrollment.exists({student:studentId,course:course._id,status:{$in:['active','completed']}});
  if(!active)fail('Student is not currently enrolled in this course.',403);
  return {scope,student:studentId};
}
router.get('/courses/:courseId/participants',wrap(async(req,res)=>{
  const {course}=await context(req);
  if(req.user.role==='student')return res.json({items:[]});
  const items=await Enrollment.find({course:course._id,status:{$in:['active','completed']}}).populate('student','name email').select('student');
  res.json({items:items.filter(x=>x.student).map(x=>x.student)});
}));
router.get('/courses/:courseId',wrap(async(req,res)=>{
  const {course}=await context(req);const thread=await authorizeThread(req,course);
  const filter={course:course._id,...thread,deletedAt:null};
  const items=await Message.find(filter).sort({createdAt:-1}).limit(100).populate('sender','name role');
  res.setHeader('Cache-Control','no-store');res.json({items:items.reverse(),hasMore:items.length===100});
}));
router.post('/courses/:courseId',postLimiter,wrap(async(req,res)=>{
  const {course}=await context(req);const thread=await authorizeThread(req,course);
  const problem=validateMessage(req.body?.body);if(problem)fail(problem);
  const item=await Message.create({course:course._id,...thread,sender:req.user._id,body:req.body.body.trim()});
  await item.populate('sender','name role');res.status(201).json({item});
}));
router.delete('/:messageId',wrap(async(req,res)=>{
  if(!validObjectId(req.params.messageId))fail('Invalid message ID.');
  const item=await Message.findById(req.params.messageId);if(!item||item.deletedAt)fail('Message not found.',404);
  const course=await Course.findById(item.course).select('instructor');if(!course)fail('Course not found.',404);
  const owner=String(item.sender)===String(req.user._id);
  const assigned=isAssignedInstructor(req.user,course);
  if(req.user.role==='instructor'&&!assigned)fail('Course is not assigned to this instructor.',403);
  // Instructor may moderate their course group chat; private messages are
  // removable by their original sender only. Admin moderates group only.
  const moderator=item.scope==='course'&&(req.user.role==='admin'||assigned);
  if(!owner&&!moderator)fail('You cannot remove this message.',403);
  if(req.user.role==='student'){
    const active=await Enrollment.exists({student:req.user._id,course:item.course,status:{$in:['active','completed']}});
    if(!active)fail('Course access is no longer active.',403);
  }
  item.deletedAt=new Date();await item.save();res.json({message:'Message removed.'});
}));
export default router;
