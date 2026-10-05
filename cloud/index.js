import { get, set, remove, CLOUD_KEYS, LIST_BOOK_KEY } from "../persist/index.js";
import { normalizeBook, saveBook, bookFingerprint, mergeKeepBoth } from "../lists/book.js";
import { SETUP_SQL } from "./sql.js";
import { noteDiag, formatDiagReport, diagLogState, diagLogFileName } from "./diag.js";

export { SETUP_SQL };

const TABLE = "fv_list_book";

let holdEstablished = false;
let syncInflight = 0;
let syncInfo = { status: "off", linked: false, error: "" };
const syncListeners = new Set();

export function cloudSyncInfo() {
  return { status: syncInfo.status, linked: syncInfo.linked, error: syncInfo.error };
}

export function onCloudSync(fn) {
  syncListeners.add(fn);
  try {
    fn(cloudSyncInfo());
  } catch {
    /* ignore */
  }
  return () => syncListeners.delete(fn);
}

function emitCloudSync(patch) {
  syncInfo = { ...syncInfo, ...patch };
  const snap = cloudSyncInfo();
  for (const fn of syncListeners) {
    try {
      fn(snap);
    } catch {
      /* ignore */
    }
  }
}

function beginCloudWork() {
  if (syncInflight === 0) holdEstablished = false;
  syncInflight += 1;
  emitCloudSync({ status: "syncing", error: "" });
}

function endCloudWork(ok, error) {
  syncInflight = Math.max(0, syncInflight - 1);
  if (syncInflight > 0) return;
  if (!ok) {
    const msg = String(error || "Could not reach cloud");
    if (/database not ready/i.test(msg)) {
      emitCloudSync({ status: "idle", linked: false, error: msg });
      return;
    }
    emitCloudSync({ status: "error", error: msg });
    return;
  }
  emitCloudSync({ status: "idle", error: "" });
}

function cloudWorkSkippedOff() {
  if (syncInflight > 0) return;
  emitCloudSync({ status: "off", linked: false, error: "" });
}

export function noteCloudLinked(on) {
  if (syncInflight > 0) return;
  if (on) {
    if (syncInfo.status === "error" || syncInfo.status === "pending" || syncInfo.status === "syncing") return;
    if (syncInfo.linked && syncInfo.status === "idle") return;
    emitCloudSync({ linked: true, status: "idle", error: "" });
    return;
  }
  if (syncInfo.status === "error") return;
  if (!syncInfo.linked && syncInfo.status === "off") return;
  emitCloudSync({ status: "off", linked: false, error: "" });
}

function cloudHttp(opts) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "FV_CLOUD_HTTP", ...opts }, (res) => {
      if (chrome.runtime.lastError) resolve({ ok: false, error: chrome.runtime.lastError.message, status: 0 });
      else resolve(res || { ok: false, error: "No response", status: 0 });
    });
  });
}

export function normalizeCloudUrl(raw) {
  const u = String(raw || "").trim().replace(/\/+$/, "");
  try {
    const x = new URL(u);
    if (x.protocol !== "https:") return "";
    if (x.hostname !== "supabase.co" && !x.hostname.endsWith(".supabase.co")) return "";
    return `${x.protocol}//${x.host}`;
  } catch {
    return "";
  }
}

function errFromBody(json, fallback) {
  if (!json || typeof json !== "object") return fallback;
  return String(json.msg || json.error_description || json.error || json.message || fallback);
}

async function creds() {
  const url = normalizeCloudUrl(await get(CLOUD_KEYS.url));
  const key = String((await get(CLOUD_KEYS.publishableKey)) || "").trim();
  const email = String((await get(CLOUD_KEYS.email)) || "").trim();
  const session = (await get(CLOUD_KEYS.session)) || null;
  return { url, key, email, session };
}

