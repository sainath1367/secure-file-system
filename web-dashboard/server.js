const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// AI Modules
const { detectAnomalies, getAnomalyStats } = require('./ai/anomaly');
const { summarizeLogs, getFormattedSummary, getActivityTrend } = require('./ai/summary');
const { calculateSecurityScore } = require('./ai/securityScore');
const { predictRisk } = require('./ai/predict');
const { simulateThreat } = require('./ai/simulation');
const { getResponse } = require('./ai/chatbot');
const { askAI } = require('./ai/llm');
const { setSecretCode, verifySecretCode, hasSecretCode } = require('./auth/secretCode');
const { getRSAKeys, encryptAESKeyWithRSA, decryptAESKeyWithRSA, rotateRSAKeys } = require('./auth/rsaKeys');
const { encryptImage, decryptImage } = require('./ai/imageVault');

const app = express();
const PORT = process.env.PORT || 8080;

// ======================= SOCKET.IO SETUP =======================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ======================= STORAGE SETUP =======================
const STORAGE_PATHS = {
  keys: '/app/storage/keys',
  encrypted: '/app/storage/encrypted',
  encryptedImages: '/app/storage/encrypted-images',
  decrypted: '/app/storage/decrypted',
  decryptedImages: '/app/storage/decrypted-images',
  logs: '/app/storage/logs'
};

Object.values(STORAGE_PATHS).forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ======================= MIDDLEWARE =======================
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const upload = multer({
  storage: multer.diskStorage({
    destination: STORAGE_PATHS.encrypted,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
  })
});

// ======================= SESSION & PASSPORT =======================
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  const user = {
    id: profile.id,
    displayName: profile.displayName,
    email: profile.emails[0].value,
    avatar: profile.photos[0]?.value,
    provider: 'google'
  };
  return done(null, user);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ======================= AUTH ROUTES =======================
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, displayName: req.user.displayName },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    res.json({ ok: true });
  });
});

// ======================= MIDDLEWARE: JWT VERIFICATION =======================
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ======================= SECRET CODE ROUTES =======================
app.get('/api/secret-code/status', verifyToken, async (req, res) => {
  try {
    const exists = await hasSecretCode(req.user.email);
    res.json({ ok: true, hasSecretCode: exists });
  } catch (err) {
    console.error('Secret code status error:', err);
    res.status(500).json({ error: 'Unable to check secret code status' });
  }
});

app.post('/api/set-secret', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.trim().length < 4) {
      return res.status(400).json({ error: 'Secret code must be at least 4 characters' });
    }
    await setSecretCode(req.user.email, code);
    auditLog(req.user.email, 'SECRET_CODE_SET', req.user.email);
    res.json({ ok: true, message: 'Secret code set successfully' });
  } catch (err) {
    console.error('Set secret error:', err);
    res.status(500).json({ error: 'Unable to set secret code' });
  }
});

app.post('/api/verify-secret', verifyToken, async (req, res) => {
  try {
    const { code } = req.body;
    const valid = await verifySecretCode(req.user.email, code);
    res.json({ ok: true, valid });
  } catch (err) {
    console.error('Verify secret error:', err);
    res.status(500).json({ error: 'Unable to verify secret code' });
  }
});

// ======================= ENCRYPTION/DECRYPTION ROUTES =======================
const crypto = require('crypto');

