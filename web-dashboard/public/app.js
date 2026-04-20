// ==================== GLOBAL APP STATE ====================
const App = {
    user: null,
    token: null,
    theme: localStorage.getItem('theme') || 'light-mode',
    currentPage: 'login',
    pendingKey: null,
    pendingKeyFilename: null,

    init() {
        try {
            this.setupTheme();
            this.checkAuth();
            this.setupEventListeners();
            console.log('✅ App initialized successfully');
        } catch (e) {
            console.error('❌ App initialization failed:', e);
        }
    },

    setupTheme() {
        document.documentElement.className = this.theme;
    },

    checkAuth() {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const user = params.get('user');

        if (token && user) {
            this.token = token;
            this.user = JSON.parse(decodeURIComponent(user));
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(this.user));
            window.history.replaceState({}, document.title, '/');
            this.render();
        } else {
            this.token = localStorage.getItem('token');
            this.user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
            this.render();
        }
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) this.toggleTheme();
            if (e.target.closest('.nav-link')) this.navigate(e.target.closest('.nav-link').dataset.page);
            if (e.target.closest('.logout-btn')) this.logout();
            if (e.target.closest('.user-menu')) this.navigate('profile');
        });
    },

    toggleTheme() {
        this.theme = this.theme === 'light-mode' ? 'dark-mode' : 'light-mode';
        localStorage.setItem('theme', this.theme);
        this.setupTheme();
    },

    navigate(page) {
        this.currentPage = page;
        this.render();
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        this.pendingKey = null;
        this.pendingKeyFilename = null;
        window.location.href = '/';
    },

    render() {
        const app = document.getElementById('app');
        
        if (!this.token || !this.user) {
            app.innerHTML = this.loginPageHTML();
            this.setupLoginEvents();
        } else {
            app.innerHTML = this.dashboardHTML();
            this.setupDashboardEvents();
            this.renderPage();
        }
    },

    loginPageHTML() {
        return `
            <div class="login-page">
                <div class="login-container">
                    <div class="login-header">
                        <div class="login-title">🔐 SecureFile</div>
                        <p class="login-subtitle">Professional File Encryption & Decryption</p>
                    </div>
                    <div class="login-form">
                        <a href="/auth/google" class="google-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                <path d="M12 7v10" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Sign in with Google
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    setupLoginEvents() {
        // Login events handled
    },

    dashboardHTML() {
        const userName = this.user.displayName || 'User';
        const initial = userName.charAt(0).toUpperCase();

        return `
            <div app-container>
                <nav class="navbar">
                    <div class="navbar-brand">🔐 SecureFile</div>
                    <div class="navbar-actions">
                        <button class="theme-toggle">🌙</button>
                        <div class="user-menu">
                            <div class="avatar">${initial}</div>
                            <span>${userName}</span>
                        </div>
                        <button class="btn btn-secondary logout-btn" style="width: auto; padding: 8px 15px;">Logout</button>
                    </div>
                </nav>

                <div class="main-content">
                    <!-- ENCRYPT PAGE removed: Document page now handles file + text encryption -->

                    <!-- DECRYPT PAGE -->
                    <div id="decrypt-page" class="page">
                        <div class="decrypt-section">
                            <h1 class="section-title">
                                <span class="section-icon">🔓</span>
                                Decrypt Files & Text
                            </h1>
                            
                            <div class="decrypt-form">
                                <div class="form-group">
                                    <label class="form-label">📁 Select Encrypted File (.enc)</label>
                                    <input type="file" id="decryptFileInput" class="form-input" accept=".enc">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">🔑 Select Key File (.key)</label>
                                    <input type="file" id="decryptKeyInput" class="form-input" accept=".key">
                                </div>

                                <div class="button-group">
                                    <button class="btn btn-primary" onclick="decryptFile()" style="flex: 1;">
                                        🔓 Decrypt
                                    </button>
                                </div>

                                <div id="decryptResult"></div>
                            </div>
                        </div>
                    </div>

                    <!-- DOCUMENT UPLOAD & TERMS PAGE -->
                    <div id="doc-page" class="page">
                        <div class="pdf-section">
                            <h1 class="section-title">
                                <span class="section-icon">📜</span>
                                Upload Document & Accept Terms
                            </h1>

                            <div class="pdf-card">
                                <div class="terms-block">
                                    <h3>Terms</h3>
                                    <textarea id="termsText" readonly style="width:100%; height:180px; padding:10px; font-size:13px;">By uploading a document you confirm you own the document or have permission to encrypt it. The service will encrypt the file and provide a 256-bit AES key (HEX) required to decrypt. Keep the key safe; lost keys cannot be recovered.</textarea>
                                    <div style="margin-top:10px; display:flex; gap:10px; align-items:center;">
                                        <input type="checkbox" id="agreeTerms"> <label for="agreeTerms">I accept the terms above</label>
                                    </div>
                                </div>

                                <div style="margin-top:20px; display: grid; gap: 12px;">
                                    <label class="form-label">📄 Select Document</label>
                                    <input type="file" id="docInput" accept=".pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/rtf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.ppt,.pptx,application/vnd.ms-powerpoint" style="display:block; margin-top:8px;" />
                                    <div class="button-group" style="margin-top:4px;">
                                        <button class="btn btn-primary" onclick="encryptDocument()">🔒 Upload & Encrypt Document</button>
                                    </div>
                                    <div style="border-top:1px solid rgba(99,102,241,0.06); padding-top:12px;">
                                        <h3 style="margin:0 0 8px 0;">✍️ Encrypt Text</h3>
                                        <textarea id="textInput" class="text-input" placeholder="Enter text to encrypt..." style="height:120px;"></textarea>
                                        <div class="button-group" style="margin-top:8px;">
                                            <button class="btn btn-primary" onclick="encryptText()">🔒 Encrypt Text</button>
                                            <button class="btn btn-secondary" onclick="clearText()">Clear</button>
                                        </div>
                                        <div id="textEncryptResult" style="margin-top:12px;"></div>
                                    </div>
                                    <div id="docEncryptResult" style="margin-top:15px;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PROFILE PAGE -->
                    <div id="profile-page" class="page">
                        <div class="profile-section">
                            <h1 class="section-title">
                                <span class="section-icon">👤</span>
                                User Profile
                            </h1>
                            
                            <div class="profile-card">
                                <img src="${this.user.avatar || 'https://via.placeholder.com/120'}" alt="Avatar" class="profile-avatar" style="border-radius: 50%; width: 120px; height: 120px; object-fit: cover;">
                                
                                <div class="profile-info">
                                    <div class="info-item">
                                        <span class="info-label">Name</span>
                                        <span class="info-value">${this.user.displayName}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Email</span>
                                        <span class="info-value">${this.user.email}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Provider</span>
                                        <span class="info-value">Google OAuth</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">Member Since</span>
                                        <span class="info-value">${new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div class="button-group" style="margin-top: 30px; display: grid; gap: 10px;">
                                    <button class="btn btn-secondary logout-btn">🚪 Logout</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECURE IMAGE VAULT PAGE -->
                    <div id="image-page" class="page">
                        <div class="image-section">
                            <h1 class="section-title">
                                <span class="section-icon">🖼️</span>
                                Secure Image Vault
                                <span style="font-size: 14px; color: #64748b; margin-left: 10px;">Dual-Layer Protection: Visual Obfuscation + AES Encryption</span>
                            </h1>
                            
                            <div class="image-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                                <!-- Image Encryption -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>🔒</span> Encrypt Image
                                    </h2>
                                    
                                    <div class="form-group">
                                        <label class="form-label">📸 Select Image</label>
                                        <input type="file" id="encryptImageInput" class="form-input" accept="image/*" style="padding: 12px;">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">🔑 Encryption Password</label>
                                        <input type="password" id="encryptImagePassword" class="form-input" placeholder="Enter strong password" style="padding: 12px;">
                                    </div>

                                    <div class="button-group">
                                        <button class="btn btn-primary" onclick="encryptImage()" style="width: 100%;">
                                            🛡️ Encrypt & Protect Image
                                        </button>
                                    </div>

                                    <div id="encryptImageResult" style="margin-top: 20px;"></div>
                                </div>

                                <!-- Image Decryption -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>🔓</span> Decrypt Image
                                    </h2>
                                    
                                    <div class="form-group">
                                        <label class="form-label">📁 Select .encimg File</label>
                                        <input type="file" id="decryptImageInput" class="form-input" accept=".encimg" style="padding: 12px;">
                                    </div>

                                    <div class="form-group">
                                        <label class="form-label">🔑 Decryption Password</label>
                                        <input type="password" id="decryptImagePassword" class="form-input" placeholder="Enter password" style="padding: 12px;">
                                    </div>

                                    <div class="button-group">
                                        <button class="btn btn-primary" onclick="decryptImage()" style="width: 100%;">
                                            🔓 Decrypt & Restore Image
                                        </button>
                                    </div>

                                    <div id="decryptImageResult" style="margin-top: 20px;"></div>
                                </div>

                                <!-- Preview Area -->
                                <div class="card" style="grid-column: 1 / -1;">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>👁️</span> Encrypted Preview
                                        <span style="font-size: 12px; color: #64748b;">(Distorted for security - original recoverable only with password)</span>
                                    </h2>
                                    
                                    <div style="text-align: center; padding: 20px; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;">
                                        <div id="imagePreviewContainer" style="display: none;">
                                            <img id="encryptedImagePreview" style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                                            <p style="margin-top: 10px; color: #64748b; font-size: 14px;">
                                                🔒 This preview is distorted and cannot be used to recover the original image
                                            </p>
                                        </div>
                                        
                                        <div id="noPreviewMessage" style="color: #64748b;">
                                            <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
                                            <p>Encrypt an image to see the distorted preview</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- AI SECURITY ASSISTANT PAGE -->
                    <div id="ai-page" class="page">
                        <div class="ai-section">
                            <h1 class="section-title">
                                <span class="section-icon">🤖</span>
                                AI Security Assistant
                                <span id="socketStatus" style="display: inline-flex; align-items: center; gap: 6px; margin-left: 20px; font-size: 14px; color: #22c55e; background: #22c55e20; padding: 4px 12px; border-radius: 20px;">
                                    <span style="display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
                                    Live
                                </span>
                            </h1>
                            
                            <div class="ai-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <!-- Analytics Dashboard -->
                                <div class="card" style="grid-column: 1 / -1;">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>📊</span> System Analytics
                                    </h2>
                                    <div id="analyticsContainer" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                                        <div class="stat-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 24px; font-weight: bold;" id="stat-encrypt">-</div>
                                            <div style="font-size: 12px; opacity: 0.9;">Encryptions</div>
                                        </div>
                                        <div class="stat-box" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 24px; font-weight: bold;" id="stat-decrypt">-</div>
                                            <div style="font-size: 12px; opacity: 0.9;">Decryptions</div>
                                        </div>
                                        <div class="stat-box" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 24px; font-weight: bold;" id="stat-download">-</div>
                                            <div style="font-size: 12px; opacity: 0.9;">Downloads</div>
                                        </div>
                                        <div class="stat-box" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                                            <div style="font-size: 24px; font-weight: bold;" id="stat-users">-</div>
                                            <div style="font-size: 12px; opacity: 0.9;">Active Users</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- AI Risk Insights -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>🧠</span> AI Risk Insights
                                    </h2>
                                    <div id="securityScoreCard" style="padding: 16px; border-radius: 10px; background: #eef2ff; margin-bottom: 12px; color: #1e3a8a; min-height: 80px; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                        Loading security score...
                                    </div>
                                    <div id="predictionCard" style="padding: 16px; border-radius: 10px; background: #f8fafc; margin-bottom: 12px; color: #0f172a; min-height: 80px; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                        Loading risk prediction...
                                    </div>
                                    <div id="simulationCard" style="padding: 16px; border-radius: 10px; background: #fdf2f8; color: #881337; min-height: 80px; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                        Loading threat simulation...
                                    </div>
                                </div>

                                <!-- Activity Trend Chart -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>📈</span> Activity Trends (24h)
                                    </h2>
                                    <canvas id="activityChart" style="max-height: 300px;"></canvas>
                                </div>

                                <!-- AI Performance Metrics -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>⚡</span> AI Performance
                                    </h2>
                                    <div id="performanceMetrics" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                                        <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
                                            <div style="font-size: 18px; font-weight: bold; color: #6366f1;" id="totalAnalyses">-</div>
                                            <div style="font-size: 12px; color: #64748b;">Total Analyses</div>
                                        </div>
                                        <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
                                            <div style="font-size: 18px; font-weight: bold; color: #22c55e;" id="avgResponseTime">-</div>
                                            <div style="font-size: 12px; color: #64748b;">Avg Response (ms)</div>
                                        </div>
                                        <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
                                            <div style="font-size: 18px; font-weight: bold; color: #f59e0b;" id="modelConfidence">-</div>
                                            <div style="font-size: 12px; color: #64748b;">Model Confidence</div>
                                        </div>
                                        <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px;">
                                            <div style="font-size: 18px; font-weight: bold; color: #ef4444;" id="activeAlerts">-</div>
                                            <div style="font-size: 12px; color: #64748b;">Active Alerts</div>
                                        </div>
                                    </div>
                                    <div style="margin-top: 15px; text-align: center;">
                                        <button onclick="retrainAIModel()" class="btn btn-primary" style="font-size: 14px; padding: 8px 16px;">
                                            🔄 Retrain AI Model
                                        </button>
                                        <div id="retrainStatus" style="margin-top: 8px; font-size: 12px; color: #64748b;"></div>
                                    </div>
                                </div>

                                <!-- Security Alerts -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>🔴</span> Security Alerts
                                    </h2>
                                    <div id="alertsContainer" style="max-height: 300px; overflow-y: auto;">
                                        <p style="text-align: center; color: #94a3b8; padding: 20px;">Loading alerts...</p>
                                    </div>
                                </div>

                                <!-- AI Chat -->
                                <div class="card">
                                    <h2 style="margin-top: 0; color: #6366f1; display: flex; align-items: center; gap: 10px;">
                                        <span>💬</span> Ask AI
                                    </h2>
                                    <div id="chatContainer" style="display: flex; flex-direction: column; height: 300px;">
                                        <div id="aiChatMessages" style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px;">
                                            <div style="color: #6366f1; font-weight: 600;">👋 Welcome to AI Assistant</div>
                                            <div style="color: #64748b; font-size: 12px; margin-top: 8px;">Ask me about:</div>
                                            <div style="color: #64748b; font-size: 12px; margin-top: 4px;">• System summary • Security alerts • Encryption info • File operations</div>
                                        </div>
                                        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                                            <button onclick="exportAIReport()" class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;">📄 Export</button>
                                            <button onclick="quickAsk('summary')" class="btn btn-secondary" style="flex: 1; padding: 8px;">📊 Summary</button>
                                            <button onclick="quickAsk('suspicious')" class="btn btn-secondary" style="flex: 1; padding: 8px;">🚨 Alerts</button>
                                            <button onclick="quickAsk('secure')" class="btn btn-secondary" style="flex: 1; padding: 8px;">🔐 Security Check</button>
                                        </div>
                                        <div style="display: flex; gap: 8px;">
                                            <input type="text" id="aiInput" placeholder="Ask something..." class="form-input" style="flex: 1; margin: 0; padding: 10px;" />
                                            <button class="btn btn-primary" onclick="sendAIMessage()" style="width: auto; padding: 10px 20px;">Send</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
                                <p>🔒 All data is encrypted. AI insights based on your audit logs.</p>
                            </div>
                        </div>
                    </div>

                    <div class="footer">
                        <p>© 2024 SecureFile - Professional File Encryption | v2.0</p>
                    </div>
                </div>

                <!-- NAVIGATION SIDEBAR -->
                <style>
                    .navbar::before {
                        content: '';
                        display: none;
                    }
                </style>

                <script>
                    // Add quick navigation buttons (Cmd/Ctrl + number)
                    document.addEventListener('keydown', (e) => {
                        if (e.ctrlKey || e.metaKey) {
                            if (e.key === '1') App.navigate('doc-page');
                            if (e.key === '2') App.navigate('decrypt-page');
                            if (e.key === '3') App.navigate('image-page');
                            if (e.key === '4') App.navigate('ai-page');
                            if (e.key === '5') App.navigate('profile-page');
                        }
                    });
                </script>
            </div>
        `;
    },

    setupDashboardEvents() {
        // Create quick links in navbar
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const navGroup = document.createElement('div');
            navGroup.style.cssText = 'display: flex; gap: 10px;';
            navGroup.innerHTML = `
                <button class="btn btn-secondary nav-link" data-page="decrypt-page" style="width: auto;">🔓 Decrypt</button>
                <button class="btn btn-secondary nav-link" data-page="doc-page" style="width: auto;">📄 Document</button>
                <button class="btn btn-secondary nav-link" data-page="image-page" style="width: auto;">🖼️ Images</button>
                <button class="btn btn-secondary nav-link" data-page="ai-page" style="width: auto;">🤖 AI Assistant</button>
            `;
            navbar.insertBefore(navGroup, navbar.querySelector('.navbar-actions'));
        }

        // Load AI dashboard data
        loadAIDashboard();
        checkSecretCodeStatus();
    },

    renderPage() {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const page = document.getElementById(this.currentPage);
        if (page) page.classList.add('active');
    }
};

// ==================== SOCKET.IO REAL-TIME SETUP ====================
const socket = io();

socket.on('connect', () => {
    console.log('✅ Connected to real-time server');
    updateConnectionStatus(true);
});

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Show browser notification for critical alerts
function showNotification(title, body, icon = '🔴') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico', // You can add a favicon
            tag: 'ai-security-alert'
        });
    }
}

// Check for critical alerts and show notifications
function checkForCriticalAlerts(data) {
    if (data.alerts && data.alerts.alerts) {
        const criticalAlerts = data.alerts.alerts.filter(alert => alert.severity === 'HIGH');
        if (criticalAlerts.length > 0) {
            showNotification(
                '🚨 Critical Security Alert',
                `${criticalAlerts.length} high-severity alert(s) detected. Check dashboard immediately.`,
                '🔴'
            );
        }
    }
    
    if (data.score && data.score.score < 30) {
        showNotification(
            '⚠️ Critical Security Score',
            `Security score dropped to ${data.score.score}/100. Immediate attention required.`,
            '⚠️'
        );
    }
}

socket.on('ai_update', (data) => {
    console.log('🔄 Real-time AI update received:', data);
    
    // Update stats if on AI page
    if (App.currentPage === 'ai-page') {
        updateAIDashboardRealTime(data);
    }
    
    // Check for critical alerts
    checkForCriticalAlerts(data);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    updateConnectionStatus(false);
});

function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('socketStatus');
    if (!statusEl) return;
    
    if (connected) {
        statusEl.style.color = '#22c55e';
        statusEl.style.background = '#22c55e20';
        statusEl.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite;"></span>
            Live
        `;
    } else {
        statusEl.style.color = '#ef4444';
        statusEl.style.background = '#ef444420';
        statusEl.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: #ef4444; border-radius: 50%;"></span>
            Offline
        `;
    }
}

// ==================== REAL-TIME AI DASHBOARD UPDATE ====================
function updateAIDashboardRealTime(data) {
    try {
        if (document.getElementById('stat-encrypt')) {
            document.getElementById('stat-encrypt').textContent = data.summary.encrypt;
            document.getElementById('stat-decrypt').textContent = data.summary.decrypt;
            document.getElementById('stat-download').textContent = data.summary.download;
            document.getElementById('stat-users').textContent = data.summary.uniqueUsers;
        }

        if (document.getElementById('securityScoreCard') && data.score) {
            const scoreCard = document.getElementById('securityScoreCard');
            const score = data.score;
            let bgColor, textColor, borderColor, riskClass;
            
            if (score.score >= 80) {
                bgColor = '#ecfdf5';
                textColor = '#166534';
                borderColor = '#22c55e';
                riskClass = 'risk-low';
            } else if (score.score >= 50) {
                bgColor = '#fffbeb';
                textColor = '#92400e';
                borderColor = '#f59e0b';
                riskClass = 'risk-medium';
            } else {
                bgColor = '#fef2f2';
                textColor = '#991b1b';
                borderColor = '#ef4444';
                riskClass = 'risk-high';
            }
            
            scoreCard.className = riskClass;
            scoreCard.style.background = bgColor;
            scoreCard.style.color = textColor;
            scoreCard.style.border = `2px solid ${borderColor}`;
            scoreCard.style.boxShadow = `0 0 10px ${borderColor}30`;
            scoreCard.innerHTML = `Security Score: <strong>${score.score}/100</strong> (${score.level})<br><span style="display:block; margin-top:6px; font-weight:400; color: ${textColor}aa;">${score.explanation}</span>`;
        }

        if (document.getElementById('predictionCard') && data.prediction) {
            const predictionCard = document.getElementById('predictionCard');
            const prediction = data.prediction;
            let bgColor, textColor, borderColor, riskClass;
            
            if (prediction.risk === 'LOW') {
                bgColor = '#ecfdf5';
                textColor = '#166534';
                borderColor = '#22c55e';
                riskClass = 'risk-low';
            } else if (prediction.risk === 'MEDIUM') {
                bgColor = '#fffbeb';
                textColor = '#92400e';
                borderColor = '#f59e0b';
                riskClass = 'risk-medium';
            } else {
                bgColor = '#fef2f2';
                textColor = '#991b1b';
                borderColor = '#ef4444';
                riskClass = 'risk-high';
            }
            
            predictionCard.className = riskClass;
            predictionCard.style.background = bgColor;
            predictionCard.style.color = textColor;
            predictionCard.style.border = `2px solid ${borderColor}`;
            predictionCard.style.boxShadow = `0 0 10px ${borderColor}30`;
            predictionCard.innerHTML = `<strong>${prediction.risk} RISK</strong><br>${prediction.message}`;
        }

        if (document.getElementById('simulationCard') && data.simulation) {
            const simulationCard = document.getElementById('simulationCard');
            const simulation = data.simulation;
            let bgColor, textColor, borderColor, riskClass;
            
            if (simulation.severity === 'NORMAL') {
                bgColor = '#ecfdf5';
                textColor = '#166534';
                borderColor = '#22c55e';
                riskClass = 'risk-low';
            } else {
                bgColor = '#fef2f2';
                textColor = '#991b1b';
                borderColor = '#ef4444';
                riskClass = 'risk-high';
            }
            
            simulationCard.className = riskClass;
            simulationCard.style.background = bgColor;
            simulationCard.style.color = textColor;
            simulationCard.style.border = `2px solid ${borderColor}`;
            simulationCard.style.boxShadow = `0 0 10px ${borderColor}30`;
            simulationCard.innerHTML = `<strong>Scenario:</strong> ${simulation.simulation}<br><strong>Prevention:</strong> ${simulation.prevention}`;
        }

        if (document.getElementById('alertsContainer')) {
            const container = document.getElementById('alertsContainer');
            if (data.alerts.totalAlerts === 0) {
                container.innerHTML = `<div style="text-align: center; color: #22c55e; padding: 20px; animation: slideIn 0.3s ease-out;">✅ No suspicious activity detected!</div>`;
            } else {
                let alertsHTML = `<div style="color: #ef4444; font-weight: 600; margin-bottom: 10px;">🚨 ${data.alerts.totalAlerts} Alert(s)</div>`;
                data.alerts.alerts.slice(0, 5).forEach(alert => {
                    const severityColor = alert.severity === 'HIGH' ? '#ef4444' : '#f59e0b';
                    alertsHTML += `<div style="padding: 10px; margin: 6px 0; background: ${severityColor}20; border-left: 4px solid ${severityColor}; border-radius: 4px; font-size: 12px; animation: slideIn 0.3s ease-out;">
                        <div style="color: ${severityColor}; font-weight: 700;">${alert.severity}</div>
                        <div style="color: #64748b; margin-top: 4px; word-break: break-word;">${alert.message}</div>
                    </div>`;
                });
                container.innerHTML = alertsHTML;
            }
        }

        // Update performance metrics if available
        if (data.metrics) {
            if (document.getElementById('totalAnalyses')) {
                document.getElementById('totalAnalyses').textContent = data.metrics.totalAnalyses;
            }
            if (document.getElementById('avgResponseTime')) {
                document.getElementById('avgResponseTime').textContent = Math.round(data.metrics.avgResponseTime);
            }
            if (document.getElementById('modelConfidence')) {
                document.getElementById('modelConfidence').textContent = (data.metrics.modelConfidence * 100).toFixed(1) + '%';
            }
        }

        const statBoxes = document.querySelectorAll('.stat-box');
        statBoxes.forEach(box => {
            box.style.animation = 'none';
            setTimeout(() => box.style.animation = 'pulse 0.5s ease-out', 10);
        });
    } catch (err) {
        console.error('Error updating dashboard:', err);
    }
}

async function checkSecretCodeStatus() {
    try {
        const res = await fetch('/api/secret-code/status', {
            headers: { 'Authorization': `Bearer ${App.token}` }
        });
        const data = await res.json();
        if (data.ok && !data.hasSecretCode) {
            showSecretCodeModal();
        }
    } catch (err) {
        console.error('Secret code status error:', err);
    }
}

function showSecretCodeModal() {
    if (document.getElementById('secretCodeModal')) return;

    const modal = document.createElement('div');
    modal.id = 'secretCodeModal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.88); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);';
    modal.innerHTML = `
        <div style="width: 420px; background: #111827; border-radius: 18px; padding: 28px; color: #e2e8f0; box-shadow: 0 20px 80px rgba(0,0,0,0.35);">
            <h2 style="margin:0 0 12px 0; color:#93c5fd;">Secure Secret Code Setup</h2>
            <p style="margin:0 0 18px 0; color:#94a3b8; font-size:14px;">Set a second password to protect key copying and decryption.</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <input id="secretCodeInput" type="password" placeholder="Enter secret code" style="width:100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #334155; background:#0f172a; color:#e2e8f0;" />
                <input id="secretCodeConfirmInput" type="password" placeholder="Confirm secret code" style="width:100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #334155; background:#0f172a; color:#e2e8f0;" />
                <button class="btn btn-primary" style="width:100%;" onclick="setupSecretCode()">Save Secret Code</button>
                <div id="secretCodeMessage" style="font-size:13px; color:#f8fafc; opacity:0.85;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function setupSecretCode() {
    const code = document.getElementById('secretCodeInput').value.trim();
    const confirm = document.getElementById('secretCodeConfirmInput').value.trim();
    const msg = document.getElementById('secretCodeMessage');

    if (!code || code.length < 4) {
        msg.textContent = 'Secret code must be at least 4 characters.';
        return;
    }
    if (code !== confirm) {
        msg.textContent = 'Secret code confirmation does not match.';
        return;
    }

    try {
        const res = await fetch('/api/set-secret', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const data = await res.json();
        if (data.ok) {
            document.getElementById('secretCodeModal')?.remove();
            alert('Secret code saved. Your key actions are now protected.');
        } else {
            msg.textContent = data.error || 'Unable to save secret code.';
        }
    } catch (err) {
        msg.textContent = 'Error saving secret code.';
        console.error(err);
    }
}

let pendingSecretAction = null;

function showVerifySecretModal(action) {
    if (document.getElementById('verifySecretModal')) return;
    pendingSecretAction = action;

    const modal = document.createElement('div');
    modal.id = 'verifySecretModal';
    modal.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.9); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);';
    modal.innerHTML = `
        <div style="width: 420px; background: #111827; border-radius: 18px; padding: 28px; color: #e2e8f0; box-shadow: 0 20px 80px rgba(0,0,0,0.35);">
            <h2 style="margin:0 0 12px 0; color:#93c5fd;">Verify Secret Code</h2>
            <p style="margin:0 0 18px 0; color:#94a3b8; font-size:14px;">Enter your secret code to copy the AES key securely.</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <input id="secretVerifyInput" type="password" placeholder="Enter secret code" style="width:100%; padding: 12px 14px; border-radius: 10px; border: 1px solid #334155; background:#0f172a; color:#e2e8f0;" />
                <button class="btn btn-primary" style="width:100%;" onclick="submitSecretVerification()">Verify & Copy</button>
                <button class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('verifySecretModal')?.remove()">Cancel</button>
                <div id="verifySecretMessage" style="font-size:13px; color:#f8fafc; opacity:0.85;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitSecretVerification() {
    const code = document.getElementById('secretVerifyInput').value.trim();
    const msg = document.getElementById('verifySecretMessage');
    if (!code) {
        msg.textContent = 'Please enter your secret code.';
        return;
    }

    try {
        const res = await fetch('/api/verify-secret', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (data.ok && data.valid) {
            document.getElementById('verifySecretModal')?.remove();
            if (typeof pendingSecretAction === 'function') pendingSecretAction();
            pendingSecretAction = null;
        } else {
            msg.textContent = '❌ Wrong secret code. Try again.';
        }
    } catch (err) {
        msg.textContent = 'Unable to verify secret code.';
        console.error(err);
    }
}

window.addEventListener('blur', () => {
    document.body.style.filter = 'blur(10px)';
});

window.addEventListener('focus', () => {
    document.body.style.filter = 'none';
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// ==================== ENCRYPTION FUNCTIONS ====================
async function encryptFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) return alert('Please select a file');

    const formData = new FormData();
    formData.append('file', file);

    try {
        showLoading('fileEncryptResult');
        const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();
        if (data.ok) {
            showEncryptResult('fileEncryptResult', data);
            fileInput.value = '';
        } else {
            alert('Encryption failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function encryptDocument() {
    const agreed = document.getElementById('agreeTerms').checked;
    if (!agreed) return alert('Please accept the terms before uploading.');

    const fileInput = document.getElementById('docInput');
    const file = fileInput.files[0];
    if (!file) return alert('Please select a document file');

    const formData = new FormData();
    formData.append('file', file);

    try {
        showLoading('docEncryptResult');
        const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();
        if (data.ok) {
            showEncryptResult('docEncryptResult', data);
            fileInput.value = '';
        } else {
            alert('Encryption failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}
async function encryptText() {
    const text = document.getElementById('textInput').value;
    if (!text) return alert('Please enter text');

    const formData = new FormData();
    formData.append('text', text);

    try {
        showLoading('textEncryptResult');
        const res = await fetch('/api/encrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();
        if (data.ok) {
            showEncryptResult('textEncryptResult', data);
            document.getElementById('textInput').value = '';
        } else {
            alert('Encryption failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function decryptFile() {
    const fileInput = document.getElementById('decryptFileInput');
    const keyInput = document.getElementById('decryptKeyInput');
    const file = fileInput.files[0];
    const keyFile = keyInput.files[0];

    if (!file || !keyFile) return alert('Please select both encrypted file and key file');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('keyFile', keyFile);

    try {
        showLoading('decryptResult');
        const res = await fetch('/api/decrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();
        if (data.ok) {
            showDecryptResult('decryptResult', data);
        } else {
            alert('Decryption failed: ' + data.error);
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function clearFile() {
    document.getElementById('fileInput').value = '';
    document.getElementById('selectedFile').innerHTML = '';
    document.getElementById('fileEncryptResult').innerHTML = '';
}

function clearText() {
    document.getElementById('textInput').value = '';
    document.getElementById('textEncryptResult').innerHTML = '';
}

// ==================== UI HELPERS ====================
function showLoading(elementId) {
    document.getElementById(elementId).innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p class="loading-text">Processing...</p>
        </div>
    `;
}

