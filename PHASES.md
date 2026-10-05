# v1.0.0 — first public release

This is the **v1.0.0** product. All items below are in the extension. There are no unfinished phase stubs.

**What’s new in this version:** [WHATSNEW.md](./WHATSNEW.md)  
**History of versions:** [CHANGELOG.md](./CHANGELOG.md)

---

## Included in v1.0.0

**Dock.** Watchlist / Cloud tabs, left-edge resize, Night/Day in the header, page push. Title: **FishView Watchlist**. TradingView width **220–420** px; Screener/Chartink **180–280**. Click the blue header or **×** to minimise. Narrow dock: File menu not clipped; sticky headers opaque; **Filter Applied** dots stay 10px.

**Lists.** 50 × 200, 4 colours + unlabeled, sort, filter, persist, Default + Demo, bulk select, local **Backup Local** / **Restore Backup** JSON. Right-click menu stays inside the dock (flips up near the bottom).

**Charts.** `fv_*` bridge. Current / row click switches TV using `pro_name` (`NASDAQ:` / `NYSE:`). `BATS` / `CBOE` / `CBOEONE` are not stored.

**Ingest.** Paste Add max 5, comma-separated. CSV import (new list, NSE/BSE, 200 reject). Export open list. Optional txt import log.

**Screener + Chartink + Fish RS Board.** Scan (200 reject-all; current list or new list), per-row `+`, Current from URL. Compact dock; shared width. Chartink chart window in their Dark theme: website issue; dock offers **Use Chartink Day** on that screen only.

**Quotes.** Not realtime. Yahoo HTTP quote endpoints every 60s, open list only. Watchlist banner: **WARNING: Delayed Price Data** (max two lines). Banner text lives in the `BANNER` constants in `lists/render.js` and `shell/mount.js`.

**Cloud.** Supabase URL, Publishable key, Email, Password. Connect / Disconnect / Copy Setup SQL / Help / **Log** (download `.txt`). `fv_list_book` + RLS. Sync ~2s; pull on return. Password not stored. Delete Cloud Details is this browser only. Watchlist status line (short words + **Sync**); Cloud tab keeps full **Cloud …** headings. Connect may ask Use cloud / Keep this browser / Keep both (first time or 7-day gap). Network fail keeps the session; **Database not ready** only if the table is missing. **Cloud Backup** is hidden; use **Connect** and **Backup Local** / **Restore Backup**.
