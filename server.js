const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = __dirname;
const dataDir = path.join(rootDir, 'data');
const usersFile = path.join(dataDir, 'users.json');

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
  'Referrer-Policy': 'strict-origin-when-cross-origin'
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
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
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
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
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
      redirect(res, '/?auth=success#join', [
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
