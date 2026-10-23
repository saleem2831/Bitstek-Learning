# Bitstek Learning v4 — branded stabilization update

**IMPORTANT:** Preserve your current MongoDB database and configured `.env` files. Never run a destructive seed or restore command against production without a backup.

**Primary fix:** The v3 `Course.lessonsCount` virtual crashed on projected course documents (e.g. `populate('course','title')`) because `modules` was missing. This version tolerates unloaded and legacy-null curriculum arrays. This resolves the shared serialization error found in the supplied logs, affecting payments, enrollments, class schedules, announcements and instructor roster.

**Visuals:** Official white SVG brand artwork is applied consistently to the dark navy public header, portal sidebar and footer, with teal focus accents. The previously supplied white SVG/PNG assets remain in `client/public/brand/`.

**Tests:** `cd server && npm test` includes a projected-course serialization regression. A read-only API smoke script is available with `npm run smoke` after configuring test credentials. See `docs/VALIDATION_REPORT.md` for checks completed and environment limitations.

---

# Bitstek Learning — React/Vite + Express + MongoDB

**Purpose:** A professional public website plus a role-based learning management starter platform supporting **manual/offline payments**, **administrator-driven onboarding**, **YouTube/Google Drive lesson links**, and **instructor-created live session schedules**.

> This package is an application starter with real MongoDB-backed APIs and CRUD workflows, not a production-certified LMS. See **Production readiness** below. No payment gateway or self-registration is installed.

## Architecture

```
Browser (React 19 + Vite + React Router)
  ├─ Public pages: marketing, course catalog, course details, enquiries
  ├─ Student portal: enrolled course player, progress, calendar, account
  ├─ Instructor portal: assigned course curriculum, live sessions, roster
  ├─ Admin portal: people, courses, payments, enrollments, schedule, enquiries, CMS
  └─ Corporate portal: design-stage placeholder
                    │
                    ▼
             Express REST API
             JWT authentication
             role + ownership guards
                    │
                    ▼
                MongoDB
  User / Course / Enrollment / Payment / Session / Progress / Enquiry / SiteContent

Video content is not uploaded to Bitstek's server. Course lessons contain provider URLs
with YouTube or Google Drive embeds. Live classes contain external meeting links.
```

## 1. First-time setup

**Prerequisites:** Node.js 20.19+ / 22+, npm and a running MongoDB instance (local or MongoDB Atlas). The included `docker-compose.yml` can start a local MongoDB if Docker is available.

### Database

```bash
docker compose up -d mongo
```

Or start MongoDB manually and use your MongoDB connection URL.

### Backend

```bash
cd server
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET (at least 32 random characters).
# Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (at least 12 characters).
npm install
npm run seed
npm run dev
```

Server: **http://localhost:4000/api/health**

The seed script creates the administrator only if the configured email does not already exist, and inserts three sample course records. **Do not use example secrets or accounts on a public environment.**

### Frontend

In a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Website: **http://localhost:5173**

Vite proxies `/api` to `http://localhost:4000` locally. When deploying frontend and API separately, configure `client/.env` with the public API base origin, e.g. `VITE_API_URL=https://api.bitsteklearning.com` and rebuild the frontend. Set `CLIENT_URL` on backend to allowed frontend origins.

### Production build

```bash
cd client
npm run build
npm run preview
```

The static build output is `client/dist` and should be deployed to a static-capable host configured to route unknown frontend paths back to `index.html`. A Netlify `_redirects` file is included.

## 2. How operations work

1. **Admin** signs in with credentials created by `npm run seed`.
2. Admin creates **instructor** and **student** users in Admin → People, assigning strong temporary passwords.
3. Admin creates a course, assigns an instructor and publishes it on the public website.
4. Admin or assigned instructor adds **modules and YouTube/Google Drive lesson URLs** in Course → Curriculum.
5. Prospective learners submit a course enquiry on the public website.
6. Payment is collected via approved **cash, UPI, bank transfer or other** method. Admin records and verifies it under Manual Payments.
7. Admin approves enrollment for the student and course, optionally attaching the verified payment. Enrollment without a payment is an explicit manual exception (e.g. a complimentary course or scholarship).
8. Admin shares account credentials through a **secure channel**. The application does *not* send credentials by email.
9. Student logs in and accesses only enrolled course videos and tracks lessons marked complete.
10. Instructor creates sessions for assigned courses and adds Google Meet/Zoom links. Students automatically see sessions for their enrolled courses.

