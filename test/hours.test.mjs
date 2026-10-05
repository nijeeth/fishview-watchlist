import { test } from "node:test";
import assert from "node:assert/strict";

const { updateHours, isOpen, anyExchangeOpen, isQuoteStale, shouldProbeHours, bellwethersFor } =
  await import("../quotes/hours.js");

const now = Math.floor(Date.now() / 1000);

test("isOpen true inside session, false after close", () => {
  updateHours("NSE", { regular: { start: now - 3600, end: now + 3600, gmtoffset: 19800 } });
  assert.equal(isOpen("NSE"), true);
  updateHours("BSE", { regular: { start: now - 7200, end: now - 3600, gmtoffset: 19800 } });
  assert.equal(isOpen("BSE"), false);
});

test("anyExchangeOpen requires known session data", () => {
  assert.equal(anyExchangeOpen(["UNKNOWNX"]), false);
  updateHours("NSE", { regular: { start: now - 3600, end: now + 3600, gmtoffset: 19800 } });
  assert.equal(anyExchangeOpen(["NSE", "UNKNOWNX"]), true);
});

test("isQuoteStale: always stale without fetchedAt", () => {
  assert.equal(isQuoteStale("NSE", 0), true);
});

test("shouldProbeHours probes only stale/unknown sessions", () => {
  updateHours("NSE", { regular: { start: now - 3600, end: now + 3600, gmtoffset: 19800 } });
  assert.equal(shouldProbeHours("NSE"), false);
});

test("bellwethersFor returns probe symbols", () => {
  assert.deepEqual(bellwethersFor("NSE"), ["RELIANCE.NS", "INFY.NS"]);
  assert.deepEqual(bellwethersFor("NASDAQ"), ["AAPL", "MSFT"]);
  assert.deepEqual(bellwethersFor("LSE"), []);
});
