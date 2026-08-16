@echo off
setlocal

set "ROOT=%~dp0"
set "APP=%ROOT%angular-app"
set "URL=http://127.0.0.1:4200/"

title Alpar RP Webapp Launcher

echo.
echo ================================
echo   Alpar RP Webapp indito
echo ================================
echo.

if not exist "%APP%" (
  echo [HIBA] Nem talalom az angular-app mappat:
  echo %APP%
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo [HIBA] A Node.js nincs telepitve vagy nincs PATH-ban.
  echo Telepitsd a Node.js LTS verziot, majd probald ujra.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [HIBA] Az npm nincs telepitve vagy nincs PATH-ban.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo [OK] A webapp mar fut: %URL%
  start "" "%URL%"
  exit /b 0
)

cd /d "%APP%"

if not exist "node_modules" (
  echo [INFO] Csomagok telepitese...
  call npm install
  if errorlevel 1 (
    echo [HIBA] npm install sikertelen.
    pause
    exit /b 1
  )
)

if not exist "dist\angular-app\browser\index.html" (
  echo [INFO] Production build keszitese...
  call npm run build
  if errorlevel 1 (
    echo [HIBA] npm run build sikertelen.
    pause
    exit /b 1
  )
)

echo [INFO] Bongeszo megnyitasa par masodperc mulva...
start "Alpar RP Browser Opener" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"

echo [INFO] Szerver inditasa ebben az ablakban...
echo [INFO] Bezarnod csak akkor kell, ha le akarod allitani a webappot.
echo.
node serve-dist.mjs

echo.
echo [INFO] A szerver leallt.
pause
exit /b 0
