# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Liturgical song archive PWA for Parrocchia Santa Chiara: lyrics, sheet music (Google Drive), YouTube links, and per-celebration song lists. Plain JavaScript (JSX, no TypeScript), React 19 + Vite + `vite-plugin-pwa`. UI text, comments and commit messages are in **Italian** — keep them that way.

## Commands

```bash
npm run dev       # Vite dev server (served under /canti-liturgici-santa-chiara/)
npm run build     # production build to dist/ (also generates the service worker)
npm run lint      # ESLint (flat config, eslint.config.js)
npm run preview   # serve the built dist/ — use this to test PWA/offline behaviour
```

There is no test suite. Deploy is automatic: every push to `main` builds and publishes to GitHub Pages via `.github/workflows/deploy.yml` (Node 20, `npm ci && npm run build`).

## Architecture

**No backend — Google Sheets is the database.** All content comes from a published Google Sheet read as CSV and parsed with PapaParse:
- `src/context/SongsContext.jsx` — song catalog (sheet `gid=0`). Columns: `ID`, `Titolo`, `Autori`, `Tag` (comma-separated), `Link Youtube`, `Spartito Originale`, `Spartito Modificato`, `Testo`, `Note`. Exposed via `useSongs()` as `{ songs, loading, error }`.
- `src/pages/DailySongsPage.jsx` — "Celebrazioni" schedule (sheet `gid=1649967796`). Rows reference songs by `Canto_ID`, grouped by a `Celebrazione` column (blank cells inherit the previous celebration). The parser also tolerates two legacy layouts (one column per Mass/Adorazione, or no celebration column) — preserve these fallbacks when editing it.
- `src/pages/SuggestPage.jsx` — song suggestions are POSTed to a Google Apps Script web app with `mode: 'no-cors'` (response is opaque; success is assumed).

Column names in the sheet are the contract; renaming a column there requires changing the mapping in code.

**Offline-first loading pattern** (used by both CSV fetches): render immediately from the raw CSV cached in `localStorage` (`cached_songs_catalog_csv`, `cached_celebrations_schedule_csv`), then fetch fresh data in the background and silently replace state only if the text changed; show an error only if there was no cache. Separately, Workbox in `vite.config.js` caches Google Sheets responses `NetworkFirst` with a 2.5s timeout and Google Fonts `CacheFirst`.

**Routing** uses `HashRouter` (required for GitHub Pages): `/`, `/song/:id` (case-insensitive ID match), `/daily?celebrazione=<name>` (shareable link; legacy `?messa=` also accepted), `/suggest`.

**Base path** `/canti-liturgici-santa-chiara/` is hardcoded in `vite.config.js` (`base`, manifest `scope`/`start_url`, icon `src`) and when building share URLs — keep all in sync if the repo/path changes.

**Lyrics markup** (`src/components/SongLyrics.jsx`): stanzas are separated by blank lines; a chorus is wrapped in `<RIT> ... </RIT>` (closing `<RIT/>` also accepted); an isolated `<RIT/>` or `</RIT>` renders as a "— Rit. —" repeat marker. Parsing is case-insensitive and deliberately tolerant of sheet editors' inconsistencies.

**Admin mode** (`src/context/AdminContext.jsx`) is a client-side PIN check against a SHA-256 hash, persisted as a flag in `localStorage`. It only unlocks UI (e.g. the "Spartito Modificato" link in `SongPage`) — it is not real security; don't put anything secret behind it.

**Other contexts/state**: `ThemeContext` (light/dark, `app_theme`), font size shared between song and celebration pages (`hymn_font_size`), last selected celebration (`active_celebration`). Song pages request a Screen Wake Lock. `IosInstallPrompt` shows Add-to-Home-Screen guidance on iOS Safari. Drive links are rewritten to `/preview` or `uc?export=download` URLs by extracting the file ID.

Styling is plain CSS in `src/index.css` and `src/App.css` (no CSS framework).
