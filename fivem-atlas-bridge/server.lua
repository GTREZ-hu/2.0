local function collectPlayers()
  local result = {}
  for _, source in ipairs(GetPlayers()) do
    local ped = GetPlayerPed(source)
    if ped and ped ~= 0 then
      local c = GetEntityCoords(ped)
      result[#result + 1] = { id = tonumber(source), serverId = tonumber(source), name = GetPlayerName(source), x = c.x, y = c.y, z = c.z, heading = GetEntityHeading(ped), health = GetEntityHealth(ped), ping = GetPlayerPing(source) }
    end
  end
  return result
end

local function collectVehicles()
  local result = {}
  if not Config.IncludeVehicles then return result end
  for _, vehicle in ipairs(GetAllVehicles()) do
    if DoesEntityExist(vehicle) then
      local driver = GetPedInVehicleSeat(vehicle, -1)
      if Config.OnlyOccupiedVehicles and (not driver or driver == 0) then goto continue end
      local c = GetEntityCoords(vehicle)
      result[#result + 1] = { id = NetworkGetNetworkIdFromEntity(vehicle), x = c.x, y = c.y, z = c.z, heading = GetEntityHeading(vehicle), plate = GetVehicleNumberPlateText(vehicle), model = GetEntityModel(vehicle) }
      if #result >= (Config.MaxVehicles or 300) then break end
    end
    ::continue::
  end
  return result
end

CreateThread(function()
  local vehicles = {}
  local lastVehicleUpdate = 0
  local requestInFlight = false
  while true do
    local now = GetGameTimer()
    if now - lastVehicleUpdate >= (Config.VehicleUpdateInterval or 5000) then
      vehicles = collectVehicles()
      lastVehicleUpdate = now
    end
    if not requestInFlight then
      requestInFlight = true
      local payload = json.encode({ players = collectPlayers(), vehicles = vehicles, blips = Config.Blips, server = { online = true, name = GetConvar('sv_hostname', 'Alpar RP'), maxPlayers = GetConvarInt('sv_maxclients', 64) } })
      PerformHttpRequest(Config.Endpoint, function(status)
        requestInFlight = false
        if status < 200 or status >= 300 then print(('[alpar-atlas] HTTP hiba: %s'):format(status)) end
      end, 'POST', payload, { ['Content-Type'] = 'application/json', ['Authorization'] = 'Bearer ' .. Config.Token })
    end
    Wait(math.max(500, Config.UpdateInterval or 1000))
  end
end)
