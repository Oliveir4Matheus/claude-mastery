const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() { return localStorage.getItem('claude-mastery-token'); }
function setToken(t) { localStorage.setItem('claude-mastery-token', t); }
export function clearToken() { localStorage.removeItem('claude-mastery-token'); }
export function hasToken() { return !!getToken(); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) { clearToken(); throw new Error('AUTH_EXPIRED'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──
export async function apiRegister(name, email, password) {
  const data = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  setToken(data.token);
  return data;
}
export async function apiLogin(email, password) {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  return data;
}
export async function apiMe() { return request('/auth/me'); }
export function apiLogout() { clearToken(); }

// ── Progress ──
export async function apiSaveProgress(chapterId, data) {
  return request(`/progress/${chapterId}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function apiResetChapter(chapterId) {
  return request(`/progress/${chapterId}`, { method: 'DELETE' });
}

// ── Current Page ──
export async function apiSavePage(page) {
  return request('/page', { method: 'PUT', body: JSON.stringify({ page }) });
}

// ── Certificates ──
export async function apiSaveCertificate(cert) {
  return request('/certificates', { method: 'POST', body: JSON.stringify(cert) });
}
export async function apiGetCertificates() { return request('/certificates'); }
export async function apiValidateCertificate(code) {
  const res = await fetch(`${BASE}/validate/${code}`);
  return res.json();
}

// ── SRS ──
export async function apiInitSRS(chapterId, questionCount) {
  return request(`/srs/init/${chapterId}`, { method: 'POST', body: JSON.stringify({ question_count: questionCount }) });
}
export async function apiReviewCard(cardKey, correct) {
  return request(`/srs/review/${cardKey}`, { method: 'PUT', body: JSON.stringify({ correct }) });
}

// ── Challenges ──
export async function apiToggleChallenge(challengeId, completed) {
  return request(`/challenges/${challengeId}`, { method: 'PUT', body: JSON.stringify({ completed }) });
}

// ── Full Sync ──
export async function apiSync() { return request('/sync'); }
