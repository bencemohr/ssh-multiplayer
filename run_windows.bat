@echo off
setlocal enabledelayedexpansion

echo Detecting LAN IP...
for /f "tokens=2 delims=: " %%a in ('ipconfig ^| findstr /C:"IPv4 Address" ^| findstr /V "127.0.0.1"') do (
    set "LAN_IP=%%a"
    goto found
)
echo ERROR: No LAN IP address detected.
exit /b 1

:found
if not defined LAN_IP (
    echo ERROR: Failed to detect LAN IP address.
    exit /b 1
)

:found
set LAN_IP=%LAN_IP: =%

REM Update or add LAN_IP to .env
powershell -Command "(Get-Content .env) -replace '^LAN_IP=.*', 'LAN_IP=%LAN_IP%' | Set-Content .env"
if not findstr /R "^LAN_IP=" .env > nul (
    echo LAN_IP=%LAN_IP% >> .env
)

docker compose up -d --build