# Stop all AegisVoice servers cleanly and reclaim RAM immediately

$ports = @(8000, 3000, 3001)
$killedPids = @()

foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                $pidToKill = $c.OwningProcess
                if ($pidToKill -and ($killedPids -notcontains $pidToKill)) {
                    $killedPids += $pidToKill
                    try {
                        $p = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                        if ($p) {
                            Write-Host "Stopping process $($p.ProcessName) (PID: $pidToKill) on port $port..." -ForegroundColor Yellow
                            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                        }
                    } catch {}
                }
            }
        }
    } catch {}
}

if ($killedPids.Count -gt 0) {
    Write-Host "[SUCCESS] All AegisVoice servers stopped. Reclaimed RAM successfully." -ForegroundColor Green
} else {
    Write-Host "[INFO] No active servers found on ports 8000, 3000, or 3001." -ForegroundColor Cyan
}