## 3. Roles

| Capability | Admin | Assigned instructor | Enrolled student |
|---|---|---|---|
| Create users | ✓ | – | – |
| Create and publish courses | ✓ | – | – |
| Edit course lessons/modules | ✓ | ✓, own assigned | – |
| Record and verify manual payments | ✓ | – | – |
| Approve, pause, revoke enrollment | ✓ | – | – |
| Create/edit/cancel live sessions | ✓ | ✓, own assigned | – |
| See roster | ✓ | ✓, own courses | – |
| Watch private lesson URLs | ✓ via content editor | ✓, own courses | ✓, enrolled |
| Mark progress completed | – | – | ✓, enrolled |

**Corporate role:** authenticates to a branded placeholder portal. Team assignments/reporting are a future phase; do not present these as functional in a client demo.

## 4. File structure

```
bitstek-learning-full/
├── client/
│   ├── src/
│   │   ├── App.jsx                  # all routes
│   │   ├── styles.css               # responsive design system
│   │   ├── pages/public/            # standalone public pages
│   │   ├── pages/admin/             # admin screens
│   │   ├── pages/instructor/        # instructor screens
│   │   ├── pages/student/           # student screens
│   │   ├── components/              # reusable UI, schedule, curriculum editor
│   │   ├── layouts/                 # PublicLayout, PortalLayout
│   │   ├── context/                 # AuthContext
│   │   ├── lib/                     # API adapter + custom hooks
│   │   └── data/                    # website preview fallback content
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── index.js                # Express app
│   │   ├── routes/                 # public/auth/admin/instructor/student
│   │   ├── models/                 # MongoDB schemas
│   │   ├── middleware/             # authentication + role guards
│   │   └── utils/                  # validation helpers
│   ├── scripts/seed.js
│   ├── .env.example
│   └── package.json
├── docs/ARCHITECTURE.md
└── docker-compose.yml
```

## 5. Important routes

### Public

`/` · `/courses` · `/courses/:slug` · `/paths` · `/about` · `/instructors` · `/corporate` · `/blog` · `/blog/:slug` · `/contact` · `/faq` · `/how-it-works` · `/login`

### Admin

`/admin` · `/admin/users` · `/admin/courses` · `/admin/courses/:id` · `/admin/payments` · `/admin/enrollments` · `/admin/schedule` · `/admin/enquiries` · `/admin/content` · `/admin/profile`

### Instructor

`/instructor` · `/instructor/courses` · `/instructor/courses/:id` · `/instructor/schedule` · `/instructor/students` · `/instructor/profile`

### Student

`/student` · `/student/courses` · `/student/courses/:id` · `/student/schedule` · `/student/profile`

## 6. Video providers

- **YouTube:** video URLs such as `https://www.youtube.com/watch?v=...` or `https://youtu.be/...` can be embedded using `youtube-nocookie.com`.
- **Google Drive:** a `https://drive.google.com/file/d/FILE_ID/view` URL can be embedded using `/preview`, but its sharing policy must authorize the viewer. Some provider settings can restrict embeds.
- **Public course API:** only exposes video links marked `isPreview=true`; non-preview URLs are hidden from unauthenticated clients.
- **Private course API:** delivers course video URLs only to enrolled students after authorization.
- **Limitations:** unlisted videos and Drive shared links are **not DRM** and can be copied. For high-value paid content, consider managed video hosting with expiring URLs in a later phase.

## 7. Features implemented in this starter

