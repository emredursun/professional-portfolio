// Runs before the blog's stylesheets, so the right theme is set before the
// first paint. It must stay a tiny classic script with no imports.
//
// Same rule as the portfolio (App.tsx): a theme is pinned only when the
// visitor chose it with the toggle (userToggledTheme). App.tsx stores "theme"
// even when it only copied the system setting, so reading "theme" alone would
// show a stale light page to someone whose OS has since switched to dark.
// Without a pinned theme the CSS follows prefers-color-scheme.
/* global document, localStorage */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (localStorage.getItem('userToggledTheme') === 'true') {
      var theme = localStorage.getItem('theme');
      if (theme === 'dark' || theme === 'light') root.classList.add(theme);
    }
  } catch {
    // Storage blocked (private mode, strict settings): follow the system.
  }
})();
