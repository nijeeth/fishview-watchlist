# FishView Watchlist — Architecture

Keep this file, `PHASES.md`, `WHATSNEW.md`, `CHANGELOG.md`, and `README.md` in step with **v2.0.0**.

**Type:** Chrome MV3 content-script dock  
**Version:** **2.0.0** (`manifest.json`)  
**Watchlist caution banner:** `BANNER` constant in `lists/render.js` and `shell/mount.js` (Yahoo delayed-data warning)  
**Cloud:** live (`cloud/`, `https://*.supabase.co/*`). Cloud Backup control is hidden.  
**Chrome:** `minimum_chrome_version` **111**  
**Privacy:** https://sites.google.com/view/fishview-watchlist-privacy  
**Support:** nijeethfish@gmail.com  
**Licence:** MIT (`LICENSE`)  
**New contributors:** start at **§14 Getting started**; sections 14–23 are the contributor guide.

---

## 1. What the app does

Right-side watchlist dock on TradingView, Screener.in, Chartink and Fish RS Board. The page is **pushed** (`width` + `margin-right`); the dock does not cover the chart. On TradingView's `/screener/` page the dock stays hidden.

- **Watchlist:** up to **50 lists × 200 stocks**, labels, sort, filter, bulk select, local JSON backup/restore, TV chart switch, Up/Down arrow navigation, and an **All Unique Stock** computed union view.
- **New stocks stay highlighted** (`isNew` on the stock, ≤50 per add batch) until a row interaction or **Clear New**. Copy/Move never marks.
- **Cloud:** optional **user-owned** Supabase. Password is typed only and never stored. Cloud Backup control is hidden; Connect already syncs.
- **Quotes:** Yahoo CMP / % / Mcap for the **open list only**, every **60s**. Not realtime. Responses are shared across tabs via a 45s symbol-level session cache in the worker; not persisted.
- **Ingest:** paste Add (max 5, comma-separated), CSV import/export (NSE/BSE prefixes; 201+ reject all).
- **Sites:** Scan, per-row **+**, Current from Screener/Chartink company or stock URLs (Fish RS Board has Scan and `+`, no Current).

Puzzle-icon **popup** turns the dock on/off per site (no tab reload required).

---

## 2. Folders

Each domain has its own `index.js`. The dock (`shell`) calls those entries.

| Folder | Owns |
|---|---|
| `persist/` | `chrome.storage.local` keys |
| `lists/` | `listBook` CRUD, labels, sort, filter, caps, bulk, local backup JSON |
| `ingest/` | Paste, CSV, export, bulk log |
| `listings/` | `boardBook`: Fyers EQ dump (seed + 24h live), NSE-then-BSE |
| `quotes/` | Yahoo for the open list |
| `shell/` | Dock, tabs, theme, resize, paint, clicks |
| `sites/charts/` | TV `fv_*` + MAIN `page-bridge.js` |
| `sites/screener/` | Scan, row +, company URL |
| `sites/chartink/` | Scan, row +, stock URL |
| `sites/fishrs/` | Scan, row + |
| `cloud/` | Supabase auth, `fv_list_book` read/write, 2s push, pull on return, local `fvDiagLog` |
| `shared/` | Key isolation |
| `background/` | Help page, Yahoo crumb/JSON, Fyers dump, `FV_CLOUD_HTTP` |
| `popup/` | Per-site dock toggles |
| `help/` | Setup guide: `index.html`, `help.css`, `help.js`, step pictures in `images/` |
| `icons/` | Toolbar PNGs + SVG sources |
| `store/` | Promo tiles (dashboard; not in the CRX) |
| `PRIVACY.md` | Repo copy of the privacy policy |

`shell` does not import Yahoo. `quotes` does not import Chartink. `cloud` does not import TV. Site folders do not import each other. Chart events are `fv_*` so the separate Chart Funda extension (`tvf_*`) can stay installed.

---

## 3. Runtime

```
Page (TV / Screener / Chartink)
  → content_scripts: shell/boot.js  (isolated world)
       → site-gate.panelAllowedHere()
       → shell/mount.js
  → TV only: sites/charts/page-bridge.js  (MAIN world)
```

