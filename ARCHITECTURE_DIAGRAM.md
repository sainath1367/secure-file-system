# 🏗️ SYSTEM ARCHITECTURE DIAGRAM

## Complete Real-Time AI Security System

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      SECURE FILE SYSTEM 2.0                             ║
║                   WITH REAL-TIME AI MONITORING                          ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                           BROWSER / CLIENT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      FRONTEND (app.js)                           │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  ┌─────────────────┐    ┌─────────────────┐                    │  │
│  │  │   LOGIN PAGE    │    │  DASHBOARD      │                    │  │
│  │  │   (Google       │───▶│  ┌─────────────┐│                    │  │
│  │  │    OAuth)       │    │  │ 📄 Document││ ◀─┐                │  │
│  │  └─────────────────┘    │  │ 🔓 Decrypt ││   │                │  │
│  │                         │  │ 🤖 AI      ││   │                │  │
│  │                         │  │ 👤 Profile ││   │                │  │
│  │                         │  └─────────────┘│   │ Page Switching │  │
│  │                         └─────────────────┘   │                │  │
│  │                                              │                │  │
│  │  ┌──────────────────────────────────────────┘                │  │
│  │  │                                                            │  │
│  │  ▼                                                            │  │
│  │  ╔══════════════════════════════════════════════════════════╗│  │
│  │  ║ 🤖 AI ASSISTANT PAGE (REAL-TIME)                        ║│  │
│  │  ╠══════════════════════════════════════════════════════════╣│  │
│  │  ║                                                          ║│  │
│  │  ║ 🟢 Live [pulsing indicator]                            ║│  │
│  │  ║                                                          ║│  │
│  │  ║ ┌─────────────────────────────────────────────────────┐ ║│  │
│  │  ║ │ 📊 SYSTEM ANALYTICS (Real-Time Update)            │ ║│  │
│  │  ║ ├─────────────────────────────────────────────────────┤ ║│  │
│  │  ║ │ [💜 Encrypt:10]  [💗 Decrypt:3]                    │ ║│  │
│  │  ║ │ [💙 Download:5]  [💚 Users:2]  ◀─ PULSE ANIMATION │ ║│  │
│  │  ║ └─────────────────────────────────────────────────────┘ ║│  │
│  │  ║                                                          ║│  │
│  │  ║ ┌──────────────────┐  ┌────────────────────────────────┐ ║│  │
│  │  ║ │ 🔴 ALERTS        │  │ 💬 AI CHAT                     │ ║│  │
│  │  ║ ├──────────────────┤  ├────────────────────────────────┤ ║│  │
│  │  ║ │🚨 High: 18      │  │ User: "Suspicious activity?"   │ ║│  │
│  │  ║ │  downloads      │  │ AI: "🔴 2 Alerts detected..."  │ ║│  │
│  │  ║ │⚠️  Med: Unusual│  │ [Input] [Send]                 │ ║│  │
│  │  ║ │  pattern       │  │                                │ ║│  │
│  │  ║ └──────────────────┘  └────────────────────────────────┘ ║│  │
│  │  ║                                                          ║│  │
│  │  ╚══════════════════════════════════════════════════════════╝│  │
│  │                         ↑↓ WebSocket ↑↓                      │  │
│  │                    (Real-Time 2-Way)                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         ║ WebSocket Connection (Socket.IO)
         ║ Persistent & Bidirectional
         ║
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        NODE.JS SERVER                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─── HTTP ROUTES ───────────────────────────────────────────────┐  │
│ │ GET  /                      → Serve index.html               │  │
│ │ GET  /auth/google           → OAuth login                    │  │
│ │ POST /api/encrypt           → Encrypt file/text              │  │
│ │ POST /api/decrypt           → Decrypt file                   │  │
│ │ GET  /api/ai/summary        → Get activity stats             │  │
│ │ GET  /api/ai/anomalies      → Get security alerts            │  │
│ │ POST /api/ai/chat           → Ask AI assistant               │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                          ↑                                          │
│            ┌─────────────┴──────────────┐                           │
│            │                            │                           │
│   ┌────────▼────────┐        ┌──────────▼────────┐                 │
│   │ ENCRYPT ROUTE   │        │ DECRYPT ROUTE     │                 │
│   ├─────────────────┤        ├───────────────────┤                 │
│   │ 1. File upload  │        │ 1. Read encrypted │                 │
│   │ 2. Generate key │        │ 2. Use AES key    │                 │
│   │ 3. AES-256-GCM  │        │ 3. AES-256-GCM    │                 │
│   │ 4. Store files  │        │ 4. Return plain   │                 │
│   │ 5. auditLog()   │────┐   │ 5. auditLog()     │────┐            │
│   │ 6. Encrypt: +1  │    │   │ 6. Decrypt: +1    │    │            │
│   └─────────────────┘    │   │ 7. Download: +1   │    │            │
│                          │   └───────────────────┘    │            │
│                          │                            │            │
│                          └────────────┬─────────────────┘            │
│                                       │                             │
│                                       ▼                             │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │ auditLog() FUNCTION (CRITICAL)                              │  │
│   ├───────────────────────────────────────────────────────────────┤  │
│   │ Writes: [timestamp] user | ACTION | target                  │  │
│   │ To File: /app/storage/logs/audit.log                        │  │
│   │                                                              │  │
│   │ THEN immediately calls:                                      │  │
│   │   broadcastAIUpdate() ◀─── THIS TRIGGERS REAL-TIME           │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                       │                             │
│                                       ▼                             │
│   ┌───────────────────────────────────────────────────────────────┐  │
│   │ broadcastAIUpdate() - REAL-TIME ENGINE                       │  │
│   ├───────────────────────────────────────────────────────────────┤  │
│   │ 1. Read audit.log                                            │  │
│   │ 2. Parse logs → Extract stats                               │  │
│   │ 3. Call AI modules:                                          │  │
│   │    ├─ summarizeLogs()  → Get activity counts                │  │
│   │    └─ getAnomalyStats() → Detect threats                    │  │
│   │ 4. Create payload:                                           │  │
│   │    {                                                         │  │
│   │      summary: { encrypt: 10, decrypt: 3, ... },             │  │
│   │      alerts: [ { severity, message }, ... ]                 │  │
│   │    }                                                         │  │
│   │ 5. BROADCAST TO ALL CLIENTS:                                │  │
│   │    io.emit('ai_update', payload) ◀─── ALL USERS GET THIS   │  │
│   └───────────────────────────────────────────────────────────────┘  │
│                                       │                             │
│          ┌────────────────────────────┴────────────────────┐         │
│          │  Socket.IO Server Instance (io)                │         │
│          │  - Connected clients list                      │         │
│          │  - Event broadcasting                          │         │
│          │  - Connection handling                         │         │
│          └────────────────────────────────────────────────┘         │
│                                       │                             │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ WebSocket Broadcast
         │ 'ai_update' event
         │ Latency: ~50-100ms total
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ALL CONNECTED CLIENTS RECEIVE INSTANTLY                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ socket.on('ai_update', (data) => {                                 │
│   updateAIDashboardRealTime(data);  // Update UI                   │
│   // Stats change: 9 → 10 (with pulse animation)                   │
│   // Alerts update: Add new alert if detected                      │
│   // No refresh needed!                                            │
│ });                                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘


