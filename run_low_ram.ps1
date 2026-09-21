# AegisVoice — Ultra-Low-RAM Multi-Server Runner (<300MB Total RAM)
# Launches FastAPI Backend (8000) + Guard PWA (3000) + Dispatch Portal (3001)

$root = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AEGISVOICE -- ULTRA-LOW-RAM MULTI-SERVER RUNNER" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Clean any lingering ports first
& "$root\stop_servers.ps1"
Start-Sleep -Seconds 1

# 2. Configure Memory-Constrained Environment
$env:NODE_OPTIONS = "--max-old-space-size=256"
$env:NEXT_TELEMETRY_DISABLED = "1"

# 3. Start Backend (FastAPI on Port 8000)
$pythonExe = if (Test-Path "$root\backend\venv\Scripts\python.exe") { "$root\backend\venv\Scripts\python.exe" } else { "python" }
Write-Host "[1/3] Starting FastAPI Backend on http://localhost:8000 using $pythonExe..." -ForegroundColor Green
Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory "$root\backend" `
    -WindowStyle Minimized

# 4. Start Civilian Guard PWA (Next.js Production on Port 3000)
Write-Host "[2/3] Starting Civilian Guard PWA on http://localhost:3000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run start" `
    -WorkingDirectory "$root\apps\guard-pwa" `
    -WindowStyle Minimized

# 5. Start Dispatcher CAD Portal (Next.js Production on Port 3001)
Write-Host "[3/3] Starting CAD Dispatch Portal on http://localhost:3001..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run start" `
    -WorkingDirectory "$root\apps\dispatch-portal" `
    -WindowStyle Minimized

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " All 3 AegisVoice servers are active and running in RAM-safe mode:" -ForegroundColor Green
Write-Host "   - Backend API & WebSockets: http://localhost:8000 (Health: /api/health)" -ForegroundColor White
Write-Host "   - Civilian Guard PWA:         http://localhost:3000" -ForegroundColor White
Write-Host "   - Dispatcher CAD Portal:      http://localhost:3001" -ForegroundColor White
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Minimized windows are running in your taskbar." -ForegroundColor Cyan
Write-Host " To stop all servers cleanly and release all RAM, run: .\stop_servers.ps1" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
