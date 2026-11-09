// Tiny API client over fetch — no axios dependency needed for this scope.
// Base URL: VITE_API_URL in production, '' (Vite proxy) in development.
// Auth: access token in Authorization header; on a 401 it tries the refresh
// token once, then gives up and reports the caller to log out.
const API_BASE = import.meta.env.VITE_API_URL || '';

function getTokens() {
  return {
    access: localStorage.getItem('ct_access'),
    refresh: localStorage.getItem('ct_refresh'),
  };
}

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('ct_access', accessToken);
  if (refreshToken) localStorage.setItem('ct_refresh', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('ct_access');
  localStorage.removeItem('ct_refresh');
}

async function refreshAccess() {
  const { refresh } = getTokens();
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  setTokens(data);
  return true;
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const { access } = getTokens();
    if (access) headers.Authorization = `Bearer ${access}`;
  }
  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && auth) {
    // Token may have expired mid-session — refresh once and retry.
    if (await refreshAccess()) {
      const { access } = getTokens();
      if (access) headers.Authorization = `Bearer ${access}`;
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
  me: () => request('/api/auth/me'),
  classes: {
    list: () => request('/api/classes'),
    create: (payload) => request('/api/classes', { method: 'POST', body: payload }),
    remove: (id) => request(`/api/classes/${id}`, { method: 'DELETE' }),
  },
  students: {
    list: (classId) => request(`/api/students?classId=${classId}`),
    create: (payload) => request('/api/students', { method: 'POST', body: payload }),
    importCSV: (classId, csv) => request('/api/students/import', { method: 'POST', body: { classId, csv } }),
    remove: (id) => request(`/api/students/${id}`, { method: 'DELETE' }),
  },
  attendance: {
    getDay: (classId, date) => request(`/api/attendance/${classId}/day?date=${date}`),
    saveDay: (payload) => request('/api/attendance', { method: 'POST', body: payload }),
    register: (classId, month) => request(`/api/attendance/${classId}/register?month=${month}`),
  },
  grades: {
    list: (classId, term) => request(`/api/grades?classId=${classId}${term ? `&term=${encodeURIComponent(term)}` : ''}`),
    save: (payload) => request('/api/grades', { method: 'POST', body: payload }),
  },
};
