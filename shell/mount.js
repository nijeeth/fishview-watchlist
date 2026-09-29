import { ACTIVE_PHASE, phaseBanner, phaseLive } from "../config/phase.js";
import {
  loadBook,
  activeList,
  visibleStocks,
  addStock,
  addStocks,
  setActive,
  createList,
  STOCK_CAP,
  LIST_CAP,
  BATCH_CAP,
  createListWithStocks,
  renameList,
  deleteList,
  toggleLabelOn,
  restoreAllLabels,
  setSort,
  normalizeBook,
  cleanListName,
  canonicalExchange,
  labelTitle,
  setLabelsOn,
  removeStocks,
  copyStocks,
  moveStocks,
  createDestList,
  backupJson,
  backupFileName,
  parseBackupText,
  restoreBackupBook,
} from "../lists/index.js";
import { watchlistHtml } from "../lists/render.js";
import { openRowMenu } from "../lists/row-menu.js";
import { changeListing, askCurrentListing } from "../sites/charts/index.js";
import { filterKnownListings, boardBookInfo, ensureBoardBook } from "../listings/index.js";
import { preferNseThenBse } from "../listings/kind.js";
import {
  collectScreenerTickers,
  currentScreenerListing,
  startScreenerPlus,
  placeholderMessage as screenerHint,
} from "../sites/screener/index.js";
import {
  collectChartinkTickers,
  currentChartinkListing,
  startChartinkPlus,
  chartinkChartDarkOffer,
  applyChartinkDayTheme,
  watchChartinkChartDark,
  placeholderMessage as chartinkHint,
} from "../sites/chartink/index.js";
import { isolateKeys, isolateElement } from "../shared/isolate-keys.js";
import {
  splitPasteTokens,
  resolvePasteToken,
  parseCsvText,
  formatCsv,
  formatBulkLog,
  downloadText,
  placeholderMessage as ingestHint,
} from "../ingest/index.js";
import { placeholderMessage as quoteHint, quotesForOpenListOnly, quotesNeedLivePoll } from "../quotes/index.js";
import { placeholderMessage as cloudHint, cloudStatus, connectCloud, disconnectCloud, deleteCloudDetails, copySetupSql, scheduleCloudPush, pullCloudBook } from "../cloud/index.js";
import { placeholderMessage as chartHint } from "../sites/charts/index.js";
import {
  get,
  set,
  remove,
  WIDTH_TV_KEY,
  WIDTH_WEB_KEY,
  THEME_KEY,
  LIST_BOOK_KEY,
  MINIMIZED_KEY,
  MINIMIZED_TV_KEY,
  MINIMIZED_WEB_KEY,
  CLOUD_KEYS,
} from "../persist/index.js";
import {
  DOCK_MIN_BAR_H,
  clampDockWidth,
  displayDockWidth,
  dockMinW,
  dockMaxW,
  applyPageLayout,
  clearPageLayout,
  hostKind,
  isCompactHost,
} from "./page-layout.js";
import { teardownTvDock } from "./tv-layout.js";
import { DOCK_CSS } from "./dock-css.js";
import { WEB_DOCK_CSS } from "./web-dock-css.js";
import { LIST_UI_CSS } from "./list-ui-css.js";

const HOST_ID = "fv-root";
let releaseDockKeys = null;

const CLOUD_ICON = `<svg class="fv-cloud-ico" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96Z"/></svg>`;
const REFRESH_ICON = `<svg class="fv-cloud-ico" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7c2.76 0 5 2.24 5 5a5 5 0 0 1-8.9 3.1L6.7 16.5A7.96 7.96 0 0 0 12 20c4.42 0 8-3.58 8-8 0-2.21-.9-4.21-2.35-5.65Z"/></svg>`;

function $(sel, root) {
  return root.querySelector(sel);
}

export function unmountPanel() {
  if (releaseDockKeys) {
    releaseDockKeys();
    releaseDockKeys = null;
  }
  teardownTvDock();
  const root = document.getElementById(HOST_ID);
  if (root?._fvOff) root._fvOff();
  if (root) root.remove();
  clearPageLayout();
}

