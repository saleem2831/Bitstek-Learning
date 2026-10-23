# Bitstek Learning v4 — Fix report & upgrade guide

## Exact cause of the reported error

The supplied log repeatedly reports `TypeError: Cannot read properties of undefined (reading 'reduce')` at `server/src/models/Course.js:5:67`, in the `lessonsCount` virtual getter.

The `payments`, `enrollments`, `schedule`, `announcements` and `instructor/students` endpoints populate a `Course` with **selected fields** (`.populate('course','title')`). Mongoose serializes the related document and computes schema virtuals; `modules` isn't included in the selected fields, so `this.modules` is `undefined`, and `.reduce()` raises an exception. This does not indicate that the whole server is down. One shared Course model was breaking multiple otherwise independent API responses.

V4 guards `modules` and nested `lessons` in the virtual getter and accepts older null values. Other curriculum traversal paths also guard legacy null arrays.

## Existing database safety

1. Back up your MongoDB database before updating the code.
2. Unzip v4 to a separate folder (the project root is `bitstek-learning-v4`).
3. Copy your current `server/.env` to the new `server/.env`, and any existing `client/.env` to `client/.env`.
4. **Do not rerun the seed script against an existing production database.** The code change does not require a database reset or migration.
5. From `server/`, run `npm install`, `npm test`, then `npm run dev` (Nodemon restarts on source edits). Start `client/` with `npm install` and `npm run dev`.
6. Test `http://localhost:4000/api/health`; the `database` field should be `connected`.
7. Sign in with existing credentials and open Admin > Payments, Enrollments, Schedule, Announcements, and Instructor > My Students. Each should display records or a real empty state rather than error 500.
8. On an active local server, verify create/delete lesson and an instructor's scheduling permission. If issues remain, collect `X-Request-Id` and new server logs.

## Branding

The provided official white SVG/PNG logos are in `client/public/brand/`. Brand.jsx now uses the official full horizontal SVG in the header, sidebar, and footer. The public header is navy so the white logo remains legible. Teal accents echo the supplied logo colors. All existing pages and role workflows remain.

## Existing functionality retained

- Admin role filters, invitation email action (requires SMTP), enrollments, manual payments and course management.
- Module and lesson delete actions with confirmation, instructor scheduling and monthly/weekly calendar.
- Nodemon development restart, production PM2 configuration and `/api/health`.

## Test limits

`npm test` includes a model regression for serialization of a projected course. A live local database, SMTP service and full browser testing cannot be confirmed by static checks alone. No deployed database was accessed or modified.

## Automated read-only API smoke checks

After the server starts and your administrator login is confirmed, set temporary terminal environment variables for the smoke script. In **PowerShell**:

```powershell
$env:SMOKE_ADMIN_EMAIL="admin@yourdomain.com"
$env:SMOKE_ADMIN_PASSWORD="<enter the existing admin password>"
npm run smoke
Remove-Item Env:SMOKE_ADMIN_PASSWORD
```

The script reads payments, enrollments, schedule, announcements, courses and users. It does not modify records. Do not commit credentials to the repository or share them in screenshots.
