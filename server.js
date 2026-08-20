const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const usersFile = path.join(dataDir, 'users.json');
const liveMapClients = new Set();
let liveMapState = { players: [], vehicles: [], blips: [], updatedAt: null, server: { online: false } };
const portalClients = new Set();
const legacyPortalClients = new Set();
let portalVersion = 1;
let dispatchState = [];
const publicFiles = new Set(['/index.html', '/style.css', '/script.js', '/road-map.js', '/Logo.png', '/assets/js/portal-bridge.js']);
const publicPrefixes = ['/assets/'];
const authenticatedFiles = new Set(['/user.html', '/map.html', '/dashboard.js', '/map3d.js']);
const authenticatedPrefixes = ['/zerodream_3dmap-main/'];
const SESSION_TTL = 60 * 60 * 24 * 30 * 1000;
const BRIDGE_STALE_MS = Math.max(15000, Number(process.env.BRIDGE_STALE_MS || 30000));

function loadEnvFile() {
  const envFile = path.join(rootDir, '.env');
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

loadEnvFile();

const port = Number(process.env.PORT || 3000);
const redirectUri = process.env.DISCORD_REDIRECT_URI || `http://localhost:${port}/auth/discord/callback`;

function isBridgeFresh() {
  const updatedAt = Date.parse(liveMapState.updatedAt || '');
  return Number.isFinite(updatedAt) && Date.now() - updatedAt <= BRIDGE_STALE_MS;
}

function isDiscordConfigured() {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET && redirectUri);
}

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.obj': 'model/obj',
  '.mtl': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};
const discordApiBase = 'https://discord.com/api/v10';
const staticHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
const longCacheExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.mp4', '.webm', '.ogg', '.obj', '.mtl']);
const noStoreExtensions = new Set(['.html', '.js', '.css', '.json']);

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({ users: [], sessions: [] }, null, 2));
  }
}

function readStore() {
  ensureDataFile();
  const store = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  store.sessions = (store.sessions || []).filter(session => session.createdAt && Date.now() - Date.parse(session.createdAt) <= SESSION_TTL);
  return store;
}

function writeStore(store) {
  ensureDataFile();
  fs.writeFileSync(usersFile, JSON.stringify(store, null, 2));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...staticHeaders, ...headers });
  res.end(body);
}

