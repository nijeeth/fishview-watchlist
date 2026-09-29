export function tickerFromScreenerUrl(url) {
  try {
    const path = new URL(url, location.origin).pathname;
    const m = path.match(/\/company\/([A-Za-z0-9.&-]+)/);
    if (!m) return null;
    const t = m[1].toUpperCase();
    if (t === "COMPARE" || t === "SEARCH") return null;
    return t;
  } catch (_) {
    return null;
  }
}
