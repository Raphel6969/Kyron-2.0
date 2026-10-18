# PowerShell script to reset demo state in under 5 seconds
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir

$sw = [System.Diagnostics.Stopwatch]::StartNew()

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " KYRON 2.0 - RESET DEMO STATE (Target: under 5s)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Clean transient sqlite db if present
$dbPath = Join-Path $rootDir "control\app\kyron_dev.db"
if (Test-Path $dbPath) {
    Remove-Item -Force $dbPath
}

# 2. Run Idempotent Seed Script
Write-Host "--> Restoring pristine database state..."
$seedPy = Join-Path $rootDir "scripts\seed.py"
python $seedPy

$sw.Stop()
$elapsedSeconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)

Write-Host "==================================================" -ForegroundColor Green
Write-Host " DEMO STATE RESTORED IN $elapsedSeconds s" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

if ($elapsedSeconds -gt 5.0) {
    Write-Warning "Demo reset exceeded 5 seconds budget ($elapsedSeconds s)"
    exit 1
}

exit 0
