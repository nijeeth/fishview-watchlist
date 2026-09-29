export const LIST_UI_CSS = `
#fv-shell.fv-min,
#fv-shell.fv-min #fv-panel {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
#fv-body.fv-watch .fv-head {
  flex-shrink: 0;
  position: relative;
  z-index: 8;
}
.fv-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: #b4bac6 transparent;
}
.fv-quotes-load {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(19, 23, 34, 0.78);
  color: var(--fv-fg);
  font-size: 16px;
  font-weight: 700;
  pointer-events: none;
}
#fv-shell[data-theme="light"] .fv-quotes-load {
  background: rgba(255, 255, 255, 0.84);
}
.fv-table-wrap::-webkit-scrollbar {
  width: 2px;
  height: 2px;
}
.fv-table-wrap::-webkit-scrollbar-track {
  background: transparent;
}
.fv-table-wrap::-webkit-scrollbar-thumb {
  background: #b4bac6;
  border-radius: 2px;
}
.fv-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 6px 0 0;
}
.fv-filter-txt {
  font-weight: 700;
  color: var(--fv-fg);
}
.fv-filter-dot {
  width: 8px;
  height: 8px;
}
.fv-filter-none {
  width: 10px;
  height: 10px;
  display: inline-block;
  vertical-align: middle;
}
.fv-table {
  border-collapse: separate;
  border-spacing: 0;
}
.fv-table thead {
  position: sticky;
  top: 0;
  z-index: 5;
}
.fv-table thead th {
  position: sticky;
  top: 0;
  z-index: 6;
  background: #1c2030;
  box-shadow: inset 0 -1px 0 var(--fv-line);
}
#fv-shell[data-theme="light"] .fv-table thead th {
  background: #eef1f6;
}
.fv-table th.fv-sort {
  cursor: pointer;
  user-select: none;
}
.fv-table thead th.fv-sort.on,
.fv-table thead th.col-label.on {
  background: rgba(246, 196, 69, 0.42) !important;
  color: #f6c445;
}
#fv-shell[data-theme="light"] .fv-table thead th.fv-sort.on,
#fv-shell[data-theme="light"] .fv-table thead th.col-label.on {
  background: rgba(246, 196, 69, 0.4) !important;
  color: #5d4e00;
}
.fv-table tbody tr,
.fv-table tbody td {
  position: relative;
  z-index: 0;
}
.fv-table tbody tr.fv-row-on {
  background: rgba(245, 196, 64, 0.2);
}
.fv-table .col-name {
  width: 30%;
  min-width: 5em;
}
.fv-table .col-num {
  width: 23%;
}
.fv-table tbody td.col-num {
  text-align: right;
}
.fv-table thead th.col-num {
  text-align: right;
}
.fv-table tbody td.fv-up {
  color: #089981;
  font-weight: 700;
}
.fv-table tbody td.fv-down {
  color: #f23645;
  font-weight: 700;
}
.fv-table .col-label {
  width: 28px;
  max-width: 32px;
  padding: 6px 4px !important;
  text-align: center;
}
#fv-label-head {
  cursor: pointer;
  vertical-align: middle;
}
.fv-head-dots {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
}
.fv-head-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
}
#fv-shell #fv-list-new {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.fv-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--fv-muted);
  vertical-align: middle;
  cursor: pointer;
  flex-shrink: 0;
}
.fv-dot.on {
  border-color: transparent;
}
.fv-sym {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
.fv-table tbody tr {
  cursor: context-menu;
}
.fv-table tbody tr:hover {
  background: rgba(41, 98, 255, 0.12);
}
.fv-tip,
#fv-tip {
  position: fixed;
  z-index: 80;
  max-width: 240px;
  padding: 6px 8px;
  background: #1c2030;
  color: #d1d4dc;
  border: 1px solid #2a2e39;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.35;
  pointer-events: none;
  box-shadow: 0 8px 18px rgba(0,0,0,0.4);
}
#fv-shell[data-theme="light"] #fv-tip {
  background: #fff;
  color: #131722;
  border-color: #e0e3eb;
}
#fv-tip[hidden] {
  display: none;
}
.fv-cloud .fv-cloud-backup,
.fv-cloud #fv-cloud-backup {
  display: none !important;
}
.fv-cloud-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fv-cloud-head.off {
  color: #e53935;
}
.fv-cloud-head.on {
  color: #089981;
}
.fv-cloud-head .fv-cloud-ico {
  width: 18px !important;
  height: 18px !important;
  max-width: 18px !important;
  max-height: 18px !important;
  flex-shrink: 0;
}
.fv-cloud #fv-help-cloud,
.fv-cloud #fv-open-supabase,
.fv-cloud #fv-copy-sql {
  background: rgba(123, 97, 255, 0.45);
  color: #fff;
}
#fv-shell[data-theme="light"] .fv-cloud #fv-help-cloud,
#fv-shell[data-theme="light"] .fv-cloud #fv-open-supabase,
#fv-shell[data-theme="light"] .fv-cloud #fv-copy-sql {
  background: #7b61ff;
}
.fv-cloud-help .fv-btn {
  flex: 1 1 0;
  min-width: 0;
  width: auto;
  height: auto;
  min-height: 32px;
  padding: 5px 6px;
  font-size: 11px;
  line-height: 1.2;
  white-space: normal;
  overflow: hidden;
  text-align: center;
  hyphens: none;
}
.fv-cloud-sql-note {
  margin: 8px 0 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}
.fv-cloud-sql-note.ok {
  color: #089981;
}
.fv-cloud-sql-note.err {
  color: #e53935;
}
.fv-warn-label {
  color: #e53935;
  font-weight: 700;
}
.fv-cloud .fv-warn {
  color: var(--fv-fg);
}
.fv-cloud-delete-box {
  display: none;
}
.fv-cloud #fv-cloud-delete,
.fv-cloud .fv-cloud-delete {
  display: inline-flex;
  width: auto;
  max-width: 100%;
  flex: 0 0 auto;
  align-self: flex-start;
  height: 22px;
  min-height: 22px;
  margin: 8px 0 12px;
  padding: 0 8px;
  font-size: 10px;
  line-height: 22px;
  background: #e53935;
  color: #fff;
}
.fv-cloud .fv-cloud-help {
  margin-top: 16px;
}
.fv-tools {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  align-items: stretch;
}
.fv-tools select {
  flex: 1;
  min-width: 0;
  height: 32px;
  background: var(--fv-bg);
  color: var(--fv-fg);
  border: 1px solid var(--fv-line);
  border-radius: 8px;
  padding: 0 6px;
  font-size: 12px;
}
.fv-banner {
  color: #e53935;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0 0 8px;
}
.fv-banner.ok {
  color: #089981;
}
.fv-banner.err {
  color: #e53935;
}
.fv-banner.busy {
  color: #2962ff;
}
.fv-banner.counts {
  color: var(--fv-fg);
  font-size: 15px;
  font-weight: 700;
}
.fv-n-add { color: #089981; }
.fv-n-ex { color: #f6c445; }
.fv-n-fail { color: #e53935; }
.fv-modal {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  padding: 12px;
}
.fv-modal-card {
  width: 100%;
  max-width: 280px;
  background: var(--fv-bg);
  color: var(--fv-fg);
  border: 1px solid var(--fv-line);
  border-radius: 10px;
  padding: 12px;
}
.fv-modal-card p {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
}
.fv-modal-card input,
.fv-modal-card textarea {
  width: 100%;
  margin-bottom: 10px;
  border: 1px solid var(--fv-line);
  border-radius: 8px;
  background: var(--fv-bg);
  color: var(--fv-fg);
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
}
.fv-modal-card input {
  height: 36px;
  padding: 0 8px;
}
.fv-modal-card textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.35;
}
.fv-modal-actions {
  display: flex;
  gap: 8px;
}
.fv-modal-actions.stack {
  flex-direction: column;
}
.fv-modal-actions .fv-btn {
  flex: 1;
}
.fv-ctx {
  position: absolute;
  z-index: 50;
  width: 214px;
  background: var(--fv-bg);
  border: 1px solid var(--fv-line);
  border-radius: 10px;
  padding: 6px 0;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
  font-size: 12px;
}
.fv-ctx-head {
  padding: 6px 12px 8px;
  font-size: 11px;
  border-bottom: 1px solid var(--fv-line);
  margin-bottom: 4px;
}
.fv-ctx-sec {
  padding: 6px 12px 2px;
  font-size: 10px;
  font-weight: 700;
  color: var(--fv-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.fv-ctx-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  color: var(--fv-fg);
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
}
.fv-ctx-row:hover {
  background: rgba(41, 98, 255, 0.14);
}
.fv-ctx-row.on {
  font-weight: 700;
}
.fv-ctx-row.danger {
  color: #e53935;
}
.fv-ctx-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
}
.fv-ctx-dot-empty {
  background: transparent;
  box-shadow: 0 0 0 1px var(--fv-muted);
}
.fv-ctx-check {
  margin-left: auto;
  color: #2962ff;
  font-weight: 700;
}
.fv-ctx-chev {
  margin-left: auto;
  color: var(--fv-muted);
}
.fv-ctx-count {
  margin-left: auto;
  font-size: 10px;
  color: var(--fv-muted);
}
.fv-ctx-line {
  height: 1px;
  background: var(--fv-line);
  margin: 4px 0;
}
.fv-ctx-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 8px;
  border-bottom: 1px solid var(--fv-line);
  font-size: 11px;
  font-weight: 700;
}
.fv-ctx-back {
  background: none;
  border: none;
  color: #2962ff;
  cursor: pointer;
  font-weight: 700;
  padding: 0;
  font-size: 12px;
}
.fv-ctx-empty {
  padding: 10px 12px;
  color: var(--fv-muted);
  font-size: 11px;
  text-align: center;
}
.fv-ctx-pick {
  max-height: calc(8 * 32px);
  overflow: auto;
}
.fv-ctx-pick .fv-ctx-row {
  min-height: 32px;
  font-size: 12px;
}
.fv-ctx-new {
  padding: 6px 12px 8px;
}
.fv-ctx-link {
  background: none;
  border: none;
  color: #2962ff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  padding: 0;
  text-align: left;
}
.fv-ctx-newform {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.fv-ctx-newform[hidden] {
  display: none;
}
.fv-ctx-newin {
  height: 30px;
  border: 1px solid var(--fv-line);
  border-radius: 6px;
  background: var(--fv-bg);
  color: var(--fv-fg);
  padding: 0 8px;
}
.fv-ctx-gonew {
  height: 30px;
  font-size: 12px;
}
#fv-panel {
  position: relative;
}
.fv-list-row {
  position: relative;
}
.fv-lab-pop {
  position: absolute;
  z-index: 46;
  min-width: 148px;
  background: var(--fv-bg);
  color: var(--fv-fg);
  border: 1px solid var(--fv-line);
  border-radius: 8px;
  padding: 6px 0 8px;
  box-shadow: 0 8px 22px rgba(0,0,0,0.35);
  font-size: 12px;
}
.fv-lab-pop[hidden] {
  display: none;
}
.fv-lab-sort,
.fv-lab-all {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  background: none;
  border: none;
  color: var(--fv-fg);
  padding: 7px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
}
.fv-lab-sort.on {
  background: rgba(245, 196, 64, 0.28);
}
#fv-shell[data-theme="light"] .fv-lab-sort.on {
  background: #f3e7b0;
  color: #5d4e00;
}
.fv-lab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
}
.fv-lab-item.fv-lab-all {
  padding: 7px 12px;
  font-weight: 700;
}
.fv-lab-item input {
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  width: 13px;
  height: 13px;
}
#fv-body {
  position: relative;
}
.fv-list-wrap {
  flex: 1;
  min-width: 0;
  position: relative;
}
.fv-list-pick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  padding-right: 8px;
}
.fv-list-pick-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-list-caret {
  flex-shrink: 0;
  width: 0;
  height: 0;
  margin-left: 2px;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--fv-fg);
  pointer-events: none;
}
.fv-list-drop {
  position: absolute;
  left: 0;
  right: 0;
  top: 44px;
  z-index: 48;
  background: var(--fv-bg);
  color: var(--fv-fg);
  border: 1px solid var(--fv-line);
  border-radius: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  max-height: calc(8 * 36px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.35);
}
.fv-list-drop[hidden] {
  display: none;
}
.fv-list-opt {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: none;
  background: none;
  color: var(--fv-fg);
  text-align: left;
  cursor: pointer;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-list-opt.on {
  background: rgba(245, 196, 64, 0.2);
}
.fv-list-opt:hover {
  background: rgba(41, 98, 255, 0.12);
}
.fv-list-opt.on:hover {
  background: rgba(245, 196, 64, 0.28);
}
.fv-empty {
  text-align: center;
  padding: 18px 8px !important;
}
.fv-empty-filter {
  color: var(--fv-muted);
  font-size: 12px;
  font-weight: 400;
  white-space: normal;
}
.fv-add-link {
  background: none;
  border: none;
  color: #2962ff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  text-decoration: underline;
  padding: 0;
}
#fv-shell *,
#fv-shell *::-webkit-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #b4bac6 transparent;
}
#fv-shell *::-webkit-scrollbar {
  width: 2px;
  height: 2px;
}
#fv-shell *::-webkit-scrollbar-track {
  background: transparent;
}
#fv-shell *::-webkit-scrollbar-thumb {
  background: #b4bac6;
  border-radius: 2px;
}
.fv-list-menu {
  position: absolute;
  top: 44px;
  right: 0;
  left: auto;
  z-index: 50;
}
#fv-xfer-menu button {
  font-size: 16px;
}
.fv-menu {
  z-index: 50;
}
.fv-phase-warn {
  color: #f77a4a;
  font-weight: 700;
}
.fv-chartink-site {
  color: var(--fv-muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 8px;
}
.fv-chartink-day {
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
  border: none;
  border-radius: 999px;
  background: #2962ff;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  height: 24px;
  padding: 0 8px;
}
.fv-cloud-status.off {
  color: #e53935;
}
#fv-body.fv-watch .fv-cloud-line .fv-btn {
  flex: 0 0 auto;
  width: auto;
  height: 1.35em;
  min-height: 0;
  padding: 0 8px;
  font-size: inherit;
  line-height: 1.35;
  gap: 4px;
}
#fv-body.fv-watch .fv-cloud-line .fv-btn .fv-cloud-ico {
  width: 1em !important;
  height: 1em !important;
  max-width: 1em !important;
  max-height: 1em !important;
}
#fv-body.fv-watch .fv-list-pick,
#fv-body.fv-watch .fv-list-drop {
  background: var(--fv-bg);
  color: var(--fv-fg);
  border-color: #089981;
}
#fv-body.fv-watch .fv-list-opt {
  color: var(--fv-fg);
}
#fv-body.fv-watch .fv-cloud-line .fv-pill-file,
#fv-body.fv-watch #fv-list-more,
#fv-body.fv-watch #fv-quotes-go,
#fv-body.fv-watch #fv-add,
#fv-body.fv-watch #fv-scan,
#fv-body.fv-watch #fv-xfer {
  background: rgba(123, 97, 255, 0.45);
}
#fv-shell[data-theme="light"] #fv-body.fv-watch .fv-cloud-line .fv-pill-file,
#fv-shell[data-theme="light"] #fv-body.fv-watch #fv-list-more,
#fv-shell[data-theme="light"] #fv-body.fv-watch #fv-quotes-go,
#fv-shell[data-theme="light"] #fv-body.fv-watch #fv-add,
#fv-shell[data-theme="light"] #fv-body.fv-watch #fv-scan,
#fv-shell[data-theme="light"] #fv-body.fv-watch #fv-xfer,
#fv-shell[data-theme="light"] #fv-body.fv-watch .fv-local-io .fv-pill-file {
  background: #7b61ff;
}
.fv-local-io {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 6px;
  width: 100%;
  margin: 0 0 8px;
}
.fv-local-io .fv-btn {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
  height: 22px;
  min-height: 22px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 22px;
  border-radius: 6px;
  white-space: nowrap;
}
.fv-local-io .fv-pill-file {
  background: rgba(123, 97, 255, 0.45);
}
.fv-local-io .fv-pill-scan {
  background: rgba(247, 122, 74, 0.45);
}
.fv-credit {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  padding: 14px 12px;
  min-height: 44px;
  background: #5b8ef0;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
}
.fv-credit-sep {
  font-weight: 500;
  opacity: 0.85;
}
.fv-table tbody tr.fv-row-flash,
.fv-table tbody tr.fv-row-flash:hover {
  animation: fv-flash-row 1.2s ease;
}
@keyframes fv-flash-row {
  0%, 100% { background: transparent; }
  18%, 38% { background: rgba(8, 153, 129, 0.55); }
  50% { background: transparent; }
  62%, 82% { background: rgba(8, 153, 129, 0.55); }
}
.fv-table.selecting td.col-label {
  position: relative;
}
.fv-table.selecting .fv-dot {
  opacity: 0.28;
  pointer-events: none;
}
.fv-check {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  margin: 0;
  transform: translate(-50%, -50%);
  border: 2px solid #2962ff;
  border-radius: 3px;
  background: var(--fv-bg);
  box-sizing: border-box;
  z-index: 2;
  pointer-events: none;
}
.fv-check.on {
  background: #2962ff;
}
.fv-check.on::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 0;
  width: 4px;
  height: 8px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.fv-table tbody tr.fv-row-sel {
  background: rgba(41, 98, 255, 0.16);
}
.fv-table.selecting tbody tr[data-ticker] {
  cursor: pointer;
}
#fv-body.fv-watch.selecting .fv-table-wrap {
  padding-bottom: 8px;
}
.fv-sel-bar {
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 12;
  margin: 8px 0 0;
  padding: 10px;
  border: 1px solid var(--fv-line);
  border-radius: 12px;
  background: var(--fv-bg);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fv-sel-bar.armed {
  border-color: #e53935;
  background: rgba(229, 57, 53, 0.08);
}
.fv-sel-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: 8px;
}
.fv-sel-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: #f6c445 !important;
}
.fv-sel-back {
  flex: 0 0 auto;
  background: none;
  border: 0;
  color: #2962ff !important;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
}
.fv-sel-link,
.fv-sel-cancel {
  background: none;
  border: 0;
  color: var(--fv-muted);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 4px;
}
.fv-sel-acts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.fv-sel-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 160px;
  overflow: auto;
}
.fv-sel-dd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  color: var(--fv-fg);
  font: inherit;
  font-weight: 600;
  padding: 7px 6px;
  border-radius: 8px;
  cursor: pointer;
}
.fv-sel-dd-item:hover {
  background: rgba(41, 98, 255, 0.12);
}
.fv-sel-empty {
  margin: 0;
  font-size: 12px;
  color: var(--fv-muted);
}
.fv-sel-confirm-text {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}
.fv-sel-confirm-acts {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.fv-sel-cancel {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  background: rgba(127, 127, 127, 0.12);
}
`;