function sendJson(res, status, data) {
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readJsonBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    let settled = false;
    req.setEncoding('utf8');
    req.on('data', chunk => {
      if (settled) return;
      body += chunk;
      if (body.length > limit) {
        settled = true;
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (settled) return;
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (_) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function broadcastLiveMap() {
  const message = `event: map\ndata: ${JSON.stringify(liveMapState)}\n\n`;
  liveMapClients.forEach(client => {
    if (client.destroyed || client.writableEnded) liveMapClients.delete(client);
    else client.write(message);
  });
}

function portalSnapshot() {
  const players = liveMapState.players.length;
  const bridgeFresh = isBridgeFresh();
  return {
    server: {
      online: bridgeFresh && Boolean(liveMapState.server?.online),
      name: liveMapState.server?.name || 'Alpár RP',
      players,
      maxPlayers: liveMapState.server?.maxPlayers || 64,
      vehicles: liveMapState.vehicles.length,
      blips: liveMapState.blips.length,
      nextRestart: '18:00',
      latency: liveMapState.server?.latency || null,
      updatedAt: liveMapState.updatedAt,
      source: bridgeFresh ? 'fivem-bridge' : 'standby'
    },
    auth: { discordConfigured: isDiscordConfigured() },
    dispatch: dispatchState,
    community: { online: players, posts: 0, unread: 0, activity: players > 0 ? 100 : 0 }
  };
}

function portalEnvelope() {
  return {
    apiVersion: '1.0',
    version: portalVersion,
    sentAt: new Date().toISOString(),
    capabilities: {
      realtime: true,
      transport: 'sse',
      modules: ['server', 'live-map', 'dispatch', 'community'],
      commands: ['dispatch.assign', 'dispatch.close'],
    },
    data: portalSnapshot(),
  };
}

function broadcastPortal() {
  portalVersion += 1;
  const message = `event: portal\nid: ${portalVersion}\ndata: ${JSON.stringify(portalEnvelope())}\n\n`;
  portalClients.forEach(client => {
    if (client.destroyed || client.writableEnded) portalClients.delete(client);
    else client.write(message);
  });
  const legacyMessage = `event: portal\ndata: ${JSON.stringify(portalSnapshot())}\n\n`;
  legacyPortalClients.forEach(client => {
    if (client.destroyed || client.writableEnded) legacyPortalClients.delete(client);
    else client.write(legacyMessage);
  });
}

function liveMapAuthorized(req) {
  const expected = process.env.LIVE_MAP_TOKEN;
  if (!expected || expected.length < 24) return false;
  const supplied = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers['x-live-map-token'] || '';
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

function cleanText(value, fallback = '', maxLength = 80) {
  return String(value ?? fallback).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
}

function finiteNumber(value, min, max, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function cleanEntity(entity, type, index) {
  const raw = entity && typeof entity === 'object' ? entity : {};
  return {
    id: cleanText(raw.id ?? raw.serverId ?? raw.netId ?? `${type}-${index}`, `${type}-${index}`, 64),
    serverId: raw.serverId == null ? undefined : finiteNumber(raw.serverId, 0, 65535),
    name: cleanText(raw.name, '', 64), label: cleanText(raw.label, '', 80),
    plate: cleanText(raw.plate, '', 16), model: cleanText(raw.model, '', 64),
    job: cleanText(raw.job, '', 48), category: cleanText(raw.category, '', 48),
    x: finiteNumber(raw.x ?? raw.coords?.x ?? raw.position?.x, -10000, 10000),
    y: finiteNumber(raw.y ?? raw.coords?.y ?? raw.position?.y, -10000, 10000),
    z: finiteNumber(raw.z ?? raw.coords?.z ?? raw.position?.z, -2000, 3000),
    heading: finiteNumber(raw.heading, 0, 360),
    color: /^#[0-9a-f]{6}$/i.test(raw.color || '') ? raw.color : undefined
  };
}

function redirect(res, location, cookies = []) {
  const headers = { Location: location };
  if (cookies.length) headers['Set-Cookie'] = cookies;
  send(res, 302, '', headers);
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map(cookie => cookie.trim())
      .filter(Boolean)
      .map(cookie => {
        const index = cookie.indexOf('=');
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
}

function cookie(name, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function basicAuthHeader() {
  const id = process.env.DISCORD_CLIENT_ID || '';
  const secret = process.env.DISCORD_CLIENT_SECRET || '';
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    globalName: user.globalName,
    discriminator: user.discriminator,
    avatarUrl: user.avatarUrl,
    registeredAt: user.registeredAt,
    lastLoginAt: user.lastLoginAt
  };
}

function getSessionUser(req) {
  const token = parseCookies(req).alpar_session;
  if (!token) return null;
  const store = readStore();
  const session = store.sessions.find(item => item.token === token);
  if (!session) return null;
  if (!session.createdAt || Date.now() - Date.parse(session.createdAt) > SESSION_TTL) return null;
  return store.users.find(user => user.id === session.userId) || null;
}

function saveDiscordUser(discordUser) {
  const store = readStore();
  const now = new Date().toISOString();
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=128`
    : `https://cdn.discordapp.com/embed/avatars/${Number(discordUser.discriminator || 0) % 5}.png`;
  const existing = store.users.find(user => user.id === discordUser.id);
  const userData = {
    id: discordUser.id,
    username: discordUser.username,
    globalName: discordUser.global_name || discordUser.username,
    discriminator: discordUser.discriminator,
    avatarUrl,
    registeredAt: existing ? existing.registeredAt : now,
    lastLoginAt: now
  };

  if (existing) Object.assign(existing, userData);
  else store.users.push(userData);

  const token = crypto.randomBytes(32).toString('hex');
  store.sessions = store.sessions.filter(session => session.userId !== discordUser.id);
  store.sessions.push({ token, userId: discordUser.id, createdAt: now });
  writeStore(store);
  return token;
}

async function exchangeDiscordCode(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const tokenResponse = await fetch(`${discordApiBase}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  if (!tokenResponse.ok) {
    throw new Error(`Discord token exchange failed: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  const userResponse = await fetch(`${discordApiBase}/users/@me`, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!userResponse.ok) {
    throw new Error(`Discord user fetch failed: ${userResponse.status}`);
  }

  const user = await userResponse.json();
  revokeDiscordToken(tokenData.access_token).catch(error => {
    console.warn('Discord token revoke failed:', error.message);
  });
  return user;
}

async function revokeDiscordToken(accessToken) {
  if (!accessToken) return;
  const params = new URLSearchParams({
    token: accessToken,
    token_type_hint: 'access_token'
  });
  await fetch(`${discordApiBase}/oauth2/token/revoke`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const requiresLogin = authenticatedFiles.has(requestedPath)
    || authenticatedPrefixes.some(prefix => requestedPath.startsWith(prefix));
  if (requiresLogin && !getSessionUser(req)) {
    redirect(res, '/?auth=login-required');
    return;
  }
  if (!requiresLogin && !publicFiles.has(requestedPath) && !publicPrefixes.some(prefix => requestedPath.startsWith(prefix))) {
    send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }
  const filePath = path.normalize(path.join(rootDir, requestedPath));

  if (!filePath.startsWith(rootDir) || filePath.startsWith(dataDir)) {
    send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const extension = path.extname(filePath);
    const cacheControl = noStoreExtensions.has(extension)
      ? 'no-store'
      : longCacheExtensions.has(extension)
        ? 'public, max-age=86400'
        : 'no-cache';
    send(res, 200, content, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': cacheControl
    });
  });
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'alpar-rp-portal', bridge: isBridgeFresh(), discord: isDiscordConfigured() });
    return;
  }

  if (url.pathname === '/api/live-map' && req.method === 'GET') {
    sendJson(res, 200, liveMapState);
    return;
  }

  if (url.pathname === '/api/live-map/events' && req.method === 'GET') {
    res.writeHead(200, { ...staticHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    res.write(`event: map\ndata: ${JSON.stringify(liveMapState)}\n\n`);
    liveMapClients.add(res);
    const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(': keep-alive\n\n'); }, 15000);
    req.on('close', () => { clearInterval(heartbeat); liveMapClients.delete(res); });
    return;
  }

  if (url.pathname === '/api/live-map' && req.method === 'POST') {
    if (!process.env.LIVE_MAP_TOKEN || process.env.LIVE_MAP_TOKEN.length < 24) { sendJson(res, 503, { ok: false, error: 'LIVE_MAP_TOKEN is not configured securely' }); return; }
    if (!liveMapAuthorized(req)) { sendJson(res, 401, { ok: false, error: 'Unauthorized' }); return; }
    try {
      const payload = await readJsonBody(req);
      liveMapState = {
        players: Array.isArray(payload.players) ? payload.players.slice(0, 512).map((item, index) => cleanEntity(item, 'player', index)) : [],
        vehicles: Array.isArray(payload.vehicles) ? payload.vehicles.slice(0, 1024).map((item, index) => cleanEntity(item, 'vehicle', index)) : [],
        blips: Array.isArray(payload.blips) ? payload.blips.slice(0, 2048).map((item, index) => cleanEntity(item, 'blip', index)) : [],
        updatedAt: new Date().toISOString(),
        server: { online: true, name: cleanText(payload.server?.name, 'Alpár RP', 100), maxPlayers: finiteNumber(payload.server?.maxPlayers, 1, 2048, 64) }
      };
      broadcastLiveMap();
      broadcastPortal();
      sendJson(res, 202, { ok: true, counts: { players: liveMapState.players.length, vehicles: liveMapState.vehicles.length, blips: liveMapState.blips.length } });
    } catch (error) {
      sendJson(res, error.message === 'Payload too large' ? 413 : 400, { ok: false, error: error.message });
    }
    return;
  }

  if (url.pathname === '/api/portal' && req.method === 'GET') {
    sendJson(res, 200, portalSnapshot());
    return;
  }


  if (url.pathname === '/api/v1/portal' && req.method === 'GET') {
    sendJson(res, 200, portalEnvelope());
    return;
  }

  if (url.pathname === '/api/v1/portal/events' && req.method === 'GET') {
    res.writeHead(200, { ...staticHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('retry: 4000\n');
    res.write(`event: portal\nid: ${portalVersion}\ndata: ${JSON.stringify(portalEnvelope())}\n\n`);
    portalClients.add(res);
    const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(`event: heartbeat\ndata: {"version":${portalVersion},"sentAt":"${new Date().toISOString()}"}\n\n`); }, 15000);
    req.on('close', () => { clearInterval(heartbeat); portalClients.delete(res); });
    return;
  }

  if (url.pathname.startsWith('/api/v1/commands/') && req.method === 'POST') {
    if (!liveMapAuthorized(req)) { sendJson(res, 401, { ok: false, error: 'Bridge authorization required' }); return; }
    const parts = url.pathname.split('/').filter(Boolean);
    const moduleName = parts[3];
    const action = parts[4];
    const payload = await readJsonBody(req);
    if (moduleName !== 'dispatch') { sendJson(res, 404, { ok: false, error: 'Unknown command module' }); return; }
    const dispatch = dispatchState.find(item => item.id === cleanText(payload.id, '', 32));
    if (!dispatch) { sendJson(res, 404, { ok: false, error: 'Dispatch not found' }); return; }
    if (action === 'assign') {
      const unit = cleanText(payload.unit, 'FIVEM-UNIT', 32);
      if (!dispatch.units.includes(unit)) dispatch.units.push(unit);
      dispatch.status = 'active';
    } else if (action === 'close') dispatch.status = 'closed';
    else { sendJson(res, 400, { ok: false, error: 'Unknown dispatch action' }); return; }
    broadcastPortal();
    sendJson(res, 200, { ok: true, version: portalVersion, dispatch });
    return;
  }

  if (url.pathname === '/api/portal/events' && req.method === 'GET') {
    res.writeHead(200, { ...staticHeaders, 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
    res.write(`event: portal\ndata: ${JSON.stringify(portalSnapshot())}\n\n`);
    legacyPortalClients.add(res);
    const heartbeat = setInterval(() => { if (!res.writableEnded) res.write(': keep-alive\n\n'); }, 15000);
    req.on('close', () => { clearInterval(heartbeat); legacyPortalClients.delete(res); });
    return;
  }

  if (url.pathname.startsWith('/api/dispatch/') && req.method === 'POST') {
    if (!liveMapAuthorized(req)) { sendJson(res, 401, { ok: false, error: 'Unauthorized' }); return; }
    const parts = url.pathname.split('/').filter(Boolean);
    const dispatch = dispatchState.find(item => item.id === cleanText(parts[2], '', 32));
    if (!dispatch) { sendJson(res, 404, { ok: false, error: 'Dispatch not found' }); return; }
    const action = parts[3];
    if (action === 'assign') {
      const payload = await readJsonBody(req);
      const unit = cleanText(payload.unit, 'WEB-UNIT', 32);
      if (!dispatch.units.includes(unit)) dispatch.units.push(unit);
      dispatch.status = 'active';
    } else if (action === 'close') dispatch.status = 'closed';
    else { sendJson(res, 400, { ok: false, error: 'Unknown action' }); return; }
    broadcastPortal();
    sendJson(res, 200, { ok: true, dispatch });
    return;
  }

  if (url.pathname === '/api/me') {
    sendJson(res, 200, { user: publicUser(getSessionUser(req)) });
    return;
  }

  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const token = parseCookies(req).alpar_session;
    const store = readStore();
    store.sessions = store.sessions.filter(session => session.token !== token);
    writeStore(store);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (url.pathname === '/auth/discord') {
    if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
      redirect(res, '/?auth=missing-discord-config#join');
      return;
    }

    const state = crypto.randomBytes(18).toString('hex');
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state,
      prompt: 'consent'
    });
    redirect(res, `https://discord.com/oauth2/authorize?${params}`, [cookie('alpar_oauth_state', state, 600)]);
    return;
  }

  if (url.pathname === '/auth/discord/callback') {
    const expectedState = parseCookies(req).alpar_oauth_state;
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state || state !== expectedState) {
      redirect(res, '/?auth=invalid-state#join');
      return;
    }

    try {
      const discordUser = await exchangeDiscordCode(code);
      const sessionToken = saveDiscordUser(discordUser);
      redirect(res, '/user.html?auth=success', [
        cookie('alpar_session', sessionToken, 60 * 60 * 24 * 30),
        cookie('alpar_oauth_state', '', 0)
      ]);
    } catch (error) {
      console.error(error);
      redirect(res, '/?auth=discord-error#join');
    }
    return;
  }

  serveStatic(req, res);
}

ensureDataFile();
http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error(error);
    send(res, 500, 'Internal server error', { 'Content-Type': 'text/plain; charset=utf-8' });
  });
}).listen(port, () => {
  console.log(`Alpar RP website running on http://localhost:${port}`);
  console.log(`Discord redirect URI: ${redirectUri}`);
});
