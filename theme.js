(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;

  try {
    const stored = localStorage.getItem('sqlstack-theme');
    if (stored === 'light' || stored === 'dark') preference = stored;
  } catch {
    // The toggle still works when browser storage is unavailable.
  }

  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0d0f12' : '#ffffff';
    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  apply(preference || (system.matches ? 'dark' : 'light'));

  system.addEventListener('change', () => {
    if (!preference) apply(system.matches ? 'dark' : 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('[data-theme-toggle]');
    apply(root.dataset.theme);
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      apply(preference);
      try {
        localStorage.setItem('sqlstack-theme', preference);
      } catch {
        // Keep the selected theme for this page even without persistent storage.
      }
    });
  });
})();
