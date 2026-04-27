# Jenkins Pipeline for Secure File System

This Jenkinsfile automates the CI/CD pipeline for the secure-file-system project.

## Prerequisites

1. **Jenkins Server** with Docker support
2. **Docker** installed on Jenkins agent
3. **Docker Compose** installed
4. **curl** for health checks

## Pipeline Stages

### 1. Checkout
- Checks out the source code from Git repository

### 2. Build Docker Images
- Builds all Docker images defined in `docker-compose.yml`
- Uses `docker-compose build`

### 3. Run Tests
- Starts the web-dashboard service
- Performs health checks
- Runs roundtrip encryption/decryption tests
- Verifies data integrity with SHA-256 hashes

### 4. Security Scan
- Scans Docker images for vulnerabilities using Dockle
- Reports potential security issues

### 5. Deploy
- Deploys all services using `docker-compose up -d`
- Performs health checks with retry logic
- Ensures services are running correctly

### 6. Integration Tests
- Runs additional integration tests
- Tests file upload/download workflows

## Configuration

### Environment Variables
```groovy
environment {
    // For local development/testing, no registry needed
    // Uncomment and configure for production deployment:
    // DOCKER_REGISTRY = 'your-dockerhub-username'
    // DOCKER_REPO = 'secure-file-system'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
}
```

**Note**: The current pipeline builds and tests images locally. If you want to push images to a registry for multi-environment deployment, uncomment the registry variables and add a push stage.

### Required Jenkins Plugins
- Docker Pipeline
- Git
- Pipeline Utility Steps

## Usage

1. **Create Jenkins Job**:
   - New Item → Pipeline
   - Set Pipeline script from SCM
   - Repository URL: `https://github.com/sainath1367/secure-file-system`
   - Script Path: `Jenkinsfile`

2. **Configure Credentials**:
   - Add GitHub credentials if private repo
   - Add Docker registry credentials if using private registry

3. **Run Pipeline**:
   - Click "Build Now"
   - Monitor console output
   - Check artifacts for test files

## Troubleshooting

### Common Issues

1. **Docker Permission Denied**:
   ```bash
   # Add jenkins user to docker group
   sudo usermod -aG docker jenkins
   sudo systemctl restart jenkins
   ```

2. **Port Conflicts**:
   - Ensure port 8080 is available
   - Or modify docker-compose.yml ports

3. **Test Failures**:
   - Check Docker logs: `docker-compose logs`
   - Verify file permissions in shared-storage

### Health Check Failures
- Increase timeout in health check
- Check application logs for startup errors
- Verify environment variables are set correctly

## Security Considerations

- Never commit secrets to repository
- Use Jenkins credentials for sensitive data
- Scan images regularly for vulnerabilities
- Implement proper access controls

## Monitoring

- Pipeline status visible in Jenkins dashboard
- Test artifacts archived for review
- Logs available in console output
- Notifications can be configured for build status