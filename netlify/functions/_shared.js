function json(statusCode, body) { return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }; }
function env(name) { const value = process.env[name]; if (!value) { const e = new Error(`Missing Netlify environment variable: ${name}`); e.statusCode = 500; throw e; } return value; }
async function getUser(authHeader) {
  if (!authHeader || !/^Bearer\s+/i.test(authHeader)) { const e = new Error('Please sign in first.'); e.statusCode = 401; throw e; }
  const response = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: authHeader } });
  const user = await response.json();
  if (!response.ok || !user.id) { const e = new Error('Your session is invalid or expired. Please sign in again.'); e.statusCode = 401; throw e; }
  return user;
}
async function supabaseRest(path, method='GET', body, prefer) {
  const headers = { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text(); let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) { const e = new Error(data?.message || data?.hint || `Supabase request failed (${response.status}).`); e.statusCode = 502; throw e; }
  return data;
}
module.exports = { json, getUser, supabaseRest };
