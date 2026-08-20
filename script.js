const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function toast(message) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
}

function navigate(route) {
  if (route !== 'home' && !document.body.classList.contains('is-authenticated')) {
    toast('Ehhez előbb jelentkezz be Discorddal!');
    return;
  }
  if (!document.getElementById(route)?.classList.contains('view')) return;
  $$('.view').forEach(view => view.classList.toggle('active', view.id === route));
  $$('[data-route]').forEach(button => button.classList.toggle('active', button.dataset.route === route));
  $('#mainNav')?.classList.remove('open');
  $('#menuBtn')?.setAttribute('aria-expanded', 'false');
  if (route === 'map') window.dispatchEvent(new CustomEvent('alpar:map-visible'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderServer(state = {}) {
  const server = state.server || {};
  const players = Number(server.players || 0);
  const maxPlayers = Number(server.maxPlayers || 5);
  const connected = server.source === 'fivem-bridge' && Boolean(server.updatedAt);
  $('#homePlayers').textContent = `${players}/${maxPlayers}`;
  $('#homeVehicles').textContent = Number(server.vehicles || 0);
  $('#homeBridge').textContent = connected ? 'LIVE' : 'STANDBY';
  $('#serverName').textContent = server.name || 'Alpár RP';
  $('#serverOnline').textContent = connected ? 'ONLINE' : 'NINCS ÉLŐ ADAT';
  $('#serverOnline').classList.toggle('offline', !connected);
  $('#serverPlayers').textContent = `${players} / ${maxPlayers} játékos`;

  const discordConfigured = Boolean(state.auth?.discordConfigured);
  $$('.discord-status').forEach(node => {
    node.textContent = discordConfigured ? 'ONLINE' : 'BEÁLLÍTÁS SZÜKSÉGES';
    node.classList.toggle('offline', !discordConfigured);
  });
}

async function loadUser() {
  const response = await fetch('/api/me', { cache: 'no-store' });
  if (!response.ok) return;
  const { user } = await response.json();
  if (!user) {
    document.body.classList.remove('is-authenticated');
    return;
  }
  document.body.classList.add('is-authenticated');
  const account = $('#discordLogin');
  account.textContent = user.globalName || user.username;
  account.href = '#';
  account.dataset.loggedIn = 'true';
}

document.addEventListener('click', event => {
  const route = event.target.closest('[data-route]');
  if (route) { event.preventDefault(); navigate(route.dataset.route); return; }
  const account = event.target.closest('#discordLogin[data-logged-in="true"]');
  if (account) {
    event.preventDefault();
    fetch('/api/logout', { method: 'POST' }).finally(() => window.location.reload());
  }
});

$('#menuBtn')?.addEventListener('click', () => {
  const open = $('#mainNav').classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', String(open));
});

$('#year').textContent = new Date().getFullYear();
renderServer();
loadUser().catch(() => {});

if (window.AlparPortalBridge) {
  const bridge = new window.AlparPortalBridge();
  bridge.addEventListener('state', event => renderServer(event.detail.state));
  bridge.addEventListener('status', event => {
    if (event.detail.status === 'offline' || event.detail.status === 'stale') $('#homeBridge').textContent = 'OFFLINE';
  });
  window.alparPortalBridge = bridge.start();
}

const auth = new URLSearchParams(window.location.search).get('auth');
if (auth === 'success') toast('Sikeres Discord-belépés. Üdv az Alpár RP oldalán!');
if (auth === 'missing-discord-config') toast('A Discord-belépés még nincs konfigurálva.');
if (auth === 'invalid-state' || auth === 'discord-error') toast('A Discord-belépés nem sikerült. Próbáld újra!');
if (auth === 'login-required') toast('A kért oldalhoz Discord-belépés szükséges.');

window.addEventListener('load', () => setTimeout(() => $('#pageLoader')?.classList.add('hide'), 250));
