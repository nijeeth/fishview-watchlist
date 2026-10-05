export const DOCK_TV_W = 350;
export const DOCK_WEB_W = 200;
export const DOCK_TV_MIN = 220;
export const DOCK_TV_MAX = 420;
export const DOCK_WEB_MIN = 180;
export const DOCK_WEB_MAX = 280;
export const DOCK_HEADER_H = 36;
export const DOCK_MIN_BAR_H = 28;

export function hostKind(hostname = location.hostname) {
  const h = String(hostname).toLowerCase();
  if (h.includes("tradingview.com")) return "tv";
  if (h.includes("screener.in")) return "screener";
  if (h.includes("chartink.com")) return "chartink";
  if (h.includes("fish-rs-board")) return "fishrs";
  return "other";
}

export function isCompactHost(kind = hostKind()) {
  return kind === "screener" || kind === "chartink" || kind === "fishrs";
}

export function dockMinW(kind = hostKind()) {
  return isCompactHost(kind) ? DOCK_WEB_MIN : DOCK_TV_MIN;
}

export function dockMaxW(kind = hostKind()) {
  return isCompactHost(kind) ? DOCK_WEB_MAX : DOCK_TV_MAX;
}

export function dockDefaultW(kind = hostKind()) {
  return isCompactHost(kind) ? DOCK_WEB_W : DOCK_TV_W;
}

export function clampDockWidth(n, kind = hostKind()) {
  const fallback = dockDefaultW(kind);
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(dockMaxW(kind), Math.max(dockMinW(kind), Math.round(v)));
}

export function displayDockWidth(stored, kind = hostKind()) {
  return clampDockWidth(stored, kind);
}

function resetSitePush() {
  document.documentElement.classList.remove("fv-panel-open", "fv-tv-docked");
  if (document.body) document.body.classList.remove("fv-tv-docked");
  document.documentElement.style.removeProperty("--fv-dock-w");
  document.body.style.removeProperty("width");
  document.body.style.removeProperty("max-width");
  document.body.style.removeProperty("min-width");
  document.body.style.removeProperty("transform");
  document.body.style.removeProperty("box-sizing");
  document.body.style.marginRight = "";
  document.documentElement.style.marginRight = "";
  document.documentElement.style.removeProperty("width");
  document.documentElement.style.removeProperty("overflow-x");
}

export function applyPageLayout(storedPx) {
  const kind = hostKind();
  resetSitePush();
  const width = storedPx > 0 ? displayDockWidth(storedPx, kind) : 0;
  if (width <= 0) {
    window.dispatchEvent(new Event("resize"));
    return 0;
  }

  if (kind === "tv") {
    document.documentElement.style.setProperty("--fv-dock-w", `${width}px`);
    document.documentElement.classList.add("fv-tv-docked");
    if (document.body) document.body.classList.add("fv-tv-docked");
    window.dispatchEvent(new Event("resize"));
    return width;
  }

  document.body.style.marginRight = `${width}px`;
  if (kind === "screener") {
    document.documentElement.classList.add("fv-panel-open");
  }
  window.dispatchEvent(new Event("resize"));
  return width;
}

export function clearPageLayout() {
  applyPageLayout(0);
}
