#!/bin/bash
# Jenkins Setup Script for Secure File System
# Run this on your Jenkins server to prepare the environment

set -e

echo "🚀 Setting up Jenkins environment for Secure File System..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Add Jenkins user to Docker group (if running as root, this might not be needed)
if id "jenkins" &>/dev/null; then
    echo "👤 Adding Jenkins user to Docker group..."
    sudo usermod -aG docker jenkins
    echo "✅ Jenkins user added to Docker group"
    echo "🔄 Please restart Jenkins service: sudo systemctl restart jenkins"
fi

# Test Docker access
echo "🧪 Testing Docker access..."
docker run --rm hello-world
echo "✅ Docker is working"

# Test Docker Compose
echo "🧪 Testing Docker Compose..."
docker-compose version
echo "✅ Docker Compose is working"

# Create necessary directories
echo "📁 Creating shared storage directory..."
mkdir -p shared-storage
echo "✅ Shared storage ready"

echo ""
echo "🎉 Jenkins environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart Jenkins if user was added to Docker group"
echo "2. Create a new Pipeline job in Jenkins"
echo "3. Configure the job to use this repository"
echo "4. Set Script Path to: Jenkinsfile"
echo "5. Run the pipeline!"
echo ""
echo "📖 See JENKINS_README.md for detailed instructions"