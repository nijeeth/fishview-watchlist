# Next Release — working notes

Everything changed since the live Chrome Web Store version (**1.0.0**). Add entries here as work happens.

When the version is declared done (only on the owner's word):

1. Move these entries into `CHANGELOG.md` under the new version number (prepend — never rewrite older sections).
2. Rewrite `WHATSNEW.md` with the user-facing highlights.
3. Move shipped items out of `ROADMAP.md` and fixed bugs out of `BUGS.md`.
4. `version` in `manifest.json` is already `2.0.0` — re-zip and upload to the store.

Restore point: git tag `v1-20261005` (shipped 1.0.0 state).

## Target: 2.0.0 — shipped 2026-10-06 (moved to CHANGELOG.md / WHATSNEW.md)

Plan and phases: see `ROADMAP.md`. Bugs: see `BUGS.md`.

### Added

- **Fish RS Board** (`fish-rs-board.pages.dev`) is a fourth supported site — compact dock, popup on/off toggle, per-row `+` buttons beside each symbol cell, and Scan (reads the `data-sym` table rows into a new list or the current one).
- **Arrow-key navigation** — Up/Down moves the selected row through the visible list (auto-scrolls) and switches the TradingView chart, anywhere on the page; it no longer moves TradingView's own watchlist. Still inactive while typing in any field (page or dock), in bulk select, or with a modal open.
- **All Unique Stock** — computed union view of every stock across all lists, always first in the list picker and the default on dock open. No stock cap; not stored or synced (works fully offline). Right-click: labels apply to all copies of the stock, Copy adds to a list, Move removes it everywhere and adds it to the target, Delete asks for confirmation ("Careful: … removed from ALL watchlists"). In this view Add/Current are disabled, Scan always creates a new list, bulk select is off, and the ⋮ list menu is disabled.
- List names may now include `+`.
- `node --test` unit-test suite in `test/` covering `lists/book.js`, `ingest/csv.js`, `quotes/hours.js` and `lists/backup.js` (23 tests).

### Changed

- Max stocks per list **150 → 200** (`STOCK_CAP`); CSV import and Scan now reject only files/pages with more than 200 symbols.
- List names limited to **25 characters** for new names and renames (allowed characters: letters, numbers, spaces, `-`, `+`). Existing longer names are kept.
- `yahooSymbol`: index/future-style tickers (`^NSEI`, `GC=F`) pass through to Yahoo unchanged; TradingView `_` form maps to Yahoo `-` form (e.g. `BRK_B` → `BRK-B`).
- Row hover highlight is now light yellow (was light blue); the same light-yellow hover applies to dropdown options, the File/⋮ menus, the label filter, and the right-click menu.
- The **File** button no longer shows the `▾` arrow.
- Caution banner text is now **WARNING: Delayed Price Data** (was "Careful: Not realtime. Prices from Yahoo every 60s").
- The bulk-actions bar is smaller (compact paddings, 26px buttons, 11-12px text) and its Cancel button is gone (Back and Esc still work). Bulk Copy/Move open the same floating destination menu as a row right-click (Back button, `+ Create new list…` form, bordered pick list) — the bar no longer grows with the number of lists. Esc now closes an open popover before leaving bulk mode.
- The credit bar is dark navy at header height (36px) with a blue top border and shows **Nijeeth** + **Fish** in teal accent only — same treatment in the toolbar popup footer.
- The table's Name column is narrower (42% → 32%), leaving more room for the price/%/Mcap columns.
- List picker tooltips show `name (count)` (was `name (count stocks)`).
- In All Unique Stock, Scan opens the destination popup with "Add to current watchlist" disabled (was: skipped straight to a new-list prompt); page `+` adds are blocked there with a "Pick a named list" notice. A successful first cloud Connect leaves All Unique Stock as the open view.
- CSV import refuses a file whose cleaned name matches an existing list (no more silent `Name 2`/`Name 3`), and `All Unique Stock` is now a reserved list name.
- Copy/Move destination rows (right-click and bulk) show the full list name on hover.
- Yahoo quote responses are shared across tabs through a 45 s in-memory cache in the service worker — the same open list no longer fetches twice.

### Fixed

- Dock listener leak: remounting the panel no longer stacks `storage.onChanged` listeners (B-03); pending cloud pushes and retries are cancelled on unmount (B-04).
- Cloud: failed pushes retry automatically with back-off (30 s → 10 min); pushes always use the freshest local book; pulls skip and heal the timestamp when the remote book is identical (B-05, B-06).
- Quotes: per-symbol fallback capped (25/cycle) and respects the 5-minute fail back-off on auto polls; no 60 s polling when session hours are unknown (B-07, B-13).
- Yahoo: crumb cached in `chrome.storage.session`, in-flight requests de-duplicated, retries on 401/403/429; request paths allowlisted (B-08, B-11).
- TradingView: open-chart waits for the chart to settle (4 s) instead of a fixed 1200 ms; `es.` tabs handled and chart URLs keep the user's locale (B-09, B-15).
- Security: single shared HTML escaper (`shared/escape.js`) covering `& < > " '`; cloud/backup list names go through `cleanListName` (B-10).
- Tickers: `^`, `=`, `_` allowed (index/futures symbols); the 3-identical-letters rejection removed; unknown `XXX:` prefixes rejected instead of mangled; `BOM:`/`NSI:`-style aliases honoured in paste (B-12).
- Popup: no longer resets the legacy minimise key on every open (B-16); dead label-filter branch removed (B-17).
- List picker: hovering a truncated list name or the picker button shows `name (count)` (B-02); the "New list" modal no longer pre-fills `List`, and the ctx-menu name field has no placeholder (B-19).

### Removed

- Build-phase scaffolding (`config/phase.js`, `shared/placeholder.js`, per-site `placeholder.js`, all `phaseLive`/`notBuilt`/`placeholderMessage` gates). Banner text is now a plain `BANNER` constant.
