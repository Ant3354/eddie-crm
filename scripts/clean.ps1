# Clean build cache script
Write-Host "Cleaning build cache..." -ForegroundColor Yellow

if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Deleted .next folder" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .next folder not found" -ForegroundColor Gray
}

if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ Deleted node_modules cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No cache folder found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Clean complete! Run 'npm run dev' to start fresh." -ForegroundColor Green

