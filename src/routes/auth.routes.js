const express = require('express');
const { verifyCredentials } = require('../auth/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  const ok = await verifyCredentials(username, password);
  if (!ok) return res.status(401).json({ error: 'Usuario ou senha invalidos.' });

  req.session.user = { username };
  res.json({ username });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Nao autenticado.' });
  res.json(req.session.user);
});

module.exports = router;
