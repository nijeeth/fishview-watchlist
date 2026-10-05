export const INDEX_NAMES = new Set([
  "NIFTY", "NIFTY50", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTYNXT50",
  "SENSEX", "BANKEX", "INDIAVIX", "CNXAUTO", "CNXIT", "CNXPHARMA", "CNXFMCG",
  "CNXMETAL", "CNXREALTY", "CNXENERGY", "CNXINFRA", "NIFTYIT", "NIFTYBANK",
]);

function cleanTicker(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9.&^=_-]/g, "")
    .slice(0, 24);
}

/** Bare paste: store NSE. Prefixed CSV/paste is honored in ingest, not here. */
export function preferNseThenBse(raw) {
  const ticker = cleanTicker(raw);
  if (!ticker) return { ok: false, error: "Symbol required" };
  return { ok: true, exchange: "NSE", ticker };
}

export function listingKind(ticker, exchange) {
  const t = String(ticker || "").toUpperCase();
  const ex = String(exchange || "").toUpperCase();
  if (INDEX_NAMES.has(t) || ex === "INDEX") return "index";
  if (/(CE|PE|FUT)$/i.test(t) && /\d/.test(t)) return "derivative";
  if (["NSE", "BSE", "NASDAQ", "NYSE"].includes(ex)) return "equity";
  if (/^(BINANCE|BITSTAMP|COINBASE|CRYPTO|BITFINEX|BYBIT|OKX)/.test(ex)) return "other";
  if (ex) return "equity";
  return "other";
}
