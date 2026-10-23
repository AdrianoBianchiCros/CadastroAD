const { config } = require('../config');
const { getPool, sql } = require('../db');
const { state } = require('../mock/mockDb');

async function start(tipo) {
  const inicio = new Date();
  if (config.dbMock) {
    const id = state.nextLogId++;
    state.syncLog.push({ id, tipo, inicio, fim: null, status: 'running', mensagem: '', detalhes: {} });
    return id;
  }

  const pool = await getPool();
  const result = await pool.request()
    .input('tipo', sql.VarChar(50), tipo)
    .input('inicio', sql.DateTime, inicio)
    .input('status', sql.VarChar(20), 'running')
    .query(`INSERT INTO dcSyncLog (tipo, inicio, status) OUTPUT INSERTED.id VALUES (@tipo, @inicio, @status)`);
  return result.recordset[0].id;
}

async function finish(id, { status, mensagem = '', detalhes = {} }) {
  const fim = new Date();
  if (config.dbMock) {
    const row = state.syncLog.find((r) => r.id === id);
    if (row) Object.assign(row, { fim, status, mensagem, detalhes });
    return;
  }

  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, id)
    .input('fim', sql.DateTime, fim)
    .input('status', sql.VarChar(20), status)
    .input('mensagem', sql.VarChar(sql.MAX), mensagem)
    .input('detalhes', sql.VarChar(sql.MAX), JSON.stringify(detalhes))
    .query('UPDATE dcSyncLog SET fim = @fim, status = @status, mensagem = @mensagem, detalhes = @detalhes WHERE id = @id');
}

async function isRunning() {
  if (config.dbMock) return state.syncLog.some((r) => r.status === 'running');
  const pool = await getPool();
  const result = await pool.request().query("SELECT COUNT(*) as total FROM dcSyncLog WHERE status = 'running'");
  return result.recordset[0].total > 0;
}

async function history(limit = 20) {
  if (config.dbMock) {
    return [...state.syncLog].sort((a, b) => b.inicio - a.inicio).slice(0, limit);
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query('SELECT TOP (@limit) * FROM dcSyncLog ORDER BY inicio DESC');
  return result.recordset;
}

module.exports = { start, finish, isRunning, history };
