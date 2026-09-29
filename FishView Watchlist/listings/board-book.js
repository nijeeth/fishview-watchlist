import {
  BOARD_CACHE_KEY,
  BOARD_REFRESH_MS,
  BOARD_WARN_MS,
  usableBook,
} from "./board-fetch.js";
import { emptyBook } from "./parse-instruments.js";
import { SEED_EQ } from "./seed-eq.js";

let mem = null;

function readStored() {
  return new Promise((resolve) => {
    chrome.storage.local.get([BOARD_CACHE_KEY], (data) => resolve(data[BOARD_CACHE_KEY] || null));
  });
}

function writeStored(entry) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [BOARD_CACHE_KEY]: entry }, () => resolve());
  });
}

function remember(entry) {
  if (entry?.map && usableBook(entry.map)) mem = entry;
}

function seedEntry() {
  if (!usableBook(SEED_EQ)) return null;
  return { ts: Date.now(), map: SEED_EQ, live: false };
}

function askRefresh() {
  try {
    chrome.runtime.sendMessage({ type: "FV_BOARD_BOOK" }, () => {
      void chrome.runtime.lastError;
    });
  } catch (_) {}
}

function maybeRefresh(entry) {
  if (!entry?.live) return;
  if (!entry.ts || Date.now() - entry.ts < BOARD_REFRESH_MS) return;
  askRefresh();
}

export async function peekBoardBook() {
  if (mem?.map && usableBook(mem.map)) return mem;
  const stored = await readStored();
  if (stored?.map && usableBook(stored.map)) {
    remember(stored);
    return stored;
  }
  const seeded = seedEntry();
  if (seeded) {
    remember(seeded);
    await writeStored(seeded);
    return seeded;
  }
  return null;
}

export async function getBoardBook() {
  const peeked = await peekBoardBook();
  if (peeked) {
    maybeRefresh(peeked);
    return peeked.map;
  }
  return emptyBook();
}

export async function ensureBoardBook() {
  return getBoardBook();
}

export async function boardBookInfo() {
  const entry = await peekBoardBook();
  const ts = entry?.ts || 0;
  const ageMs = ts ? Date.now() - ts : 0;
  return {
    ts,
    ageMs,
    live: entry?.live === true,
    ready: usableBook(entry?.map),
    warnOld: Boolean(ts && ageMs >= BOARD_WARN_MS),
  };
}

export async function getBseLookup() {
  const map = await getBoardBook();
  return { names: map.bse || {} };
}
