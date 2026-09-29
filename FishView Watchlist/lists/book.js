import { get, set, LIST_BOOK_KEY } from "../persist/index.js";
import { demoList } from "./demo.js";

export const LIST_CAP = 50;
export const STOCK_CAP = 150;
export const BATCH_CAP = 30;

export const LABELS = ["green", "blue", "orange", "red"];
export const FILTER_KEYS = [...LABELS, "none"];
export const HEADER_DOTS = ["green", "red"];

export const LABEL_COLOR = {
  green: "#089981",
  blue: "#2962ff",
  orange: "#f6c445",
  red: "#e53935",
};

export function labelTitle(lab) {
  if (lab === "none" || !lab) return "Unlabel";
  return String(lab).replace(/^\w/, (c) => c.toUpperCase());
}

export function emptyLabelOn() {
  const on = { none: true };
  for (const lab of LABELS) on[lab] = true;
  return on;
}

export function emptyLabelOff() {
  const on = { none: false };
  for (const lab of LABELS) on[lab] = false;
  return on;
}

export function allLabelsSelected(on) {
  return FILTER_KEYS.every((k) => on[k]);
}

export function normalizeLabelOn(raw) {
  const on = emptyLabelOn();
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const k of FILTER_KEYS) {
      if (typeof raw[k] === "boolean") on[k] = raw[k];
    }
  } else if (raw === "none") {
    for (const k of FILTER_KEYS) on[k] = k === "none";
  } else if (LABELS.includes(raw)) {
    for (const k of FILTER_KEYS) on[k] = k === raw;
  }
  if (!FILTER_KEYS.some((k) => on[k])) return on;
  return on;
}

export function listsByName(lists) {
  return [...(lists || [])].sort((a, b) =>
    String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" })
  );
}

export function nameTaken(book, name, exceptId) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return false;
  return book.lists.some((l) => l.id !== exceptId && String(l.name || "").trim().toLowerCase() === n);
}

export function cleanListName(raw) {
  return String(raw || "")
    .replace(/[^A-Za-z0-9 -]/g, "")
    .replace(/[ ]+/g, " ")
    .trim()
    .slice(0, 40);
}

export function listNameError(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "Name required";
  if (/[^A-Za-z0-9 -]/.test(trimmed) || !/[A-Za-z0-9]/.test(trimmed)) {
    return "Only letters, numbers, spaces and hyphens";
  }
  return "";
}

export function labelCounts(list) {
  const c = { none: 0 };
  for (const lab of LABELS) c[lab] = 0;
  for (const s of list?.stocks || []) {
    if (LABELS.includes(s.label)) c[s.label] += 1;
    else c.none += 1;
  }
  return c;
}

