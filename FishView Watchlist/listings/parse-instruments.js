export function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

export function emptyBook() {
  return { nse: {}, bse: {} };
}

export function eqCount(book) {
  const nse = book?.nse;
  if (Array.isArray(nse)) return nse.length;
  return Object.keys(nse || {}).length;
}

export function hasEq(book, exchange, ticker) {
  const t = String(ticker || "").toUpperCase();
  const ex = String(exchange || "NSE").toUpperCase();
  const side = ex === "BSE" ? book?.bse : book?.nse;
  if (!t || !side) return false;
  if (Array.isArray(side)) return side.includes(t);
  return Object.prototype.hasOwnProperty.call(side, t);
}

export function addEqRow(book, row) {
  const instrumentType = String(row.instrument_type || "").toUpperCase().trim();
  const exchange = String(row.exchange || "").toUpperCase().trim();
  const tradingsymbol = String(row.tradingsymbol || "").toUpperCase().trim();
  const name = String(row.name || "").trim();
  if (instrumentType !== "EQ" || !tradingsymbol) return;
  if (exchange !== "NSE" && exchange !== "BSE") return;
  const side = exchange === "BSE" ? "bse" : "nse";
  if (!book[side][tradingsymbol]) book[side][tradingsymbol] = name || tradingsymbol;
}

export function mergeBooks(a, b) {
  return {
    nse: { ...(a?.nse || {}), ...(b?.nse || {}) },
    bse: { ...(a?.bse || {}), ...(b?.bse || {}) },
  };
}

function headerIndex(header, names, fallback) {
  for (const name of names) {
    const i = header.indexOf(name);
    if (i >= 0) return i;
  }
  return fallback;
}

/** Kite CSV: keep tradingsymbol, name, instrument_type=EQ, exchange NSE/BSE. */
export function parseKiteCsv(text) {
  const book = emptyBook();
  const lines = String(text || "").split(/\r?\n/);
  const header = splitCsvLine(lines[0] || "").map((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase());
  const iSym = headerIndex(header, ["tradingsymbol"], 2);
  const iName = headerIndex(header, ["name"], 3);
  const iType = headerIndex(header, ["instrument_type"], 9);
  const iEx = headerIndex(header, ["exchange"], 11);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cols = splitCsvLine(lines[i]);
    addEqRow(book, {
      tradingsymbol: cols[iSym],
      name: cols[iName],
      instrument_type: cols[iType],
      exchange: cols[iEx],
    });
  }
  return book;
}

export const parseInstrumentsCsv = parseKiteCsv;

/** Dhan equity cash → same four fields (EQUITY → EQ). */
export function parseDhanCsv(text) {
  const book = emptyBook();
  const lines = String(text || "").split(/\r?\n/);
  const header = splitCsvLine(lines[0] || "").map((h) => h.replace(/^\uFEFF/, "").trim().toUpperCase());
  const iEx = headerIndex(header, ["SEM_EXM_EXCH_ID", "EXCH_ID"], 0);
  const iSeg = headerIndex(header, ["SEM_SEGMENT", "SEGMENT"], 1);
  const iKind = headerIndex(header, ["SEM_INSTRUMENT_NAME", "INSTRUMENT"], 3);
  const iSym = headerIndex(header, ["SEM_TRADING_SYMBOL", "TRADING_SYMBOL"], 5);
  const iName = headerIndex(header, ["SEM_CUSTOM_SYMBOL", "SM_SYMBOL_NAME"], 7);
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const cols = splitCsvLine(lines[i]);
    const kind = String(cols[iKind] || "").toUpperCase().trim();
    const segment = String(cols[iSeg] || "").toUpperCase().trim();
    if (kind !== "EQUITY") continue;
    if (segment && segment !== "E") continue;
    addEqRow(book, {
      tradingsymbol: cols[iSym],
      name: cols[iName],
      instrument_type: "EQ",
      exchange: cols[iEx],
    });
  }
  return book;
}

const FYERS_EQ = new Set(["EQ", "BE", "SM", "ST", "A", "B", "T", "X", "XT", "Z", "TS", "BZ"]);

/** Fyers CM: NSE:SBIN-EQ → tradingsymbol SBIN, type EQ, exchange NSE. */
export function parseFyersCashCsv(text) {
  const book = emptyBook();
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const cols = splitCsvLine(line);
    const tagged = cols.find((c) => /^(NSE|BSE):[A-Z0-9.&]+-/i.test(String(c).trim()));
    if (!tagged) continue;
    const m = String(tagged).trim().match(/^(NSE|BSE):([A-Z0-9.&]+)-([A-Z0-9]+)$/i);
    if (!m) continue;
    const series = m[3].toUpperCase();
    if (!FYERS_EQ.has(series)) continue;
    addEqRow(book, {
      tradingsymbol: m[2],
      name: cols[1] || m[2],
      instrument_type: "EQ",
      exchange: m[1],
    });
  }
  return book;
}