1. `boot.js` skips iframes. Mount if the popup allows this host.
2. `mount.js` creates `#fv-root`, **closed** shadow, dock CSS (compact on Screener/Chartink/Fish RS Board). `site-gate.panelAllowedHere()` also blocks the TradingView `/screener/` path.
3. Page push: `html`/`body` + `--fv-dock-w`. TV uses width and margin-right.
4. Dock typing is isolated (`shared/isolate-keys.js`).
5. `chrome.storage.onChanged` refreshes width, minimize, `listBook`, and popup site gates.

---

## 4. Caps and product rules

| Rule | Value |
|---|---|
| Lists | Max **50** |
| Stocks per list | Max **200** |
| Batch select | Max **30** |
| Row identity | `exchange` + `ticker` |
| List names | Letters, numbers, space, `-`, `+`; ≤ **25** chars; unique; `All Unique Stock` reserved |
| Paste Add | Max **5** tokens; commas; active list |
| CSV / Scan | **> 200** → reject all |
| Bare paste | NSE then BSE |
| CSV prefixes | `NSE:` / `BSE:` only (US via Add/Current) |
| TV Current | `pro_name` (`NASDAQ:` / `NYSE:`). Chart feed may show Cboe One / `BATS:`; those are not stored. |
| Quotes | Open list only; 45s worker cache shared across tabs |
| New-stock mark | `isNew` on adds ≤ **50**; clears on row interaction / Clear New; copy/move never mark |
| Cloud password | Never in `chrome.storage` |
| Local backup | Full `listBook` JSON; restore overwrites |

Do not copy names or pipelines from other watchlist products. Chart-switch and NSE/BSE dump patterns are allowed only with `fv_*` names.

---

## 5. `listBook`

**Key:** `fvListBook`.

```text
{
  lists: [{ id, name, stocks: [{ exchange, ticker, label, isNew? }] }],
  activeId,
  labelOn: { green, blue, orange, red, none },
  sortKey: name | price | pct | mcap | label,
  sortDir: asc | desc
}
```

- First install: **Default** (SBIN, HDFCBANK, RELIANCE) + **Demo**.
- `isNew`: `true` only when present (stripped by `clearNewEverywhere` / `clearNewFlags`); preserved through `normalizeBook`, cloud merge, backup and `bookFingerprint` (so a clear pushes the diff).
- Label: `green` | `blue` | `orange` | `red` | `null`.
- Filter: OR. Last individual tick cannot turn off. Close popup with none on → restore all on.
- Label sort: green → blue → orange → red; unlabeled **last** in both directions. Desc colours reverse; same colour Z–A.
- Copy/move destination row is unlabeled.
- Mutations: `lists/book.js` → `saveBook` → `normalizeBook`. Local backup: `lists/backup.js`. Bulk: `lists/bulk.js`.

---

## 6. Dock UI

**Chrome:** title **FishView Watchlist** (`#1e4fd6`). × and click header minimize. Theme control is **Night / Day** in the header (`#fv-theme-btn`). Resize: left-edge handle `#fv-resize`.

**Widths:** TV 350 (14px), Screener/Chartink 200 (compact 11px). Clamp TV 220–420, web 180–280. TV below 300 px sets `data-narrow` so pill labels ellipsis instead of leaking. **Backup Local** / **Restore Backup** stay 11px / 22px. Cloud-tab help is a 2×2 grid at 14px (wrap inside the pill).

**Watchlist**

