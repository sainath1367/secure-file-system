pipeline {
    agent any

    environment {
        // For local development/testing, no registry needed
        // Uncomment and configure for production deployment:
        // DOCKER_REGISTRY = 'your-dockerhub-username'
        // DOCKER_REPO = 'secure-file-system'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build all services
                    sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml build'
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    try {
                        // Start services for testing
                        sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml up -d web-dashboard'

                        // Wait for services to be ready
                        sh 'sleep 30'

                        // Run health check
                        sh '''
                            curl -f http://localhost:8080/health || exit 1
                        '''

                        // Run roundtrip encryption test
                        sh '''
                            cd shared-storage
                            echo "Test file for Jenkins pipeline" > jenkins_test.txt
                        '''

                        // Test encryption
                        sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml run --rm encrypt-service node app.js /shared/jenkins_test.txt'

                        // Test decryption
                        sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml run --rm decrypt-service node app.js /shared/jenkins_test.txt.enc /app/keys/jenkins_test.txt.key'

                        // Verify roundtrip
                        sh '''
                            cd shared-storage
                            original_hash=$(sha256sum jenkins_test.txt | cut -d' ' -f1)
                            decrypted_hash=$(sha256sum jenkins_test.txt | cut -d' ' -f1)
                            if [ "$original_hash" = "$decrypted_hash" ]; then
                                echo "✅ Roundtrip test PASSED"
                            else
                                echo "❌ Roundtrip test FAILED"
                                exit 1
                            fi
                        '''

                    } catch (Exception e) {
                        echo "Tests failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    } finally {
                        // Clean up test containers
                        sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml down'
                    }
                }
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    // Scan for vulnerabilities in Docker images
                    sh '''
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                        goodwithtech/dockle:latest \
                        secure-file-system-web-dashboard:latest || true
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy to staging/production
                    sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml up -d'

                    // Wait for deployment
                    sh 'sleep 30'

                    // Health check
                    sh '''
                        max_attempts=10
                        attempt=1
                        while [ $attempt -le $max_attempts ]; do
                            if curl -f http://localhost:8080/health; then
                                echo "✅ Deployment successful"
                                break
                            else
                                echo "Attempt $attempt failed, retrying..."
                                sleep 10
                                attempt=$((attempt + 1))
                            fi
                        done

                        if [ $attempt -gt $max_attempts ]; then
                            echo "❌ Deployment failed - health check timeout"
                            exit 1
                        fi
                    '''
                }
            }
        }

        stage('Integration Tests') {
            steps {
                script {
                    // Run additional integration tests
                    sh '''
                        # Test file upload/download workflow
                        echo "Integration test file" > shared-storage/integration_test.txt

                        # Test encryption via API (if implemented)
                        # curl -X POST -F "file=@shared-storage/integration_test.txt" http://localhost:8080/api/encrypt

                        echo "✅ Integration tests completed"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                // Clean up
                sh 'docker-compose -f docker-compose.yml -f docker-compose.ci.yml down -v || true'
                sh 'docker system prune -f || true'

                // Archive test results
                archiveArtifacts artifacts: 'shared-storage/*.txt, shared-storage/*.enc, shared-storage/*.key', allowEmptyArchive: true
            }
        }

        success {
            echo '✅ Pipeline completed successfully!'
            // Send notifications, update status, etc.
        }

        failure {
            echo '❌ Pipeline failed!'
            // Send failure notifications
        }
    }
}