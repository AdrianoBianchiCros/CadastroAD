const express = require('express');
const usuarioRepository = require('../repositories/usuarioRepository');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '25', 10)));
    const search = String(req.query.search || '');

    const result = await usuarioRepository.listPaginated({ search, page, pageSize });
    res.json({ page, pageSize, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const sAMAccountName = String(body.sAMAccountName || '').trim();
    const displayName = String(body.displayName || '').trim();

    if (!sAMAccountName || !displayName) {
      return res.status(400).json({ error: 'Login e nome sao obrigatorios.' });
    }

    const idUsuario = await usuarioRepository.create({
      sAMAccountName,
      displayName,
      mail: String(body.mail || '').trim(),
      department: String(body.department || '').trim(),
      title: String(body.title || '').trim(),
      domain: String(body.domain || '').trim(),
      description: String(body.description || '').trim(),
    });

    res.status(201).json({ idUsuario, sAMAccountName });
  } catch (err) {
    if (err.code === 'DUPLICATE') return res.status(409).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
