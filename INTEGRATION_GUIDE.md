# Alpár RP user panel integrációs útmutató

Ez a panel jelenleg demo adatokkal működik. A cél az, hogy később a `script.js` demo tömbjeit API hívásokra vagy FiveM/NUI callbackekre lehessen cserélni.

## Általános irány

Jelenlegi működés:

```js
let playerInventory = createRandomInventory();
let playerVehicles = createRandomVehicles();
renderInventory();
renderGarage();
```

Éles működésnél ezek helyett:

```js
const playerInventory = await fetch('/api/player/inventory').then(r => r.json());
const playerVehicles = await fetch('/api/player/vehicles').then(r => r.json());
```

FiveM NUI esetén ugyanez `fetch('https://resource_name/callbackName')` mintával köthető.

## Inventory / ox_inventory

Frontend célpontok:

- `#cashValue`
- `#bankValue`
- `#dirtyValue`
- `#inventoryWeight`
- `#inventorySlots`
- `#inventoryGrid`
- `#itemInspector`

Elvárt adatstruktúra:

```json
{
  "money": {
    "cash": 24850,
    "bank": 186420,
    "dirty": 7300
  },
  "maxWeight": 35,
  "slots": 30,
  "items": [
    {
      "slot": 1,
      "name": "phone",
      "label": "Telefon",
      "count": 1,
      "weight": 0.2,
      "icon": "phone.png vagy emoji",
      "description": "Item leírás"
    }
  ]
}
```

Későbbi ox_inventory kötés:

- szerveroldalon kérd le a játékos inventoryját
- alakítsd át a fenti JSON formára
- a frontend `playerInventory` változóját cseréld API válaszra
- hívd meg: `renderInventory()`

## Garázs rendszer

Frontend célpontok:

- `#vehicleCount`
- `#availableVehicles`
- `#garageGrid`

Elvárt adat:

```json
[
  {
    "model": "Sultan RS",
    "plate": "ALP-204",
    "garage": "Legion Square",
    "fuel": 82,
    "engine": 94,
    "body": 88,
    "status": "Elérhető"
  }
]
```

Későbbi kötés:

- adatforrás: saját garage SQL tábla vagy framework vehicle table
- status lehet: `Elérhető`, `Szervizben`, `Lefoglalva`, `Kint van`
- `Kihozás` gomb később hívhat endpointot: `/api/garage/spawn`

## Hasznalt auto piac

Frontend celpontok:

- `#carMarket`
- `#carAdForm`
- `#carMarketGrid`
- `#marketCount`
- `#marketOnlineCount`

Elvart hirdetes adat:

```json
{
  "id": "car-ad-123",
  "model": "Sultan RS",
  "seller": "Benny Motors",
  "price": 78000,
  "saleMode": "online vagy meet",
  "image": "https://.../kep.jpg",
  "mileage": 42000,
  "condition": "Jo allapot",
  "description": "Leiras, tuning, serulesek, feltetelek"
}
```

Mukodes:

- `saleMode: "online"` eseten online vasarlasi/foglalasi szandek indul
- `saleMode: "meet"` eseten szemelyes talalkozo egyeztetes indul
- a kep jelenleg linkelt kep URL, kesobb feltoltes endpointtal cserelheto
- erdeklodes vagy vasarlas eseten uj messenger beszelgetes jon letre `car-{listingId}` id-val

Backend endpoint irany:

- GET `/api/market/cars`
- POST `/api/market/cars`
- POST `/api/market/cars/:id/contact`
- POST `/api/market/cars/:id/buy`
- DB/JSON mezok: `id`, `ownerIdentifier`, `model`, `plate`, `price`, `saleMode`, `image`, `description`, `status`, `createdAt`

## Messenger

Frontend célpontok:

- `#conversationList`
- `#chatHeader`
- `#chatMessages`
- `#chatCompose`

Elvárt beszélgetés adat:

```json
[
  {
    "id": "staff",
    "name": "Staff Support",
    "role": "Admin",
    "unread": 2,
    "messages": [
      { "from": "them", "text": "Szia!" },
      { "from": "me", "text": "Hello!" }
    ]
  }
]
```

Később:

- GET `/api/messages`
- POST `/api/messages/:conversationId`
- adatbázis: `conversations`, `messages`

## Üzenőfal / Feed

Frontend célpont:

- `#feedGrid`

Elvárt poszt:

```json
{
  "id": "post_123",
  "author": "LSPD",
  "text": "Közlemény szövege",
  "mediaUrl": "https://...",
  "thumbnailUrl": "https://... opcionális videó indexkép",
  "mediaType": "image vagy video",
  "likes": 120,
  "liked": false,
  "shares": 4,
  "comments": 8,
  "commentList": [
    { "author": "Játékos", "text": "Komment szövege" }
  ],
  "time": "12 perce"
}
```

Később:

- GET `/api/feed`
- POST `/api/feed`
- like: POST `/api/feed/:id/like`
- komment: GET/POST `/api/feed/:id/comments`
- megosztás: POST `/api/feed/:id/share`
- képes/videós poszt: `mediaUrl` mezőbe kép, mp4/webm vagy YouTube link
- videó indexkép: `thumbnailUrl` mezőbe saját borítókép URL, YouTube esetén automatikusan a YouTube eredeti thumbnailje jön

