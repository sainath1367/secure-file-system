# 🚀 SecureFile - Setup & Deployment Guide

## 📋 Quick Setup (5 Minutes)

### Step 1: Configure Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "SecureFile" → Create
4. Go to "APIs & Services" → "OAuth consent screen"
5. Choose "External" → Create
6. Fill out the consent screen:
   - User Support Email: your-email@gmail.com
   - Developer Contact: your-email@gmail.com
7. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
8. Choose "Web application"
9. Name: "SecureFile Web"
10. Add Authorized Redirect URI:
    ```
    http://localhost:8080/auth/google/callback
    ```
11. Copy the Client ID and Secret

### Step 2: Update .env

Edit `.env` file:
```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
JWT_SECRET=GenerateRandomStringHere123!@#
MASTER_PASSWORD=YourMasterPassword123!
DB_PASSWORD=StrongDBPassword123!
```

### Step 3: Start Docker Services

```bash
cd c:\Users\nukam\Downloads\secure-file-system

# Build and start all services
docker compose up --build -d

# Wait 10 seconds for services to initialize
# Then verify:
docker compose ps

# You should see:
# - secure-file-web-dashboard  (Up)
# - secure-file-encrypt-service (Up)
# - secure-file-decrypt-service (Up)
# - secure-file-redis           (Up)
# - secure-file-db              (Up)
```

### Step 4: Access the Application

1. Open browser: `http://localhost:8080`
2. Click "Sign in with Google"
3. You're logged in! 🎉

---

## 💡 Features Overview

### 🔒 Encrypt Page
- **Upload & Encrypt File**: Drag-drop or click to upload any file
  - Generates AES-256 encryption key
  - Returns encrypted `.enc` file + downloadable key
  
- **Encrypt Text**: Direct text input
  - Encrypt any text instantly
  - Copy key with one click
  - Download encrypted file

### 🔓 Decrypt Page
- **Upload Encrypted File**: Select your `.enc` file
- **Paste AES Key**: Paste the key from encryption
- **One-Click Decrypt**: Get plaintext or download file
- **Preview Support**: See text immediately

### 👤 Profile Page
- View your Google account info
- See join date and email
- Logout button

### 🎨 Theme Support
- Toggle Dark/Light mode with 🌙 button
- Smooth transitions between themes
- Professional color scheme

---

## 📁 File Organization

After first run, Docker volumes created automatically:

```
encryption-keys/
  ├── user123_key_1.key
  ├── user123_key_2.key
  └── ...

encrypted-files/
  ├── file1.pdf.enc
  ├── document.docx.enc
  └── ...

decrypted-files/
  ├── file1.pdf
  ├── plaintext.txt
  └── ...

audit-logs/
  └── audit.log (all operations logged)
```

---

## 🧪 Usage Examples

### Example 1: Encrypt a PDF

1. Go to **🔒 Encrypt** tab
2. Click upload area
3. Select `sample.pdf`
4. Click **🔒 Encrypt File**
5. **Copy AES Key** and save somewhere safe
6. **Download** `.enc` file

### Example 2: Decrypt the PDF

1. Go to **🔓 Decrypt** tab
2. Upload the `.enc` file from step 6
3. Paste the AES Key you saved
4. Click **🔓 Decrypt**
5. **Download** the decrypted PDF

### Example 3: Encrypt Text

1. Go to **🔒 Encrypt** tab
2. Paste text in the "✍️ Encrypt Text" box
3. Click **🔒 Encrypt Text**
4. Copy key, note filename
5. Download or use later

---

## 🔧 Advanced Configuration

### Production Deployment

#### Using Nginx Reverse Proxy

Create `nginx.conf`:
```nginx
server {
    listen 443 ssl http2;
    server_name securefile.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

#### Update OAuth for Production

1. Update `.env`:
   ```env
   GOOGLE_CALLBACK_URL=https://securefile.example.com/auth/google/callback
   ```

2. Update Google Console:
   - Authorized Redirect URI: `https://securefile.example.com/auth/google/callback`

3. Upgrade to HTTPS only:
   ```env
   NODE_ENV=production
   ```

### Docker Compose Scaling

```bash
# Scale encrypt service to 3 instances
docker compose up --scale encrypt-service=3 -d

# Scale decrypt service
docker compose up --scale decrypt-service=2 -d
```

### Custom Storage Paths

Edit `docker-compose.yml`:
```yaml
volumes:
  - /custom/path/keys:/app/storage/keys
  - /custom/path/encrypted:/app/storage/encrypted
  - /custom/path/decrypted:/app/storage/decrypted
```

---

## 🔐 Security Checklist

- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Change `MASTER_PASSWORD` from default
- [ ] Change `DB_PASSWORD` from default
- [ ] Enable HTTPS in production
- [ ] Use environment variables, not hardcoded values
- [ ] Regular backup of encryption-keys volume
- [ ] Monitor audit logs for suspicious activity
- [ ] Update Docker images monthly
- [ ] Use strong Google account 2FA

---

## 🆘 Troubleshooting

### Issue: "EADDRINUSE: address already in use :::8080"

**Solution**:
```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
docker run -p 9090:8080 secure-file-web-dashboard
```

### Issue: Google OAuth redirect not working

**Solution**:
- Verify `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check Google Console authorized redirect URIs  exact match
- Ensure URL is exactly: `http://localhost:8080/auth/google/callback`
- Clear browser cookies and cache
- Try incognito mode

### Issue: Encryption/Decryption failing

**Solution**:
```bash
# Check logs
docker logs secure-file-web-dashboard

# Test volume permissions
docker run --rm -v encryption-keys:/keys alpine ls -la /keys

# Restart services
docker compose restart
```

### Issue: Cannot download files

**Solution**:
- Verify file exists in volume: `docker exec secure-file-web-dashboard ls /app/storage/decrypted/`
- Check browser console for errors (F12)
- Ensure file is not still being processed
- Try different browser

---

## 📊 Performance Tips

1. **Optimize File Size**
   - Compress large files before encryption
   - Use higher compression for text files

2. **Database Performance**
   - Create indexes on frequently queried columns
   - Monitor PostgreSQL performance: `docker logs secure-file-db`

3. **Redis Caching**
   - Automatically caches session tokens
   - Monitor memory: `docker logs secure-file-redis | grep memory`

4. **Network**
   - Use local storage (same machine) for fastest speeds
   - Network encryption/decryption adds latency

---

## 📈 Monitoring

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f secure-file-web-dashboard

# Last 100 lines
docker compose logs --tail 100
```

### Check System Resources

```bash
# Memory & CPU usage
docker stats

# Storage usage
docker system df
```

### Audit Log

```bash
# View audit logs (inside container)
docker exec secure-file-web-dashboard tail -f /app/storage/logs/audit.log

# Or copy to host
docker cp secure-file-web-dashboard:/app/storage/logs/audit.log ./audit.log
```

---

## 🆙 Upgrade Guide

### Update to Latest Version

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose build --no-cache

# Restart services
docker compose up -d

# Verify
docker compose ps
```

### Backup Data Before Upgrade

```bash
# Backup volumes
docker run --rm -v encryption-keys:/data -v $(pwd):/backup alpine tar czf /backup/encryption-keys-backup.tar.gz /data

docker run --rm -v encrypted-files:/data -v $(pwd):/backup alpine tar czf /backup/encrypted-files-backup.tar.gz /data

docker run --rm -v postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## 🎓 Understanding the Architecture

### Data Flow: Encryption

```
User selects file
    ↓
Upload to web-dashboard
    ↓
Generate random AES-256 key
    ↓
Generate random IV
    ↓
Encrypt with AES-256-GCM
    ↓
Save to encryption-keys volume
Save encrypted file to encrypted-files volume
    ↓
Return AES key + filename to user
    ↓
User downloads .enc file and saves AES key
```

### Data Flow: Decryption

```
User uploads .enc file + AES key
    ↓
Validate inputs
    ↓
Retrieve IV from encrypted file
    ↓
Decrypt using AES-256-GCM + saved key
    ↓
Verify authentication tag
    ↓
Save to decrypted-files volume
    ↓
Return plaintext to user or download link
```

---

## 💬 FAQ

**Q: Can I use this offline?**
A: Yes! Run on local machine with `docker compose up -d`. No internet needed after OAuth login.

**Q: How secure is AES-256-GCM?**
A: Military-grade encryption. Each file has unique key + IV, authenticated with GCM tag.

**Q: Do you store my files?**
A: Files stored in Docker volumes on YOUR machine. We don't access them.

**Q: Can I recover a file if I lose the AES key?**
A: No. The key is essential for decryption. **Always save your AES keys safely!**

**Q: What file types can I encrypt?**
A: Any file type - PDFs, images, videos, documents, etc. (up to 100MB)

**Q: Is there a file size limit?**
A: Yes, 100MB per file in web UI. CLI supports larger files.

**Q: Can multiple users use this?**
A: Yes! Each Google account gets separate sessions and encrypted storage.

---

## 🎯 Next Steps

1. ✅ Set up Google OAuth
2. ✅ Configure `.env` file
3. ✅ Run `docker compose up -d`
4. ✅ Encrypt your first file!
5. ✅ Share AES key securely
6. ✅ Decrypt and verify

---

**Your professional file encryption system is ready!** 🚀

For more help: Check logs with `docker compose logs -f`

Good luck! 🔐
