/* admin.js — FashionVault admin panel.
   IMPORTANT: hiding this page is only a convenience. The real protection is the
   Row Level Security rules in supabase-setup.sql, which the database enforces
   no matter what happens in the browser. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const CFG = window.FASHIONVAULT_CONFIG || {};

  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) {
    $('loginModal').hidden = false;
    $('loginError').textContent = 'Admin is unavailable: backend is not configured or failed to load.';
    $('loginBtn').disabled = true;
    return;
  }

  const db = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  let membersData = [];

  /* ---------- safe DOM helpers (no innerHTML anywhere) ---------- */
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else node.setAttribute(k, v);
    }
    children.forEach(c => c && node.appendChild(c));
    return node;
  }
  function td(content) {
    const cell = document.createElement('td');
    if (content instanceof Node) cell.appendChild(content); else cell.textContent = content;
    return cell;
  }
  function emptyRow(cols, text) {
    const tr = document.createElement('tr');
    const cell = el('td', { class: 'empty', colspan: String(cols), text });
    tr.appendChild(cell);
    return tr;
  }
  function safeUrl(value) {
    try {
      const u = new URL(String(value));
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : null;
    } catch { return null; }
  }
  function formatDate(value) {
    const d = new Date(value);
    return isNaN(d) ? '—' : d.toLocaleDateString();
  }

  /* ---------- session / access control ---------- */
  function showLogin(message) {
    $('dashboard').hidden = true;
    $('loginModal').hidden = false;
    $('loginError').textContent = message || '';
  }

  async function checkAdminSession() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) { showLogin(); return; }

    // The database itself decides what an admin may read; this check just picks the screen.
    const { data: profile, error } = await db
      .from('profiles').select('is_admin').eq('id', session.user.id).maybeSingle();

    if (error || !profile || profile.is_admin !== true) {
      await db.auth.signOut();
      showLogin('Access denied.');
      return;
    }
    $('loginModal').hidden = true;
    $('dashboard').hidden = false;
    startIdleTimer();
    loadDashboardData();
  }

  /* ---------- login with a small client-side cool-down ---------- */
  let failures = 0, lockedUntil = 0;
  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const errDiv = $('loginError');
    const now = Date.now();
    if (now < lockedUntil) {
      errDiv.textContent = `Too many attempts. Try again in ${Math.ceil((lockedUntil - now) / 1000)}s.`;
      return;
    }
    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginPassword').value;
    $('loginBtn').disabled = true;
    errDiv.textContent = 'Signing in...';

    const { error } = await db.auth.signInWithPassword({ email, password });
    $('loginBtn').disabled = false;

    if (error) {
      failures += 1;
      if (failures >= 5) { lockedUntil = Date.now() + 60_000; failures = 0; }
      errDiv.textContent = 'Sign-in failed. Check your details and try again.'; // same message for every failure
      return;
    }
    failures = 0;
    $('loginPassword').value = '';
    errDiv.textContent = '';
    checkAdminSession();
  });

  async function logout() {
    await db.auth.signOut();
    window.location.reload();
  }
  $('logoutBtn').addEventListener('click', logout);

  /* ---------- auto sign-out after 15 minutes of inactivity ---------- */
  let idleTimer;
  function startIdleTimer() {
    const reset = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(logout, 15 * 60 * 1000);
    };
    ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev =>
      window.addEventListener(ev, reset, { passive: true }));
    reset();
  }

  /* ---------- dashboard data ---------- */
  async function loadDashboardData() {
    const { data: profiles } = await db.from('profiles').select('id,name,email,is_admin,created_at');
    membersData = profiles || [];
    renderMembers(membersData);

    $('statTotalUsers').textContent = String(membersData.length);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    $('statNewUsers').textContent = String(membersData.filter(m => new Date(m.created_at).getTime() > weekAgo).length);

    const { count } = await db.from('favorites').select('*', { count: 'exact', head: true });
    $('statFavorites').textContent = String(count || 0);

    renderStores();
  }

  function renderStores() {
    const list = (typeof STORES !== 'undefined' && Array.isArray(STORES)) ? [...STORES] : [];
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    $('statTotalStores').textContent = String(list.length);
    const tbody = $('storesTableBody');
    tbody.replaceChildren();
    if (!list.length) { tbody.appendChild(emptyRow(3, 'No stores found in stores.js')); return; }

    list.forEach(store => {
      const tr = document.createElement('tr');
      tr.appendChild(td(el('strong', { text: String(store.name) })));
      tr.appendChild(td(el('span', { class: 'badge badge-admin', text: String(store.alphabetGroup || '—') })));
      const href = safeUrl(store.url);
      tr.appendChild(td(href
        ? el('a', { href, target: '_blank', rel: 'noopener noreferrer', text: href })
        : document.createTextNode('(invalid URL)')));
      tbody.appendChild(tr);
    });
  }

  function renderMembers(list) {
    const tbody = $('membersTableBody');
    tbody.replaceChildren();
    if (!list.length) { tbody.appendChild(emptyRow(4, 'No members found')); return; }
    list.forEach(m => {
      const tr = document.createElement('tr');
      tr.appendChild(td(m.name || '—'));
      tr.appendChild(td(m.email || '—'));
      tr.appendChild(td(el('span', { class: 'badge ' + (m.is_admin ? 'badge-admin' : 'badge-user'), text: m.is_admin ? 'Admin' : 'User' })));
      tr.appendChild(td(formatDate(m.created_at)));
      tbody.appendChild(tr);
    });
  }

  $('memberSearch').addEventListener('input', () => {
    const q = $('memberSearch').value.toLowerCase();
    renderMembers(membersData.filter(m =>
      (m.name && m.name.toLowerCase().includes(q)) || (m.email && m.email.toLowerCase().includes(q))));
  });

  /* ---------- add-store helper (builds a safe line for stores.js) ---------- */
  const select = $('alphabetGroup');
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => select.appendChild(el('option', { value: l, text: l })));

  $('addStoreForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('storeName').value.trim();
    const group = select.value;
    const url = safeUrl($('storeUrl').value.trim());
    const msg = $('snippetMsg');

    if (!name || name.length > 60 || !url || !url.startsWith('https://')) {
      $('snippetBox').hidden = false;
      $('snippetOut').value = '';
      msg.textContent = 'Please enter a name (max 60 chars) and a valid https:// URL.';
      return;
    }
    const id = 'store-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    // JSON.stringify escapes quotes/backslashes so a crafted name cannot break out of the string
    const line = `  { id: ${JSON.stringify(id)}, name: ${JSON.stringify(name)}, url: ${JSON.stringify(url)}, alphabetGroup: ${JSON.stringify(group)} },`;

    $('snippetOut').value = line;
    $('snippetBox').hidden = false;
    msg.textContent = 'Check the line, then paste it inside the STORES list in stores.js.';
    $('storeName').value = '';
    $('storeUrl').value = '';
  });

  $('copySnippet').addEventListener('click', async () => {
    const box = $('snippetOut');
    try { await navigator.clipboard.writeText(box.value); $('snippetMsg').textContent = 'Copied.'; }
    catch { box.select(); $('snippetMsg').textContent = 'Press Ctrl/Cmd+C to copy.'; }
  });

  checkAdminSession();
})();
