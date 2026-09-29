export function watchTablePlus({ matchHref, tickerFromHref }) {
  const decorate = () => {
    const rows = document.querySelectorAll("table tbody tr");
    for (const tr of rows) {
      if (tr.querySelector(".fv-plus")) continue;
      const a = [...tr.querySelectorAll("a[href]")].find((el) => matchHref(el.getAttribute("href") || ""));
      if (!a) continue;
      const ticker = tickerFromHref(a.href);
      if (!ticker) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "fv-plus";
      btn.textContent = "+";
      btn.title = "Add to FishView list";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.dispatchEvent(
          new CustomEvent("fv_page_plus", { detail: { ticker: String(ticker).toUpperCase() } })
        );
      });
      a.parentElement.insertBefore(btn, a);
    }
  };

  decorate();
  const obs = new MutationObserver(() => decorate());
  obs.observe(document.body, { childList: true, subtree: true });
  return () => obs.disconnect();
}
