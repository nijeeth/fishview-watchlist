# Contributing to FishView Watchlist

Thanks for your interest in FishView Watchlist! Contributions are welcome, whether you are reporting a bug, suggesting an improvement, improving the documentation, or writing code.

FishView is a Chrome Manifest V3 extension with one focused purpose: a stock watchlist dock beside TradingView, Screener.in, and Chartink. The dock keeps the page visible, stores lists locally by default, shows delayed quotes for the open list, and can optionally sync to the user's own Supabase project.

**Version:** v2.0.0  
**Support / security:** [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com)  
**Privacy policy:** [https://sites.google.com/view/fishviewwatchlist-privacy](https://sites.google.com/view/fishviewwatchlist-privacy)

## Ways to help

- Report a reproducible bug.
- Suggest a feature or usability improvement.
- Improve the README, `ARCHITECTURE.md`, `PHASES.md`, `WHATSNEW.md`, `CHANGELOG.md`, `PRIVACY.md`, help page, or other documentation.
- Make a small, focused code change.
- Test changes on TradingView, Screener.in, and Chartink.

## Before you start

1. Search the existing issues before opening a new one.
2. For a large or behaviour-changing proposal, open an issue first so the scope and design can be discussed.
3. Read [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`PHASES.md`](./PHASES.md), and the developer section of [`README.md`](./README.md).
4. Keep the architecture documents and README in step with **v2.0.0**.

Repository: clone or copy this folder. Contact [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com) if you need a remote URL.

## Reporting bugs

Please include enough detail for someone else to reproduce the problem:

- Chrome version.
- FishView Watchlist version (**v2.0.0**).
- Site: TradingView, Screener.in, or Chartink.
- Steps to reproduce.
- Expected behaviour.
- Actual behaviour.
- Screenshots or a short recording when the issue is visual.
- Relevant console errors, with the console identified if possible.

Remove sensitive information before posting. **Never paste Supabase keys, passwords, session tokens, or personal email addresses** into an issue. In particular, never share a Supabase secret or `service_role` key.

## Suggesting features

Feature ideas should fit FishView's single purpose: a watchlist dock beside charts and supported screener pages. Please explain the user problem, the proposed behaviour, and which supported site(s) it affects.

Respect the existing product caps unless a change to them has been discussed first:

- 50 lists maximum.
- 200 stocks per list maximum.
- 30 rows maximum in a bulk selection.
- 5 symbols maximum for one paste/Add operation.
- CSV import and Scan reject more than 200 stocks rather than partially adding them.

The Cloud Backup control is hidden; Connect already syncs lists. Use Backup Local / Restore Backup for a file on this computer.

New permissions, host permissions, analytics, tracking, remote code, or unrelated features need especially strong justification and prior discussion.

## Local setup

FishView has no documented build step. It is plain JavaScript using ES modules and is loaded directly from the source folder.

1. Clone or copy the repository folder.
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder containing `manifest.json`.
5. Open TradingView, Screener.in, or Chartink. The dock should mount on the right.

The extension uses a `MAIN`-world content script for its TradingView bridge, so use Chrome 111 or newer.

After changes:

- Content-script, shell, or site changes: click **Reload** on the extension card, then reload the supported-site tab.
- Background changes: reload the extension and choose **Service worker → Inspect** on the extension card.
- Popup changes: right-click the toolbar icon and choose **Inspect popup**.
- To inspect storage from the service-worker console, use `chrome.storage.local.get(null, console.log)`.

Logs and debugging locations:

- Content scripts and page/site code: the supported page's developer console.
- Background code: the service-worker inspector opened from `chrome://extensions`.
- Popup code: the popup inspector.

## Project rules

### Folder ownership and module boundaries

Each domain folder has its own `index.js` entry, and the dock in `shell/` calls those entries. Keep ownership clear:

| Folder | Owns |
|---|---|
| `persist/` | `chrome.storage.local` keys |
| `lists/` | List CRUD, labels, sorting, filtering, caps, bulk actions, and local backup JSON |
| `ingest/` | Paste, CSV import/export, and bulk logging |
| `listings/` | The Fyers-backed NSE/BSE symbol book and resolution |
| `quotes/` | Yahoo quotes for the open list |
| `shell/` | Dock, tabs, theme, resize, painting, and clicks |
| `sites/charts/` | TradingView bridge and `page-bridge.js` |
| `sites/screener/` | Screener.in scanning, row `+`, and company URL handling |
| `sites/chartink/` | Chartink scanning, row `+`, and stock URL handling |
| `cloud/` | Supabase authentication and `fv_list_book` sync |
| `shared/` | Shared isolation helpers |
| `background/` | Service-worker work such as Yahoo, Fyers, Supabase HTTP, and opening Help |
| `popup/` | Per-site dock toggles |
| `help/` | The packaged cloud setup guide |

Follow these boundaries:

- `shell` does not import Yahoo code.
- `quotes` does not import Chartink code.
- `cloud` does not import TradingView code.
- Site folders never import one another.
- Go through each folder's `index.js` entry.
- List mutations go through `lists/book.js` → `saveBook` → `normalizeBook`.
- Cloud network calls go through the background `FV_CLOUD_HTTP` handler, which is limited to `*.supabase.co`.
- Quotes are fetched for the open list only and are never persisted.

### Names, storage, and privacy

- Use the `fv` namespace: storage keys begin with `fv`, the dock host is `#fv-root`, and page bridge events use `fv_*` names such as `fv_change_symbol` and `fv_request_symbol`.
- Use `FV_*` for runtime message names, such as `FV_CLOUD_HTTP`.
- Do not use `tvf_*`; FishView must coexist with Chart Funda.
- Access `chrome.storage.local` keys through `persist/`. Important existing keys include `fvListBook`, `fvTheme`, `fvPanelWidthTv`, `fvPanelWidthWeb`, the per-site `fvPanelOn...` settings, cloud details, `fvDiagLog`, and `fvBoardBookV6`.
- Add any new storage key to `persist/` and to the storage documentation in `ARCHITECTURE.md`.
- Never store the cloud password. Quotes are not stored.
- Do not add analytics, advertising, or tracking.
- Do not add remote code. All JavaScript must be packaged with the extension.
- Do not add permissions or host permissions without a clear justification and documentation update.
- Keep `ARCHITECTURE.md`, `PHASES.md` (v1 shipped list), `WHATSNEW.md` (this version), `CHANGELOG.md` (history), and `README.md` in step with the product.

When adding a site, update the manifest matches and host permissions, web-accessible resources, site gate and popup setting, site folder, compact styling as needed, caps, README, architecture, and `PHASES.md`. Do not import from another site's folder.

## Code style

- Match the existing style: plain JavaScript, ES modules, and no build step unless the repository files explicitly introduce one.
- Prefer small, focused changes over broad rewrites.
- Reuse the existing module boundaries and data flow.
- Keep MV3 extension pages on external scripts; do not introduce inline scripts.
- Do not copy names or pipelines from other watchlist products. Chart-switch and NSE/BSE dump patterns are acceptable only with FishView's `fv_*` names.

## Testing checklist

There is no automated test suite described by the project. Before opening a pull request, run the relevant manual checks below and report what you tested:

- [ ] **Dock:** It appears on TradingView, Screener.in, and Chartink; pushes the page; clamps to TV 220–420 px and web 180–280 px; `×` and header click minimise; each popup toggle hides the dock on its site.
- [ ] **Lists:** Create, rename, and delete lists. The 51st list is refused. Invalid and duplicate names are refused. The 201st stock is refused.
- [ ] **Labels, sort, and filter:** Label sorting keeps unlabeled rows last in both directions. The last filter tick cannot be removed. Closing a filter with none selected restores all labels.
- [ ] **Bulk:** A 500 ms long-press enters batch mode. The 31st selection is refused. Copy and move add only what fits and arrive unlabeled.
- [ ] **Ingest:** Add accepts five comma-separated symbols and refuses more. A CSV with 201 rows is rejected completely. Bare `RELIANCE` resolves to NSE first.
- [ ] **Sites:** Scan with more than 200 results adds nothing. Row `+` works. Current works from a Screener.in company URL and a Chartink stock URL.
- [ ] **Charts:** Row click switches TradingView without reloading. Current on a US stock stores `NASDAQ:` or `NYSE:`, never `BATS`, `CBOE`, or `CBOEONE`.
- [ ] **Quotes:** Quotes appear only for the open list. Other lists are not fetched until opened. Nothing is polled with the dock closed. Refresh retries.
- [ ] **Backup:** Backup Local and Restore Backup round-trip all lists and labels, and restore overwrites the current data. The Cloud Backup control stays hidden.
- [ ] **Cloud:** With two browsers and the same Auth user, lists sync about two seconds after an edit and pull on return. Status and messages appear on the correct tabs. Delete Cloud Details clears URL, key, email, and session. The password never appears in `chrome.storage.local`.
- [ ] **Help:** Help opens from the Cloud tab, follows `fvTheme`, and Copy Setup SQL works.
- [ ] **Coexistence:** FishView works with Chart Funda installed.
- [ ] **Chartink website issue:** on the Chartink **chart** window in their Dark theme, stock row text can be hard to read. The dock shows **Use Chartink Day** on that screen only (not on the screener). Day is Chartink’s theme, not FishView’s.

## Commits and pull requests

### Commits

Use short, descriptive commit messages that explain the change. Keep unrelated changes in separate commits where practical. Do not include secrets or personal data in commits.

### Pull request process

1. Fork the repository.
2. Create a focused branch, for example `fix/tradingview-current` or `docs/contributing-guide`.
3. Make the change and run the relevant checklist above.
4. Update documentation when behaviour, permissions, hosts, storage keys, module boundaries, or release details change.
5. Open a pull request with a clear description.

Use this PR description template:

```markdown
## What changed

Describe the user-visible and implementation changes.

## Why

Link the issue or explain the problem this solves.

## Testing

- Chrome version:
- Extension version:
- Sites tested: TradingView / Screener.in / Chartink
- Manual checks completed:
- Known limitations:

## Documentation and privacy review

- [ ] README / ARCHITECTURE.md / PHASES.md updated if needed. Version bump: rewrite WHATSNEW.md and add a CHANGELOG.md entry.
- [ ] No new analytics, tracking, remote code, or unjustified permissions/hosts
- [ ] No password, key, session token, or personal data included

## Screenshots

Required for UI changes; write "Not applicable" for non-UI changes.
```

For UI changes, include before-and-after screenshots or another clear visual description. Keep the PR small and explain any behaviour, permission, storage-key, or host change explicitly.

## AI-assisted contributions

AI-assisted contributions are welcome. The contributor remains responsible for every line:

- Review and understand all generated code.
- Test the code in the extension and on affected supported sites.
- Check module boundaries, `fv_*` naming, storage handling, permissions, privacy, and security.
- Disclose AI use in the pull request description.
- Do not submit unreviewed bulk AI changes.

## Security issues

Please report security issues privately to [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com), not through a public issue. Do not include Supabase passwords, secret keys, service-role keys, session tokens, or other credentials in the report unless asked to use a secure method.

## Licence

[MIT](LICENSE). Copyright (c) 2026 NijeethFish. Contributions are accepted under the same licence.

## Code of conduct

Be respectful, constructive, and considerate. Assume good intent, focus on the work, and keep discussions welcoming for first-time contributors.
