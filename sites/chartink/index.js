import { tickerFromChartinkUrl, isChartinkChartPage } from "./url.js";
import { watchTablePlus } from "../../shared/row-plus.js";
import { placeholderMessage } from "./placeholder.js";

export { tickerFromChartinkUrl, isChartinkChartPage, placeholderMessage };

/** Chartink's own Dark class on <html>, not FishView Night. */
export function chartinkSiteIsDark() {
  return document.documentElement.classList.contains("dark");
}

export function chartinkChartDarkOffer() {
  return isChartinkChartPage() && chartinkSiteIsDark();
}

/** Chartink localStorage: 1 Light, 2 Dark, 3 System. */
export function applyChartinkDayTheme() {
  try {
    localStorage.setItem("theme", "1");
  } catch (_) {}
  document.documentElement.classList.remove("dark");
}

export function watchChartinkChartDark(onChange) {
  let last = `${isChartinkChartPage()}|${chartinkSiteIsDark()}`;
  const fire = () => {
    const next = `${isChartinkChartPage()}|${chartinkSiteIsDark()}`;
    if (next === last) return;
    last = next;
    onChange();
  };
  const mo = new MutationObserver(fire);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  history.pushState = (...args) => {
    const r = push(...args);
    fire();
    return r;
  };
  history.replaceState = (...args) => {
    const r = replace(...args);
    fire();
    return r;
  };
  window.addEventListener("popstate", fire);
  return () => {
    mo.disconnect();
    history.pushState = push;
    history.replaceState = replace;
    window.removeEventListener("popstate", fire);
  };
}

export function currentChartinkListing() {
  const ticker = tickerFromChartinkUrl(location.href);
  if (!ticker) return null;
  return { exchange: "NSE", ticker: String(ticker).toUpperCase() };
}

export function collectChartinkTickers() {
  const seen = new Set();
  const tickers = [];
  const links = document.querySelectorAll("table a[href*='/stocks'], a[href*='/stocks-new']");
  for (const a of links) {
    const t = tickerFromChartinkUrl(a.href);
    if (!t) continue;
    const up = String(t).toUpperCase();
    if (seen.has(up)) continue;
    seen.add(up);
    tickers.push(up);
  }
  return tickers;
}

export function startChartinkPlus() {
  return watchTablePlus({
    matchHref: (href) => href.includes("/stocks"),
    tickerFromHref: tickerFromChartinkUrl,
  });
}
