(async () => {
  try {
    const response = await fetch('/api/me', { cache: 'no-store' });
    const { user } = response.ok ? await response.json() : { user: null };
    if (!user) {
      window.location.replace('/?auth=login-required');
      return;
    }
    const name = user.globalName || user.username || 'Alpár játékos';
    const profileName = document.getElementById('profileName');
    const profileId = document.getElementById('profileId');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileName) profileName.textContent = name;
    if (profileId) profileId.textContent = `Discord ID: ${user.id}`;
    if (profileAvatar) {
      profileAvatar.textContent = '';
      profileAvatar.style.backgroundImage = `url("${String(user.avatarUrl || '').replace(/["\\]/g, '')}")`;
      profileAvatar.style.backgroundSize = 'cover';
      profileAvatar.style.backgroundPosition = 'center';
    }
  } catch (_) {
    window.location.replace('/?auth=login-required');
  }

  document.getElementById('logoutButton')?.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.replace('/');
  });
})();
