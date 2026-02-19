/**
 * EZRAlms — Shared Sidebar + App Shell
 * Import on every authenticated page to render the navigation.
 *
 * Usage:  import { initShell } from '/js/sidebar.js';
 *         initShell('dashboard');   // highlight active nav item
 */
import { getUser, clearToken, requireAuth } from '/js/api.js';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: dashboardIcon, href: '/dashboard.html' },
  { id: 'loans', label: 'Library loan', icon: loanIcon, href: '/loans.html' },
  { id: 'books', label: 'Books', icon: booksIcon, href: '/books.html' },
  { id: 'members', label: 'Members', icon: membersIcon, href: '/members.html' },
];

const FOOTER_ITEMS = [
  { id: 'help', label: 'help', icon: helpIcon, href: '/help.html' },
  { id: 'settings', label: 'Settings', icon: settingsIcon, href: '/settings.html' },
];

/* ── SVG icon factories ─────────────────────────── */

function dashboardIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
}
function loanIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`;
}
function booksIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>`;
}
function membersIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`;
}
function helpIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
}
function settingsIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.08a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.08a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
}

function logoSVG() {
  return `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="18" fill="#FF6B35"/>
    <path d="M20 22h26a5 5 0 015 5v26a5 5 0 01-5 5H20V22z" fill="white" opacity=".9"/>
    <path d="M46 22h5a5 5 0 015 5v26a5 5 0 01-5 5h-5V22z" fill="white" opacity=".5"/>
    <path d="M28 33h16M28 39h16M28 45h10" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
}

/* ── Build and inject the shell ─────────────────── */

export function initShell(activeId = 'dashboard') {
  requireAuth();
  const user = getUser();

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';
  const profileImg = user.avatar
    ? `<img src="${user.avatar}" alt="avatar">`
    : `<div class="avatar-placeholder md">${initials}</div>`;

  sidebar.innerHTML = `
    <div class="sidebar__logo">${logoSVG()}</div>
    <div class="sidebar__profile">
      ${profileImg}
      <div class="sidebar__profile-info">
        <div class="name">${user.name || 'Librarian'}</div>
        <div class="role">${user.role || 'librarian'}</div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <nav class="sidebar__nav">
      ${NAV_ITEMS.map(n => `
        <a href="${n.href}" class="${n.id === activeId ? 'active' : ''}" id="nav-${n.id}">
          ${n.icon()} ${n.label}
        </a>`).join('')}
    </nav>
    <div class="sidebar__footer">
      ${FOOTER_ITEMS.map(f => `
        <a href="${f.href}" class="${f.id === activeId ? 'active' : ''}" id="nav-${f.id}">
          ${f.icon()} ${f.label}
        </a>`).join('')}
    </div>`;

  // Wrap existing body content in app-shell
  const main = document.createElement('main');
  main.className = 'main';
  while (document.body.firstChild) main.appendChild(document.body.firstChild);

  const shell = document.createElement('div');
  shell.className = 'app-shell';
  shell.appendChild(sidebar);
  shell.appendChild(main);
  document.body.appendChild(shell);

  // Logout
  const logoutLink = document.createElement('a');
  logoutLink.href = '#';
  logoutLink.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout`;
  logoutLink.addEventListener('click', (e) => { e.preventDefault(); clearToken(); window.location.href = '/'; });
  sidebar.querySelector('.sidebar__footer').appendChild(logoutLink);

  // Mobile toggle
  const toggle = document.createElement('button');
  toggle.className = 'btn btn-icon sidebar-toggle';
  toggle.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  toggle.style.cssText = 'position:fixed;top:12px;left:12px;z-index:200;display:none;background:#fff;box-shadow:var(--shadow-sm);border:1px solid var(--border);';
  document.body.appendChild(toggle);
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  if (window.innerWidth <= 768) toggle.style.display = 'flex';
  window.addEventListener('resize', () => { toggle.style.display = window.innerWidth <= 768 ? 'flex' : 'none'; });
}
