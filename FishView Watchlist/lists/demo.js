/** Demo list for Phase 2 filter/sort testing. Not the Default list. */
export const DEMO_LIST_ID = "wl_demo";
export const DEMO_LIST_NAME = "Demo";

const DEMO_TICKERS = [
  "RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK",
  "SBIN", "BHARTIARTL", "ITC", "HINDUNILVR", "LT",
  "KOTAKBANK", "AXISBANK", "BAJFINANCE", "MARUTI", "SUNPHARMA",
  "TITAN", "ASIANPAINT", "WIPRO", "NESTLEIND", "ULTRACEMCO",
  "POWERGRID", "NTPC", "TATAMOTORS", "TATASTEEL", "JSWSTEEL",
  "ADANIENT", "ADANIPORTS", "HCLTECH", "TECHM", "ONGC",
  "COALINDIA", "BAJAJFINSV", "M&M", "CIPLA", "DRREDDY",
  "DIVISLAB", "GRASIM", "BPCL", "BRITANNIA", "EICHERMOT",
  "HEROMOTOCO", "INDUSINDBK", "HDFCLIFE", "SBILIFE", "TATACONSUM",
  "HINDALCO", "VEDL", "DLF", "GODREJCP", "PIDILITIND",
];

const CYCLE = ["green", "blue", "orange", "red", null];

export function demoStocks() {
  return DEMO_TICKERS.map((ticker, i) => ({
    exchange: "NSE",
    ticker,
    label: CYCLE[i % CYCLE.length],
  }));
}

export function demoList() {
  return { id: DEMO_LIST_ID, name: DEMO_LIST_NAME, stocks: demoStocks() };
}
