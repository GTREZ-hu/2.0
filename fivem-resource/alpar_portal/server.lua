local function collectPlayers()
  local result = {}
  for _, source in ipairs(GetPlayers()) do
    local playerId = tonumber(source)
    local ped = GetPlayerPed(playerId)
    if ped and ped ~= 0 then
      local coords = GetEntityCoords(ped)
      result[#result + 1] = {
        id = ('player-%s'):format(source),
        serverId = playerId,
        name = GetPlayerName(source) or ('Player %s'):format(source),
        x = coords.x,
        y = coords.y,
        z = coords.z,
        heading = GetEntityHeading(ped),
        job = Player(source).state.job or Player(source).state.jobName or 'civilian'
      }
    end
  end
  return result
end

local function collectVehicles()
  local result = {}
  for _, vehicle in ipairs(GetAllVehicles()) do
    if DoesEntityExist(vehicle) then
      local coords = GetEntityCoords(vehicle)
      result[#result + 1] = {
        id = ('vehicle-%s'):format(NetworkGetNetworkIdFromEntity(vehicle)),
        netId = NetworkGetNetworkIdFromEntity(vehicle),
        plate = GetVehicleNumberPlateText(vehicle),
        model = tostring(GetEntityModel(vehicle)),
        x = coords.x,
        y = coords.y,
        z = coords.z,
        heading = GetEntityHeading(vehicle)
      }
    end
  end
  return result
end

local function syncPortal()
  if Config.PortalToken == '' or #Config.PortalToken < 24 then
    print('^1[alpar_portal] Missing secure alpar_portal_token convar.^7')
    return
  end

  local payload = json.encode({
    server = { name = Config.ServerName, maxPlayers = Config.MaxPlayers },
    players = collectPlayers(),
    vehicles = collectVehicles(),
    blips = Config.StaticBlips
  })

  PerformHttpRequest(Config.PortalUrl .. '/api/live-map', function(status)
    if status ~= 202 then
      print(('^3[alpar_portal] Sync returned HTTP %s.^7'):format(status))
    end
  end, 'POST', payload, {
    ['Content-Type'] = 'application/json',
    ['Authorization'] = 'Bearer ' .. Config.PortalToken,
    ['X-Bridge-Version'] = '1.0'
  })
end

CreateThread(function()
  while true do
    syncPortal()
    Wait(math.max(Config.SyncInterval, 1000))
  end
end)

