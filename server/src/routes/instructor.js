import {announcementRoutes} from './announcements-shared.js';
import {Router} from 'express';import {Course} from '../models/Course.js';import {Enrollment} from '../models/Enrollment.js';import {Session} from '../models/Session.js';import {authenticate,permit,wrap} from '../middleware/auth.js';import {fail,validateVideo} from '../utils/validation.js';import {scheduleRoutes} from './schedule-shared.js';
const router=Router();router.use(authenticate,permit('instructor'));
router.get('/overview',wrap(async(req,res)=>{const ids=(await Course.find({instructor:req.user._id}).select('_id')).map(x=>x._id);const [courses,students,sessions]=await Promise.all([Course.countDocuments({instructor:req.user._id}),Enrollment.countDocuments({course:{$in:ids},status:'active'}),Session.countDocuments({instructor:req.user._id,status:'scheduled',startAt:{$gte:new Date()}})]);res.json({data:{courses,students,sessions}})}));
router.get('/courses',wrap(async(req,res)=>res.json({items:await Course.find({instructor:req.user._id})})));
router.get('/students',wrap(async(req,res)=>{const ids=(await Course.find({instructor:req.user._id}).select('_id')).map(x=>x._id);res.json({items:await Enrollment.find({course:{$in:ids}}).populate('student','name email').populate('course','title').sort({createdAt:-1})})}));
scheduleRoutes(router,'instructor');announcementRoutes(router,'instructor');export default router;
