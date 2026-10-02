/**
 * Watchlist caution banner. v1.0.0 ships all listed features.
 * phaseLive(n) stays true for n ≤ ACTIVE_PHASE so existing gates stay on.
 */
export const ACTIVE_PHASE = 6;

export const PHASE_NAME = {
  1: "Shell — dock, tabs, theme match, placeholders",
  2: "Lists — 50 lists × 150 stocks, labels, sort",
  3: "Charts — same-window TV switch + Current",
  4: "Ingest — paste (max 5), CSV import/export, bulk log",
  5: "Sites — Screener + Chartink scan and per-row +",
  6: "Careful: Not realtime. Prices from Yahoo every 60s",
  7: "Cloud — user Supabase connect, then sync",
};

export function phaseLive(n) {
  return ACTIVE_PHASE >= n;
}

export function phaseLabel(n) {
  return `Phase ${n} — ${PHASE_NAME[n] || "unknown"}`;
}

export function phaseBanner(n) {
  if (n === 6) return PHASE_NAME[6];
  return phaseLabel(n);
}
