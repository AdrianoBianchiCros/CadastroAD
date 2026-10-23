const express = require('express');
const grupoRepository = require('../repositories/grupoRepository');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '25', 10)));
    const search = String(req.query.search || '');

    const result = await grupoRepository.listPaginated({ search, page, pageSize });
    res.json({ page, pageSize, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
