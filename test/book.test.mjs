import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.chrome = {
  storage: {
    local: {
      _data: {},
      get(key, cb) {
        if (Array.isArray(key)) {
          const out = {};
          for (const k of key) out[k] = this._data[k];
          cb(out);
        } else cb({ [key]: this._data[key] });
      },
      set(o, cb) {
        Object.assign(this._data, o);
        cb();
      },
      remove(k, cb) {
        for (const key of [].concat(k)) delete this._data[key];
        cb();
      },
    },
  },
};

const {
  STOCK_CAP,
  LIST_CAP,
  NAME_MAX,
  ALL_STOCKS_ID,
  cleanListName,
  listNameError,
  parseSymbol,
  canonicalExchange,
  normalizeBook,
  defaultBook,
  allUniqueStocks,
  allUniqueList,
  addStock,
} = await import("../lists/book.js");

test("cleanListName allows + - space, blocks other chars, caps at 25", () => {
  assert.equal(cleanListName("  Swing+1  Plan-A  "), "Swing+1 Plan-A");
  assert.equal(cleanListName("my*list!@"), "mylist");
  assert.equal(cleanListName("x".repeat(40)).length, NAME_MAX);
});

test("cleanListName preserves legacy long names via max param", () => {
  const long = "A".repeat(40);
  assert.equal(cleanListName(long, 80), long);
});

test("listNameError enforces rules", () => {
  assert.equal(listNameError(""), "Name required");
  assert.equal(listNameError("x".repeat(26)), `Max ${NAME_MAX} characters`);
  assert.equal(listNameError("bad*name"), "Only letters, numbers, spaces, hyphens and plus");
  assert.equal(listNameError("Swing+1"), "");
});

test("parseSymbol handles prefixes, index/futures chars, junk", () => {
  assert.deepEqual(parseSymbol("NSE:RELIANCE"), { exchange: "NSE", ticker: "RELIANCE" });
  assert.deepEqual(parseSymbol("BOM:TCS"), { exchange: "BSE", ticker: "TCS" });
  assert.deepEqual(parseSymbol("^NSEI"), { exchange: "NSE", ticker: "^NSEI" });
  assert.deepEqual(parseSymbol("NSE:GC=F"), { exchange: "NSE", ticker: "GC=F" });
  assert.deepEqual(parseSymbol("FOO:BAR"), { exchange: "", ticker: "" });
});

test("canonicalExchange maps aliases", () => {
  assert.equal(canonicalExchange("bom"), "BSE");
  assert.equal(canonicalExchange("NSI"), "NSE");
  assert.equal(canonicalExchange("NMS"), "NASDAQ");
  assert.equal(canonicalExchange(""), "");
});

test("normalizeBook caps list count and stock count, cleans names", () => {
  const raw = {
    lists: Array.from({ length: LIST_CAP + 5 }, (_, i) => ({
      id: `l${i}`,
      name: "ok*name!",
      stocks: Array.from({ length: STOCK_CAP + 10 }, (_, j) => ({ exchange: "NSE", ticker: `T${j}` })),
    })),
    activeId: "missing",
  };
  const book = normalizeBook(raw);
  assert.equal(book.lists.length, LIST_CAP);
  assert.equal(book.lists[0].stocks.length, STOCK_CAP);
  assert.equal(book.lists[0].name, "okname");
  assert.equal(book.activeId, "l0"); // missing activeId falls back to first list
});

test("normalizeBook falls back to default book on empty input", () => {
  const book = normalizeBook(null);
  assert.equal(book.lists.length, defaultBook().lists.length);
});

test("allUniqueStocks unions across lists without dupes", () => {
  const book = {
    lists: [
      { id: "a", name: "A", stocks: [{ exchange: "NSE", ticker: "RELIANCE" }, { exchange: "NSE", ticker: "TCS" }] },
      { id: "b", name: "B", stocks: [{ exchange: "NSE", ticker: "TCS" }, { exchange: "BSE", ticker: "TCS" }] },
    ],
  };
  const keys = allUniqueStocks(book).map((s) => `${s.exchange}:${s.ticker}`).sort();
  assert.deepEqual(keys, ["BSE:TCS", "NSE:RELIANCE", "NSE:TCS"]);
  assert.equal(allUniqueList(book).id, ALL_STOCKS_ID);
  assert.equal(allUniqueList(book).stocks.length, 3);
});

test("addStock refuses the STOCK_CAP + 1th stock", async () => {
  const book = normalizeBook({
    lists: [{ id: "a", name: "A", stocks: Array.from({ length: STOCK_CAP }, (_, j) => ({ exchange: "NSE", ticker: `T${j}` })) }],
    activeId: "a",
  });
  const res = await addStock(book, "a", "NSE:EXTRA");
  assert.equal(res.ok, false);
});
