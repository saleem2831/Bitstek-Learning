# Bitstek Learning v5 — course messages, notes and class recordings

This release extends the **complete branded v4 MERN source**; it is not a separate sample project. It preserves admin enrollment, offline payment verification, instructor scheduling, YouTube/Drive course lessons, and the v4 Course.lessonsCount error correction.

## Access and workflows

### Course discussion (instructor ↔ many students)
1. Admin creates a course and assigns one instructor.
2. Admin onboards and activates student enrollments as before.
3. **Instructor > Messages**: select course → **Course discussion** → post a class-wide message.
4. **Student > Messages** or **My Learning > Open course**: students see the discussion and can reply.
5. Admin can moderate the course-wide thread but does **not** see private threads.

Only the assigned instructor and active/completed students can participate, plus admins on the group thread. Course chat is **near real-time polling every 15 seconds**, not WebSocket push. A user can refresh manually. Max 100 newest messages returned per request (the interface currently does not page older messages).

### Private instructor ↔ individual student messages
1. Instructor > Messages > choose course > **Private messages**.
2. Choose a student from that course's **active/completed enrollment roster**.
3. Send text messages; the selected student alone can read their private thread.
4. Student > Messages > choose enrolled course > **Private messages** to reply to assigned instructor.

Admins cannot read these private threads. Reassigning instructors will revoke the previous instructor's live access to that course's messaging.

### PDF/notes/other documents and recorded classes
1. Admin or assigned instructor > Courses > Manage Lessons.
2. Create/open a module, then scroll to **Course materials & recordings**.
3. Choose the target module; select **Notes / Document** or **Recorded class**.
4. Choose **Upload from device** or **YouTube / Google Drive link**, enter title, optional description, and upload/save.
5. For recordings, optionally associate a live class session from that course.
6. Students see course materials inside **Student > My Learning > Course** and can download files or watch linked recordings. MP4/WEBM recordings saved locally are opened through an authenticated blob viewer; large files may take time to load fully.
7. Admin/instructor can delete their course's resources. Removing a module also removes its related resources and stored files.

Supported upload extensions: `.pdf`, `.txt`, `.md`, `.docx`, `.pptx`, `.xlsx`, `.mp4`, `.webm`. Document max **20 MB**, video max **120 MB**. Basic file-signature/extension checks are implemented. This is not a malware scanner; scan files and move recordings to managed object storage before high-scale public production.

### Data and file storage

- New MongoDB models: `Message`, `Resource`; **no destructive database migration required**.
- Documents are stored on API machine in `PRIVATE_UPLOAD_DIR` (default `server/private_uploads` when started from `server`). This directory is NOT exposed as a static public URL.
- Download endpoint requires an authenticated student enrollment, assigned instructor, or admin permission.
- Keep this directory in persistent storage when deploying. Back up both MongoDB and uploaded files.
- Using cloud services like AWS S3 with signed downloads is recommended for multi-server production. Netlify/Vercel serverless filesystems must not be used for this local-storage design.
- Large recordings are better stored in YouTube (correct privacy configuration) or Google Drive, with links added to resources.
- YouTube unlisted and Drive link sharing are not DRM; users can redistribute links. The platform cannot enforce access after users open a third-party URL.

## Main endpoints (all authenticated)

| Method | API | Role |
|---|---|---|
| GET | `/api/messages/courses/:courseId?scope=course` | admin, assigned instructor, enrolled student |
| GET | `/api/messages/courses/:courseId?scope=direct&student=:studentId` | assigned instructor; students omit student query |
| GET | `/api/messages/courses/:courseId/participants` | admin/instructor |
| POST | `/api/messages/courses/:courseId` | authorized role; body `{scope,student?,body}` |
| DELETE | `/api/messages/:messageId` | sender; course discussion moderators |
| GET | `/api/resources/courses/:courseId` | authorized role |
| POST | `/api/resources/courses/:courseId/links` | admin / assigned instructor |
| POST | `/api/resources/courses/:courseId/uploads` | admin / assigned instructor, `multipart/form-data` |
| GET | `/api/resources/:id/file` | authorized role; binary, private download |
| DELETE | `/api/resources/:id` | admin / assigned instructor |

### Deployment / upgrading from v4

1. **Back up MongoDB**, your `server/.env`, and any pre-existing upload folders.
2. Extract v5 into a new folder; preserve your existing database URL, JWT secret, client URL, SMTP settings and seed credentials in `server/.env`. Never run `npm run seed` again merely to upgrade.
3. From `server`, run `npm install`. New dependency: **multer** for multipart uploads. Set `PRIVATE_UPLOAD_DIR` to a durable, writable absolute path before production.
4. From `client`, run `npm install`, then `npm run build`.
5. Restart the Node API (`npm run dev` on your machine or PM2 in production); reload the frontend.
6. Verify `/api/health` then test the four key use cases: class-wide message, private instructor–student message, PDF upload/download, recorded video upload/watch.
7. Confirm students without an enrollment cannot read unrelated class messages or download resources.

## Known constraints

- Messaging is polling-based; no mobile push or email notification for new messages.
- Text-only messages; attachments are added as course resources, not in a private DM.
- Group chat fetches the 100 newest messages; older message pagination not yet included.
- Plain documents and recordings can be downloaded by enrolled learners; no copy-protection/DRM.
- MP4/WEBM upload is limited to 120 MB; recorded videos in the player are loaded to a browser blob. Prefer a streaming video service for large recordings.
- In production, consider antivirus scanning, instructor/student reporting tools, retention rules, monitoring, S3 private storage and full integration tests.

## Testing honesty

This source was checked with the TypeScript compiler's JS/JSX syntax parser and Node's native dependency-free tests. Full API and Vite browser integration cannot be certified here without installing npm dependencies and connecting to your MongoDB instance. See `docs/VALIDATION_V5.md` for the checked and unverified items.
