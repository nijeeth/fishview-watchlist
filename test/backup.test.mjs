import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.chrome = {
  storage: {
    local: {
      _data: {},
      get(key, cb) {
        cb({ [key]: this._data[key] });
      },
      set(o, cb) {
        Object.assign(this._data, o);
        cb();
      },
      remove() {},
    },
  },
};

const { backupJson, backupFileName, parseBackupText } = await import("../lists/backup.js");
const { normalizeBook } = await import("../lists/book.js");

const book = normalizeBook({
  lists: [
    { id: "a", name: "Swing", stocks: [{ exchange: "NSE", ticker: "RELIANCE", label: "green" }] },
    { id: "b", name: "Long", stocks: [{ exchange: "BSE", ticker: "TCS" }] },
  ],
  activeId: "a",
});

test("backupJson -> parseBackupText round-trips", () => {
  const res = parseBackupText(backupJson(book));
  assert.equal(res.ok, true);
  assert.equal(res.book.lists.length, 2);
  assert.equal(res.book.lists[0].stocks[0].ticker, "RELIANCE");
  assert.equal(res.book.lists[0].stocks[0].label, "green");
});

test("parseBackupText rejects junk and empty books", () => {
  assert.equal(parseBackupText("not json").ok, false);
  assert.equal(parseBackupText("{}").ok, false);
  assert.equal(parseBackupText(JSON.stringify({ kind: "fv-list-book", schema: 1, book: { lists: [] } })).ok, false);
});

test("backupFileName has the expected shape", () => {
  assert.match(backupFileName(), /^fishview-backup-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
});
