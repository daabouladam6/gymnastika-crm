# Frontend Startup Script
Write-Host "Starting Customer CRM Frontend..." -ForegroundColor Green
Set-Location frontend
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting frontend server on http://localhost:3000" -ForegroundColor Green
    npm run dev
} else {
    Write-Host "Failed to install dependencies. Please check Node.js installation." -ForegroundColor Red
}