function newId() {
  return `wl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function clone(book) {
  return JSON.parse(JSON.stringify(book));
}

export function defaultBook() {
  return {
    lists: [
      {
        id: "wl_default",
        name: "Default",
        stocks: [
          { exchange: "NSE", ticker: "SBIN", label: null },
          { exchange: "NSE", ticker: "HDFCBANK", label: null },
          { exchange: "NSE", ticker: "RELIANCE", label: null },
        ],
      },
      demoList(),
    ],
    activeId: "wl_default",
    labelOn: emptyLabelOn(),
    sortKey: "name",
    sortDir: "asc",
  };
}

function cleanTicker(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9.&-]/g, "")
    .slice(0, 24);
}

const EX_ALIAS = {
  NSI: "NSE",
  NSE: "NSE",
  BSE: "BSE",
  BOM: "BSE",
  NASDAQ: "NASDAQ",
  NMS: "NASDAQ",
  NGM: "NASDAQ",
  NCM: "NASDAQ",
  NDQ: "NASDAQ",
  NYSE: "NYSE",
  NYQ: "NYSE",
  NYA: "NYSE",
  AMEX: "NYSE",
  ARCA: "NYSE",
  PCX: "NYSE",
  NYSEARCA: "NYSE",
  NYSEAMERICAN: "NYSE",
};

export function canonicalExchange(raw) {
  const e = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
  if (!e) return "";
  return EX_ALIAS[e] || e;
}

export function parseSymbol(raw) {
  const s = String(raw || "").trim().toUpperCase();
  const m = s.match(/^([A-Z0-9]{1,16})\s*:\s*(.+)$/);
  if (m && /^(NSE|BSE|NASDAQ|NYSE)$/.test(canonicalExchange(m[1]) || m[1])) {
    return { exchange: canonicalExchange(m[1]) || m[1], ticker: cleanTicker(m[2]) };
  }
  return { exchange: "NSE", ticker: cleanTicker(s) };
}

export function normalizeBook(raw, opts = {}) {
  const base = defaultBook();
  if (!raw || typeof raw !== "object") {
    return opts.fallbackDefault === false ? { lists: [], activeId: "", labelOn: emptyLabelOn(), sortKey: "name", sortDir: "asc" } : base;
  }
  const lists = Array.isArray(raw.lists) ? raw.lists : [];
  const out = {
    lists: lists
      .slice(0, LIST_CAP)
      .map((list, i) => {
        const stocks = Array.isArray(list?.stocks) ? list.stocks : [];
        return {
          id: String(list?.id || newId()),
          name: String(list?.name || `List ${i + 1}`).slice(0, 40) || `List ${i + 1}`,
          stocks: stocks.slice(0, STOCK_CAP).map((s) => ({
            exchange: canonicalExchange(s?.exchange) || "NSE",
            ticker: cleanTicker(s?.ticker),
            label: LABELS.includes(s?.label) ? s.label : null,
          })).filter((s) => s.ticker),
        };
      })
      .filter((list) => list.id),
    labelOn: normalizeLabelOn(raw.labelOn || raw.labelFilter),
    sortKey: ["name", "price", "pct", "mcap", "label", "cmp"].includes(raw.sortKey)
      ? raw.sortKey === "cmp"
        ? "price"
        : raw.sortKey
      : "name",
    sortDir: raw.sortDir === "desc" ? "desc" : "asc",
    activeId: String(raw.activeId || ""),
  };
  if (!out.lists.length) {
    if (opts.fallbackDefault === false) {
      return { lists: [], activeId: "", labelOn: emptyLabelOn(), sortKey: "name", sortDir: "asc" };
    }
    return base;
  }
  if (!out.lists.some((l) => l.id === out.activeId)) out.activeId = out.lists[0].id;
  return out;
}

export async function loadBook() {
  const stored = await get(LIST_BOOK_KEY);
  if (stored === undefined || stored === null) {
    const book = defaultBook();
    await set(LIST_BOOK_KEY, book);
    return book;
  }
  const book = normalizeBook(stored);
  await set(LIST_BOOK_KEY, book);
  return book;
}

export async function saveBook(book) {
  const next = normalizeBook(book);
  await set(LIST_BOOK_KEY, next);
  return next;
}

export function activeList(book) {
  return book.lists.find((l) => l.id === book.activeId) || book.lists[0];
}

function quoteNum(quotes, stock, field) {
  const q = quotes?.get?.(`${stock.exchange}:${stock.ticker}`);
  const n = q?.[field];
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export function visibleStocks(book, quotes) {
  const list = activeList(book);
  const on = normalizeLabelOn(book.labelOn);
  let rows = list.stocks.filter((s) => {
    if (!s.label || !LABELS.includes(s.label)) return on.none;
    return !!on[s.label];
  });

  const dir = book.sortDir === "desc" ? -1 : 1;
  const field = book.sortKey === "price" ? "price" : book.sortKey === "pct" ? "pct" : book.sortKey === "mcap" ? "mcap" : null;
  rows.sort((a, b) => {
    if (book.sortKey === "label") {
      const aNone = !a.label || !LABELS.includes(a.label);
      const bNone = !b.label || !LABELS.includes(b.label);
      if (aNone !== bNone) return aNone ? 1 : -1;
      if (!aNone) {
        const d = LABELS.indexOf(a.label) - LABELS.indexOf(b.label);
        if (d) return d * dir;
      }
    }
    if (field) {
      const av = quoteNum(quotes, a, field);
      const bv = quoteNum(quotes, b, field);
      if (av == null && bv == null) { /* name */ }
      else if (av == null) return 1;
      else if (bv == null) return -1;
      else if (av !== bv) return (av - bv) * dir;
    }
    const nameCmp = a.ticker.localeCompare(b.ticker);
    if (nameCmp) return nameCmp * (book.sortKey === "name" || book.sortKey === "label" ? dir : 1);
    return a.exchange.localeCompare(b.exchange);
  });
  return rows;
}

export async function setActive(book, id) {
  if (!book.lists.some((l) => l.id === id)) return { ok: false, error: "List not found", book };
  const next = clone(book);
  next.activeId = id;
  return { ok: true, book: await saveBook(next) };
}

export async function createList(book, name, { activate = true } = {}) {
  if (book.lists.length >= LIST_CAP) return { ok: false, error: `Maximum ${LIST_CAP} lists`, book };
  const trimmed = cleanListName(name);
  const bad = listNameError(name) || listNameError(trimmed);
  if (bad) return { ok: false, error: bad, book };
  if (nameTaken(book, trimmed)) return { ok: false, error: "Watchlist Exists", book };
  const next = clone(book);
  const id = newId();
  next.lists.push({ id, name: trimmed, stocks: [] });
  if (activate) next.activeId = id;
  return { ok: true, id, book: await saveBook(next) };
}

export async function renameList(book, id, name) {
  const trimmed = cleanListName(name);
  const bad = listNameError(name) || listNameError(trimmed);
  if (bad) return { ok: false, error: bad, book };
  if (nameTaken(book, trimmed, id)) return { ok: false, error: "Watchlist Exists", book };
  const next = clone(book);
  const list = next.lists.find((l) => l.id === id);
  if (!list) return { ok: false, error: "List not found", book };
  list.name = trimmed;
  return { ok: true, book: await saveBook(next) };
}

export async function deleteList(book, id) {
  if (book.lists.length <= 1) return { ok: false, error: "Keep at least one list", book };
  const ordered = listsByName(book.lists);
  const idx = ordered.findIndex((l) => l.id === id);
  const next = clone(book);
  next.lists = next.lists.filter((l) => l.id !== id);
  if (next.activeId === id) {
    const remain = listsByName(next.lists);
    const pick = remain[Math.min(Math.max(idx, 0), remain.length - 1)] || remain[0];
    next.activeId = pick.id;
  }
  return { ok: true, book: await saveBook(next) };
}

export async function addStock(book, listId, raw) {
  const { exchange, ticker } = parseSymbol(raw);
  if (!ticker) return { ok: false, error: "Symbol required", book };
  const next = clone(book);
  const list = next.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, error: "List not found", book };
  if (list.stocks.length >= STOCK_CAP) return { ok: false, error: `This list is full (${STOCK_CAP})`, book };
  if (list.stocks.some((s) => s.ticker === ticker && s.exchange === exchange)) {
    return { ok: false, error: "Already in this list", book };
  }
  list.stocks.push({ exchange, ticker, label: null });
  return { ok: true, book: await saveBook(next) };
}

function tickerAllowed(ticker) {
  if (!ticker) return false;
  const letters = ticker.replace(/[^A-Z]/g, "");
  if (letters.length >= 3 && new Set(letters).size === 1) return false;
  return true;
}

export async function addStocks(book, listId, items) {
  const next = clone(book);
  const list = next.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, error: "List not found", book, log: [], added: 0, exists: 0, failed: 0, addedItems: [] };
  const log = [];
  const addedItems = [];
  let added = 0;
  let exists = 0;
  let failed = 0;
  for (const it of items || []) {
    const exchange = canonicalExchange(it?.exchange) || "NSE";
    const ticker = cleanTicker(it?.ticker);
    const tag = `${exchange}:${ticker || "?"}`;
    if (!ticker || !tickerAllowed(ticker)) {
      log.push(`${tag} failed`);
      failed += 1;
      continue;
    }
    if (list.stocks.length >= STOCK_CAP) {
      log.push(`${tag} failed list full`);
      failed += 1;
      continue;
    }
    if (list.stocks.some((s) => s.ticker === ticker && s.exchange === exchange)) {
      log.push(`${tag} exists`);
      exists += 1;
      continue;
    }
    list.stocks.push({ exchange, ticker, label: null });
    log.push(`${tag} added`);
    addedItems.push({ exchange, ticker });
    added += 1;
  }
  const message = `${added} added, ${exists} exists, ${failed} failed`;
  if (!added) return { ok: true, book, log, added, exists, failed, message, addedItems };
  return { ok: true, book: await saveBook(next), log, added, exists, failed, message, addedItems };
}

export async function createListWithStocks(book, name, items) {
  if ((items || []).length > STOCK_CAP) {
    return { ok: false, error: `That file has more than ${STOCK_CAP} symbols`, book, log: [] };
  }
  if (book.lists.length >= LIST_CAP) return { ok: false, error: `Maximum ${LIST_CAP} lists`, book, log: [] };
  const trimmed = cleanListName(name);
  const bad = listNameError(name) || listNameError(trimmed);
  if (bad) return { ok: false, error: bad, book, log: [] };
  if (nameTaken(book, trimmed)) return { ok: false, error: "Watchlist Exists", book, log: [] };
  const made = await createList(book, trimmed, { activate: true });
  if (!made.ok) return { ...made, log: [] };
  const filled = await addStocks(made.book, made.id, items);
  if (!filled.ok) return filled;
  return filled;
}

export async function removeStock(book, listId, exchange, ticker) {
  const next = clone(book);
  const list = next.lists.find((l) => l.id === listId);
  if (!list) return { ok: false, error: "List not found", book };
  const before = list.stocks.length;
  list.stocks = list.stocks.filter((s) => !(s.ticker === ticker && s.exchange === exchange));
  if (list.stocks.length === before) return { ok: false, error: "Not in this list", book };
  return { ok: true, book: await saveBook(next) };
}

export async function setLabel(book, listId, exchange, ticker, label) {
  const next = clone(book);
  const list = next.lists.find((l) => l.id === listId);
  const row = list?.stocks.find((s) => s.ticker === ticker && s.exchange === exchange);
  if (!row) return { ok: false, error: "Not in this list", book };
  row.label = LABELS.includes(label) ? label : null;
  return { ok: true, book: await saveBook(next) };
}

export function nextLabel(current) {
  if (!current || !LABELS.includes(current)) return LABELS[0];
  return LABELS[(LABELS.indexOf(current) + 1) % LABELS.length];
}

function plainStock(exchange, ticker) {
  return { exchange, ticker, label: null };
}

export async function moveStock(book, fromId, toId, exchange, ticker) {
  if (fromId === toId) return { ok: false, error: "Pick another list", book };
  const next = clone(book);
  const from = next.lists.find((l) => l.id === fromId);
  const to = next.lists.find((l) => l.id === toId);
  if (!from || !to) return { ok: false, error: "List not found", book };
  const row = from.stocks.find((s) => s.ticker === ticker && s.exchange === exchange);
  if (!row) return { ok: false, error: "Not in this list", book };
  if (to.stocks.length >= STOCK_CAP) return { ok: false, error: `That list is full (${STOCK_CAP})`, book };
  if (to.stocks.some((s) => s.ticker === ticker && s.exchange === exchange)) {
    return { ok: false, error: "Already in that list", book };
  }
  from.stocks = from.stocks.filter((s) => !(s.ticker === ticker && s.exchange === exchange));
  to.stocks.push(plainStock(exchange, ticker));
  return { ok: true, book: await saveBook(next) };
}

export async function copyStock(book, fromId, toId, exchange, ticker) {
  if (fromId === toId) return { ok: false, error: "Pick another list", book };
  const next = clone(book);
  const from = next.lists.find((l) => l.id === fromId);
  const to = next.lists.find((l) => l.id === toId);
  if (!from || !to) return { ok: false, error: "List not found", book };
  const row = from.stocks.find((s) => s.ticker === ticker && s.exchange === exchange);
  if (!row) return { ok: false, error: "Not in this list", book };
  if (to.stocks.length >= STOCK_CAP) return { ok: false, error: `That list is full (${STOCK_CAP})`, book };
  if (to.stocks.some((s) => s.ticker === ticker && s.exchange === exchange)) {
    return { ok: false, error: "Already in that list", book };
  }
  to.stocks.push(plainStock(exchange, ticker));
  return { ok: true, book: await saveBook(next) };
}

export async function toggleLabelOn(book, key) {
  const next = clone(book);
  const on = normalizeLabelOn(next.labelOn);
  if (key === "all") {
    next.labelOn = allLabelsSelected(on) ? emptyLabelOff() : emptyLabelOn();
    return { ok: true, book: await saveBook(next) };
  }
  if (!FILTER_KEYS.includes(key)) return { ok: false, error: "Unknown label", book };
  if (on[key]) {
    const others = FILTER_KEYS.filter((k) => k !== key && on[k]);
    if (!others.length) return { ok: true, book };
    on[key] = false;
  } else on[key] = true;
  next.labelOn = on;
  return { ok: true, book: await saveBook(next) };
}

export async function restoreAllLabels(book) {
  const on = normalizeLabelOn(book.labelOn);
  if (FILTER_KEYS.some((k) => on[k])) return { ok: true, book };
  const next = clone(book);
  next.labelOn = emptyLabelOn();
  return { ok: true, book: await saveBook(next) };
}

export async function setSort(book, key) {
  const next = clone(book);
  if (next.sortKey === key) next.sortDir = next.sortDir === "asc" ? "desc" : "asc";
  else {
    next.sortKey = key;
    next.sortDir = "asc";
  }
  return { ok: true, book: await saveBook(next) };
}
