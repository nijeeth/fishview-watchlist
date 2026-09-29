import { listingKind } from "../listings/kind.js";
import { fetchChartMeta, fetchYahooQuote, fetchYahooQuoteBatch, yahooPaused } from "./fetch.js";
import {
  anyExchangeOpen,
  bellwethersFor,
  isQuoteStale,
  shouldProbeHours,
} from "./hours.js";
import { quoteKey, yahooSymbol } from "./yahoo-sym.js";

const LIVE_TTL_MS = 60000;
const CONCURRENCY = 4;
const cache = new Map();
const failUntil = new Map();
const hoursWarm = new Map();

const BLANK = { blank: true, price: null, pct: null, mcap: null, fetchedAt: 0 };

export function formatPrice(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatMcap(n, exchange) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "--";
  const ex = String(exchange || "").toUpperCase();
  if (ex === "NSE" || ex === "BSE") {
    const cr = n / 1e7;
    if (cr >= 1e5) return `${(cr / 1e5).toFixed(2)}L Cr`;
    if (cr >= 100) return `${Math.round(cr)} Cr`;
    if (cr >= 1) return `${cr.toFixed(1)} Cr`;
    return `${Math.round(n)}`;
  }
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return `${Math.round(n)}`;
}

export function getCachedQuote(exchange, ticker) {
  return cache.get(quoteKey(exchange, ticker)) || null;
}

async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const n = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    })
  );
  return out;
}

async function warmHours(exchange) {
  const ex = String(exchange || "").toUpperCase();
  if (!shouldProbeHours(ex) || yahooPaused()) return;
  if (hoursWarm.has(ex)) return hoursWarm.get(ex);
  const job = (async () => {
    for (const sym of bellwethersFor(ex)) {
      const meta = await fetchChartMeta(sym, ex);
      if (meta) return;
    }
  })().finally(() => hoursWarm.delete(ex));
  hoursWarm.set(ex, job);
  return job;
}

async function loadOne(stock, force) {
  const kind = listingKind(stock.ticker, stock.exchange);
  const key = quoteKey(stock.exchange, stock.ticker);
  if (kind === "derivative" || kind === "other") {
    const row = { ...BLANK, blank: true, kind, fetchedAt: Date.now() };
    cache.set(key, row);
    return row;
  }
  const hit = cache.get(key);
  if (!force && hit && !isQuoteStale(stock.exchange, hit.fetchedAt, LIVE_TTL_MS)) return hit;
  const blocked = failUntil.get(key);
  if (!force && blocked && Date.now() < blocked) return hit || { ...BLANK, kind };
  if (yahooPaused()) return hit || { ...BLANK, kind };

  const sym = yahooSymbol(stock.exchange, stock.ticker);
  const q = await fetchYahooQuote(sym, stock.exchange);
  if (!q) {
    failUntil.set(key, Date.now() + 5 * 60 * 1000);
    const row = hit || { ...BLANK, kind, fetchedAt: Date.now() };
    cache.set(key, row);
    return row;
  }
  failUntil.delete(key);
  const row = {
    blank: false,
    kind,
    price: q.price,
    pct: q.pct,
    mcap: kind === "index" ? null : q.mcap,
    fetchedAt: Date.now(),
  };
  cache.set(key, row);
  return row;
}

export async function quotesForOpenList(stocks, { force = false } = {}) {
  const list = stocks || [];
  const exchanges = [...new Set(list.map((s) => s.exchange))];
  await Promise.all(exchanges.map((ex) => warmHours(ex)));

  const todo = [];
  for (const s of list) {
    const kind = listingKind(s.ticker, s.exchange);
    const key = quoteKey(s.exchange, s.ticker);
    if (kind === "derivative" || kind === "other") {
      cache.set(key, { ...BLANK, blank: true, kind, fetchedAt: Date.now() });
      continue;
    }
    const hit = cache.get(key);
    if (!force && hit && !isQuoteStale(s.exchange, hit.fetchedAt, LIVE_TTL_MS)) continue;
    const blocked = failUntil.get(key);
    if (!force && blocked && Date.now() < blocked) continue;
    todo.push(s);
  }

  if (todo.length && !yahooPaused()) {
    const byYahoo = todo.map((s) => ({ stock: s, yahoo: yahooSymbol(s.exchange, s.ticker) }));
    const batch = await fetchYahooQuoteBatch(byYahoo.map((x) => x.yahoo));
    for (const { stock, yahoo } of byYahoo) {
      const kind = listingKind(stock.ticker, stock.exchange);
      const key = quoteKey(stock.exchange, stock.ticker);
      const q = batch.get(String(yahoo).toUpperCase());
      if (!q) continue;
      failUntil.delete(key);
      cache.set(key, {
        blank: false,
        kind,
        price: q.price,
        pct: q.pct,
        mcap: kind === "index" ? null : q.mcap,
        fetchedAt: Date.now(),
      });
    }
    const missed = todo.filter((s) => {
      const q = cache.get(quoteKey(s.exchange, s.ticker));
      return !q || typeof q.price !== "number";
    });
    await mapPool(missed, CONCURRENCY, (s) => loadOne(s, true));
  }

  const map = new Map();
  for (const s of list) map.set(quoteKey(s.exchange, s.ticker), cache.get(quoteKey(s.exchange, s.ticker)) || BLANK);
  return map;
}

export function quotesNeedLivePoll(stocks) {
  return anyExchangeOpen((stocks || []).map((s) => s.exchange));
}

export { quoteKey };
