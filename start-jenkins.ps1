# Jenkins Quick Start Script for Windows PowerShell
# This script helps you start Jenkins using Docker

Write-Host "🚀 Starting Jenkins for Secure File System..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Create Jenkins home directory if it doesn't exist
$jenkinsHome = "C:\jenkins_home"
if (-not (Test-Path $jenkinsHome)) {
    New-Item -ItemType Directory -Path $jenkinsHome | Out-Null
    Write-Host "📁 Created $jenkinsHome directory" -ForegroundColor Blue
}

Write-Host "🐳 Starting Jenkins container..." -ForegroundColor Blue

try {
    docker run -d `
      --name jenkins `
      -p 8080:8080 `
      -p 50000:50000 `
      -v C:\jenkins_home:/var/jenkins_home `
      -v /var/run/docker.sock:/var/run/docker.sock `
      jenkins/jenkins:lts | Out-Null
} catch {
    Write-Host "❌ Failed to start Jenkins container" -ForegroundColor Red
    Write-Host "It might already be running or port 8080 is in use" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try: docker stop jenkins; docker rm jenkins" -ForegroundColor Cyan
    Write-Host "Then run this script again" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Jenkins container started" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Waiting for Jenkins to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🔑 Getting initial admin password..." -ForegroundColor Blue
Write-Host ""

try {
    $password = docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>$null
    if ($password) {
        Write-Host "Initial Admin Password:" -ForegroundColor Green
        Write-Host $password -ForegroundColor White
        Write-Host ""
    } else {
        throw "No password"
    }
} catch {
    Write-Host "⚠️ Could not get password yet. Jenkins might still be starting..." -ForegroundColor Yellow
    Write-Host "Try running this command in a few minutes:" -ForegroundColor Cyan
    Write-Host "docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword" -ForegroundColor White
}

Write-Host ""
Write-Host "🌐 Open your browser and go to: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Use the password shown above to unlock Jenkins" -ForegroundColor White
Write-Host "2. Install suggested plugins" -ForegroundColor White
Write-Host "3. Create admin user" -ForegroundColor White
Write-Host "4. Create a new Pipeline job for your secure-file-system project" -ForegroundColor White
Write-Host ""
Write-Host "📖 See JENKINS_SETUP.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"