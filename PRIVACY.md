

# FishView Watchlist Privacy Policy

**Effective date:** September 29, 2026

**Last updated:** October 6, 2026 (v2.0.0 — added Fish RS Board site)

**Published page:** [https://sites.google.com/view/fishview-watchlist-privacy](https://sites.google.com/view/fishview-watchlist-privacy)

This privacy policy explains what information the FishView Watchlist Chrome extension ("FishView", "the extension", "we", "us") handles, where that information goes, and how you can control or delete it.

## In short

- **We (the developer) do not collect any of your data.** FishView has no server of its own. Nothing you do in the extension is sent to us.
- Your watchlists and settings are saved **in your own browser** on your device.
- To show prices, the **ticker symbols in the list you have open** are sent to **Yahoo Finance**.
- To match stock names to the right exchange, FishView downloads a **public list of NSE/BSE stock symbols from Fyers**. No personal data is sent.
- **Cloud sync is optional.** If you turn it on, your lists are synced to **your own Supabase project**, which you create and control. We have no access to it.
- **Your cloud password is never stored.**
- No analytics, no tracking, no ads, and we never sell your data.

## Who we are

FishView Watchlist is developed and published by **NijeethFish**.

If you have any question about this policy or your data, contact us at **nijeethfish@gmail.com**.

## What FishView Watchlist does

FishView Watchlist adds a stock watchlist panel (the "dock") to the right side of **TradingView**, **Screener.in**, **Chartink** and **Fish RS Board**. With it you can:

- keep up to 50 watchlists of up to 200 stocks each, with colour labels, sorting, filtering and bulk editing;
- add stocks by typing or pasting symbols, importing a CSV file, scanning a Screener.in, Chartink or Fish RS Board results table, using the "+" button beside a stock row, or using "Current" to add the stock you are viewing;
- click a stock on TradingView to switch the chart to it;
- see delayed price, % change and market cap for the list you have open;
- save and restore a backup file of your lists;
- optionally sync your lists between computers using your own Supabase project.

The extension runs only on TradingView, Screener.in, Chartink and Fish RS Board. It does not run on any other website.

## Information we collect

**We, the developer, do not collect, receive or store any of your information on our own servers.** FishView has no developer server, no user accounts with us, and no analytics, crash reporting, advertising or tracking services. We cannot see your watchlists, your settings, your cloud details or anything you do in the extension.

The rest of this policy explains the information that the extension keeps **on your device**, and the information it sends **directly from your browser** to the third-party services that make its features work.

## Information stored on your device

FishView saves the following in Chrome's local extension storage (`chrome.storage.local`) on your device. This storage is not synced by Chrome to other devices and is not sent to us.

- **Your watchlists:** list names, the stocks in each list (exchange and ticker, for example NSE:SBIN), colour labels, which list is open, and your sort and label-filter choices.
- **Display settings:** Day or Night theme, the width of the dock, whether the dock is minimised, and whether the dock is switched on for TradingView, Screener.in, Chartink and Fish RS Board.
- **A cached list of public stock symbols:** the public NSE/BSE equity symbol list from Fyers, used to match stock names to the right exchange. It contains no personal information.
- **Cloud sync details (only if you use cloud sync):** your Supabase project URL, your project's publishable key, the email address of the login you created in your Supabase project, your Supabase login session, and the time of the last cloud copy (used to decide which copy is newer).
- **A short diagnostic log (`fvDiagLog`):** recent cloud events on this device (for example Connect, Sync, HTTP status). It does not include your watchlists, stock symbols, password, or access tokens. It stays on this computer unless you use **Log** to download a text file and send it yourself (for example by email). If Cloud is not configured and no events were recorded, there is no log file.

**Your cloud password is never stored.** You type it only to connect.

**Prices are kept only in a short-lived session cache** (about 90 seconds) shared between your tabs, and are cleared when the browser closes. Price, % change and market cap are not saved long-term.

### Files you choose to save

**Backup Local** creates a JSON file containing all your lists and labels, and **CSV export** creates a CSV file of a list's stocks. These files are saved on your computer (for example, in your Downloads folder) and stay there. They are not sent to us or anyone else unless you share them yourself. **Restore Backup** and **CSV import** read only the file you pick.

## Information sent to third parties, and why

FishView connects only to the services below. It sends each one only what that feature needs. All connections use encrypted HTTPS.

### Yahoo Finance (prices)

- **What is sent:** the ticker symbols of the stocks in the watchlist you currently have open (converted to the format Yahoo uses). As with any web request, Yahoo also receives standard technical information such as your IP address and browser information, and any Yahoo cookies already in your browser. FishView also contacts Yahoo to obtain the cookie and "crumb" value that Yahoo requires before it will answer price requests.
- **When:** about every 60 seconds while the dock is open, and when you press the refresh button. Only the open list is sent. Nothing is requested while the dock is closed.
- **Why:** to show delayed price, % change and market cap. Responses are cached briefly (~90 s) in session storage shared across tabs, then discarded.
- **Addresses used:** query1.finance.yahoo.com, query2.finance.yahoo.com, fc.yahoo.com and finance.yahoo.com.

### Fyers (public stock symbol list)

- **What is sent:** a plain download request for Fyers' public NSE/BSE equity symbol file. No personal data, watchlist or account information is sent. Fyers receives only standard technical information that comes with any web request, such as your IP address.
- **When:** at most once every 24 hours. The downloaded list is cached on your device.
- **Why:** so that a name like SBIN can be matched to the correct exchange (NSE first, then BSE).
- **Address used:** public.fyers.in.
- FishView does **not** connect to any Fyers trading or brokerage account and cannot place trades.

### Your own Supabase project (optional cloud sync)

Cloud sync is off unless you set it up. To use it, you create your own free Supabase project, add a login to it, and enter the project URL, publishable key, login email and password in the extension's Cloud tab.

- **What is sent:** when you click Connect, your login email and password are sent to **your** Supabase project to sign in (the password is not stored). After that, your whole set of watchlists (list names, stocks and labels) is saved to one row in a table in **your** project, and the latest copy is read back from it.
- **When:** only after you click Connect. Changes are saved about 2 seconds after you edit a list, and the newest copy is fetched when you return to the tab.
- **Why:** so the same lists appear on every computer where you connect with the same details.
- **Address used:** only the project address you enter (your-project.supabase.co).
- **Who can see it:** the Supabase project belongs to you. **We have no access to it.** Your project's security rules (Row Level Security, set up by the provided setup script) allow each login to read and write only its own row. Supabase, the company, hosts your project and handles that data under your agreement with Supabase and Supabase's own privacy policy.

### TradingView, Screener.in, Chartink and Fish RS Board (sites where the dock runs)

FishView **does not send any information to these sites.** It draws the dock on the page and reads only what its features need, inside your browser:

- **TradingView:** a small script on the page reads the symbol of the current chart when you click **Current**, and switches the chart when you click a stock in your list.
- **Screener.in, Chartink and Fish RS Board:** FishView reads the stock links in results tables (to place the "+" buttons and to **Scan** a results table). On Screener.in and Chartink it also reads the address of the company or stock page you are on when you click **Current**, to work out which stock it is.

Stocks you add this way are saved in your watchlist on your device. Like any other list entry, their ticker symbols are then sent to Yahoo for prices (when that list is open) and to your own Supabase project if you use cloud sync. FishView does not record your browsing history and does not collect anything else from these pages.

### Google Chrome Web Store

FishView is installed and updated through the Chrome Web Store, which is run by Google. Google's handling of your information for installs, updates and reviews is covered by Google's own privacy policy, not this one.

## Permissions and why they are needed

- **storage:** saves your watchlists, labels, display settings, per-site on/off settings, optional cloud details (never your password), a short local diagnostic log of cloud events (no lists or tokens), and the cached public symbol list on your device.
- **alarms:** lets the extension schedule its own background tasks with Chrome's timer feature. It does not give access to any of your data.
- **Access to TradingView (www., in., and es. tradingview.com):** to show the dock, switch the chart when you click a stock, and read the current chart symbol for **Current**.
- **Access to Screener.in, Chartink and Fish RS Board:** to show the dock and support **Scan**, the "+" buttons and **Current**.
- **Access to public.fyers.in:** to download the public NSE/BSE symbol list (at most once a day).
- **Access to Yahoo Finance (query1/query2.finance.yahoo.com, fc.yahoo.com, finance.yahoo.com):** to fetch delayed prices for the open list and the cookie/"crumb" Yahoo requires.
- **Access to supabase.co addresses:** for optional cloud sync with your own Supabase project. A wildcard (`*.supabase.co`) is needed because every project has its own address. It is used only after you click Connect.

FishView does **not** request access to all websites, your tabs, browsing history, cookies, downloads, or your Google account.

## What we don't do

- We do **not** collect your data on our own servers. We have none.
- We do **not** sell, rent or trade your data.
- We do **not** share your data with anyone, except as described above to make the extension's features work.
- We do **not** use analytics, tracking, crash reporting or advertising services.
- We do **not** show ads or use your data for advertising, profiling, or to decide creditworthiness or lending.
- We do **not** store your cloud password.
- We do **not** read your browsing history or run on sites other than TradingView, Screener.in, Chartink and Fish RS Board.
- We do **not** place trades or connect to any brokerage account.
- We do **not** use remote code. All of the extension's code is included in the package reviewed by the Chrome Web Store. Data received from Yahoo, Fyers and Supabase is treated only as data and is never run as code.

## Chrome Web Store Limited Use

**FishView Watchlist's use of information adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.**

- Chrome Web Store User Data Policy: [https://developer.chrome.com/docs/webstore/program-policies/policies](https://developer.chrome.com/docs/webstore/program-policies/policies)
- Limited Use requirements: [https://developer.chrome.com/docs/webstore/program-policies/limited-use](https://developer.chrome.com/docs/webstore/program-policies/limited-use)

This means that information handled by the extension is used only to provide its single purpose (a stock watchlist beside TradingView, Screener.in, Chartink and Fish RS Board, with delayed quotes and optional sync to your own Supabase project); it is transferred to third parties only as described in this policy and only when needed for that purpose; it is never used or transferred for advertising, sold to data brokers, or used to determine creditworthiness or for lending; and no person (including us) reads it.

## Data retention and how to delete your data

**We keep nothing,** because we never receive your data.

Information on your device stays until you remove it:

- **Remove everything on this device:** uninstall the extension (right-click the FishView icon and choose "Remove from Chrome", or open chrome://extensions and click **Remove** on FishView Watchlist). Chrome deletes all of the extension's stored data.
- **Remove your cloud details from this browser:** open the Cloud tab and click **Delete Cloud Details**. This removes the saved Supabase URL, publishable key, email and session from this browser only. (**Disconnect** only stops syncing; it keeps your details filled in.)
- **Remove your lists stored in Supabase:** neither Disconnect nor Delete Cloud Details deletes anything in Supabase. To delete it, open your Supabase project, go to **Table Editor → fv_list_book** and delete your row, or delete the whole project. You can also delete your Supabase account under Supabase's own terms.
- **Remove individual lists or stocks:** delete them in the dock. If cloud sync is on, the change is synced to your Supabase project.
- **Backup and CSV files:** delete them from your computer like any other file.
- **Cached symbol list:** it is replaced automatically at most every 24 hours and removed when you uninstall.

Yahoo, Fyers and Supabase may keep request logs (for example, IP addresses) under their own policies. We do not control or receive those logs.

## Security

- All network connections made by FishView use HTTPS.
- Your cloud password is never saved. The saved session and details are kept in Chrome's extension storage on your device, which other websites cannot read. Anyone with access to your computer account could still use them, so keep your device secure and use **Delete Cloud Details** on shared computers.
- Use only your Supabase project's **publishable** key (or the legacy "anon" key) in FishView. **Never** enter a secret or service_role key.
- Keep Row Level Security switched on in your Supabase project. The provided setup script enables it so each login can access only its own row.
- You are responsible for the security of your own Supabase account and project.

## Children's privacy

FishView Watchlist is a general-audience tool for following stocks. It is not directed at children under 13 (or the minimum age in your country), and we do not knowingly collect information from children. As explained above, we do not collect information from anyone.

## Your choices and rights

Because all of your information stays on your device or in your own Supabase project, you are in full control of it: you can view, change, export or delete it at any time using the steps above. We hold no information about you, so there is nothing for us to access, correct or delete on your behalf. If you have a question or request, contact us at [contact email].

## Third-party services and their privacy policies

These services have their own privacy policies, which apply to information they receive:

- **Yahoo Privacy Policy** (price data): [https://legal.yahoo.com/us/en/yahoo/privacy/index.html](https://legal.yahoo.com/us/en/yahoo/privacy/index.html)
- **Supabase Privacy Policy** (your optional cloud sync project): [https://supabase.com/privacy](https://supabase.com/privacy)
- **FYERS Privacy Policy** (public symbol list): [https://fyers.in/privacy-policy](https://fyers.in/privacy-policy)
- **Google Privacy Policy** (Chrome and the Chrome Web Store): [https://policies.google.com/privacy](https://policies.google.com/privacy)

TradingView, Screener.in, Chartink and Fish RS Board have their own privacy policies for your use of their websites. FishView does not send them any information.

FishView Watchlist is not affiliated with, endorsed by or sponsored by TradingView, Screener.in, Chartink, Fish RS Board, Yahoo, Supabase or Fyers.

## Changes to this policy

If FishView's handling of data changes (for example, a new permission or a new service), we will update this policy and change the "Last updated" date at the top. For important changes, we may also mention them in the extension's Chrome Web Store listing or release notes. Please check this page from time to time.

## Contact us

Author: **Nijeeth Fish**

Email: **nijeethfish@gmail.com**
