@echo off
REM Jenkins Quick Start Script for Windows
REM This script helps you start Jenkins using Docker

echo 🚀 Starting Jenkins for Secure File System...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Create Jenkins home directory if it doesn't exist
if not exist "C:\jenkins_home" (
    mkdir C:\jenkins_home
    echo 📁 Created C:\jenkins_home directory
)

echo 🐳 Starting Jenkins container...
docker run -d ^
  --name jenkins ^
  -p 8080:8080 ^
  -p 50000:50000 ^
  -v C:\jenkins_home:/var/jenkins_home ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  jenkins/jenkins:lts

if errorlevel 1 (
    echo ❌ Failed to start Jenkins container
    echo It might already be running or port 8080 is in use
    echo.
    echo Try: docker stop jenkins && docker rm jenkins
    echo Then run this script again
    pause
    exit /b 1
)

echo ✅ Jenkins container started
echo.
echo ⏳ Waiting for Jenkins to initialize...
timeout /t 10 /nobreak >nul

echo 🔑 Getting initial admin password...
echo.
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>nul

if errorlevel 1 (
    echo ⚠️ Could not get password yet. Jenkins might still be starting...
    echo Try again in a few minutes
)

echo.
echo 🌐 Open your browser and go to: http://localhost:8080
echo.
echo 📋 Next steps:
echo 1. Use the password shown above to unlock Jenkins
echo 2. Install suggested plugins
echo 3. Create admin user
echo 4. Create a new Pipeline job for your secure-file-system project
echo.
echo 📖 See JENKINS_SETUP.md for detailed instructions
echo.
echo Press any key to exit...
pause >nul