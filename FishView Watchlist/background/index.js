import {
  fetchAndBuildMap,
  BOARD_CACHE_KEY,
  BOARD_FIRST_KEY,
  BOARD_REFRESH_MS,
  BOARD_FIRST_RETRY_MS,
  BOARD_FIRST_WINDOW_MS,
  BOARD_FIRST_ALARM,
  usableBook,
} from "../listings/board-fetch.js";
import { SEED_EQ } from "../listings/seed-eq.js";

function startModule(label, fn) {
  try {
    fn();
    console.log(`[FishView] ${label} started`);
  } catch (e) {
    console.error(`[FishView] ${label} failed`, e);
  }
}

async function fetchYahooJson(url) {
  const href = String(url || "");
  if (!href.startsWith("https://query1.finance.yahoo.com/") && !href.startsWith("https://query2.finance.yahoo.com/")) {
    return { ok: false, status: 0 };
  }
  try {
    let crumb = await ensureYahooCrumb(false);
    let res = await fetch(withYahooCrumb(href, crumb), { credentials: "include", cache: "no-store" });
    if (res.status === 401) {
      crumb = await ensureYahooCrumb(true);
      res = await fetch(withYahooCrumb(href, crumb), { credentials: "include", cache: "no-store" });
    }
    const status = res.status;
    if (!res.ok) return { ok: false, status };
    const json = await res.json();
    return { ok: true, status, json };
  } catch (_) {
    return { ok: false, status: 0 };
  }
}

let yahooCrumb = "";
let yahooCrumbAt = 0;

function withYahooCrumb(href, crumb) {
  if (!crumb || href.includes("/v1/test/getcrumb")) return href;
  if (/[?&]crumb=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}crumb=${encodeURIComponent(crumb)}`;
}

async function ensureYahooCrumb(force) {
  if (!force && yahooCrumb && Date.now() - yahooCrumbAt < 45 * 60 * 1000) return yahooCrumb;
  try {
    await fetch("https://fc.yahoo.com/", { credentials: "include", cache: "no-store", redirect: "follow" });
  } catch (_) {}
  try {
    await fetch("https://finance.yahoo.com/", { credentials: "include", cache: "no-store" });
  } catch (_) {}
  try {
    const res = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      credentials: "include",
      cache: "no-store",
    });
    const text = String(await res.text() || "")
      .trim()
      .replace(/^"+|"+$/g, "");
    if (res.ok && text && text.length < 40 && !text.startsWith("<") && !text.startsWith("{")) {
      yahooCrumb = text;
      yahooCrumbAt = Date.now();
    }
  } catch (_) {}
  return yahooCrumb;
}

function openSupabase(raw) {
  let href = "https://supabase.com/dashboard";
  try {
    const x = new URL(String(raw || "").trim());
    if (x.protocol === "https:" && x.hostname.endsWith(".supabase.co") && x.hostname !== "supabase.co") {
      const ref = x.hostname.slice(0, -".supabase.co".length);
      if (ref && !ref.includes(".")) href = `https://supabase.com/dashboard/project/${encodeURIComponent(ref)}`;
    }
  } catch (_) {}
  chrome.tabs.create({ url: href });
}

function openCloudHelp() {
  chrome.tabs.create({ url: chrome.runtime.getURL("help/index.html") });
}

function isSupabaseHref(href) {
  try {
    const x = new URL(String(href || ""));
    return x.protocol === "https:" && (x.hostname === "supabase.co" || x.hostname.endsWith(".supabase.co"));
  } catch {
    return false;
  }
}

async function fetchCloudHttp(msg) {
  const href = String(msg.url || "");
  if (!isSupabaseHref(href)) return { ok: false, status: 0, error: "Not a Supabase URL" };
  const method = String(msg.method || "GET").toUpperCase();
  if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    return { ok: false, status: 0, error: "Bad method" };
  }
  try {
    const res = await fetch(href, {
      method,
      headers: msg.headers || {},
      body: method === "GET" || method === "DELETE" ? undefined : msg.body,
      cache: "no-store",
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, error: res.ok ? "" : text.slice(0, 240) };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  }
}

function seedEntry() {
  if (!usableBook(SEED_EQ)) return null;
  return { ts: Date.now(), map: SEED_EQ, live: false };
}

async function currentDump() {
  const cached = await chrome.storage.local.get(BOARD_CACHE_KEY);
  const kept = cached[BOARD_CACHE_KEY];
  if (kept?.map && usableBook(kept.map)) return kept;
  const seeded = seedEntry();
  if (seeded) {
    try {
      await chrome.storage.local.set({ [BOARD_CACHE_KEY]: seeded });
    } catch (_) {}
  }
  return seeded;
}

async function saveLive(map) {
  const entry = { ts: Date.now(), map, live: true };
  await chrome.storage.local.set({ [BOARD_CACHE_KEY]: entry });
  await chrome.storage.local.remove(BOARD_FIRST_KEY);
  try {
    await chrome.alarms.clear(BOARD_FIRST_ALARM);
  } catch (_) {}
  return entry;
}

async function tryLiveFetch() {
  const map = await fetchAndBuildMap();
  if (!usableBook(map)) throw new Error("Instrument parse empty");
  return saveLive(map);
}

