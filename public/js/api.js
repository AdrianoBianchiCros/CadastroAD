async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 401) {
    if (!location.pathname.endsWith('login.html')) {
      location.href = 'login.html';
    }
    throw new Error('Nao autenticado.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro ${res.status}`);
  }
  return data;
}

async function requireLogin() {
  try {
    return await apiFetch('/api/auth/me');
  } catch (err) {
    return null;
  }
}

async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' });
  location.href = 'login.html';
}
