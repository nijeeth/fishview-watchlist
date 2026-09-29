import { STOCK_CAP } from "../lists/book.js";

const PREFIX = /^(NSE|BSE|NASDAQ|NYSE)\s*:\s*(.+)$/i;
const HEADER = /^(symbol|ticker|name|scrip|code|exchange)$/i;

function cleanTicker(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9.&-]/g, "")
    .slice(0, 24);
}

function cellsFromCsv(text) {
  return String(text || "")
    .split(/\r?\n/)
    .flatMap((line) => line.split(","))
    .map((c) => c.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

export function capAt150(count) {
  const n = Number(count) || 0;
  if (n > STOCK_CAP) {
    return { ok: false, error: `That file has more than ${STOCK_CAP} symbols` };
  }
  return { ok: true };
}

export function parseCsvText(text) {
  const raw = String(text || "")
    .replace(/^\uFEFF/, "")
    .trim();
  if (!raw) return { ok: false, error: "Empty file", rows: [] };
  if (!raw.includes(",")) {
    return { ok: false, error: "CSV must separate symbols with commas", rows: [] };
  }

  let cells = cellsFromCsv(raw);
  if (cells.length && HEADER.test(cells[0]) && !PREFIX.test(cells[0])) cells = cells.slice(1);

  const capped = capAt150(cells.length);
  if (!capped.ok) return { ok: false, error: capped.error, rows: [] };

  const rows = [];
  for (const cell of cells) {
    const m = cell.match(PREFIX);
    if (!m) {
      return { ok: false, error: "CSV needs NSE: or BSE: prefixes", rows: [] };
    }
    const exchange = m[1].toUpperCase();
    const ticker = cleanTicker(m[2]);
    if (!ticker) {
      return { ok: false, error: "CSV has a blank symbol", rows: [] };
    }
    if (exchange === "NASDAQ" || exchange === "NYSE") {
      return { ok: false, error: "For US stocks use 'Add' or 'Current' button", rows: [] };
    }
    rows.push({ exchange, ticker });
  }
  if (!rows.length) return { ok: false, error: "No symbols in file", rows: [] };
  return { ok: true, rows };
}

export function formatCsv(list) {
  const stocks = list?.stocks || [];
  return stocks.map((s) => `${s.exchange}:${s.ticker}`).join(",") + (stocks.length ? "\r\n" : "");
}
