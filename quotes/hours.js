/** Yahoo `currentTradingPeriod.regular` is the session clock. No holiday list. */

const SETTLE_S = 900;
const PROBE_MS = 60 * 60 * 1000;
const IST_S = 19800;

const periods = new Map();

export function updateHours(exchange, currentTradingPeriod) {
  const regular = currentTradingPeriod?.regular;
  if (!exchange || typeof regular?.start !== "number" || typeof regular?.end !== "number") return;
  const ex = String(exchange).toUpperCase();
  periods.set(ex, {
    start: regular.start,
    end: regular.end,
    gmtoffset: typeof regular.gmtoffset === "number" ? regular.gmtoffset : IST_S,
    lastProbedMs: Date.now(),
  });
}

export function isOpen(exchange) {
  const period = periods.get(String(exchange || "").toUpperCase());
  if (!period) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= period.start && now <= period.end + SETTLE_S;
}

export function isHoursStale(exchange) {
  const period = periods.get(String(exchange || "").toUpperCase());
  if (!period) return true;
  const off = period.gmtoffset;
  const dayOf = (unix) => Math.floor((unix + off) / 86400);
  return dayOf(period.end) < dayOf(Math.floor(Date.now() / 1000));
}

export function shouldProbeHours(exchange) {
  if (!isHoursStale(exchange)) return false;
  const period = periods.get(String(exchange || "").toUpperCase());
  if (!period?.lastProbedMs) return true;
  return Date.now() - period.lastProbedMs >= PROBE_MS;
}

export function isQuoteStale(exchange, fetchedAt, liveTtlMs = 60000) {
  if (!fetchedAt) return true;
  if (isOpen(exchange)) return Date.now() - fetchedAt >= liveTtlMs;
  const period = periods.get(String(exchange || "").toUpperCase());
  if (!period) return Date.now() - fetchedAt >= 3600000;
  if (Date.now() < period.start * 1000) return false;
  const settledMs = (period.end + SETTLE_S) * 1000;
  return fetchedAt < settledMs;
}

export function anyExchangeOpen(exchanges) {
  const set = [...new Set((exchanges || []).map((e) => String(e || "").toUpperCase()).filter(Boolean))];
  if (!set.length) return false;
  return set.some((ex) => isOpen(ex));
}

export function bellwethersFor(exchange) {
  const ex = String(exchange || "").toUpperCase();
  if (ex === "BSE") return ["RELIANCE.BO", "INFY.BO"];
  if (ex === "NSE") return ["RELIANCE.NS", "INFY.NS"];
  if (ex === "NASDAQ" || ex === "NYSE") return ["AAPL", "MSFT"];
  return [];
}
