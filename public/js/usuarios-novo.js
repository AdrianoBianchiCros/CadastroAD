(async () => {
  const me = await requireLogin();
  if (!me) return;

  document.getElementById('logoutBtn').addEventListener('click', logout);

  const form = document.getElementById('novoUsuarioForm');
  const loginInput = document.getElementById('login');
  const submitBtn = document.getElementById('submitBtn');
  const errorEl = document.getElementById('errorMessage');
  const successEl = document.getElementById('successMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    successEl.textContent = '';

    const login = loginInput.value.trim();
    if (!login) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Buscando no AD...';

    try {
      // Mesmo fluxo do Program.cs original: informa-se so o login e o
      // proprio AD.SyncUsuarios(login) busca todos os dados no Active
      // Directory e grava/atualiza o cadastro.
      const result = await apiFetch('/api/sync/usuarios', {
        method: 'POST',
        body: JSON.stringify({ login }),
      });

      if (!result.processados) {
        errorEl.textContent = `Nenhum usuario encontrado no AD com o login "${login}".`;
        return;
      }

      successEl.textContent = `Usuario "${login}" sincronizado e cadastrado com sucesso.`;
      form.reset();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Cadastrar';
    }
  });
})();
