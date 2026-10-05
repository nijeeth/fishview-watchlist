import { updateHours } from "./hours.js";
import { yahooGet } from "../shared/yahoo-http.js";

let rateUntil = 0;
let rateWindow = 60000;

export function yahooPaused() {
  return Date.now() < rateUntil;
}

function note429() {
  rateUntil = Date.now() + rateWindow;
  rateWindow = Math.min(rateWindow * 2, 300000);
}

function noteOk() {
  if (rateUntil && Date.now() >= rateUntil) {
    rateUntil = 0;
    rateWindow = 60000;
  }
}

async function fetchJson(url, force) {
  if (yahooPaused()) return null;
  const res = await yahooGet(url, force);
  if (res.status === 429) {
    note429();
    return null;
  }
  if (!res.ok) return null;
  noteOk();
  return res.json;
}

function raw(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v?.raw === "number" && Number.isFinite(v.raw)) return v.raw;
  return null;
}

function prevCloseFromChart(res) {
  const timestamps = res?.timestamp || [];
  const closes = res?.indicators?.quote?.[0]?.close || [];
  const gmtoffset = typeof res?.meta?.gmtoffset === "number" ? res.meta.gmtoffset : 0;
  const sessionDay = (ts) => Math.floor((ts + gmtoffset) / 86400);
  let anchor = -1;
  const rmt = res?.meta?.regularMarketTime;
  if (typeof rmt === "number") {
    const target = sessionDay(rmt);
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (sessionDay(timestamps[i]) === target) {
        anchor = i;
        break;
      }
    }
  }
  if (anchor < 0) {
    for (let i = closes.length - 1; i >= 0; i--) {
      if (closes[i] != null) {
        anchor = i;
        break;
      }
    }
  }
  if (anchor <= 0) return raw(res?.meta?.chartPreviousClose) ?? raw(res?.meta?.previousClose);
  const prev = closes[anchor - 1];
  return typeof prev === "number" && Number.isFinite(prev) ? prev : raw(res?.meta?.chartPreviousClose);
}

export async function fetchChartMeta(yahooSym, exchange) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=1d`;
  const json = await fetchJson(url);
  const meta = json?.chart?.result?.[0]?.meta;
  if (meta?.currentTradingPeriod) updateHours(exchange, meta.currentTradingPeriod);
  return meta || null;
}

export async function fetchYahooQuoteBatch(yahooSymbols, force = false) {
  const list = [...new Set((yahooSymbols || []).filter(Boolean))];
  const out = new Map();
  const chunk = 20;
  for (let i = 0; i < list.length; i += chunk) {
    const part = list.slice(i, i + chunk);
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${part.map(encodeURIComponent).join(",")}`;
    let json = await fetchJson(url, force);
    if (!json) {
      json = await fetchJson(
        `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${part.map(encodeURIComponent).join(",")}`,
        force
      );
    }
    const rows = json?.quoteResponse?.result;
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      const price = raw(r.regularMarketPrice);
      if (typeof price !== "number") continue;
      const pct = raw(r.regularMarketChangePercent);
      const mcap = raw(r.marketCap);
      out.set(String(r.symbol || "").toUpperCase(), {
        price,
        pct: typeof pct === "number" ? pct : null,
        mcap: typeof mcap === "number" && mcap > 0 ? mcap : null,
      });
    }
  }
  return out;
}

export async function fetchYahooQuote(yahooSym, exchange, force = false) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`;
  let json = await fetchJson(url, force);
  if (!json) {
    json = await fetchJson(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`,
      force
    );
  }
  const res = json?.chart?.result?.[0];
  if (!res) return null;
  if (res.meta?.currentTradingPeriod) updateHours(exchange, res.meta.currentTradingPeriod);
  const price = raw(res.meta?.regularMarketPrice);
  if (typeof price !== "number") return null;
  let pct = raw(res.meta?.regularMarketChangePercent);
  if (typeof pct !== "number") {
    const prev = prevCloseFromChart(res);
    pct = typeof prev === "number" && prev !== 0 ? ((price - prev) / prev) * 100 : null;
  }
  let mcap = raw(res.meta?.marketCap);
  if (mcap == null && !yahooPaused()) {
    const sum = await fetchJson(
      `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSym)}?modules=price`
    );
    mcap = raw(sum?.quoteSummary?.result?.[0]?.price?.marketCap);
  }
  return { price, pct, mcap };
}
