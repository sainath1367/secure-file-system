const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYS_DIR = '/app/keys';
const ENCRYPTED_DIR = '/app/encrypted';
const DECRYPTED_DIR = '/app/decrypted';

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
    const decPath = path.join(DECRYPTED_DIR, filename);
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

if (!encFilePath || !keyPath) {
  console.error('Usage: node app.js <encrypted-file-path> <key-file-path>');
  process.exit(1);
}

decryptFile(encFilePath, keyPath);
