# v1.0.0 — shipped

This is the **v1.0.0** product. All items below are in the extension. There are no unfinished phase stubs.

**What’s new in this version:** [WHATSNEW.md](./WHATSNEW.md)  
**History of versions:** [CHANGELOG.md](./CHANGELOG.md)

**v2.0.0 (planned):** Cloud Backup and Cloud Restore. The Cloud Backup control is in the Cloud tab markup but **hidden** in v1; Connect already syncs lists.

---

## Included in v1.0.0

**Dock.** Watchlist / Cloud tabs, left-edge resize, Night/Day in the header, page push. Title: **FishView Watchlist**.

**Lists.** 50 × 150, 4 colours + unlabeled, sort, filter, persist, Default + Demo, bulk select, local **Backup Local** / **Restore Backup** JSON.

**Charts.** `fv_*` bridge. Current / row click switches TV using `pro_name` (`NASDAQ:` / `NYSE:`). `BATS` / `CBOE` / `CBOEONE` are not stored.

**Ingest.** Paste Add max 5, comma-separated. CSV import (new list, NSE/BSE, 150 reject). Export open list. Optional txt import log.

**Screener + Chartink.** Scan (150 reject-all; current list or new list), per-row `+`, Current from URL. Compact dock; shared width. Chartink chart window in their Dark theme: website issue; dock offers **Use Chartink Day** on that screen only.

**Quotes.** Not realtime. Yahoo every 60s, open list only. Watchlist banner is the caution line (no “Phase 6” prefix). `config/phase.js` only drives that banner.

**Cloud.** Supabase URL, Publishable key, Email, Password. Connect / Disconnect / Copy Setup SQL / Help. `fv_list_book` + RLS. Sync ~2s; pull on return. Password not stored. Delete Cloud Details is this browser only. Cloud Backup / Cloud Restore: **v2**.
