import { test } from "node:test";
import assert from "node:assert/strict";

const { parseCsvText, formatCsv, capAtStockCap } = await import("../ingest/csv.js");
const { STOCK_CAP } = await import("../lists/book.js");

test("parseCsvText reads prefixed symbols", () => {
  const res = parseCsvText("NSE:RELIANCE,BSE:TCS\nNSE:INFY");
  assert.equal(res.ok, true);
  assert.deepEqual(
    res.rows.map((r) => `${r.exchange}:${r.ticker}`),
    ["NSE:RELIANCE", "BSE:TCS", "NSE:INFY"]
  );
});

test("parseCsvText skips a header row and rejects bare tickers", () => {
  const withHeader = parseCsvText("symbol,NSE:RELIANCE");
  assert.equal(withHeader.ok, true);
  assert.equal(withHeader.rows.length, 1);

  const bare = parseCsvText("RELIANCE,TCS");
  assert.equal(bare.ok, false);
});

test("parseCsvText rejects US prefixes, no commas, and empty input", () => {
  assert.equal(parseCsvText("NASDAQ:AAPL").ok, false);
  assert.equal(parseCsvText("NSE:RELIANCE\nNSE:TCS").ok, false); // no comma
  assert.equal(parseCsvText("  ").ok, false);
});

test("parseCsvText refuses over the stock cap", () => {
  const csv = Array.from({ length: STOCK_CAP + 1 }, (_, i) => `NSE:T${i}`).join(",");
  assert.equal(parseCsvText(csv).ok, false);
});

test("capAtStockCap passes at cap, fails above", () => {
  assert.equal(capAtStockCap(STOCK_CAP).ok, true);
  assert.equal(capAtStockCap(STOCK_CAP + 1).ok, false);
});

test("formatCsv round-trips through parseCsvText", () => {
  const list = { name: "Swing", stocks: [{ exchange: "NSE", ticker: "RELIANCE" }, { exchange: "BSE", ticker: "TCS" }] };
  const res = parseCsvText(formatCsv(list));
  assert.equal(res.ok, true);
  assert.equal(res.rows.length, 2);
});
