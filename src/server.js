const path = require('path');
const express = require('express');
const session = require('express-session');

const { config, assertRequiredConfig } = require('./config');
const requireAuth = require('./middleware/requireAuth');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const gruposRoutes = require('./routes/grupos.routes');
const syncRoutes = require('./routes/sync.routes');
const scheduler = require('./scheduler');

assertRequiredConfig();

const app = express();

app.use(express.json());
app.use(
  session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', requireAuth, usuariosRoutes);
app.use('/api/grupos', requireAuth, gruposRoutes);
app.use('/api/sync', requireAuth, syncRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
});

app.listen(config.port, () => {
  console.log(`ADSync Web rodando em http://localhost:${config.port}`);
  if (config.adMock) console.log('[config] AD_MOCK ativo - usando dados de exemplo do Active Directory.');
  if (config.dbMock) console.log('[config] DB_MOCK ativo - usando banco em memoria.');
  scheduler.start();
});