export async function mountPanel() {
  if (document.getElementById(HOST_ID)) return;

  const kind = hostKind();
  const compact = isCompactHost(kind);
  const widthKey = compact ? WIDTH_WEB_KEY : WIDTH_TV_KEY;
  const minKey = compact ? MINIMIZED_WEB_KEY : MINIMIZED_TV_KEY;
  const minW = dockMinW(kind);
  const maxW = dockMaxW(kind);

  let panelW = clampDockWidth(await get(widthKey), kind);
  if (Number(await get(widthKey)) !== panelW) await set(widthKey, panelW);

  let theme = (await get(THEME_KEY)) === "light" ? "light" : "dark";
  const minStored = await new Promise((resolve) => {
    chrome.storage.local.get([minKey, MINIMIZED_KEY], resolve);
  });
  let minimized = minStored[minKey] === true;
  if (compact && minStored[minKey] === undefined && minStored[MINIMIZED_KEY] === true) {
    minimized = true;
    await set(minKey, true);
  }
  let tab = "watchlist";
  let quotesMap = new Map();
  let quoteGen = 0;
  let quoteTimer = null;
  let quotesBusy = false;
  let quotesLoading = false;
  let noticeTimer = null;
  let drag = false;
  let startX = 0;
  let startW = panelW;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText =
    `all:initial;position:fixed;top:0;right:0;z-index:2147483646;box-sizing:border-box;overflow:hidden;font-size:${compact ? 11 : 14}px;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`;

  const shadow = host.attachShadow({ mode: "open" });
  const css = document.createElement("style");
  css.textContent = DOCK_CSS + LIST_UI_CSS + (compact ? WEB_DOCK_CSS : "");
  shadow.appendChild(css);

  const shell = document.createElement("div");
  shell.id = "fv-shell";
  shell.setAttribute("data-theme", theme);
  shell.setAttribute("data-host", kind);
  if (compact) shell.setAttribute("data-compact", "1");
  shell.innerHTML = `
    <div id="fv-resize" title="Drag to resize"></div>
    <div id="fv-panel">
      <div id="fv-docker-head">
        <span class="fv-head-spacer" aria-hidden="true"></span>
        <span class="fv-docker-title">FishView Watchlist</span>
        <span class="fv-head-actions">
          <button type="button" class="fv-close-btn" id="fv-dock-min" title="Minimize">×</button>
        </span>
      </div>
      <div id="fv-chrome">
        <div id="fv-tabs">
          <button type="button" class="fv-tab on" data-tab="watchlist">Watchlist</button>
          <button type="button" class="fv-tab" data-tab="cloud">Cloud</button>
          <button type="button" class="fv-theme" id="fv-theme-btn" title="Switch theme"></button>
        </div>
        <div id="fv-body"><p class="fv-loading">Loading...</p></div>
        <p class="fv-credit"><span>FishView Watchlist</span><span class="fv-credit-sep">|</span><span>NijeethFish</span></p>
      </div>
    </div>
  `;
  shadow.appendChild(shell);

  const tip = document.createElement("div");
  tip.id = "fv-tip";
  tip.hidden = true;
  shell.appendChild(tip);
  let tipFor = null;
  let tipWait = null;
  function hideTip() {
    if (tipWait) clearTimeout(tipWait);
    tipWait = null;
    tip.hidden = true;
    tipFor = null;
  }
  function nodeTip(n) {
    if (!n || n.nodeType !== 1 || n === tip) return "";
    return String(n.getAttribute("data-tip") || n.getAttribute("title") || "").trim();
  }
  shell.addEventListener("pointermove", (e) => {
    const hits = typeof shadow.elementsFromPoint === "function" ? shadow.elementsFromPoint(e.clientX, e.clientY) : [];
    let el = null;
    let text = "";
    for (const n of hits) {
      const t = nodeTip(n);
      if (t) {
        el = n;
        text = t;
        break;
      }
    }
    if (!el) {
      hideTip();
      return;
    }
    if (el.hasAttribute("title")) {
      el.setAttribute("data-tip", text);
      el.removeAttribute("title");
    }
    const place = () => {
      tip.textContent = text;
      tip.hidden = false;
      const pad = 12;
      let x = e.clientX + pad;
      let y = e.clientY + 16;
      const tw = tip.offsetWidth || 160;
      const th = tip.offsetHeight || 32;
      if (x + tw > window.innerWidth - 8) x = e.clientX - tw - pad;
      if (y + th > window.innerHeight - 8) y = e.clientY - th - 8;
      tip.style.left = `${Math.max(8, x)}px`;
      tip.style.top = `${Math.max(8, y)}px`;
    };
    if (tipFor === el) {
      if (!tip.hidden) place();
      return;
    }
    hideTip();
    tipFor = el;
    tipWait = setTimeout(place, 380);
  });
  shell.addEventListener("pointerleave", hideTip);

  if (releaseDockKeys) releaseDockKeys();
  releaseDockKeys = isolateKeys(shell);
  document.documentElement.appendChild(host);

  const panel = $("#fv-panel", shell);
  const body = $("#fv-body", shell);
  const themeBtn = $("#fv-theme-btn", shell);
  const minBtn = $("#fv-dock-min", shell);
  const head = $("#fv-docker-head", shell);
  const handle = $("#fv-resize", shell);

  let book = await loadBook();
  let notice = "";
  let noticeOk = false;
  let noticeBusy = false;
  let noticeCounts = null;
  let selectedKey = "";
  let tableScrollTop = 0;
  let keepLabelPop = false;
  let selectMode = false;
  let selected = new Set();
  let selView = "actions";
  let selConfirm = null;
  let selDestKind = "move";
  let lpTimer = null;
  let lpStart = null;
  let ignoreRowClickUntil = 0;
  let flashKeys = new Set();
  let flashTimer = null;
  let cloudSqlNote = "";
  let cloudSqlOk = true;
  let cloudNotice = "";
  let cloudNoticeOk = false;
  let cloudNoticeBusy = false;
  let cloudNoticeTimer = null;

  function hideLabelPop() {
    keepLabelPop = false;
    const pop = body.querySelector("#fv-label-pop");
    if (pop) pop.hidden = true;
    void restoreFiltersIfEmpty();
  }

  async function restoreFiltersIfEmpty() {
    const res = await restoreAllLabels(book);
    if (res.book && res.book !== book) await applyBook(res);
  }

  function placeLabelPop() {
    const pop = body.querySelector("#fv-label-pop");
    const headEl = body.querySelector("#fv-label-head");
    if (!pop || !headEl) return;
    pop.hidden = false;
    const hr = headEl.getBoundingClientRect();
    const br = body.getBoundingClientRect();
    pop.style.left = `${Math.max(4, hr.left - br.left)}px`;
    pop.style.top = `${hr.bottom - br.top + body.scrollTop + 2}px`;
  }

  function hidePopovers() {
    keepLabelPop = false;
    shell.querySelectorAll(".fv-menu").forEach((m) => {
      m.hidden = true;
    });
    shell.querySelectorAll(".fv-ctx").forEach((m) => m.remove());
    hideLabelPop();
    const drop = body.querySelector("#fv-list-drop");
    if (drop) drop.hidden = true;
  }

  function nodeInPopover(n) {
    if (!n || n.nodeType !== 1) return false;
    if (typeof n.closest === "function") {
      if (n.closest("#fv-label-pop, #fv-label-head, #fv-list-drop, #fv-list-pick, #fv-xfer, #fv-list-more, #fv-sel-bar, .fv-menu, .fv-ctx, .fv-modal, .fv-modal-card, .fv-sel-bar")) {
        return true;
      }
    }
    const id = n.id;
    if (id === "fv-label-pop" || id === "fv-list-drop" || id === "fv-list-pick" || id === "fv-label-head" || id === "fv-xfer" || id === "fv-list-more" || id === "fv-sel-bar") return true;
    return n.classList?.contains("fv-menu") || n.classList?.contains("fv-ctx") || n.classList?.contains("fv-modal") || n.classList?.contains("fv-modal-card") || n.classList?.contains("fv-sel-bar");
  }

  function eventInPopover(e) {
    const seen = new Set();
    const consider = (n) => {
      if (!n || seen.has(n)) return false;
      seen.add(n);
      return nodeInPopover(n);
    };
    if (typeof e.composedPath === "function") {
      for (const n of e.composedPath()) {
        if (consider(n)) return true;
      }
    }
    if (typeof shadow.elementsFromPoint === "function" && Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) {
      for (const n of shadow.elementsFromPoint(e.clientX, e.clientY)) {
        if (consider(n)) return true;
      }
    }
    return consider(e.target);
  }

  function cancelLp() {
    if (lpTimer) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
    lpStart = null;
  }

  function exitSelect() {
    selectMode = false;
    selected = new Set();
    selView = "actions";
    selConfirm = null;
    selDestKind = "move";
  }

  function pruneSelected() {
    const have = new Set(activeList(book).stocks.map((s) => `${s.exchange}:${s.ticker}`));
    for (const k of [...selected]) {
      if (!have.has(k)) selected.delete(k);
    }
  }

  function visibleRowKeys() {
    return visibleStocks(book, quotesMap).map((s) => `${s.exchange}:${s.ticker}`);
  }

  function enterSelect(key) {
    selectMode = true;
    selected = new Set(key ? [key] : []);
    selView = "actions";
    selConfirm = null;
    ignoreRowClickUntil = Date.now() + 450;
    paint();
  }

  function batchCapNotice() {
    notice = `Batch limit is ${BATCH_CAP} stocks`;
    noticeOk = false;
    noticeBusy = false;
    noticeCounts = null;
  }

  function toggleSelectKey(key) {
    if (selected.has(key)) {
      selected.delete(key);
      return true;
    }
    if (selected.size >= BATCH_CAP) {
      batchCapNotice();
      return false;
    }
    selected.add(key);
    return true;
  }

  function stockNoun(n) {
    return n === 1 ? "stock" : "stocks";
  }

  function onDocPointer(e) {
    const modal = panel.querySelector(".fv-modal");
    if (modal) {
      if (!eventInPopover(e)) {
        modal.querySelector("[data-k='no']")?.click();
      }
      return;
    }
    if (eventInPopover(e)) return;
    hidePopovers();
  }

  function onDocKey(e) {
    if (e.key !== "Escape") return;
    const modal = panel.querySelector(".fv-modal");
    if (modal) {
      e.preventDefault();
      modal.querySelector("[data-k='no']")?.click();
      return;
    }
    if (selectMode) {
      e.preventDefault();
      if (selView === "confirm") {
        selView = selConfirm?.from || "actions";
        selConfirm = null;
        paint();
        return;
      }
      if (selView === "label" || selView === "dest") {
        selView = "actions";
        paint();
        return;
      }
      exitSelect();
      paint();
      return;
    }
    hidePopovers();
  }

  document.addEventListener("pointerdown", onDocPointer, true);
  document.addEventListener("keydown", onDocKey, true);

  function pageCurrentItem() {
    if (kind === "screener") return currentScreenerListing();
    if (kind === "chartink") return currentChartinkListing();
    return null;
  }

  async function addPageItems(items, { asNewList, listName, flash } = {}) {
    await ensureBoardBook();
    const { known, unknown, ready } = await filterKnownListings(items, false);
    if (!ready) {
      notice = "Could not verify symbols";
      noticeOk = false;
      noticeBusy = false;
      noticeCounts = null;
      await paint();
      return;
    }
    if (asNewList && !known.length) {
      noticeCounts = { added: 0, exists: 0, failed: unknown.length };
      notice = "";
      noticeOk = true;
      noticeBusy = false;
      await paint();
      return;
    }
    if (asNewList) {
      const res = await createListWithStocks(book, listName, known);
      const failed = (res.failed || 0) + unknown.length;
      unknown.forEach((it) => (res.log || (res.log = [])).push(`${it.exchange}:${it.ticker} failed unknown`));
      if (res.ok) res.counts = { added: res.added || 0, exists: res.exists || 0, failed };
      await applyBook(res, { flash: true });
      return;
    }
    const res = known.length
      ? await addStocks(book, book.activeId, known)
      : { ok: true, book, added: 0, exists: 0, failed: 0 };
    const failed = (res.failed || 0) + unknown.length;
    res.counts = { added: res.added || 0, exists: res.exists || 0, failed };
    await applyBook(res, { flash: true });
  }

  function armFlash(items) {
    flashKeys = new Set((items || []).map((it) => `${it.exchange}:${it.ticker}`));
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      flashKeys = new Set();
      flashTimer = null;
      paint();
    }, 1200);
  }

  function scrollFlashIntoView() {
    const wrap = body.querySelector(".fv-table-wrap");
    const tr = body.querySelector("tbody tr.fv-row-flash");
    if (!wrap || !tr) return;
    const wr = wrap.getBoundingClientRect();
    const rr = tr.getBoundingClientRect();
    wrap.scrollTop += rr.top - wr.top - wrap.clientHeight / 2 + rr.height / 2;
    tableScrollTop = wrap.scrollTop;
  }

  async function onPagePlus(e) {
    const ticker = String(e.detail?.ticker || "").toUpperCase();
    if (!ticker || !phaseLive(5)) return;
    const resolved = preferNseThenBse(ticker);
    const item = resolved.ok ? { exchange: resolved.exchange, ticker: resolved.ticker } : { exchange: "NSE", ticker };
    await showBusy("Checking symbol...");
    await addPageItems([item], { flash: true });
  }

  document.addEventListener("fv_page_plus", onPagePlus);
  function onVis() {
    if (document.visibilityState === "visible") void syncFromCloud();
  }
  document.addEventListener("visibilitychange", onVis);
  async function syncFromCloud() {
    const res = await pullCloudBook(book);
    if (res.pulled && res.book) {
      book = res.book;
      await paint();
      scheduleQuotes();
    }
  }
  let stopPlus = null;
  if (phaseLive(5) && kind === "screener") stopPlus = startScreenerPlus();
  let stopChartinkTheme = null;
  if (phaseLive(5) && kind === "chartink") stopPlus = startChartinkPlus();
  if (kind === "chartink") {
    stopChartinkTheme = watchChartinkChartDark(() => {
      void paint();
    });
  }

  host._fvOff = () => {
    document.removeEventListener("pointerdown", onDocPointer, true);
    document.removeEventListener("keydown", onDocKey, true);
    document.removeEventListener("fv_page_plus", onPagePlus);
    document.removeEventListener("visibilitychange", onVis);
    hideTip();
    cancelLp();
    if (stopPlus) stopPlus();
    if (stopChartinkTheme) stopChartinkTheme();
    if (quoteTimer) {
      clearInterval(quoteTimer);
      quoteTimer = null;
    }
    if (flashTimer) {
      clearTimeout(flashTimer);
      flashTimer = null;
    }
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
    if (cloudNoticeTimer) {
      clearTimeout(cloudNoticeTimer);
      cloudNoticeTimer = null;
    }
  };

  function openModal({ title, value = "", ok = "OK", danger = false, showInput = true, multiline = false }) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "fv-modal";
      const field = !showInput
        ? ""
        : multiline
          ? `<textarea id="fv-modal-in" rows="5" placeholder="SBIN, HDFCBANK, NSE:RELIANCE">${escapeAttr(value)}</textarea>`
          : `<input type="text" id="fv-modal-in" value="${escapeAttr(value)}" />`;
      wrap.innerHTML = `
        <div class="fv-modal-card">
          <p>${escapeAttr(title)}</p>
          ${field}
          <div class="fv-modal-actions">
            <button type="button" class="fv-btn fv-pill fv-pill-file" data-k="no">Cancel</button>
            <button type="button" class="fv-btn fv-pill ${danger ? "fv-pill-scan" : "fv-pill-add"}" data-k="yes">${escapeAttr(ok)}</button>
          </div>
        </div>`;
      panel.appendChild(wrap);
      const input = wrap.querySelector("#fv-modal-in");
      if (input) {
        isolateElement(input);
        input.focus();
        if (input.select) input.select();
        input.addEventListener("keydown", (ev) => {
          if (ev.key === "Escape") wrap.querySelector('[data-k="no"]').click();
          if (ev.key === "Enter" && !multiline) wrap.querySelector('[data-k="yes"]').click();
        });
      }
      wrap.addEventListener("click", (ev) => {
        if (ev.target === wrap) {
          wrap.remove();
          resolve(null);
          return;
        }
        const k = ev.target.getAttribute?.("data-k");
        if (k === "no") {
          wrap.remove();
          resolve(null);
        }
        if (k === "yes") {
          const v = showInput ? String(input.value || "").trim() : true;
          wrap.remove();
          resolve(v);
        }
      });
    });
  }

  function openScanChoice() {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "fv-modal";
      wrap.innerHTML = `
        <div class="fv-modal-card">
          <p>Scan</p>
          <div class="fv-modal-actions stack">
            <button type="button" class="fv-btn fv-pill fv-pill-add" data-k="current">Add to current watchlist</button>
            <button type="button" class="fv-btn fv-pill fv-pill-current" data-k="new">Add to new watchlist</button>
            <button type="button" class="fv-btn fv-pill fv-pill-file" data-k="no">Cancel</button>
          </div>
        </div>`;
      panel.appendChild(wrap);
      wrap.addEventListener("click", (ev) => {
        if (ev.target === wrap) {
          wrap.remove();
          resolve(null);
          return;
        }
        const k = ev.target.getAttribute?.("data-k");
        if (k === "no") {
          wrap.remove();
          resolve(null);
        }
        if (k === "current" || k === "new") {
          wrap.remove();
          resolve(k);
        }
      });
    });
  }

  function uniqueImportName(book, raw) {
    const base = cleanListName(raw) || "Import";
    if (!book.lists.some((l) => String(l.name).toLowerCase() === base.toLowerCase())) return base;
    for (let i = 2; i < 99; i++) {
      const name = `${base} ${i}`.slice(0, 40);
      if (!book.lists.some((l) => String(l.name).toLowerCase() === name.toLowerCase())) return name;
    }
    return `${base} ${Date.now().toString(36)}`.slice(0, 40);
  }

  async function offerBulkLog(listName, log) {
    if (!log?.length) return;
    const save = await openModal({
      title: "Save import log?",
      showInput: false,
      ok: "Save",
    });
    if (!save) return;
    const file = `${cleanListName(listName) || "import"}-log.txt`;
    downloadText(file, formatBulkLog(log));
  }

  function pickCsvFile() {
    return new Promise((resolve) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".csv,text/csv";
      inp.addEventListener("change", () => resolve(inp.files?.[0] || null), { once: true });
      inp.click();
    });
  }

  function pickBackupFile() {
    return new Promise((resolve) => {
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = ".json,application/json";
      inp.addEventListener("change", () => resolve(inp.files?.[0] || null), { once: true });
      inp.click();
    });
  }

  function clearNoticeTimer() {
    if (noticeTimer) {
      clearTimeout(noticeTimer);
      noticeTimer = null;
    }
  }

  function armCountsClear() {
    clearNoticeTimer();
    noticeTimer = window.setTimeout(() => {
      noticeTimer = null;
      noticeCounts = null;
      notice = "";
      noticeBusy = false;
      paint();
    }, 30000);
  }

  async function applyBook(res, opts = {}) {
    noticeBusy = false;
    if (res.counts) {
      noticeCounts = res.counts;
      notice = "";
      noticeOk = true;
      armCountsClear();
    } else if (res.message) {
      clearNoticeTimer();
      noticeCounts = null;
      notice = res.message;
      noticeOk = true;
    } else {
      clearNoticeTimer();
      noticeCounts = null;
      notice = res.ok ? "" : res.error || "Could not save";
      noticeOk = false;
    }
    if (res.book) book = res.book;
    if (opts.flash && res.added) armFlash(res.addedItems);
    await paint();
    if (opts.flash && res.added) scrollFlashIntoView();
    if (keepLabelPop) placeLabelPop();
    scheduleQuotes();
    if (res.book && res.ok) scheduleCloudPush(book);
  }

  function armCloudNoticeClear() {
    if (cloudNoticeTimer) clearTimeout(cloudNoticeTimer);
    cloudNoticeTimer = window.setTimeout(() => {
      cloudNoticeTimer = null;
      cloudNotice = "";
      cloudNoticeBusy = false;
      if (tab === "cloud") paint();
    }, 8000);
  }

  function setCloudNotice(text, ok) {
    if (cloudNoticeTimer) {
      clearTimeout(cloudNoticeTimer);
      cloudNoticeTimer = null;
    }
    cloudNotice = text;
    cloudNoticeOk = ok;
    cloudNoticeBusy = false;
    if (text) armCloudNoticeClear();
  }

  async function showBusy(text) {
    if (tab === "cloud") {
      if (cloudNoticeTimer) clearTimeout(cloudNoticeTimer);
      cloudNoticeTimer = null;
      cloudNotice = text;
      cloudNoticeOk = true;
      cloudNoticeBusy = true;
      await paint();
      return;
    }
    clearNoticeTimer();
    notice = text;
    noticeOk = true;
    noticeBusy = true;
    noticeCounts = null;
    await paint();
  }

  async function clearStatus() {
    clearNoticeTimer();
    notice = "";
    noticeOk = false;
    noticeBusy = false;
    noticeCounts = null;
    await paint();
  }

  function showRowMenu(e, ex, ticker) {
    hidePopovers();
    openRowMenu({ panel, e, book, ex, ticker, applyBook });
  }

  function applyDockWidth(nextPanel) {
    panelW = clampDockWidth(nextPanel, kind);
    const vis = displayDockWidth(panelW, kind);
    host.style.transform = "";
    if (minimized) {
      panel.style.removeProperty("width");
      host.style.top = "auto";
      host.style.bottom = "8px";
      host.style.right = "8px";
      host.style.borderRadius = "8px";
      host.style.overflow = "hidden";
      host.style.setProperty("background", "transparent", "important");
      host.style.setProperty("background-color", "transparent", "important");
      host.style.setProperty("border", "none", "important");
      host.style.setProperty("outline", "none", "important");
      host.style.setProperty("box-shadow", "none", "important");
      host.style.setProperty("display", "", "important");
      host.style.setProperty("width", "max-content", "important");
      host.style.setProperty("max-width", "min(92vw, 320px)", "important");
      host.style.setProperty("min-width", "0", "important");
      host.style.setProperty("height", `${DOCK_MIN_BAR_H}px`, "important");
      applyPageLayout(0);
    } else {
      panel.style.setProperty("width", "100%", "important");
      host.style.top = "0";
      host.style.bottom = "auto";
      host.style.right = "0";
      host.style.borderRadius = "0";
      host.style.overflow = "hidden";
      host.style.setProperty("background", "transparent", "important");
      host.style.setProperty("background-color", "transparent", "important");
      host.style.setProperty("border", "none", "important");
      host.style.setProperty("outline", "none", "important");
      host.style.setProperty("box-shadow", "none", "important");
      host.style.setProperty("display", "", "important");
      host.style.setProperty("width", `${vis}px`, "important");
      host.style.setProperty("max-width", `${maxW}px`, "important");
      host.style.setProperty("min-width", `${minW}px`, "important");
      host.style.setProperty("height", "100vh", "important");
      applyPageLayout(panelW);
    }
    return panelW;
  }

  function applyMinimized(next) {
    minimized = !!next;
    shell.classList.toggle("fv-min", minimized);
    minBtn.hidden = minimized;
    handle.style.display = minimized ? "none" : "";
    applyDockWidth(panelW);
  }

  function syncThemeBtn() {
    themeBtn.innerHTML =
      theme === "dark" ? `<span class="fv-theme-ico">🌙</span> Night` : `<span class="fv-theme-ico">☀</span> Day`;
    themeBtn.classList.toggle("day", theme === "light");
    shell.setAttribute("data-theme", theme);
  }

  applyMinimized(minimized);
  syncThemeBtn();

  themeBtn.addEventListener("click", async () => {
    theme = theme === "dark" ? "light" : "dark";
    await set(THEME_KEY, theme);
    syncThemeBtn();
  });

  minBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await set(minKey, true);
    applyMinimized(true);
  });

  async function expandDock() {
    if (!minimized) return;
    await set(minKey, false);
    applyMinimized(false);
  }

  let ignoreHeadDbl = false;

  head.addEventListener("click", () => {
    if (minimized) {
      ignoreHeadDbl = true;
      expandDock();
      setTimeout(() => {
        ignoreHeadDbl = false;
      }, 400);
    }
  });

  head.addEventListener("dblclick", async (e) => {
    if (e.target.closest("#fv-dock-min")) return;
    if (ignoreHeadDbl || minimized) return;
    e.preventDefault();
    await set(minKey, true);
    applyMinimized(true);
  });

  async function loadQuotes(force) {
    if (!phaseLive(6) || tab !== "watchlist") return;
    const stocks = activeList(book).stocks;
    if (!stocks.length) return;
    const gen = ++quoteGen;
    const haveAny = stocks.some((s) => typeof quotesMap.get(`${s.exchange}:${s.ticker}`)?.price === "number");
    quotesBusy = true;
    quotesLoading = !haveAny || !!force;
    if (quotesLoading) await paint();
    const res = await quotesForOpenListOnly(stocks, { force: !!force });
    quotesBusy = false;
    quotesLoading = false;
    if (notice === "Refreshing Data. Please Wait...") {
      notice = "";
      noticeBusy = false;
    }
    if (gen !== quoteGen) return;
    if (res?.ok && res.map) quotesMap = res.map;
    if (tab === "watchlist") await paint();
    armQuoteTimer();
  }

  function armQuoteTimer() {
    if (quoteTimer) {
      clearInterval(quoteTimer);
      quoteTimer = null;
    }
    if (!phaseLive(6) || tab !== "watchlist") return;
    if (!quotesNeedLivePoll(activeList(book).stocks)) return;
    quoteTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadQuotes(false);
    }, 60000);
  }

  function scheduleQuotes(force) {
    if (!phaseLive(6)) return;
    void loadQuotes(force);
  }

  async function paint() {
    const wrapNow = body.querySelector(".fv-table-wrap");
    if (wrapNow) tableScrollTop = wrapNow.scrollTop;
    if (selectMode) pruneSelected();
    body.classList.toggle("fv-watch", tab === "watchlist");
    body.classList.toggle("selecting", tab === "watchlist" && selectMode);
    if (tab === "cloud") {
      const url = (await get(CLOUD_KEYS.url)) || "";
      const key = (await get(CLOUD_KEYS.publishableKey)) || "";
      const email = (await get(CLOUD_KEYS.email)) || "";
      const st = await cloudStatus();
      body.innerHTML = `
        <div class="fv-cloud">
          <p class="fv-phase${ACTIVE_PHASE === 6 ? " fv-phase-warn" : ""}">${phaseBanner(ACTIVE_PHASE)}</p>
          <h3 class="fv-cloud-head${st.on ? " on" : " off"}">${st.on ? `${CLOUD_ICON} ${escapeAttr(st.heading)}` : escapeAttr(st.heading)}</h3>
          ${
            cloudNotice
              ? `<p class="fv-banner ${cloudNoticeBusy ? "busy" : cloudNoticeOk ? "ok" : "err"}">${escapeAttr(cloudNotice)}</p>`
              : ""
          }
          <label class="fv-field">Supabase URL
            <input type="url" id="fv-cloud-url" placeholder="https://xxxx.supabase.co" value="${escapeAttr(url)}" />
          </label>
          <label class="fv-field">Publishable key
            <input type="text" id="fv-cloud-key" placeholder="sb_publishable_..." autocomplete="off" value="${escapeAttr(key)}" />
          </label>
          <label class="fv-field">Email
            <input type="email" id="fv-cloud-email" placeholder="user@example.com" value="${escapeAttr(email)}" />
          </label>
          <label class="fv-field">Password
            <input type="password" id="fv-cloud-pass" placeholder="It is not stored Anywhere" autocomplete="off" />
          </label>
          <div class="fv-row fv-actions">
            <button type="button" class="fv-btn fv-pill fv-pill-add" id="fv-cloud-connect" title="Sign in to your Supabase project">Connect</button>
            <button type="button" class="fv-btn fv-pill fv-pill-scan" id="fv-cloud-disconnect" ${st.connected ? "" : "disabled"} title="Sign out. URL, key, and email stay on this computer">Disconnect</button>
          </div>
          <button type="button" class="fv-btn fv-pill fv-cloud-backup" id="fv-cloud-backup" hidden disabled aria-hidden="true" tabindex="-1" title="Cloud Backup and Cloud Restore ship in v2.0.0. Connect already syncs your lists">Cloud Backup</button>
          <div class="fv-row fv-actions fv-cloud-help">
            <button type="button" class="fv-btn fv-pill" id="fv-open-supabase" title="Open this project in the Supabase dashboard">Open Supabase</button>
            <button type="button" class="fv-btn fv-pill" id="fv-help-cloud" title="How to create the project, table, and login user">Help</button>
            <button type="button" class="fv-btn fv-pill" id="fv-copy-sql" title="Copy the table and RLS SQL for the SQL Editor">Copy Setup SQL</button>
          </div>
          ${
            cloudSqlNote
              ? `<p class="fv-cloud-sql-note ${cloudSqlOk ? "ok" : "err"}">${escapeAttr(cloudSqlNote)}</p>`
              : ""
          }
          <p class="fv-warn"><span class="fv-warn-label">Warning:</span> Delete Cloud Details only removes the Supabase URL, key, and email stored in this browser. It does not modify or delete anything in your Supabase project. You will need to enter these details again to reconnect.</p>
          <button type="button" class="fv-btn fv-pill fv-cloud-delete" id="fv-cloud-delete" title="Remove URL, key, and email from this browser only">Delete Cloud Details</button>
          <p class="fv-privacy">'FishView Watchlist' does not access or read any other tables in your Supabase project. It does not store, sell, or distribute your content. You retain full ownership of your data. FishView only requests permission to create, read, update, and manage the stock lists stored in the database you provide.</p>
        </div>
      `;
      wireCloudFields(body);
      return;
    }

    const cloudSt = await cloudStatus();
    body.innerHTML = watchlistHtml(book, {
      cloudIcon: CLOUD_ICON,
      refreshIcon: REFRESH_ICON,
      cloudHint: cloudHint(),
      cloudStatus: cloudSt,
      quoteHint: quoteHint(),
      ingestHint: ingestHint(),
      screenerHint: screenerHint(),
      chartinkHint: chartinkHint(),
      chartHint: chartHint(),
      notice,
      noticeOk,
      noticeBusy,
      noticeCounts,
      selectedKey,
      currentReady: (phaseLive(3) && kind === "tv") || (phaseLive(5) && Boolean(pageCurrentItem())),
      ingestReady: phaseLive(4),
      scanReady: phaseLive(5) && (kind === "screener" || kind === "chartink"),
      quotesReady: phaseLive(6),
      quotesLoading,
      quotes: quotesMap,
      selecting: selectMode,
      selectedKeys: selected,
      selView,
      selConfirm,
      flashKeys,
      chartinkChartDark: kind === "chartink" && chartinkChartDarkOffer(),
    });
    const wrap = body.querySelector(".fv-table-wrap");
    if (wrap) wrap.scrollTop = tableScrollTop;
    if (keepLabelPop && tab === "watchlist") placeLabelPop();
  }

  async function runSelAction(act, el) {
    if (act === "exit") {
      exitSelect();
      await paint();
      return true;
    }
    if (act === "actions") {
      selView = "actions";
      selConfirm = null;
      await paint();
      return true;
    }
    if (act === "back") {
      if (selView === "confirm") {
        selView = selConfirm?.from || "actions";
        selConfirm = null;
      } else selView = "actions";
      await paint();
      return true;
    }
    if (act === "label") {
      if (!selected.size) return true;
      selView = "label";
      await paint();
      return true;
    }
    if (act === "move" || act === "copy") {
      if (!selected.size) return true;
      selDestKind = act;
      selView = "dest";
      await paint();
      return true;
    }
    if (act === "delete") {
      if (!selected.size) return true;
      const n = selected.size;
      selConfirm = {
        kind: "delete",
        from: "actions",
        ok: "Delete",
        text: `Remove ${n} ${stockNoun(n)} from this list?`,
      };
      selView = "confirm";
      await paint();
      return true;
    }
    if (act === "pick-label") {
      const lab = el.getAttribute("data-label");
      const n = selected.size;
      const title = lab === "none" ? "Unlabel" : labelTitle(lab);
      selConfirm = {
        kind: "label",
        label: lab === "none" ? null : lab,
        from: "label",
        ok: "Confirm",
        text: lab === "none" ? `Unlabel ${n} ${stockNoun(n)}?` : `Apply ${title} to ${n} ${stockNoun(n)}?`,
      };
      selView = "confirm";
      await paint();
      return true;
    }
    if (act === "pick-dest") {
      const destId = el.getAttribute("data-to");
      const dest = book.lists.find((l) => l.id === destId);
      if (!dest) return true;
      const n = selected.size;
      const verb = selDestKind === "copy" ? "Copy" : "Move";
      selConfirm = {
        kind: selDestKind,
        destId,
        from: "dest",
        ok: "Confirm",
        text: `${verb} ${n} ${stockNoun(n)} to ${dest.name}?`,
      };
      selView = "confirm";
      await paint();
      return true;
    }
    if (act === "new-dest") {
      const name = await openModal({ title: "New list", value: "List", ok: "Create" });
      if (!name) return true;
      const made = await createDestList(book, name);
      if (!made.ok) {
        await applyBook(made);
        return true;
      }
      book = made.book;
      const n = selected.size;
      const verb = selDestKind === "copy" ? "Copy" : "Move";
      selConfirm = {
        kind: selDestKind,
        destId: made.id,
        from: "dest",
        ok: "Confirm",
        text: `${verb} ${n} ${stockNoun(n)} to ${made.name}?`,
      };
      selView = "confirm";
      await paint();
      return true;
    }
    if (act === "do") {
      const c = selConfirm;
      const keys = [...selected];
      if (!c || !keys.length) return true;
      if (c.kind === "label") {
        const res = await setLabelsOn(book, book.activeId, keys, c.label);
        if (!res.ok) {
          await applyBook(res);
          return true;
        }
        exitSelect();
        await applyBook({ ...res, message: res.updated === 1 ? "1 stock updated" : `${res.updated} stocks updated` });
        return true;
      }
      if (c.kind === "delete") {
        const res = await removeStocks(book, book.activeId, keys);
        if (!res.ok) {
          await applyBook(res);
          return true;
        }
        exitSelect();
        await applyBook({ ...res, message: res.removed === 1 ? "1 stock removed" : `${res.removed} stocks removed` });
        return true;
      }
      if (c.kind === "copy") {
        const res = await copyStocks(book, book.activeId, c.destId, keys);
        exitSelect();
        if (!res.ok) {
          await applyBook(res);
          return true;
        }
        await applyBook({ ...res, message: `${res.copied} copied, ${res.skipped} skipped` });
        return true;
      }
      if (c.kind === "move") {
        const res = await moveStocks(book, book.activeId, c.destId, keys);
        exitSelect();
        if (!res.ok) {
          await applyBook(res);
          return true;
        }
        await applyBook({ ...res, message: `${res.moved} moved, ${res.skipped} skipped` });
        return true;
      }
      return true;
    }
    return false;
  }

  function wireCloudFields(rootEl) {
    const bind = (id, key) => {
      const el = rootEl.querySelector(id);
      if (!el) return;
      el.addEventListener("change", () => set(key, el.value.trim()));
    };
    bind("#fv-cloud-url", CLOUD_KEYS.url);
    bind("#fv-cloud-key", CLOUD_KEYS.publishableKey);
    bind("#fv-cloud-email", CLOUD_KEYS.email);
  }

  shell.addEventListener("click", async (e) => {
    const selBtn = e.target.closest("#fv-sel-bar [data-sel]");
    if (selBtn) {
      e.preventDefault();
      hidePopovers();
      await runSelAction(selBtn.getAttribute("data-sel"), selBtn);
      return;
    }

    if (e.target.closest("#fv-open-supabase")) {
      const typed = String(body.querySelector("#fv-cloud-url")?.value || "").trim();
      chrome.runtime.sendMessage({ type: "OPEN_SUPABASE", url: typed });
      return;
    }
    if (e.target.closest("#fv-help-cloud")) {
      chrome.runtime.sendMessage({ type: "OPEN_CLOUD_HELP" });
      return;
    }
    if (e.target.closest("#fv-copy-sql")) {
      hidePopovers();
      const sql = copySetupSql();
      try {
        const ta = document.createElement("textarea");
        ta.value = sql;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        panel.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        cloudSqlNote = "Setup SQL copied";
        cloudSqlOk = true;
      } catch {
        cloudSqlNote = "Could not copy SQL";
        cloudSqlOk = false;
      }
      await paint();
      return;
    }
    if (e.target.closest("#fv-cloud-connect")) {
      hidePopovers();
      const url = body.querySelector("#fv-cloud-url")?.value || "";
      const key = body.querySelector("#fv-cloud-key")?.value || "";
      const email = body.querySelector("#fv-cloud-email")?.value || "";
      const password = body.querySelector("#fv-cloud-pass")?.value || "";
      await showBusy("Connecting...");
      const res = await connectCloud({ url, key, email, password });
      const passEl = body.querySelector("#fv-cloud-pass");
      if (passEl) passEl.value = "";
      if (!res.ok) {
        setCloudNotice(res.error || "Could not connect", false);
        await paint();
        return;
      }
      const pulled = await pullCloudBook(book);
      if (pulled.book) book = pulled.book;
      setCloudNotice("", true);
      await paint();
      return;
    }
    if (e.target.closest("#fv-cloud-disconnect")) {
      hidePopovers();
      await disconnectCloud();
      setCloudNotice("Disconnected", true);
      await paint();
      return;
    }
    if (e.target.closest("#fv-cloud-delete")) {
      hidePopovers();
      const go = await openModal({
        title: "Remove the URL, key, and email stored in this browser?",
        ok: "Delete Cloud Details",
        danger: true,
        showInput: false,
      });
      if (!go) return;
      await deleteCloudDetails();
      setCloudNotice("Cloud details removed", true);
      await paint();
      return;
    }

    if (e.target.closest("#fv-backup-local")) {
      hidePopovers();
      const go = await openModal({
        title: "Save all lists and labels to a file on this computer?",
        ok: "Backup Local",
        showInput: false,
      });
      if (!go) return;
      downloadText(backupFileName(), backupJson(book));
      notice = "Backup saved";
      noticeOk = true;
      noticeBusy = false;
      noticeCounts = null;
      await paint();
      return;
    }

    if (e.target.closest("#fv-restore-backup")) {
      hidePopovers();
      const pick = await openModal({
        title: "Restore replaces all lists on this browser. Choose a backup file?",
        ok: "Choose file",
        danger: true,
        showInput: false,
      });
      if (!pick) return;
      const file = await pickBackupFile();
      if (!file) return;
      if (!/\.json$/i.test(file.name)) {
        notice = "File must be a FishView .json backup";
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      const parsed = parseBackupText(await file.text());
      if (!parsed.ok) {
        notice = parsed.error;
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      const go = await openModal({
        title: `Replace all lists with ${file.name}? This cannot be undone.`,
        ok: "Restore Backup",
        danger: true,
        showInput: false,
      });
      if (!go) return;
      exitSelect();
      await applyBook(await restoreBackupBook(parsed.book));
      return;
    }

    if (e.target.closest(".fv-ctx")) return;
    if (e.target.closest("#fv-label-pop")) {
      if (e.target.closest("[data-act='sort-label']")) {
        keepLabelPop = false;
        await applyBook(await setSort(book, "label"));
        hideLabelPop();
        return;
      }
      const item = e.target.closest(".fv-lab-item");
      if (item) {
        e.preventDefault();
        keepLabelPop = true;
        const key = item.querySelector("[data-lab]")?.getAttribute("data-lab");
        if (key) await applyBook(await toggleLabelOn(book, key));
      }
      return;
    }

    if (e.target.closest("#fv-label-head")) {
      if (selectMode) {
        hidePopovers();
        const keys = visibleRowKeys();
        const chosen = keys.filter((k) => selected.has(k));
        const allOn = keys.length && chosen.length === Math.min(keys.length, BATCH_CAP) && chosen.length === selected.size;
        if (allOn) {
          keys.forEach((k) => selected.delete(k));
        } else {
          for (const k of keys) {
            if (selected.size >= BATCH_CAP) break;
            selected.add(k);
          }
          if (keys.length > BATCH_CAP && selected.size >= BATCH_CAP) batchCapNotice();
        }
        await paint();
        return;
      }
      const pop = body.querySelector("#fv-label-pop");
      if (pop && !pop.hidden) {
        hideLabelPop();
        return;
      }
      hidePopovers();
      keepLabelPop = true;
      placeLabelPop();
      return;
    }

    if (e.target.closest("#fv-list-pick")) {
      const drop = body.querySelector("#fv-list-drop");
      const open = drop && drop.hidden;
      hidePopovers();
      if (drop) drop.hidden = !open;
      return;
    }
    const listOpt = e.target.closest("[data-list]");
    if (listOpt) {
      hidePopovers();
      exitSelect();
      await applyBook(await setActive(book, listOpt.getAttribute("data-list")));
      return;
    }

    if (e.target.closest("#fv-chartink-day")) {
      hidePopovers();
      applyChartinkDayTheme();
      await paint();
      return;
    }

    if (e.target.closest("#fv-quotes-go")) {
      hidePopovers();
      if (!phaseLive(6) || quotesBusy) return;
      await loadQuotes(true);
      return;
    }

    if (e.target.closest("[data-act='add-stocks']") || e.target.closest("#fv-add")) {
      hidePopovers();
      if (!phaseLive(4)) return;
      await clearStatus();
      const raw = await openModal({
        title: "Add symbols (max 5)",
        value: "",
        ok: "Add",
        multiline: true,
      });
      if (raw == null) return;
      const split = splitPasteTokens(raw);
      if (!split.ok) {
        notice = split.error;
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      await showBusy("Checking symbols...");
      await ensureBoardBook();
      const items = split.tokens.map(resolvePasteToken);
      const { known, unknown, ready } = await filterKnownListings(items, true);
      if (!ready) {
        notice = "Could not verify symbols";
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      const res = known.length
        ? await addStocks(book, book.activeId, known)
        : { ok: true, book, added: 0, exists: 0, failed: 0, log: [] };
      const failed = (res.failed || 0) + unknown.length;
      res.counts = { added: res.added || 0, exists: res.exists || 0, failed };
      await applyBook(res, { flash: true });
      return;
    }

    if (e.target.closest("#fv-list-more")) {
      const menu = body.querySelector("#fv-list-menu");
      const open = menu && menu.hidden;
      hidePopovers();
      if (menu) menu.hidden = !open;
      return;
    }
    if (e.target.closest("#fv-xfer")) {
      const menu = body.querySelector("#fv-xfer-menu");
      const open = menu && menu.hidden;
      hidePopovers();
      if (menu) menu.hidden = !open;
      return;
    }

    const xferAct = e.target.closest("#fv-xfer-menu [data-act]");
    if (xferAct) {
      hidePopovers();
      if (!phaseLive(4) || xferAct.disabled) return;
      const act = xferAct.getAttribute("data-act");
      if (act === "export-file") {
        const list = activeList(book);
        const name = `${cleanListName(list.name) || "watchlist"}.csv`;
        downloadText(name, formatCsv(list));
        return;
      }
      if (act === "import-file") {
        await clearStatus();
        const info = await boardBookInfo();
        if (info.warnOld) {
          notice = "Symbol list is over 7 days old. Newly listed stocks may be rejected.";
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
        }
        const file = await pickCsvFile();
        if (!file) return;
        if (!/\.csv$/i.test(file.name)) {
          notice = "File must be .csv";
          noticeOk = false;
          noticeBusy = false;
          await paint();
          return;
        }
        await showBusy("Importing...");
        const text = await file.text();
        const parsed = parseCsvText(text);
        if (!parsed.ok) {
          notice = parsed.error;
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
          return;
        }
        if (!info.ready) {
          await ensureBoardBook();
        }
        await showBusy("Importing...");
        const { known, unknown, ready } = await filterKnownListings(parsed.rows, false);
        if (!ready) {
          notice = "Could not verify symbols";
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
          return;
        }
        if (!known.length) {
          noticeCounts = { added: 0, exists: 0, failed: unknown.length };
          notice = "";
          noticeOk = true;
          await paint();
          return;
        }
        const name = uniqueImportName(book, file.name.replace(/\.csv$/i, ""));
        const res = await createListWithStocks(book, name, known);
        const failed = (res.failed || 0) + unknown.length;
        unknown.forEach((it) => (res.log || (res.log = [])).push(`${it.exchange}:${it.ticker} failed unknown`));
        if (res.ok) res.counts = { added: res.added || 0, exists: res.exists || 0, failed };
        await applyBook(res);
        if (res.ok) await offerBulkLog(name, res.log);
      }
      return;
    }

    const listAct = e.target.closest("#fv-list-menu [data-act]");
    if (listAct) {
      hidePopovers();
      const act = listAct.getAttribute("data-act");
      const list = activeList(book);
      if (act === "rename-list") {
        const name = await openModal({ title: "Rename list", value: list.name, ok: "Save" });
        if (name) await applyBook(await renameList(book, list.id, name));
      }
      if (act === "delete-list") {
        const ok = await openModal({
          title: `Delete “${list.name}”?`,
          showInput: false,
          ok: "Delete",
          danger: true,
        });
        if (ok) await applyBook(await deleteList(book, list.id));
      }
      return;
    }

    if (e.target.closest("#fv-scan")) {
      hidePopovers();
      if (!phaseLive(5) || (kind !== "screener" && kind !== "chartink")) return;
      const tickers = kind === "screener" ? collectScreenerTickers() : collectChartinkTickers();
      if (!tickers.length) {
        notice = "No symbols on this page";
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      if (tickers.length > STOCK_CAP) {
        notice = `Scan has more than ${STOCK_CAP} symbols`;
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      const dest = await openScanChoice();
      if (!dest) return;
      const items = tickers.map((t) => {
        const resolved = preferNseThenBse(t);
        return resolved.ok ? { exchange: resolved.exchange, ticker: resolved.ticker } : { exchange: "NSE", ticker: t };
      });
      if (dest === "current") {
        const room = STOCK_CAP - activeList(book).stocks.length;
        if (tickers.length > room) {
          notice = `Not enough room in this list (${room} free)`;
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
          return;
        }
        await showBusy("Scanning...");
        await addPageItems(items);
        return;
      }
      if (book.lists.length >= LIST_CAP) {
        notice = `Maximum ${LIST_CAP} lists`;
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      const name = await openModal({ title: "New list", value: kind === "screener" ? "Screener" : "Chartink", ok: "Create" });
      if (!name) return;
      await showBusy("Scanning...");
      await addPageItems(items, { asNewList: true, listName: name });
      return;
    }

    if (e.target.closest("#fv-current")) {
      hidePopovers();
      if (phaseLive(5) && (kind === "screener" || kind === "chartink")) {
        const item = pageCurrentItem();
        if (!item?.ticker) {
          notice = "This symbol doesn't exist";
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
          return;
        }
        await showBusy("Checking symbol...");
        await addPageItems([item]);
        return;
      }
      if (!phaseLive(3) || kind !== "tv") return;
      const cur = await askCurrentListing();
      let ticker = String(cur?.ticker || "").trim();
      let exchange = canonicalExchange(cur?.exchange);
      if (ticker.includes(":")) {
        const parts = ticker.split(":");
        if (!exchange) exchange = canonicalExchange(parts[0]);
        ticker = parts.slice(1).join(":");
      }
      if (!ticker || cur?.missing) {
        notice = "This symbol doesn't exist";
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        await paint();
        return;
      }
      await showBusy("Adding...");
      const res = await addStocks(book, book.activeId, [{ exchange: exchange || "NSE", ticker }]);
      res.counts = { added: res.added || 0, exists: res.exists || 0, failed: res.failed || 0 };
      await applyBook(res, { flash: true });
      return;
    }

    if (e.target.closest("#fv-list-new")) {
      hidePopovers();
      const name = await openModal({ title: "New list", value: "List", ok: "Create" });
      if (name) await applyBook(await createList(book, name));
      return;
    }

    const sortTh = e.target.closest("th[data-sort]");
    if (sortTh) {
      hidePopovers();
      await applyBook(await setSort(book, sortTh.getAttribute("data-sort")));
      return;
    }

    const stockRow = e.target.closest("tbody tr[data-ticker]");
    if (stockRow) {
      const key = `${stockRow.dataset.ex}:${stockRow.dataset.ticker}`;
      if (selectMode) {
        if (Date.now() < ignoreRowClickUntil) return;
        toggleSelectKey(key);
        await paint();
        return;
      }
      selectedKey = key;
      body.querySelectorAll("tbody tr[data-ticker]").forEach((tr) => {
        tr.classList.toggle("fv-row-on", `${tr.dataset.ex}:${tr.dataset.ticker}` === selectedKey);
      });
      hidePopovers();
      if (phaseLive(3) && kind === "tv") {
        changeListing(stockRow.dataset.ex, stockRow.dataset.ticker);
      } else if (kind !== "tv") {
        chrome.runtime.sendMessage({
          type: "FV_OPEN_TV",
          exchange: stockRow.dataset.ex,
          ticker: stockRow.dataset.ticker,
        });
      }
      return;
    }

    if (!e.target.closest(".fv-menu") && !e.target.closest(".fv-ctx") && !e.target.closest("#fv-label-pop") && !e.target.closest("#fv-label-head") && !e.target.closest("#fv-list-wrap")) {
      hidePopovers();
    }
  });

  shell.addEventListener("contextmenu", (e) => {
    const tr = e.target.closest("tbody tr[data-ticker]");
    if (!tr) return;
    e.preventDefault();
    if (selectMode) return;
    showRowMenu(e, tr.dataset.ex, tr.dataset.ticker);
  });

  shell.addEventListener(
    "pointerdown",
    (e) => {
      if (e.target.closest("#fv-label-pop .fv-lab-item")) e.preventDefault();
    },
    true,
  );

  shell.addEventListener("pointerdown", (e) => {
    if (selectMode || tab !== "watchlist" || minimized) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.target.closest("button") || e.target.closest(".fv-menu") || e.target.closest("thead") || e.target.closest(".fv-sel-bar") || e.target.closest("#fv-label-pop")) return;
    const tr = e.target.closest("tbody tr[data-ticker]");
    if (!tr || !body.contains(tr)) return;
    const key = `${tr.dataset.ex}:${tr.dataset.ticker}`;
    lpStart = { x: e.clientX, y: e.clientY };
    lpTimer = window.setTimeout(() => {
      lpTimer = null;
      enterSelect(key);
    }, 500);
  });
  shell.addEventListener("pointermove", (e) => {
    if (!lpTimer || !lpStart) return;
    const dx = e.clientX - lpStart.x;
    const dy = e.clientY - lpStart.y;
    if (dx * dx + dy * dy > 36) cancelLp();
  });
  shell.addEventListener("pointerup", cancelLp);
  shell.addEventListener("pointercancel", cancelLp);

  shell.querySelectorAll(".fv-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (minimized) return;
      tab = btn.getAttribute("data-tab");
      if (tab !== "watchlist") exitSelect();
      shell.querySelectorAll(".fv-tab").forEach((b) => b.classList.toggle("on", b === btn));
      paint();
      if (tab === "watchlist") scheduleQuotes();
      else if (quoteTimer) {
        clearInterval(quoteTimer);
        quoteTimer = null;
      }
    });
  });

  handle.addEventListener("mousedown", (e) => {
    if (minimized) return;
    e.preventDefault();
    drag = true;
    startX = e.clientX;
    startW = panelW;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!drag || !document.getElementById(HOST_ID) || minimized) return;
    applyDockWidth(Math.min(maxW, Math.max(minW, startW + (startX - e.clientX))));
  });

  window.addEventListener("mouseup", async () => {
    if (!drag) return;
    drag = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    await set(widthKey, panelW);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (!document.getElementById(HOST_ID)) return;
    if (changes[widthKey] && !drag) {
      applyDockWidth(changes[widthKey].newValue);
    }
    if (changes[minKey]) {
      applyMinimized(changes[minKey].newValue === true);
    }
    if (changes[LIST_BOOK_KEY] && tab === "watchlist") {
      book = normalizeBook(changes[LIST_BOOK_KEY].newValue);
      paint();
      scheduleQuotes();
    }
  });

  paint();
  void ensureBoardBook();
  scheduleQuotes();
  void syncFromCloud();
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
