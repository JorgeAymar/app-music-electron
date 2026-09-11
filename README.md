# Music Player (Electron)

A desktop app built with Electron to search and play YouTube music. No Google API key required: search is powered by `youtubei.js`, an unofficial client for YouTube's internal API.

## Requirements

- Node.js
- npm

## Install

```bash
npm install
```

## Run

```bash
npm start
```

A window opens with a search bar at the top and a grid of results. Clicking a result plays the video in an embedded player at the top.

## Project structure

```
main.js        Electron main process: creates the window, serves the HTML over a local HTTP server, and exposes search via IPC
preload.js     secure bridge (contextBridge) between the main process and the UI
index.html     UI structure (search bar, tabs, player, results)
renderer.js    UI logic: search, rendering results, playback, favorites
styles.css     styles
```

## Features

- **Search**: type a query and hit "Buscar" (or Enter). A sample search is preloaded on launch.
- **Playback**: clicking any result card loads the video in the embedded YouTube player, along with its thumbnail, title, and author.
- **Favorites**: the heart icon on each card saves or removes that song from favorites. The "❤ Favoritos" tab shows the saved list. Persisted in `localStorage`, so it survives app restarts.

## Technical decisions

- **`youtubei.js` instead of the official YouTube API**: avoids depending on an API key. The app first used `yt-search`, but that library broke while parsing certain search results (`TypeError: title.trim is not a function`) — it's a fragile scraper that's sensitive to changes in YouTube's HTML. `youtubei.js` talks directly to YouTube's internal API (Innertube) using JSON structures, which is more stable.
- **Local HTTP server instead of `file://`**: YouTube's embedded player rejects the `file://` origin with "Error 153". `main.js` spins up an HTTP server on `127.0.0.1` (random port) that serves the app's static files, and the window loads from there instead of using `loadFile`.
- **`contextIsolation` enabled**: the renderer has no direct access to Node; all communication with the main process goes through `preload.js` via `contextBridge`, following Electron's recommended security practices.
- **Content-Security-Policy**: a strict CSP is set via a `<meta>` tag, restricting scripts/styles/images/connections to trusted origins, as defense in depth against injected content.
- **DOM APIs instead of `innerHTML`**: search results come from YouTube (an untrusted source — a video title or channel name is attacker-controllable). Rendering them was switched from string-interpolated `innerHTML` to `textContent`/DOM element creation to prevent stored XSS.
- **Electron kept up to date**: the app pins an exact Electron version and is kept current with `npm audit` to pick up security patches for the underlying Chromium/Node runtime.

## Known limitations

- Search depends on YouTube's internal API (Innertube); if YouTube changes its format, `youtubei.js` may need an update.
- Some videos may not play in the embed if the content owner disabled playback on external sites.
