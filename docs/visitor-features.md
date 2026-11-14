# Visitor features

Controls and behaviours for the people using a tour. Each one has a sensible default and can be switched off, or tuned, with a tour setting (`metadata.json`, or a language file) or, for the embed allowlist, an app setting (`app.json` / `manifest.app`). A visitor's own choices (speed, text size) are saved on their device only: in `localStorage`, never sent anywhere, never part of analytics.

| Feature | Default | Setting | Where |
|---|---|---|---|
| [Playback speed](#playback-speed) | on | tour `showPlaybackSpeed` | mini player, full player |
| [Stop search](#stop-search) | from 9 stops | tour `stopSearchThreshold` (default `8`) | above the stop list |
| [Text size](#text-size) | on | tour `showTextSize` | above the stop list |
| [Video subtitles](#video-subtitles) | none until you add them | stop `subtitles` | video stops |
| [Directions](#directions-open-in-maps) | on | tour `showDirections` | under stops with a `location` |
| [Embed allowlist](#embed-allowlist) | no limit | app `embedAllowlist` | embed stops |

Every setting has a field descriptor in `@audioguidekit/schema` (`FIELD_CATALOG`), so editors built on it pick them up. Interface texts are in all six built-in languages and can be overridden per language through `manifest.ui` (see [languages.md](./languages.md)).

## Playback speed

A button in the expanded mini player and in the full player steps through **0.75×, 1×, 1.25×, 1.5×, 2×** and back. The speed applies to the audio element (and stays when the next stop loads), is reported to the lock screen through Media Session (`setPositionState`), and is remembered per device (`agk-playback-speed`).

```json
{ "showPlaybackSpeed": false }
```

With `false` the control is gone and the tour always plays at 1×, whatever the visitor chose in another tour. Transition audio between stops plays at the chosen speed too.

## Stop search

A search field above the stop list, shown when the tour has **more than** `stopSearchThreshold` stops (default 8, so 9 stops and up). It filters as you type by stop title and text: body text (markup ignored), transcripts, headlines, quotes, captions and image descriptions. Case and accents do not matter, every word must be found, and the numbers on the cards keep their place in the tour.

```json
{ "stopSearchThreshold": 12 }
```

Use a very large number (for example `1000`) to never show it, `0` to show it on every tour. It is a labelled `type="search"` field inside a `search` landmark, Escape clears it, and a polite status line announces "3 stops found" or "No stops match your search." to screen readers.

## Text size

Three steps (default, large 1.15×, largest 1.3×) in a small group of buttons above the stop list. They scale rich text (stop texts, captions, credits), transcripts and the titles, headlines and quotes of the stop list. Controls, the header and the players keep their designed size.

It is a multiplier on top of the device's own text size: the player never sets a root font size, so the browser's or phone's text size setting still applies first. The step is remembered per device (`agk-text-size`).

```json
{ "showTextSize": false }
```

With `false` the control is gone and text is shown at the default step. Custom themes need no change: titles use the theme's font sizes, multiplied.

## Video subtitles

A video stop takes a list of WebVTT files; the browser's own captions menu offers them. None is switched on by default.

```json
{
  "id": "6",
  "type": "video",
  "videoUrl": "https://example.com/videos/timelapse.mp4",
  "subtitles": [
    { "src": "https://example.com/videos/timelapse.en.vtt", "srclang": "en", "label": "English" },
    { "src": "https://example.com/videos/timelapse.de.vtt", "srclang": "de", "label": "Deutsch" }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `src` | ✓ | URL of the `.vtt` file, no spaces |
| `srclang` | ✓ | BCP 47 language code: `en`, `pt-BR` |
| `label` | ✓ | Name in the captions menu |

- Serve the file as `text/vtt`. On another origin it needs CORS headers (`Access-Control-Allow-Origin`); the player then sets `crossorigin="anonymous"` on that video, so the **video** needs CORS headers too.
- **Offline:** "Download for offline" fetches the subtitle files with the video, and the service worker answers their requests from the download. Keep the `.vtt` extension in the URL, the worker recognises the files by it.
- Like the video file, subtitles belong to a language file when each language has its own.

## Directions (open in maps)

A stop with a `location` gets a **Directions** button. It opens a short list: Google Maps, Apple Maps and Waze, as plain `https` deep links to the stop's coordinates, opened in a new tab (a phone hands them to the installed app). Nothing is loaded or sent until the visitor taps a link. It works without the map view, and for every stop type, not only audio.

```json
{ "showDirections": false }
```

Coordinates outside the valid range (latitude -90 to 90, longitude -180 to 180) are ignored, so such a stop gets no button.

## Embed allowlist

An app-level list of hostnames. When it has entries, an embed stop of **any** type (`youtube`, `spotify`, `video`, `generic` or none) whose host is not on the list is not rendered, and the player shows a neutral notice ("This content is not available here.") instead, without the address.

```json
{ "embedAllowlist": ["maps.example.org", "*.widgets.example.net"] }
```

- `maps.example.org` matches that host only. `*.example.net` matches every subdomain, at any depth, but not `example.net` itself. Case does not matter; no scheme, port or path.
- It is added to the existing rules in `components/feed/embedSecurity.ts`, which still apply first: `https` only, never the player's own origin, generic embeds sandboxed with scripts only.
- An empty or missing list means no limit (so an editor that clears the list does not block everything).
- YouTube and Spotify are not exempt: to allow them when a list is set, add `www.youtube.com` (or `youtube.com`, `youtube-nocookie.com`, `www.youtube-nocookie.com`) and `open.spotify.com`. The list is checked against the host as written in `embedUrl`.
- The typed sandbox is tied to the host (see [Embed host rules](#embed-host-rules)), so the list cannot be bypassed by a wrongly typed embed.

## Embed host rules

The permissive sandbox of `youtube` and `spotify` embeds (`allow-same-origin`) is only given to their own hosts, over `https`:

- `embedType: "youtube"`: `youtube.com`, `www.youtube.com`, `youtube-nocookie.com` or `www.youtube-nocookie.com`. The player always frames it from `www.youtube-nocookie.com` (privacy-enhanced mode).
- `embedType: "spotify"`: `open.spotify.com`.
- Any other host with one of these types is downgraded to a generic embed: scripts-only sandbox, no media permissions, and subject to the allowlist. The schema cannot express this per type, so it is enforced by the player (`components/feed/embedSecurity.ts`).

## Analytics

Events are now sent every 60 seconds instead of every 10, and still go out the moment the tab is hidden or closed. See [analytics.md](./analytics.md#delivery).
