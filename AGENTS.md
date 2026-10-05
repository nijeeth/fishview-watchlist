# Working notes

## Release tracking files

- `ROADMAP.md` — future plans. Items move Ideas → Planned → In progress, and are removed when shipped.
- `BUGS.md` — known bugs and their status (Open / In progress / Fixed awaiting release). When a release ships, fixed entries move into `CHANGELOG.md`.
- `WHATSNEW.md` — highlights for the current release only. Rewritten each release.
- `CHANGELOG.md` — updated **only when the user says a version is done and ready for the Chrome Web Store**. New releases are prepended as a new section; never rewrite or remove previous version text.
- `NEXT-RELEASE.md` — staging file for the in-development version. Everything changed since the last shipped release gets logged here as work happens; its contents are moved into `CHANGELOG.md`/`WHATSNEW.md` when the version is declared done.

## Project

Manifest V3 Chrome extension, no build step. Load unpacked from this folder to test; reload the extension and refresh the page after changes.

This folder is git-linked to `github.com/nijeeth/fishview-watchlist` (remote `origin`, branch `main`). Tag `v1-20261005` is the rollback point — `git checkout v1-20261005` restores the shipped v1.0.0 state.

## Test / verify

- Unit tests: `node --test test/` (pure modules: `lists/book.js`, `ingest/csv.js`, `quotes/hours.js`, `lists/backup.js`).
- Syntax check JS: `cat <file> | node --check --input-type=module -`
- Validate manifest: `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- Manual smoke checklist lives in `README.md` (For developers → How to test).

## Rules

- Before `git commit`, always ask for permission and list the files that will be committed.
- Never store the cloud password. All list mutations go through `lists/book.js` → `saveBook` → `normalizeBook`. Storage keys live in `persist/index.js`. Everything is namespaced `fv` (keys, `#fv-root`, `fv_*` events) to coexist with Chart Funda (`tvf_*`).
- Do not update `CHANGELOG.md`/`WHATSNEW.md` until the release is declared ready.
