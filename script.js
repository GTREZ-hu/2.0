const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

const state = {
  route: 'home',
  mapFilter: 'all',
  selectedMapId: 'self',
  waypoint: null,
  chatThread: 'Autópiac',
  chatExtra: [],
  resources: [
    ['ox_inventory', 'started', '2.8% CPU'],
    ['ox_lib', 'started', '0.6% CPU'],
    ['alpar_bridge', 'started', '0.9% CPU'],
    ['pma-voice', 'warn', 'watch'],
    ['demo_racing', 'off', 'stopped'],
  ],
  tickets: [
    ['T-1048', 'Eltűnt jármű', 'Kritikus'],
    ['T-1047', 'Inventory sync', 'Magas'],
    ['T-1044', 'Frakció rang', 'Normál'],
  ],
  logs: [
    ['15:42', 'INFO', 'Player snapshot synchronized'],
    ['15:40', 'WARN', 'ox_inventory query 120ms'],
    ['15:38', 'INFO', 'Restart reminder sent'],
    ['15:35', 'ERROR', 'demo_racing dependency missing'],
  ],
  inventory: [
    ['Ásványvíz', '4x', 'items-images-main/drinks/softdrinks/water.png'],
    ['Rádió', '1x', 'items-images-main/tech/radio/radio.png'],
    ['Lockpick', '2x', 'items-images-main/tools/lockpicks/lockpick.png'],
    ['Telefon', '1x', 'items-images-main/tech/phone/phone.png'],
    ['Medkit', '1x', 'items-images-main/medical/medkits/medkit.png'],
    ['Cash roll', '3x', 'items-images-main/illegal/cashroll.png'],
  ],
  garage: [
    ['Karin Sultan Classic', 'ALP-284', 'Használatban', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=80'],
    ['Bravado Buffalo S', 'RP-512', 'Lefoglalva', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80'],
    ['Annis Elegy Retro', 'LS-909', 'Szerviz alatt', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=700&q=80'],
  ],
  posts: [
    ['Blaine County News', 'Új kereskedő negyed teaser', 'A következő update rövid előzetese linkelt médiával.', 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80', 42],
    ['LSPD Dispatch', 'Paleto körüli fokozott ellenőrzés', 'Kék zóna aktív, kerülőút ajánlott a nyugati part felől.', 'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1000&q=80', 18],
    ['Alpár Crew', 'Éjszakai autós találkozó', 'Fotók és videók a városi meetről.', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80', 73],
  ],
  media: [
    'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
  ],
  listings: [
    ['Annis Elegy Retro Custom', '$89 000', 'Online megvásárolható', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=900&q=80'],
    ['Canis Mesa Offroad', '$42 000', 'Személyes üzlet', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=900&q=80'],
    ['Karin Sultan RS', '$124 000', 'Foglalható', 'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80'],
  ],
  mapEntities: [
    { id: 'self', type: 'player', label: 'Te', status: 'Legion Square', x: 49, y: 48, color: 'var(--red)', glyph: 'P' },
    { id: 'p284', type: 'player', label: 'Játékos 284', status: 'Mozgásban', x: 57, y: 38, color: 'var(--blue)', glyph: 'P' },
    { id: 'p512', type: 'player', label: 'Játékos 512', status: 'Vespucci', x: 34, y: 63, color: 'var(--green)', glyph: 'P' },
    { id: 'lspd', type: 'police', label: 'LSPD zárás', status: '360m zóna', x: 66, y: 52, color: 'var(--blue)', glyph: 'L', radius: 24 },
    { id: 'garage', type: 'garage', label: 'Garázs', status: 'Nyitva', x: 42, y: 41, color: 'var(--amber)', glyph: 'G' },
    { id: 'ems', type: 'ems', label: 'Pillbox EMS', status: 'Ügyelet', x: 55, y: 58, color: 'var(--green)', glyph: '+' },
    { id: 'event', type: 'event', label: 'Utcai találkozó', status: 'Aktív', x: 24, y: 35, color: 'var(--purple)', glyph: 'E', radius: 18 },
  ],
};

state.communityTab = 'forum';
state.forumCategory = 'all';
state.messageFilter = 'all';
state.popupOpen = false;
state.chatThreads = [
  { name: 'Autópiac', avatar: 'AP', preview: 'Az Elegy még eladó?', time: '2p', unread: 2, group: false, online: true },
  { name: 'LSPD központ', avatar: 'PD', preview: 'Járőr egység úton van.', time: '8p', unread: 1, group: true, online: true },
  { name: 'Pillbox EMS', avatar: 'EM', preview: 'Sürgősségi egység: 3 perc.', time: '21p', unread: 0, group: true, online: false },
  { name: 'Alpár Crew', avatar: 'AC', preview: 'Ma este autós találkozó.', time: '1ó', unread: 2, group: true, online: true },
  { name: 'Nagy Roland', avatar: 'NR', preview: 'Küldtem egy helyszínt.', time: '3ó', unread: 0, group: false, online: false },
];

const forumTopics = [
  { id: 1, category: 'official', badge: 'KIEMELT', title: 'Augusztusi fejlesztési napló és szerverfrissítés', excerpt: 'Új munkák, optimalizált inventory és a megújult városi térkép részletei.', author: 'Alpár Staff', avatar: 'AS', replies: 48, views: 1284, last: '4 perce', hot: true },
  { id: 2, category: 'roleplay', badge: 'ROLEPLAY', title: 'Los Santos Customs – tagfelvétel és történetszál', excerpt: 'Aktív szerelőket és karakterközpontú jelentkezőket keresünk az esti műszakba.', author: 'Varga Bence', avatar: 'VB', replies: 31, views: 746, last: '12 perce' },
  { id: 3, category: 'help', badge: 'SEGÍTSÉG', title: 'Kezdő útmutató: az első karaktered és munkád', excerpt: 'Minden fontos lépés a whitelist után, kezdő játékosoknak egy helyen.', author: 'Nagy Roland', avatar: 'NR', replies: 19, views: 932, last: '28 perce' },
  { id: 4, category: 'market', badge: 'PIACTÉR', title: 'Eladó: Annis Elegy Retro Custom – megkímélt', excerpt: 'Friss szerviz, egyedi fényezés és dokumentált előélet. Csere is érdekel.', author: 'Kovács Ákos', avatar: 'KA', replies: 14, views: 408, last: '41 perce' },
  { id: 5, category: 'roleplay', badge: 'ESEMÉNY', title: 'Péntek esti illegális autóstalálkozó', excerpt: 'Helyszín a kezdés előtt IC üzenetben. Fotósokat is várunk.', author: 'Alpár Crew', avatar: 'AC', replies: 67, views: 1540, last: '1 órája', hot: true },
  { id: 6, category: 'official', badge: 'SZABÁLYZAT', title: 'Frissített frakció- és streamszabályzat', excerpt: 'Kérünk minden játékost, hogy belépés előtt olvassa át a változásokat.', author: 'Moderáció', avatar: 'MO', replies: 8, views: 622, last: '2 órája' },
];

let portalState = { server: { online: false, players: 0, maxPlayers: 64, vehicles: 0, nextRestart: '18:00', source: 'standby' }, dispatch: [], community: {} };
function storedInterfaceSettings() { try { const saved = JSON.parse(localStorage.getItem('alpar-interface-settings') || '{}'); return saved.version === 2 ? saved : {}; } catch (_) { return {}; } }
const interfaceSettings = Object.assign({ version: 2, glow: 70, blur: 14, motion: 'full', interactiveGlow: true, popups: true, sounds: false }, storedInterfaceSettings());

function applyInterfaceSettings() {
  document.documentElement.style.setProperty('--user-glow', String(interfaceSettings.glow / 100));
  document.documentElement.style.setProperty('--user-blur', `${interfaceSettings.blur}px`);
  document.body.dataset.motion = interfaceSettings.motion;
  document.body.classList.toggle('no-interactive-glow', !interfaceSettings.interactiveGlow);
  if ($('#settingGlow')) { $('#settingGlow').value = interfaceSettings.glow; $('#settingGlow').nextElementSibling.textContent = `${interfaceSettings.glow}%`; }
  if ($('#settingBlur')) { $('#settingBlur').value = interfaceSettings.blur; $('#settingBlur').nextElementSibling.textContent = `${interfaceSettings.blur}px`; }
  if ($('#settingInteractiveGlow')) $('#settingInteractiveGlow').checked = interfaceSettings.interactiveGlow;
  if ($('#settingPopups')) $('#settingPopups').checked = interfaceSettings.popups;
  if ($('#settingSounds')) $('#settingSounds').checked = interfaceSettings.sounds;
  $$('[data-motion]').forEach(button => button.classList.toggle('active', button.dataset.motion === interfaceSettings.motion));
}

function renderPortal() {
  const server = portalState.server || {};
  if ($('#homePlayers')) $('#homePlayers').textContent = `${server.players || 0}/${server.maxPlayers || 64}`;
  if ($('#homeVehicles')) $('#homeVehicles').textContent = server.vehicles || 0;
  if ($('#homeRestart')) $('#homeRestart').textContent = server.nextRestart || '18:00';
  if ($('#homeBridge')) $('#homeBridge').textContent = server.source === 'fivem-bridge' ? 'LIVE' : 'STANDBY';
  if ($('#dispatchConnection')) $('#dispatchConnection').textContent = server.source === 'fivem-bridge' ? 'FIVEM LIVE' : 'DEMO FEED';
  const filter = $('#dispatchFilter')?.value || 'all';
  const incidents = (portalState.dispatch || []).filter(item => item.status !== 'closed' && (filter === 'all' || item.priority === filter));
  if ($('#dispatchOpenCount')) $('#dispatchOpenCount').textContent = incidents.length;
  const units = [...new Set((portalState.dispatch || []).flatMap(item => item.units || []))];
  if ($('#dispatchUnitCount')) $('#dispatchUnitCount').textContent = units.length;
  if ($('#dispatchList')) $('#dispatchList').innerHTML = incidents.map(item => `<article class="dispatch-card ${item.priority}"><div class="dispatch-code"><b>${escapeHTML(item.code)}</b><small>${item.priority}</small></div><div><span>${escapeHTML(item.service)}</span><h4>${escapeHTML(item.title)}</h4><p>${escapeHTML(item.location)}</p><small>${item.units.length ? `Egységek: ${item.units.map(escapeHTML).join(', ')}` : 'Nincs kiosztott egység'}</small></div><div class="dispatch-actions"><button data-dispatch-action="map" data-dispatch-id="${item.id}">ATLAS</button><button data-dispatch-action="assign" data-dispatch-id="${item.id}">${item.units.length ? 'ERŐSÍTÉS' : 'FELVÉTEL'}</button></div></article>`).join('') || '<div class="dispatch-empty">Nincs a szűrésnek megfelelő aktív hívás.</div>';
  if ($('#dispatchUnits')) $('#dispatchUnits').innerHTML = (units.length ? units : ['ADAM-12', 'MEDIC-3', 'TOW-7']).map((unit, index) => `<div class="dispatch-unit"><i class="${index < units.length ? 'online' : ''}"></i><span><b>${escapeHTML(unit)}</b><small>${index < units.length ? 'Híváson' : 'Elérhető'}</small></span><em>${index < units.length ? 'BUSY' : 'READY'}</em></div>`).join('');
}

async function loadPortal() {
  if (!window.AlparPortalBridge) {
    renderPortal();
    return;
  }
  const bridge = new window.AlparPortalBridge();
  let renderFrame = 0;
  bridge.addEventListener('state', event => {
    portalState = event.detail.state;
    cancelAnimationFrame(renderFrame);
    renderFrame = requestAnimationFrame(renderPortal);
  });
  bridge.addEventListener('status', event => {
    const status = event.detail.status;
    document.body.dataset.bridgeStatus = status;
    if ($('#dispatchConnection') && status !== 'live') {
      $('#dispatchConnection').textContent = ({ connecting: 'KAPCSOLÓDÁS', degraded: 'POLLING', stale: 'ELAVULT', offline: 'OFFLINE', paused: 'SZÜNETEL' })[status] || status.toUpperCase();
    }
  });
  bridge.addEventListener('error', event => console.warn('Portal bridge:', event.detail.error?.message || event.detail.phase));
  window.alparPortalBridge = bridge.start();
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2400);
}
window.showAlparToast = toast;

function navigate(id, options = {}) {
  const previousRoute = state.route;
  const targetView = document.getElementById(id);
  if (!targetView?.classList.contains('view')) return;
  const alreadyVisible = targetView.classList.contains('active') && getComputedStyle(targetView).display !== 'none';
  if (previousRoute === id && alreadyVisible) {
    $('#mainNav')?.classList.remove('open');
    $('#menuBtn')?.setAttribute('aria-expanded', 'false');
    return;
  }
  state.route = id;
  document.body.dataset.currentView = id;
  const transition = $('#fxTransition');
  if (transition && options.animate !== false) {
    $$('.view.is-leaving').forEach(view => view.classList.remove('is-leaving'));
    transition.classList.remove('play');
    document.body.classList.remove('page-reveal');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      transition.classList.add('play');
      document.body.classList.add('page-reveal');
    }));
    clearTimeout(navigate.transitionTimer);
    navigate.transitionTimer = setTimeout(() => {
      transition.classList.remove('play');
      document.body.classList.remove('page-reveal');
      $$('.view.is-leaving').forEach(view => view.classList.remove('is-leaving'));
    }, 520);
  } else if (transition) {
    clearTimeout(navigate.transitionTimer);
    transition.classList.remove('play');
    document.body.classList.remove('page-reveal');
    $$('.view.is-leaving').forEach(view => view.classList.remove('is-leaving'));
  }
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === id));
  $$('[data-route]').forEach((link) => link.classList.toggle('active', link.dataset.route === id));
  $('#mainNav')?.classList.remove('open');
  $('#menuBtn')?.setAttribute('aria-expanded', 'false');
  if (id === 'map') drawMap();
  if (id === 'map') window.dispatchEvent(new CustomEvent('alpar:map-visible'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function render() {
  document.body.dataset.currentView = state.route;
  $('#year').textContent = new Date().getFullYear();
  $('#resourceList').innerHTML = state.resources.map(([name, status, load]) => `<div class="row"><span>${name}<small>${status}</small></span><b class="${status === 'warn' ? 'warn' : status === 'off' ? 'error' : ''}">${load}</b></div>`).join('');
  $('#ticketList').innerHTML = state.tickets.map(([id, title, level]) => `<div class="row"><span>${id}<small>${title}</small></span><b>${level}</b></div>`).join('');
  $('#logList').innerHTML = state.logs.map(([time, level, text]) => `<div class="log-row"><span>${time}</span><b class="${level === 'WARN' ? 'warn' : level === 'ERROR' ? 'error' : ''}">${level}</b><span>${text}</span></div>`).join('');
  $('#inventoryGrid').innerHTML = state.inventory.map(([name, count, image]) => `<button class="item" data-action="${name} kiválasztva"><img src="${image}" alt="${name}"><b>${name}</b><small>${count}</small></button>`).join('');
  $('#garageList').innerHTML = state.garage.map(([name, plate, status, image]) => `<div class="vehicle"><img src="${image}" alt="${name}"><span><b>${name}</b><small>${plate}</small></span><em>${status}</em></div>`).join('');
  $('#postFeed').innerHTML = state.posts.map((post, index) => `<article class="post glass reveal visible"><header><b>${post[0]}</b><h3>${post[1]}</h3><p>${post[2]}</p></header><img src="${post[3]}" alt="${post[1]}" data-open-media="${index}"><footer><button data-action="Like hozzáadva">Like ${post[4]}</button><button data-action="Komment mező megnyitva">Komment</button><button data-action="Megosztás link másolva">Megosztás</button></footer></article>`).join('');
  $('#galleryGrid').innerHTML = state.media.map((src, index) => `<img src="${src}" alt="Alpár RP média ${index + 1}" data-open-gallery="${index}">`).join('');
  $('#marketGrid').innerHTML = state.listings.map((listing) => `<article class="listing glass reveal visible"><img src="${listing[3]}" alt="${listing[0]}"><div><h3>${listing[0]}</h3><p>${listing[2]}</p><span class="price">${listing[1]}</span><button class="btn btn-primary" data-market="${listing[0]}">Érdekel</button></div></article>`).join('');
  renderForum();
  $('#adminGrid').innerHTML = [
    ['Egyenleg módosítás', 'Cash/bank manipuláció demo módban'],
    ['Inventory item', 'Tárgy hozzáadás és törlés előkészítve'],
    ['Garázs kezelés', 'Jármű törlés, lefoglalás, státusz'],
    ['Moderáció', 'Posztok, kommentek, ticketek kezelése'],
    ['Broadcast', 'Szerverközlemény kiküldése'],
    ['Watchdog', 'Resource monitor és automata riasztás'],
  ].map(([title, text]) => `<button class="admin-action glass" data-action="${title} megnyitva"><b>${title}</b><small>${text}</small></button>`).join('');
  renderChat();
  renderMapFilters();
  drawMap();
  renderPortal();
}

function renderChat() {
  const base = {
    'Autópiac': ['Szia! Az Elegy még eladó?', 'Igen, online foglalható, vagy személyesen is megnézheted.'],
    'LSPD központ': ['Bejelentés érkezett a Legion környékéről.', 'Járőr egység úton van.'],
    'Pillbox EMS': ['Pillbox ügyelet aktív.', 'Sürgősségi egység 3 perc.'],
    'Alpár Crew': ['Ma este autós találkozó.', 'Fotók mehetnek az üzenőfalra.'],
  };
  const threads = state.chatThreads.filter(thread => {
    if (state.messageFilter === 'unread') return thread.unread > 0;
    if (state.messageFilter === 'groups') return thread.group;
    return true;
  });
  if ($('#chatThreads')) $('#chatThreads').innerHTML = threads.map(thread => `<button class="message-thread ${state.chatThread === thread.name ? 'active' : ''}" data-thread="${thread.name}"><span class="thread-avatar">${thread.avatar}<i class="${thread.online ? 'online' : ''}"></i></span><span><b>${thread.name}</b><small>${thread.preview}</small></span><em>${thread.time}${thread.unread ? `<strong>${thread.unread}</strong>` : ''}</em></button>`).join('');
  const messages = [...(base[state.chatThread] || []), ...state.chatExtra];
  if ($('#chatBox')) $('#chatBox').innerHTML = messages.map((message, index) => `<div class="message-row ${index % 2 ? 'own' : ''}"><span class="message-avatar">${index % 2 ? 'TE' : (state.chatThreads.find(item => item.name === state.chatThread)?.avatar || 'RP')}</span><p class="bubble">${escapeHTML(message)}<time>${index % 2 ? 'most' : `${9 + index}:2${index}`}</time></p></div>`).join('');
  const active = state.chatThreads.find(thread => thread.name === state.chatThread) || state.chatThreads[0];
  if ($('#conversationHeader')) $('#conversationHeader').innerHTML = `<span class="thread-avatar">${active.avatar}<i class="${active.online ? 'online' : ''}"></i></span><span><b>${active.name}</b><small>${active.online ? 'Most elérhető' : 'Legutóbb ma aktív'}</small></span><div><button data-action="Hanghívás indítása">⌕</button><button data-action="Beszélgetés beállításai">•••</button></div>`;
  if ($('#quickReplies')) $('#quickReplies').innerHTML = ['Rendben, ott leszek!', 'Küldd a helyszínt', '5 perc és érkezem'].map(text => `<button type="button" data-quick-reply="${text}">${text}</button>`).join('');
  if ($('#conversationInfo')) $('#conversationInfo').innerHTML = `<span class="thread-avatar large">${active.avatar}<i class="${active.online ? 'online' : ''}"></i></span><h3>${active.name}</h3><p>${active.group ? 'Közösségi csoport' : 'Alpár RP játékos'}</p><div><button data-action="Közös média megnyitva">▧<span>Közös média</span><b>18</b></button><button data-action="Csatolmányok megnyitva">◇<span>Fájlok</span><b>4</b></button><button data-action="Beszélgetés némítva">◉<span>Értesítések</span><b>Be</b></button></div>`;
  const unread = state.chatThreads.reduce((sum, thread) => sum + thread.unread, 0);
  if ($('#messageUnreadCount')) $('#messageUnreadCount').textContent = String(unread).padStart(2, '0');
  if ($('#messengerFabCount')) {
    $('#messengerFabCount').textContent = unread;
    $('#messengerFabCount').hidden = unread === 0;
  }
  renderPopupChat();
}

function renderPopupChat() {
  const thread = state.chatThreads.find(item => item.name === state.chatThread) || state.chatThreads[0];
  if (!thread || !$('#popupMessageList')) return;
  $('#popupAvatar').childNodes[0].nodeValue = thread.avatar;
  $('#popupAvatar').querySelector('i')?.classList.toggle('online', thread.online);
  $('#popupName').textContent = thread.name;
  $('#popupStatus').textContent = thread.online ? 'Most elérhető' : 'Legutóbb ma aktív';
  const recent = [thread.preview, ...state.chatExtra.slice(-2)];
  $('#popupMessageList').innerHTML = recent.map((message, index) => `<p class="${index ? 'own' : ''}">${escapeHTML(message)}</p>`).join('');
  $('#popupMessageList').scrollTop = $('#popupMessageList').scrollHeight;
}

function setMessengerPopup(open) {
  clearTimeout(setMessengerPopup.hideTimer);
  const popover = $('#messengerPopover');
  state.popupOpen = open;
  $('#messengerFab').setAttribute('aria-expanded', String(open));
  if (open) {
    document.body.classList.add('messenger-open');
    $('#messengerFab').classList.add('is-open');
    popover.hidden = false;
    popover.classList.remove('is-closing');
    popover.classList.remove('is-opening');
    void popover.offsetWidth;
    popover.classList.add('is-opening');
    const thread = state.chatThreads.find(item => item.name === state.chatThread);
    if (thread) thread.unread = 0;
    $('#messageNotification').hidden = true;
    renderChat();
    setTimeout(() => $('#popupChatForm input')?.focus(), 80);
  } else {
    popover.classList.remove('is-opening');
    popover.classList.add('is-closing');
    setMessengerPopup.hideTimer = setTimeout(() => {
      popover.hidden = true;
      popover.classList.remove('is-closing');
      document.body.classList.remove('messenger-open');
      $('#messengerFab').classList.remove('is-open');
      $('#messengerFab')?.focus({ preventScroll: true });
    }, 400);
  }
}

function renderForum() {
  const query = ($('#forumSearch')?.value || '').trim().toLowerCase();
  const topics = forumTopics.filter(topic => (state.forumCategory === 'all' || topic.category === state.forumCategory) && (!query || `${topic.title} ${topic.excerpt} ${topic.author}`.toLowerCase().includes(query)));
  if ($('#forumTopicList')) $('#forumTopicList').innerHTML = topics.map(topic => `<article class="forum-topic glass" data-forum-topic="${topic.id}"><span class="topic-avatar">${topic.avatar}</span><div class="topic-copy"><div><span class="topic-badge ${topic.category}">${topic.badge}</span>${topic.hot ? '<span class="topic-hot">● PÖRGŐS</span>' : ''}</div><h4>${topic.title}</h4><p>${topic.excerpt}</p><small><b>${topic.author}</b> · Utolsó válasz: ${topic.last}</small></div><div class="topic-stats"><span><b>${topic.replies}</b>válasz</span><span><b>${topic.views}</b>megtekintés</span><i>→</i></div></article>`).join('') || '<div class="forum-empty">Nincs a keresésnek megfelelő téma.</div>';
  if ($('#forumActivity')) $('#forumActivity').innerHTML = forumTopics.slice(0, 5).map((topic, index) => `<article><span class="topic-avatar">${topic.avatar}</span><p><b>${topic.author}</b> ${index % 2 ? 'válaszolt egy témában' : 'új bejegyzést tett közzé'}<small>${topic.last}</small></p></article>`).join('');
}

function renderMapFilters() {
  const labels = { all: 'Összes', player: 'Játékos', police: 'Rendőr', garage: 'Garázs', event: 'Event', ems: 'EMS' };
  if ($('#mapFilters')) $('#mapFilters').innerHTML = Object.entries(labels).map(([key, label]) => `<button class="${state.mapFilter === key ? 'active' : ''}" data-map-filter="${key}">${label}</button>`).join('');
}

function visibleMapEntities() {
  return state.mapEntities.filter((entity) => state.mapFilter === 'all' || entity.type === state.mapFilter);
}

function selectedEntity() {
  const visible = visibleMapEntities();
  return visible.find((entity) => entity.id === state.selectedMapId) || visible[0] || state.mapEntities[0];
}

function routePath(target) {
  const start = state.mapEntities[0];
  const midX = (start.x + target.x) / 2;
  const midY = Math.min(start.y, target.y) - 12;
  return `M ${start.x} ${start.y} C ${midX} ${midY}, ${midX + 8} ${target.y + 8}, ${target.x} ${target.y}`;
}

function drawMap() {
  if (window.AlparRoadMap) {
    window.AlparRoadMap.resize();
    return;
  }
  const atlas = $('#atlas');
  if (!atlas) return;
  const entities = visibleMapEntities();
  if (!entities.some((entity) => entity.id === state.selectedMapId)) {
    state.selectedMapId = entities[0]?.id || state.mapEntities[0].id;
    state.waypoint = null;
  }
  const selected = state.waypoint || selectedEntity();
  const zones = entities.filter((entity) => entity.radius).map((entity) => `<span class="zone" style="--x:${entity.x}%;--y:${entity.y}%;--size:${entity.radius}%;--c:${entity.color}"></span>`).join('');
  const blips = entities.map((entity) => `<button class="blip ${entity.id === state.selectedMapId ? 'active' : ''}" data-map-id="${entity.id}" title="${entity.label}" style="--x:${entity.x}%;--y:${entity.y}%;--c:${entity.color}"><span>${entity.glyph}</span></button><span class="label" style="--x:${entity.x}%;--y:${entity.y}%">${entity.label}</span>`).join('');
  const waypoint = state.waypoint ? `<span class="waypoint" style="--x:${state.waypoint.x}%;--y:${state.waypoint.y}%"></span>` : '';
  atlas.innerHTML = `<svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${routePath(selected)}"></path></svg>${zones}${blips}${waypoint}`;
  $('#mapSelected').innerHTML = `<b>${selected.label}</b><small>${selected.status} / X ${selected.x.toFixed(1)} / Y ${selected.y.toFixed(1)}</small>`;
  $('#mapLegend').innerHTML = state.mapEntities.map((entity) => `<button class="legend-row" data-map-id="${entity.id}"><span class="legend-dot" style="--c:${entity.color}"></span><span><b>${entity.label}</b><small>${entity.type} / ${entity.status}</small></span></button>`).join('');
  $('#mapFeed').innerHTML = [
    ['#ff202a', 'Új waypoint', 'Az útvonal a kijelölt pontra rajzolódik.'],
    ['#49a6ff', 'LSPD zóna', 'Rendőrségi lezárás aktív a belvárosban.'],
    ['#2ee66f', 'EMS online', 'Pillbox egység készenlétben.'],
    ['#ffb02e', 'Garázs', 'Legion garázs nyitva.'],
  ].map(([color, title, text]) => `<article class="dispatch-row"><i class="dispatch-dot" style="--c:${color}"></i><span><b>${title}</b><small>${text}</small></span></article>`).join('');
}

function openMedia(src) {
  $('#modalBody').innerHTML = `<img src="${src}" alt="Megnyitott média">`;
  const modal = $('#mediaModal');
  clearTimeout(closeMedia.timer);
  modal.hidden = false;
  modal.classList.remove('is-closing');
  modal.classList.remove('is-opening');
  void modal.offsetWidth;
  modal.classList.add('is-opening');
}

function closeMedia() {
  const modal = $('#mediaModal');
  if (!modal || modal.hidden || modal.classList.contains('is-closing')) return;
  modal.classList.remove('is-opening');
  modal.classList.add('is-closing');
  closeMedia.timer = setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove('is-closing');
    $('#modalBody').innerHTML = '';
  }, 280);
}

async function loadUser() {
  try {
    const response = await fetch('/api/me');
    const data = await response.json();
    if (data.user) {
      $('#profileName').textContent = data.user.globalName || data.user.username;
      $('#profileAvatar').src = data.user.avatarUrl;
      $('#discordLogin').textContent = 'Belépve';
      toast(`Szia, ${data.user.globalName || data.user.username}!`);
    }
  } catch {
    // Static file modeban nincs API, ilyenkor marad a demo profil.
  }
}

document.addEventListener('click', (event) => {
  const communityTab = event.target.closest('[data-community-tab]');
  if (communityTab) {
    state.communityTab = communityTab.dataset.communityTab;
    $$('[data-community-tab]').forEach(button => button.classList.toggle('active', button === communityTab));
    $$('[data-community-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.communityPanel === state.communityTab));
    if (state.communityTab === 'messages') renderChat();
    return;
  }
  const forumCategory = event.target.closest('[data-forum-category]');
  if (forumCategory) {
    state.forumCategory = forumCategory.dataset.forumCategory;
    $$('[data-forum-category]').forEach(button => button.classList.toggle('active', button === forumCategory));
    renderForum();
    return;
  }
  const messageFilter = event.target.closest('[data-message-filter]');
  if (messageFilter) {
    state.messageFilter = messageFilter.dataset.messageFilter;
    $$('[data-message-filter]').forEach(button => button.classList.toggle('active', button === messageFilter));
    renderChat();
    return;
  }
  const quickReply = event.target.closest('[data-quick-reply]');
  if (quickReply) {
    state.chatExtra.push(quickReply.dataset.quickReply);
    renderChat();
    toast('Gyorsválasz elküldve.');
    return;
  }
  const forumTopic = event.target.closest('[data-forum-topic]');
  if (forumTopic) {
    const topic = forumTopics.find(item => item.id === Number(forumTopic.dataset.forumTopic));
    toast(`${topic?.title || 'Téma'} megnyitva.`);
    return;
  }
  const route = event.target.closest('[data-route]');
  if (route) {
    event.preventDefault();
    navigate(route.dataset.route);
    return;
  }
  const action = event.target.closest('[data-action]');
  if (action) {
    toast(action.dataset.action);
    return;
  }
  const dispatchAction = event.target.closest('[data-dispatch-action]');
  if (dispatchAction) {
    const incident = portalState.dispatch.find(item => item.id === dispatchAction.dataset.dispatchId);
    if (!incident) return;
    if (dispatchAction.dataset.dispatchAction === 'map') {
      navigate('map');
      toast(`${incident.location} megnyitva az Atlasban.`);
    } else {
      if (!incident.units.includes('WEB-UNIT')) incident.units.push('WEB-UNIT');
      incident.status = 'active';
      renderPortal();
      toast(`${incident.id}: WEB-UNIT kiosztva demo módban.`);
    }
    return;
  }
  const thread = event.target.closest('[data-thread]');
  if (thread) {
    state.chatThread = thread.dataset.thread;
    const activeThread = state.chatThreads.find(item => item.name === state.chatThread);
    if (activeThread) activeThread.unread = 0;
    renderChat();
    return;
  }
  const market = event.target.closest('[data-market]');
  if (market) {
    state.chatThread = 'Autópiac';
    state.chatExtra.push(`Érdekel ez a hirdetés: ${market.dataset.market}`);
    render();
    navigate('social');
    toast('Autópiac üzenet létrehozva.');
    return;
  }
  const mapFilter = event.target.closest('[data-map-filter]');
  if (mapFilter) {
    state.mapFilter = mapFilter.dataset.mapFilter;
    state.waypoint = null;
    renderMapFilters();
    drawMap();
    return;
  }
  const mapMarker = event.target.closest('[data-map-id]');
  if (mapMarker) {
    state.selectedMapId = mapMarker.dataset.mapId;
    state.waypoint = null;
    drawMap();
    toast(`${selectedEntity().label} kijelölve.`);
    return;
  }
  const media = event.target.closest('[data-open-media], [data-open-gallery]');
  if (media) {
    const index = Number(media.dataset.openMedia ?? media.dataset.openGallery);
    openMedia(media.dataset.openMedia ? state.posts[index][3] : state.media[index]);
  }
});

$('#forumSearch')?.addEventListener('input', renderForum);
$('#messageSearch')?.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  $$('.message-thread').forEach(thread => thread.hidden = !thread.textContent.toLowerCase().includes(query));
});
$('#newTopicButton')?.addEventListener('click', () => toast('Új fórumtéma szerkesztő megnyitva.'));
$('#newMessageButton')?.addEventListener('click', () => toast('Új beszélgetés indítása.'));
$('#dispatchFilter')?.addEventListener('change', renderPortal);
$('#settingGlow')?.addEventListener('input', (event) => { interfaceSettings.glow = Number(event.target.value); applyInterfaceSettings(); });
$('#settingBlur')?.addEventListener('input', (event) => { interfaceSettings.blur = Number(event.target.value); applyInterfaceSettings(); });
$('#settingInteractiveGlow')?.addEventListener('change', (event) => { interfaceSettings.interactiveGlow = event.target.checked; applyInterfaceSettings(); });
$('#settingPopups')?.addEventListener('change', (event) => { interfaceSettings.popups = event.target.checked; });
$('#settingSounds')?.addEventListener('change', (event) => { interfaceSettings.sounds = event.target.checked; });
$('#settingMotion')?.addEventListener('click', (event) => { const button = event.target.closest('[data-motion]'); if (!button) return; interfaceSettings.motion = button.dataset.motion; applyInterfaceSettings(); });
$('#saveSettings')?.addEventListener('click', () => { localStorage.setItem('alpar-interface-settings', JSON.stringify(interfaceSettings)); applyInterfaceSettings(); toast('Interface profil elmentve.'); });
$('#messengerFab')?.addEventListener('click', () => setMessengerPopup(!state.popupOpen));
$('#messengerPopupClose')?.addEventListener('click', () => setMessengerPopup(false));
$('#messageNotification')?.addEventListener('click', () => setMessengerPopup(true));
$('#popupChatForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = event.currentTarget.elements.message;
  const message = input.value.trim();
  if (!message) return;
  state.chatExtra.push(message);
  input.value = '';
  renderChat();
});