🔑 KEY FLOW: User Action → Audit Log → AI Analysis → WebSocket Broadcast → All UIs Update (50-100ms)
```

---

## 🤖 AI MODULE ARCHITECTURE

```
┌────────────────────────────────────────────────────────────┐
│              AI ANALYSIS ENGINE                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  INPUT: audit.log                                         │
│  [2026-04-16T10:30:00Z] user@gmail.com | ENCRYPT | file1 │
│  [2026-04-16T10:31:00Z] user@gmail.com | DOWNLOAD| file2 │
│  [2026-04-16T10:32:00Z] user@gmail.com | ENCRYPT | file3 │
│  ...                                                       │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  PROCESSING:                                              │
│                                                            │
│  ┌─ anomaly.js ────────────────────────────────────────┐  │
│  │ parseLogs()                                         │  │
│  │   ├─ Extract user, action, target from each line   │  │
│  │   └─ Create userActivity = {user: {encrypt: X...}} │  │
│  │                                                    │  │
│  │ detectAnomalies() - RULE-BASED DETECTION           │  │
│  │   ├─ IF download > 15 → Alert: "Excessive down"   │  │
│  │   ├─ IF encrypt > 20  → Alert: "Too much encryp"  │  │
│  │   ├─ IF download/decrypt > 3 → Alert: "Pattern"   │  │
│  │   └─ IF key_download > 3 w/o decrypt → Alert      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ summary.js ─────────────────────────────────────────┐  │
│  │ summarizeLogs()                                     │  │
│  │   ├─ Count each action: encrypt, decrypt, download │  │
│  │   ├─ Extract unique users                          │  │
│  │   └─ Return totals: {encrypt: 10, decrypt: 3...}  │  │
│  │                                                    │  │
│  │ getActivityTrend()                                 │  │
│  │   └─ Group by hour: [{hour, encrypt, decrypt...}] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ chatbot.js ──────────────────────────────────────────┐ │
│  │ getResponse(message)                                │ │
│  │   ├─ Parse intent: "summary", "suspicious", etc    │ │
│  │   ├─ Call relevant module based on intent          │ │
│  │   └─ Return formatted natural language response    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  OUTPUT:                                                   │
│  {                                                         │
│    summary: { encrypt: 10, decrypt: 3, download: 5... },  │
│    alerts: [                                              │
│      {                                                    │
│        severity: "HIGH",                                 │
│        message: "🚨 Excessive downloads detected",        │
│        user: "user@gmail.com",                           │
│        type: "excessive_downloads"                       │
│      }                                                   │
│    ],                                                     │
│    totalAlerts: 2,                                        │
│    timestamp: "2026-04-16T10:35:00Z"                     │
│  }                                                        │
│                                                           │
└────────────────────────────────────────────────────────────┘
```

---

## 🌐 DATA FLOW EXAMPLE (Live Scenario)

```
TIME: 10:30:05

