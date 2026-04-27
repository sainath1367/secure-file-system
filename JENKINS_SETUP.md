# Jenkins Setup for Secure File System

## Option 1: Docker (Recommended)

### 1. Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop

### 2. Run Jenkins in Docker
```bash
# Create Jenkins home directory
mkdir C:\jenkins_home

# Run Jenkins container
docker run -d \
  --name jenkins \
  -p 8080:8080 \
  -p 50000:50000 \
  -v C:\jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts
```

### 3. Access Jenkins
- Open browser: http://localhost:8080
- Get initial admin password:
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

## Option 2: Windows Installer

### 1. Download Jenkins
- Go to: https://www.jenkins.io/download/
- Download Windows installer (.msi)

### 2. Install Jenkins
- Run the installer
- Follow setup wizard
- Choose default options

### 3. Start Jenkins
- Jenkins will start automatically as a Windows service
- Or start manually: `net start jenkins`

### 4. Access Jenkins
- Open browser: http://localhost:8080
- Follow setup wizard

## Option 3: Jenkins as JAR File

### 1. Install Java
- Download JDK from: https://adoptium.net/
- Install JDK 11 or 17

### 2. Download Jenkins WAR
```bash
# Create directory
mkdir C:\jenkins
cd C:\jenkins

# Download latest Jenkins WAR
curl -L https://get.jenkins.io/war-stable/latest/jenkins.war -o jenkins.war
```

### 3. Start Jenkins
```bash
# Set JENKINS_HOME (optional)
set JENKINS_HOME=C:\jenkins_home

# Start Jenkins
java -jar jenkins.war --httpPort=8080
```

### 4. Access Jenkins
- Open browser: http://localhost:8080

## Initial Jenkins Setup

1. **Get Admin Password** (from console output or file)
2. **Install Suggested Plugins**
3. **Create Admin User**
4. **Configure Jenkins URL** (http://localhost:8080)

## Required Plugins for Your Project

After initial setup, install these plugins:
- **Docker Pipeline** (for Docker commands)
- **Git** (for repository access)
- **Pipeline Utility Steps** (for file operations)

## Create Pipeline Job

1. **New Item** → **Pipeline**
2. **Name**: `secure-file-system`
3. **Pipeline**:
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: `Git`
   - **Repository URL**: `https://github.com/sainath1367/secure-file-system`
   - **Script Path**: `Jenkinsfile`
4. **Save and Build**

## Troubleshooting

### Port 8080 Already in Use
- Your app is running on 8080
- Change Jenkins port: `docker run -p 8081:8080 ...`
- Or stop your app temporarily

### Docker Permission Issues
```bash
# Add user to docker group (if using WSL/Linux)
sudo usermod -aG docker $USER

# Or run Jenkins with privileged access
docker run --privileged -v /var/run/docker.sock:/var/run/docker.sock ...
```

### Java Not Found
- Install JDK and set JAVA_HOME
- Add Java to PATH

### Jenkins Won't Start
- Check logs: `docker logs jenkins`
- Check port conflicts: `netstat -ano | findstr 8080`

## Quick Start (Docker)

```bash
# One-liner to start Jenkins
docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts

# Get password
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# Open browser: http://localhost:8080
```