# Discord OAuth beállítás

1. Menj ide: https://discord.com/developers/applications
2. Hozz létre egy új applicationt, vagy nyisd meg a meglévőt.
3. Az `OAuth2` menüben add hozzá ezt a Redirect URI-t:

```text
http://localhost:3000/auth/discord/callback
```

4. Másold ki az application `Client ID` értékét.
5. Másold ki vagy reseteld a `Client Secret` értékét.
6. Hozz létre egy `.env` fájlt a projekt mappájában:

```env
DISCORD_CLIENT_ID=ide_jon_a_client_id
DISCORD_CLIENT_SECRET=ide_jon_a_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
PORT=3000
```

7. Indítsd a szervert:

```bat
start.bat
```

8. Böngészőben ezt nyisd meg:

```text
http://localhost:3000
```

Ne az `index.html` fájlt nyisd meg közvetlenül, mert a Discord login szerveroldali útvonalakat használ.

## Mit ment a rendszer?

A Discord `identify` scope csak alap profiladatokat ad. A regisztráció ezekből ment a `data/users.json` fájlba:

- Discord ID
- username
- display name
- avatar URL
- regisztráció ideje
- utolsó belépés ideje

Discord access token nem kerül mentésre.
