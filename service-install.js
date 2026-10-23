const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'ADSyncWeb',
  description: 'Painel web ADSync (Active Directory -> SQL Server GrupoTv1_Seguranca).',
  script: path.join(__dirname, 'src', 'server.js'),
  workingDirectory: __dirname,
  nodeOptions: [],
});

svc.on('install', () => {
  console.log('Servico ADSyncWeb instalado. Iniciando...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('Servico ADSyncWeb ja esta instalado.');
});

svc.on('start', () => {
  console.log('Servico ADSyncWeb iniciado. Painel disponivel em http://localhost:3000');
});

svc.install();
