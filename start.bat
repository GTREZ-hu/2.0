@echo off
cd /d "%~dp0"
echo Alpár RP weboldal indítása...
echo.
echo Ha Discord logint használsz, töltsd ki előtte a .env fájlt.
echo Weboldal: http://localhost:3000
echo.
start "" "http://localhost:3000"
node server.js
pause
