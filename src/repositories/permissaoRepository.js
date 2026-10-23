const { config } = require('../config');
const { getPool, sql } = require('../db');
const { state } = require('../mock/mockDb');

// Mesmas 6 permissoes fixas concedidas por AD.cs.insertPermissions, porem
// agora idempotente: nao duplica a permissao se o usuario ja a possui.
const DEFAULT_PERMISSION_IDS = [125, 109, 112, 113, 118, 122];

async function grantDefaultPermissions(idUsuario) {
  if (config.dbMock) {
    DEFAULT_PERMISSION_IDS.forEach((idPermissao) => {
      const already = state.permissoes.some((p) => p.idUsuario === idUsuario && p.idPermissao === idPermissao);
      if (!already) state.permissoes.push({ idUsuario, idPermissao });
    });
    return;
  }

  const pool = await getPool();
  for (const idPermissao of DEFAULT_PERMISSION_IDS) {
    await pool.request()
      .input('idUsuario', sql.Decimal(18, 0), idUsuario)
      .input('idPermissao', sql.Int, idPermissao)
      .query(`IF NOT EXISTS (SELECT 1 FROM tv1UsuarioPermissao WHERE idUsuario = @idUsuario AND idPermissao = @idPermissao)
              INSERT INTO tv1UsuarioPermissao (idUsuario, idPermissao) VALUES (@idUsuario, @idPermissao)`);
  }
}

module.exports = { DEFAULT_PERMISSION_IDS, grantDefaultPermissions };
