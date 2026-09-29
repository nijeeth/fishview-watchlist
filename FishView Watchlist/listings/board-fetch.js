import { parseFyersCashCsv, mergeBooks, eqCount } from "./parse-instruments.js";

export const BOARD_CACHE_KEY = "fvBoardBookV6";
export const BOARD_FIRST_KEY = "fvDumpFirstRun";
export const BOARD_REFRESH_MS = 24 * 60 * 60 * 1000;
export const BOARD_WARN_MS = 7 * 24 * 60 * 60 * 1000;
export const BOARD_FIRST_RETRY_MS = 2 * 60 * 60 * 1000;
export const BOARD_FIRST_WINDOW_MS = 24 * 60 * 60 * 1000;
export const BOARD_FIRST_ALARM = "fvDumpFirst";

export function usableBook(book) {
  return eqCount(book) > 50;
}

async function fetchText(url, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAndBuildMap(onProgress) {
  try {
    onProgress?.("Updating symbol list...");
  } catch (_) {}
  const [nseText, bseText] = await Promise.all([
    fetchText("https://public.fyers.in/sym_details/NSE_CM.csv"),
    fetchText("https://public.fyers.in/sym_details/BSE_CM.csv"),
  ]);
  const book = mergeBooks(parseFyersCashCsv(nseText), parseFyersCashCsv(bseText));
  if (!usableBook(book)) throw new Error("Instrument parse empty");
  return book;
}
