import {
  LIST_CAP,
  STOCK_CAP,
  FILTER_KEYS,
  HEADER_DOTS,
  LABEL_COLOR,
  LABELS,
  activeList,
  visibleStocks,
  labelTitle,
  labelCounts,
  allLabelsSelected,
  normalizeLabelOn,
  listsByName,
} from "./book.js";
import { phaseBanner, ACTIVE_PHASE } from "../config/phase.js";
import { selectBarHtml, canCreateList } from "./select-bar.js";
import { otherLists } from "./bulk.js";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function fmtPrice(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  if (Math.abs(n) >= 1000) return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "--";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function fmtMcap(n) {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return "--";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  return `${Math.round(n)}`;
}

export function watchlistHtml(book, { cloudIcon, refreshIcon, cloudHint, cloudStatus, quoteHint, ingestHint, screenerHint, chartinkHint, chartHint, notice, noticeOk, noticeBusy, noticeCounts, selectedKey, currentReady, ingestReady, scanReady, quotesReady, quotesLoading, quotes, selecting, selectedKeys, selView, selConfirm, flashKeys, chartinkChartDark }) {
  const list = activeList(book);
  const rows = visibleStocks(book, quotes);
  const on = normalizeLabelOn(book.labelOn);
  const counts = labelCounts(list);
  const allOn = allLabelsSelected(on);
  const listLabel = (l) => `${esc(l.name)} (${l.stocks.length})`;
  const listOpts = listsByName(book.lists)
    .map(
      (l) =>
        `<button type="button" class="fv-list-opt ${l.id === book.activeId ? "on" : ""}" data-list="${esc(l.id)}">${listLabel(l)}</button>`
    )
    .join("");

  const arrow = book.sortDir === "desc" ? "↓" : "↑";
  const mark = (key, title) => {
    const live = book.sortKey === key;
    const prefix = live ? `${arrow} ` : "";
    const col = key === "name" ? "name" : "num";
    return `<th class="col-${col} fv-sort ${live ? "on" : ""}" data-sort="${key}">${prefix}${title}</th>`;
  };

  const bodyRows = rows.length
    ? rows
        .map((s) => {
          const color = s.label ? LABEL_COLOR[s.label] : "transparent";
          const onDot = s.label ? "on" : "";
          const key = `${s.exchange}:${s.ticker}`;
          const picked = selecting && selectedKeys?.has?.(key);
          const flashing = flashKeys?.has?.(key);
          const sel = [selectedKey === key && !flashing ? "fv-row-on" : "", picked ? "fv-row-sel" : "", flashing ? "fv-row-flash" : ""].filter(Boolean).join(" ");
          const q = quotes?.get?.(key);
          const pctCls = typeof q?.pct === "number" ? (q.pct > 0 ? "fv-up" : q.pct < 0 ? "fv-down" : "") : "";
          const showMcap = q && q.kind !== "index" && q.kind !== "derivative" && q.kind !== "other";
          return `<tr class="${sel}" data-ex="${esc(s.exchange)}" data-ticker="${esc(s.ticker)}">
            <td class="col-label">
              <span class="fv-dot ${onDot}" title="Label" style="background:${color}"></span>
              ${selecting ? `<span class="fv-check ${picked ? "on" : ""}" data-act="sel-row" title="Select"></span>` : ""}
            </td>
            <td class="col-name"><span class="fv-sym">${esc(s.ticker)}</span></td>
            <td class="col-num">${esc(fmtPrice(q?.price))}</td>
            <td class="col-num ${pctCls}">${esc(fmtPct(q?.pct))}</td>
            <td class="col-num">${showMcap ? esc(fmtMcap(q?.mcap)) : "--"}</td>
          </tr>`;
        })
        .join("")
    : list.stocks.length
      ? `<tr><td colspan="5" class="fv-empty fv-empty-filter">No stocks match these labels</td></tr>`
      : `<tr><td colspan="5" class="fv-empty"><button type="button" class="fv-add-link" data-act="add-stocks">Add Stocks</button></td></tr>`;

  const plusDisabled = book.lists.length >= LIST_CAP ? "disabled" : "";
  const plusTitle = book.lists.length >= LIST_CAP ? `Maximum ${LIST_CAP} lists` : "New list";
  const labelSorted = book.sortKey === "label";

  const filterRows = FILTER_KEYS.map((key) => {
    const n = counts[key] || 0;
    const title = key === "none" ? "Unlabel" : labelTitle(key);
    const swatch =
      key === "none"
        ? `<span class="fv-ctx-dot fv-ctx-dot-empty"></span>`
        : `<span class="fv-ctx-dot" style="background:${LABEL_COLOR[key]}"></span>`;
    return `<label class="fv-lab-item">
      <input type="checkbox" data-lab="${key}" ${on[key] ? "checked" : ""} />
      ${swatch}<span>${title} (${n})</span>
    </label>`;
  }).join("");

  return `
      <div class="fv-head">
        <p class="fv-phase${ACTIVE_PHASE === 6 ? " fv-phase-warn" : ""}">${phaseBanner(ACTIVE_PHASE)}</p>
        ${
          chartinkChartDark
            ? `<p class="fv-chartink-site">Chartink website issue: stock row text on this chart can be hard to read in their Dark theme. <button type="button" class="fv-chartink-day" id="fv-chartink-day">Use Chartink Day</button></p>`
            : ""
        }
        <div class="fv-local-io">
          <button type="button" class="fv-btn fv-pill fv-pill-file" id="fv-backup-local" title="Save all lists and labels to a file">Backup Local</button>
          <button type="button" class="fv-btn fv-pill fv-pill-scan" id="fv-restore-backup" title="Replace all lists on this computer from a file">Restore Backup</button>
        </div>
        <div class="fv-cloud-line">
          <span class="fv-cloud-status ${cloudStatus?.on ? "on" : "off"}">${cloudIcon} ${esc(cloudStatus?.label || "Cloud: Not configured")}</span>
        </div>
        ${
          noticeCounts
            ? `<p class="fv-banner counts"><span class="fv-n-add">${noticeCounts.added} added</span>, <span class="fv-n-ex">${noticeCounts.exists} exists</span>, <span class="fv-n-fail">${noticeCounts.failed} failed</span></p>`
            : notice
              ? `<p class="fv-banner ${noticeBusy ? "busy" : noticeOk ? "ok" : "err"}">${esc(notice)}</p>`
              : ""
        }
        <div class="fv-row fv-list-row">
          <div class="fv-list-wrap" id="fv-list-wrap">
            <button type="button" class="fv-list-pick" id="fv-list-pick">
              <span class="fv-list-pick-name">${listLabel(list)}</span>
              <span class="fv-list-caret" aria-hidden="true"></span>
            </button>
            <div class="fv-list-drop" id="fv-list-drop" hidden>${listOpts}</div>
          </div>
          <button type="button" class="fv-btn fv-icon fv-pill fv-pill-add" id="fv-list-new" ${plusDisabled} title="${esc(plusTitle)}">+</button>
          <button type="button" class="fv-btn fv-icon fv-pill fv-pill-file" id="fv-list-more" title="List menu">⋮</button>
          <button type="button" class="fv-btn fv-icon fv-pill fv-pill-current" id="fv-quotes-go" ${quotesReady ? "" : "disabled"} title="${quotesReady ? "Refresh data for this list" : esc(quoteHint)}">${refreshIcon}</button>
          <div class="fv-menu fv-list-menu" id="fv-list-menu" hidden>
            <button type="button" data-act="rename-list">Rename</button>
            <button type="button" data-act="delete-list">Delete list</button>
          </div>
        </div>
        <div class="fv-row fv-actions">
          <button type="button" class="fv-btn fv-pill fv-pill-current" id="fv-current" ${currentReady ? "" : "disabled"} title="${currentReady ? "Add this page symbol to this list" : esc(chartHint)}">Current</button>
          <button type="button" class="fv-btn fv-pill fv-pill-add" id="fv-add" ${ingestReady ? "" : "disabled"} title="${ingestReady ? "Paste up to 5 symbols" : esc(ingestHint)}">Add</button>
          <button type="button" class="fv-btn fv-pill fv-pill-scan" id="fv-scan" ${scanReady ? "" : "disabled"} title="${scanReady ? "Scan this page into a new list" : esc(screenerHint) + " / " + esc(chartinkHint)}">Scan</button>
          <div class="fv-menu-wrap">
            <button type="button" class="fv-btn fv-pill fv-pill-file" id="fv-xfer" title="${ingestReady ? "Import or export CSV" : esc(ingestHint)}">File ▾</button>
            <div class="fv-menu" id="fv-xfer-menu" hidden>
              <button type="button" data-act="import-file" ${ingestReady ? "" : "disabled"}>Import</button>
              <button type="button" data-act="export-file" ${ingestReady ? "" : "disabled"}>Export</button>
            </div>
          </div>
        </div>
        <p class="fv-hint fv-meta">
          ${list.stocks.length} / ${STOCK_CAP} stocks · ${book.lists.length} / ${LIST_CAP} lists · Filter Applied:
          ${
            allOn
              ? `<span class="fv-filter-txt">All Labels</span>`
              : `${
                  LABELS.some((k) => on[k])
                    ? `<span class="fv-head-dots">${LABELS.filter((k) => on[k])
                        .map((lab) => `<span class="fv-head-dot fv-filter-dot" style="background:${LABEL_COLOR[lab]}"></span>`)
                        .join("")}</span>`
                    : ""
                }${on.none ? `<span class="fv-ctx-dot fv-ctx-dot-empty fv-filter-none" title="Unlabel"></span>` : ""}`
          }
        </p>
      </div>
      <div class="fv-table-wrap">
      ${quotesLoading && rows.length && !(flashKeys && flashKeys.size) ? `<div class="fv-quotes-load">Refreshing Data. Please Wait...</div>` : ""}
      <table class="fv-table${selecting ? " selecting" : ""}">
        <thead>
          <tr>
            <th class="col-label ${labelSorted ? "fv-sort on" : ""}" id="fv-label-head" title="${selecting ? "Select all" : "Labels"}">
              <span class="fv-head-dots">
                ${HEADER_DOTS.map((lab) => `<span class="fv-head-dot" style="background:${LABEL_COLOR[lab]}"></span>`).join("")}
              </span>
            </th>
            ${mark("name", "Name")}
            ${mark("price", "Price")}
            ${mark("pct", "%Change")}
            ${mark("mcap", "Mktcap")}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      </div>
      <div class="fv-lab-pop" id="fv-label-pop" hidden>
        <button type="button" class="fv-lab-sort ${labelSorted ? "on" : ""}" data-act="sort-label">${labelSorted ? `${arrow} ` : ""}Sort Label</button>
        <label class="fv-lab-item fv-lab-all">
          <input type="checkbox" data-lab="all" ${allOn ? "checked" : ""} />
          All Labels
        </label>
        ${filterRows}
      </div>
      ${
        selecting
          ? selectBarHtml({
              n: selectedKeys?.size || 0,
              view: selView || "actions",
              confirm: selConfirm,
              destLists: otherLists(book, book.activeId),
              canCreate: canCreateList(book),
            })
          : ""
      }
  `;
}