- List picker (A–Z, 8-row drop, theme fill, `#089981` border).
- `+` new list, `⋮` rename/delete, quotes refresh (`#fv-quotes-go`).
- Current, Add, Scan, File (CSV this list). Local **Backup Local** / **Restore Backup** (all lists + labels).
- Banner: `WARNING: Delayed Price Data` (BANNER constant) with a right-aligned **Clear New** pill (`#fv-clear-new`, enabled when the view has `isNew` rows; in All Unique Stock it clears all lists).
- **All Unique Stock** (`__ALL__`) is the default first picker entry: computed union, not stored/synced; Add/Current/`+` disabled, Scan → new-list popup with "current" disabled, delete warns "removed from ALL watchlists", long-press shows a bulk-not-allowed notice.
- Up/Down arrows walk `selectedKey` and switch the chart (page-wide, capture phase; skips typing contexts, bulk mode, modals).
- Row interactions (click, right-click, long-press, bulk-select tick) clear that stock's `isNew` everywhere.
- Cloud line: cloud icon + short words (**Not configured** / **Not connected** / **Database not ready** / **Link Established** / **Connected** / **Connecting…** / **Network issue**) plus **[cloud] Sync** (manual pull). Cloud tab heading keeps the full **Cloud …** phrases.
- Known issue: **Chartink website issue** on the chart window only (their Dark theme). Dock offers **Use Chartink Day** on that screen.
- Table: Label | Name | Price | %Change | Mktcap. **Filter Applied** colour dots stay 10px (column-header dots still shrink). Long-press 500ms → batch (overlay checks on label column; header = select all). Confirm all bulk actions. Label 4 colours + unlabel; dest unlabeled. 200 add-what-fits; 30 batch cap.
- Row click: select + TV `changeListing`. Right-click: colours, move/copy, delete. Menu measures itself and flips up/left so it stays inside `#fv-panel`.

**Cloud tab** (labels match the Help page)

- Heading: **Cloud not configured** in `#e53935` until a session exists; then the connected heading in `#089981`.
- **Supabase URL**, **Publishable key**, **Email**, **Password** (not stored).
- Connect / Disconnect. **Cloud Backup** is in the markup but **hidden** (`display: none`). Connect already syncs.
- Help row **2×2:** Open Supabase, Help, Copy Setup SQL, **Log** (download `fv-cloud-log-YYYY-MM-DD.txt` from `fvDiagLog`, last 500 events; no lists/tokens). Same purple fills as Backup Local (Night `rgba(123, 97, 255, 0.45)`, Day `#7b61ff`).
- Connect / Disconnect / Delete Cloud Details banners live **only** on this tab (~8s). Watchlist never shows those strings.
- Delete Cloud Details (this browser only). Sync ~2s after list edits; pull on return / visibility.
- **Connect choice** (first Connect, or `fvCloudBookAt` empty / ≥ 7 days, lists differ): Use cloud / Keep this browser / Keep both. Constant `CLOUD_SYNC_STALE_MS`. Matching fingerprints skip the popup. Within 7 days: last-write-wins pull. Notes are one sentence per line.
- Add / New list modals: 15–16px type; Enter confirms (Shift+Enter newline in Add). New list card anchors under **+**. Delete-cloud confirm button: **Delete**.

---

## 7. Charts

Isolated: `changeListing` / `askCurrentListing`. MAIN: `page-bridge.js` prefers `pro_name` then `getSymbolInterval().symbol`. `BATS` / `CBOE` / `CBOEONE` are dropped as the stored exchange. This is shipped; Current and row-click already write/switch `NASDAQ` / `NYSE`. `changeSymbol` + `setSymbol`, no URL reload. Lists are not migrated: a row saved as `CBOEONE` before this rule stays until deleted and added again.

Screener/Chartink: no TV API. Scan `table` links; `+` on rows; Current from URL. Scan can add to the **open list** (if there is room) or create a **new list**.

---

## 8. Quotes and listings

`quotesForOpenListOnly()`. 60s Yahoo **HTTP** (`query1` / `query2.finance.yahoo.com`; not yfinance) via content-script interval (not `chrome.alarms`). Session = Yahoo `currentTradingPeriod`. Equity CMP / % / Mcap; index Mktcap `-`; F&O / unknown `-`. Refresh retries open list. No poll when dock closed. US store `NASDAQ:AAPL`, Yahoo `AAPL`. Yahoo’s own exchange delay (often 0–15+ min) is separate from the 60s poll.

