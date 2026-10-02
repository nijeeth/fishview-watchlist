import { get, set, CLOUD_KEYS, DIAG_KEY } from "../persist/index.js";

const DIAG_CAP = 500;

let writeChain = Promise.resolve();

function redact(raw) {
  return String(raw || "")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9._-]+/g, "[token]")
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_]+/gi, "[key]")
    .replace(/Bearer\s+\S+/gi, "Bearer [token]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/https:\/\/[a-z0-9-]+\.supabase\.co/gi, "https://[project].supabase.co")
    .slice(0, 160);
}

function slimPath(path) {
  return String(path || "").split("?")[0].slice(0, 80);
}

function slimEvent(event) {
  const row = { t: new Date().toISOString(), kind: String(event.kind || "note") };
  if (event.result != null) row.result = String(event.result).slice(0, 40);
  if (event.method) row.method = String(event.method).slice(0, 8);
  if (event.path) row.path = slimPath(event.path);
  if (event.status != null) row.status = Number(event.status) || 0;
  if (event.ok != null) row.ok = !!event.ok;
  if (event.err) row.err = redact(event.err);
  if (event.dbReady != null) row.dbReady = !!event.dbReady;
  if (event.hasSession != null) row.hasSession = !!event.hasSession;
  if (event.choice) row.choice = String(event.choice).slice(0, 12);
  if (event.skippedLists != null) row.skippedLists = Number(event.skippedLists) || 0;
  if (event.skippedStocks != null) row.skippedStocks = Number(event.skippedStocks) || 0;
  return row;
}

export function noteDiag(event) {
  writeChain = writeChain
    .then(async () => {
      const prev = (await get(DIAG_KEY)) || {};
      const events = Array.isArray(prev.events) ? prev.events.slice() : [];
      events.push(slimEvent(event));
      await set(DIAG_KEY, { events: events.slice(-DIAG_CAP) });
    })
    .catch(() => {});
}

export async function diagLogState() {
  await writeChain.catch(() => {});
  const prev = (await get(DIAG_KEY)) || {};
  const events = Array.isArray(prev.events) ? prev.events : [];
  const url = String((await get(CLOUD_KEYS.url)) || "").trim();
  const key = String((await get(CLOUD_KEYS.publishableKey)) || "").trim();
  const email = String((await get(CLOUD_KEYS.email)) || "").trim();
  return {
    configured: !!(url && key && email),
    hasEvents: events.length > 0,
  };
}

export function diagLogFileName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `fv-cloud-log-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.txt`;
}

export async function formatDiagReport(info = {}) {
  await writeChain.catch(() => {});
  const prev = (await get(DIAG_KEY)) || {};
  const events = Array.isArray(prev.events) ? prev.events : [];
  const url = String((await get(CLOUD_KEYS.url)) || "");
  let host = "";
  try {
    host = url ? new URL(url).hostname : "";
  } catch {
    host = "";
  }
  const email = String((await get(CLOUD_KEYS.email)) || "");
  const session = (await get(CLOUD_KEYS.session)) || null;
  const bookAt = String((await get(CLOUD_KEYS.bookAt)) || "");
  const infoStatus = info.status || "-";
  const infoLinked = info.linked ? 1 : 0;
  const infoErr = redact(info.error) || "-";
  let version = "";
  try {
    version = chrome.runtime.getManifest()?.version || "";
  } catch {
    version = "";
  }
  const lines = [
    "FishView Watchlist log (this computer only; no lists or stocks)",
    `version ${version}`,
    `saved ${new Date().toISOString()}`,
    `hasUrl ${url ? 1 : 0} host ${host || "-"}`,
    `hasKey ${(await get(CLOUD_KEYS.publishableKey)) ? 1 : 0} hasEmail ${email ? 1 : 0}`,
    `hasSession ${session?.access_token ? 1 : 0} dbReady ${session?.dbReady ? 1 : 0}`,
    `bookAt ${bookAt ? 1 : 0} sync ${infoStatus} linked ${infoLinked}`,
    `lastErr ${infoErr}`,
    "---",
  ];
  if (!events.length) lines.push("(empty)");
  for (const e of events) {
    const bits = [e.t, e.kind];
    if (e.result) bits.push(e.result);
    if (e.method) bits.push(e.method);
    if (e.path) bits.push(e.path);
    if (e.status != null) bits.push(`status=${e.status}`);
    if (e.ok != null) bits.push(`ok=${e.ok ? 1 : 0}`);
    if (e.choice) bits.push(`choice=${e.choice}`);
    if (e.hasSession != null) bits.push(`session=${e.hasSession ? 1 : 0}`);
    if (e.dbReady != null) bits.push(`dbReady=${e.dbReady ? 1 : 0}`);
    if (e.skippedLists) bits.push(`skipLists=${e.skippedLists}`);
    if (e.skippedStocks) bits.push(`skipStocks=${e.skippedStocks}`);
    if (e.err) bits.push(e.err);
    lines.push(bits.join(" "));
  }
  return `${lines.join("\n")}\n`;
}
