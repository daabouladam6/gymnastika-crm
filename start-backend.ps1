# Backend Startup Script
Write-Host "Starting Customer CRM Backend..." -ForegroundColor Green
Set-Location backend
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting backend server on http://localhost:3001" -ForegroundColor Green
    npm start
} else {
    Write-Host "Failed to install dependencies. Please check Node.js installation." -ForegroundColor Red
}

