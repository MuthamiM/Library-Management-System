/**
 * EZRAlms – Shared Frontend API Client (feature-first)
 */
const BASE_URL = '/api';

function getToken() { return localStorage.getItem('ezr_token'); }
function saveToken(t) { localStorage.setItem('ezr_token', t); }
function clearToken() { localStorage.removeItem('ezr_token'); localStorage.removeItem('ezr_user'); }

async function request(method, path, data) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}),
        },
    };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (res.status === 401) { clearToken(); window.location.href = '/'; return; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
}

export const api = {
    // Auth
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    me: () => request('GET', '/auth/me'),
    seed: () => request('POST', '/auth/seed'),

    // Dashboard
    stats: (period) => request('GET', `/dashboard/stats?period=${period || 'monthly'}`),
    chart: (period, year) => request('GET', `/dashboard/chart?period=${period || 'monthly'}&year=${year || 2023}`),

    // Books
    books: (params) => request('GET', `/books?${new URLSearchParams(params || {})}`),
    book: (id) => request('GET', `/books/${id}`),
    addBook: (data) => request('POST', '/books', data),
    updateBook: (id, data) => request('PUT', `/books/${id}`, data),
    deleteBook: (id) => request('DELETE', `/books/${id}`),

    // Members
    members: (params) => request('GET', `/members?${new URLSearchParams(params || {})}`),
    member: (id) => request('GET', `/members/${id}`),
    memberLoans: (id) => request('GET', `/members/${id}/loans`),
    addMember: (data) => request('POST', '/members', data),
    updateMember: (id, data) => request('PUT', `/members/${id}`, data),
    deleteMember: (id) => request('DELETE', `/members/${id}`),

    // Loans
    loans: (params) => request('GET', `/loans?${new URLSearchParams(params || {})}`),
    loan: (id) => request('GET', `/loans/${id}`),
    overdue: () => request('GET', '/loans/overdue'),
    borrow: (data) => request('POST', '/loans', data),
    returnBook: (id) => request('PUT', `/loans/${id}/return`),
    memberLoanHistory: (mid) => request('GET', `/loans/member/${mid}`),
};

// ── Toast helper ──────────────────────────────────────────────────
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container') || (() => {
        const c = document.createElement('div');
        c.id = 'toast-container';
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    })();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${type === 'success' ? '✓' : '✕'} ${message}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

// ── Modal helpers ─────────────────────────────────────────────────
export function openModal(id) {
    document.getElementById(id).classList.add('open');
}
export function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// ── Auth guard ────────────────────────────────────────────────────
export function requireAuth() {
    if (!getToken()) { window.location.href = '/'; }
}
export function getUser() {
    return JSON.parse(localStorage.getItem('ezr_user') || '{}');
}
export function saveUser(u) {
    localStorage.setItem('ezr_user', JSON.stringify(u));
}
export { getToken, saveToken, clearToken };
