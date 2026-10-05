import { parseSymbol } from "../lists/book.js";
import { preferNseThenBse } from "../listings/kind.js";
import { splitPasteTokens, PASTE_MAX } from "./split.js";
import { parseCsvText, formatCsv, capAtStockCap } from "./csv.js";
import { formatBulkLog, downloadText } from "./log.js";

export { PASTE_MAX, splitPasteTokens } from "./split.js";
export { parseCsvText, formatCsv, capAtStockCap } from "./csv.js";
export { formatBulkLog, downloadText } from "./log.js";

export function resolvePasteToken(raw) {
  const s = String(raw || "").trim();
  const prefixed = parseSymbol(s);
  // Any PREFIX: input goes through parseSymbol — honors exchange aliases
  // and rejects unknown prefixes (ticker "").
  if (/^[A-Z0-9]{1,16}\s*:/i.test(s)) return prefixed;
  const nse = preferNseThenBse(s);
  if (nse.ok) return { exchange: nse.exchange, ticker: nse.ticker };
  return prefixed;
}