**Centralized cache (worker):** `FV_YAHOO_JSON` messages all funnel through `fetchYahooJson` in `background/index.js`. `/v7/finance/quote` requests are split per symbol into `fvYahooSymCache` (`chrome.storage.session`, 45s TTL, ≤400 symbols) — fresh rows served locally, only missing/stale unique symbols fetched (≤25 per request), response rebuilt in order. Other URLs use `fvYahooQCache` (whole-URL, 45s). In-flight dedupe per URL. Crumb requests bypass. `msg.force` (manual Refresh) skips the cache read but still writes for other tabs. `chrome.storage.session` is shared by all tabs, survives worker suspension, clears on browser close, never syncs.

`getBoardBook()`: bundled EQ seed, then Fyers live cached 24h. `preferNseThenBse()` for bare names. `chrome.alarms` (`fvDumpFirst`) retries the first Fyers dump if the live list is not ready.

---

## 9. Cloud

Table `public.fv_list_book` (`user_id`, `book`, `updated_at`), RLS on. Auth user (not dashboard, not DB password). Worker `FV_CLOUD_HTTP` only to `*.supabase.co`. LWW via `updated_at` / `fvCloudBookAt`. Help: `help/index.html` (styles `help.css`, script `help.js`, pictures in `help/images/`).

Probe the table only marks **Database not ready** on PostgREST missing-table errors. Transport fail (status 0, 5xx, failed fetch) is **Network issue**; `dbReady` is not cleared. Dead session is 401/403 / invalid refresh only. `cloud/diag.js` appends up to 500 events to `fvDiagLog`.

---

## 10. Persistence keys

| Key | Role |
|---|---|
| `fvListBook` | Lists |
| `fvTheme` | `dark` / `light` |
| `fvPanelWidthTv` / `fvPanelWidthWeb` | Last drag |
| `fvDockMinimizedTv` / `fvDockMinimizedWeb` | Mini bar |
| `fvPanelOnTradingView` / `Screener` / `Chartink` / `FishRs` | Popup gates |
| `fvCloudUrl`, `fvCloudPublishableKey`, `fvCloudEmail`, `fvCloudSession`, `fvCloudBookAt` | Cloud, no password |
| `fvDiagLog` | Local cloud event log (**Log** download). No lists or tokens |
| `fvBoardBookV6` | EQ dump cache |
| `fvYahooSymCache` / `fvYahooQCache` (session) | 45s shared quote cache (§8) — `chrome.storage.session`, not `local` |

---

## 11. Chrome permissions

`storage`, `alarms`. **Not** `scripting` (content scripts are static in the manifest). Hosts: `www` / `in` / `es` TradingView, Screener, Chartink, Fyers dump, Yahoo (`query1`/`query2` quotes, `fc.yahoo.com` + `finance.yahoo.com` crumb), `https://*.supabase.co/*`. No `identity`.

---

## 12. Names

| Idea | Name |
|---|---|
| Dock host | `#fv-root` |
| Store | `listBook` |
| TV bridge | `fv_change_symbol`, `fv_request_symbol`, `fv_symbol_response` |
| EQ dump | `boardBook` |
| Prices | `quoteDesk` |
| Cloud | `cloud/` + `fv_list_book` |

---

## 13. Load order

1. Paint open list from disk.
2. Yahoo that list only.
3. If Cloud session: pull if remote is newer.
4. Other lists stay names-only until opened.

---

## 14. Getting started (contributors)

No build step. Plain JS (ES modules), loaded as-is. There is no `package.json` / linter in this folder.

1. Clone or copy this folder. *(Public repository URL not set yet.)*
2. `chrome://extensions` → Developer mode → **Load unpacked** → folder with `manifest.json`.
3. Open TradingView (`www`, `in`, or `es`), Screener.in, or Chartink. Dock mounts on the right.
4. After edits: **Reload** on the extension card, then reload the site tab. Worker: card → **Service worker → Inspect**. Popup: right-click icon → **Inspect popup**.
5. Storage: `chrome.storage.local.get(null, console.log)` in the worker console.

---

## 15. Module map

Entry = each folder's `index.js` unless noted.

