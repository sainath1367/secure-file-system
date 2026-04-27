const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYS_DIR = '/app/keys';
const ENCRYPTED_DIR = '/app/encrypted';
const SHARED_DIR = '/shared';

// Ensure directories exist
[KEYS_DIR, ENCRYPTED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function encryptFile(filePath) {
  try {
    // Read file
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const data = fs.readFileSync(filePath);
    
    // Generate AES-256 key
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
    
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // File format: IV | AuthTag | Encrypted
    const encryptedFile = Buffer.concat([iv, authTag, encrypted]);
    
    // Save encrypted file
    const filename = path.basename(filePath);
    const outputDir = filePath.startsWith(`${SHARED_DIR}${path.sep}`) || path.dirname(filePath) === SHARED_DIR
      ? SHARED_DIR
      : ENCRYPTED_DIR;
    const encPath = path.join(outputDir, `${filename}.enc`);
    fs.writeFileSync(encPath, encryptedFile);

    // Save AES key
    const keyFile = path.join(KEYS_DIR, `${filename}.key`);
    fs.writeFileSync(keyFile, aesKey.toString('base64'));

    console.log('✅ Encryption Successful');
    console.log(`📁 Encrypted file: ${encPath}`);
    console.log(`🔑 Key saved: ${keyFile}`);
    console.log(`📊 Original size: ${data.length} bytes`);
    console.log(`📊 Encrypted size: ${encryptedFile.length} bytes`);

  } catch (err) {
    console.error('❌ Encryption failed:', err.message);
    process.exit(1);
  }
}

// Get file from args
const filePath = process.argv[2];
if (filePath) {
  encryptFile(filePath);
} else {
  // Watch mode: automatically encrypt new files in SHARED_DIR
  console.log('🔍 Watching /shared for new files to encrypt...');
  
  const processedFiles = new Set();
  
  // Initial scan
  fs.readdirSync(SHARED_DIR).forEach(file => {
    if (!file.endsWith('.enc')) {
      processedFiles.add(file);
    }
  });
  
  // Poll every 5 seconds for new files
  setInterval(() => {
    try {
      const files = fs.readdirSync(SHARED_DIR);
      files.forEach(file => {
        if (!file.endsWith('.enc') && !processedFiles.has(file)) {
          processedFiles.add(file);
          const fullPath = path.join(SHARED_DIR, file);
          if (fs.existsSync(fullPath)) {
            console.log(`📁 New file detected: ${file}`);
            encryptFile(fullPath);
          }
        }
      });
    } catch (err) {
      console.error('Error scanning directory:', err.message);
    }
  }, 5000);
}