$('#atlas')?.addEventListener('click', (event) => {
  if (window.AlparRoadMap) return;
  if (event.target.closest('[data-map-id]')) return;
  const rect = event.currentTarget.getBoundingClientRect();
  state.waypoint = {
    label: 'Egyedi waypoint',
    status: 'Kézi kijelölés',
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
  drawMap();
  toast('Waypoint kijelölve.');
});

$('#chatForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = event.currentTarget.elements.message;
  const message = input.value.trim();
  if (!message) return;
  state.chatExtra.push(message);
  input.value = '';
  renderChat();
  toast('Üzenet elküldve demo módban.');
});

$('#menuBtn')?.setAttribute('aria-expanded', 'false');
$('#menuBtn')?.addEventListener('click', () => {
  const open = $('#mainNav')?.classList.toggle('open') || false;
  $('#menuBtn')?.setAttribute('aria-expanded', String(open));
});
$$('#mainNav [data-route]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const route = link.dataset.route;
    navigate(route);
    if (location.hash !== `#${route}`) history.replaceState(null, '', `#${route}`);
  });
});
$('#modalClose')?.addEventListener('click', closeMedia);
$('#mediaModal')?.addEventListener('click', (event) => {
  if (event.target.id === 'mediaModal') closeMedia();
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (!$('#mediaModal')?.hidden) closeMedia();
  else if (state.popupOpen) setMessengerPopup(false);
  else {
    $('#mainNav')?.classList.remove('open');
    $('#menuBtn')?.setAttribute('aria-expanded', 'false');
  }
});
window.addEventListener('hashchange', () => {
  const route = location.hash.slice(1);
  if (document.getElementById(route)) navigate(route);
});

