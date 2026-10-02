/** Smaller type and controls on Screener / Chartink only. TradingView keeps base dock CSS. */
export const WEB_DOCK_CSS = `
#fv-shell[data-compact="1"] {
  font-size: 11px;
  line-height: 1.3;
}
#fv-shell[data-compact="1"] button,
#fv-shell[data-compact="1"] select,
#fv-shell[data-compact="1"] input,
#fv-shell[data-compact="1"] td,
#fv-shell[data-compact="1"] th {
  font-size: 11px;
}
#fv-shell[data-compact="1"] .fv-tab {
  font-size: 11px;
  padding: 6px 4px;
}
#fv-shell[data-compact="1"] .fv-theme {
  font-size: 10px;
  padding: 4px 7px;
}
#fv-shell[data-compact="1"] .fv-theme-ico {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-close-btn {
  font-size: 13px;
  width: 16px;
  height: 16px;
}
#fv-shell[data-compact="1"] .fv-docker-title {
  font-size: 11px;
}
#fv-shell[data-compact="1"] .fv-loading {
  font-size: 11px;
  margin: 10px 4px;
}
#fv-shell[data-compact="1"] #fv-docker-head {
  height: 30px;
  padding: 0 6px;
}
#fv-shell.fv-min[data-compact="1"] #fv-docker-head {
  height: 28px;
  padding: 0 6px 0 10px;
}
#fv-shell[data-compact="1"] #fv-tabs {
  margin: 6px 6px 0;
  padding: 3px;
  gap: 2px;
}
#fv-shell[data-compact="1"] #fv-body {
  padding: 8px 8px 12px;
}
#fv-shell[data-compact="1"] .fv-list-row {
  min-height: 32px;
}
#fv-shell[data-compact="1"] .fv-list-pick {
  height: 32px;
  font-size: 12px;
  padding: 0 6px;
  border-radius: 8px;
}
#fv-shell[data-compact="1"] .fv-btn {
  font-size: 11px;
  height: 30px;
  padding: 4px 6px;
}
#fv-shell[data-compact="1"] .fv-icon {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  font-size: 16px;
}
#fv-shell[data-compact="1"] #fv-list-new {
  font-size: 22px;
}
#fv-shell[data-compact="1"] .fv-icon .fv-cloud-ico {
  width: 13px !important;
  height: 13px !important;
  max-width: 13px !important;
  max-height: 13px !important;
}
#fv-shell[data-compact="1"] .fv-hint {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-field {
  font-size: 11px;
  margin-bottom: 10px;
}
#fv-shell[data-compact="1"] .fv-field input {
  height: 32px;
  font-size: 11px;
}
#fv-shell[data-compact="1"] .fv-table {
  font-size: 11px;
}
#fv-shell[data-compact="1"] .fv-table th,
#fv-shell[data-compact="1"] .fv-table td {
  padding: 6px 3px;
}
#fv-shell[data-compact="1"] .fv-table th {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-table tbody tr {
  height: 30px;
}
#fv-shell[data-compact="1"] .fv-cloud-line {
  font-size: 11px;
  margin-bottom: 8px;
}
#fv-shell[data-compact="1"] .fv-phase {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-cloud-sync-note {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-chartink-site {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-chartink-day {
  font-size: 10px;
  height: 22px;
}
#fv-shell[data-compact="1"] .fv-local-io {
  gap: 4px;
  margin-bottom: 6px;
}
#fv-shell[data-compact="1"] .fv-local-io .fv-btn {
  height: 20px;
  min-height: 20px;
  max-height: 20px;
  font-size: 11px;
  line-height: 20px;
  padding: 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#fv-shell[data-compact="1"] .fv-menu {
  top: 34px;
  min-width: 100px;
}
#fv-shell[data-compact="1"] .fv-menu button {
  font-size: 11px;
  padding: 8px 6px;
}
#fv-shell[data-compact="1"] #fv-xfer-menu button {
  font-size: 14px;
}
#fv-shell[data-compact="1"] .fv-cloud .fv-cloud-backup,
#fv-shell[data-compact="1"] .fv-cloud #fv-cloud-backup {
  display: none !important;
}
#fv-shell[data-compact="1"] .fv-cloud-help .fv-btn {
  min-height: 40px;
  max-height: none;
  font-size: 11px;
  padding: 5px 6px;
  white-space: normal;
}
#fv-shell[data-compact="1"] .fv-cloud-sql-note {
  font-size: 14px;
}
#fv-shell[data-compact="1"] .fv-cloud #fv-cloud-delete {
  height: 20px;
  min-height: 20px;
  font-size: 9px;
  line-height: 20px;
  padding: 0 7px;
}
#fv-shell[data-compact="1"] .fv-warn,
#fv-shell[data-compact="1"] .fv-privacy {
  font-size: 11px;
}
#fv-shell[data-compact="1"] .fv-tools select {
  height: 28px;
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-banner {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-list-drop {
  top: calc(100% + 2px);
  max-height: calc(8 * 32px);
}
#fv-shell[data-compact="1"] .fv-modal-card p {
  font-size: 15px;
}
#fv-shell[data-compact="1"] .fv-modal-card input,
#fv-shell[data-compact="1"] .fv-modal-card textarea {
  font-size: 16px;
}
#fv-shell[data-compact="1"] .fv-list-opt {
  height: 32px;
  font-size: 14px;
  padding: 0 6px;
}
#fv-shell[data-compact="1"] .fv-ctx button,
#fv-shell[data-compact="1"] .fv-ctx .fv-ctx-lab {
  font-size: 11px;
  padding: 6px 6px;
}
#fv-shell[data-compact="1"] .fv-btn-danger-sm {
  font-size: 10px;
}
#fv-shell[data-compact="1"] .fv-banner,
#fv-shell[data-compact="1"] .fv-banner.counts {
  font-size: 13px;
}
#fv-shell[data-compact="1"] .fv-credit {
  font-size: 11px;
  padding: 6px 8px;
  min-height: 28px;
  max-height: 28px;
}
#fv-shell[data-compact="1"] .fv-quotes-load {
  font-size: 13px;
  text-align: center;
  padding: 12px;
}
`;
