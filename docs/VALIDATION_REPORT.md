# Bitstek Learning v4 — Validation record (2026-10-23)

## Completed locally

- Inspected the supplied stack traces: all repeated 500s shown were caused by `Course.lessonsCount` trying to `.reduce()` a missing `modules` field when a populated Course was projected to `title`.
- Fixed the model getter and added defensive handling of malformed legacy curriculum fields.
- 7 dependency-free Node tests passed: 4 pre-existing video, timezone, and payload validation cases plus 3 new lesson-count helper cases.
- All 53 frontend JavaScript / JSX source files parsed through the locally available TypeScript JSX parser without syntax errors.
- All relative frontend imports resolved to project files.
- Backend JavaScript files passed `node --check`.
- The CSS stylesheet parsed without errors (559 rules) using `tinycss2`.
- Supplied white logo SVG is referenced by the public header, portal sidebar, and footer; supplied branded PNG used for favicon.
- Package ZIP file validated using `unzip -t`.

## Not yet verified (requires dependencies/services)

- Installing client/server packages and running a complete Vite build: npm registry DNS lookup failed with `EAI_AGAIN` in this environment.
- Mongoose-dependent regression tests in `server/tests/course-serialization.test.js` cannot execute without `mongoose` being installed.
- End-to-end CRUD against the user's running MongoDB was not attempted; no user data was changed.
- Sending activation emails was not attempted (SMTP not connected).
- Live Chrome/mobile browser tests and production deployment were not performed.

After `npm install`, run `npm test` in `server`, `npm run build` in `client`, and `npm run smoke` as described in `docs/V4_FIXES_AND_UPGRADE.md`.
