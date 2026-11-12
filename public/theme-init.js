// Sets the theme before the first paint (index.html loads it in <head>).
// Route pages arrive with their content in the HTML (scripts/prerender-content.js),
// so without this a dark-theme visitor saw the light page until React mounted
// and App.tsx added the class. Same rule as App.tsx: the saved theme, else the
// system setting. It must stay a tiny classic script with no imports.
/* global document, localStorage, window */
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch {
    // Storage blocked (private mode, strict settings): follow the system.
  }
  if (!theme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  }
  if (theme === 'dark') document.documentElement.classList.add('dark');
})();
