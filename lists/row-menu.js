import {
  LIST_CAP,
  LABELS,
  LABEL_COLOR,
  labelTitle,
  createList,
  listsByName,
  setLabel,
  copyStock,
  moveStock,
  removeStock,
} from "./book.js";
import { isolateElement } from "../shared/isolate-keys.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function openRowMenu({ panel, e, book, ex, ticker, applyBook }) {
  panel.querySelectorAll(".fv-ctx").forEach((m) => m.remove());
  const menu = document.createElement("div");
  menu.className = "fv-ctx";
  const pr0 = panel.getBoundingClientRect();
  menu.style.left = `${Math.max(6, e.clientX - pr0.left)}px`;
  menu.style.top = `${Math.max(6, e.clientY - pr0.top)}px`;
  panel.appendChild(menu);

  const placeMenu = () => {
    const pr = panel.getBoundingClientRect();
    const pad = 6;
    const roomH = Math.max(80, pr.height - pad * 2);
    const roomW = Math.max(80, pr.width - pad * 2);
    menu.style.maxWidth = `${roomW}px`;
    menu.style.maxHeight = `${roomH}px`;
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = e.clientX - pr.left;
    let top = e.clientY - pr.top;
    if (left + mw > pr.width - pad) left = pr.width - mw - pad;
    if (top + mh > pr.height - pad) top = e.clientY - pr.top - mh;
    if (left < pad) left = pad;
    if (top < pad) top = pad;
    if (top + mh > pr.height - pad) top = Math.max(pad, pr.height - mh - pad);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  };

  const current = book.lists
    .find((l) => l.id === book.activeId)
    ?.stocks.find((s) => s.ticker === ticker && s.exchange === ex);

  const renderMain = () => {
    menu.innerHTML = `
      <div class="fv-ctx-head"><strong>${esc(ticker)}</strong></div>
      <div class="fv-ctx-sec">Label</div>
      ${LABELS.map((lab) => {
        const on = current?.label === lab ? "on" : "";
        return `<button type="button" class="fv-ctx-row ${on}" data-act="set-label" data-label="${lab}">
          <span class="fv-ctx-dot" style="background:${LABEL_COLOR[lab]}"></span>
          <span>${labelTitle(lab)}</span>
          ${on ? "<span class='fv-ctx-check'>✓</span>" : ""}
        </button>`;
      }).join("")}
      <button type="button" class="fv-ctx-row ${!current?.label ? "on" : ""}" data-act="set-label" data-label="none">
        <span class="fv-ctx-dot fv-ctx-dot-empty"></span>
        <span>Unlabel</span>
        ${!current?.label ? "<span class='fv-ctx-check'>✓</span>" : ""}
      </button>
      <div class="fv-ctx-line"></div>
      <button type="button" class="fv-ctx-row" data-act="open-move">Move to<span class="fv-ctx-chev">›</span></button>
      <button type="button" class="fv-ctx-row" data-act="open-copy">Copy to<span class="fv-ctx-chev">›</span></button>
      <div class="fv-ctx-line"></div>
      <button type="button" class="fv-ctx-row danger" data-act="del-row">Delete From List</button>
    `;
    placeMenu();
  };

  const renderPicker = (copy) => {
    const verb = copy ? "Copy" : "Move";
    const others = listsByName(book.lists.filter((l) => l.id !== book.activeId));
    const rows = others.length
      ? others
          .map(
            (l) =>
              `<button type="button" class="fv-ctx-row" data-act="${copy ? "copy-to" : "move-to"}" data-to="${esc(l.id)}">
                <span>${esc(l.name)} (${l.stocks.length})</span>
              </button>`
          )
          .join("")
      : `<div class="fv-ctx-empty">No other lists yet</div>`;
    const canCreate = book.lists.length < LIST_CAP;
    menu.innerHTML = `
      <div class="fv-ctx-nav">
        <button type="button" class="fv-ctx-back" data-act="back">← Back</button>
        <span>${verb} to</span>
      </div>
      <div class="fv-ctx-pick">${rows}</div>
      ${
        canCreate
          ? `<div class="fv-ctx-line"></div>
             <div class="fv-ctx-new">
               <button type="button" class="fv-ctx-link" data-act="show-new">+ Create new list…</button>
               <div class="fv-ctx-newform" hidden>
                 <input type="text" class="fv-ctx-newin" placeholder="List name" maxlength="40" />
                 <button type="button" class="fv-btn fv-pill fv-pill-add fv-ctx-gonew" data-act="create-${copy ? "copy" : "move"}">${verb} to new list</button>
               </div>
             </div>`
          : `<div class="fv-ctx-empty">Maximum ${LIST_CAP} lists</div>`
      }
    `;
    const input = menu.querySelector(".fv-ctx-newin");
    if (input) isolateElement(input);
    placeMenu();
  };

  renderMain();

  const runCreate = async (copy) => {
    const input = menu.querySelector(".fv-ctx-newin");
    const name = String(input?.value || "").trim();
    if (!name) return;
    const made = await createList(book, name, { activate: false });
    if (!made.ok) {
      await applyBook(made);
      return;
    }
    const fn = copy ? copyStock : moveStock;
    menu.remove();
    await applyBook(await fn(made.book, made.book.activeId, made.id, ex, ticker));
  };

  menu.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    ev.stopPropagation();
    const act = btn.getAttribute("data-act");
    if (act === "set-label") {
      menu.remove();
      await applyBook(await setLabel(book, book.activeId, ex, ticker, btn.getAttribute("data-label")));
      return;
    }
    if (act === "open-move") {
      renderPicker(false);
      return;
    }
    if (act === "open-copy") {
      renderPicker(true);
      return;
    }
    if (act === "back") {
      renderMain();
      return;
    }
    if (act === "show-new") {
      btn.hidden = true;
      const form = menu.querySelector(".fv-ctx-newform");
      if (form) form.hidden = false;
      const input = menu.querySelector(".fv-ctx-newin");
      if (input) {
        isolateElement(input);
        input.focus();
      }
      placeMenu();
      return;
    }
    if (act === "move-to") {
      menu.remove();
      await applyBook(await moveStock(book, book.activeId, btn.getAttribute("data-to"), ex, ticker));
      return;
    }
    if (act === "copy-to") {
      menu.remove();
      await applyBook(await copyStock(book, book.activeId, btn.getAttribute("data-to"), ex, ticker));
      return;
    }
    if (act === "create-move") {
      await runCreate(false);
      return;
    }
    if (act === "create-copy") {
      await runCreate(true);
      return;
    }
    if (act === "del-row") {
      menu.remove();
      await applyBook(await removeStock(book, book.activeId, ex, ticker));
    }
  });

  menu.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" || !ev.target.classList?.contains("fv-ctx-newin")) return;
    ev.preventDefault();
    menu.querySelector("[data-act^='create-']")?.click();
  });
}
