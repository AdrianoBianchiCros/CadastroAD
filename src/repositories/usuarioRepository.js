const { config } = require('../config');
const { getPool, sql } = require('../db');
const { state } = require('../mock/mockDb');

const COLUMNS = [
  'SID', 'SDDL', 'sAMAccountName', 'domain', 'CN', 'description', 'displayName', 'DN',
  'givenName', 'physicalDeliveryOfficeName', 'SN', 'userAccountControl', 'userPrincipalName',
  'mail', 'c', 'company', 'department', 'homephone', 'l', 'location', 'manager', 'mobile',
  'postalCode', 'st', 'streetAddress', 'telephoneNumber', 'initials', 'employeeID', 'division',
  'middleName', 'otherMobile', 'title', 'whenCreated', 'whenChanged', 'usergroup',
  'otherTelephone', 'wWWHomePage', 'co', 'extensionAttribute1', 'extensionAttribute2',
  'extensionAttribute3', 'extensionAttribute4', 'extensionAttribute5', 'extensionAttribute6',
  'employeeNumber', 'employeeType', 'accountExpires', 'thumbnailPhoto', 'lastLogon', 'pager',
];

async function findBySamAccountName(samAccountName) {
  if (config.dbMock) {
    return state.usuarios.find((u) => u.sAMAccountName === samAccountName) || null;
  }
  const pool = await getPool();
  const result = await pool.request()
    .input('sam', sql.VarChar(64), samAccountName)
    .query('SELECT TOP 1 * FROM dcUsuario WHERE sAMAccountName = @sam');
  return result.recordset[0] || null;
}

// Insere o usuario caso nao exista (por sAMAccountName), ou atualiza os
// campos vindos do AD mantendo o mesmo idUsuario. Sempre marca status = 1
// (usuario encontrado no AD), espelhando o comportamento do AD.cs original.
async function upsert(usuarioFields) {
  if (config.dbMock) {
    let existing = state.usuarios.find((u) => u.sAMAccountName === usuarioFields.sAMAccountName);
    if (!existing) {
      existing = { idUsuario: state.nextUsuarioId++ };
      state.usuarios.push(existing);
    }
    Object.assign(existing, usuarioFields, { status: 1 });
    return existing.idUsuario;
  }

  const pool = await getPool();
  const existing = await findBySamAccountName(usuarioFields.sAMAccountName);

  const request = pool.request();
  COLUMNS.forEach((col) => request.input(col, usuarioFields[col] ?? ''));
  request.input('status', sql.Int, 1);

  if (existing) {
    const setClause = COLUMNS.map((c) => `[${c}] = @${c}`).join(', ');
    request.input('idUsuario', sql.Decimal(18, 0), existing.idUsuario);
    await request.query(`UPDATE dcUsuario SET ${setClause}, status = @status WHERE idUsuario = @idUsuario`);
    return existing.idUsuario;
  }

  const colList = COLUMNS.join(', ');
  const paramList = COLUMNS.map((c) => `@${c}`).join(', ');
  const result = await request.query(
    `INSERT INTO dcUsuario (${colList}, status) OUTPUT INSERTED.idUsuario VALUES (${paramList}, @status)`
  );
  return result.recordset[0].idUsuario;
}

// Cadastra manualmente um usuario que ainda nao existe (fora do fluxo de
// sincronizacao com o AD). Lanca erro se o login ja estiver cadastrado.
async function create(usuarioFields) {
  const existing = await findBySamAccountName(usuarioFields.sAMAccountName);
  if (existing) {
    const err = new Error('Ja existe um usuario cadastrado com este login.');
    err.code = 'DUPLICATE';
    throw err;
  }

  if (config.dbMock) {
    const record = { idUsuario: state.nextUsuarioId++ };
    COLUMNS.forEach((col) => { record[col] = usuarioFields[col] ?? ''; });
    record.status = 1;
    state.usuarios.push(record);
    return record.idUsuario;
  }

  const pool = await getPool();
  const request = pool.request();
  COLUMNS.forEach((col) => request.input(col, usuarioFields[col] ?? ''));
  request.input('status', sql.Int, 1);

  const colList = COLUMNS.join(', ');
  const paramList = COLUMNS.map((c) => `@${c}`).join(', ');
  const result = await request.query(
    `INSERT INTO dcUsuario (${colList}, status) OUTPUT INSERTED.idUsuario VALUES (${paramList}, @status)`
  );
  return result.recordset[0].idUsuario;
}

async function markStatusBySamAccountName(samAccountName, status) {
  if (config.dbMock) {
    const u = state.usuarios.find((x) => x.sAMAccountName === samAccountName);
    if (u) u.status = status;
    return;
  }
  const pool = await getPool();
  await pool.request()
    .input('sam', sql.VarChar(64), samAccountName)
    .input('status', sql.Int, status)
    .query('UPDATE dcUsuario SET status = @status WHERE sAMAccountName = @sam');
}

async function listPaginated({ search = '', page = 1, pageSize = 25 } = {}) {
  const offset = (page - 1) * pageSize;

  if (config.dbMock) {
    const filtered = state.usuarios.filter((u) => matchesSearch(u, search));
    return {
      total: filtered.length,
      items: filtered.slice(offset, offset + pageSize),
    };
  }

  const pool = await getPool();
  const request = pool.request().input('search', sql.VarChar(256), `%${search}%`);
  const totalResult = await request.query(
    `SELECT COUNT(*) as total FROM dcUsuario WHERE sAMAccountName LIKE @search OR displayName LIKE @search OR mail LIKE @search`
  );

  const pageRequest = pool.request()
    .input('search', sql.VarChar(256), `%${search}%`)
    .input('offset', sql.Int, offset)
    .input('pageSize', sql.Int, pageSize);
  const pageResult = await pageRequest.query(
    `SELECT * FROM dcUsuario
     WHERE sAMAccountName LIKE @search OR displayName LIKE @search OR mail LIKE @search
     ORDER BY sAMAccountName
     OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`
  );

  return { total: totalResult.recordset[0].total, items: pageResult.recordset };
}

function matchesSearch(u, search) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return (
    (u.sAMAccountName || '').toLowerCase().includes(needle) ||
    (u.displayName || '').toLowerCase().includes(needle) ||
    (u.mail || '').toLowerCase().includes(needle)
  );
}

async function countActive() {
  if (config.dbMock) return state.usuarios.filter((u) => u.status === 1).length;
  const pool = await getPool();
  const result = await pool.request().query('SELECT COUNT(*) as total FROM dcUsuario WHERE status = 1');
  return result.recordset[0].total;
}

module.exports = { findBySamAccountName, upsert, create, markStatusBySamAccountName, listPaginated, countActive };
