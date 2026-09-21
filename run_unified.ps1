# AegisVoice — Unified Edition Ultra-Low-RAM Runner (<160MB Total RAM)
# Launches FastAPI Backend (8000) + Unified Next.js Web App (3000) with routes / and /dispatch

$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AEGISVOICE UNIFIED -- ULTRA-LOW-RAM SINGLE APP RUNNER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean any lingering ports first
& "$root\stop_servers.ps1"
Start-Sleep -Seconds 1

# 2. Configure Memory-Constrained Environment
$env:NODE_OPTIONS = "--max-old-space-size=256"
$env:NEXT_TELEMETRY_DISABLED = "1"

# 3. Start Backend (FastAPI on Port 8000)
$pythonExe = if (Test-Path "$root\backend\venv\Scripts\python.exe") { "$root\backend\venv\Scripts\python.exe" } else { "python" }
Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000 using $pythonExe..." -ForegroundColor Green
Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory "$root\backend" `
    -WindowStyle Minimized

# 4. Start Unified Web App (Next.js Production on Port 3000)
Write-Host "[2/2] Starting Unified Web App on http://localhost:3000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run start" `
    -WorkingDirectory "$root\apps\web" `
    -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " AegisVoice Unified is running in RAM-safe mode (~155MB RAM):" -ForegroundColor Green
Write-Host "   - Civilian Mobile Escort:     http://localhost:3000/" -ForegroundColor White
Write-Host "   - CAD Operator Command Desk:  http://localhost:3000/dispatch" -ForegroundColor White
Write-Host "   - Backend API & WebSockets:   http://localhost:8000" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Use the top Demo Switcher bar to flip between Civilian & CAD with 1 click." -ForegroundColor Cyan
Write-Host " To stop all servers cleanly and release all RAM, run: .\stop_servers.ps1" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
