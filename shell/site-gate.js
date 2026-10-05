import { get, SITE_PANEL } from "../persist/index.js";

export function hostKind(hostname = location.hostname) {
  const h = String(hostname).toLowerCase();
  if (h.includes("tradingview.com")) return "tradingview";
  if (h.includes("screener.in")) return "screener";
  if (h.includes("chartink.com")) return "chartink";
  if (h.includes("fish-rs-board")) return "fishrs";
  return null;
}

export async function panelAllowedHere() {
  const kind = hostKind();
  if (!kind) return false;
  // The dock is chart-only on TradingView — not on the /screener/ page.
  if (kind === "tradingview" && /^\/screener\/?/i.test(location.pathname)) return false;
  const on = await get(SITE_PANEL[kind]);
  return on !== false;
}
