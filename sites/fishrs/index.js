/**
 * Fish RS Board (fish-rs-board.pages.dev). Rows carry data-sym="TICKER" (NSE).
 * Scan reads those rows; a "+" is inserted next to the symbol cell.
 */

export function collectFishRsTickers() {
  const seen = new Set();
  const tickers = [];
  for (const tr of document.querySelectorAll("tr[data-sym]")) {
    const t = String(tr.dataset.sym || "").trim().toUpperCase();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    tickers.push(t);
  }
  return tickers;
}

export function startFishRsPlus() {
  const decorate = () => {
    for (const tr of document.querySelectorAll("tr[data-sym]")) {
      if (tr.querySelector(".fv-plus")) continue;
      const ticker = String(tr.dataset.sym || "").trim().toUpperCase();
      if (!ticker) continue;
      const cell = tr.querySelector("td.sym");
      if (!cell) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fv-plus";
      btn.textContent = "+";
      btn.title = "Add to FishView list";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.dispatchEvent(
          new CustomEvent("fv_page_plus", { detail: { ticker } })
        );
      });
      cell.insertBefore(btn, cell.firstChild);
    }
  };
  let timer = null;
  const debounced = () => {
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      decorate();
    }, 150);
  };
  decorate();
  const obs = new MutationObserver(debounced);
  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}
