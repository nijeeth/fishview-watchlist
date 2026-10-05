# Roadmap

Future plans. Items move Ideas -> Planned -> In progress, and are removed when shipped.

Restore point for v1: git tag `v1-20261005` (shipped 1.0.0 state, also on GitHub). `git checkout v1-20261005` brings it back.

## Shipped

- **v2.0.0 (2026-10-06)** — All Unique Stock view, Fish RS Board site, arrow-key chart navigation, 200-stock cap, 25-char names with `+`, compact bulk picker, 40+ stability/security fixes (B-, A-, T- series). Full details in `CHANGELOG.md` / `WHATSNEW.md`.
- **v1.0.0 (2026-09-30)** — first public release. Inventory in `PHASES.md`.

## Planned (after v2.0)

_Nothing yet._

## Ideas

- **RS column + column selector.** Add an "RS" (relative strength) column to the watchlist table — data source TBD (Fish RS Board feed, or computed from Yahoo history). Plus a **column picker** so the user chooses which columns are shown; **Label and Name are constant/mandatory** and always visible. Selection persisted under a new `fv*` storage key.
- **Scan on the TradingView Screener** (`in.tradingview.com/screener/`). Attempted in v2.0 Phase 4 and shelved (2026-10-05): the collector found no rows. Issues hit: the TV Screener grid is not a real `<table>` — first `table a[href*='/symbols/']` selector returned empty; a broadened collector trying `/symbols/` links, `[data-symbol]` attributes and `symbol=` chart links still did not work; TV virtualises the results grid so only the rendered window exists in the DOM (a scan would only see ~50 rows without a scroll-and-collect pass). Next attempt should inspect the live screener DOM for the actual row markup (likely `data-rowkey`/`tv-screener-table__*` classes or a virtualised cell structure) and consider scrolling the container while collecting.
- **All Unique Stock: Add behaviour.** When the user presses Add/Current/Scan while All Unique Stock is open, ask which list receives the stocks (or disable Add there).
- **All Unique Stock: show which lists a stock belongs to** (small badge or tooltip).
- **Optional host permissions** for future sites, so new sites do not disable the extension for existing users.
- **Shared TradingView locale support** (`uk.`, `jp.` and other subdomains).
- **Split `shell/mount.js` and `shell/list-ui-css.js`** into smaller modules.
- **Linter and CI** (`eslint`, `node --test` on push).