function showEncryptResult(elementId, data) {
    const resultHTML = `
        <div class="result-card">
            <div class="result-title">✅ Encryption Successful</div>
            <div class="result-content">
                <div class="result-item">
                    <span class="result-label">Filename:</span>
                    <span class="result-value">${data.filename}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">File Size:</span>
                    <span class="result-value">${formatBytes(data.size)}</span>
                </div>
                <div class="result-item">
                    <span class="result-label">Encryption Time:</span>
                    <span class="result-value">${new Date(data.timestamp).toLocaleString()}</span>
                </div>
                <div class="button-group" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="downloadProtected('${data.downloadEncryptedUrl}','${data.filename}.enc')" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">⬇️ Download Encrypted File</button>
                    <button class="btn btn-secondary" onclick="downloadProtected('${data.downloadKeyUrl}','${data.filename}.key')" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">⬇️ Download Key File</button>
                </div>
                <div style="margin-top: 12px; color: #6b7280; font-size: 12px;">⚠️ Keep the key file safe. It is required for decryption and is encrypted with your RSA key.</div>
            </div>
        </div>
    `;
    document.getElementById(elementId).innerHTML = resultHTML;
}

function showDecryptResult(elementId, data) {
    let resultHTML = `
        <div class="result-card">
            <div class="result-title">✅ Decryption Successful</div>
            <div class="result-content">
    `;

    if (data.plaintext) {
        resultHTML += `
                <div class="result-item" style="flex-direction: column; align-items: flex-start;">
                    <span class="result-label" style="margin-bottom: 10px;">Decrypted Text:</span>
                    <textarea readonly style="width: 100%; height: 150px; padding: 10px; border: 1px solid #6366f1; border-radius: 5px; background: #f8fafc; color: #1e293b; font-size: 13px; font-family: monospace; resize: none;">${data.plaintext}</textarea>
                </div>
        `;
    }

    resultHTML += `
                <div class="button-group" style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="downloadProtected('${data.downloadUrl}','${data.filename}')" style="text-decoration: none; display: flex; align-items: center; justify-content: center;">⬇️ Download File</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById(elementId).innerHTML = resultHTML;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Download a protected file using Authorization header, then trigger client download
async function downloadProtected(url, filename) {
    if (!App.token) return alert('Please sign in to download files');
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${App.token}` } });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return alert('Download failed: ' + (err.error || res.statusText));
        }

        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        alert('Download error: ' + e.message);
    }
}