| Folder | Known files | Called by | Talks to |
|---|---|---|---|
| `shell/` | `boot.js`, `mount.js`, `page.css`, `site-gate.js`, `page-layout.js`, `tv-layout.js`, `theme.js` | Manifest `content_scripts` | `lists`, `ingest`, `quotes`, `cloud`, `sites/*`, `persist` |
| `persist/` | `index.js` | All domains | `chrome.storage.local` |
| `lists/` | `book.js`, `backup.js`, `bulk.js`, `render.js` | `shell`, `ingest`, `cloud` | `persist` |
| `ingest/` | `index.js`, `csv.js`, `split.js`, `log.js` | `shell` | `lists`, `listings` |
| `listings/` | `board-book.js`, `board-fetch.js` (`getBoardBook`, `preferNseThenBse`) | `ingest`, `sites/*` | Background (Fyers), `persist` (`fvBoardBookV6`) |
| `quotes/` | `index.js` (`quotesForOpenListOnly`) | `shell` | Background (Yahoo) |
| `sites/charts/` | `index.js`, `page-bridge.js` (MAIN) | `shell` | Page via `fv_*` events |
| `sites/screener/` | `index.js`, `url.js` | `shell` | Page DOM / URL |
| `sites/chartink/` | `index.js`, `url.js` | `shell` | Page DOM / URL |
| `sites/fishrs/` | `index.js` | `shell` | Page DOM |
| `cloud/` | `index.js`, `sql.js` | `shell` | Background `FV_CLOUD_HTTP`, `lists`, `persist` |
| `shared/` | `isolate-keys.js`, `yahoo-http.js` | `shell`, `quotes` | — |
| `background/` | `index.js` (module worker) | Messages from content scripts | Yahoo, Fyers, `*.supabase.co`, help tab |
| `popup/` | `popup.html`, `popup.js` | Toolbar icon | `persist` (`fvPanelOn*`) |
| `help/` | `index.html`, `help.css`, `help.js`, `images/` | Background (Help button) | Reads `fvTheme` only |

`web_accessible_resources` exposes module folders to the three site families so `boot.js` can load them. A new module folder must be added there.

Site gate: `shell/site-gate.js` (`panelAllowedHere()`). Compact CSS: `shell/web-dock-css.js` when the host is Screener or Chartink.

---

## 16. Data flow

**Edit a list**

```
dock click → lists/book.js saveBook → normalizeBook → chrome.storage.local fvListBook
  → storage.onChanged → shell repaint (all tabs)
  → cloud (if session): wait ~2s → background FV_CLOUD_HTTP → *.supabase.co fv_list_book
     → fvCloudBookAt updated
```

**Quotes**

```
shell (open list) → quotes quotesForOpenListOnly → background FV_YAHOO_JSON (Yahoo crumb + JSON)
  → symbol-level session cache (fvYahooSymCache, 45s, all tabs) / whole-URL cache
  → CMP / % / Mcap → paint only (45s session cache only, never persisted). Every 60s; stops when dock closed.
```

**Add by name**

```
ingest (paste / CSV) → listings getBoardBook (seed → fvBoardBookV6 → Fyers via background, 24h)
  → preferNseThenBse → lists saveBook
```

**TV chart**

```
row click → sites/charts changeListing → fv_change_symbol → page-bridge (MAIN)
  → changeSymbol / setSymbol (no reload)
Current → askCurrentListing → fv_request_symbol → page-bridge → fv_symbol_response → pro_name (drop BATS/CBOE/CBOEONE)
```

**Cloud return**

```
tab visible / load / [cloud] Sync (linked) → cloud pull → remote updated_at newer than fvCloudBookAt? → replace fvListBook
Connect (first or 7-day gap, lists differ) → Use cloud / Keep this browser / Keep both
Watchlist cloud line: short words + Sync. Network fail keeps the session (retry Sync). A failed probe does not store Database not ready. Dead refresh token → Not connected (Connect again).
Restore Backup while linked → apply file locally → 2s push replaces cloud.
```

Network goes through the worker. MV3 content scripts fetch with the page origin (CORS). The worker holds the host permissions.

---

## 17. Messages and events

