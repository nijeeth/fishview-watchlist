const BANNER = "WARNING: Delayed Price Data";
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
  NAME_MAX,
  BATCH_CAP,
  ALL_STOCKS_ID,
  allUniqueList,
  allUniqueStocks,
  removeStockEverywhere,
  createListWithStocks,
  renameList,
  deleteList,
  toggleLabelOn,
  restoreAllLabels,
  setSort,
  normalizeBook,
  cleanListName,
  nameTaken,
  clearNewEverywhere,
  clearNewFlags,
  canonicalExchange,
  labelTitle,
  setLabelsOn,
  removeStocks,
  copyStocks,
  moveStocks,
  createDestList,
  otherLists,
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
} from "../sites/screener/index.js";
import {
  isChartinkChartPage,
  currentChartinkListing,
  collectChartinkTickers,
  startChartinkPlus,
  chartinkChartDarkOffer,
  applyChartinkDayTheme,
  watchChartinkChartDark,
} from "../sites/chartink/index.js";
import {
  collectFishRsTickers,
  startFishRsPlus,
} from "../sites/fishrs/index.js";
import { isolateKeys, isolateElement } from "../shared/isolate-keys.js";
import { esc } from "../shared/escape.js";
import {
  splitPasteTokens,
  resolvePasteToken,
  parseCsvText,
  formatCsv,
  formatBulkLog,
  downloadText,
} from "../ingest/index.js";
import { quotesForOpenListOnly, quotesNeedLivePoll } from "../quotes/index.js";
import { cloudStatus, onCloudSync, connectCloud, disconnectCloud, deleteCloudDetails, copySetupSql, copyDiagReport, diagLogState, diagLogFileName, noteDiag, scheduleCloudPush, cancelPendingCloudPush, pullCloudBook, resolveCloudOnConnect } from "../cloud/index.js";
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
const DL_ICON = `<svg class="fv-dl-ico" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

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
  let onStorageChange = null;
  let drag = false;
  let startX = 0;
  let startW = panelW;

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText =
    `all:initial;position:fixed;top:0;right:0;z-index:2147483646;box-sizing:border-box;overflow:hidden;font-size:${compact ? 11 : 14}px;line-height:1.3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;`;

  const shadow = host.attachShadow({ mode: "closed" });
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
        <p class="fv-credit"><span>Nijeeth</span><span class="fv-credit-accent">Fish</span></p>
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
    if (shell.querySelector(".fv-menu:not([hidden]), .fv-ctx")) {
      hideTip();
      return;
    }
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
  let viewAll = true;
  const curList = () => (viewAll ? allUniqueList(book) : activeList(book));
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
  let cloudPullBusy = false;
  let stopCloudSync = null;

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
    const have = new Set(curList().stocks.map((s) => `${s.exchange}:${s.ticker}`));
    for (const k of [...selected]) {
      if (!have.has(k)) selected.delete(k);
    }
  }

  function visibleRowKeys() {
    return visibleStocks(book, quotesMap, curList()).map((s) => `${s.exchange}:${s.ticker}`);
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
    if (shell.querySelector(".fv-ctx, .fv-menu:not([hidden])")) {
      e.preventDefault();
      hidePopovers();
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
      if (selView === "label") {
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

  // Up/Down walks our visible list and switches the TV chart, instead of
  // TradingView's own watchlist. Never while typing in a page or dock field.
  function onArrowNav(e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (tab !== "watchlist" || minimized || selectMode) return;
    const t = e.target;
    if (t && t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    const ae = shadow.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    if (panel.querySelector(".fv-modal")) return;
    const keys = visibleRowKeys();
    if (!keys.length) return;
    e.preventDefault();
    e.stopPropagation();
    const idx = keys.indexOf(selectedKey);
    const next =
      e.key === "ArrowDown"
        ? idx < 0
          ? 0
          : Math.min(idx + 1, keys.length - 1)
        : idx < 0
          ? 0
          : Math.max(idx - 1, 0);
    selectedKey = keys[next];
    let row = null;
    body.querySelectorAll("tbody tr[data-ticker]").forEach((tr) => {
      const on = `${tr.dataset.ex}:${tr.dataset.ticker}` === selectedKey;
      tr.classList.toggle("fv-row-on", on);
      if (on) row = tr;
    });
    const wrapEl = body.querySelector(".fv-table-wrap");
    if (wrapEl && row) {
      const wr = wrapEl.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      if (rr.top < wr.top) wrapEl.scrollTop += rr.top - wr.top;
      else if (rr.bottom > wr.bottom) wrapEl.scrollTop += rr.bottom - wr.bottom;
      tableScrollTop = wrapEl.scrollTop;
    }
    if (kind === "tv") {
      const parts = selectedKey.split(":");
      changeListing(parts[0], parts.slice(1).join(":"));
    }
  }
  document.addEventListener("keydown", onArrowNav, true);

  function pageCurrentItem() {
    if (kind === "screener") return currentScreenerListing();
    if (kind === "chartink") return currentChartinkListing();
    return null;
  }

  function scanSite() {
    if (kind === "screener" || kind === "chartink" || kind === "fishrs") return kind;
    return "";
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
    if (!ticker) return;
    if (viewAll) {
      notice = "Pick a named list to add";
      noticeOk = false;
      noticeBusy = false;
      noticeCounts = null;
      await paint();
      return;
    }
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

  function armNoticeClear() {
    clearNoticeTimer();
    noticeTimer = window.setTimeout(() => {
      noticeTimer = null;
      notice = "";
      noticeBusy = false;
      if (tab === "watchlist") paint();
    }, 8000);
  }

  async function refreshFromCloud() {
    if (minimized || cloudPullBusy) return;
    const st = await cloudStatus();
    if (!st.canSync) return;
    cloudPullBusy = true;
    await paint();
    try {
      const res = await pullCloudBook(book);
      if (res.book) book = res.book;
      if (!res.ok && tab === "cloud") setCloudNotice(res.error || "Network issue", false);
      await paint();
      if (res.ok && res.pulled) scheduleQuotes();
    } finally {
      cloudPullBusy = false;
      await paint();
    }
  }

  stopCloudSync = onCloudSync(() => {
    void paint();
  });
  let stopPlus = null;
  if (kind === "screener") stopPlus = startScreenerPlus();
  if (kind === "chartink") stopPlus = startChartinkPlus();
  if (kind === "fishrs") stopPlus = startFishRsPlus();
  let stopChartinkTheme = null;
  if (kind === "chartink") {
    stopChartinkTheme = watchChartinkChartDark(() => {
      void paint();
    });
  }

  host._fvOff = () => {
    document.removeEventListener("pointerdown", onDocPointer, true);
    document.removeEventListener("keydown", onDocKey, true);
    document.removeEventListener("keydown", onArrowNav, true);
    window.removeEventListener("mousemove", onWinMouseMove);
    window.removeEventListener("mouseup", onWinMouseUp);
    document.removeEventListener("fv_page_plus", onPagePlus);
    document.removeEventListener("visibilitychange", onVis);
    if (onStorageChange) {
      chrome.storage.onChanged.removeListener(onStorageChange);
      onStorageChange = null;
    }
    cancelPendingCloudPush();
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
    if (stopCloudSync) stopCloudSync();
  };

  function openModal({ title, value = "", ok = "OK", danger = false, showInput = true, multiline = false, anchor = null }) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = anchor ? "fv-modal fv-modal-anchor" : "fv-modal";
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
      const card = wrap.querySelector(".fv-modal-card");
      if (anchor && card) {
        const place = () => {
          const ar = anchor.getBoundingClientRect();
          const pr = panel.getBoundingClientRect();
          const cw = card.offsetWidth || Math.min(280, pr.width - 16);
          const ch = card.offsetHeight || 120;
          let top = ar.bottom - pr.top + 4;
          let left = ar.left - pr.left;
          if (top + ch > pr.height - 8) top = Math.max(8, ar.top - pr.top - ch - 4);
          left = Math.min(Math.max(8, left), Math.max(8, pr.width - cw - 8));
          card.style.top = `${top}px`;
          card.style.left = `${left}px`;
        };
        place();
        requestAnimationFrame(place);
      }
      const input = wrap.querySelector("#fv-modal-in");
      const confirm = () => wrap.querySelector('[data-k="yes"]')?.click();
      const cancel = () => wrap.querySelector('[data-k="no"]')?.click();
      wrap.addEventListener(
        "keydown",
        (ev) => {
          if (ev.key === "Escape") {
            ev.preventDefault();
            cancel();
          }
          if (ev.key === "Enter" && !ev.shiftKey) {
            ev.preventDefault();
            confirm();
          }
        },
        true
      );
      if (input) {
        isolateElement(input);
        input.focus();
        if (input.select) input.select();
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

  function openScanChoice(forceNew = false) {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "fv-modal";
      wrap.innerHTML = `
        <div class="fv-modal-card">
          <p>Scan</p>
          <div class="fv-modal-actions stack">
            <button type="button" class="fv-btn fv-pill fv-pill-add" data-k="current" ${forceNew ? "disabled" : ""} title="${forceNew ? "Pick a named list first" : ""}">Add to current watchlist</button>
            <button type="button" class="fv-btn fv-pill fv-pill-current" data-k="new">Add to new watchlist</button>
            <button type="button" class="fv-btn fv-pill fv-pill-file" data-k="no">Cancel</button>
          </div>
        </div>`;
      panel.appendChild(wrap);
      wrap.addEventListener("click", (ev) => {
        const k = ev.target.getAttribute?.("data-k");
        if (k === "no") {
          wrap.remove();
          resolve(null);
        }
        if ((k === "current" && !forceNew) || k === "new") {
          wrap.remove();
          resolve(k);
        }
      });
    });
  }

  function openCloudSyncChoice() {
    return new Promise((resolve) => {
      const wrap = document.createElement("div");
      wrap.className = "fv-modal";
      wrap.innerHTML = `
        <div class="fv-modal-card fv-cloud-sync">
          <p>Cloud and this browser have different lists.</p>
          <p class="fv-cloud-sync-note">Use cloud — replace this browser with the copy in Supabase.</p>
          <p class="fv-cloud-sync-note">Keep this browser — upload this PC and replace the cloud copy.</p>
          <p class="fv-cloud-sync-note">Keep both — merge. Same list name unions stocks. Extra cloud lists are added.</p>
          <p class="fv-cloud-sync-note">Caps: ${LIST_CAP} lists, ${STOCK_CAP} stocks. Leftovers are skipped.</p>
          <div class="fv-modal-actions stack">
            <button type="button" class="fv-btn fv-pill fv-pill-current" data-k="cloud">Use cloud</button>
            <button type="button" class="fv-btn fv-pill fv-pill-scan" data-k="local">Keep this browser</button>
            <button type="button" class="fv-btn fv-pill fv-pill-add" data-k="both">Keep both</button>
          </div>
        </div>`;
      panel.appendChild(wrap);
      wrap.addEventListener("click", (ev) => {
        const k = ev.target.getAttribute?.("data-k");
        if (k === "cloud" || k === "local" || k === "both") {
          wrap.remove();
          resolve(k);
        }
      });
    });
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

  /** Any row interaction clears the "new" mark (everywhere the stock exists). */
  async function markSeenRow(ex, ticker) {
    const res = await clearNewEverywhere(book, ex, ticker);
    if (res.cleared && res.book) {
      book = res.book;
      await paint();
      scheduleCloudPush(book);
    }
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
    if (res.book) {
      if (res.book.activeId && res.book.activeId !== book.activeId) viewAll = false;
      book = res.book;
    }
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
    openRowMenu({ panel, e, book, ex, ticker, applyBook, viewAll, onDeleteAll: confirmDeleteEverywhere });
  }

  async function confirmDeleteEverywhere(ex, ticker) {
    const ok = await openModal({
      title: `Careful: ${ticker} will be removed from ALL watchlists`,
      showInput: false,
      ok: "Delete",
      danger: true,
    });
    if (!ok) return;
    await applyBook(await removeStockEverywhere(book, ex, ticker));
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
      if (kind === "tv") shell.setAttribute("data-narrow", panelW < 300 ? "1" : "0");
      else shell.removeAttribute("data-narrow");
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

  head.addEventListener("click", async (e) => {
    if (e.target.closest("#fv-dock-min")) return;
    if (minimized) {
      await expandDock();
      return;
    }
    await set(minKey, true);
    applyMinimized(true);
  });

  async function loadQuotes(force) {
    if (tab !== "watchlist") return;
    const stocks = curList().stocks;
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
    if (tab !== "watchlist") return;
    if (!quotesNeedLivePoll(curList().stocks)) return;
    quoteTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadQuotes(false);
    }, 60000);
  }

  function scheduleQuotes(force) {
    void loadQuotes(force);
  }

  async function paint() {
    const wrapNow = body.querySelector(".fv-table-wrap");
    if (wrapNow) tableScrollTop = wrapNow.scrollTop;
    // Popovers inside #fv-body are rebuilt by innerHTML — remember open ones (B-20).
    const openPops = ["#fv-list-drop", "#fv-xfer-menu", "#fv-list-menu"].filter((sel) => {
      const el = body.querySelector(sel);
      return el && !el.hidden;
    });
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
          <p class="fv-phase fv-phase-warn">${BANNER}</p>
          <h3 class="fv-cloud-head ${st.tone === "on" || st.tone === "busy" ? "on" : st.tone === "err" ? "err" : "off"}">${CLOUD_ICON} ${escapeAttr(st.heading)}</h3>
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
          <button type="button" class="fv-btn fv-pill fv-cloud-backup" id="fv-cloud-backup" hidden disabled aria-hidden="true" tabindex="-1" title="Not available. Connect already syncs your lists">Cloud Backup</button>
          <div class="fv-cloud-help">
            <button type="button" class="fv-btn fv-pill" id="fv-open-supabase" title="Open this project in the Supabase dashboard">Open Supabase</button>
            <button type="button" class="fv-btn fv-pill" id="fv-help-cloud" title="How to create the project, table, and login user">Help</button>
            <button type="button" class="fv-btn fv-pill" id="fv-copy-sql" title="Copy the table and RLS SQL for the SQL Editor">Copy Setup SQL</button>
            <button type="button" class="fv-btn fv-pill" id="fv-dl-log" title="Save a local log of cloud events as a text file. No lists or stocks">${DL_ICON} Log</button>
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
      cloudStatus: cloudSt,
      notice,
      noticeOk,
      noticeBusy,
      noticeCounts,
      selectedKey,
      currentReady: kind === "tv" || Boolean(pageCurrentItem()),
      scanReady: Boolean(scanSite()),
      quotesLoading,
      quotes: quotesMap,
      selecting: selectMode,
      selectedKeys: selected,
      selView,
      selConfirm,
      flashKeys,
      chartinkChartDark: kind === "chartink" && chartinkChartDarkOffer(),
      viewList: curList(),
      viewAll,
      allStocks: allUniqueStocks(book).length,
      newCount: curList().stocks.reduce((n, s) => n + (s.isNew ? 1 : 0), 0),
    });
    const wrap = body.querySelector(".fv-table-wrap");
    if (wrap) wrap.scrollTop = tableScrollTop;
    for (const sel of openPops) {
      const el = body.querySelector(sel);
      if (el) el.hidden = false;
    }
    if (keepLabelPop && tab === "watchlist") placeLabelPop();
  }

  async function setDestConfirm(destId, destName) {
    const n = selected.size;
    const verb = selDestKind === "copy" ? "Copy" : "Move";
    selConfirm = {
      kind: selDestKind,
      destId,
      from: "actions",
      ok: "Confirm",
      text: `${verb} ${n} ${stockNoun(n)} to ${destName}?`,
    };
    selView = "confirm";
    await paint();
  }

  // Floating destination picker — identical structure to the row right-click
  // Move/Copy menu (nav, pick list, create-new form), so bulk stays compact.
  function openBulkDestPicker(copy) {
    panel.querySelectorAll(".fv-ctx").forEach((m) => m.remove());
    const verb = copy ? "Copy" : "Move";
    const menu = document.createElement("div");
    menu.className = "fv-ctx";
    const dests = otherLists(book, book.activeId);
    const rows = dests.length
      ? dests
          .map(
            (l) =>
              `<button type="button" class="fv-ctx-row" data-to="${esc(l.id)}" title="${esc(l.name)}">
                <span>${esc(l.name)} (${l.stocks.length})</span>
              </button>`
          )
          .join("")
      : `<div class="fv-ctx-empty">No other lists yet</div>`;
    menu.innerHTML = `
      <div class="fv-ctx-nav">
        <button type="button" class="fv-ctx-back" data-bact="back">← Back</button>
        <span>${verb} ${selected.size} ${stockNoun(selected.size)} to</span>
      </div>
      <div class="fv-ctx-pick">${rows}</div>
      ${
        book.lists.length < LIST_CAP
          ? `<div class="fv-ctx-line"></div>
             <div class="fv-ctx-new">
               <button type="button" class="fv-ctx-link" data-bact="show-new">+ Create new list…</button>
               <div class="fv-ctx-newform" hidden>
                 <input type="text" class="fv-ctx-newin" maxlength="${NAME_MAX}" />
                 <button type="button" class="fv-btn fv-pill fv-pill-add fv-ctx-gonew" data-bact="create">${verb} to new list</button>
               </div>
             </div>`
          : `<div class="fv-ctx-empty">Maximum ${LIST_CAP} lists</div>`
      }
    `;
    panel.appendChild(menu);
    menu.style.left = "8px";
    const bar = body.querySelector("#fv-sel-bar");
    if (bar) {
      const pr = panel.getBoundingClientRect();
      const br = bar.getBoundingClientRect();
      let top = br.top - pr.top - menu.offsetHeight - 6;
      if (top < 4) top = 4;
      menu.style.top = `${top}px`;
    } else {
      menu.style.bottom = "8px";
    }
    menu.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("[data-bact], [data-to]");
      if (!btn) return;
      ev.stopPropagation();
      const act = btn.getAttribute("data-bact");
      if (act === "back") {
        menu.remove();
        return;
      }
      if (act === "show-new") {
        btn.hidden = true;
        const form = menu.querySelector(".fv-ctx-newform");
        if (form) form.hidden = false;
        const input = menu.querySelector(".fv-ctx-newin");
        if (input) {
          isolateElement(input);
          input.focus();
        }
        return;
      }
      if (act === "create") {
        const input = menu.querySelector(".fv-ctx-newin");
        const name = String(input?.value || "").trim();
        if (!name) return;
        menu.remove();
        const made = await createDestList(book, name);
        if (!made.ok) {
          await applyBook(made);
          return;
        }
        book = made.book;
        await setDestConfirm(made.id, made.name);
        return;
      }
      const toId = btn.getAttribute("data-to");
      if (toId) {
        const dest = book.lists.find((l) => l.id === toId);
        menu.remove();
        if (!dest) return;
        await setDestConfirm(dest.id, dest.name);
      }
    });
    menu.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" || !ev.target.classList?.contains("fv-ctx-newin")) return;
      ev.preventDefault();
      menu.querySelector("[data-bact='create']")?.click();
    });
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
      selView = "actions";
      selConfirm = null;
      await paint();
      openBulkDestPicker(act === "copy");
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
    if (e.target.closest("#fv-dl-log")) {
      hidePopovers();
      const st = await diagLogState();
      if (!st.configured && !st.hasEvents) {
        cloudSqlNote = "No log. Cloud is not configured.";
        cloudSqlOk = false;
        await paint();
        return;
      }
      if (!st.hasEvents) {
        cloudSqlNote = "No log yet.";
        cloudSqlOk = false;
        await paint();
        return;
      }
      try {
        downloadText(diagLogFileName(), await copyDiagReport());
        cloudSqlNote = "If issue, mail log to nijeethfish@gmail.com";
        cloudSqlOk = true;
      } catch {
        cloudSqlNote = "Could not save log";
        cloudSqlOk = false;
      }
      await paint();
      return;
    }
    if (e.target.closest("#fv-cloud-sync-now")) {
      hidePopovers();
      void refreshFromCloud();
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
      setCloudNotice("Cloud Link Established", true);
      await paint();
      const synced = await resolveCloudOnConnect(book, () => openCloudSyncChoice());
      if (!synced.ok) {
        setCloudNotice(synced.error || "Could not sync lists", false);
        await paint();
        return;
      }
      if (synced.book) book = synced.book;
      viewAll = true;
      const skipBits = [];
      if (synced.skippedStocks) skipBits.push(`${synced.skippedStocks} stocks skipped (${STOCK_CAP} cap)`);
      if (synced.skippedLists) skipBits.push(`${synced.skippedLists} lists skipped (50 cap)`);
      setCloudNotice(skipBits.length ? skipBits.join(". ") : "", true);
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
        ok: "Delete",
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
      const restored = await restoreBackupBook(parsed.book);
      if (restored.ok && (await cloudStatus()).on) {
        restored.message = "Restored. Linked cloud will be replaced in about 2 seconds.";
      }
      noteDiag({ kind: "restore", result: restored.ok ? "ok" : "fail", err: restored.error, hasSession: !!(await cloudStatus()).connected });
      await applyBook(restored);
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
      const id = listOpt.getAttribute("data-list");
      if (id === ALL_STOCKS_ID) {
        viewAll = true;
        await paint();
        scheduleQuotes();
        return;
      }
      viewAll = false;
      await applyBook(await setActive(book, id));
      return;
    }

    if (e.target.closest("#fv-chartink-day")) {
      hidePopovers();
      applyChartinkDayTheme();
      await paint();
      return;
    }

    if (e.target.closest("#fv-clear-new")) {
      hidePopovers();
      const res = await clearNewFlags(book, viewAll ? ALL_STOCKS_ID : book.activeId);
      if (res.cleared && res.book) {
        book = res.book;
        scheduleCloudPush(book);
      }
      await paint();
      return;
    }

    if (e.target.closest("#fv-quotes-go")) {
      hidePopovers();
      if (quotesBusy) return;
      await loadQuotes(true);
      return;
    }

    if (e.target.closest("[data-act='add-stocks']") || e.target.closest("#fv-add")) {
      hidePopovers();
      if (viewAll) return;
      await clearStatus();
      const raw = await openModal({
        title: "Add symbols (max 5)",
        value: "",
        ok: "Add",
        multiline: true,
        anchor: e.target.closest("#fv-add, [data-act='add-stocks']") || body.querySelector("#fv-add"),
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
      hideTip();
      const menu = body.querySelector("#fv-xfer-menu");
      const open = menu && menu.hidden;
      hidePopovers();
      if (menu) menu.hidden = !open;
      return;
    }

    const xferAct = e.target.closest("#fv-xfer-menu [data-act]");
    if (xferAct) {
      hidePopovers();
      if (xferAct.disabled) return;
      const act = xferAct.getAttribute("data-act");
      if (act === "export-file") {
        const list = curList();
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
        const name = cleanListName(file.name.replace(/\.csv$/i, "")) || "Import";
        if (nameTaken(book, name)) {
          notice = `Watchlist "${name}" already exists`;
          noticeOk = false;
          noticeBusy = false;
          noticeCounts = null;
          await paint();
          return;
        }
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
      if (viewAll) return;
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
      const site = scanSite();
      if (!site) return;
      const tickers =
        site === "screener"
          ? collectScreenerTickers()
          : site === "chartink"
            ? collectChartinkTickers()
            : collectFishRsTickers();
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
      // All Unique Stock is a computed view: the "current watchlist" choice is disabled.
      const dest = await openScanChoice(viewAll);
      if (!dest) return;
      const items = tickers.map((t) => {
        if (t && typeof t === "object" && t.ticker) {
          return { exchange: String(t.exchange || "NSE").toUpperCase(), ticker: String(t.ticker).toUpperCase() };
        }
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
      const suggested =
        kind === "screener" ? "Screener" : kind === "chartink" ? "Chartink" : "FishRS";
      const name = await openModal({ title: "New list", value: suggested, ok: "Create" });
      if (!name) return;
      await showBusy("Scanning...");
      await addPageItems(items, { asNewList: true, listName: name });
      return;
    }

    if (e.target.closest("#fv-current")) {
      hidePopovers();
      if (viewAll) return;
      if (kind === "screener" || kind === "chartink") {
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
      if (kind !== "tv") return;
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
      const plus = e.target.closest("#fv-list-new");
      const name = await openModal({ title: "New list", value: "", ok: "Create", anchor: plus });
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
        void markSeenRow(stockRow.dataset.ex, stockRow.dataset.ticker);
        toggleSelectKey(key);
        await paint();
        return;
      }
      selectedKey = key;
      void markSeenRow(stockRow.dataset.ex, stockRow.dataset.ticker);
      body.querySelectorAll("tbody tr[data-ticker]").forEach((tr) => {
        tr.classList.toggle("fv-row-on", `${tr.dataset.ex}:${tr.dataset.ticker}` === selectedKey);
      });
      hidePopovers();
      if (kind === "tv") {
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

  shell.addEventListener("contextmenu", async (e) => {
    const tr = e.target.closest("tbody tr[data-ticker]");
    if (!tr) return;
    e.preventDefault();
    if (selectMode) return;
    await markSeenRow(tr.dataset.ex, tr.dataset.ticker);
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
      if (viewAll) {
        notice = "Bulk actions are not available in All Unique Stock";
        noticeOk = false;
        noticeBusy = false;
        noticeCounts = null;
        paint();
        return;
      }
      const ci = key.indexOf(":");
      void markSeenRow(key.slice(0, ci), key.slice(ci + 1));
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

  const onWinMouseMove = (e) => {
    if (!drag || !document.getElementById(HOST_ID) || minimized) return;
    applyDockWidth(Math.min(maxW, Math.max(minW, startW + (startX - e.clientX))));
  };
  const onWinMouseUp = async () => {
    if (!drag) return;
    drag = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    await set(widthKey, panelW);
  };
  window.addEventListener("mousemove", onWinMouseMove);
  window.addEventListener("mouseup", onWinMouseUp);

  onStorageChange = (changes, area) => {
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
  };
  chrome.storage.onChanged.addListener(onStorageChange);

  paint();
  void ensureBoardBook();
  scheduleQuotes();
  void syncFromCloud();
}

function escapeAttr(s) {
  return esc(s);
}
