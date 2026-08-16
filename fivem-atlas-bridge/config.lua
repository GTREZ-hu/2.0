Config = {}
Config.Endpoint = 'http://127.0.0.1:3000/api/live-map'
Config.Token = 'change-this-to-a-long-random-secret'
Config.UpdateInterval = 1000
Config.IncludeVehicles = true
Config.VehicleUpdateInterval = 5000
Config.MaxVehicles = 300
Config.OnlyOccupiedVehicles = true
Config.Blips = {
  { id = 'lspd', label = 'Mission Row LSPD', sprite = 60, color = '#49a6ff', x = 441.2, y = -981.9, z = 30.7, category = 'police' },
  { id = 'pillbox', label = 'Pillbox Medical', sprite = 61, color = '#ff4d56', x = 307.2, y = -595.3, z = 43.3, category = 'medical' }
}
