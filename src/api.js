const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('claude-mastery-token');
}

function setToken(token) {
  localStorage.setItem('claude-mastery-token', token);
}

function clearToken() {
  localStorage.removeItem('claude-mastery-token');
}

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

  if (res.status === 401) {
    clearToken();
    throw new Error('AUTH_EXPIRED');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──
export async function apiRegister(name, email, password) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

export async function apiLogin(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function apiMe() {
  return request('/auth/me');
}

export function apiLogout() {
  clearToken();
}

export function isLoggedIn() {
  return !!getToken();
}

// ── Progress ──
export async function apiGetProgress() {
  return request('/progress');
}

export async function apiSaveProgress(chapterId, data) {
  return request(`/progress/${chapterId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiResetChapter(chapterId) {
  return request(`/progress/${chapterId}`, { method: 'DELETE' });
}

// ── Certificates ──
export async function apiSaveCertificate(cert) {
  return request('/certificates', {
    method: 'POST',
    body: JSON.stringify(cert),
  });
}

export async function apiGetCertificates() {
  return request('/certificates');
}

export async function apiValidateCertificate(code) {
  const res = await fetch(`${BASE}/validate/${code}`);
  return res.json();
}

// ── SRS ──
export async function apiGetDueCards() {
  return request('/srs/due');
}

export async function apiInitSRS(chapterId, questionCount) {
  return request(`/srs/init/${chapterId}`, {
    method: 'POST',
    body: JSON.stringify({ questionCount }),
  });
}

export async function apiReviewCard(cardKey, correct) {
  return request(`/srs/review/${cardKey}`, {
    method: 'PUT',
    body: JSON.stringify({ correct }),
  });
}

export async function apiGetStreak() {
  return request('/srs/streak');
}

// ── Challenges ──
export async function apiToggleChallenge(challengeId, completed) {
  return request(`/challenges/${challengeId}`, {
    method: 'PUT',
    body: JSON.stringify({ completed }),
  });
}

// ── Full sync ──
export async function apiSync() {
  return request('/sync');
}
