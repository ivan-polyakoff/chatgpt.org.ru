/* eslint-disable no-trailing-spaces */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Путь к файлу .env в корне проекта
const ENV_PATH = path.resolve(process.cwd(), '.env');
// Секретный пароль для доступа к настройкам (по умолчанию qwerty123)
const SECRET = process.env.SECRET_SETTINGS_PASSWORD || 'qwerty123';

// Перечень переменных окружения, разрешённых для чтения/обновления
const ALLOWED_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_MODELS',
  'START_BALANCE',
  'CHECK_BALANCE',
  'LOGIN_VIOLATION_SCORE',
  'REGISTRATION_VIOLATION_SCORE',
  'CONCURRENT_VIOLATION_SCORE',
  'MESSAGE_VIOLATION_SCORE',
  'NON_BROWSER_VIOLATION_SCORE',
  'LOGIN_MAX',
  'LOGIN_WINDOW',
  'REGISTER_MAX',
  'REGISTER_WINDOW',
  'LIMIT_CONCURRENT_MESSAGES',
  'CONCURRENT_MESSAGE_MAX',
  'LIMIT_MESSAGE_IP',
  'MESSAGE_IP_MAX',
  'MESSAGE_IP_WINDOW',
  'LIMIT_MESSAGE_USER',
  'MESSAGE_USER_MAX',
  'MESSAGE_USER_WINDOW',
];

// Проверка секретного пароля
function verifySecret(req) {
  const provided = req.body.secret || req.query.secret || req.headers['x-secret-key'];
  return provided === SECRET;
}

// GET /api/admin/settings
async function getSettings(req, res) {
  if (!verifySecret(req)) {
    return res.status(403).json({ message: 'Invalid secret' });
  }

  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);
  const settings = {};

  lines.forEach(line => {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      if (ALLOWED_KEYS.includes(key)) {
        let value = m[2];
        if (value === 'true' || value === 'false') {
          value = value === 'true';
        } else if (!isNaN(value) && value.trim() !== '') {
          value = Number(value);
        }
        settings[key] = value;
      }
    }
  });

  res.json({ settings });
}

// PATCH /api/admin/settings
async function updateSettings(req, res) {
  if (!verifySecret(req)) {
    return res.status(403).json({ message: 'Invalid secret' });
  }

  const updates = req.body.settings;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ message: 'Settings object is required' });
  }

  const raw = fs.readFileSync(ENV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/);
  const updatedLines = lines.map(line => {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      if (ALLOWED_KEYS.includes(key) && Object.prototype.hasOwnProperty.call(updates, key)) {
        let newVal = updates[key];
        if (typeof newVal === 'boolean') { newVal = newVal ? 'true' : 'false'; }
        else { newVal = String(newVal); }
        return `${key}=${newVal}`;
      }
    }
    return line;
  });

  // Добавляем отсутствующие ключи в конец
  ALLOWED_KEYS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(updates, key) && !lines.some(l => l.startsWith(key + '='))) {
      let newVal = updates[key];
      if (typeof newVal === 'boolean') { newVal = newVal ? 'true' : 'false'; }
      else { newVal = String(newVal); }
      updatedLines.push(`${key}=${newVal}`);
    }
  });

  fs.writeFileSync(ENV_PATH, updatedLines.join('\n'));
  // Перезагружаем .env переменные в process.env с override
  dotenv.config({ path: ENV_PATH, override: true });
  // Обновляем process.env, чтобы изменения вступили в силу без перезагрузки
  Object.keys(updates).forEach((key) => {
    if (ALLOWED_KEYS.includes(key)) {
      let val = updates[key];
      if (typeof val === 'boolean') { val = val ? 'true' : 'false'; }
      else { val = String(val); }
      process.env[key] = val;
    }
  });
  res.json({ message: 'Settings updated' });
}

module.exports = { getSettings, updateSettings }; 