Jelenlegi frontend funkciók:

- új poszt létrehozása
- kép link megjelenítése
- YouTube/mp4/webm videó megjelenítése
- képek GLightbox nézőben nyílnak meg
- videók saját RP-stílusú player modalban nyílnak meg, hogy YouTube/mp4 linknél ne ragadjon be a lightbox töltés
- like számláló
- komment panel
- share számláló és clipboard másolás, ha a böngésző engedi

Lightbox markup minta:

```html
<a
  href="https://example.com/image.jpg"
  class="glightbox"
  data-gallery="city-wall"
  data-type="image"
  data-glightbox="title: Poszt címe; description: Poszt szövege">
  <img src="https://example.com/image.jpg" alt="">
</a>
```

Videós posztnál a frontend `.video-popup` linket renderel. A `data-video` lehet YouTube, Vimeo, `.mp4`, `.webm` vagy `.ogg` link; a modal YouTube-nál `youtube-nocookie.com/embed/...`, Vimeo-nál `player.vimeo.com/video/...`, direkt videófájlnál pedig `<video controls>` lejátszót használ.

Indexkép szabály: a frontend nem használ galériaképet videó fallbackként. Először `thumbnailUrl`, utána YouTube saját thumbnail, utána direkt videófájlnál a videó preview elem jelenik meg. Ha egyik sincs, egy semleges "VIDEO / Nincs indexkép" állapot látszik.

Fontos: dashboard/app linket, például `app.fivemanage.com/...` oldalt nem szabad videóként menteni, mert ezek iframe-ben jellemzően blokkolva vannak. Ilyenkor a frontend "nem beágyazható link" állapotot mutat és ad külső megnyitás gombot. Videólejátszáshoz publikus YouTube/Vimeo link vagy közvetlen médiafájl URL kell.

## 3D map rendszer

A jelenlegi map modul a `zerodream_3dmap-main/html/obj/model.obj` es `model.mtl` fajlokat tolti be a `map3d.js` segitsegevel. A korabbi iframe-es map helyett helyi Three.js viewer fut, ezert kesobb sajat jatekos, targy, garazs, frakcio vagy event markerek is rakothetoek.

Frontend celpontok:

- `#map3dStage`
- `#map3dLoader`
- `#map3dProgress`
- `#map3dMarkerCount`
- `#map3dStatus`

Publikus frontend API:

```js
window.Alpar3DMap.addMarker({
  id: 'player-12',
  type: 'player',
  label: 'Jatekos',
  x: 447.12,
  y: -990.86,
  z: 78.16,
  color: '#4fe8ff'
});

window.Alpar3DMap.updateMarker({
  id: 'player-12',
  x: 460.2,
  y: -1001.4,
  z: 78.16
});

window.Alpar3DMap.removeMarker('player-12');
window.Alpar3DMap.focusToWorld({ x: 215.8, y: -810.2, z: 4 });
```

Tomeges adatfrissiteshez:

```js
window.Alpar3DMap.setEntities({
  players: [
    { id: 'player-1', label: 'Admin', x: 0, y: 0, z: 80 }
  ],
  items: [
    { id: 'drop-1', label: 'Drop', x: -51.01, y: -1113.63, z: 56.02 }
  ],
  marks: [
    { id: 'garage-legion', type: 'garage', label: 'Legion Garage', x: 215.8, y: -810.2, z: 80 }
  ],
  zones: [
    { id: 'zone-police', type: 'police-zone', label: 'Lezart terulet', x: 215, y: -810, z: 80, radius: 360 },
    { id: 'zone-investigation', type: 'investigation', shape: 'box', x: 447, y: -990, z: 78, width: 520, depth: 340 }
  ]
});
```

Kijeloles, utvonal es rendorsegi sugar:

```js
window.Alpar3DMap.setSelectedPoint({ x: 447.12, y: -990.86, z: 78.16 }, { radius: 420 });
window.Alpar3DMap.setPoliceZoneRadius(650);
window.Alpar3DMap.clearRoute();
window.Alpar3DMap.getRoadRoute(
  { x: 215, y: -810, z: 80 },
  { x: 1850, y: 3680, z: 85 }
);
```

Az utvonal jelenleg egy konnyu demo road graphon fut. A kijelolt pont es a sajat jatekos pozicio a legkozelebbi road node-ra snapel, ezutan Dijkstra utkereses rajzolja ki az utat. Eles FiveM bekotesnel ezt a demo `roadNodes` / `roadEdges` adatot erdemes GTA/FiveM road node exporttal vagy sajat szerveroldali routing adattal lecserelni.

Jatekos pozicio folyamatos frissitesehez ne minden frame-ben kuldj adatot. 500-1000 ms kozotti frissitesi ritmus eleg, mert a frontend a kis 3D jatekos modelleket kozben simitva mozgatja:

```js
window.Alpar3DMap.updateMarker({
  id: 'player-12',
  type: 'player',
  label: 'Makai Aron',
  x: 461.2,
  y: -1004.8,
  z: 78.16
});
```

