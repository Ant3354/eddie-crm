# Back-compat: build + folder only (no zip). Prefer: npm run package:distribution
$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'package-distribution-zip.ps1') -SkipZip
