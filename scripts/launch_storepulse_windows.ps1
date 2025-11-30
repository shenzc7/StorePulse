[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

# Resolve repo root from /scripts directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Split-Path $scriptDir

Write-Host "🚀 StorePulse Desktop Launcher (Windows)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$pythonExe = Join-Path $repoRoot "api_venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Error "api_venv is missing. Run SETUP_WINDOWS.ps1 or scripts/bootstrap_env.ps1 first."
}

$npmCmd = Get-Command npm -ErrorAction Stop

function Wait-ForUrl {
    param(
        [string]$Url,
        [int]$Seconds = 45,
        [System.Diagnostics.Process]$ProcessToWatch
    )

    for ($i = 1; $i -le $Seconds; $i++) {
        Start-Sleep -Seconds 1
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
            return $true
        } catch {
            if ($ProcessToWatch -and $ProcessToWatch.HasExited) {
                return $false
            }
        }
    }
    return $false
}

function Stop-Safely {
    param([System.Diagnostics.Process[]]$Processes)
    foreach ($p in $Processes) {
        if ($p -and -not $p.HasExited) {
            try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
}

Write-Host "🖥️  Starting backend on http://127.0.0.1:9000 ..." -ForegroundColor Yellow
$env:PYTHONPATH = "$repoRoot;$env:PYTHONPATH"
$backend = Start-Process -FilePath $pythonExe -ArgumentList "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "9000", "--reload" -PassThru -WindowStyle Hidden

if (-not (Wait-ForUrl -Url "http://127.0.0.1:9000/health" -ProcessToWatch $backend)) {
    Stop-Safely @($backend)
    throw "Backend failed to start. See api logs for details."
}
Write-Host "   ✅ Backend ready" -ForegroundColor Green

Write-Host "🌐 Starting Vite dev server on http://127.0.0.1:5173 ..." -ForegroundColor Yellow
Push-Location (Join-Path $repoRoot "src")
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⏳ Installing frontend dependencies..." -ForegroundColor Yellow
    & $npmCmd install
}
$vite = Start-Process -FilePath $npmCmd.Path -ArgumentList "run", "vite-dev", "--", "--host", "localhost", "--port", "5173" -WorkingDirectory (Join-Path $repoRoot "src") -PassThru
Pop-Location

if (-not (Wait-ForUrl -Url "http://127.0.0.1:5173" -ProcessToWatch $vite)) {
    Stop-Safely @($backend, $vite)
    throw "Vite failed to start. Check npm output for details."
}
Write-Host "   ✅ Vite ready" -ForegroundColor Green

Write-Host "🎯 Launching Tauri app (close the app to stop services)..." -ForegroundColor Yellow
$tauri = Start-Process -FilePath $npmCmd.Path -ArgumentList "run", "tauri-dev" -WorkingDirectory (Join-Path $repoRoot "src") -PassThru

try {
    Wait-Process -Id $tauri.Id
} finally {
    Stop-Safely @($vite, $backend)
}

Write-Host "🛑 Tauri closed. Backend and Vite have been stopped." -ForegroundColor Gray