Koordinata szabaly:

- FiveM/GTA vilagkoordinata: `{ x, y, z }`
- Three.js pozicio: `{ x, z, -y }`
- Ezt a `map3d.js` automatikusan kezeli a `worldToScene()` es `sceneToWorld()` helperrel.

Esemenyek:

```js
window.addEventListener('alpar3d:hover', event => {
  console.log('Terkep koordinata:', event.detail);
});

window.addEventListener('alpar3d:waypoint', event => {
  console.log('Dupla kattintas waypoint:', event.detail);
});
```

FiveM/NUI bekotesi irany:

```js
window.addEventListener('message', event => {
  if (event.data.type === 'map:entities') {
    window.Alpar3DMap.setEntities(event.data.payload);
  }
});
```

Szerver vagy NUI payload minta:

```json
{
  "type": "map:entities",
  "payload": {
    "players": [
      { "id": "player-12", "label": "Makai Aron", "x": 447.12, "y": -990.86, "z": 78.16 }
    ],
    "items": [
      { "id": "drop-991", "label": "Weapon Drop", "x": -51.01, "y": -1113.63, "z": 56.02 }
    ],
    "marks": [
      { "id": "garage-legion", "type": "garage", "label": "Legion Garage", "x": 215.8, "y": -810.2, "z": 80 }
    ]
  }
}
```

Fontos optimalizalasi megjegyzes: a ZeroDream OBJ es textura csomag nagy meretu, ezert az elso betoltes lassabb lehet. Eles kiadashoz erdemes a modellt GLB/glTF formatumra konvertalni, a texturakat meretezni/tomoriteni, es sok marker eseten batchelt vagy instanced megjelenitest hasznalni.

Aktualis frontend optimalizaciok:

- a viewer csak a `map.html` oldalon tolt be, igy a fooldal gyors marad
- a render loop hatterbe tett tabnal leall, visszatereskor ujraindul
- az egermozgasos raycast animacios frame-re van throttle-olva
- `window.Alpar3DMap.destroy()` felszabaditja a markereket, texturakat, geometriakat, materialokat, listenereket es WebGL renderert
- `window.Alpar3DMap.getStats()` fejleszteshez visszaadja a renderer memoria/render statisztikakat
- sok jatekosnal ne `setEntities()` menjen minden tickben, hanem csak a valtozott markerre `updateMarker()`
- NUI/adatfrissitesnel erdemes 500-1000 ms frissitesi ritmust hasznalni, nem minden kliens frame-ben kuldeni poziciot
- demo modban `randomizeDemo()` uj random jatekosokat, rendorsegi egysegeket, dropokat, garazsokat es lezart teruleteket general
- demo mod megallitasahoz `stopDemo()` hasznalhato
- kor es teglalap alaku lezart teruletekhez `setZones()` hasznalhato, ez olcso WebGL vonalakat rajzol, nem uj texturas markereket

## Galéria

Frontend célpont:

- `#mediaGrid`

Később:

- képfeltöltés endpoint: POST `/api/gallery`
- file storage: `uploads/gallery`
- DB/JSON mezők: `id`, `url`, `author`, `likes`, `createdAt`, `category`

## Karakter panel

Frontend célpontok:

- `#characterSheet`
- `#whitelistBox`
- `#factionBox`

Karakter adat:

```json
{
  "name": "Makai Aron",
  "job": "Civil",
  "faction": "Mechanic",
  "playtime": "42 óra",
  "licenses": ["B kategória"],
  "record": ["Nincs aktív körözés"]
}
```

Később:

- framework adatból jöhet: ESX/QBCore player data
- whitelist státusz jöhet saját JSON/SQL táblából
- faction adat jöhet job/gang/frakció táblából

## Support ticket

Frontend célpontok:

- `#ticketForm`
- `#ticketList`

Elvárt ticket:

```json
{
  "title": "Eltűnt jármű",
  "category": "Bug report",
  "status": "Nyitott",
  "last": "Log ellenőrzés alatt"
}
```

Később:

- GET `/api/tickets`
- POST `/api/tickets`
- PATCH `/api/tickets/:id/status`
- Staff válasz: POST `/api/tickets/:id/replies`

## Telefon mini app

Frontend célpontok:

- `#phoneGrid`
- `#phoneDetail`

Jelenleg demo app lista van:

- SMS
- Bank
- Garázs
- Térkép
- Hirdetések
- Kontaktok

Később minden app külön API-t kaphat, például:

- `/api/phone/sms`
- `/api/player/bank`
- `/api/player/vehicles`
- `/api/ads`
- `/api/contacts`

## Ajánlott következő backend lépés

1. Hozz létre `data/player-demo.json` fájlt.
2. A `server.js` szolgáljon ki endpointokat:
   - `/api/player/inventory`
   - `/api/player/vehicles`
   - `/api/messages`
   - `/api/feed`
   - `/api/tickets`
3. A `script.js` demo tömbjeit cseréld `fetch()` hívásokra.
4. Ha FiveM NUI lesz, ugyanezek az adatok érkezhetnek NUI callbackből.
