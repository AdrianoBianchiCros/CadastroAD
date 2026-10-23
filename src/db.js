const sql = require('mssql');
const { config } = require('./config');
const mockDb = require('./mock/mockDb');

let poolPromise = null;

function getPool() {
  if (config.dbMock) {
    throw new Error('getPool() nao deve ser chamado em modo DB_MOCK=true');
  }

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool({
      server: config.db.server,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      options: {
        encrypt: config.db.encrypt,
        trustServerCertificate: config.db.trustServerCertificate,
      },
    })
      .connect()
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }

  return poolPromise;
}

module.exports = { sql, getPool, mockDb };
