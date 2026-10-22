'use strict';
(() => {
  const root = document.documentElement,
    button = document.getElementById('detail-theme');
  function apply(theme) {
    root.dataset.theme = theme;
    button?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
  try {
    const saved = localStorage.getItem('hb-portfolio-theme');
    if (saved === 'light' || saved === 'dark') apply(saved);
  } catch {}
  button?.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(theme);
    try {
      localStorage.setItem('hb-portfolio-theme', theme);
    } catch {}
  });
})();
