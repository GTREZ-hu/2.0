# Alpár Atlas FiveM bridge

1. Másold ezt a mappát a FiveM szerver `resources` könyvtárába.
2. A `config.lua` fájlban állítsd be a weboldal `/api/live-map` címét és a tokent.
3. A weboldal `.env` fájljában ugyanaz legyen a `LIVE_MAP_TOKEN`.
4. Add a `server.cfg` végéhez: `ensure fivem-atlas-bridge`.
5. OneSync legyen engedélyezve.

Az adatküldés alapból másodpercenként történik. Publikus használatnál HTTPS ajánlott.
Az elfoglalt járművek listája alapból 5 másodpercenként frissül, legfeljebb 300 elemmel. Ezek a korlátok a `config.lua` fájlban módosíthatók.
