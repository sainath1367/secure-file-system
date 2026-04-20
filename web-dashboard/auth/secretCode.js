const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataPath = path.join(__dirname, '..', 'data');
const file = path.join(dataPath, 'users.json');

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

if (!fs.existsSync(file)) {
  fs.writeFileSync(file, '[]', { encoding: 'utf-8' });
}

function loadUsers() {
  return JSON.parse(fs.readFileSync(file, 'utf-8')) || [];
}

function saveUsers(users) {
  fs.writeFileSync(file, JSON.stringify(users, null, 2), { encoding: 'utf-8' });
}

async function setSecretCode(email, code) {
  const users = loadUsers();
  const hash = await bcrypt.hash(code, 10);
  const existing = users.find(u => u.email === email);

  if (existing) {
    existing.secret = hash;
    existing.updatedAt = new Date().toISOString();
  } else {
    users.push({
      email,
      secret: hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveUsers(users);
}

function hasSecretCode(email) {
  const users = loadUsers();
  return users.some(u => u.email === email);
}

async function verifySecretCode(email, code) {
  const users = loadUsers();
  const user = users.find(u => u.email === email);
  if (!user) return false;
  return bcrypt.compare(code, user.secret);
}

module.exports = { setSecretCode, verifySecretCode, hasSecretCode };
