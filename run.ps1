# MCPShield PowerShell Launcher
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "         Starting MCPShield Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Local URL:   http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Docs URL:    http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Public URL:  https://madrid-chamber-opt-poultry.trycloudflare.com" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