| Name | Kind | From → To | Purpose |
|---|---|---|---|
| `fv_change_symbol` | Page event | Isolated `sites/charts` → MAIN `page-bridge.js` | Switch TV symbol |
| `fv_request_symbol` | Page event | Isolated → MAIN | Ask current TV symbol |
| `fv_symbol_response` | Page event | MAIN → isolated | Current symbol result |
| `fv_open_chart_result` | Page event | MAIN → isolated | Open-chart helper result |
| `FV_CLOUD_HTTP` | Runtime message | `cloud/` → background | Supabase HTTP, `*.supabase.co` only |
| `OPEN_CLOUD_HELP` | Runtime message | `shell` → background | Open `help/index.html` |
| `OPEN_SUPABASE` | Runtime message | `shell` → background | Open dashboard for the typed project URL |
| `FV_YAHOO_JSON` | Runtime message | `quotes/` → background | Quote JSON (`query1` / `query2`); `force` bypasses cache |
| `FV_BOARD_BOOK` | Runtime message | `listings/` → background | EQ symbol list |
| `FV_OPEN_TV` | Runtime message | `shell` → background | Focus or open a TV chart tab |
| `FV_CHANGE_SYMBOL` | Runtime message | background → content | Switch symbol in an existing TV tab |

Rules: all names `fv_*` / `FV_*` / `OPEN_*`. Never `tvf_*` (Chart Funda). Worker rejects non-`*.supabase.co` cloud URLs.

---

## 18. Storage schema

All in `chrome.storage.local`. Add new keys to `persist/` and to this table.

| Key | Shape | Written by | Cleared by |
|---|---|---|---|
| `fvListBook` | See §5 | `lists/book.js`, restore, cloud pull | Restore overwrites |
| `fvTheme` | `'dark'` \| `'light'` (Night / Day). Default `dark`. | `shell` | — |
| `fvPanelWidthTv`, `fvPanelWidthWeb` | px number (clamped §6) | `shell` resize | — |
| `fvDockMinimizedTv`, `fvDockMinimizedWeb` | boolean. Default `false`. | `shell` | — |
| `fvPanelOnTradingView`, `fvPanelOnScreener`, `fvPanelOnChartink`, `fvPanelOnFishRs` | boolean. Default `true`. | `popup` | — |
| `fvCloudUrl`, `fvCloudPublishableKey`, `fvCloudEmail` | string | `cloud` (Connect) | Delete Cloud Details |
| `fvCloudSession` | Auth JSON from `/auth/v1/token` (includes `access_token`; FishView may set `dbReady`) | `cloud` | Disconnect (session + `fvCloudBookAt` only), Delete Cloud Details (URL, key, email, session, bookAt) |
| `fvCloudBookAt` | remote `updated_at` string | `cloud` | Disconnect, Delete Cloud Details |
| `fvDiagLog` | `{ events: [...] }` last 500 cloud events | `cloud` | Oldest dropped; uninstall |
| `fvBoardBookV6` | `{ ts, map, live }` Fyers EQ book | `listings` / worker | Replaced after 24h live fetch |

**Never stored:** cloud password, stock lists inside `fvDiagLog`. Quotes live only in the ~45 s `chrome.storage.session` caches (§8) — never persisted to `local`.

**Cloud table** (same SQL as **Copy Setup SQL** and the help page):

```sql
create table if not exists public.fv_list_book (
  user_id uuid primary key references auth.users (id) on delete cascade,
  book jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.fv_list_book enable row level security;
-- policies fv_list_book_select / _insert / _update / _delete: auth.uid() = user_id
```

One row per Auth user. `book` = whole `listBook`.

Changing `listBook` shape: update `normalizeBook`, keep old books loading (local backups and cloud rows), and bump the key only if needed (see `fvBoardBookV6`).

---

## 19. Adding a site

