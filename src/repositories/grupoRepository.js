const { config } = require('../config');
const { getPool, sql } = require('../db');
const { state } = require('../mock/mockDb');

// Mesmo ciclo de status do AD.cs.SyncGrupos: 0 = pendente (marcado no
// inicio do ciclo), 1 = ativo (encontrado no AD), 2 = inativo (nao
// encontrado nesta rodada).
async function resetActiveToPending() {
  if (config.dbMock) {
    state.grupos.forEach((g) => { if (g.status === 1) g.status = 0; });
    return;
  }
  const pool = await getPool();
  await pool.request().query('UPDATE dcGrupo SET status = 0 WHERE status = 1');
}

async function disablePending() {
  if (config.dbMock) {
    state.grupos.forEach((g) => { if (g.status === 0) g.status = 2; });
    return;
  }
  const pool = await getPool();
  await pool.request().query('UPDATE dcGrupo SET status = 2 WHERE status = 0');
}

async function findBySamAccountName(samAccountName) {
  if (config.dbMock) {
    return state.grupos.find((g) => g.sAMAccountName === samAccountName) || null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('sam', sql.VarChar(128), samAccountName)
    .query('SELECT TOP 1 * FROM dcGrupo WHERE sAMAccountName = @sam');
  return result.recordset[0] || null;
}

async function findByDistinguishedName(dn) {
  if (config.dbMock) {
    return state.grupos.find((g) => g.distinguishedName === dn) || null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('dn', sql.VarChar(256), dn)
    .query('SELECT TOP 1 * FROM dcGrupo WHERE distinguishedName = @dn');
  return result.recordset[0] || null;
}

async function upsertActive(grupoFields) {
  if (config.dbMock) {
    let existing = state.grupos.find((g) => g.sAMAccountName === grupoFields.sAMAccountName);
    if (!existing) {
      existing = { idGrupo: state.nextGrupoId++ };
      state.grupos.push(existing);
    }
    Object.assign(existing, grupoFields, { status: 1 });
    return existing.idGrupo;
  }

  const pool = await getPool();
  const existing = await findBySamAccountName(grupoFields.sAMAccountName);

  if (existing) {
    await pool.request()
      .input('idGrupo', sql.Decimal(18, 0), existing.idGrupo)
      .input('distinguishedName', sql.VarChar(256), grupoFields.distinguishedName)
      .input('mail', sql.VarChar(128), grupoFields.mail || '')
      .input('whenChanged', sql.DateTime, grupoFields.whenChanged)
      .query(`UPDATE dcGrupo SET distinguishedName = @distinguishedName, mail = @mail,
              whenChanged = @whenChanged, status = 1 WHERE idGrupo = @idGrupo`);
    return existing.idGrupo;
  }

  const result = await pool.request()
    .input('SID', sql.VarChar(64), grupoFields.SID)
    .input('SDDL', sql.VarChar(64), grupoFields.SDDL)
    .input('sAMAccountName', sql.VarChar(128), grupoFields.sAMAccountName)
    .input('distinguishedName', sql.VarChar(256), grupoFields.distinguishedName)
    .input('mail', sql.VarChar(128), grupoFields.mail || '')
    .input('whenCreated', sql.DateTime, grupoFields.whenCreated)
    .input('whenChanged', sql.DateTime, grupoFields.whenChanged)
    .query(`INSERT INTO dcGrupo (SID, SDDL, sAMAccountName, distinguishedName, mail, status, whenCreated, whenChanged)
            OUTPUT INSERTED.idGrupo
            VALUES (@SID, @SDDL, @sAMAccountName, @distinguishedName, @mail, 1, @whenCreated, @whenChanged)`);
  return result.recordset[0].idGrupo;
}

async function listPaginated({ search = '', page = 1, pageSize = 25 } = {}) {
  const offset = (page - 1) * pageSize;

  if (config.dbMock) {
    const filtered = state.grupos.filter((g) => !search || g.sAMAccountName.toLowerCase().includes(search.toLowerCase()));
    return { total: filtered.length, items: filtered.slice(offset, offset + pageSize) };
  }

  const pool = await getPool();
  const totalResult = await pool.request()
    .input('search', sql.VarChar(256), `%${search}%`)
    .query('SELECT COUNT(*) as total FROM dcGrupo WHERE sAMAccountName LIKE @search');

  const pageResult = await pool.request()
    .input('search', sql.VarChar(256), `%${search}%`)
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize)
    .query(`SELECT * FROM dcGrupo WHERE sAMAccountName LIKE @search
            ORDER BY sAMAccountName OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);

  return { total: totalResult.recordset[0].total, items: pageResult.recordset };
}

async function countActive() {
  if (config.dbMock) return state.grupos.filter((g) => g.status === 1).length;
  const pool = await getPool();
  const result = await pool.request().query('SELECT COUNT(*) as total FROM dcGrupo WHERE status = 1');
  return result.recordset[0].total;
}

module.exports = {
  resetActiveToPending, disablePending, findBySamAccountName,
  findByDistinguishedName, upsertActive, listPaginated, countActive,
};
