const bcrypt = require('bcryptjs');
const { config } = require('../config');

async function verifyCredentials(username, password) {
  if (!username || !password) return false;
  if (username !== config.admin.user) return false;
  return bcrypt.compare(password, config.admin.passwordHash);
}

module.exports = { verifyCredentials };
