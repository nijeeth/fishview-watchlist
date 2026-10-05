(function () {
  // Chart switch + read current. Logic from Chart Funda page-bridge.js (same author).
  // Events are fv_* so Chart Funda (tvf_*) can stay installed beside this extension.

  function getChart(api) {
    try {
      if (api.activeChart) return api.activeChart();
      if (api.chart) return api.chart();
    } catch (err) {}
    return null;
  }

  function splitPrefixed(full) {
    const s = String(full || "");
    const i = s.indexOf(":");
    if (i < 1) return { exchange: "", ticker: s };
    return { exchange: s.slice(0, i), ticker: s.slice(i + 1) };
  }

  // Cboe One / BATS / *_DLY are the delayed chart feed, not the listing to store or switch.
  // Live dumps: exchange "Cboe One", full_name "BATS:MSFT", pro_name "NASDAQ:MSFT".
  function listingFromParts(exchange, ticker) {
    let ex = String(exchange || "").toUpperCase();
    const t = String(ticker || "");
    if (ex.endsWith("_DLY")) ex = ex.slice(0, -4);
    if (/^(BATS|CBOE|CBOEONE)$/.test(ex)) return { ticker: t, exchange: "" };
    return { ticker: t, exchange: ex };
  }

  function readSymbol(info) {
    if (!info) return { ticker: "", exchange: "" };
    if (typeof info === "string") {
      const parts = splitPrefixed(info);
      return listingFromParts(parts.exchange, parts.ticker);
    }
    const pro = String(info.pro_name || "");
    if (pro.includes(":")) {
      const parts = splitPrefixed(pro);
      return listingFromParts(parts.exchange, parts.ticker);
    }
    const ticker = String(info.symbol || "");
    const exchange = String(info.exchange || info.listed_exchange || "");
    return listingFromParts(exchange, ticker);
  }

  function symbolMatches(info, bare, exchange) {
    const read = readSymbol(info);
    return (
      read.ticker.toUpperCase() === bare.toUpperCase() &&
      read.exchange.toUpperCase() === exchange.toUpperCase()
    );
  }

  function applySymbol(api, chart, full) {
    let interval = "D";
    try {
      if (api.getSymbolInterval) interval = api.getSymbolInterval().interval || "D";
    } catch (err) {}
    try {
      if (api.changeSymbol) api.changeSymbol(full, interval);
    } catch (err) {}
    const charts = [];
    try {
      if (chart) charts.push(chart);
    } catch (err) {}
    try {
      if (api.activeChart) charts.push(api.activeChart());
    } catch (err) {}
    try {
      if (api.chart) charts.push(api.chart());
    } catch (err) {}
    for (const ch of charts) {
      if (!ch || !ch.setSymbol) continue;
      try {
        ch.setSymbol(full);
      } catch (err) {}
    }
  }

  function waitForSymbol(chart, bare, exchange, timeoutMs) {
    return new Promise((resolve) => {
      let settled = false;
      let bus = null;
      let poller = null;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        try {
          if (bus && bus.unsubscribe) bus.unsubscribe(null, handler);
        } catch (err) {}
        if (poller) clearInterval(poller);
        resolve(ok);
      };
      const extMatches = () => {
        try {
          const ext = chart.symbolExt && chart.symbolExt();
          return symbolMatches(ext, bare, exchange);
        } catch (err) {
          return false;
        }
      };
      const handler = (info) => {
        if (!symbolMatches(info, bare, exchange)) return;
        finish(true);
      };
      try {
        bus = chart.onSymbolChanged && chart.onSymbolChanged();
        if (bus && bus.subscribe) bus.subscribe(null, handler);
      } catch (err) {}
      // Chart can settle after onSymbolChanged fires; poll until timeout.
      poller = setInterval(() => {
        if (extMatches()) finish(true);
      }, 250);
      setTimeout(() => finish(extMatches()), timeoutMs);
    });
  }

  function symbolMissingOnPage() {
    try {
      const text = document.body && document.body.innerText;
      return /This symbol doesn['’]t exist/i.test(String(text || ""));
    } catch (err) {
      return false;
    }
  }

  document.addEventListener("fv_open_chart", function (event) {
    const bare = event.detail && event.detail.symbol;
    const api = window.TradingViewApi || window.TradingView;
    const reply = (detail) => {
      document.dispatchEvent(new CustomEvent("fv_open_chart_result", { detail }));
    };
    if (!bare || !api) {
      reply({ ok: false });
      return;
    }
    const chart = getChart(api);
    if (!chart) {
      reply({ ok: false });
      return;
    }

    (async () => {
      for (const exchange of ["NSE", "BSE"]) {
        try {
          const ext = chart.symbolExt && chart.symbolExt();
          if (symbolMatches(ext, bare, exchange)) {
            reply({ ok: true, ticker: bare, exchange });
            return;
          }
        } catch (err) {}
        const pending = waitForSymbol(chart, bare, exchange, 4000);
        try {
          applySymbol(api, chart, exchange + ":" + bare);
        } catch (err) {
          continue;
        }
        const opened = await pending;
        if (opened) {
          reply({ ok: true, ticker: bare, exchange });
          return;
        }
      }
      reply({ ok: false, ticker: bare });
    })();
  });

  document.addEventListener("fv_change_symbol", function (event) {
    const { symbol, exchange, full } = event.detail || {};
    const tvApi = window.TradingViewApi || window.TradingView;
    if (!tvApi) return;
    try {
      const chart = getChart(tvApi);
      const fullSymbol = full || (exchange ? `${exchange}:${symbol}` : symbol);
      if (!fullSymbol) return;
      applySymbol(tvApi, chart, fullSymbol);
    } catch (err) {
      console.error("[FishView] chart change failed:", err);
    }
  });

  document.addEventListener("fv_request_symbol", function () {
    const api = window.TradingViewApi || window.TradingView;
    let ticker = "";
    let exchange = "";
    try {
      const c =
        api && api.activeChart ? api.activeChart() : api && api.chart ? api.chart() : null;
      if (c && c.symbolExt) {
        const read = readSymbol(c.symbolExt());
        ticker = read.ticker;
        exchange = read.exchange;
      }
      if (!ticker || !exchange) {
        try {
          const full = api && api.getSymbolInterval && api.getSymbolInterval().symbol;
          const read = readSymbol(full);
          if (!ticker) ticker = read.ticker;
          if (!exchange) exchange = read.exchange;
        } catch (err) {}
      }
      if (!ticker || !exchange) {
        const full = c && c.symbol && c.symbol();
        const read = readSymbol(full);
        if (!ticker) ticker = read.ticker;
        if (!exchange) exchange = read.exchange;
      }
      if (!ticker || !exchange) {
        try {
          const q = new URL(location.href).searchParams.get("symbol") || "";
          const read = readSymbol(decodeURIComponent(q));
          if (!ticker) ticker = read.ticker;
          if (!exchange) exchange = read.exchange;
        } catch (err) {}
      }
      if (String(ticker).includes(":")) {
        const read = readSymbol(ticker);
        ticker = read.ticker;
        if (!exchange) exchange = read.exchange;
      }
    } catch (err) {
      console.error("[FishView] symbol read failed:", err);
    }
    document.dispatchEvent(
      new CustomEvent("fv_symbol_response", {
        detail: { ticker, exchange, missing: symbolMissingOnPage() },
      })
    );
  });
})();
