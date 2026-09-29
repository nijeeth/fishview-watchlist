import { notBuilt } from "../../shared/placeholder.js";
import { phaseLive } from "../../config/phase.js";

export function placeholderMessage() {
  return notBuilt(3);
}

export function changeListing(exchange, ticker) {
  if (!phaseLive(3)) return { error: placeholderMessage() };
  const ex = String(exchange || "").trim();
  const sym = String(ticker || "").trim();
  const full = ex ? `${ex}:${sym}` : sym;
  document.dispatchEvent(
    new CustomEvent("fv_change_symbol", { detail: { symbol: sym, exchange: ex, full } })
  );
  return { ok: true };
}

export function askCurrentListing() {
  return new Promise((resolve) => {
    if (!phaseLive(3)) {
      resolve(null);
      return;
    }
    const on = (e) => {
      document.removeEventListener("fv_symbol_response", on);
      resolve(e.detail || null);
    };
    document.addEventListener("fv_symbol_response", on, { once: true });
    document.dispatchEvent(new CustomEvent("fv_request_symbol"));
    setTimeout(() => {
      document.removeEventListener("fv_symbol_response", on);
      resolve(null);
    }, 1500);
  });
}
