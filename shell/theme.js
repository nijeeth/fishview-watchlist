/**
 * TradingView light/dark. From Chart Funda tv-panel/content.js detectTheme (same author).
 */
export function readTvTheme() {
  const isDark =
    document.documentElement.classList.contains("theme-dark") ||
    document.body.classList.contains("theme-dark") ||
    !!document.querySelector('[class*="theme-dark"]');
  return isDark ? "dark" : "light";
}

export function watchTvTheme(onChange) {
  const fire = () => onChange(readTvTheme());
  fire();
  const obs = new MutationObserver(fire);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
