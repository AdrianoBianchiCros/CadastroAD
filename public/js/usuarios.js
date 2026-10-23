(async () => {
  const me = await requireLogin();
  if (!me) return;

  document.getElementById('logoutBtn').addEventListener('click', logout);

  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('searchInput');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');

  let page = 1;
  const pageSize = 20;
  let search = '';
  let debounceTimer;

  function statusBadge(status) {
    if (status === 1) return '<span class="badge active">Ativo</span>';
    if (status === 2) return '<span class="badge inactive">Desabilitado</span>';
    return '<span class="badge">-</span>';
  }

  async function load() {
    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Carregando...</td></tr>';
    const query = new URLSearchParams({ page, pageSize, search });
    const result = await apiFetch(`/api/usuarios?${query.toString()}`);

    if (result.items.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum usuario encontrado.</td></tr>';
    } else {
      tableBody.innerHTML = result.items
        .map(
          (u) => `<tr>
            <td>${u.sAMAccountName || ''}</td>
            <td>${u.displayName || ''}</td>
            <td>${u.mail || ''}</td>
            <td>${u.department || ''}</td>
            <td>${u.title || ''}</td>
            <td>${statusBadge(u.status)}</td>
          </tr>`
        )
        .join('');
    }

    const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
    pageInfo.textContent = `Pagina ${page} de ${totalPages} (${result.total} usuarios)`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      search = searchInput.value.trim();
      page = 1;
      load();
    }, 300);
  });

  prevBtn.addEventListener('click', () => { if (page > 1) { page--; load(); } });
  nextBtn.addEventListener('click', () => { page++; load(); });

  await load();
})();