async function rest(path, { method = "GET", token, key, url, body, extra = {} } = {}) {
  const headers = {
    apikey: key,
    Authorization: `Bearer ${token || key}`,
    "Content-Type": "application/json",
    ...extra,
  };
  const res = await cloudHttp({
    url: `${url}${path}`,
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res?.ok) {
    noteDiag({
      kind: "http",
      method,
      path,
      status: res?.status,
      ok: false,
      err: res?.error || errFromBody(res?.json, "fail"),
    });
  }
  return res;
}

async function writeSession(session) {
  await set(CLOUD_KEYS.session, session);
}

function isDeadSession(res) {
  const code = Number(res?.status || 0);
  if (code === 401 || code === 403) return true;
  if (code === 0 || code >= 500) return false;
  const blob = `${res?.error || ""} ${JSON.stringify(res?.json || {})}`;
  return /invalid_grant|invalid refresh token|invalid_token|session not found/i.test(blob);
}

function isTransportFail(res) {
  const code = Number(res?.status || 0);
  if (code === 0 || code === 408 || code === 429 || code >= 500) return true;
  const blob = `${res?.error || ""}`;
  return /failed to fetch|networkerror|net::err|offline|timeout|aborted|could not reach|no response|internet disconnected|network changed/i.test(blob);
}

function isMissingTable(res) {
  const blob = `${res?.error || ""} ${JSON.stringify(res?.json || {})}`;
  if (/could not find the table|PGRST205|PGRST106/i.test(blob)) return true;
  const code = String(res?.json?.code || "");
  return (Number(res?.status) === 404 || Number(res?.status) === 406) && /^PGRST/i.test(code);
}

async function refreshIfNeeded(c) {
  const s = c.session;
  if (!s?.access_token || !s?.refresh_token) return { ok: false, error: "Not connected", ...c };
  const exp = Number(s.expires_at || 0);
  if (exp && exp * 1000 > Date.now() + 30000) return { ok: true, ...c };
  const res = await rest(`/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    url: c.url,
    key: c.key,
    token: s.access_token,
    body: { refresh_token: s.refresh_token },
  });
  if (!res.ok) {
    if (isDeadSession(res)) {
      noteDiag({ kind: "refresh", result: "dead", status: res.status, err: errFromBody(res.json, "dead session") });
      await remove([CLOUD_KEYS.session]);
      return { ok: false, error: "Cloud not connected", url: c.url, key: c.key, email: c.email, session: null };
    }
    noteDiag({ kind: "refresh", result: "network", status: res.status, err: errFromBody(res.json, "Network issue") });
    return { ok: false, error: errFromBody(res.json, "Network issue"), ...c };
  }
  const next = sessionFromAuth(res.json, s.dbReady, s.user_id);
  await writeSession(next);
  return { ok: true, ...c, session: next };
}

function sessionFromAuth(json, dbReady = false, userId = "") {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Number(json.expires_at || now + Number(json.expires_in || 3600)),
    user_id: json.user?.id || json.user_id || userId || "",
    dbReady: !!dbReady,
  };
}

async function probeTable(c, token) {
  const res = await rest(`/rest/v1/${TABLE}?select=updated_at&limit=1`, {
    url: c.url,
    key: c.key,
    token,
  });
  if (isTransportFail(res)) {
    return { ok: false, ready: null, network: true, error: "Network issue" };
  }
  if (isMissingTable(res)) {
    return {
      ok: false,
      ready: false,
      network: false,
      error: "Database not ready. Copy setup SQL, run it in Supabase, then Connect again.",
    };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, ready: null, network: false, auth: true, error: errFromBody(res.json, "Cloud not connected") };
  }
  if (!res.ok) {
    return { ok: false, ready: null, network: true, error: errFromBody(res.json, "Network issue") };
  }
  return { ok: true, ready: true, network: false, rows: Array.isArray(res.json) ? res.json : [] };
}

export async function cloudStatus() {
  const c = await creds();
  const info = cloudSyncInfo();
  const filled = !!(c.url && c.key && c.email);
  if (!filled) {
    return { heading: "Cloud not configured", label: "Not configured", on: false, canSync: false, connected: false, dbReady: false, tone: "off" };
  }
  if (!c.session?.access_token) {
    return { heading: "Cloud not connected", label: "Not connected", on: false, canSync: false, connected: false, dbReady: false, tone: "off" };
  }
  const live = info.status === "syncing";
  const failed = info.status === "error";
  if (live) {
    return { heading: "Connecting…", label: "Connecting…", on: true, canSync: false, connected: true, dbReady: !!c.session.dbReady, tone: "busy" };
  }
  if (failed) {
    return { heading: "Network issue", label: "Network issue", on: true, canSync: true, connected: true, dbReady: !!c.session.dbReady, tone: "err" };
  }
  if (!c.session.dbReady) {
    return { heading: "Cloud: Database not ready", label: "Database not ready", on: false, canSync: true, connected: true, dbReady: false, tone: "off" };
  }
  if (holdEstablished) {
    return { heading: "Cloud Link Established", label: "Link Established", on: true, canSync: true, connected: true, dbReady: true, tone: "on" };
  }
  return { heading: "Cloud connected", label: "Connected", on: true, canSync: true, connected: true, dbReady: true, tone: "on" };
}

export async function connectCloud({ url, key, email, password }) {
  const base = normalizeCloudUrl(url);
  if (!base) return { ok: false, error: "Use your https://xxxx.supabase.co Project URL" };
  const pub = String(key || "").trim();
  if (!pub || pub.toLowerCase().includes("service_role") || pub.startsWith("sb_secret_")) {
    return { ok: false, error: "Use the publishable (anon) key only" };
  }
  const mail = String(email || "").trim();
  const pass = String(password || "");
  if (!mail || !pass) return { ok: false, error: "Email and password required" };

  await set(CLOUD_KEYS.url, base);
  await set(CLOUD_KEYS.publishableKey, pub);
  await set(CLOUD_KEYS.email, mail);

  beginCloudWork();
  try {
    const auth = await rest(`/auth/v1/token?grant_type=password`, {
      method: "POST",
      url: base,
      key: pub,
      token: pub,
      body: { email: mail, password: pass },
    });
    if (!auth.ok) {
      const error = errFromBody(auth.json, "Could not connect");
      noteDiag({ kind: "connect", result: "auth-fail", status: auth.status, err: error });
      endCloudWork(false, error);
      emitCloudSync({ linked: false });
      return { ok: false, error };
    }

    const session = sessionFromAuth(auth.json, false, auth.json?.user?.id || auth.json?.user_id || "");
    const c = { url: base, key: pub, email: mail, session };
    const probe = await probeTable(c, session.access_token);
    if (probe.network) {
      noteDiag({ kind: "connect", result: "network", err: probe.error, hasSession: true, dbReady: false });
      await writeSession(session);
      endCloudWork(false, probe.error);
      emitCloudSync({ linked: true });
      return { ok: false, error: probe.error, session };
    }
    session.dbReady = !!probe.ready;
    await writeSession(session);
    if (!probe.ready) {
      noteDiag({ kind: "connect", result: "no-table", err: probe.error, hasSession: true, dbReady: false });
      endCloudWork(false, probe.error);
      emitCloudSync({ linked: false });
      return { ok: false, error: probe.error, session };
    }
    noteDiag({ kind: "connect", result: "ok", hasSession: true, dbReady: true });
    emitCloudSync({ linked: true });
    holdEstablished = true;
    endCloudWork(true);
    return { ok: true, message: "Cloud Link Established", session };
  } catch (e) {
    const error = String(e?.message || e || "Could not connect");
    noteDiag({ kind: "connect", result: "fail", err: error });
    endCloudWork(false, error);
    emitCloudSync({ linked: false });
    return { ok: false, error };
  }
}

export async function disconnectCloud() {
  cancelPendingCloudPush();
  const c = await creds();
  if (c.url && c.key && c.session?.access_token) {
    await rest(`/auth/v1/logout`, { method: "POST", url: c.url, key: c.key, token: c.session.access_token, body: {} });
  }
  await remove([CLOUD_KEYS.session, CLOUD_KEYS.bookAt]);
  noteDiag({ kind: "disconnect", result: "ok" });
  emitCloudSync({ status: "off", linked: false, error: "" });
  return { ok: true, message: "Disconnected" };
}

export async function deleteCloudDetails() {
  cancelPendingCloudPush();
  await remove([CLOUD_KEYS.url, CLOUD_KEYS.publishableKey, CLOUD_KEYS.email, CLOUD_KEYS.session, CLOUD_KEYS.bookAt]);
  noteDiag({ kind: "delete-details", result: "ok" });
  emitCloudSync({ status: "off", linked: false, error: "" });
  return { ok: true };
}

export { noteDiag, diagLogState, diagLogFileName } from "./diag.js";

export function copySetupSql() {
  return SETUP_SQL;
}

export async function copyDiagReport() {
  return formatDiagReport(cloudSyncInfo());
}

async function readRemote(c) {
  const live = await refreshIfNeeded(c);
  if (!live.ok) return live;
  const probe = await probeTable(live, live.session.access_token);
  if (probe.network) {
    return { ok: false, error: probe.error || "Network issue" };
  }
  if (probe.auth) {
    return { ok: false, error: probe.error || "Network issue" };
  }
  if (!probe.ready) {
    live.session.dbReady = false;
    await writeSession(live.session);
    return { ok: false, error: probe.error };
  }
  if (!live.session.dbReady) {
    live.session.dbReady = true;
    await writeSession(live.session);
  }
  const res = await rest(`/rest/v1/${TABLE}?select=book,updated_at`, {
    url: live.url,
    key: live.key,
    token: live.session.access_token,
  });
  if (!res.ok) return { ok: false, error: errFromBody(res.json, "Could not read cloud lists") };
  const row = Array.isArray(res.json) && res.json[0] ? res.json[0] : null;
  return { ok: true, row, session: live.session, url: live.url, key: live.key };
}

let pushRetryTimer = null;
let pushRetryDelay = 30000;
let pushRetryBook = null;

function isRetryableError(error) {
  return /network|fetch|offline|timeout|reach|internet disconnected|network changed/i.test(
    String(error || "")
  );
}

function armPushRetry(book) {
  pushRetryBook = book;
  if (pushRetryTimer) return;
  const delay = pushRetryDelay;
  pushRetryDelay = Math.min(pushRetryDelay * 2, 10 * 60 * 1000);
  pushRetryTimer = setTimeout(() => {
    pushRetryTimer = null;
    void pushCloudBook(pushRetryBook);
  }, delay);
}

function clearPushRetry() {
  if (pushRetryTimer) {
    clearTimeout(pushRetryTimer);
    pushRetryTimer = null;
  }
  pushRetryDelay = 30000;
  pushRetryBook = null;
}

async function freshestBook(fallback) {
  try {
    const stored = normalizeBook(await get(LIST_BOOK_KEY), { fallbackDefault: false });
    if (
      stored.lists.length &&
      bookFingerprint(stored) !== bookFingerprint(normalizeBook(fallback, { fallbackDefault: false }))
    ) {
      return stored;
    }
  } catch (_) {
    /* keep the scheduled copy */
  }
  return fallback;
}

export async function pushCloudBook(book) {
  const c = await creds();
  if (!c.session?.access_token) {
    cloudWorkSkippedOff();
    return { ok: true, skipped: true };
  }
  beginCloudWork();
  emitCloudSync({ linked: true });
  try {
    const live = await refreshIfNeeded(c);
    if (!live.ok) {
      if (isRetryableError(live.error)) armPushRetry(book);
      noteDiag({ kind: "push", result: "fail", err: live.error, hasSession: !!live.session?.access_token });
      endCloudWork(false, live.error);
      return live;
    }
    if (!live.session.dbReady) {
      const probe = await probeTable(live, live.session.access_token);
      if (probe.network || probe.auth) {
        if (probe.network) armPushRetry(book);
        noteDiag({ kind: "push", result: "fail", err: probe.error || "Network issue" });
        endCloudWork(false, probe.error || "Network issue");
        return { ok: false, error: probe.error || "Network issue" };
      }
      if (!probe.ready) {
        noteDiag({ kind: "push", result: "skip", err: "no-table" });
        endCloudWork(true);
        if (syncInflight === 0) emitCloudSync({ status: "off", linked: false, error: "" });
        return { ok: true, skipped: true };
      }
      live.session.dbReady = true;
      await writeSession(live.session);
    }
    const clean = normalizeBook(await freshestBook(book), { fallbackDefault: false });
    if (!clean.lists.length) {
      endCloudWork(false, "Nothing to sync");
      return { ok: false, error: "Nothing to sync" };
    }
    const updatedAt = new Date().toISOString();
    const res = await rest(`/rest/v1/${TABLE}`, {
      method: "POST",
      url: live.url,
      key: live.key,
      token: live.session.access_token,
      body: { user_id: live.session.user_id, book: clean, updated_at: updatedAt },
      extra: { Prefer: "return=minimal,resolution=merge-duplicates" },
    });
    if (!res.ok) {
      if (isTransportFail(res)) armPushRetry(book);
      const error = errFromBody(res.json, "Could not save to cloud");
      noteDiag({ kind: "push", result: "fail", status: res.status, err: error });
      endCloudWork(false, error);
      return { ok: false, error };
    }
    clearPushRetry();
    await set(CLOUD_KEYS.bookAt, updatedAt);
    emitCloudSync({ linked: true });
    endCloudWork(true);
    noteDiag({ kind: "push", result: "ok" });
    return { ok: true };
  } catch (e) {
    armPushRetry(book);
    const error = String(e?.message || e || "Could not save to cloud");
    noteDiag({ kind: "push", result: "fail", err: error });
    endCloudWork(false, error);
    return { ok: false, error };
  }
}

export async function pullCloudBook(localBook) {
  const c = await creds();
  if (!c.session?.access_token) {
    cloudWorkSkippedOff();
    return { ok: true, book: localBook, skipped: true };
  }
  beginCloudWork();
  emitCloudSync({ linked: true });
  try {
    const remote = await readRemote(c);
    if (!remote.ok) {
      noteDiag({ kind: "pull", result: "fail", err: remote.error });
      endCloudWork(false, remote.error);
      return remote.skipped ? { ok: true, book: localBook } : remote;
    }
    if (!remote.row?.book) {
      noteDiag({ kind: "pull", result: "empty" });
      const pushed = await pushCloudBook(localBook);
      endCloudWork(pushed.ok, pushed.error);
      return pushed.ok ? { ok: true, book: localBook } : pushed;
    }
    const localAt = String((await get(CLOUD_KEYS.bookAt)) || "");
    const remoteAt = String(remote.row.updated_at || "");
    if (remoteBookIsLocal(remote.row.book, localBook)) {
      if (remoteAt && remoteAt !== localAt) await set(CLOUD_KEYS.bookAt, remoteAt);
      noteDiag({ kind: "pull", result: "same" });
      endCloudWork(true);
      return { ok: true, book: localBook };
    }
    if (localAt && remoteAt && localAt >= remoteAt) {
      noteDiag({ kind: "pull", result: "keep" });
      endCloudWork(true);
      return { ok: true, book: localBook };
    }
    const next = await saveBook(normalizeBook(remote.row.book, { fallbackDefault: false }));
    await set(CLOUD_KEYS.bookAt, remoteAt);
    endCloudWork(true);
    noteDiag({ kind: "pull", result: "applied" });
    return { ok: true, book: next, pulled: true };
  } catch (e) {
    const error = String(e?.message || e || "Could not read cloud lists");
    noteDiag({ kind: "pull", result: "fail", err: error });
    endCloudWork(false, error);
    return { ok: false, error, book: localBook };
  }
}

function remoteBookIsLocal(remoteRaw, localBook) {
  try {
    const remoteBook = normalizeBook(remoteRaw, { fallbackDefault: false });
    if (!remoteBook.lists.length) return false;
    const localNorm = normalizeBook(localBook, { fallbackDefault: false });
    return bookFingerprint(localNorm) === bookFingerprint(remoteBook);
  } catch (_) {
    return false;
  }
}

let pushTimer = null;
export function scheduleCloudPush(book) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushCloudBook(book);
  }, 2000);
}

export function cancelPendingCloudPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  clearPushRetry();
  if (syncInflight === 0 && syncInfo.linked && syncInfo.status === "pending") {
    emitCloudSync({ status: "idle", error: "" });
  }
}

export const CLOUD_SYNC_STALE_MS = 7 * 24 * 60 * 60 * 1000;

export function cloudSyncNeedsChoice(bookAt) {
  const at = String(bookAt || "");
  if (!at) return true;
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return true;
  return Date.now() - t >= CLOUD_SYNC_STALE_MS;
}

/** First Connect / long gap: ask. Otherwise last-write-wins pull. */
export async function resolveCloudOnConnect(localBook, pick) {
  cancelPendingCloudPush();
  const c = await creds();
  if (!c.session?.access_token) return { ok: true, book: localBook, skipped: true };
  const remote = await readRemote(c);
  if (!remote.ok) {
    holdEstablished = false;
    emitCloudSync({ status: "error", linked: true, error: String(remote.error || "Network issue") });
    return remote.skipped ? { ok: true, book: localBook } : remote;
  }
  if (!remote.row?.book) {
    const pushed = await pushCloudBook(localBook);
    return pushed.ok ? { ok: true, book: localBook } : pushed;
  }
  const localAt = String((await get(CLOUD_KEYS.bookAt)) || "");
  const remoteBook = normalizeBook(remote.row.book, { fallbackDefault: false });
  const localNorm = normalizeBook(localBook, { fallbackDefault: false });
  if (bookFingerprint(localNorm) === bookFingerprint(remoteBook)) {
    await set(CLOUD_KEYS.bookAt, String(remote.row.updated_at || ""));
    return { ok: true, book: localNorm };
  }
  if (!cloudSyncNeedsChoice(localAt)) {
    return pullCloudBook(localBook);
  }
  const choice = await pick();
  noteDiag({ kind: "choice", choice: String(choice || "cancel") });
  if (choice === "cloud") {
    const next = await saveBook(remoteBook);
    await set(CLOUD_KEYS.bookAt, String(remote.row.updated_at || ""));
    return { ok: true, book: next, pulled: true };
  }
  if (choice === "local") {
    const pushed = await pushCloudBook(localNorm);
    return pushed.ok ? { ok: true, book: localNorm } : pushed;
  }
  if (choice === "both") {
    const merged = mergeKeepBoth(localNorm, remoteBook);
    noteDiag({
      kind: "merge",
      skippedLists: merged.skippedLists,
      skippedStocks: merged.skippedStocks,
    });
    const next = await saveBook(merged.book);
    const pushed = await pushCloudBook(next);
    if (!pushed.ok) return { ...pushed, book: next };
    return {
      ok: true,
      book: next,
      skippedStocks: merged.skippedStocks,
      skippedLists: merged.skippedLists,
    };
  }
  return { ok: true, book: localBook };
}
