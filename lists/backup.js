import { LIST_BOOK_KEY, set } from "../persist/index.js";
import { normalizeBook } from "./book.js";

export const BACKUP_KIND = "fv-list-book";
export const BACKUP_SCHEMA = 1;

function listsOnly(book) {
  return {
    lists: (book.lists || []).map((list) => ({
      id: list.id,
      name: list.name,
      stocks: (list.stocks || []).map((s) => ({
        exchange: s.exchange,
        ticker: s.ticker,
        label: s.label || null,
        ...(s.isNew === true ? { isNew: true } : {}),
      })),
    })),
    activeId: book.activeId,
    labelOn: book.labelOn,
    sortKey: book.sortKey,
    sortDir: book.sortDir,
  };
}

export function backupJson(book) {
  const clean = normalizeBook(book, { fallbackDefault: false });
  return `${JSON.stringify(
    {
      kind: BACKUP_KIND,
      schema: BACKUP_SCHEMA,
      savedAt: new Date().toISOString(),
      book: listsOnly(clean),
    },
    null,
    2
  )}\n`;
}

export function backupFileName() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `fishview-backup-${stamp}.json`;
}

export function parseBackupText(text) {
  let data;
  try {
    data = JSON.parse(String(text || "").replace(/^\uFEFF/, "").trim());
  } catch {
    return { ok: false, error: "Not a FishView backup file" };
  }
  if (!data || data.kind !== BACKUP_KIND || data.schema !== BACKUP_SCHEMA || !data.book || typeof data.book !== "object") {
    return { ok: false, error: "Not a FishView backup file" };
  }
  if (!Array.isArray(data.book.lists) || !data.book.lists.length) {
    return { ok: false, error: "Backup has no lists" };
  }
  const book = normalizeBook(data.book, { fallbackDefault: false });
  if (!book.lists.length) return { ok: false, error: "Backup has no lists" };
  return { ok: true, book };
}

export async function restoreBackupBook(book) {
  const next = normalizeBook(book, { fallbackDefault: false });
  if (!next.lists.length) return { ok: false, error: "Backup has no lists", book };
  await set(LIST_BOOK_KEY, next);
  return { ok: true, book: next, message: "Lists restored" };
}