// ==================== AI SECURITY ASSISTANT ====================

let activityChart = null;

async function loadActivityChart() {
    try {
        const headers = { 'Authorization': `Bearer ${App.token}` };
        const res = await fetch('/api/ai/trend?hours=24', { headers });
        const data = await res.json();

        if (data.ok && data.trend.length > 0) {
            const ctx = document.getElementById('activityChart').getContext('2d');
            
            const labels = data.trend.map(item => {
                const date = new Date(item.hour);
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            });
            
            const encryptData = data.trend.map(item => item.encrypt);
            const decryptData = data.trend.map(item => item.decrypt);
            const downloadData = data.trend.map(item => item.download);

            if (activityChart) {
                activityChart.destroy();
            }

            activityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Encryptions',
                        data: encryptData,
                        borderColor: '#6366f1',
                        backgroundColor: '#6366f120',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Decryptions',
                        data: decryptData,
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b20',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Downloads',
                        data: downloadData,
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444420',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time (Last 24 Hours)'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Activity Count'
                            },
                            beginAtZero: true
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        }
    } catch (err) {
        console.error('Error loading activity chart:', err);
    }
}

async function loadPerformanceMetrics() {
    try {
        const headers = { 'Authorization': `Bearer ${App.token}` };
        const res = await fetch('/api/ai/performance', { headers });
        const data = await res.json();

        if (data.ok) {
            document.getElementById('totalAnalyses').textContent = data.metrics.totalAnalyses;
            document.getElementById('avgResponseTime').textContent = data.metrics.avgResponseTime;
            document.getElementById('modelConfidence').textContent = (data.modelMetrics.confidence * 100).toFixed(1) + '%';
            document.getElementById('activeAlerts').textContent = data.activeAlerts.length;
        }
    } catch (err) {
        console.error('Error loading performance metrics:', err);
    }
}

