import { LIST_CAP, LABEL_COLOR, LABELS, labelTitle } from "./book.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function selTopHtml(count, backAct) {
  return `<div class="fv-sel-top">
    <button type="button" class="fv-sel-back" data-sel="${esc(backAct)}">Back</button>
    <span class="fv-sel-count">${esc(count)}</span>
  </div>`;
}

export function selectBarHtml({ n, view, confirm, destLists, canCreate }) {
  const count = `${n} selected`;
  if (view === "confirm" && confirm) {
    const danger = confirm.kind === "delete";
    return `<div class="fv-sel-bar ${danger ? "armed" : ""}" id="fv-sel-bar">
      ${selTopHtml(count, "back")}
      <div class="fv-sel-confirm">
        <p class="fv-sel-confirm-text">${esc(confirm.text)}</p>
        <div class="fv-sel-confirm-acts">
          <button type="button" class="fv-btn fv-pill fv-pill-file" data-sel="back">Cancel</button>
          <button type="button" class="fv-btn fv-pill ${danger ? "fv-pill-scan" : "fv-pill-add"}" data-sel="do">${esc(confirm.ok)}</button>
        </div>
      </div>
    </div>`;
  }
  if (view === "label") {
    const rows = LABELS.map(
      (lab) =>
        `<button type="button" class="fv-sel-dd-item" data-sel="pick-label" data-label="${lab}">
          <span class="fv-ctx-dot" style="background:${LABEL_COLOR[lab]}"></span>${labelTitle(lab)}
        </button>`
    ).join("");
    return `<div class="fv-sel-bar" id="fv-sel-bar">
      ${selTopHtml(count, "actions")}
      <div class="fv-sel-stack">
        ${rows}
        <button type="button" class="fv-sel-dd-item" data-sel="pick-label" data-label="none">
          <span class="fv-ctx-dot fv-ctx-dot-empty"></span>Unlabel
        </button>
      </div>
    </div>`;
  }
  if (view === "dest") {
    const rows = (destLists || []).length
      ? destLists
          .map(
            (l) =>
              `<button type="button" class="fv-sel-dd-item" data-sel="pick-dest" data-to="${esc(l.id)}">${esc(l.name)} (${l.stocks.length})</button>`
          )
          .join("")
      : `<p class="fv-sel-empty">No other lists yet</p>`;
    return `<div class="fv-sel-bar" id="fv-sel-bar">
      ${selTopHtml(count, "actions")}
      <div class="fv-sel-stack">${rows}
        ${canCreate ? `<button type="button" class="fv-sel-dd-item" data-sel="new-dest">+ New list</button>` : ""}
      </div>
    </div>`;
  }
  const disabled = n ? "" : "disabled";
  return `<div class="fv-sel-bar" id="fv-sel-bar">
    ${selTopHtml(count, "exit")}
    <div class="fv-sel-acts">
      <button type="button" class="fv-btn fv-pill fv-pill-current" data-sel="label" ${disabled}>Label</button>
      <button type="button" class="fv-btn fv-pill fv-pill-file" data-sel="move" ${disabled}>Move</button>
      <button type="button" class="fv-btn fv-pill fv-pill-file" data-sel="copy" ${disabled}>Copy</button>
      <button type="button" class="fv-btn fv-pill fv-pill-scan" data-sel="delete" ${disabled}>Delete</button>
    </div>
    <button type="button" class="fv-sel-cancel" data-sel="exit">Cancel</button>
  </div>`;
}

export function canCreateList(book) {
  return book.lists.length < LIST_CAP;
}
