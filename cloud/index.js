import { get, set, remove, CLOUD_KEYS } from "../persist/index.js";
import { normalizeBook, saveBook } from "../lists/book.js";
import { SETUP_SQL } from "./sql.js";
import { notBuilt } from "../shared/placeholder.js";

export function placeholderMessage() {
  return notBuilt(7);
}

export { SETUP_SQL };

const TABLE = "fv_list_book";

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
  return cloudHttp({
    url: `${url}${path}`,
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
}

async function writeSession(session) {
  await set(CLOUD_KEYS.session, session);
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
    await remove([CLOUD_KEYS.session]);
    return { ok: false, error: errFromBody(res.json, "Session expired. Connect again."), url: c.url, key: c.key, email: c.email, session: null };
  }
  const next = sessionFromAuth(res.json, s.dbReady);
  await writeSession(next);
  return { ok: true, ...c, session: next };
}

function sessionFromAuth(json, dbReady = false) {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: Number(json.expires_at || now + Number(json.expires_in || 3600)),
    user_id: json.user?.id || json.user_id || "",
    dbReady: !!dbReady,
  };
}

async function probeTable(c, token) {
  const res = await rest(`/rest/v1/${TABLE}?select=updated_at&limit=1`, {
    url: c.url,
    key: c.key,
    token,
  });
  const blob = `${res.error || ""} ${JSON.stringify(res.json || {})}`;
  if (res.status === 404 || res.status === 406 || /could not find the table|schema cache|PGRST205|PGRST106/i.test(blob)) {
    return { ok: false, ready: false, error: "Database not ready. Copy setup SQL, run it in Supabase, then Connect again." };
  }
  if (!res.ok && res.status !== 200) {
    return { ok: false, ready: false, error: errFromBody(res.json, "Could not check the database") };
  }
  return { ok: true, ready: true, rows: Array.isArray(res.json) ? res.json : [] };
}

export async function cloudStatus() {
  const c = await creds();
  if (!c.session?.access_token) {
    return { on: false, label: "Cloud: Not configured", heading: "Cloud not configured", connected: false, dbReady: false };
  }
  if (!c.session.dbReady) {
    return { on: false, label: "Cloud: Database not ready", heading: "Connected — run setup SQL, then Connect again", connected: true, dbReady: false };
  }
  return { on: true, label: "Cloud Link Established...", heading: "Cloud Link Established...", connected: true, dbReady: true };
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

  const auth = await rest(`/auth/v1/token?grant_type=password`, {
    method: "POST",
    url: base,
    key: pub,
    token: pub,
    body: { email: mail, password: pass },
  });
  if (!auth.ok) return { ok: false, error: errFromBody(auth.json, "Could not connect") };

  const session = sessionFromAuth(auth.json, false);
  const c = { url: base, key: pub, email: mail, session };
  const probe = await probeTable(c, session.access_token);
  session.dbReady = probe.ready;
  await writeSession(session);
  if (!probe.ready) return { ok: false, error: probe.error, session };
  return { ok: true, message: "Cloud connected", session };
}

export async function disconnectCloud() {
  const c = await creds();
  if (c.url && c.key && c.session?.access_token) {
    await rest(`/auth/v1/logout`, { method: "POST", url: c.url, key: c.key, token: c.session.access_token, body: {} });
  }
  await remove([CLOUD_KEYS.session, CLOUD_KEYS.bookAt]);
  return { ok: true, message: "Disconnected" };
}

export async function deleteCloudDetails() {
  await remove([CLOUD_KEYS.url, CLOUD_KEYS.publishableKey, CLOUD_KEYS.email, CLOUD_KEYS.session, CLOUD_KEYS.bookAt]);
  return { ok: true };
}

export function copySetupSql() {
  return SETUP_SQL;
}

async function readRemote(c) {
  const live = await refreshIfNeeded(c);
  if (!live.ok) return live;
  const probe = await probeTable(live, live.session.access_token);
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

export async function pushCloudBook(book) {
  const c = await creds();
  if (!c.session?.access_token) return { ok: true, skipped: true };
  const live = await refreshIfNeeded(c);
  if (!live.ok) return live;
  if (!live.session.dbReady) return { ok: true, skipped: true };
  const clean = normalizeBook(book, { fallbackDefault: false });
  if (!clean.lists.length) return { ok: false, error: "Nothing to sync" };
  const updatedAt = new Date().toISOString();
  const res = await rest(`/rest/v1/${TABLE}`, {
    method: "POST",
    url: live.url,
    key: live.key,
    token: live.session.access_token,
    body: { user_id: live.session.user_id, book: clean, updated_at: updatedAt },
    extra: { Prefer: "return=minimal,resolution=merge-duplicates" },
  });
  if (!res.ok) return { ok: false, error: errFromBody(res.json, "Could not save to cloud") };
  await set(CLOUD_KEYS.bookAt, updatedAt);
  return { ok: true };
}

export async function pullCloudBook(localBook) {
  const c = await creds();
  if (!c.session?.access_token) return { ok: true, book: localBook, skipped: true };
  const remote = await readRemote(c);
  if (!remote.ok) return remote.skipped ? { ok: true, book: localBook } : remote;
  if (!remote.row?.book) {
    const pushed = await pushCloudBook(localBook);
    return pushed.ok ? { ok: true, book: localBook } : pushed;
  }
  const localAt = String((await get(CLOUD_KEYS.bookAt)) || "");
  const remoteAt = String(remote.row.updated_at || "");
  if (localAt && remoteAt && localAt >= remoteAt) return { ok: true, book: localBook };
  const next = await saveBook(normalizeBook(remote.row.book, { fallbackDefault: false }));
  await set(CLOUD_KEYS.bookAt, remoteAt);
  return { ok: true, book: next, pulled: true };
}

let pushTimer = null;
export function scheduleCloudPush(book) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushCloudBook(book);
  }, 2000);
}
