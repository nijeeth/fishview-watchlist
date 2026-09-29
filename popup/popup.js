import { get, set, SITE_PANEL, MINIMIZED_KEY } from "../persist/index.js";

await set(MINIMIZED_KEY, false);

const map = [
  ["tv", SITE_PANEL.tradingview],
  ["screener", SITE_PANEL.screener],
  ["chartink", SITE_PANEL.chartink],
];

for (const [id, key] of map) {
  const el = document.getElementById(id);
  el.checked = (await get(key)) !== false;
  el.addEventListener("change", () => set(key, el.checked));
}
