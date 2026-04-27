const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYS_DIR = '/app/keys';
const ENCRYPTED_DIR = '/app/encrypted';
const DECRYPTED_DIR = '/app/decrypted';
const SHARED_DIR = '/shared';

// Ensure directories exist
[KEYS_DIR, ENCRYPTED_DIR, DECRYPTED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function decryptFile(encFilePath, keyPath) {
  try {
    // Read encrypted file and key
    if (!fs.existsSync(encFilePath)) {
      console.error(`File not found: ${encFilePath}`);
      process.exit(1);
    }

    const encryptedData = fs.readFileSync(encFilePath);
    const aesKeyB64 = fs.readFileSync(keyPath, 'utf-8');
    const aesKey = Buffer.from(aesKeyB64, 'base64');

    // Extract IV and auth tag
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);

    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Save decrypted file
    const filename = path.basename(encFilePath, '.enc');
    const outputDir = encFilePath.startsWith(`${SHARED_DIR}${path.sep}`) || path.dirname(encFilePath) === SHARED_DIR
      ? SHARED_DIR
      : DECRYPTED_DIR;
    const decPath = path.join(outputDir, filename);
    fs.writeFileSync(decPath, decrypted);

    console.log('✅ Decryption Successful');
    console.log(`📁 Decrypted file: ${decPath}`);
    console.log(`📊 Decrypted size: ${decrypted.length} bytes`);

  } catch (err) {
    console.error('❌ Decryption failed:', err.message);
    process.exit(1);
  }
}

// Get file paths from args
const encFilePath = process.argv[2];
const keyPath = process.argv[3];

if (encFilePath && keyPath) {
  decryptFile(encFilePath, keyPath);
} else {
  // Watch mode: automatically decrypt new .enc files in SHARED_DIR
  console.log('🔍 Watching /shared for new .enc files to decrypt...');
  
  const processedFiles = new Set();
  
  // Initial scan
  fs.readdirSync(SHARED_DIR).forEach(file => {
    if (file.endsWith('.enc')) {
      processedFiles.add(file);
    }
  });
  
  // Poll every 5 seconds for new .enc files
  setInterval(() => {
    try {
      const files = fs.readdirSync(SHARED_DIR);
      files.forEach(file => {
        if (file.endsWith('.enc') && !processedFiles.has(file)) {
          processedFiles.add(file);
          const encPath = path.join(SHARED_DIR, file);
          const keyFile = path.join(KEYS_DIR, file.replace('.enc', '.key'));
          if (fs.existsSync(encPath) && fs.existsSync(keyFile)) {
            console.log(`📁 New encrypted file detected: ${file}`);
            decryptFile(encPath, keyFile);
          } else {
            console.log(`⚠️  Key file not found for ${file}`);
          }
        }
      });
    } catch (err) {
      console.error('Error scanning directory:', err.message);
    }
  }, 5000);
}