1. **Manifest:** add host to `host_permissions`, the `shell/boot.js` `content_scripts.matches`, and `web_accessible_resources.matches`.
2. **Folder:** `sites/<site>/index.js`: Scan, row **+**, Current. No imports from other site folders.
3. **Gate:** new `fvPanelOn<Site>` key in `persist/`, toggle in `popup/`, host in `shell/site-gate.js`.
4. **Dock:** compact CSS in `shell/web-dock-css.js` / `mount.js`. Width/minimize: reuse `fvPanelWidthWeb` / `fvDockMinimizedWeb` unless it needs its own.
5. **Caps:** Scan **> 200** → reject all. Rows unlabeled. NSE then BSE.
6. **Docs:** update §1, §2, §10/§18, §11, README (supported sites, permissions, CWS justification), `PHASES.md`.

---

## 20. Testing

Automated: `node --test test/` — pure-module tests for `lists/book.js` (caps, name rules, `isNew` lifecycle, All Unique), `ingest/csv.js`, `quotes/hours.js`, `lists/backup.js`.

Manual, per release:

| Area | Check |
|---|---|
| Dock | Mounts on www/in/es TradingView, Screener, Chartink; page pushed; clamps; × / header click minimize; popup gate hides without a full reload |
| Lists | 51st list refused; bad / duplicate name refused; 201st stock refused |
| Labels | Label sort unlabeled last both ways; last filter tick stays; none → all on |
| Bulk | 500ms long-press; 31st refused; copy/move add-what-fits, unlabeled |
| Ingest | Add 5 max, commas only; CSV 201 reject all; bare `RELIANCE` → NSE |
| Sites | Scan > 200 reject; Scan current vs new list; row +; Current from URL |
| Charts | Row click no reload; US Current → `NASDAQ:` / `NYSE:` |
| Quotes | Open list only; no poll when closed; Refresh retries (PHASES §6); Refresh bypasses shared cache; two tabs same list = one fetch |
| isNew | Add marks teal; >50 batch unmarked; click/right-click/long-press/Clear New clears; copy/move never mark |
| Backup | Round trip; restore overwrites |
| Cloud | Two browsers, same Auth user (PHASES §7); banners Cloud tab only; no password in storage |
| Help | Opens; follows `fvTheme`; Copy SQL |
| Coexist | Chart Funda installed |

---

## 21. Release

1. Bump `manifest.json` `version`. Update this file, `PHASES.md`, `WHATSNEW.md`, `CHANGELOG.md`, README.
2. Manifest `description` ≤ 132 chars, current (Web Store summary). Store copy lives in the README appendix.
3. Toolbar icons are in `icons/` and listed in the manifest. Dashboard promo tiles are in `store/` (not packed in the CRX).
4. Every permission used (`storage`, `alarms` for first Fyers dump retry). Do not re-add unused `scripting`.
5. Zip with `manifest.json` at root; exclude `.git`, old zips. Include `help/` (HTML, CSS, JS, images). Load the zip unpacked; run §20.
6. Upload to Chrome Web Store. Privacy: https://sites.google.com/view/fishviewwatchlist-privacy . Support: nijeethfish@gmail.com. Copy: README appendix. Screenshots at publish.

---

## 22. Glossary

| Term | Meaning |
|---|---|
| Dock | FishView panel in `#fv-root` (shadow DOM) |
| Web | Screener + Chartink + Fish RS Board (shared width / minimize keys) |
| `listBook` | All lists + UI list state (`fvListBook`) |
| `boardBook` | NSE/BSE EQ symbol list (seed + Fyers) |
| `quoteDesk` | Yahoo quotes module |
| `pro_name` | TV's listing symbol (`NASDAQ:AAPL`) vs displayed feed (`BATS:`) |
| Caution banner | `BANNER` constant — delayed-data warning only |
| LWW | Last-write-wins (cloud) |
| Chart Funda | Separate extension (`tvf_*`). FishView must coexist |
| Fyers | Public symbol dump only. No broker account |

---

## 23. v2.0.0

**v2.0.0** is the current release (in development). Known issue: **Chartink website issue** on their chart window in Dark theme (stock row text). FishView offers **Use Chartink Day** on that screen only.

**At publish:** dashboard screenshots (you will add them). Privacy URL and support email are set. Cloud Backup stays hidden.
