# FishView Watchlist

**A stock watchlist docked beside TradingView, Screener.in and Chartink. Your lists stay on your computer, and cloud sync is optional.**

`Chrome extension` · `Manifest V3` · **v1.0.0** · Chrome **111+**

**Support:** [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com)  
**Privacy policy:** [https://sites.google.com/view/fishviewwatchlist-privacy](https://sites.google.com/view/fishviewwatchlist-privacy) · [PRIVACY.md](./PRIVACY.md)

- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- What’s in this version: [PHASES.md](./PHASES.md)
- What’s new in this version: [WHATSNEW.md](./WHATSNEW.md)
- Version history: [CHANGELOG.md](./CHANGELOG.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Cloud setup guide (pictures): [`help/index.html`](./help/index.html). In the extension: Cloud tab → **Help**.

---

## Overview

FishView Watchlist adds a **watchlist dock on the right side** of TradingView, Screener.in and Chartink. The dock does not cover the page. It **pushes the page aside** by adjusting its width and right margin, so the chart or screener stays fully visible.

You can keep up to **50 lists of 150 stocks each**. You can colour-label, sort, filter and bulk-edit rows, and add stocks by pasting, importing a CSV file or scanning a screener results page. On TradingView, clicking a row switches the chart to that stock without reloading the page.

Prices, % change and market cap come from Yahoo Finance. They cover **the open list only**, refresh **every 60 seconds** and are **not realtime**.

Everything is saved in your browser by default. You can also sync your lists to **your own** free Supabase project. FishView has no server of its own and **never stores your cloud password**.

---

## Table of contents

1. [Features](#features)
2. [Supported sites](#supported-sites)
3. [Screenshots](#screenshots)
4. [Installation](#installation)
5. [Quick start](#quick-start)
6. [User guide](#user-guide)
7. [Cloud sync (optional)](#cloud-sync-optional)
8. [Limits and caps](#limits-and-caps)
9. [Privacy and data](#privacy-and-data)
10. [Permissions explained](#permissions-explained)
11. [Known issues](#known-issues)
12. [FAQ and troubleshooting](#faq-and-troubleshooting)
13. [For developers](#for-developers)
14. [Contributing](#contributing)
15. [Licence](#licence)
16. [Disclaimer](#disclaimer)
17. [Appendix: Chrome Web Store listing copy](#appendix-chrome-web-store-listing-copy)

---

## Features

### Dock
- Right-side dock that **pushes** the page instead of covering it.
- **Watchlist** and **Cloud** tabs. The Watchlist cloud line shows a cloud icon, short status words, and **Sync**.
- **Resizable** by dragging the **left edge**. TradingView **220–420** px (default 350); Screener/Chartink **180–280** px (default 200), remembered separately. Below ~300 px on TradingView, pills shrink type (`data-narrow`) instead of wrapping taller.
- **Minimise** with the **×** button or by clicking the blue header. The dock shrinks to a mini bar. Click the mini bar to restore.
- **Night / Day** in the dock header. The Help page follows this setting.
- A compact layout (smaller text) on Screener.in and Chartink.
- Narrow dock: File **Import/Export** still opens; column headers stay opaque over scrolling rows. **Filter Applied** colour dots stay **10px**.
- **Turn the dock on or off per site** from the toolbar popup (no page reload required).

### Lists
- Up to **50 lists**, each with up to **150 stocks**.
- Create, rename and delete lists. The list picker is sorted A–Z.
- **Colour labels**: green, blue, orange and red, or unlabeled.
- **Sort** by name, price, % change, market cap or label, ascending or descending.
- **Filter** by label. Several labels can be on at once, and a row shows if it matches any of them.
- **Bulk select** up to 30 rows to label, copy, move or delete them together.
- **Local backup and restore** of all lists and labels as a JSON file.
- New installs start with a **Default** list (SBIN, HDFCBANK, RELIANCE) and a **Demo** list.

### Adding stocks
- **Paste / Add**: up to 5 symbols at a time, **comma-separated**, added to the open list.
- **CSV import** of `NSE:` / `BSE:` symbols into a new list, and **CSV export** of the open list.
- **Scan** a Screener.in or Chartink results table.
- **Row +** buttons next to stocks on Screener.in and Chartink.
- **Current** adds the stock you are looking at, from the TradingView chart or a Screener/Chartink company or stock page.
- Bare names such as `SBIN` are matched to **NSE first, then BSE**, using a bundled list of NSE/BSE equities that is refreshed from Fyers' public symbol list at most once every 24 hours.

### Charts (TradingView)
- **Click a row** to switch the TradingView chart in the same tab, without reloading.
- **Current** reads the chart's `pro_name`. US stocks are stored as `NASDAQ:` / `NYSE:`.
- Works alongside the *Chart Funda* extension, because FishView uses its own `fv_*` event names.

### Quotes
- **Price (CMP), % change and market cap** from Yahoo Finance.
- Covers the **open list only** and refreshes **every 60 seconds**. **Not realtime.** Quotes are not saved.
- A manual **refresh** (header icon) retries the open list. Nothing is polled while the dock is closed.
- A caution banner on the Watchlist tab reminds you that the data is not realtime.

### Cloud (optional)
- Sync your lists to **your own Supabase project**. FishView has no server.
- Your password is typed to connect and **never stored**.
- Changes sync about **2 seconds** after you edit. The latest copy is pulled when you come back to the tab.
- **Cloud Backup** is **hidden** (not offered). Use **Connect** to sync, and **Backup Local** / **Restore Backup** for a file on this computer.

---

## Supported sites

| Site | Addresses | What works there |
|---|---|---|
| TradingView | `https://www.tradingview.com/*`, `https://in.tradingview.com/*`, `https://es.tradingview.com/*` | Dock, lists, quotes, **row click switches the chart**, **Current** from the chart |
| Screener.in | `https://www.screener.in/*`, `https://screener.in/*` | Dock (compact), lists, quotes, **Scan**, **row +**, **Current** from the company page URL |
| Chartink | `https://chartink.com/*`, `https://www.chartink.com/*` | Dock (compact), lists, quotes, **Scan**, **row +**, **Current** from the stock page URL |

The dock loads only in the main page, not inside embedded frames. Chart switching is available only on TradingView. Screener.in and Chartink have no chart API that FishView can call. Other TradingView locales are not injected.

---

## Screenshots

Store screenshots (1280×800 or 640×400) and promo tiles go in `screenshots/` and `store/` (gitignored; upload in the dashboard, omit from the CRX). **Keep `help/` in git and in the zip** — Cloud tab Help needs those files.

---

## Installation

### From the Chrome Web Store

After the listing is live, add that URL here. Until then, use [Load unpacked](#load-unpacked-from-source).

### Load unpacked from source

1. Download or clone this repository.
2. In Chrome, go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the folder that contains `manifest.json`.
5. Open TradingView (or Screener.in / Chartink).

> Needs **Chrome 111+**. The TradingView bridge uses a `MAIN`-world content script. This is set as `"minimum_chrome_version": "111"` in `manifest.json`.

---

## Quick start

1. **Open** TradingView. The **FishView Watchlist** panel appears on the right with the **Default** and **Demo** lists.
2. **Click a row**, for example SBIN. The TradingView chart switches to it.
3. Click **Add**, type up to 5 symbols **separated by commas** (for example `TCS, INFY`), and confirm. They go into the open list. Spaces or newlines without commas are not accepted.
4. **Right-click** a row to give it a colour label.
5. Click **Backup Local** now and then to save a JSON copy of all your lists.
6. *(Optional)* Open the **Cloud** tab and follow **Help** to sync across computers.

---

## User guide

### The dock

| Action | How |
|---|---|
| Show or hide the dock on a site | Click the FishView toolbar icon (under the puzzle-piece menu, or pinned). Turn each site on or off in the popup. The dock hides or shows **without** reloading the page. |
| Minimise / restore | Click **×** or the **blue header**. The dock shrinks to a mini bar. Click the bar to restore. TradingView and Screener/Chartink remember this separately. |
| Resize | Drag the **left edge** of the dock (`#fv-resize`). |
| Switch tabs | **Watchlist** and **Cloud** |
| Theme | **Night / Day** in the dock **header**. The setting is saved and the Help page follows it. |

**Default and allowed widths**

| Site | Default width | Allowed range | Text size |
|---|---|---|---|
| TradingView | 350 px | 220–420 px | 14 px (buttons ellipsis below 300 px) |
| Screener.in / Chartink (shared) | 200 px | 180–280 px | 11 px (compact) |

### Lists

- **Pick a list** from the list picker at the top. It is sorted A–Z and shows 8 rows at a time.
- **New list:** click **+**.
- **Rename / delete:** click **⋮**.
- **List names** may contain letters, numbers, spaces and hyphens only, and must be unique.
- **Where it's saved:** all lists are saved in your browser automatically.
- **Loading:** only the open list loads prices. Other lists show their contents when you open them.

### Labels

- **Right-click a row** to choose **green, blue, orange, red**, or clear the label. Near the bottom of the dock the menu moves up so every item stays on screen.
- Rows that are **copied or moved** to another list arrive **unlabeled**.

### Sort and filter

- **Sort** by **Label**, **Name**, **Price**, **%Change** or **Mktcap** (the table columns), ascending or descending.
  - Sorting by label goes green → blue → orange → red, with **unlabeled rows always last**. Descending reverses the colour order. Rows with the same colour sort Z–A.
- **Filter by label.** Tick the colours you want to see, and "none" for unlabeled rows. A row shows if it matches any ticked label.
  - You can't untick the last remaining tick yourself.
  - If you close the filter with nothing ticked, every label is switched back on.

### Bulk select

1. **Press and hold a row for about half a second.** Checkboxes appear in the label column.
2. Tick up to **30** rows, or use the header checkbox to select all (up to 30).
3. Choose an action: **label**, **unlabel**, **copy to** or **move to** another list, or **delete**. Every bulk action asks you to confirm.
4. When you copy or move into a list that is nearly full, **only as many rows as fit** under the 150 limit are added.

### Adding stocks

| Method | Where | How it works |
|---|---|---|
| **Add** (paste) | All sites | Type or paste up to **5** symbols, **comma-separated**. They go into the **open list**. Bare names (e.g. `SBIN`) are matched to NSE first, then BSE. US stocks can be added with their exchange prefix, e.g. `NASDAQ:AAPL`. |
| **File → CSV import** | All sites | Imports a CSV of `NSE:` / `BSE:` symbols into a **new list**. A file with **more than 150** stocks is **rejected completely**. |
| **File → CSV export** | All sites | Saves the **open list** as CSV. |
| **Scan** | Screener.in, Chartink | Reads the stock links in the results table on the page. If it finds **more than 150**, nothing is added. You then choose **this list** (if there is room) or **a new list**. |
| **Row +** | Screener.in, Chartink | Click the **+** FishView adds beside a stock row to add that stock. |
| **Current** | TradingView, Screener.in, Chartink | Adds the stock you're viewing. On TradingView it reads the chart symbol. On Screener/Chartink it reads the company or stock page address. |

**CSV format.** Use only the `NSE:` or `BSE:` prefixes. US stocks can't be imported by CSV, so use **Add** or **Current** for them. Symbols must be **comma-separated** (newlines are allowed as well as commas). A first cell named `symbol`, `ticker`, `name`, `scrip`, `code` or `exchange` is skipped if it is not itself a prefixed symbol. Labels are not read.

```csv
NSE:SBIN,NSE:HDFCBANK,NSE:RELIANCE,BSE:RELIANCE
```

After CSV import or Scan, FishView may ask whether to save a **text import log** (`…-log.txt`).

**Duplicates.** A stock is identified by **exchange + ticker**, so `NSE:RELIANCE` and `BSE:RELIANCE` are two different rows.

### Using TradingView

- **Click a row** to switch the chart in this tab. The page does not reload.
- **Current** stores the symbol TradingView uses for the listing (`pro_name`), e.g. `NASDAQ:AAPL` or `NYSE:…`. On `in.tradingview.com`, the chart may *display* a **Cboe One / `BATS:`** feed for US stocks. FishView ignores that and never stores `BATS`, `CBOE` or `CBOEONE`.

### Backup and restore (local)

- **Backup Local** saves one JSON file with **all lists and labels**.
- **Restore Backup** loads such a file and **replaces everything** currently in FishView. Back up first if you are unsure. If cloud sync is **linked**, about **2 seconds** later that restored book is **uploaded and replaces the cloud copy** (no Use-cloud popup).

### Quotes

- Columns: **Price**, **%Change**, **Mktcap**, shown for the **open list only**.
- Updated from Yahoo **every 60 seconds**. **Not realtime.** Quotes are not saved.
- Indices show `-` for market cap. F&O and unrecognised symbols show `-`.
- Use the header **refresh** icon to retry the open list.
- The Watchlist caution line is **Careful: Not realtime. Prices from Yahoo every 60s** (at most two lines when the dock is narrow).
- Nothing is fetched while the dock is closed.

---

## Cloud sync (optional)

### What it is

Cloud sync keeps a copy of your watchlists in **your own Supabase project**. Supabase has a free plan. With it, the same lists appear on every computer where you install FishView and connect with the same details. **Without cloud sync, your lists stay on this computer.**

- **User-owned:** you create the Supabase project yourself. FishView has no server, doesn't host your stocks and can't see your database.
- **One table:** `public.fv_list_book` holds **one row per login**, containing your whole list book (all lists, stocks and labels). Row Level Security (RLS) means each login can only read and write its own row.
- **Sync:** about **2 seconds** after you change a list, the new copy is saved to your project (no extra “pending” status). When you return to the tab, or on load, FishView pulls the cloud copy if it is newer. The Watchlist **cloud line** shows a cloud icon, short words (no “Cloud” prefix), and **Sync** (refresh). **The newest copy wins** (last-write-wins). First Connect or a 7-day gap can ask Use cloud / Keep this browser / Keep both. **Restore Backup** while linked replaces this browser, then about 2 seconds later uploads and replaces the cloud copy.

### How to set it up

Follow the built-in picture guide: **Cloud tab → Help** (the file is [`help/index.html`](./help/index.html)). It takes about 15 minutes and has 6 parts:

1. Make a free Supabase account (steps 1–4)
2. Create your project (steps 5–6)
3. Add the watchlist table. In the Cloud tab, click **Copy Setup SQL**, then paste it into Supabase's SQL Editor and click Run (steps 7–9).
4. Make your FishView login under **Authentication → Add user** (steps 10–11)
5. Copy the **API URL** and the **Publishable key** (steps 12–15)
6. Paste them into the Cloud tab as **Supabase URL**, **Publishable key**, **Email** and **Password**, then click **Connect** (steps 16–17)

When it works, the Watchlist cloud line says **Connected** (and **Link Established** right after Connect). The Cloud tab still uses **Cloud connected** / **Cloud Link Established**. Empty URL/key/email: **Not configured**. Details saved but no session: **Not connected**. Signed in but table missing: **Database not ready** — run **Copy Setup SQL**. In-flight: **Connecting…**. Transport fail with session kept: **Network issue** — use **Sync**, not Connect. After the network is back, **Sync** should reconnect without asking for the password. Token rejected: **Not connected** — Connect again with password.

### Cloud tab buttons

| Button | What it does |
|---|---|
| **Connect** | Signs in to your project and starts syncing |
| **Disconnect** | Stops syncing in this browser. URL, key and email stay filled in. The session is cleared. |
| **Open Supabase** | Opens this project in the Supabase dashboard |
| **Help** | Opens the setup guide |
| **Copy Setup SQL** | Copies the SQL that creates the `fv_list_book` table and its RLS policies |
| **Log** | Downloads a `.txt` of local cloud events (HTTP status, connect/sync/restore). No lists, stocks, password, or tokens. If Cloud is not configured and nothing was logged, no file. After download: mail the file to nijeethfish@gmail.com if there is an issue. |
| **Delete Cloud Details** | Removes the saved URL, key, email and session from **this browser only**. Your Supabase project and the lists stored in it are not touched. |

Messages about connecting, disconnecting or deleting show **only on the Cloud tab** for about 8 seconds.

The Cloud tab help controls are a **2×2** grid: Open Supabase, Help, Copy Setup SQL, **Log**.

**Connect** may show three choices if this browser and the cloud copy differ (first Connect, or last sync **7 days** or older). **Use cloud** replaces this browser. **Keep this browser** uploads and replaces cloud. **Keep both** merges (same list name unions stocks; extra cloud lists are added; over 50 lists or 150 stocks, leftovers are skipped). Matching books skip the popup. Within 7 days, last-write-wins pull applies without the popup.

**Cloud Backup** is in the Cloud tab markup but **hidden**, so it is not shown as a dead control. **Connect** already syncs lists. For a file copy on this computer, use Watchlist **Backup Local** / **Restore Backup**.

### Security notes

- **Your password is never stored.** You type it to connect. The URL, publishable key, email and login session are saved in this browser so you don't have to re-enter them.
- Use the **Publishable key** (`sb_publishable_…`, or the legacy `anon` key on older projects). **Never** paste a **Secret key** (`sb_secret_…`) or `service_role` key into FishView.
- Keep **RLS switched on**. The setup SQL enables it and adds policies so each login can only access its own row.
- Three different passwords are involved, and only one is used in FishView:
  1. Your Supabase website login. Not used in FishView.
  2. The database password. Not used in FishView.
  3. **The Authentication user you create in the project. This is the one you type into FishView.**
- Cloud requests go only to `https://*.supabase.co`, which is the project address you enter.
- **Deleting your cloud data:** neither Disconnect nor Delete Cloud Details deletes the data stored in Supabase. To remove it, delete the row in Supabase (**Table Editor → `fv_list_book`**) or delete the project.

---

## Limits and caps

| Rule | Limit / behaviour |
|---|---|
| Lists | Max **50** |
| Stocks per list | Max **150** |
| Bulk selection | Max **30** rows |
| Add (paste) | Max **5** symbols per add, commas, into the open list |
| CSV import | **More than 150** stocks → the whole file is rejected. `NSE:` / `BSE:` prefixes only. |
| Scan | **More than 150** found → nothing added |
| Copy / move into a list | Adds only what fits under 150 |
| List names | Letters, numbers, spaces and hyphens. Must be unique. |
| Row identity | Exchange + ticker |
| Bare names | Matched to NSE first, then BSE |
| Quotes | Open list only, every 60 s, not realtime, not saved |
| Dock width | TradingView 220–420 px, Screener/Chartink 180–280 px |
| Cloud sync | About 2 s after an edit. Newest copy wins. |
| Local restore | Replaces all lists and labels |

---

## Privacy and data

FishView is **local-first**. There is **no FishView server**. The manifest's network permissions cover only the market-data sources below and, if you turn on sync, your own Supabase project. The extension contains no analytics, advertising or tracking hosts, and your data is not sent to the developer.

**Privacy policy (public):** [https://sites.google.com/view/fishviewwatchlist-privacy](https://sites.google.com/view/fishviewwatchlist-privacy)  
**Repo copy:** [PRIVACY.md](./PRIVACY.md)  
**Support:** [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com)

### Stored on your computer (`chrome.storage.local`)

| Key | What it holds |
|---|---|
| `fvListBook` | Your lists, stocks, labels, open list, label filter, sort order |
| `fvTheme` | `dark` / `light` (Night / Day) |
| `fvPanelWidthTv`, `fvPanelWidthWeb` | Last dock width (TradingView; Screener/Chartink) |
| `fvDockMinimizedTv`, `fvDockMinimizedWeb` | Whether the dock is minimised |
| `fvPanelOnTradingView`, `fvPanelOnScreener`, `fvPanelOnChartink` | Popup on/off setting per site |
| `fvCloudUrl`, `fvCloudPublishableKey`, `fvCloudEmail` | Cloud details you entered (only if you use cloud) |
| `fvCloudSession` | Your Supabase login session (only while connected). **Your password is never stored.** |
| `fvCloudBookAt` | Time of the last cloud copy, used to decide which copy is newer |
| `fvDiagLog` | Last **500** cloud events on this computer (status codes, connect/sync). No lists, stocks, password, or tokens. Cloud tab **Log** downloads a `.txt`. |
| `fvBoardBookV6` | Cached public list of NSE/BSE equity symbols |

Quotes are **not** stored. Uninstalling the extension removes this storage. **Delete Cloud Details** removes the cloud keys.

### What goes over the network

| Destination (from `host_permissions`) | When | What is sent |
|---|---|---|
| `query1.finance.yahoo.com`, `query2.finance.yahoo.com` | Every 60 s while the dock is open, for the open list | Ticker symbols for delayed quotes |
| `fc.yahoo.com`, `finance.yahoo.com` | As needed to obtain Yahoo’s crumb | Cookie / crumb Yahoo’s quote endpoints require, plus the usual request metadata |
| `public.fyers.in` | At most once every 24 hours | A download request for Fyers' public NSE/BSE equity symbol list. No personal data is sent. First-run retry uses `chrome.alarms`. |
| `*.supabase.co` (your project only) | Only after you enter cloud details and click Connect | Your Authentication email and password (to sign in; the password is not stored), then your list book (lists, stocks, labels) |
| `tradingview.com`, `screener.in`, `chartink.com` | When you visit them | FishView sends nothing to these sites. It reads the page you are on (the chart symbol, the page address, stock links in results tables) to add stocks, and draws the dock on the page. |

The Help page is packaged with the extension and loads no remote scripts, fonts or images. **Open Supabase** goes to `supabase.com/dashboard`.

### What FishView does not do
- It doesn't sell or share your data, and doesn't use it for advertising or creditworthiness.
- It doesn't store your cloud password.
- It doesn't read your browsing history or run on sites other than those listed above.
- It doesn't place trades or connect to any brokerage account. Fyers is used only as a public symbol list.

---

## Permissions explained

| Permission | Why FishView needs it |
|---|---|
| `storage` | Saves your lists, labels, theme, dock width and minimised state, per-site on/off settings, cloud connection details (never your password), a short local cloud event log (no lists or tokens), and a cached NSE/BSE symbol list, all in `chrome.storage.local`. |
| `alarms` | Retries the first Fyers NSE/BSE dump if it is not ready (`fvDumpFirst`). The 60 s quote cycle is an in-page timer, not this permission. |

`scripting` is **not** requested. Content scripts are declared statically in `manifest.json`.

| Host permission | Why |
|---|---|
| `https://www.tradingview.com/*`, `https://in.tradingview.com/*`, `https://es.tradingview.com/*` | Show the dock on TradingView. A small script in the page switches the chart symbol when you click a row and reads the current symbol for **Current**. |
| `https://www.screener.in/*`, `https://screener.in/*` | Show the dock on Screener.in, and support **Scan**, **row +** and **Current** from the company page. |
| `https://chartink.com/*`, `https://www.chartink.com/*` | Show the dock on Chartink, and support **Scan**, **row +** and **Current** from the stock page. |
| `https://public.fyers.in/*` | Download the public NSE/BSE equity symbol list (cached for 24 h) so bare names like `SBIN` resolve to the right exchange. |
| `https://query1.finance.yahoo.com/*`, `https://query2.finance.yahoo.com/*` | Fetch delayed price, % change and market cap for the open list. |
| `https://fc.yahoo.com/*`, `https://finance.yahoo.com/*` | Get the cookie / "crumb" that Yahoo's quote endpoints require. |
| `https://*.supabase.co/*` | Optional cloud sync with **your own** Supabase project. A wildcard is needed because each user's project has a unique subdomain (e.g. `abcd1234.supabase.co`). It is contacted only after you connect. |

**Not requested:** `tabs`, `history`, `cookies`, `identity`, `webRequest`, `<all_urls>`, `scripting`.

---

## Known issues

- **Chartink website issue (chart screen only):** Chartink’s Dark theme can make stock row text hard to read on their chart window. The rest of Chartink is unaffected. This is not a FishView theme bug. On that chart page, FishView offers **Use Chartink Day**, which switches Chartink’s own theme to Light. FishView Night/Day is unchanged.

---

## FAQ and troubleshooting

**The dock doesn't appear.**
Check that the site is switched on in the FishView toolbar popup. The dock only runs on the addresses in [Supported sites](#supported-sites), and only in the main page, not in embedded frames. A site toggle does not require a reload.

**Prices show `-`.**
This is normal for an index's market cap and for F&O or unrecognised symbols. For other stocks, click the header **refresh**. Quotes load only for the open list and aren't fetched while the dock is closed.

**Prices aren't live.**
They aren't meant to be. Quotes come from Yahoo every 60 seconds and are not realtime.

**My CSV was rejected.**
It probably has more than 150 stocks, no commas, or uses a prefix other than `NSE:` / `BSE:`. Split the file into smaller lists, and add US stocks with **Add** or **Current**.

**Add only took 5 symbols.**
Add accepts up to 5 at a time, comma-separated. Use CSV import for larger batches.

**I can't create another list.**
You may have reached 50 lists. Also check the name: it may contain only letters, numbers, spaces and hyphens, and must not match an existing list.

**I can't untick the last label filter.**
That is intentional, so the table never goes empty by accident.

**Restore wiped my lists.**
Restore replaces all current lists with the backup file. Keep recent backups.

**A US stock shows as `BATS:` or `CBOEONE:`.**
The row was saved by an older version. Delete it and add it again with **Current** or **Add**.

**Cloud: "Invalid login".**
Use the email and password of the user you created under **Authentication → Users** (step 11 of the guide). Don't use your Supabase website login or the database password.

**Cloud: "Invalid API key".**
Paste the **Publishable key** (`sb_publishable_…`) or the legacy `anon` key, never a secret or `service_role` key. Check for extra spaces.

**Cloud: table not found / database not ready.**
Run the setup SQL (guide steps 7–9) and look for "Success. No rows returned".

**Cloud: URL not accepted.**
Use only `https://<project>.supabase.co`, with no `/rest/v1/` and no spaces.

**I edited lists on two computers and lost changes.**
Sync keeps the newest copy of the whole list book (last-write-wins). Let one computer sync (about 2 s) before editing on another.

**Does FishView conflict with Chart Funda?**
No. FishView uses its own `fv_*` names, so both can be installed.

---

## For developers

### Project structure

Each domain folder has its own `index.js` entry, and the dock (`shell/`) calls those entries.

| Path | Owns |
|---|---|
| `manifest.json` | MV3 manifest (**v1.0.0**) |
| `config/` | Watchlist caution banner (`phase.js`) |
| `persist/` | `chrome.storage.local` keys |
| `lists/` | `listBook` CRUD, labels, sort, filter, caps, bulk (`bulk.js`), local backup JSON (`backup.js`), mutations (`book.js`) |
| `ingest/` | Paste, CSV import, export, bulk log |
| `listings/` | `boardBook`: Fyers EQ dump (bundled seed + 24 h live), NSE-then-BSE resolution |
| `quotes/` | Yahoo quotes for the open list (`quoteDesk`) |
| `shell/` | Dock: `boot.js` (content-script entry), `mount.js`, `page.css`, tabs, theme, resize, painting, clicks |
| `sites/charts/` | TradingView `fv_*` bridge + `page-bridge.js` (MAIN world) |
| `sites/screener/` | Scan, row +, company URL |
| `sites/chartink/` | Scan, row +, stock URL |
| `cloud/` | Supabase auth, `fv_list_book` read/write, 2 s push, pull on return |
| `shared/` | Key isolation (`isolate-keys.js`) |
| `background/` | Service worker (`index.js`): opens the Help page, Yahoo crumb/JSON, Fyers dump, `FV_CLOUD_HTTP` |
| `popup/` | `popup.html`: per-site dock toggles |
| `help/` | Cloud setup guide: `index.html`, `help.css`, `help.js`, step pictures in `images/` |
| `icons/` | `icon16.png` … `icon128.png`, plus SVG sources |
| `store/` | Store promo tiles (upload in the dashboard; omit from the CRX) |
| `PRIVACY.md` | Privacy policy (repo copy) |
| `CONTRIBUTING.md` | How to contribute |
| `ARCHITECTURE.md`, `PHASES.md` | Design docs and v1 shipped list |
| `WHATSNEW.md` | What’s new in the current version |
| `CHANGELOG.md` | History of every version |

### Architecture summary

```
Page (TradingView / Screener.in / Chartink)
  → content script shell/boot.js   (isolated world; skips iframes)
       → site gate (popup toggle for this host)
       → shell/mount.js → #fv-root (open shadow DOM), page pushed via --fv-dock-w
  → TradingView only: sites/charts/page-bridge.js (MAIN world; fv_change_symbol / fv_request_symbol)
Background service worker (background/index.js, ES module)
  → Yahoo crumb + quote JSON · Fyers symbol dump · FV_CLOUD_HTTP (only *.supabase.co) · opens help page
```

- **Load order:** paint the open list from disk → fetch Yahoo quotes for that list only → if there is a cloud session, pull if the remote copy is newer → other lists stay names-only until opened.
- **State:** `fvListBook` in `chrome.storage.local`. All mutations go through `lists/book.js` → `saveBook` → `normalizeBook`. `chrome.storage.onChanged` refreshes width, minimise state and `listBook` across tabs.
- **Cloud:** `public.fv_list_book (user_id, book, updated_at)` with RLS. Last-write-wins using `updated_at` / `fvCloudBookAt`.

The full design is in **[ARCHITECTURE.md](./ARCHITECTURE.md)** (including §14–23 for contributors). What shipped in **v1.0.0** is in **[PHASES.md](./PHASES.md)**. What’s new in this version is **[WHATSNEW.md](./WHATSNEW.md)**; older versions are in **[CHANGELOG.md](./CHANGELOG.md)**.

### Development setup

1. Clone or copy this folder.
2. Load it unpacked (see [Installation](#load-unpacked-from-source)).
3. After editing:
   - Content-script, shell or site changes: click **Reload** on the extension card in `chrome://extensions`, then reload the TradingView / Screener / Chartink tab.
   - Background changes: reload the extension. Inspect the worker via **Service worker → Inspect** on the extension card.
   - Popup: right-click the toolbar icon → **Inspect popup**.
4. Inspect storage from the service-worker console, e.g. `chrome.storage.local.get(null, console.log)`.

The source files don't describe a build step. The extension loads directly from the folder as plain JavaScript (ES modules). There is no `package.json` / linter in this folder.

### Coding rules

- **Namespace everything `fv`.** Storage keys `fv…`, DOM host `#fv-root`, TradingView bridge events `fv_*` (`fv_change_symbol`, `fv_request_symbol`), Supabase table `fv_list_book`. This lets FishView coexist with Chart Funda (`tvf_*`).
- **Module boundaries:**
  - `shell` does not import Yahoo code, `quotes` does not import Chartink code, and `cloud` does not import TradingView code.
  - Site folders (`sites/charts`, `sites/screener`, `sites/chartink`) never import each other.
  - Go through each folder's `index.js` entry.
- **List mutations** only through `lists/book.js` → `saveBook` → `normalizeBook`.
- **Never store the cloud password** in `chrome.storage`.
- **Cloud network calls** go through the background `FV_CLOUD_HTTP` handler, which is limited to `*.supabase.co`.
- **Quotes** are fetched for the open list only and never persisted.
- Do not copy names or pipelines from other watchlist products. Chart-switch and NSE/BSE dump *patterns* are allowed only with `fv_*` names.
- Extension pages (popup, help) use **external scripts only**, because MV3 blocks inline scripts.
- Keep `ARCHITECTURE.md`, `PHASES.md` and the README in step with the shipped product. On a version bump, update `WHATSNEW.md` (this version only) and add an entry at the top of `CHANGELOG.md`.

### How to test

No automated test suite. Use this manual checklist from `PHASES.md` and `ARCHITECTURE.md`:

- [ ] **Dock:** it appears on TradingView (www/in/es), Screener.in and Chartink and pushes the page. Resize is clamped (TV 220–420, web 180–280). × and header click minimise. Each popup toggle hides the dock on its site without a full reload.
- [ ] **Lists:** create, rename and delete. The 51st list is refused. Invalid or duplicate names are refused. The 151st stock is refused.
- [ ] **Labels / sort / filter:** label sort puts unlabeled rows last in both directions. The last filter tick can't be removed. Closing the filter with none ticked restores all.
- [ ] **Bulk:** a 500 ms long-press enters batch mode. The 31st selection is refused. Copy/move adds what fits and arrives unlabeled.
- [ ] **Ingest:** Add accepts 5 comma-separated symbols and refuses more. A CSV with 151 rows is rejected completely. Bare `RELIANCE` resolves to NSE.
- [ ] **Sites:** Scan with more than 150 adds nothing. Scan can target this list or a new list. Row + works. Current works from a Screener company URL and a Chartink stock URL.
- [ ] **Charts:** row click switches TradingView without reloading. Current on a US stock stores `NASDAQ:` / `NYSE:`, never `BATS` / `CBOE` / `CBOEONE`.
- [ ] **Quotes:** numbers appear on the open list only. Other lists aren't fetched until opened. Nothing is polled with the dock closed. Header refresh retries.
- [ ] **Backup:** Backup Local, then Restore Backup, round-trips all lists and labels, and restore overwrites.
- [ ] **Cloud:** with two browsers and the same Auth user, lists sync (about 2 s after an edit, pulled on return). Status and messages appear on the correct tabs. Delete Cloud Details clears URL, key, email and session. The password never appears in `chrome.storage.local`.
- [ ] **Help page:** it opens from the Cloud tab and follows Day/Night (`fvTheme`, read-only). Copy SQL works.
- [ ] **Coexistence:** works with Chart Funda installed.

### Packaging a release for the Chrome Web Store

1. Bump `"version"` in `manifest.json`, and update `ARCHITECTURE.md`, `PHASES.md`, `WHATSNEW.md`, `CHANGELOG.md` and the README.
2. Manifest already has `"icons"` and `action.default_icon` (`icons/icon16.png` … `icon128.png`). Store listing tiles live in `store/` (`small_promo_440x280.png`, `marquee_1400x560.png`); upload those in the dashboard, they are not required in the CRX.
3. The manifest `"description"` (132 characters max) already matches the short description in the [appendix](#appendix-chrome-web-store-listing-copy).
4. Build the zip from the repository root, with `manifest.json` at the **top level** of the zip. **Include `help/` (HTML, CSS, JS, images).** Do not strip help images with a `docs/*` exclude if those files live under `help/`.

   ```bash
   VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
   zip -r "fishview-watchlist-$VERSION.zip" . \
     -x '.git/*' '.github/*' '*.zip' '.DS_Store' '.gitignore' 'store/*' 'screenshots/*'
   ```

5. Test the zip: unzip it into a clean folder, **Load unpacked**, and run the checklist above.
6. Upload it in the Chrome Web Store Developer Dashboard. Licence: **MIT**. Privacy policy: [https://sites.google.com/view/fishviewwatchlist-privacy](https://sites.google.com/view/fishviewwatchlist-privacy). Support: [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com). Listing copy: [appendix](#appendix-chrome-web-store-listing-copy). Screenshots: add at publish.

---

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [PHASES.md](./PHASES.md).
2. Follow the [coding rules](#coding-rules), especially `fv_*` naming and module boundaries.
3. Keep changes small and focused, and describe how you tested them (see [How to test](#how-to-test)).
4. If you change behaviour, permissions, storage keys or hosts, update the README, ARCHITECTURE.md and PHASES.md in the same change. If the version number changes, rewrite `WHATSNEW.md` and add a `CHANGELOG.md` entry.
5. Don't add analytics, remote code or new hosts without discussion. They affect the Chrome Web Store privacy disclosures.

---

## Licence

[MIT](LICENSE). Copyright (c) 2026 **NijeethFish**. Support: [nijeethfish@gmail.com](mailto:nijeethfish@gmail.com).

---

## Disclaimer

- FishView Watchlist is a watchlist tool. **It is not financial advice** and doesn't recommend any security.
- Quotes come from Yahoo Finance, **update every 60 seconds and are not realtime**. They may be delayed, incomplete or wrong. Don't rely on them for trading decisions.
- FishView is **not affiliated with, endorsed by or sponsored by** TradingView, Screener.in, Chartink, Yahoo, Supabase or Fyers. All names and trademarks belong to their owners.
- Cloud sync uses **your own** Supabase account. You are responsible for that account, its security and its terms.

---

## Appendix: Chrome Web Store listing copy

### Short description (114 / 132 characters)

Chrome Web Store rejected a draft for **excessive keywords** (do not list TradingView, Screener.in and Chartink together, or stack Yahoo / Supabase / Fyers).

```
A stock watchlist dock beside your chart or screener. Lists stay on this computer. Delayed quotes. Optional sync.
```

This line is already the `manifest.json` `"description"`. The Web Store uses it as the summary.

### Detailed description

Paste this into the store **Description** field. **Do not name the three host sites in the listing.** Hosts stay in permission justifications and in the extension UI.

```
FishView Watchlist is a stock watchlist in a side panel. On the chart and screener pages it supports, the panel sits on the right and pushes the page aside instead of covering it, so the chart or table stays fully visible.

The toolbar popup turns the panel on or off for each supported site. The extension does not run on other websites.

LISTS
• Up to 50 watchlists with up to 150 stocks each
• Colour labels (green, blue, orange, red) and label filters
• Sort by name, price, % change, market cap or label
• Bulk select up to 30 rows to label, copy, move or delete
• Local backup and restore of all lists as a JSON file

ADD STOCKS
• Paste up to 5 symbols at once (comma-separated; bare names are matched NSE first, then BSE)
• Import a CSV of NSE: / BSE: symbols into a new list, and export the open list to CSV
• Scan a results table on a supported screener, or use the + button beside a row
• Current adds the stock you are viewing

CHART
• Click a row to switch the symbol in the same tab, without reloading the page
• US stocks are saved with their NASDAQ: / NYSE: symbol

QUOTES
• Price, % change and market cap for the list you have open, refreshed about every 60 seconds
• Quotes are delayed and not realtime

OPTIONAL CLOUD SYNC
• Sync lists between computers using a database project you create and control
• FishView has no server of its own
• The password is typed to connect and is never stored
• A step-by-step picture guide is built in

PRIVACY
• Local-first: lists are saved in your browser
• No analytics, no ads, no tracking

FishView Watchlist is not financial advice. It is not affiliated with, endorsed by or sponsored by the websites it runs on or the third-party services it contacts for quotes, symbols and optional sync.
```

### Single-purpose statement

Do **not** list the three host sites or other product brands here (same rejection as the listing description).

```
FishView Watchlist provides one feature: a stock watchlist panel on supported chart and screener pages, where users keep and organise lists of stocks, see delayed quotes for the open list, and optionally sync those lists to a database project they own.
```

### Permission justifications (dashboard fields)

Host fields **must** name the URLs. That is not the listing description. No new hosts were added for Log download, Connect choice, or dock UX (those use existing storage and the same cloud host).

| Field | Justification text |
|---|---|
| `storage` | Stores the user's watchlists, labels, display settings (theme, dock width, minimised state, per-site on/off), optional cloud details (never the password), a short local log of cloud events (no lists or tokens), and a cached public NSE/BSE symbol list in chrome.storage.local on their device. |
| `alarms` | Retries downloading a public NSE/BSE equity symbol list on first install if the live dump is not ready yet (alarm name fvDumpFirst). Quote refresh uses an in-page timer, not this permission. Does not read or send user data by itself. |
| Host: `https://www.tradingview.com/*`, `https://in.tradingview.com/*`, `https://es.tradingview.com/*` | Dock, switch chart on row click, Current reads the chart symbol. |
| Host: `https://www.screener.in/*`, `https://screener.in/*` | Dock, Scan, row +, Current from the page URL. |
| Host: `https://chartink.com/*`, `https://www.chartink.com/*` | Dock, Scan, row +, Current from the page URL. |
| Host: `https://public.fyers.in/*` | Public NSE/BSE symbol list (cached 24h) to match names to an exchange. No user data sent. |
| Host: `https://query1.finance.yahoo.com/*`, `https://query2.finance.yahoo.com/*`, `https://fc.yahoo.com/*`, `https://finance.yahoo.com/*` | Delayed quotes for the open list; cookie/crumb for those requests. |
| Host: `https://*.supabase.co/*` | Optional sync to the user's own project after Connect. Wildcard because each project has its own subdomain. Unused if cloud is off. |
| Remote code | No. All JavaScript is packaged with the extension. Network responses are treated as data and never executed. |

Do **not** declare or justify `scripting`.

### Data-usage disclosure (Privacy practices tab)

Suggested answers, based on the project files. **Review them before submitting.**

| Data type | Collected? | Notes |
|---|---|---|
| Personally identifiable information | **Yes, only if cloud sync is used** | The Supabase Authentication **email** is stored locally and sent to the user's own Supabase project to sign in. It is never sent to the developer. |
| Health information | No | |
| Financial and payment information | No | Watchlists are lists of stock symbols. There are no accounts, transactions, cards or balances. |
| Authentication information | **Yes, only if cloud sync is used** | The password is sent to the user's Supabase project to sign in and is **never stored**. The resulting session token is stored locally (`fvCloudSession`). |
| Personal communications | No | |
| Location | No | |
| Web history | No | Only the current page's address on Screener.in / Chartink is read, when the user clicks Current, to identify the stock. It is not stored or sent. |
| User activity | No | |
| Website content | **Yes (conservative)** | Stock symbols read from supported pages (chart symbol, page URL, results-table links) are saved in the user's watchlist, sent to Yahoo to fetch quotes, and synced to the user's own Supabase if enabled. |

**Certifications (all should be ticked):**
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**How this was built**

FishView Watchlist was developed with the help of generative AI tools and AI coding agents. All code was reviewed, tested and is maintained by **NijeethFish**. The extension itself does not use AI at runtime and sends no data to any AI service.

**Privacy policy URL:** https://sites.google.com/view/fishviewwatchlist-privacy  
**Support / contact email:** nijeethfish@gmail.com  
**Category:** Productivity