async function firstRunState() {
  const data = await chrome.storage.local.get(BOARD_FIRST_KEY);
  return data[BOARD_FIRST_KEY] || null;
}

async function markFirstAttempt(startedAt) {
  await chrome.storage.local.set({
    [BOARD_FIRST_KEY]: { startedAt: startedAt || Date.now(), lastAttempt: Date.now() },
  });
}

function withinFirstWindow(first) {
  if (!first?.startedAt) return true;
  return Date.now() - first.startedAt < BOARD_FIRST_WINDOW_MS;
}

async function stopFirstRun() {
  await chrome.storage.local.remove(BOARD_FIRST_KEY);
  try {
    await chrome.alarms.clear(BOARD_FIRST_ALARM);
  } catch (_) {}
}

async function scheduleFirstRetries() {
  await chrome.alarms.create(BOARD_FIRST_ALARM, { periodInMinutes: BOARD_FIRST_RETRY_MS / 60000 });
}

async function loadInstrumentMap() {
  const kept = await currentDump();
  if (kept?.live) {
    if (Date.now() - kept.ts >= BOARD_REFRESH_MS) {
      tryLiveFetch().catch(() => {});
    }
    return { map: kept.map, ts: kept.ts, live: true };
  }
  if (kept) return { map: kept.map, ts: kept.ts, live: false };
  const live = await tryLiveFetch();
  return { map: live.map, ts: live.ts, live: true };
}

async function bootDump(isInstall) {
  const kept = await currentDump();
  if (kept?.live) {
    await stopFirstRun();
    if (Date.now() - kept.ts >= BOARD_REFRESH_MS) tryLiveFetch().catch(() => {});
    return;
  }
  const first = (await firstRunState()) || { startedAt: Date.now(), lastAttempt: 0 };
  if (!first.startedAt) first.startedAt = Date.now();
  if (isInstall || !first.lastAttempt) {
    try {
      await tryLiveFetch();
      return;
    } catch (_) {
      await markFirstAttempt(first.startedAt);
      await scheduleFirstRetries();
      return;
    }
  }
  if (!withinFirstWindow(first)) {
    await stopFirstRun();
    return;
  }
  if (Date.now() - (first.lastAttempt || 0) < BOARD_FIRST_RETRY_MS) return;
  try {
    await tryLiveFetch();
  } catch (_) {
    await markFirstAttempt(first.startedAt);
  }
}

function tvChartUrl(exchange, ticker) {
  const ex = String(exchange || "NSE").toUpperCase();
  const t = String(ticker || "").toUpperCase();
  return `https://in.tradingview.com/chart/?symbol=${encodeURIComponent(`${ex}:${t}`)}`;
}

async function openOrFocusTv(exchange, ticker) {
  const chartUrl = tvChartUrl(exchange, ticker);
  const tabs = await chrome.tabs.query({
    url: ["*://in.tradingview.com/*", "*://www.tradingview.com/*"],
  });
  const live = (tabs || []).filter((t) => t.id).sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  const tab = live[0];
  if (!tab) {
    await chrome.tabs.create({ url: chartUrl });
    return;
  }
  await chrome.tabs.update(tab.id, { active: true });
  try {
    if (tab.windowId) await chrome.windows.update(tab.windowId, { focused: true });
  } catch (_) {}
  const onChart = /\/chart/i.test(String(tab.url || ""));
  if (!onChart) {
    await chrome.tabs.update(tab.id, { url: chartUrl });
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "FV_CHANGE_SYMBOL",
      exchange: String(exchange || "NSE").toUpperCase(),
      ticker: String(ticker || "").toUpperCase(),
    });
  } catch (_) {
    await chrome.tabs.update(tab.id, { url: chartUrl });
  }
}

startModule("worker", () => {
  chrome.runtime.onInstalled.addListener((details) => {
    bootDump(details.reason === "install").catch((e) =>
      console.warn("[FishView] dump preload failed:", e.message || e)
    );
  });
  chrome.runtime.onStartup.addListener(() => {
    bootDump(false).catch(() => {});
  });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== BOARD_FIRST_ALARM) return;
    bootDump(false).catch(() => {});
  });

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "OPEN_CLOUD_HELP") {
      openCloudHelp();
      return;
    }
    if (msg && msg.type === "OPEN_SUPABASE") {
      openSupabase(msg.url);
      return;
    }
    if (msg && msg.type === "FV_CLOUD_HTTP") {
      fetchCloudHttp(msg).then((r) => sendResponse(r));
      return true;
    }
    if (msg && msg.type === "FV_YAHOO_JSON") {
      fetchYahooJson(msg.url).then((r) => sendResponse(r));
      return true;
    }
    if (msg && msg.type === "FV_OPEN_TV") {
      openOrFocusTv(msg.exchange, msg.ticker)
        .then(() => sendResponse({ ok: true }))
        .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
      return true;
    }
    if (msg && msg.type === "FV_BOARD_BOOK") {
      loadInstrumentMap()
        .then((entry) => sendResponse({ ok: true, map: entry.map, ts: entry.ts, live: entry.live }))
        .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
      return true;
    }
  });
});