USER ACTION:
User clicks "🔒 Encrypt Text"
Input: "Hello World"

           ↓↓↓ SERVER SIDE ↓↓↓

01) encryptHandler()
    • Generate AES-256 key
    • Encrypt "Hello World" with GCM
    • Save to /app/storage/encrypted/
    • Save key to /app/storage/keys/

02) auditLog(user@email.com, 'ENCRYPT', 'filename')
    • Write to audit.log
    • [timestamp] user@email.com | ENCRYPT | filename

03) broadcastAIUpdate() TRIGGERED AUTOMATICALLY
    • Read entire audit.log
    • Parse all entries
    • Call summarizeLogs() → Returns {encrypt: 11, ...}
    • Call getAnomalyStats() → Returns {alerts: [...]}
    • Create payload with summary + alerts
    • Send via io.emit('ai_update', payload)

04) WebSocket Broadcast
    • 🔌 Send to ALL connected clients instantly
    • Latency: ~50-100ms from action to network send

           ↓↓↓ CLIENT SIDE (Instant) ↓↓↓

05) socket.on('ai_update') EVENT LISTENER FIRES
    • Receives: { summary, alerts }
    • Calls: updateAIDashboardRealTime(data)

06) UI UPDATE
    • stat-encrypt.textContent = 11 (changed from 10)
    • Add pulse animation (CSS @keyframe)
    • Check alerts, add/remove from panel
    • Update connection status

07) USER SEES
    • "Encryptions: 11" ✨ (with pulse effect)
    • No page refresh
    • Immediate feedback

TOTAL TIME: ~100ms from click to UI update ⚡
```

---

## 🔒 Security Model

```
┌─────────────────────────────────────────┐
│         AUTHENTICATION LAYER            │
├─────────────────────────────────────────┤
│                                         │
│ 1. User clicks "Sign in with Google"    │
│ 2. Redirected to Google OAuth endpoint  │
│ 3. User approves → Google redirects     │
│ 4. Server receives code                 │
│ 5. Server exchanges code for access     │
│ 6. Server creates JWT token             │
│ 7. JWT sent to client                   │
│ 8. Client stores in localStorage        │
│ 9. All requests: Authorization: Bearer  │
│    [JWT_TOKEN]                          │
│                                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      ENCRYPTION LAYER (AES-256)         │
├─────────────────────────────────────────┤
│                                         │
│ File Encryption:                        │
│ • Random 256-bit key generated          │
│ • Random 128-bit IV (nonce)             │
│ • Data encrypted with AES-256-GCM       │
│ • Authentication tag prevents tampering │
│ • Key stored separately in keys volume  │
│ • Format: [IV | AuthTag | Encrypted]    │
│                                         │
│ Decryption:                             │
│ • User provides 256-bit key             │
│ • Extract IV from file                  │
│ • Verify authentication tag             │
│ • Decrypt with AES-256-GCM              │
│                                         │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      AUDIT & MONITORING LAYER           │
├─────────────────────────────────────────┤
│                                         │
│ Every action logged:                    │
│ [timestamp] user | ACTION | target      │
│                                         │
│ AI monitors for:                        │
│ • Excessive downloads (>15)             │
│ • Unusual encrypt patterns (>20)        │
│ • Suspicious access patterns            │
│ • Key theft attempts                    │
│                                         │
│ Alerts sent to dashboard in real-time   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📈 Real-Time Update Pipeline Timing

```
User Action
    │
    ├─ 0ms     Action started
    ├─ 5ms     File encrypted
    ├─ 10ms    auditLog() called
    ├─ 15ms    Log file written to disk
    ├─ 20ms    broadcastAIUpdate() starts
    ├─ 30ms    AI analysis (parse logs + detection)
    ├─ 40ms    io.emit() sends payload
    ├─ 50ms    Client receives WebSocket packet
    ├─ 60ms    socket.on() listener fires
    ├─ 70ms    updateAIDashboardRealTime() executes
    ├─ 80ms    DOM updated with new stats
    ├─ 90ms    CSS animation starts
    │
    └─ 100ms   TOTAL LATENCY (FEELS INSTANT!)
              Stats change animated on screen ✨
```

---

**This architecture ensures that every user action triggers immediate analysis and real-time dashboard updates without any page refresh or manual polling!** 🚀
