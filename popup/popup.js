import { get, set, SITE_PANEL } from "../persist/index.js";

const map = [
  ["tv", SITE_PANEL.tradingview],
  ["screener", SITE_PANEL.screener],
  ["chartink", SITE_PANEL.chartink],
  ["fishrs", SITE_PANEL.fishrs],
];

for (const [id, key] of map) {
  const el = document.getElementById(id);
  el.checked = (await get(key)) !== false;
  el.addEventListener("change", () => set(key, el.checked));
}
