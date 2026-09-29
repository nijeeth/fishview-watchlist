import { LIST_CAP, STOCK_CAP, LABELS, cleanListName, listNameError, nameTaken, saveBook, listsByName } from "./book.js";

function keyOf(s) {
  return `${s.exchange}:${s.ticker}`;
}

function parseKey(key) {
  const i = String(key || "").indexOf(":");
  if (i < 1) return null;
  return { exchange: key.slice(0, i), ticker: key.slice(i + 1) };
}

export async function setLabelsOn(book, listId, keys, label) {
  const want = new Set(keys || []);
  const lab = LABELS.includes(label) ? label : null;
  const next = JSON.parse(JSON.stringify(book));
  const list = next.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, error: "List not found", book };
  let updated = 0;
  for (const s of list.stocks) {
    if (!want.has(keyOf(s))) continue;
    s.label = lab;
    updated += 1;
  }
  return { ok: true, updated, book: await saveBook(next) };
}

export async function removeStocks(book, listId, keys) {
  const want = new Set(keys || []);
  const next = JSON.parse(JSON.stringify(book));
  const list = next.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, error: "List not found", book };
  const before = list.stocks.length;
  list.stocks = list.stocks.filter((s) => !want.has(keyOf(s)));
  return { ok: true, removed: before - list.stocks.length, book: await saveBook(next) };
}

function transfer(next, fromId, toId, keys, { move }) {
  const from = next.lists.find((l) => l.id === fromId);
  const to = next.lists.find((l) => l.id === toId);
  if (!from || !to) return { ok: false, error: "List not found" };
  if (fromId === toId) return { ok: false, error: "Pick another list" };
  let done = 0;
  let skipped = 0;
  for (const key of keys || []) {
    const parts = parseKey(key);
    if (!parts) {
      skipped += 1;
      continue;
    }
    const row = from.stocks.find((s) => s.ticker === parts.ticker && s.exchange === parts.exchange);
    if (!row) {
      skipped += 1;
      continue;
    }
    if (to.stocks.some((s) => s.ticker === parts.ticker && s.exchange === parts.exchange)) {
      skipped += 1;
      continue;
    }
    if (to.stocks.length >= STOCK_CAP) {
      skipped += 1;
      continue;
    }
    to.stocks.push({ exchange: parts.exchange, ticker: parts.ticker, label: null });
    if (move) {
      from.stocks = from.stocks.filter((s) => !(s.ticker === parts.ticker && s.exchange === parts.exchange));
    }
    done += 1;
  }
  return { ok: true, done, skipped };
}

export async function copyStocks(book, fromId, toId, keys) {
  const next = JSON.parse(JSON.stringify(book));
  const res = transfer(next, fromId, toId, keys, { move: false });
  if (!res.ok) return { ...res, book };
  return { ok: true, copied: res.done, skipped: res.skipped, book: await saveBook(next) };
}

export async function moveStocks(book, fromId, toId, keys) {
  const next = JSON.parse(JSON.stringify(book));
  const res = transfer(next, fromId, toId, keys, { move: true });
  if (!res.ok) return { ...res, book };
  return { ok: true, moved: res.done, skipped: res.skipped, book: await saveBook(next) };
}

export async function createDestList(book, name) {
  if (book.lists.length >= LIST_CAP) return { ok: false, error: `Maximum ${LIST_CAP} lists`, book };
  const trimmed = cleanListName(name);
  const bad = listNameError(name) || listNameError(trimmed);
  if (bad) return { ok: false, error: bad, book };
  if (nameTaken(book, trimmed)) return { ok: false, error: "Watchlist Exists", book };
  const next = JSON.parse(JSON.stringify(book));
  const id = `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  next.lists.push({ id, name: trimmed, stocks: [] });
  return { ok: true, id, name: trimmed, book: await saveBook(next) };
}

export function otherLists(book, activeId) {
  return listsByName(book.lists.filter((l) => l.id !== activeId));
}
