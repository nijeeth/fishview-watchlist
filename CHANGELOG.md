# Changelog

All notable changes to FishView Watchlist are listed here, newest first. The version number matches `manifest.json`.

**This file** is the history. **[WHATSNEW.md](./WHATSNEW.md)** is only the current version. **[PHASES.md](./PHASES.md)** is the v1.0.0 inventory.

## 2.0.0 — 2026-10-06

Second public release. Restore point for v1: git tag `v1-20261005`.

### Added

- **Fish RS Board** (`fish-rs-board.pages.dev`) is a fourth supported site: compact dock, popup on/off toggle, per-row `+` buttons, and Scan of the results table.
- **All Unique Stock** — computed union view of every stock across all lists, first in the picker and the default view. No stock cap; not stored or synced (fully offline). Right-click: labels apply to all copies, Copy adds to a list, Move relocates it everywhere, Delete asks for confirmation ("removed from ALL watchlists"). Add/Current disabled, Scan always creates a new list, bulk select off.
- **Arrow-key navigation** — Up/Down walks the selection through the dock list and switches the TradingView chart, anywhere on the page; inactive while typing, in bulk select, or with a modal open.
- `node --test` unit-test suite in `test/` covering `lists/book.js`, `ingest/csv.js`, `quotes/hours.js`, `lists/backup.js`.

### Changed

- Max stocks per list **150 → 200**. List names: 25 chars, letters/numbers/spaces/`-`/`+`; `All Unique Stock` is a reserved name. Existing longer names kept.
- Banner text: **WARNING: Delayed Price Data**.
- Row and menu hover highlight is light yellow; bulk-actions bar is compact; Copy/Move (row and bulk) open a floating destination picker with Back and create-new-list; hover shows the full list name.
- The dock no longer mounts on the TradingView `/screener/` page.
- Credit bar is dark navy at header height (36px) with a blue top border — Nijeeth + Fish.
- Yahoo quote responses shared across tabs via a 45 s in-memory cache in the service worker; `All Unique Stock` view is kept after first cloud Connect.
- CSV import refuses a file whose cleaned name matches an existing list (no silent `Name 2`/`Name 3`).

### Fixed

- B-03/B-04 dock listener leak and pending cloud push on unmount. B-05/B-06 cloud push retry back-off + freshest-book push + fingerprint pull short-circuit. B-07/B-13 quote storm cap and weekend polling stop. B-08 Yahoo crumb persistence/dedup/retry. B-09 chart settle-wait. B-10 shared HTML escaper + cloud/backup name cleaning. B-11 request path allowlists. B-12 ticker charset `^ = _`, alias prefixes, unknown-prefix rejection. B-15/B-16 locale/minimise-key fixes. B-17 dead code. B-19 placeholder removed. B-20 dropdown no longer closes on quote refresh. B-18 all phase scaffolding removed.
- Audit: render ReferenceError (A-01), closed shadow DOM (A-02), Fish RS live toggle (A-03), resize listener leak (A-04), narrowed cloud proxy + sender check (A-05), observer debounce (A-06), AUS label/unknown-exchange normalise (A-07), import-name cap (A-08), stale WAR entry (A-09).
- Tester: T-01 import-name refusal + reserved `All Unique Stock`, T-02 All Unique after connect, T-03 picker hover titles, T-04 cross-tab quote cache, T-05 bulk long-press notice in All Unique.

### Removed

- Build-phase scaffolding (`config/phase.js`, `shared/placeholder.js`, per-site `placeholder.js`, all `phaseLive`/`notBuilt`/`placeholderMessage` gates).
- TradingView Screener results-table Scan was attempted and shelved (virtualised grid, no stable markup) — see `ROADMAP.md` Ideas.

## 1.0.0 — 2026-09-30

First public release.

- Watchlist dock on TradingView (`www` / `in` / `es`), Screener.in and Chartink; the page is pushed aside, not covered. TV width 220–420 px; click header or × to minimise.
- 50 lists × 150 stocks, colour labels, sort, filter, bulk edit. Filter-applied colour dots stay 10px when the dock is narrow.
- Add by paste (max 5, commas), CSV import/export (NSE/BSE; 151+ rejected), Scan and row `+` on Screener/Chartink, Current from the page.
- TradingView row click / Current uses `pro_name` (`NASDAQ:` / `NYSE:`). `BATS` / `CBOE` / `CBOEONE` are not stored. Row right-click menu stays in the dock.
- Delayed Yahoo quotes for the open list only, every 60 seconds. Not realtime. Caution banner max two lines.
- Optional user-owned Supabase sync. Password is never stored. Watchlist cloud line + **Sync**; Connect choice when lists differ (first / 7-day). Network fail does not drop the session. **Log** downloads a local `.txt` (no lists or tokens). Cloud Backup is hidden; use Connect and Backup Local / Restore Backup.
- Local Backup Local / Restore Backup JSON. Restore while linked then pushes the restored book to cloud after ~2s.
- Manifest short description avoids a brand-name keyword list (Chrome Web Store).
- MIT licence.