// Encrypt file or text
app.post('/api/encrypt', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { text } = req.body;
    let fileToEncrypt;

    if (text) {
      fileToEncrypt = Buffer.from(text, 'utf-8');
    } else if (req.file) {
      fileToEncrypt = fs.readFileSync(req.file.path);
    } else {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    // Generate AES-256 key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    
    let encrypted = cipher.update(fileToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // File format: IV | authTag | encrypted
    const encryptedData = Buffer.concat([iv, authTag, encrypted]);
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filepath = path.join(STORAGE_PATHS.encrypted, `${filename}.enc`);
    
    fs.writeFileSync(filepath, encryptedData);

    // Persist key file in keys volume (filename.key)
    try {
      const { publicKey } = getRSAKeys(req.user.email);
      const encryptedAESKey = encryptAESKeyWithRSA(aesKey.toString('hex'), publicKey);
      
      const keyPath = path.join(STORAGE_PATHS.keys, `${filename}.key`);
      const keyMeta = {
        encryptedKey: encryptedAESKey, // RSA-encrypted AES key
        owner: req.user.email,
        createdAt: new Date().toISOString(),
        version: 1,
        filename: `${filename}.enc`
      };
      fs.writeFileSync(keyPath, JSON.stringify(keyMeta, null, 2), { mode: 0o600 });
    } catch (e) {
      console.error('Failed to write key file:', e);
    }

    auditLog(req.user.email, 'ENCRYPT', filename);

    // Return AES key as 256-bit HEX string (32 bytes => 64 hex chars) and download URLs
    res.json({
      ok: true,
      filename,
      aesKey: aesKey.toString('hex'),
      timestamp: new Date().toISOString(),
      size: encryptedData.length,
      downloadEncryptedUrl: `/api/download-encrypted/${filename}`,
      downloadKeyUrl: `/api/download-key/${filename}`
    });
  } catch (err) {
    console.error('Encrypt error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Download encrypted image file
app.get('/api/download-encrypted-image/:filename', verifyToken, (req, res) => {
  try {
    const fname = req.params.filename;
    const filepath = path.join(STORAGE_PATHS.encryptedImages, fname);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Encrypted image not found' });

    res.download(filepath, fname);
    auditLog(req.user.email, 'DOWNLOAD_ENCRYPTED_IMAGE', fname);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download key file
app.get('/api/download-key/:filename', verifyToken, (req, res) => {
  try {
    const fname = req.params.filename;
    const filepath = path.join(STORAGE_PATHS.keys, `${fname}.key`);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Key file not found' });

    res.download(filepath, `${fname}.key`);
    auditLog(req.user.email, 'DOWNLOAD_KEY', `${fname}.key`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decrypt file
app.post('/api/decrypt', verifyToken, upload.fields([{ name: 'file' }, { name: 'keyFile' }]), async (req, res) => {
  try {
    if (!req.files || !req.files.file || !req.files.keyFile) {
      return res.status(400).json({ error: 'Encrypted file and key file required' });
    }

    const encryptedData = fs.readFileSync(req.files.file[0].path);
    const keyData = JSON.parse(fs.readFileSync(req.files.keyFile[0].path, 'utf-8'));

    // Decrypt AES key using RSA
    const { privateKey } = getRSAKeys(req.user.email);
    const aesKeyHex = decryptAESKeyWithRSA(keyData.encryptedKey, privateKey);
    const aesKey = Buffer.from(aesKeyHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      aesKey,
      encryptedData.slice(0, 16)
    );

    decipher.setAuthTag(encryptedData.slice(16, 32));
    
    let decrypted = decipher.update(encryptedData.slice(32));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Always return plaintext as UTF-8
    const filename = `decrypted-${Date.now()}`;
    const filepath = path.join(STORAGE_PATHS.decrypted, filename);
    
    fs.writeFileSync(filepath, decrypted);

    auditLog(req.user.email, 'DECRYPT', filename);

    res.json({
      ok: true,
      filename,
      plaintext: decrypted.toString('utf-8'),
      downloadUrl: `/api/download/${filename}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Decrypt error:', err);
    res.status(500).json({ error: 'Decryption failed' });
  }
});

// Download decrypted image file
app.get('/api/download-decrypted-image/:filename', verifyToken, (req, res) => {
  try {
    const filepath = path.join(STORAGE_PATHS.decryptedImages, req.params.filename);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Decrypted image not found' });

    res.download(filepath, req.params.filename);
    auditLog(req.user.email, 'DOWNLOAD_DECRYPTED_IMAGE', req.params.filename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= USER PROFILE =======================
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({
    ok: true,
    user: req.user,
    joinDate: new Date().toISOString()
  });
});

// ======================= HEALTH CHECK =======================
app.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

// ======================= AUDIT LOGGING =======================
function auditLog(user, action, target) {
  const logEntry = `[${new Date().toISOString()}] ${user} | ${action} | ${target}\n`;
  fs.appendFileSync(path.join(STORAGE_PATHS.logs, 'audit.log'), logEntry);
  
  // 🔥 Real-time AI update broadcast
  broadcastAIUpdate();
}

// ======================= AI/ANALYTICS ENDPOINTS =======================

// GET: Anomaly Detection & Security Alerts
app.get('/api/ai/anomalies', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const stats = getAnomalyStats(logPath);
    res.json({ ok: true, ...stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Activity Summary
app.get('/api/ai/summary', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const summary = getFormattedSummary(logPath);
    res.json({ ok: true, ...summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Activity Trend (last N hours)
app.get('/api/ai/trend', verifyToken, (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const trend = getActivityTrend(logPath, hours);
    res.json({ ok: true, trend, hours });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: AI Security Score
app.get('/api/ai/score', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const score = calculateSecurityScore(logPath);
    res.json({ ok: true, score });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: AI Risk Prediction
app.get('/api/ai/predict', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const prediction = predictRisk(logPath);
    res.json({ ok: true, prediction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Threat Simulation
app.get('/api/ai/simulate', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const simulation = simulateThreat(logPath);
    res.json({ ok: true, simulation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: AI Security Chatbot
app.post('/api/ai/chat', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message required' });
    }

    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const summary = summarizeLogs(logPath);
    const alerts = detectAnomalies(logPath);
    const score = calculateSecurityScore(logPath);
    const prediction = predictRisk(logPath);
    const simulation = simulateThreat(logPath);
    const logsData = { summary, alerts, score, prediction, simulation, timestamp: new Date().toISOString() };

    let reply;
    let source = 'openai';

    if (!process.env.OPENAI_API_KEY) {
      source = 'fallback';
      const response = getResponse(message, logPath);
      reply = response.message;
    } else {
      try {
        reply = await askAI(message, logsData);
      } catch (err) {
        console.error('OpenAI error:', err);
        source = 'fallback';
        const response = getResponse(message, logPath);
        reply = response.message;
      }
    }

    res.json({
      ok: true,
      query: message,
      reply,
      source
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Raw audit logs (for advanced users)
app.get('/api/ai/logs', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    
    if (!fs.existsSync(logPath)) {
      return res.json({ ok: true, logs: [] });
    }

    const lines = fs.readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .slice(-100); // Return last 100 entries

    res.json({ ok: true, logs: lines, count: lines.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADVANCED AI ANALYTICS ====================

// AI Performance Monitoring System
const aiMonitoring = {
  lastAnalysis: null,
  performanceMetrics: {
    totalAnalyses: 0,
    alertsTriggered: 0,
    predictionsMade: 0,
    accuracyRate: 95, // Simulated accuracy
    falsePositives: 0,
    responseTime: [],
    uptime: Date.now()
  },
  activeAlerts: new Set(),
  riskHistory: [],
  modelMetrics: {
    trainingDataPoints: 0,
    lastRetrained: new Date().toISOString(),
    confidence: 0.87
  }
};

// Update AI monitoring metrics
function updateAIMonitoring(score, prediction, alerts) {
  const startTime = Date.now();
  
  aiMonitoring.lastAnalysis = new Date().toISOString();
  aiMonitoring.performanceMetrics.totalAnalyses++;
  
  if (alerts.length > 0) {
    aiMonitoring.performanceMetrics.alertsTriggered++;
    alerts.forEach(alert => aiMonitoring.activeAlerts.add(alert.id || alert.description));
  }
  
  aiMonitoring.performanceMetrics.predictionsMade++;
  
  // Track risk history
  aiMonitoring.riskHistory.push({
    timestamp: new Date().toISOString(),
    score: score.score,
    risk: prediction.risk,
    alerts: alerts.length,
    confidence: Math.random() * 0.3 + 0.7 // Simulated confidence
  });
  
  // Keep only last 200 entries
  if (aiMonitoring.riskHistory.length > 200) {
    aiMonitoring.riskHistory.shift();
  }
  
  // Calculate response time
  const responseTime = Date.now() - startTime;
  aiMonitoring.performanceMetrics.responseTime.push(responseTime);
  if (aiMonitoring.performanceMetrics.responseTime.length > 100) {
    aiMonitoring.performanceMetrics.responseTime.shift();
  }
  
  // Broadcast real-time updates via WebSocket
  io.emit('ai-update', {
    score,
    prediction,
    alerts: alerts.length,
    timestamp: aiMonitoring.lastAnalysis,
    metrics: {
      responseTime,
      confidence: aiMonitoring.riskHistory[aiMonitoring.riskHistory.length - 1].confidence
    }
  });
}

// GET: AI Performance Metrics
app.get('/api/ai/performance', verifyToken, (req, res) => {
  try {
    const avgResponseTime = aiMonitoring.performanceMetrics.responseTime.length > 0 
      ? aiMonitoring.performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / aiMonitoring.performanceMetrics.responseTime.length 
      : 0;
    
    res.json({
      ok: true,
      metrics: {
        ...aiMonitoring.performanceMetrics,
        avgResponseTime: Math.round(avgResponseTime),
        uptime: Math.floor((Date.now() - aiMonitoring.performanceMetrics.uptime) / 1000)
      },
      lastAnalysis: aiMonitoring.lastAnalysis,
      activeAlerts: Array.from(aiMonitoring.activeAlerts),
      riskHistory: aiMonitoring.riskHistory.slice(-50),
      modelMetrics: aiMonitoring.modelMetrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: AI Model Training Data
app.get('/api/ai/training-data', verifyToken, (req, res) => {
  try {
    const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
    const summary = summarizeLogs(logPath);
    const trend = getActivityTrend(logPath, 168); // Last 7 days
    
    // Generate synthetic training data for demonstration
    const trainingData = trend.map((item, index) => ({
      id: index + 1,
      timestamp: item.hour,
      features: {
        downloads: item.download,
        encryptions: item.encrypt,
        decryptions: item.decrypt,
        total: item.total
      },
      label: item.download > 10 ? 'high_risk' : item.download > 5 ? 'medium_risk' : 'low_risk',
      confidence: Math.random() * 0.4 + 0.6
    }));
    
    res.json({
      ok: true,
      trainingData,
      totalSamples: trainingData.length,
      lastUpdated: aiMonitoring.modelMetrics.lastRetrained
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Retrain AI Model (simulated)
app.post('/api/ai/retrain', verifyToken, (req, res) => {
  try {
    // Simulate model retraining
    setTimeout(() => {
      aiMonitoring.modelMetrics.lastRetrained = new Date().toISOString();
      aiMonitoring.modelMetrics.confidence = Math.min(0.95, aiMonitoring.modelMetrics.confidence + 0.02);
      aiMonitoring.modelMetrics.trainingDataPoints += 50;
    }, 2000);
    
    res.json({
      ok: true,
      message: 'AI model retraining initiated',
      estimatedTime: '2 seconds',
      status: 'running'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ======================= STATIC FILES =======================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======================= SOCKET.IO EVENT HANDLERS =======================
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ======================= HELPER: Broadcast AI Updates =======================
function broadcastAIUpdate() {
  const logPath = path.join(STORAGE_PATHS.logs, 'audit.log');
  
  try {
    const summary = summarizeLogs(logPath);
    const alertsData = getAnomalyStats(logPath);
    const scoreData = calculateSecurityScore(logPath);
    const predictionData = predictRisk(logPath);
    const simulationData = simulateThreat(logPath);

    // Update monitoring system
    updateAIMonitoring(scoreData, predictionData, alertsData.alerts || []);

    io.emit('ai_update', {
      timestamp: new Date().toISOString(),
      summary: {
        encrypt: summary.encrypt,
        decrypt: summary.decrypt,
        download: summary.download,
        downloadEncrypted: summary.downloadEncrypted,
        downloadKey: summary.downloadKey,
        total: summary.total,
        uniqueUsers: summary.uniqueUsers
      },
      alerts: alertsData,
      score: scoreData,
      prediction: predictionData,
      simulation: simulationData,
      metrics: {
        totalAnalyses: aiMonitoring.performanceMetrics.totalAnalyses,
        avgResponseTime: aiMonitoring.performanceMetrics.responseTime.length > 0 
          ? aiMonitoring.performanceMetrics.responseTime.reduce((a, b) => a + b, 0) / aiMonitoring.performanceMetrics.responseTime.length 
          : 0,
        modelConfidence: aiMonitoring.modelMetrics.confidence
      }
    });
  } catch (err) {
    console.error('Error broadcasting AI update:', err);
  }
}

// ======================= KEY ROTATION SYSTEM =======================
async function rotateUserKeys(email) {
  try {
    // Generate new RSA keys
    const newKeys = rotateRSAKeys(email);
    
    // Re-encrypt all AES keys for this user
    const keyFiles = fs.readdirSync(STORAGE_PATHS.keys).filter(f => f.endsWith('.key'));
    
    for (const keyFile of keyFiles) {
      const keyPath = path.join(STORAGE_PATHS.keys, keyFile);
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      
      if (keyData.owner === email) {
        // Decrypt AES key with old private key (but since we rotated, we need to handle this carefully)
        // For simplicity, assume we have the old private key temporarily
        // In production, you'd need to store old keys or have a transition period
        
        // For now, just update version
        keyData.version = (keyData.version || 1) + 1;
        keyData.rotatedAt = new Date().toISOString();
        fs.writeFileSync(keyPath, JSON.stringify(keyData, null, 2));
      }
    }
    
    console.log(`✅ Rotated keys for user: ${email}`);
  } catch (err) {
    console.error('Key rotation error:', err);
  }
}

// Schedule key rotation every 30 days (adjust as needed)
cron.schedule('0 0 1 * *', async () => {
  console.log('🔄 Starting scheduled key rotation...');
  
  // Get all users from secretCode data
  const usersFile = path.join(__dirname, 'data', 'users.json');
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    for (const user of users) {
      await rotateUserKeys(user.email);
    }
  }
});

// ======================= IMAGE VAULT ROUTES =======================
app.post('/api/image/encrypt', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const password = req.body.password;

    if (!file || !password) {
      return res.status(400).json({ error: 'Image file and password required' });
    }

    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.encimg`;
    const outPath = path.join(STORAGE_PATHS.encryptedImages, filename);

    const { previewPath } = await encryptImage(file.path, outPath, password);

    auditLog(req.user.email, 'IMAGE_ENCRYPT', filename);

    res.json({
      ok: true,
      filename,
      preview: previewPath ? path.basename(previewPath) : null,
      downloadUrl: `/api/download-encrypted-image/${filename}`,
      previewUrl: previewPath ? `/api/download-preview/${path.basename(previewPath)}` : null
    });
  } catch (err) {
    console.error('Image encrypt error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/image/decrypt', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const password = req.body.password;

    if (!file || !password) {
      return res.status(400).json({ error: 'Encrypted file and password required' });
    }

    const filename = `decrypted-image-${Date.now()}.png`;
    const outPath = path.join(STORAGE_PATHS.decryptedImages, filename);

    await decryptImage(file.path, outPath, password);

    auditLog(req.user.email, 'IMAGE_DECRYPT', filename);

    res.json({
      ok: true,
      filename,
      downloadUrl: `/api/download-decrypted-image/${filename}`
    });
  } catch (err) {
    console.error('Image decrypt error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Download image preview
app.get('/api/download-preview/:filename', verifyToken, (req, res) => {
  try {
    const fname = req.params.filename;
    const filepath = path.join(STORAGE_PATHS.encryptedImages, fname);
    if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Preview not found' });

    res.download(filepath, fname);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start HTTP server for Express + Socket.IO
server.listen(PORT, () => {
  console.log(`🚀 SecureFile dashboard running on http://localhost:${PORT}`);
  console.log('🔌 Socket.IO ready');
});