async function exportAIReport() {
    try {
        const headers = { 'Authorization': `Bearer ${App.token}` };
        
        // Gather all AI data
        const [summaryRes, alertsRes, scoreRes, predictRes, simulateRes, perfRes] = await Promise.all([
            fetch('/api/ai/summary', { headers }),
            fetch('/api/ai/anomalies', { headers }),
            fetch('/api/ai/score', { headers }),
            fetch('/api/ai/predict', { headers }),
            fetch('/api/ai/simulate', { headers }),
            fetch('/api/ai/performance', { headers })
        ]);
        
        const [summary, alerts, score, prediction, simulation, performance] = await Promise.all([
            summaryRes.json(),
            alertsRes.json(),
            scoreRes.json(),
            predictRes.json(),
            simulateRes.json(),
            perfRes.json()
        ]);
        
        // Generate report
        const report = {
            generatedAt: new Date().toISOString(),
            reportTitle: 'AI Security Analysis Report',
            systemSummary: summary,
            securityScore: score,
            riskPrediction: prediction,
            threatSimulation: simulation,
            alerts: alerts,
            performance: performance
        };
        
        // Create and download JSON file
        const dataStr = JSON.stringify(report, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `ai-security-report-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // Show success message
        const messagesContainer = document.getElementById('aiChatMessages');
        const successMsg = document.createElement('div');
        successMsg.style.cssText = 'margin: 8px 0; padding: 8px; background: #ecfdf5; border-radius: 12px; color: #166534; font-size: 12px; text-align: center;';
        successMsg.textContent = '📄 AI Security Report exported successfully!';
        messagesContainer.appendChild(successMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        setTimeout(() => successMsg.remove(), 3000);
        
    } catch (err) {
        console.error('Error exporting report:', err);
        const messagesContainer = document.getElementById('aiChatMessages');
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'margin: 8px 0; padding: 8px; background: #fef2f2; border-radius: 12px; color: #991b1b; font-size: 12px; text-align: center;';
        errorMsg.textContent = '❌ Failed to export report: ' + err.message;
        messagesContainer.appendChild(errorMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        setTimeout(() => errorMsg.remove(), 5000);
    }
}

async function retrainAIModel() {
    const button = event.target;
    const statusDiv = document.getElementById('retrainStatus');
    
    button.disabled = true;
    button.textContent = '🔄 Retraining...';
    statusDiv.textContent = 'Initiating model retraining...';
    statusDiv.style.color = '#f59e0b';
    
    try {
        const headers = { 'Authorization': `Bearer ${App.token}` };
        const res = await fetch('/api/ai/retrain', {
            method: 'POST',
            headers
        });
        
        const data = await res.json();
        
        if (data.ok) {
            statusDiv.textContent = '✅ Model retraining completed successfully!';
            statusDiv.style.color = '#22c55e';
            
            // Reload performance metrics after a short delay
            setTimeout(() => {
                loadPerformanceMetrics();
            }, 1000);
        } else {
            throw new Error(data.error || 'Retraining failed');
        }
    } catch (err) {
        statusDiv.textContent = '❌ Retraining failed: ' + err.message;
        statusDiv.style.color = '#ef4444';
    } finally {
        button.disabled = false;
        button.textContent = '🔄 Retrain AI Model';
        
        // Clear status after 5 seconds
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 5000);
    }
}

async function loadAIDashboard() {
    try {
        const headers = { 'Authorization': `Bearer ${App.token}` };

        const [summaryRes, alertsRes, scoreRes, predictRes, simulateRes] = await Promise.all([
            fetch('/api/ai/summary', { headers }),
            fetch('/api/ai/anomalies', { headers }),
            fetch('/api/ai/score', { headers }),
            fetch('/api/ai/predict', { headers }),
            fetch('/api/ai/simulate', { headers })
        ]);

        const [summaryData, alertsData, scoreData, predictData, simulationData] = await Promise.all([
            summaryRes.json(),
            alertsRes.json(),
            scoreRes.json(),
            predictRes.json(),
            simulateRes.json()
        ]);

        if (summaryData.ok) {
            document.getElementById('stat-encrypt').textContent = summaryData.encrypt;
            document.getElementById('stat-decrypt').textContent = summaryData.decrypt;
            document.getElementById('stat-download').textContent = summaryData.download;
            document.getElementById('stat-users').textContent = summaryData.uniqueUsers;
        }

        if (scoreData.ok) {
            const scoreCard = document.getElementById('securityScoreCard');
            if (scoreCard) {
                const score = scoreData.score;
                let bgColor, textColor, borderColor, riskClass;
                
                if (score.score >= 80) {
                    bgColor = '#ecfdf5';
                    textColor = '#166534';
                    borderColor = '#22c55e';
                    riskClass = 'risk-low';
                } else if (score.score >= 50) {
                    bgColor = '#fffbeb';
                    textColor = '#92400e';
                    borderColor = '#f59e0b';
                    riskClass = 'risk-medium';
                } else {
                    bgColor = '#fef2f2';
                    textColor = '#991b1b';
                    borderColor = '#ef4444';
                    riskClass = 'risk-high';
                }
                
                scoreCard.className = riskClass;
                scoreCard.style.background = bgColor;
                scoreCard.style.color = textColor;
                scoreCard.style.border = `2px solid ${borderColor}`;
                scoreCard.style.boxShadow = `0 0 10px ${borderColor}30`;
                scoreCard.innerHTML = `Security Score: <strong>${score.score}/100</strong> (${score.level})<br><span style="display:block; margin-top:6px; font-weight:400; color: ${textColor}aa;">${score.explanation}</span>`;
            }
        }

        if (predictData.ok) {
            const predictionCard = document.getElementById('predictionCard');
            if (predictionCard) {
                const prediction = predictData.prediction;
                let bgColor, textColor, borderColor;
                
                if (prediction.risk === 'LOW') {
                    bgColor = '#ecfdf5';
                    textColor = '#166534';
                    borderColor = '#22c55e';
                } else if (prediction.risk === 'MEDIUM') {
                    bgColor = '#fffbeb';
                    textColor = '#92400e';
                    borderColor = '#f59e0b';
                } else {
                    bgColor = '#fef2f2';
                    textColor = '#991b1b';
                    borderColor = '#ef4444';
                }
                
                predictionCard.style.background = bgColor;
                predictionCard.style.color = textColor;
                predictionCard.style.border = `2px solid ${borderColor}`;
                predictionCard.style.boxShadow = `0 0 10px ${borderColor}30`;
                predictionCard.innerHTML = `<strong>${prediction.risk} RISK</strong><br>${prediction.message}`;
            }
        }

        if (simulationData.ok) {
            const simulationCard = document.getElementById('simulationCard');
            if (simulationCard) {
                const simulation = simulationData.simulation;
                let bgColor, textColor, borderColor;
                
                if (simulation.severity === 'NORMAL') {
                    bgColor = '#ecfdf5';
                    textColor = '#166534';
                    borderColor = '#22c55e';
                } else {
                    bgColor = '#fef2f2';
                    textColor = '#991b1b';
                    borderColor = '#ef4444';
                }
                
                simulationCard.style.background = bgColor;
                simulationCard.style.color = textColor;
                simulationCard.style.border = `2px solid ${borderColor}`;
                simulationCard.style.boxShadow = `0 0 10px ${borderColor}30`;
                simulationCard.innerHTML = `<strong>Scenario:</strong> ${simulation.simulation}<br><strong>Prevention:</strong> ${simulation.prevention}`;
            }
        }

        if (alertsData.ok) {
            const container = document.getElementById('alertsContainer');
            if (container) {
                if (alertsData.totalAlerts === 0) {
                    container.innerHTML = `<div style="text-align: center; color: #22c55e; padding: 20px;">✅ No suspicious activity detected!</div>`;
                } else {
                    let alertsHTML = `<div style="color: #ef4444; font-weight: 600; margin-bottom: 10px;">🚨 ${alertsData.totalAlerts} Alert(s)</div>`;
                    alertsData.alerts.slice(0, 5).forEach(alert => {
                        alertsHTML += `<div style="padding: 8px; margin: 4px 0; background: #fee2e2; border-left: 3px solid #ef4444; border-radius: 3px; font-size: 12px;">
                            <div style="color: #991b1b; font-weight: 600;">${alert.severity}</div>
                            <div style="color: #7c2d12; margin-top: 3px;">${alert.message}</div>
                        </div>`;
                    });
                    container.innerHTML = alertsHTML;
                }
            }
        }

        // Load activity chart
        await loadActivityChart();
        
        // Load performance metrics
        await loadPerformanceMetrics();
    } catch (err) {
        console.error('Error loading AI dashboard:', err);
    }
}

async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();

    if (!message) return;

    const messagesContainer = document.getElementById('aiChatMessages');
    const userMsg = document.createElement('div');
    userMsg.style.cssText = 'margin: 8px 0; padding: 8px; background: #e0e7ff; border-radius: 12px; text-align: right; color: #3730a3; margin-left: 40px;';
    userMsg.textContent = message;
    messagesContainer.appendChild(userMsg);
    input.value = '';

    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'margin: 8px 0; padding: 12px; background: #f8fafc; border-radius: 12px; color: #64748b; border: 1px dashed #cbd5e1; text-align: left;';
    loadingMsg.textContent = '🤖 AI is analyzing...';
    messagesContainer.appendChild(loadingMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${App.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await res.json();
        loadingMsg.remove();

        const aiMsg = document.createElement('div');
        aiMsg.style.cssText = 'margin: 8px 0; padding: 12px; background: #f0fdf4; border-radius: 12px; color: #166534; border-left: 4px solid #22c55e; white-space: pre-wrap; word-break: break-word; margin-right: 40px;';
        aiMsg.textContent = '';
        messagesContainer.appendChild(aiMsg);

        const replyText = data.reply || data.response?.message || 'Unable to process';
        typeEffect(replyText, aiMsg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

    } catch (err) {
        loadingMsg.remove();
        const msgContainer = document.getElementById('aiChatMessages');
        const errMsg = document.createElement('div');
        errMsg.style.cssText = 'margin: 8px 0; padding: 8px; background: #fee2e2; border-radius: 12px; color: #991b1b;';
        errMsg.textContent = '❌ Error: ' + err.message;
        msgContainer.appendChild(errMsg);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }
}

// Allow Enter key to send messages
document.addEventListener('keydown', (e) => {
    if (e.target.id === 'aiInput' && e.key === 'Enter') {
        sendAIMessage();
    }
});

function quickAsk(type) {
    const messages = {
        'summary': 'Give me a system summary',
        'suspicious': 'Show me any suspicious activity',
        'secure': 'Is my system secure?'
    };
    document.getElementById('aiInput').value = messages[type];
    sendAIMessage();
}

function typeEffect(text, element) {
    let i = 0;
    element.innerText = '';
    const interval = setInterval(() => {
        element.innerText += text[i] || '';
        i++;
        if (i >= text.length) {
            clearInterval(interval);
        }
    }, 20);
}

function showLoading(elementId) {
    const container = document.getElementById(elementId);
    if (container) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 10px;">⏳ Thinking...</div>`;
    }
}

// ==================== AUTO-REFRESH FOR IDLE STATE ====================
let autoRefreshInterval = null;

function startAutoRefresh() {
    // Auto-refresh every 5 seconds when on AI page
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(() => {
        if (App.currentPage === 'ai-page' && App.token) {
            loadAIDashboard();
        }
    }, 5000);
}

// ==================== SECURE IMAGE VAULT ====================

async function encryptImage() {
    const fileInput = document.getElementById('encryptImageInput');
    const passwordInput = document.getElementById('encryptImagePassword');
    const resultDiv = document.getElementById('encryptImageResult');

    const file = fileInput.files[0];
    const password = passwordInput.value.trim();

    if (!file) {
        resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Please select an image file</div>';
        return;
    }

    if (!password || password.length < 6) {
        resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Password must be at least 6 characters</div>';
        return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('password', password);

    resultDiv.innerHTML = '<div style="color: #6366f1; padding: 10px; background: #e0e7ff; border-radius: 8px;">🔄 Encrypting image with dual-layer protection...</div>';

    try {
        const res = await fetch('/api/image/encrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();

        if (data.ok) {
            // Show preview if available
            if (data.previewUrl) {
                showEncryptedPreview(data.previewUrl);
            }

            resultDiv.innerHTML = `
                <div style="color: #22c55e; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <div style="font-weight: 600; margin-bottom: 10px;">✅ Image Encrypted Successfully!</div>
                    <div style="font-size: 14px; color: #166534; margin-bottom: 15px;">
                        🔒 Dual-layer protection applied: Visual distortion + AES-256-GCM encryption
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="downloadProtected('${data.downloadUrl}', '${data.filename}')" style="font-size: 14px;">
                            ⬇️ Download .encimg File
                        </button>
                    </div>
                </div>
            `;

            // Clear form
            fileInput.value = '';
            passwordInput.value = '';
        } else {
            resultDiv.innerHTML = `<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Encryption failed: ${data.error}</div>`;
        }
    } catch (err) {
        resultDiv.innerHTML = `<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Error: ${err.message}</div>`;
    }
}

async function decryptImage() {
    const fileInput = document.getElementById('decryptImageInput');
    const passwordInput = document.getElementById('decryptImagePassword');
    const resultDiv = document.getElementById('decryptImageResult');

    const file = fileInput.files[0];
    const password = passwordInput.value.trim();

    if (!file) {
        resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Please select a .encimg file</div>';
        return;
    }

    if (!password) {
        resultDiv.innerHTML = '<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Please enter the decryption password</div>';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    resultDiv.innerHTML = '<div style="color: #6366f1; padding: 10px; background: #e0e7ff; border-radius: 8px;">🔄 Decrypting image and reversing distortions...</div>';

    try {
        const res = await fetch('/api/image/decrypt', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${App.token}` },
            body: formData
        });

        const data = await res.json();

        if (data.ok) {
            resultDiv.innerHTML = `
                <div style="color: #22c55e; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                    <div style="font-weight: 600; margin-bottom: 10px;">✅ Image Decrypted Successfully!</div>
                    <div style="font-size: 14px; color: #166534; margin-bottom: 15px;">
                        🔓 Original image restored from dual-layer protection
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="downloadProtected('${data.downloadUrl}', '${data.filename}')" style="font-size: 14px;">
                            ⬇️ Download Restored Image
                        </button>
                    </div>
                </div>
            `;

            // Clear form
            fileInput.value = '';
            passwordInput.value = '';
        } else {
            resultDiv.innerHTML = `<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Decryption failed: ${data.error}</div>`;
        }
    } catch (err) {
        resultDiv.innerHTML = `<div style="color: #ef4444; padding: 10px; background: #fee2e2; border-radius: 8px;">❌ Error: ${err.message}</div>`;
    }
}

function showEncryptedPreview(previewUrl) {
    const container = document.getElementById('imagePreviewContainer');
    const img = document.getElementById('encryptedImagePreview');
    const noPreview = document.getElementById('noPreviewMessage');

    img.src = previewUrl;
    container.style.display = 'block';
    noPreview.style.display = 'none';
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Modify navigate to handle refresh
const originalNavigate = App.navigate;
App.navigate = function(page) {
    originalNavigate.call(this, page);
    
    if (page === 'ai-page') {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
};

// ==================== INIT APP ====================
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    App.navigate('doc-page');
});
