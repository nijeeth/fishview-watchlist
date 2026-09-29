# Changelog

All notable changes to FishView Watchlist are listed here, newest first. The version number matches `manifest.json`.

**This file** is the history. **[WHATSNEW.md](./WHATSNEW.md)** is only the current version. **[PHASES.md](./PHASES.md)** is the v1 shipped inventory (unchanged name).

## 1.0.0 — 2026-09-29

First public release.

- Watchlist dock on TradingView (`www` / `in` / `es`), Screener.in and Chartink; the page is pushed aside, not covered.
- 50 lists × 150 stocks, colour labels, sort, filter, bulk edit.
- Add by paste (max 5, commas), CSV import/export (NSE/BSE; 151+ rejected), Scan and row `+` on Screener/Chartink, Current from the page.
- TradingView row click / Current uses `pro_name` (`NASDAQ:` / `NYSE:`). `BATS` / `CBOE` / `CBOEONE` are not stored.
- Delayed Yahoo quotes for the open list only, every 60 seconds. Not realtime.
- Optional user-owned Supabase sync. Password is never stored. Cloud Backup / Cloud Restore are v2 (hidden in v1).
- Local Backup Local / Restore Backup JSON.
- MIT licence.
