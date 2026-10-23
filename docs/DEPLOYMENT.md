# Deploy Bitstek Learning (React/Vite + MERN)

## Local development

Requires Node.js 20.19+ or 22+, npm, and MongoDB (local or Atlas).

```bash
# Optional local Docker MongoDB (binds only to 127.0.0.1)
docker compose up -d mongo

cd server
cp .env.example .env
# Edit .env to configure MONGODB_URI, JWT_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
npm install
npm run seed
npm run dev
```

In another terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Site: `http://localhost:5173`; API: `http://localhost:4000/api/health`.

## Recommended hosting

- Frontend: static `client/dist` on Netlify, Vercel, Render Static Site, or S3+CloudFront.
- Backend: Node Web Service on Render or AWS at `api.bitsteklearning.com`.
- MongoDB: managed MongoDB Atlas with network restrictions, backups and secrets.
- Website: `bitsteklearning.com` and `www.bitsteklearning.com` with HTTPS.

Frontend build settings:

```text
Root directory: client
Build command: npm install && npm run build
Publish directory: dist
VITE_API_URL=https://api.bitsteklearning.com
```

Backend build settings:

```text
Root directory: server
Build command: npm install
Start command: npm start
Environment:
  PORT=4000                  # or provider-injected port
  MONGODB_URI=<private connection URI>
  JWT_SECRET=<random 32+ characters>
  CLIENT_URL=https://bitsteklearning.com,https://www.bitsteklearning.com
```

Do not commit `.env` or personal data to Git. Seed the first administrator with secure temporary `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` variables, then remove these variables from the live environment. Configure frontend history fallback to `index.html` (Netlify `_redirects` included; for other hosts configure SPA rewrites).

## Before accepting real data

- Add application-level and database-level audit records for payments, enrollment changes, course modifications, and account access.
- Add a durable email/SMS/WhatsApp messaging service with explicit consent and delivery logs; do **not** send raw credentials through untrusted channels.
- Add backup restore drills, error monitoring, throttling, structured logging, privacy policy, terms, and tax-compliant financial records.
- Add database-backed scheduling integration tests and a race-safe overlap control design.
- Verify Drive/YouTube sharing rules, and avoid putting sensitive lesson links in public previews.
