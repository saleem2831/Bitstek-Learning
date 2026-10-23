#!/usr/bin/env node
// Read-only verification of the endpoints affected by v3 course serialization.
// Usage: SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run smoke
// Never prints the provided credentials or full API response bodies.
const base = (process.env.SMOKE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const email = process.env.SMOKE_ADMIN_EMAIL;
const password = process.env.SMOKE_ADMIN_PASSWORD;
if (!email || !password) {
  console.error('Set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD before running the smoke test.');
  process.exit(2);
}
let failed = 0;
async function request(path, token) {
  const response = await fetch(base + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => ({}));
  const id = data.requestId || response.headers.get('X-Request-Id') || '';
  console.log(`${response.ok ? 'PASS' : 'FAIL'} ${response.status} ${path}${id ? ` [${id}]` : ''}`);
  if (!response.ok) failed++;
  return {response,data};
}
try {
  await request('/api/health');
  const response = await fetch(base + '/api/auth/login', {
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password}),signal:AbortSignal.timeout(8000),
  });
  const login = await response.json().catch(() => ({}));
  const token = login.token;
  if (!response.ok || !token) throw new Error(`Login failed (${response.status}): ${login.message || 'check credentials'}`);
  console.log('PASS admin authentication');
  for (const path of ['/api/admin/payments','/api/admin/enrollments','/api/admin/schedule','/api/admin/announcements','/api/admin/courses','/api/admin/users']) {
    await request(path,token);
  }
  console.log(failed ? `${failed} check(s) failed` : 'All read-only admin smoke checks passed');
  process.exitCode=failed?1:0;
} catch (e) {
  console.error('Smoke test stopped:',e.message);
  process.exitCode=1;
}
