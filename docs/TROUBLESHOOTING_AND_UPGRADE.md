# Bitstek Learning v3: Fixes & operational runbook

## What changed

- API `/api/health` reports database connectivity. A disconnected MongoDB returns HTTP 503; the backend logs disconnect/reconnect events.
- All API errors include an `X-Request-Id`; 500 responses return an error ID matching an entry in the backend terminal logs.
- Read-only GET requests retry briefly on 502/503/504. User-facing errors have Retry loading actions. Writes are **not** retried automatically, preventing duplicate payments/enrollments.
- Admin People has separate tabs and search for Admins, Students, Instructors and Corporate accounts.
- Admin can send a **password setup email**, never a plaintext password, using an expiring, one-time secure token. SMTP is required and must be configured separately.
- Calendar shows month/week views, class counts, session agenda, Join links for learners and Manage buttons for staff.
- Course Builder already had lesson deletion; the action is more clearly labelled.
- `npm run dev` uses Nodemon for restarts when backend files change or the process crashes. For unattended production, use PM2; Nodemon should not be deployed as a production supervisor.
- The supplied white logo SVG files are in `client/public/brand`. A proposed dark-brand preview lives in `docs/brand-preview/index.html`. The existing site theme is **unchanged** until approved.

## Start services locally

1. Install and run MongoDB, or use the included Compose file: `docker compose up -d mongo`.
2. In `server`, copy `.env.example` to `.env`. Set `MONGODB_URI`, a strong `JWT_SECRET`, `CLIENT_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
3. `cd server && npm install && npm run seed && npm run dev`.
4. In a second terminal: `cd client && npm install && npm run dev`.
5. Visit `http://localhost:4000/api/health`: `ok:true`, `database:"connected"` must be present before using the dashboard.
6. Run `cd server && npm run doctor` to verify collection reads and populated payment/enrollment queries.

## Login returns 401

401 means the API is responding but the email/password check failed. `npm run seed` **does not reset** an existing admin password. Use the configured seeded email/password, or set `ADMIN_RESET_CONFIRM=YES`, `ADMIN_RESET_EMAIL`, `ADMIN_RESET_PASSWORD` in `server/.env` and run `npm run reset:admin`. This will invalidate existing sessions and require a password change after login. Remove the reset env variables after use.

## API payments/enrollments return 500

- Confirm health endpoint returns 200 and database is connected.
- Run `npm run doctor` to verify collection queries.
- Copy `X-Request-Id` (or `requestId` from JSON response), locate the matching structured log in the server console, and inspect the error `name` and stack trace in development.
- Do not delete MongoDB data or reseed as a first troubleshooting step.
- Without access to the actual failing MongoDB dataset and logs, the original 500 cannot be definitively diagnosed. The new error IDs and diagnostic script are designed to identify it.

## Credential emails

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `PUBLIC_APP_URL` in server `.env`, then restart the backend. Admin > People > Send email issues a 24-hour one-time setup URL to the student's/instructor's email. SMTP not configured -> descriptive 503. Send email is not a password reveal. For deliverability configure SPF/DKIM/DMARC for your sender domain. Never commit `.env`.

## Production process restart (Linux)

Install PM2: `npm install -g pm2`, then from the repository root `pm2 start ecosystem.config.cjs && pm2 save && pm2 startup` (execute the suggested startup command with appropriate permissions). Check `pm2 logs bitstek-learning-api` and `pm2 status`.

MongoDB outages will not always crash Node. Mongoose reconnects automatically while API endpoints return 503. PM2 handles real process failures/restarts, not external database availability. Keep MongoDB itself managed with its own service/systemd or Docker restart policy.

## Known limitations

The archive cannot guarantee resolution of dataset-specific 500 responses until the same database and backend logs are available. SMTP emails and browser flows require a real SMTP provider and live integration test. The full npm/Vite build depends on downloading packages; these are not included in the ZIP. Video providers must be shared appropriately and unlisted links are not paid-content DRM.
