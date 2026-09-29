/** Chartink stock / chart window (not the screener). */
export function isChartinkChartPage(href = location.href) {
  try {
    const abs = new URL(href, location.origin);
    const p = abs.pathname || "";
    if (p.includes("/stocks-new")) return true;
    if (p.startsWith("/stocks/") && p.endsWith(".html")) return true;
  } catch (_) {}
  return false;
}

/** Chartink stock page URL → ticker. From Chart Funda chartink-redirect (same author). */
export function tickerFromChartinkUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const abs = new URL(url, location.origin);
    const prefixPath = "/stocks/";
    if (abs.pathname.startsWith(prefixPath) && abs.pathname.endsWith(".html")) {
      return abs.pathname.slice(prefixPath.length, -".html".length).trim() || null;
    }
    if (abs.pathname.includes("/stocks-new")) {
      const symbol = abs.searchParams.get("symbol");
      return symbol ? symbol.trim() : null;
    }
  } catch (_) {}
  return null;
}
