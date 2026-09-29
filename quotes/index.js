import { notBuilt } from "../shared/placeholder.js";
import { phaseLive } from "../config/phase.js";
import {
  formatMcap,
  formatPct,
  formatPrice,
  getCachedQuote,
  quotesForOpenList,
  quotesNeedLivePoll,
  quoteKey,
} from "./desk.js";

export function placeholderMessage() {
  return notBuilt(6);
}

export async function quotesForOpenListOnly(stocks, opts) {
  if (!phaseLive(6)) return { error: placeholderMessage() };
  const map = await quotesForOpenList(stocks, opts);
  return { ok: true, map };
}

export {
  formatMcap,
  formatPct,
  formatPrice,
  getCachedQuote,
  quotesNeedLivePoll,
  quoteKey,
};
