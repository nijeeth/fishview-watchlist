export function yahooGet(url, force) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: "FV_YAHOO_JSON", url, force: !!force }, (res) => {
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
