# Alpár Portal bridge

## Felépítés

- A FiveM resource egyetlen tömör snapshotot küld a portalnak.
- A portal validálja és korlátozza a játékos-, jármű- és blipadatokat.
- A böngészők egyetlen `/api/v1/portal/events` SSE-kapcsolaton kapják meg az új állapotot.
- Kapcsolathiba esetén a kliens automatikusan a `/api/v1/portal` snapshot végpontra vált.
- Minden csomag verziószámot kap, ezért egy késve érkező régi csomag nem írhatja felül az új állapotot.

## FiveM telepítés

1. Másold a `fivem-resource/alpar_portal` mappát a szerver `resources` könyvtárába.
2. Adj hozzá legalább 24 karakteres titkos tokent a portal `.env` fájljához:

   `LIVE_MAP_TOKEN=egy_hosszu_veletlen_titkos_token`

3. A FiveM `server.cfg` fájlban:

   `set alpar_portal_url "https://portal.sajatdomain.hu"`

   `set alpar_portal_token "ugyanaz_a_titkos_token"`

   `set alpar_portal_interval "2500"`

   `ensure alpar_portal`

## API contract

- `GET /api/v1/portal` – teljes verziózott állapot.
- `GET /api/v1/portal/events` – valós idejű SSE adatcsatorna.
- `GET /api/live-map` – térképes kompatibilitási snapshot.
- `POST /api/live-map` – FiveM bridge adatfeltöltése Bearer tokennel.
- `POST /api/v1/commands/dispatch/assign` – védett dispatch művelet.
- `POST /api/v1/commands/dispatch/close` – védett dispatch lezárás.

Új modulnál a `portalSnapshot()` kimenetéhez kell hozzáadni az adatot. A böngészőben a `window.alparPortalBridge` `state`, `status` és `error` eseményeire lehet feliratkozni; nincs szükség új EventSource vagy polling ciklus létrehozására.

