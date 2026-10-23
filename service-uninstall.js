const path = require('path');
const { Service } = require('node-windows');

const svc = new Service({
  name: 'ADSyncWeb',
  script: path.join(__dirname, 'src', 'server.js'),
});

svc.on('uninstall', () => {
  console.log('Servico ADSyncWeb removido.');
});

svc.uninstall();