- Responsive public website with individual React pages and shared components
- Public course catalog + course detail and enquiry forms
- Authenticated role-based navigation
- Admin account creation, enable/disable accounts, password change
- Admin course creation, editing, visibility and instructor assignment
- Admin/assigned instructor adding, editing and removing lesson links and adding modules
- Admin recording and reviewing offline payments
- Admin enrollment management, including exceptions and revocations
- Instructor session creation, rescheduling, cancellation and conflict checks
- Student enrolled-course playback, manual completion progress and upcoming class schedule
- Homepage headline and intro CMS fields
- MongoDB seed with starter courses and admin account

## 8. Production readiness: what still needs work

Before accepting real student data or payments, add **persistent audit trails**, proper monetary accounting in integer minor units, structured payment receipts, transaction reconciliation, automated notification service, a forgot-password process, enhanced credential rotation, server-side session race/concurrency controls, secure admin change logging, adequate backup/restore procedures, comprehensive automated tests, accessibility audits, operational monitoring, security testing, and privacy/terms documentation.

The **corporate portal** is a design placeholder. Certificates, quizzes, assignments, automated emails/WhatsApp delivery, social login, bulk import, rich full-site CMS, and provider-level video protection are **not implemented**.

Do not expose a database port publicly. Store secrets in host environment variables, enforce HTTPS and restrict CORS. Evaluate legal and tax requirements for offline payment records with your accountant.

## 9. Verification status

The code was generated and checked for JavaScript/JSX syntax using Node's syntax checker and TypeScript's JSX parser. Package installation timed out in the execution environment, therefore **a working Vite build, MongoDB connectivity and end-to-end browser flows have NOT been verified**. Run the smoke checklist in `docs/ARCHITECTURE.md` on your machine before production use.

---

# v2 update — refreshed UI and operational features

This version expands the original starter with individual React/Vite pages and the following **source-code implementations**:

- Weekly calendar views across admin, instructor and student schedules; class editing, cancellation and conflict checks remain supported.
- Course or platform-wide announcements with instructor course ownership checks and student enrollment filtering.
- Richer course editor: metadata, category, outcomes, featured/published visibility, modules (add/rename/remove), YouTube/Google Drive lessons (add/update/remove).
- Site settings editor for homepage heading, notice banner, CTA, support email, WhatsApp number and location.
- Administrator password reset, first-login password change enforcement, and JWT version invalidation after changes.
- Reusable responsive components, mobile navigation, reusable page layouts, 3 portal roles and corporate placeholder.
- Dependency-free Node.js unit tests covering video-link allowlist and basic validation.
- `docs/design/` contains the approved image mockups for comparison during frontend work.

**See** `docs/ARCHITECTURE.md` for API endpoints, roles, sequence and pending production work; `docs/DEPLOYMENT.md` for local and host deployment commands.

**Validation run in build workspace:** API JavaScript syntax checks (all server JS files), TypeScript JSX parsing (all client JS/JSX files), local import resolution, and 4 domain unit tests passed. A full dependency install and Vite bundle **could not be run** because the npm registry was not reachable (DNS `EAI_AGAIN`); database integration and browser E2E tests were therefore not performed. These checks are required before deployment.


## v3 reliability and workflow update

See `docs/TROUBLESHOOTING_AND_UPGRADE.md` for 401/500 diagnostics, safe admin password recovery, Nodemon/PM2 restart configuration, one-time credential setup emails, improved calendar, and logo theme preview.

## v5 — Messaging, Materials and Recorded Classes

This build preserves the v4 branded website and existing LMS. New features include course-wide discussion threads, private instructor-to-enrolled-student messages, module PDF/notes/document upload, Google Drive/YouTube recording links, and authenticated MP4/WEBM upload/download/watch. Browse **Instructor / Admin > Messages** and **Course Builder > Course Materials & Recordings**, or **Student > Messages / My Learning**.

For setup, access controls, migration notes, limitations and API routes see **`docs/V5_MESSAGING_AND_RESOURCES.md`**.

**Uploads require persistent filesystem storage** via `PRIVATE_UPLOAD_DIR`. For production video libraries, use S3/object storage and managed streaming instead of ephemeral server disks. Messaging refreshes every 15 seconds, not instant WebSocket push.
#   B i t s t e k - L e a r n i n g  
 