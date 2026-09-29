import { INDEX_NAMES } from "./kind.js";
import { getBoardBook } from "./board-book.js";
import { eqCount, hasEq } from "./parse-instruments.js";
import { yahooGet } from "../shared/yahoo-http.js";

async function yahooHasQuote(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
  const res = await yahooGet(url);
  if (!res.ok) return false;
  const json = res.json;
  if (json?.chart?.error) return false;
  const close = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
  const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (typeof price === "number" && Number.isFinite(price)) return true;
  return Array.isArray(close) && close.some((v) => v != null && Number.isFinite(v));
}

function mapReady(map) {
  return eqCount(map) > 50;
}

export async function listingExists(exchange, ticker, yahooFallback = true) {
  const ex = String(exchange || "").toUpperCase();
  const t = String(ticker || "").toUpperCase();
  if (!t) return false;
  if (INDEX_NAMES.has(t) && (ex === "NSE" || ex === "BSE" || !ex)) return true;

  if (ex === "NASDAQ" || ex === "NYSE") {
    if (!yahooFallback) return false;
    return yahooHasQuote(t);
  }

  const map = await getBoardBook();
  if (mapReady(map)) return hasEq(map, ex === "BSE" ? "BSE" : "NSE", t);
  if (!yahooFallback) return false;

  if (ex === "BSE") return yahooHasQuote(`${t}.BO`);
  return yahooHasQuote(`${t}.NS`);
}

export async function boardBookReady() {
  const map = await getBoardBook();
  return mapReady(map);
}

export async function filterKnownListings(items, yahooFallback = true) {
  const list = items || [];
  const needsIndia = list.some((it) => {
    const ex = String(it.exchange || "NSE").toUpperCase();
    return ex === "NSE" || ex === "BSE" || !it.exchange;
  });
  const bookOk = needsIndia ? await boardBookReady() : true;
  if (needsIndia && !bookOk && yahooFallback) {
    const probe = await yahooHasQuote("RELIANCE.NS");
    if (!probe) return { known: [], unknown: list, ready: false };
  } else if (needsIndia && !bookOk && !yahooFallback) {
    return { known: [], unknown: list, ready: false };
  }
  const known = [];
  const unknown = [];
  for (const it of list) {
    const ok = await listingExists(it.exchange, it.ticker, yahooFallback);
    if (ok) known.push(it);
    else unknown.push(it);
  }
  return { known, unknown, ready: true };
}
