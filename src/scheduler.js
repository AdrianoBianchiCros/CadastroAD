const cron = require('node-cron');
const { config } = require('./config');
const syncService = require('./services/syncService');

function start() {
  if (!config.sync.enabled) {
    console.log('[scheduler] Sincronizacao agendada desativada (SYNC_ENABLED=false).');
    return;
  }

  if (!cron.validate(config.sync.cron)) {
    console.error(`[scheduler] Expressao cron invalida em SYNC_CRON: "${config.sync.cron}". Agendamento nao iniciado.`);
    return;
  }

  cron.schedule(config.sync.cron, async () => {
    console.log('[scheduler] Iniciando sincronizacao completa agendada...');
    try {
      await syncService.runFullSync();
      console.log('[scheduler] Sincronizacao completa concluida com sucesso.');
    } catch (err) {
      console.error('[scheduler] Falha na sincronizacao agendada:', err.message);
    }
  });

  console.log(`[scheduler] Sincronizacao completa agendada com a expressao cron "${config.sync.cron}".`);
}

module.exports = { start };
