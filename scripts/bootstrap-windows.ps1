# Install Node.js if missing (winget), then npm ci — for building from source on a clean Windows PC.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$log = Join-Path $root 'agent-implementation-log.txt'
Add-Content -Path $log -Value "$(Get-Date -Format 'o') bootstrap-windows started"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js not found. Installing Node.js LTS via winget..."
  winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
  $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is still not on PATH. Open a new terminal and run this script again."
  exit 1
}

Write-Host "node $(node -v)"
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Add-Content -Path $log -Value "$(Get-Date -Format 'o') bootstrap-windows npm ci ok"
Write-Host "Done. Next: npm run build:desktop (to create the installer under release\)."
