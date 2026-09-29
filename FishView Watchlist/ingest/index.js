import { parseSymbol } from "../lists/book.js";
import { preferNseThenBse } from "../listings/kind.js";
import { splitPasteTokens, PASTE_MAX } from "./split.js";
import { parseCsvText, formatCsv, capAt150 } from "./csv.js";
import { formatBulkLog, downloadText } from "./log.js";

export { PASTE_MAX, splitPasteTokens } from "./split.js";
export { parseCsvText, formatCsv, capAt150 } from "./csv.js";
export { formatBulkLog, downloadText } from "./log.js";

export function placeholderMessage() {
  return "";
}

export function resolvePasteToken(raw) {
  const s = String(raw || "").trim();
  const prefixed = parseSymbol(s);
  if (/^(NSE|BSE|NASDAQ|NYSE)\s*:/i.test(s)) return prefixed;
  const nse = preferNseThenBse(s);
  if (nse.ok) return { exchange: nse.exchange, ticker: nse.ticker };
  return prefixed;
}
