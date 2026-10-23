import { Announcement } from '../models/Announcement.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { fail, validObjectId } from '../utils/validation.js';
import { wrap } from '../middleware/auth.js';

async function allowedCourse(user, courseId) {
  if (!validObjectId(courseId)) fail('Select a valid course.');
  const course = await Course.findById(courseId);
  if (!course) fail('Course not found.', 404);
  if (user.role === 'instructor' && String(course.instructor) !== String(user._id)) fail('Course is not assigned to you.', 403);
  return course;
}

export function announcementRoutes(router, role) {
  router.get('/announcements', wrap(async (req, res) => {
    let filter = {};
    if (role === 'instructor') {
      const courses = await Course.find({ instructor: req.user._id }).distinct('_id');
      filter = { course: { $in: courses } };
    }
    if (role === 'student') {
      const courses = await Enrollment.find({ student: req.user._id, status: { $in: ['active', 'completed'] } }).distinct('course');
      filter = { published: true, $or: [{ course: null }, { course: { $in: courses } }] };
    }
    const items = await Announcement.find(filter).populate('course', 'title').populate('author', 'name').sort({ createdAt: -1 }).limit(150);
    res.json({ items });
  }));

  if (role === 'student') return;
  router.post('/announcements', wrap(async (req, res) => {
    const { title, body, course, published = true } = req.body || {};
    if (typeof title !== 'string' || title.trim().length < 3 || title.length > 160 || typeof body !== 'string' || body.trim().length < 3 || body.length > 4000) fail('Provide a title and message (max 160/4000 characters).');
    if (role === 'instructor' && !course) fail('Instructors must select one of their assigned courses.');
    if (course) await allowedCourse(req.user, course);
    const item = await Announcement.create({ title: title.trim(), body: body.trim(), course: course || null, published: Boolean(published), author: req.user._id });
    res.status(201).json({ item, message: 'Announcement published.' });
  }));
  router.patch('/announcements/:id', wrap(async (req, res) => {
    const item = await Announcement.findById(req.params.id);
    if (!item) fail('Announcement not found.', 404);
    if (role === 'instructor') {
      if (String(item.author) !== String(req.user._id)) fail('Only the author can edit this announcement.', 403);
      await allowedCourse(req.user, item.course);
    }
    const { title, body, published } = req.body || {};
    if (title !== undefined) { if (typeof title !== 'string' || title.trim().length < 3 || title.length > 160) fail('Invalid title.'); item.title = title.trim(); }
    if (body !== undefined) { if (typeof body !== 'string' || body.trim().length < 3 || body.length > 4000) fail('Invalid message.'); item.body = body.trim(); }
    if (published !== undefined) item.published = Boolean(published);
    await item.save(); res.json({ item, message: 'Announcement updated.' });
  }));
  router.delete('/announcements/:id', wrap(async (req, res) => {
    const item = await Announcement.findById(req.params.id);
    if (!item) fail('Announcement not found.', 404);
    if (role === 'instructor' && String(item.author) !== String(req.user._id)) fail('Only the author can remove this announcement.', 403);
    await item.deleteOne(); res.json({ message: 'Announcement deleted.' });
  }));
}
