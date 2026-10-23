const { config } = require('../config');
const { getPool, sql } = require('../db');
const { state } = require('../mock/mockDb');

async function replaceUserGroups(idUsuario, idGrupoList) {
  if (config.dbMock) {
    state.usuariosXGrupos = state.usuariosXGrupos.filter((r) => r.idUsuario !== idUsuario);
    idGrupoList.forEach((idGrupo) => state.usuariosXGrupos.push({ idUsuario, idGrupo }));
    return;
  }

  const pool = await getPool();
  await pool.request()
    .input('idUsuario', sql.Decimal(18, 0), idUsuario)
    .query('DELETE FROM dcUsuariosXGrupos WHERE idUsuario = @idUsuario');

  for (const idGrupo of idGrupoList) {
    await pool.request()
      .input('idUsuario', sql.Decimal(18, 0), idUsuario)
      .input('idGrupo', sql.Decimal(18, 0), idGrupo)
      .query('INSERT INTO dcUsuariosXGrupos (idUsuario, idGrupo) VALUES (@idUsuario, @idGrupo)');
  }
}

async function replaceGroupGroups(idGrupo, idGrupoMembroList) {
  if (config.dbMock) {
    state.gruposXGrupos = state.gruposXGrupos.filter((r) => r.idGrupo !== idGrupo);
    idGrupoMembroList.forEach((idGrupoMembro) => state.gruposXGrupos.push({ idGrupo, idGrupoMembro }));
    return;
  }

  const pool = await getPool();
  await pool.request()
    .input('idGrupo', sql.Decimal(18, 0), idGrupo)
    .query('DELETE FROM dcGruposXGrupos WHERE idGrupo = @idGrupo');

  for (const idGrupoMembro of idGrupoMembroList) {
    await pool.request()
      .input('idGrupo', sql.Decimal(18, 0), idGrupo)
      .input('idGrupoMembro', sql.Decimal(18, 0), idGrupoMembro)
      .query('INSERT INTO dcGruposXGrupos (idGrupo, idGrupoMembro) VALUES (@idGrupo, @idGrupoMembro)');
  }
}

module.exports = { replaceUserGroups, replaceGroupGroups };
