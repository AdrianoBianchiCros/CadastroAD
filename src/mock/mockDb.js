// Banco em memoria usado quando DB_MOCK=true, para rodar o painel e o
// pipeline de sincronizacao sem um SQL Server real disponivel.

const state = {
  usuarios: [],
  grupos: [],
  usuariosXGrupos: [], // { idUsuario, idGrupo }
  gruposXGrupos: [], // { idGrupo, idGrupoMembro }
  permissoes: [], // { idUsuario, idPermissao }
  syncLog: [],
  nextUsuarioId: 1,
  nextGrupoId: 1,
  nextLogId: 1,
};

function reset() {
  state.usuarios = [];
  state.grupos = [];
  state.usuariosXGrupos = [];
  state.gruposXGrupos = [];
  state.permissoes = [];
  state.syncLog = [];
  state.nextUsuarioId = 1;
  state.nextGrupoId = 1;
  state.nextLogId = 1;
}

module.exports = { state, reset };
