import {
  formatMcap,
  formatPct,
  formatPrice,
  getCachedQuote,
  quotesForOpenList,
  quotesNeedLivePoll,
  quoteKey,
} from "./desk.js";

export async function quotesForOpenListOnly(stocks, opts) {
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
