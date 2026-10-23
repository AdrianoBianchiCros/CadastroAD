require('dotenv').config();

function bool(value, defaultValue) {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true';
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  adMock: bool(process.env.AD_MOCK, false),
  dbMock: bool(process.env.DB_MOCK, false),

  ad: {
    url: process.env.AD_URL,
    baseDN: process.env.AD_BASE_DN,
    bindDN: process.env.AD_BIND_DN,
    bindPassword: process.env.AD_BIND_PASSWORD,
  },

  db: {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    encrypt: bool(process.env.DB_ENCRYPT, false),
    trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
  },

  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-troque-isto',
  },

  admin: {
    user: process.env.ADMIN_USER,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
  },

  sync: {
    cron: process.env.SYNC_CRON || '0 23 * * *',
    enabled: bool(process.env.SYNC_ENABLED, true),
  },
};

function assertRequiredConfig() {
  const missing = [];

  if (!config.dbMock) {
    if (!config.db.server) missing.push('DB_SERVER');
    if (!config.db.database) missing.push('DB_DATABASE');
    if (!config.db.user) missing.push('DB_USER');
    if (!config.db.password) missing.push('DB_PASSWORD');
  }

  if (!config.adMock) {
    if (!config.ad.url) missing.push('AD_URL');
    if (!config.ad.baseDN) missing.push('AD_BASE_DN');
    if (!config.ad.bindDN) missing.push('AD_BIND_DN');
    if (!config.ad.bindPassword) missing.push('AD_BIND_PASSWORD');
  }

  if (!config.admin.user) missing.push('ADMIN_USER');
  if (!config.admin.passwordHash) missing.push('ADMIN_PASSWORD_HASH');

  if (missing.length > 0) {
    throw new Error(
      `Variaveis de ambiente ausentes: ${missing.join(', ')}. Copie .env.example para .env e preencha, ou ative AD_MOCK/DB_MOCK para testar sem infraestrutura real.`
    );
  }
}

module.exports = { config, assertRequiredConfig };
