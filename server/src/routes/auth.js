import crypto from 'node:crypto';
import {Router} from 'express';import bcrypt from 'bcryptjs';import {User,publicUser} from '../models/User.js';import {authenticate,signToken,wrap} from '../middleware/auth.js';import {fail} from '../utils/validation.js';
const router=Router();router.post('/login',wrap(async(req,res)=>{const {email,password}=req.body||{};if(!email||!password)fail('Email and password are required.');const user=await User.findOne({email:String(email).toLowerCase().trim()}).select('+passwordHash');if(!user||!user.active||!await bcrypt.compare(String(password),user.passwordHash))return res.status(401).json({message:'Invalid email or password.'});res.json({token:signToken(user),user:publicUser(user)})}));router.get('/me',authenticate,wrap(async(req,res)=>res.json({user:publicUser(req.user)})));router.post('/change-password',authenticate,wrap(async(req,res)=>{const {currentPassword,newPassword}=req.body||{};if(typeof newPassword!=='string'||newPassword.length<12)fail('Use a new password with at least 12 characters.');const user=await User.findById(req.user._id).select('+passwordHash');if(!await bcrypt.compare(String(currentPassword||''),user.passwordHash))fail('Current password is incorrect.',403);user.passwordHash=await bcrypt.hash(newPassword,12);user.mustChangePassword=false;user.tokenVersion=(user.tokenVersion||0)+1;await user.save();res.json({message:'Password changed successfully.'})}));
router.post('/activate',wrap(async(req,res)=>{
 const {token,password}=req.body||{};
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/i.test(token)||typeof password!=='string'||password.length<12||password.length>256)fail('Use a valid setup link and a password of 12–256 characters.',400);
 const hash=crypto.createHash('sha256').update(token).digest('hex');
 const user=await User.findOne({inviteTokenHash:hash,inviteExpiresAt:{$gt:new Date()},active:true}).select('+passwordHash +inviteTokenHash +inviteExpiresAt');
 if(!user)fail('This setup link has expired or has already been used. Ask an admin for a new link.',410);
 user.passwordHash=await bcrypt.hash(password,12);user.mustChangePassword=false;user.tokenVersion=(user.tokenVersion||0)+1;user.inviteTokenHash=undefined;user.inviteExpiresAt=undefined;
 await user.save();res.json({message:'Password set. You can now sign in.'});
}));

export default router;
