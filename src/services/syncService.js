const adClient = require('../ad/client');
const usuarioRepository = require('../repositories/usuarioRepository');
const grupoRepository = require('../repositories/grupoRepository');
const permissaoRepository = require('../repositories/permissaoRepository');
const membershipRepository = require('../repositories/membershipRepository');
const syncLogRepository = require('../repositories/syncLogRepository');

// Porta de AD.cs.SyncUsuarios: busca usuarios no AD (todos, ou um login
// especifico) e grava/atualiza em dcUsuario. Usuarios novos recebem as
// permissoes padrao (agora de forma idempotente).
async function syncUsuarios({ login } = {}) {
  const logId = await syncLogRepository.start('usuarios');
  try {
    const usuarios = await adClient.findUsers({ login });
    let processados = 0;

    for (const adUser of usuarios) {
      if (!adUser.sAMAccountName) continue;

      const existing = await usuarioRepository.findBySamAccountName(adUser.sAMAccountName);
      const idUsuario = await usuarioRepository.upsert(adUser);

      if (!existing) {
        await permissaoRepository.grantDefaultPermissions(idUsuario);
      }
      processados++;
    }

    await syncLogRepository.finish(logId, { status: 'success', detalhes: { processados } });
    return { processados };
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  }
}

// Porta de AD.cs.DisableUsers: usuarios desabilitados no AD (bit
// USER_ACCOUNT_CONTROL) marcam status = 2 no banco.
async function disableUsers() {
  const logId = await syncLogRepository.start('disableUsers');
  try {
    const disabled = await adClient.findDisabledUsers();
    for (const adUser of disabled) {
      await usuarioRepository.markStatusBySamAccountName(adUser.sAMAccountName, 2);
    }
    await syncLogRepository.finish(logId, { status: 'success', detalhes: { desabilitados: disabled.length } });
    return { desabilitados: disabled.length };
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  }
}

// Porta de AD.cs.SyncGrupos: mesmo ciclo de status 0 (pendente) -> 1
// (ativo, encontrado no AD) -> 2 (inativo, nao encontrado nesta rodada).
async function syncGrupos() {
  const logId = await syncLogRepository.start('grupos');
  try {
    await grupoRepository.resetActiveToPending();

    const grupos = await adClient.findGroups();
    for (const adGroup of grupos) {
      if (!adGroup.sAMAccountName) continue;
      await grupoRepository.upsertActive(adGroup);
    }

    await grupoRepository.disablePending();
    await syncLogRepository.finish(logId, { status: 'success', detalhes: { processados: grupos.length } });
    return { processados: grupos.length };
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  }
}

// Porta de AD.cs.SyncUsuariosMemberOf: recalcula dcUsuariosXGrupos a
// partir do atributo memberOf de cada usuario.
async function syncUsuariosMemberOf() {
  const logId = await syncLogRepository.start('usuariosMemberOf');
  try {
    const usuarios = await adClient.findUsers({});
    let processados = 0;

    for (const adUser of usuarios) {
      const dbUser = await usuarioRepository.findBySamAccountName(adUser.sAMAccountName);
      if (!dbUser) continue;

      const idUsuario = dbUser.idUsuario;
      const idGrupoList = [];
      for (const dn of adUser.memberOf || []) {
        const grupo = await grupoRepository.findByDistinguishedName(dn);
        if (grupo) idGrupoList.push(grupo.idGrupo);
      }

      await membershipRepository.replaceUserGroups(idUsuario, idGrupoList);
      processados++;
    }

    await syncLogRepository.finish(logId, { status: 'success', detalhes: { processados } });
    return { processados };
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  }
}

// Porta de AD.cs.SyncGruposMemberOf. No C# original o insert estava
// comentado (nunca populava dcGruposXGrupos de fato) - aqui e implementado
// de verdade, recalculando o pertencimento grupo-a-grupo.
async function syncGruposMemberOf() {
  const logId = await syncLogRepository.start('gruposMemberOf');
  try {
    const grupos = await adClient.findGroups();
    let processados = 0;

    for (const adGroup of grupos) {
      const dbGroup = await grupoRepository.findBySamAccountName(adGroup.sAMAccountName);
      if (!dbGroup) continue;

      const idGrupoMembroList = [];
      for (const dn of adGroup.memberOf || []) {
        const membro = await grupoRepository.findByDistinguishedName(dn);
        if (membro) idGrupoMembroList.push(membro.idGrupo);
      }

      await membershipRepository.replaceGroupGroups(dbGroup.idGrupo, idGrupoMembroList);
      processados++;
    }

    await syncLogRepository.finish(logId, { status: 'success', detalhes: { processados } });
    return { processados };
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  }
}

let fullSyncInProgress = false;

// Pipeline completo, equivalente ao disparo diario do Windows Service
// original (Sync.cs), na mesma ordem. Impede execucoes sobrepostas
// (manual + agendada, ou dois cliques no painel).
async function runFullSync() {
  if (fullSyncInProgress) {
    throw new Error('Ja existe uma sincronizacao completa em andamento.');
  }
  fullSyncInProgress = true;

  const logId = await syncLogRepository.start('full');
  try {
    const usuarios = await syncUsuarios({});
    const grupos = await syncGrupos();
    const membersUsuarios = await syncUsuariosMemberOf();
    const membersGrupos = await syncGruposMemberOf();
    const disabled = await disableUsers();

    const detalhes = { usuarios, grupos, membersUsuarios, membersGrupos, disabled };
    await syncLogRepository.finish(logId, { status: 'success', detalhes });
    return detalhes;
  } catch (err) {
    await syncLogRepository.finish(logId, { status: 'error', mensagem: err.message });
    throw err;
  } finally {
    fullSyncInProgress = false;
  }
}

function isFullSyncInProgress() {
  return fullSyncInProgress;
}

module.exports = {
  syncUsuarios, disableUsers, syncGrupos, syncUsuariosMemberOf, syncGruposMemberOf,
  runFullSync, isFullSyncInProgress,
};
