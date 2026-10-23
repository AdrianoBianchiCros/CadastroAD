const express = require('express');
const syncService = require('../services/syncService');
const syncLogRepository = require('../repositories/syncLogRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const grupoRepository = require('../repositories/grupoRepository');

const router = express.Router();

router.get('/status', async (req, res, next) => {
  try {
    res.json({
      running: syncService.isFullSyncInProgress(),
      usuariosAtivos: await usuarioRepository.countActive(),
      gruposAtivos: await grupoRepository.countActive(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || '20', 10)));
    res.json(await syncLogRepository.history(limit));
  } catch (err) {
    next(err);
  }
});

router.post('/usuarios', async (req, res, next) => {
  try {
    const { login } = req.body || {};
    res.json(await syncService.syncUsuarios({ login }));
  } catch (err) {
    next(err);
  }
});

router.post('/grupos', async (req, res, next) => {
  try {
    res.json(await syncService.syncGrupos());
  } catch (err) {
    next(err);
  }
});

router.post('/full', async (req, res, next) => {
  try {
    if (syncService.isFullSyncInProgress()) {
      return res.status(409).json({ error: 'Ja existe uma sincronizacao completa em andamento.' });
    }
    res.json(await syncService.runFullSync());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
