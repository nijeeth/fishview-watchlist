/**
 * Local save/load. Adapted from Chart Funda shared/storage.js (same author).
 * List data uses LIST_BOOK_KEY; do not store Cloud passwords.
 */

export const LIST_BOOK_KEY = "fvListBook";
export const THEME_KEY = "fvTheme";
export const WIDTH_KEY = "fvPanelWidth";
export const WIDTH_TV_KEY = "fvPanelWidthTv";
export const WIDTH_WEB_KEY = "fvPanelWidthWeb";
export const MINIMIZED_KEY = "fvDockMinimized";
export const MINIMIZED_TV_KEY = "fvDockMinimizedTv";
export const MINIMIZED_WEB_KEY = "fvDockMinimizedWeb";
export const DIAG_KEY = "fvDiagLog";
export const CLOUD_KEYS = {
  url: "fvCloudUrl",
  publishableKey: "fvCloudPublishableKey",
  email: "fvCloudEmail",
  session: "fvCloudSession",
  bookAt: "fvCloudBookAt",
};

export const SITE_PANEL = {
  tradingview: "fvPanelOnTradingView",
  screener: "fvPanelOnScreener",
  chartink: "fvPanelOnChartink",
  fishrs: "fvPanelOnFishRs",
};

const DEFAULTS = {
  [THEME_KEY]: "dark",
  [WIDTH_KEY]: 240,
  [WIDTH_TV_KEY]: 350,
  [WIDTH_WEB_KEY]: 200,
  [MINIMIZED_KEY]: false,
  [MINIMIZED_TV_KEY]: false,
  [MINIMIZED_WEB_KEY]: false,
  [SITE_PANEL.tradingview]: true,
  [SITE_PANEL.screener]: true,
  [SITE_PANEL.chartink]: true,
  [SITE_PANEL.fishrs]: true,
};

export async function get(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      if (result[key] === undefined) resolve(DEFAULTS[key]);
      else resolve(result[key]);
    });
  });
}

export async function set(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

export async function getMany(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      const out = {};
      for (const key of keys) {
        out[key] = result[key] === undefined ? DEFAULTS[key] : result[key];
      }
      resolve(out);
    });
  });
}

export async function remove(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, resolve);
  });
}
