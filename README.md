# 🔐 SecureFile - Professional File Encryption Dashboard

**SecureFile is a lightweight, modern file encryption dashboard built with Node.js, Express, Google OAuth, JWT authentication, and AES-256-GCM encryption.**

![Status](https://img.shields.io/badge/status-ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Features

### 🔐 Security
- **Hybrid Encryption**: AES-256-GCM for files + RSA-2048 for key encryption (military-grade)
- **Key Rotation**: Automatic RSA key rotation every 30 days with versioned storage
- **Google OAuth 2.0**: Seamless one-click authentication
- **JWT Sessions**: Secure token-based authentication
- **Secret-Code Protection**: Multi-layer access control for key operations
- **Audit Logging**: Complete activity tracking to `/shared/logs/`
- **Encrypted Storage**: All sensitive data encrypted at rest

### 💎 User Experience
- Modern SPA dashboard with responsive layout
- Dark and light theme support
- Real-time activity updates via Socket.IO
- Secure copy flow for AES keys
- Clear success/error feedback and spinner states

### 📁 File Management
- Upload files to encrypt and download encrypted output
- Encrypt plain text directly from the dashboard
- Decrypt `.enc` files using a 256-bit AES key
- Download decrypted files safely through JWT authorization

### 🏗️ Deployment
- Docker Compose support for the web dashboard and CLI helpers
- Persistent local Docker volumes for keys, encrypted files, decrypted files, and logs

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Google OAuth application credentials
- Node.js 18.x for local development (optional)

### 1. Configure Environment

1. Copy the sample environment file:
   ```bash
   cd web-dashboard
   copy .env.example .env
   ```
2. Edit `web-dashboard/.env` and replace the placeholders with your real values.
3. In the repository root, ensure `.env` contains `JWT_SECRET`, `MASTER_PASSWORD`, and Google OAuth values if you use Docker Compose.

> The `web-dashboard` service reads `web-dashboard/.env`, while `docker-compose.yml` uses root environment variables for container startup.

### 2. Build and Start

From the project root:
```bash
docker compose up --build -d
```

### 3. Open the App

Visit:
```text
http://localhost:8080
```

### 4. Login and Secure Your Account

- Click **Sign in with Google**
- After login, the app prompts you to set a **secret code**
- This secret code protects AES key copy operations and key access

---

## 📖 How to Use

### Encrypt a File
1. Sign in using Google OAuth.
2. Accept the document terms.
3. Choose a file and click **Upload & Encrypt Document**.
4. Save the returned AES key securely.
5. Download the encrypted `.enc` file.

### Encrypt Text
1. Paste text into the input field.
2. Click **Encrypt Text**.
3. Save the AES key and generated filename.

### Copy the AES Key
- After encryption, click **Copy Key**.
- Enter your secret code to authorize the key copy.
- The AES key is never displayed as plain text in the UI.

### Secure Image Vault

1. Go to **🖼️ Images** tab
2. **Encrypt Image**:
   - Upload an image file
   - Enter a strong password
   - Click "Encrypt & Protect Image"
   - View the distorted preview (for security demonstration)
   - Download the `.encimg` file

3. **Decrypt Image**:
   - Upload the `.encimg` file
   - Enter the password
   - Click "Decrypt & Restore Image"
   - Download the original restored image

> The Image Vault uses dual-layer protection: visual distortion makes images unrecognizable, while AES-256-GCM ensures cryptographic security. Only this system can decrypt `.encimg` files.

---

## 🧩 Docker Services

### web-dashboard
- Port: `8080`
- Service: Express dashboard, Google OAuth, AES key management
- Volumes:
  - `encryption-keys:/app/storage/keys`
  - `encrypted-files:/app/storage/encrypted`
  - `decrypted-files:/app/storage/decrypted`
  - `audit-logs:/app/storage/logs`

### encrypt-service
- Runs on demand with CLI entrypoint
- Shares `encryption-keys` and `encrypted-files`

### decrypt-service
- Runs on demand with CLI entrypoint
- Shares `encryption-keys`, `encrypted-files`, and `decrypted-files`

---

## 📌 Important Notes

- **Hybrid Security**: Files are encrypted with AES, and AES keys are protected with RSA encryption.
- **Key Files**: Download and store `.key` files securely - they contain your encrypted AES keys.
- **Image Vault**: Uses dual-layer protection (visual distortion + AES) for images. Only this system can read `.encimg` files.
- **Decryption**: Requires both `.enc` and `.key` files for files; `.encimg` files for images.
- **Key Rotation**: RSA keys rotate automatically every 30 days for enhanced security.
- The secret code protects sensitive operations like key downloads.
- Audit logs are stored in `audit-logs` Docker volume.
- Use `docker compose down` to stop the environment.

---

## 📍 Folder Layout

- `web-dashboard/` — Main dashboard server and frontend
- `encrypt-service/` — CLI helper for encryption
- `decrypt-service/` — CLI helper for decryption
- `docker-compose.yml` — Compose orchestration

---

## 🔧 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Dashboard UI |
| `GET` | `/health` | Health check |
| `POST` | `/api/encrypt` | Encrypt file or text |
| `POST` | `/api/decrypt` | Decrypt encrypted file (requires .enc and .key files) |
| `GET` | `/api/download/:filename` | Download decrypted file |
| `POST` | `/api/set-secret` | Set secret code |
| `POST` | `/api/verify-secret` | Verify secret code |
| `GET` | `/api/secret-code/status` | Check secret-code setup |

---

---\n\n## 🔒 Security\n\n- **Hybrid Encryption**: AES-256-GCM + RSA-2048 (military-grade)\n- **Automatic Key Rotation**: RSA keys rotated every 30 days\n- Secret code protection for key operations\n- JWT tokens for API authorization\n- Google OAuth for user login\n- Secure local Docker volumes for keys and files\n\n### Encryption Details\n1. **File Encryption**: AES-256-GCM with random IV and auth tag\n2. **Key Protection**: AES keys encrypted with RSA public key\n3. **Key Rotation**: Scheduled RSA key regeneration with versioning\n4. **Authentication**: Google OAuth 2.0 (no password storage), JWT tokens with 24-hour expiration, Secure HTTP-only cookies

3. **Storage**
   - Encrypted volumes for sensitive data
   - Separate directory structure for keys & files
   - Audit log tracking all operations

4. **Transport**
   - HTTPS in production (configure Nginx/reverse proxy)
   - Content-Type validation
   - CORS protection

---

## 📊 File Format

### Encrypted File Structure
```
[16 bytes] Initialization Vector (IV)
[16 bytes] GCM Authentication Tag
[variable] Encrypted Payload (AES-256-GCM)
```

### How It Works
1. Generate random 256-bit AES key
2. Generate random 128-bit IV
3. Encrypt data with AES-256-GCM
4. Combine IV + Auth Tag + Ciphertext
5. Save as `.enc` file

---

## 🛠️ Configuration

### Production Deployment

1. **Set Strong Secrets** in `.env`:
   ```env
   JWT_SECRET=your-long-random-string
   MASTER_PASSWORD=your-strong-password
   DB_PASSWORD=your-db-password
   ```

2. **Enable HTTPS** (via Nginx reverse proxy):
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. **Update OAuth Redirect URI**:
   ```
   https://yourdomain.com/auth/google/callback
   ```

4. **Scale Services**:
   ```bash
   docker compose up --scale encrypt-service=3 -d
   ```

---

## 📝 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` | Go to Encrypt |
| `Ctrl+2` | Go to Decrypt |
| `Ctrl+3` | Go to Profile |

---

## 🐛 Troubleshooting

### Google OAuth Not Working
- Verify Client ID & Secret in `.env`
- Check Authorized Redirect URI matches exactly
- Ensure redirect URI is `http://localhost:8080/auth/google/callback`

### Port 8080 Already in Use
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Files Not Encrypting
- Check volume permissions: `docker volume inspect encryption-keys`
- Verify file size < 100MB
- Check Docker logs: `docker logs secure-file-web-dashboard`

---

## 📞 Support

For issues or questions:
1. Check Docker logs: `docker compose logs -f`
2. Verify environment variables: `echo $GOOGLE_CLIENT_ID`
3. Test connectivity: `curl http://localhost:8080/health`

---

## 📄 License

MIT License - Free for personal & commercial use

---

## 🎉 Enjoy!

Your professional-grade file encryption system is ready! 

**Next Steps:**
1. ✅ Start services: `docker compose up -d`
2. ✅ Configure Google OAuth
3. ✅ Visit `http://localhost:8080`
4. ✅ Encrypt your first file!

**Pro Tips:**
- Always save your AES keys in a secure location
- Use strong master password
- Enable 2FA on your Google account for OAuth
- Regularly monitor audit logs

---

**Made with ❤️ for secure file encryption** | v2.0.0 | Production Ready
