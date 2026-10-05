# Bugs

Known bugs in FishView Watchlist and their status. All fixes for **v2.0.0** have shipped and moved to `CHANGELOG.md` (entries B-01…B-20, A-01…A-09, T-01…T-05).

## Statuses

- **Open** — confirmed, not yet fixed.
- **In progress** — a fix is being worked on.
- **Fixed (awaiting release)** — fixed in source, ships with the next Chrome Web Store release.

When a release ships, move fixed entries out of this file and into `CHANGELOG.md` under that version.

## Open

_None._

## In progress

_None._

## Fixed (awaiting release)

_None._

## Accepted / documented (won't fix in v2.0.0)

- **H-03** Page-world CustomEvents (`fv_page_plus`, `fv_change_symbol`, `fv_symbol_response`) are spoofable by hostile page JS — a nonce is not a real secret over `document` events. Real fix would isolate emitters to extension contexts only.
- **M-02** Yahoo requests include the user's Yahoo cookies — required for the quote crumb flow.
- **L-04** Scan collectors read the rows currently rendered in the page DOM (no scroll-and-collect).
- **B-06 residual** — two tabs editing at the exact same instant can still last-write-wins race. Mark-clear (`isNew`) writes also push (debounced 2s) — same window; skipping the push would make cleared marks resurrect on the next pull.

## Not bugs (checked, closed)

- **B-14** [background] Stale instrument cache "only refreshed on demand": `bootDump` already refreshes a stale live cache on browser start, and a worker killed mid-fetch retries on the next `FV_BOARD_BOOK` request or the first-run alarm.
