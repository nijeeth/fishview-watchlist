(function () {
  if (window.self !== window.top) return;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === "FV_CHANGE_SYMBOL") {
      import(chrome.runtime.getURL("sites/charts/index.js"))
        .then(({ changeListing }) => {
          changeListing(msg.exchange, msg.ticker);
          sendResponse({ ok: true });
        })
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
  });

  import(chrome.runtime.getURL("shell/site-gate.js")).then(async ({ panelAllowedHere }) => {
    const { mountPanel, unmountPanel } = await import(chrome.runtime.getURL("shell/mount.js"));

    async function sync() {
      if (await panelAllowedHere()) await mountPanel();
      else unmountPanel();
    }

    await sync();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (
        changes.fvPanelOnTradingView ||
        changes.fvPanelOnScreener ||
        changes.fvPanelOnChartink ||
        changes.fvPanelOnFishRs
      ) {
        sync();
      }
    });
  }).catch((e) => console.error("[FishView] boot failed", e));
})();
