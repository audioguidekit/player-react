# Analytics

The player can count visits anonymously. Nothing is sent to a third party, nothing identifies a visitor, and a visitor who asks not to be tracked is not counted. Events go to **one endpoint on the player's own origin** (`POST /e`).

## When it is on

| Build | Analytics |
|---|---|
| Manifest mode (`VITE_DATA_SOURCE=manifest`) | **On**, endpoint `/e`. The hosting platform's edge Worker receives it |
| Compiled mode (the default, what you get from this repo) | **Off.** Nothing is sent, stored or timed until you set `VITE_ANALYTICS_ENDPOINT` at build time |

A compiled build is unaffected unless you opt in, so existing self-hosted installs behave exactly as before.

### Switch it off

- **Per app:** set `"analytics": false` in `app.json` (compiled) or in the manifest's `app` object. Nothing is sent, even with an endpoint set.
- **Per visitor:** a browser that sends **Global Privacy Control** (`navigator.globalPrivacyControl`) or **Do Not Track** (`navigator.doNotTrack === "1"`) is never counted. The player does not even create a session id, a timer or an offline queue. This applies in every mode and cannot be overridden by configuration.

## What is sent

Batches of events as `POST /e`, `Content-Type: text/plain` (so `sendBeacon` and `fetch` behave the same and no CORS preflight is needed):

```json
{ "events": [ { "type": "stop_view", "sid": "k3J9x...", "tourId": "barcelona", "stopId": "3", "lang": "en" } ] }
```

At most 50 events and 4096 bytes per request, the Worker's limits. A queue larger than that is split into several requests.

| `type` | Sent when | Fields |
|---|---|---|
| `app_open` | The player starts | |
| `tour_open` | A tour screen opens (once per tour per visit) | `tourId`, `lang` |
| `stop_view` | A stop becomes the current stop (once per stop) | `tourId`, `stopId`, `lang` |
| `tour_start` | Audio plays for the first time in a tour | `tourId`, `lang` |
| `audio_play` | A stop's audio plays for the first time | `tourId`, `stopId`, `lang` |
| `audio_complete` | A stop's audio plays to its end | `tourId`, `stopId`, `lang`, `value` = seconds actually listened |
| `tour_complete` | The player's own completion rule is met: the tour's audio time is 100% complete (the same moment the "tour complete" sheet opens) | `tourId`, `lang` |
| `language_change` | The visitor picks another language | `tourId`, `lang` = the new language |
| `offline_download` | "Download for offline" finishes | `tourId`, `lang` |
| `feedback_submit` | The rating sheet is submitted. Once per device and tour (the "already rated" guard in localStorage) | `tourId`, `value` = rating 1-5, `comment` |
| `email_submit` | An address is submitted from an email stop or the rating sheet's email step | `tourId`, `stopId`, `lang`, `email`, `consent` |

Contract details the Worker enforces for the last two: a `feedback_submit` comment is at most 2000 characters (the player trims to that) and `value` is 1-5; `email_submit` carries `email` (one address, at most 254 characters) and `consent: true` (anything else is a 400), must be the **only** event in its request, and is limited to 5 requests per minute. The Worker keeps it out of event counts and stores it as a lead. The player therefore sends it on its own through `submitNow`, never in a batch or the offline queue, and `track('email_submit')` is a no-op.

The Worker, not the player, stamps the time and works out the coarse device class (`mobile`, `tablet`, `desktop`); the tenant comes from the hostname. The player sends no timestamp.

## Privacy guarantees

- **No cookies.** No localStorage entry either, apart from the existing "already rated" and progress data that never leave the device.
- **Session id:** 128 random bits, kept in `sessionStorage` (memory if that is blocked). It ends when the tab closes. There is no install id, no user id and no link between visits.
- **No fingerprinting:** nothing is read from the device except what the event itself needs. No IP address or User-Agent is stored by the Worker.
- **No third parties:** the endpoint is same-origin by default and the Worker rejects cross-origin posts.
- **Opt-outs honoured before anything starts:** GPC / DNT, `analytics: false`, or no endpoint means no requests, no timers, no IndexedDB.
- **Email addresses** are only sent when the visitor submits a form. That is an explicit action, not tracking, so it is not suppressed by GPC / DNT, but it needs an endpoint (manifest mode, or `VITE_ANALYTICS_ENDPOINT`). With no endpoint the email stop behaves as it always did: it shows the thank-you card and sends nothing. A stop with `consentText` shows a checkbox that must be ticked first, and the event carries `consent: true`. The rating sheet's email step always has an unticked consent checkbox (the text is the interface text `rating.emailConsent`, translatable like any other); "Subscribe" stays disabled until it is ticked, and "Skip" discards whatever was typed. The address is never put in the offline queue: if the send fails the visitor sees an error and can retry.

## Delivery

- Events are queued in memory and sent every 60 seconds, or once 20 are waiting. (It was every 10 seconds; the longer interval cuts requests to the edge on the free plan.) Nothing is lost by waiting: the next bullet flushes whatever is queued the moment the tab is hidden or closed.
- When the tab is hidden or closed (`visibilitychange` to hidden, `pagehide`) the queue goes out through `navigator.sendBeacon`, falling back to `fetch` with `keepalive`.
- When the device is offline, or the server answers with a network error or a 5xx, the events are kept in IndexedDB (`agk-analytics`) and sent when the browser fires `online`, and again at the next start. The store holds at most 500 events; beyond that the oldest are dropped.
- A 4xx answer (the server will never accept those events) drops them instead of retrying forever.

## Self-hosting the endpoint (OSS)

1. Run something that accepts the batches (below) on the same origin as the player, or on another origin that allows `POST` with `Content-Type: text/plain` from yours.
2. Build with the endpoint: `VITE_ANALYTICS_ENDPOINT=/e bun run build` (a full URL such as `https://stats.example.org/e` also works).
3. Check in the browser's network tab that requests go to your endpoint and stop for a browser with GPC on.

The receiver must:

- accept `POST` with a JSON body `{ "events": [...] }` (or a single event object) up to 4096 bytes and 50 events, whatever the `Content-Type`;
- validate `type` against the list above and answer `204`;
- answer `400` for a batch it will not accept, never `5xx`, so the player does not retry it;
- if it is on another origin, check the `Origin` header itself and answer the preflight-free simple request.

A minimal receiver is a few lines in any server. The reference implementation is the edge Worker in the hosted platform (`apps/edge`, `POST /e`).

## In the code

All of it is in `src/analytics/`:

- `contract.ts` the wire format and the validation the Worker applies (a bad id is dropped from the event, never sent)
- `batch.ts` the 50-event / 4 KB batching
- `config.ts` who decides whether it is on
- `emitter.ts`, `offlineQueue.ts`, `session.ts` queue, delivery, IndexedDB, session id
- `useTourAnalytics.ts` the tour-screen events; `index.ts` is the `track()` entry point