const PRELOAD_BACKGROUNDS = [
  'Logo.png',
  'assets/images/fivem-city-hero.webp',
  'assets/images/fivem-operations-bg.webp',
  'assets/images/fivem-garage-bg.webp'
];

function decodeImage(image) {
  if (image.complete && image.naturalWidth > 0) {
    return typeof image.decode === 'function' ? image.decode().catch(() => undefined) : Promise.resolve();
  }
  return new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  }).then(() => (typeof image.decode === 'function' ? image.decode().catch(() => undefined) : undefined));
}

function warmImagesInIdle(images) {
  const queue = images.slice();
  const schedule = window.requestIdleCallback
    ? (callback) => requestIdleCallback(callback, { timeout: 700 })
    : (callback) => setTimeout(() => callback({ timeRemaining: () => 8 }), 40);
  const next = (deadline) => {
    if (!queue.length) return;
    const image = queue.shift();
    decodeImage(image).finally(() => schedule(next));
  };
  schedule(next);
}

async function prepareApplication() {
  const startedAt = performance.now();
  document.body.classList.add('app-preparing');

  // A dinamikusan renderelt, normĂˇl oldalak kĂ©pei is bekerĂĽlnek a dekĂłdolĂˇsi sorba.
  // A nagy 3D OBJ szĂˇndĂ©kosan nincs itt: csak a 3D Atlas megnyitĂˇsakor tĂ¶ltĹ‘dik.
  const backgroundImages = PRELOAD_BACKGROUNDS.map((source) => {
    const image = new Image();
    image.src = source;
    return image;
  });
  const pageImages = [...document.images];
  pageImages.forEach((image) => { image.decoding = 'async'; });
  const activeImages = pageImages.filter((image) => image.closest('.view.active') || image.closest('.topbar') || image.closest('.page-loader'));
  const readiness = Promise.allSettled([
    ...backgroundImages.map(decodeImage),
    ...activeImages.map(decodeImage),
    document.fonts?.ready || Promise.resolve()
  ]);
  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 5000));
  const result = await Promise.race([readiness, timeout]);

  // Az elsĹ‘ megnyitĂˇskor minden lap tartalma kĂ©sz ĂˇllapotbĂłl induljon,
  // ne az oldalvĂˇltĂˇs utĂˇn fusson le rajta egy mĂˇsodik halvĂˇnyĂ­tĂˇs.
  $$('.reveal').forEach((element) => element.classList.add('visible'));
  document.body.classList.remove('app-preparing');
  document.body.classList.add('app-ready');
  window.alparPreloadReport = {
    status: result === 'timeout' ? 'timeout' : 'ready',
    images: pageImages.length + backgroundImages.length,
    duration: Math.round(performance.now() - startedAt)
  };
  warmImagesInIdle(pageImages.filter((image) => !activeImages.includes(image)));

  const minimumLoaderTime = Math.max(0, 450 - (performance.now() - startedAt));
  setTimeout(() => $('#pageLoader')?.classList.add('hide'), minimumLoaderTime);
  setTimeout(() => {
    if (interfaceSettings.popups && !state.popupOpen && $('#messageNotification')) {
      $('#messageNotification').hidden = false;
      setTimeout(() => { if ($('#messageNotification')) $('#messageNotification').hidden = true; }, 6500);
    }
  }, 1800);
}

render();
applyInterfaceSettings();
loadPortal();
loadUser();
if (location.hash && document.getElementById(location.hash.slice(1))) navigate(location.hash.slice(1), { animate: false });
prepareApplication();
