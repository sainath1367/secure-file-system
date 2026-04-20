const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '..', 'data', 'rsa-keys');

if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

function getUserKeyPath(email) {
  return path.join(keysDir, `${email.replace(/[^a-zA-Z0-9]/g, '_')}.pem`);
}

function generateRSAKeyPair(email) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  const keyPath = getUserKeyPath(email);
  fs.writeFileSync(keyPath, privateKey, { mode: 0o600 });
  return { publicKey, privateKey };
}

function getRSAKeys(email) {
  const keyPath = getUserKeyPath(email);
  if (!fs.existsSync(keyPath)) {
    return generateRSAKeyPair(email);
  }

  const privateKey = fs.readFileSync(keyPath, 'utf-8');
  const publicKey = crypto.createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });
  return { publicKey, privateKey };
}

function encryptAESKeyWithRSA(aesKeyHex, publicKeyPem) {
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(aesKeyHex, 'hex')
  );
  return encrypted.toString('base64');
}

function decryptAESKeyWithRSA(encryptedAESKeyBase64, privateKeyPem) {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(encryptedAESKeyBase64, 'base64')
  );
  return decrypted.toString('hex');
}

function rotateRSAKeys(email) {
  // Generate new keys
  const newKeys = generateRSAKeyPair(email);
  // Note: In a real system, you'd re-encrypt all AES keys with the new public key
  // For now, just regenerate
  return newKeys;
}

module.exports = {
  getRSAKeys,
  generateRSAKeyPair,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
  rotateRSAKeys
};