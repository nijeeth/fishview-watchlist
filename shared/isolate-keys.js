const KEY_EVENTS = ["keydown", "keyup", "keypress"];
const CLIP_EVENTS = ["paste", "copy", "cut"];

const stop = (e) => {
  if (e.key === "Escape") return;
  e.stopImmediatePropagation();
};

/** Keep TradingView from treating dock typing as chart search. */
export function isolateElement(el, wired) {
  if (!el || (wired && wired.has(el))) return;
  wired?.add(el);
  for (const evt of KEY_EVENTS) {
    el.addEventListener(evt, stop, true);
    el.addEventListener(evt, stop, false);
  }
  for (const evt of CLIP_EVENTS) {
    el.addEventListener(evt, stop, true);
    el.addEventListener(evt, stop, false);
  }
  el.addEventListener("mousedown", (e) => e.stopPropagation(), true);
}

export function isolateKeys(host) {
  if (!host) return () => {};
  const wired = new WeakSet();
  const wire = (el) => isolateElement(el, wired);
  const wireAll = (root) => {
    if (!root?.querySelectorAll) return;
    root.querySelectorAll("input, textarea, select, [contenteditable='true']").forEach(wire);
  };
  wireAll(host);
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.matches?.("input, textarea, select, [contenteditable='true']")) wire(n);
        wireAll(n);
      });
    }
  });
  observer.observe(host, { childList: true, subtree: true });
  return () => observer.disconnect();
}
