import { tickerFromScreenerUrl } from "./url.js";
import { watchTablePlus } from "../../shared/row-plus.js";

export { tickerFromScreenerUrl };

export function currentScreenerListing() {
  const ticker = tickerFromScreenerUrl(location.href);
  if (!ticker) return null;
  return { exchange: "NSE", ticker };
}

export function collectScreenerTickers() {
  const seen = new Set();
  const tickers = [];
  const links = document.querySelectorAll("table a[href*='/company/']");
  for (const a of links) {
    const t = tickerFromScreenerUrl(a.href);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    tickers.push(t);
  }
  return tickers;
}

export function startScreenerPlus() {
  return watchTablePlus({
    matchHref: (href) => href.includes("/company/"),
    tickerFromHref: tickerFromScreenerUrl,
  });
}
