import { INDEX_NAMES, listingKind } from "../listings/kind.js";

const INDEX_YAHOO = {
  NIFTY: "^NSEI",
  NIFTY50: "^NSEI",
  BANKNIFTY: "^NSEBANK",
  NIFTYBANK: "^NSEBANK",
  SENSEX: "^BSESN",
  BANKEX: "^BSESN",
  FINNIFTY: "^CNXFIN",
  MIDCPNIFTY: "^NSEMDCP50",
  NIFTYNXT50: "^NIFTYNXT50",
  INDIAVIX: "^INDIAVIX",
  CNXIT: "^CNXIT",
  NIFTYIT: "^CNXIT",
  CNXAUTO: "^CNXAUTO",
  CNXPHARMA: "^CNXPHARMA",
  CNXFMCG: "^CNXFMCG",
  CNXMETAL: "^CNXMETAL",
  CNXREALTY: "^CNXREALTY",
  CNXENERGY: "^CNXENERGY",
  CNXINFRA: "^CNXINFRA",
};

export function quoteKey(exchange, ticker) {
  return `${String(exchange || "NSE").toUpperCase()}:${String(ticker || "").toUpperCase()}`;
}

export function yahooSymbol(exchange, ticker) {
  const t = String(ticker || "").toUpperCase();
  const ex = String(exchange || "NSE").toUpperCase();
  if (INDEX_YAHOO[t]) return INDEX_YAHOO[t];
  if (INDEX_NAMES.has(t)) return `^${t.replace(/[^A-Z0-9]/g, "")}`;
  // Yahoo-native index/future symbols go through unchanged.
  if (t.startsWith("^") || t.includes("=")) return t;
  // TradingView underscore form -> Yahoo hyphen form (BRK_B -> BRK-B).
  const y = t.replace(/_/g, "-");
  if (ex === "NASDAQ" || ex === "NYSE") return y;
  if (ex === "BSE") return `${y}.BO`;
  if (ex === "NSE") return `${y}.NS`;
  return y;
}

export { listingKind };
