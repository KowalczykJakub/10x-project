# Script to run API tests with automatic server start/stop (Windows PowerShell)
# Usage: .\scripts\test-api-with-server.ps1

Write-Host "🚀 Starting API tests with server..." -ForegroundColor Green
Write-Host ""

# Build application
Write-Host "📦 Building application..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "🌐 Starting server on port 3000..." -ForegroundColor Cyan

# Start server in background
$env:PORT = "3000"
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "preview", "--", "--port", "3000" -PassThru -WindowStyle Hidden

# Wait for server to be ready
Write-Host "⏳ Waiting for server to be ready..." -ForegroundColor Yellow
$timeout = 30
$elapsed = 0
$ready = $false

while ($elapsed -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        # Server not ready yet
    }
    Start-Sleep -Seconds 1
    $elapsed++
}

if (-not $ready) {
    Write-Host "❌ Server failed to start within $timeout seconds" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✅ Server is ready!" -ForegroundColor Green
Write-Host ""

# Run tests
Write-Host "🧪 Running API tests..." -ForegroundColor Cyan
try {
    npm run test:api
    $testResult = $LASTEXITCODE
} finally {
    # Stop server
    Write-Host ""
    Write-Host "🛑 Stopping server..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host ""
if ($testResult -eq 0) {
    Write-Host "✅ All tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    exit $testResult
}
