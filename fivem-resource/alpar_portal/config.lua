Config = {}
Config.PortalUrl = GetConvar('alpar_portal_url', 'http://127.0.0.1:3000')
Config.PortalToken = GetConvar('alpar_portal_token', '')
Config.SyncInterval = tonumber(GetConvar('alpar_portal_interval', '2500')) or 2500
Config.ServerName = GetConvar('sv_hostname', 'Alpar RP')
Config.MaxPlayers = GetConvarInt('sv_maxclients', 64)
Config.StaticBlips = {}

