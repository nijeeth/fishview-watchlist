# What’s new

**This version: v2.0.0** (see `manifest.json`).

This file is only the **current** release. Older versions stay in **[CHANGELOG.md](./CHANGELOG.md)**. What v1 includes in full is **[PHASES.md](./PHASES.md)**.

## v2.0.0

- **Fish RS Board** is now a supported site — compact dock, row `+` buttons, and Scan, with an on/off switch in the toolbar popup.
- **All Unique Stock** — a new view at the top of the list picker showing every unique stock across all your lists, with no stock limit. Nothing extra is stored, and it works offline. Deleting a stock here asks first, then removes it from every list.
- **Bigger lists** — each watchlist now holds up to **200** stocks (was 150). List names can be up to 25 characters and can include `+`.
- **Arrow keys** — Up / Down moves through your list and switches the TradingView chart, without touching TradingView's own watchlist.
- **New stocks stay highlighted** — stocks added via Add, Current, `+`, Scan or CSV (batches of up to 50) keep a teal tint until you interact with the row or press **Clear New** in the warning row. The highlight syncs to your other browsers via cloud sync.
- **Faster quotes** — prices are fetched once per stock and shared across all your tabs (even different lists), and the list dropdown no longer closes by itself during a price refresh.
- **Smoother bulk edit** — a smaller actions bar, and Copy/Move open the same floating destination picker as the right-click menu (with full list names on hover).
- **Safer imports** — importing a file whose name matches an existing list is refused instead of silently creating "Name 2".
- Numerous reliability, security and cleanup fixes across quotes, cloud sync, TradingView and the dock. The dock no longer appears on the TradingView Screener page.

Quotes are delayed (Yahoo, every 60 seconds, open list only) and are **not realtime**.

Known Chartink website issue: on Chartink’s **chart** window in their Dark theme, stock row text can be hard to read. On that screen FishView offers **Use Chartink Day**.
