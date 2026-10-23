(async () => {
  const me = await requireLogin();
  if (!me) return;

  document.getElementById('logoutBtn').addEventListener('click', logout);

  const cardUsuarios = document.getElementById('cardUsuarios');
  const cardGrupos = document.getElementById('cardGrupos');
  const cardStatus = document.getElementById('cardStatus');
  const historyBody = document.getElementById('historyBody');
  const syncMessage = document.getElementById('syncMessage');

  const btnFull = document.getElementById('btnFull');
  const btnUsuarios = document.getElementById('btnUsuarios');
  const btnGrupos = document.getElementById('btnGrupos');

  function applyStatusBadge(el, running) {
    el.className = running ? 'badge running' : 'badge success';
    el.textContent = running ? 'Em execucao' : 'Ocioso';
  }

  async function refreshStatus() {
    const status = await apiFetch('/api/sync/status');
    cardUsuarios.textContent = status.usuariosAtivos;
    cardGrupos.textContent = status.gruposAtivos;
    applyStatusBadge(cardStatus, status.running);
    setSyncButtonsDisabled(status.running);
  }

  function setSyncButtonsDisabled(disabled) {
    [btnFull, btnUsuarios, btnGrupos].forEach((b) => { b.disabled = disabled; });
  }

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('pt-BR');
  }

  function rowBadge(status) {
    if (status === 'running') return '<span class="badge running">Em execucao</span>';
    if (status === 'success') return '<span class="badge success">Sucesso</span>';
    if (status === 'error') return '<span class="badge error">Erro</span>';
    return status;
  }

  async function refreshHistory() {
    const history = await apiFetch('/api/sync/history?limit=20');
    if (history.length === 0) {
      historyBody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma execucao registrada ainda.</td></tr>';
      return;
    }
    historyBody.innerHTML = history
      .map(
        (h) => `<tr>
          <td>${h.tipo}</td>
          <td>${formatDate(h.inicio)}</td>
          <td>${formatDate(h.fim)}</td>
          <td>${rowBadge(h.status)}</td>
          <td>${h.mensagem || ''}</td>
        </tr>`
      )
      .join('');
  }

  async function refreshAll() {
    await Promise.all([refreshStatus(), refreshHistory()]);
  }

  async function triggerSync(url) {
    syncMessage.textContent = '';
    setSyncButtonsDisabled(true);
    try {
      await apiFetch(url, { method: 'POST', body: JSON.stringify({}) });
    } catch (err) {
      syncMessage.textContent = err.message;
    } finally {
      await refreshAll();
    }
  }

  btnFull.addEventListener('click', () => triggerSync('/api/sync/full'));
  btnUsuarios.addEventListener('click', () => triggerSync('/api/sync/usuarios'));
  btnGrupos.addEventListener('click', () => triggerSync('/api/sync/grupos'));

  await refreshAll();
  setInterval(refreshAll, 10000);
})();
