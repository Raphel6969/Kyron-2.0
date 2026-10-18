# PowerShell build script for static multi-platform Kyron binaries
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$distDir = Join-Path $rootDir "dist\bin"

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

$version = "1.0.0"
$commit = $(git rev-parse --short HEAD 2>$null)
if (-not $commit) { $commit = "release" }
$buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")

$ldflags = "-s -w -X main.Version=$version -X main.GitCommit=$commit -X main.BuildDate=$buildDate"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Building Kyron 2.0 Static Binaries (v$version)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Windows amd64 native build
Write-Host "--> Compiling Windows amd64 kyron CLI..."
$env:CGO_ENABLED = "0"
$env:GOOS = "windows"
$env:GOARCH = "amd64"
Set-Location "$rootDir\gateway"
go build -ldflags $ldflags -o "$distDir\kyron.exe" ./cmd/kyron
go build -ldflags $ldflags -o "$distDir\kyron-gateway.exe" ./cmd/gateway

# 2. Linux amd64 cross-compile
Write-Host "--> Cross-compiling Linux amd64 binaries..."
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -ldflags $ldflags -o "$distDir\kyron-linux-amd64" ./cmd/kyron
go build -ldflags $ldflags -o "$distDir\kyron-gateway-linux-amd64" ./cmd/gateway

# 3. Darwin arm64 cross-compile
Write-Host "--> Cross-compiling Darwin arm64 binaries..."
$env:GOOS = "darwin"
$env:GOARCH = "arm64"
go build -ldflags $ldflags -o "$distDir\kyron-darwin-arm64" ./cmd/kyron
go build -ldflags $ldflags -o "$distDir\kyron-gateway-darwin-arm64" ./cmd/gateway

# Reset env
$env:GOOS = ""
$env:GOARCH = ""
Set-Location $rootDir

Write-Host "`n Binaries successfully built in ${distDir}:" -ForegroundColor Green

Get-ChildItem $distDir | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
