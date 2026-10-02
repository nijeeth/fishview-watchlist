# Changelog

All notable changes to FishView Watchlist are listed here, newest first. The version number matches `manifest.json`.

**This file** is the history. **[WHATSNEW.md](./WHATSNEW.md)** is only the current version. **[PHASES.md](./PHASES.md)** is the v1.0.0 inventory.

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
