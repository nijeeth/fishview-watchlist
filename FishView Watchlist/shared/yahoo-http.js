export function yahooGet(url) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "FV_YAHOO_JSON", url }, (res) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, status: 0 });
          return;
        }
        resolve(res || { ok: false, status: 0 });
      });
    } catch (_) {
      resolve({ ok: false, status: 0 });
    }
  });
}
