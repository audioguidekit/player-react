# museum audio guide saas – product requirements

## 0. terminology

- **Tour** – a collection of stops (an exhibition, themed route, city walk, etc.).
- **Stop** – a single point within a tour, with audio, text, media, optional GPS.
- **Workspace** – organisation account (museum, gallery, tour provider).
- **Plans** – Free, Plus, Custom (see section 10).

Visitors **never log in**. Only creators (admins) have accounts.

### 0.1 deployment model

This platform consists of two distinct applications:

1. **Admin Platform** (workspace management)
   - Multi-tour management interface
   - Content creators (admins/editors) manage all their tours here
   - Free plan: 1 tour, Plus plan: 1 tour, Custom plan: unlimited tours
   - Single admin interface for all tours in a workspace

2. **Visitor App** (public-facing)
   - **One deployment = one tour** (each tour gets its own URL/app instance)
   - Each tour is deployed as a separate Progressive Web App
   - Visitors access tour-specific URL (e.g., `rome-tour.example.com` or `example.com/rome`)
   - Languages are configured per-tour from a global language pool
   - No multi-tour navigation within a single visitor app

**Example**: A museum with 3 tours (Ancient Rome, Renaissance Art, Modern Sculpture) would:
- Manage all 3 tours in one admin workspace
- Deploy 3 separate visitor apps, each at its own URL
- Each visitor app contains only one tour with its specific language set

---

## 1. content & asset management

### 1.1 tours

Tours represent curated sets of stops.

**Requirements**

- Create, edit, delete, duplicate tours.
- Add/remove stops to/from a tour.
- Reorder stops (drag & drop).
- Tour states:
  - **Draft** – not public.
  - **Published** – accessible via link/QR.
- **Scheduling**:
  - Optional start date and end date.
  - Before start / after end: tour is not accessible and shows a standard message.
- Per-tour **language configuration**:
  - Select from a global language pool (managed at platform level).
  - Define which languages this specific tour supports.
  - All stops in the tour follow this language set.
  - Each visitor app deployment includes only the selected languages for that tour.
- Per-tour **offline toggle**:
  - Offline support is **OFF** by default.
  - Creator can enable offline support for the tour.
- Publishing a tour generates:
  - Public URL for the visitor app deployment (one tour = one URL).
  - Tour-level QR code (directs to the tour's visitor app).
  - Stop-level QR codes for all stops in the tour.
- Each published tour requires its own visitor app deployment (separate URL/domain).

**Acceptance criteria**

- Admin/Editor can create a tour with name, description, welcome text and cover image.
- Admin/Editor can set availability dates; outside that window, visitors see:
  > “This tour is not available at the moment.”
- Publishing instantly activates URL + QR codes.
- Stops are shown inside the tour in the defined order.
- Offline toggle and scheduling settings are stored per tour.

---

### 1.2 stops

Stops are individual points in a tour.

**Fields**

- Title.
- Subtitle (optional).
- Short description.
- Long description.
- Audio files per language (based on tour language configuration).
- Images (optional).
- Video (optional).
- 3D models (optional, see 2.5).
- One **cover media** (image / video / 3D), shown at the top of the stop page.
- GPS coordinates (optional).
- Estimated visiting time (optional).
- Tags / categories (optional).
- Order inside each tour (a stop can belong to multiple tours).
- Language content follows tour languages (no custom language config per stop).
- Languages are selected from the global platform language pool, but each tour defines which subset it uses.

**Requirements**

- CRUD operations for stops.
- Stops can belong to one or more tours.
- Basic text editor:
  - paragraphs
  - bold
  - italic
  - hyperlinks
- Upload media (images, video, 3D models) to a stop.
- Select one media asset as the **cover**.
- All uploaded media (from tours and stops) appear in a global **Media Gallery**.

**Acceptance criteria**

- Admin/Editor can create, edit, delete, duplicate stops.
- Admin/Editor can assign a stop to one or multiple tours.
- Cover media appears at the top of the stop page in the visitor app.
- Text formatting (bold, italic, links) works as expected.
- Editing a stop updates all tours that use it.

---

### 1.3 audio upload

**Requirements**

- Supported formats: `mp3`, `wav`, `m4a`.
- Maximum duration per file: **20 minutes**.
- Enforce a maximum file size (exact limit to be defined).
- No server-side audio processing (no transcoding, no normalisation).
- Audio can be uploaded:
  - directly in the stop editor,
  - or via the Media Gallery and then attached to stops.
- Store metadata:
  - file name
  - format
  - duration
  - size
  - upload date

**Acceptance criteria**

- Invalid formats or files longer than 20 minutes are rejected with a clear message.
- Audio uploaded via the gallery is immediately attachable to stops.
- Audio uploaded in stop editor appears in the gallery as well.

---

### 1.4 audio transcription (optional)

> **Nice to have. Not required for initial release.**

**Requirements (optional)**

- Automatic transcription for any audio file.
- Transcription follows tour language configuration.
- Text appears in the stop editor for the given language.
- Admin/Editor can:
  - generate
  - edit
  - delete
  - regenerate transcription.
- Runs asynchronously.

**Acceptance criteria (optional)**

- Requesting transcription shows “processing” state.
- On success, text appears in the correct language field.
- On failure, error message + retry option.

---

### 1.5 text-to-speech (optional)

> **Nice to have. Not required for initial release.**

**Requirements (optional)**

- Generate audio from text for any supported tour language.
- Simple text input for script.
- Select voice (per provider options).
- Generated audio stored as a normal media asset.
- Admin/Editor can regenerate and preview.

**Acceptance criteria (optional)**

- TTS audio appears as selectable audio for a stop.
- Failures show a clear error and allow retry.

---

### 1.6 maps & gps

**Requirements**

- Each stop may have GPS coordinates (lat/lng).
- In the stop editor, show a **small preview map**:
  - pin showing current position.
  - ability to move pin or edit coordinates manually.
- In the tour view, show a map with all stops that have coordinates.
- Basic map interactions:
  - zoom
  - pan
  - tap a pin → open stop.

**Acceptance criteria**

- Stops with coordinates appear on the tour map.
- Stops without coordinates simply don’t appear on the map.
- Preview map updates when coordinates change.
- Tapping a pin opens the correct stop.

---

## 2. visitor app & offline experience

### 2.1 offline mode (per tour)

Offline mode behaviour:

- Configured **per tour**.
- Default: **OFF** for new tours.
- Available on all plans (Free, Plus, Custom).

**Requirements**

- When offline mode is enabled for a tour, visitors must **download the tour** before seeing the list of stops.
- Offline download includes for the **currently selected language only**:
  - text content
  - audio
  - images
  - videos
  - (3D models optional later)
- Download flow:
  1. Visitor opens tour link/QR.
  2. Sees **start screen** with basic info + **Download** button.
  3. After successful download, stops list becomes available.
- Only one tour can be downloading at a time.
- If a video file > 10 MB is part of the tour:
  - creator sees a warning when enabling offline mode.
  - they can still proceed (no hard block).
- If visitor is offline and tour does **not** support offline:
  - show:
    > “This tour isn’t available offline. Please connect to the internet to continue.”

**Acceptance criteria**

- Tour with offline enabled cannot be entered until download completes.
- Only one active download at a time.
- Only selected language is downloaded; switching language offline isn’t supported.
- Tour content is accessible and smooth when offline.
- Warnings for large media appear to creators when enabling offline.

---

### 2.2 audio player

**Requirements**

- Controls:
  - play / pause
  - optional 15s rewind/forward (can be added later).
- **No scrub bar** (no free seeking).
- Show:
  - stop title
  - cover media (if any)
  - elapsed time and total duration.
- **Persistent player**:
  - once playing, remains visible across the app.
  - audio continues while navigating between screens.
  - audio continues when device screen locks (subject to OS limits).
- Store last playback position per stop.
- A stop is considered **completed** when ≥ 85% of its audio has been played.
- Language switching loads appropriate audio file; if missing:
  > “Audio is not available in this language.”

**Acceptance criteria**

- Leaving and returning to a stop resumes playback from last position.
- Audio continues across navigation and screen lock.
- Stop completion state triggers at 85%.
- Missing language audio shows a clear message, not an error.

---

### 2.3 progress tracking

**Requirements**

- Track for each stop:
  - completion state (completed/incomplete).
  - last playback position (for resume).
- Progress is **local to the device** (no user login).
- Tour-level progress:
  - show percentage and visual progress bar.
  - calculation based on completed stops / total stops.
- Progress is language-independent.

**Acceptance criteria**

- When audio reaches 85%, stop becomes completed.
- Tour-level progress updates immediately.
- Progress persists across app restarts on same device.
- Changing language does not reset progress.

---

### 2.4 qr codes

**Requirements**

- Generate QR codes for:
  - each tour
  - each stop.
- Tour QR:
  - opens tour start screen.
- Stop QR:
  - opens specific stop.
- When offline and tour is downloaded:
  - scanning stop QR opens that stop inside offline tour.
- When offline and tour is not downloaded:
  - show offline-unavailable message.
- QR codes downloadable as PNG.
- No styling/branding of QR codes.

**Acceptance criteria**

- Publishing a tour auto-generates all needed QR codes.
- Scanning tour QR opens tour.
- Scanning stop QR opens correct stop.
- Behaviour respects tour availability (scheduled dates + publish state).

---

### 2.5 3d model support (optional)

> **Optional feature, not required for MVP.**

**Requirements (optional)**

- Stops may include 3D models.
- Supported formats:
  - GLTF / GLB
  - USDZ (iOS).
- In stop view, show “View 3D model” button.
- 3D viewer:
  - rotate
  - zoom
  - pan.
- If device can’t display model, show:
  > “This 3D model cannot be displayed on your device.”

**Acceptance criteria (optional)**

- Admin can upload 3D files and attach them to stops.
- Viewer works on supported devices.
- Unsupported devices show fallback.

---

## 3. admin accounts, workspaces & roles

### 3.1 authentication (creators only)

**Requirements**

- Login for creators only (no visitor login).
- Methods:
  - Google OAuth.
  - Email + password (with reset).
- After login, user lands on dashboard.

**Acceptance criteria**

- Login + logout work reliably.
- Password reset via email works.
- Visitor-facing app never shows a login prompt.

---

### 3.2 workspaces

**Requirements**

- Creating an account also creates a workspace.
- Workspace represents one organisation.
- Workspace settings:
  - name
  - legal link URL (for privacy, see 8.2)
  - plan (Free / Plus / Custom).

**Acceptance criteria**

- Admin can edit workspace name and legal URL.
- Plan is visible in workspace settings.

---

### 3.3 team & roles

**Plans impact teams:**

- **Free & Plus**: solo creator only. No invitations.
- **Custom**: full team support.

**Roles (for Custom plan workspaces)**

- **Admin**
  - full permissions incl. billing.
  - manage workspace settings.
  - invite/remove team members.

- **Editor**
  - manage tours, stops, media.
  - view analytics, feedback, visitors.
  - cannot manage billing or workspace-level settings.

- **Viewer**
  - read-only access to tours, stops, media, analytics, feedback, visitors.

**Requirements**

- For Custom workspaces:
  - invite users by email.
  - assign roles.
- Free & Plus:
  - no “invite team member” UI (one user only).

**Acceptance criteria**

- On Custom plan:
  - Admin can invite/remove members and set roles.
- On Free & Plus:
  - no team management screens visible.

---

### 3.4 account section (per creator)

**Requirements**

- Profile:
  - name
  - email
  - change password (for email-based login).
- Billing (only for Admin on Plus/Custom):
  - current plan
  - invoices
  - payment method
  - upgrade/downgrade/cancel.

**Acceptance criteria**

- Profile updates persist.
- Billing visible only for Admin on paid plans.

---

## 4. branding & white-label

### 4.1 custom branding (standard feature – Plus & Custom)

**Requirements**

- Workspace-level branding:
  - primary colour
  - secondary colour (optional)
  - logo upload (PNG/SVG).
- Applied to:
  - tour start screen
  - stop screens
  - player bar
  - offline download screen.
- If not set, default platform design is used.
- Available on **Plus and Custom** plans only.

**Acceptance criteria**

- Changing branding updates all tours in workspace.
- Free plan workspaces cannot access branding settings.

---

### 4.2 advanced branding & white-label (Custom plan)

> For Custom plan only.

**Requirements (for Custom)**

- Remove platform branding entirely.
- Custom domain support (e.g. tours.museum.com).
- Option to customise:
  - footer text
  - legal text (additional to workspace legal URL)
  - app icon (if applicable).

---

### 4.3 custom css per tour (Custom plan, advanced)

> For highest/custom plans only.

**Requirements**

- Per-tour CSS editor.
- CSS applies only within that tour container.
- Must not break admin UI.
- Basic safeguards:
  - no external imports
  - no injection of JS via CSS.
- Reset to default option.

**Acceptance criteria**

- Admin on Custom plan can edit tour CSS and see changes in preview.
- Visitors see customised look for that tour only.
- Reset works and restores standard branding.

---

## 5. publishing & sharing

### 5.1 publishing workflow

**Requirements**

- Per-tour publishing.
- Two states:
  - Draft
  - Published.
- Publishing:
  - activates public URL.
  - activates QR codes.
- Unpublishing:
  - deactivates URL and QR codes.
  - shows:
    > “This tour is not available at the moment.”
- Editors and Admins can publish/unpublish.
- Preview mode:
  - allows viewing the tour without publishing.

**Acceptance criteria**

- Publishing/unpublishing is a single action.
- Draft tours not accessible publicly.
- QR behaviour follows tour state.
- Preview is accessible from admin only.

---

### 5.2 sharing tools

**Requirements**

- For each **published** tour:
  - show public URL.
  - “Copy link” button.
  - QR codes accessible from same screen.
- Individual stops:
  - only QR-based sharing (no separate share link needed in this version).

**Acceptance criteria**

- “Copy link” copies public URL correctly.
- Sharing panel hidden for Draft tours.

---

## 6. analytics

### 6.1 basic analytics

Analytics is structured top-down: global → per tour.

**High-level (all tours)**

- Primary metrics (“north star”):
  - total visits across all tours (includes QR).
  - average tour completion rate (for tours that support it).
  - average rating (Plus & Custom only; Free doesn’t collect ratings).
  - total number of visitor emails (Plus & Custom only).
- Secondary:
  - total audio plays.
  - top tour by visits.
  - lowest completion-rate tour.
  - visits over time chart.

**Tour-level analytics**

- Visits (opens + QR scans) per tour.
- Tour completion rate.
- Average rating for that tour (Plus & Custom).
- Visitors (emails) collected from that tour (Plus & Custom).
- Number of downloads (if offline enabled).
- Visits/completions over time.

**Plan impact**

- **Free**:
  - basic visits only.
  - no ratings or visitor email metrics.
- **Plus & Custom**:
  - all metrics above.

**Filtering**

- Date range filters (global & per tour):
  - last 7 / 30 / 90 days.
  - custom range.

**Acceptance criteria**

- Global analytics view shows all-tours metrics.
- Clicking a tour shows its analytics detail.
- Filters work consistently.
- Free workspaces do not show metrics that depend on ratings/emails.

---

## 7. communication & audience features

### 7.1 ratings & feedback (Plus & Custom only)

**Requirements**

- Available for **Plus & Custom** workspaces only.
- Collected at tour level.
- Flow:
  1. After finishing tour (or via “Rate this tour” button).
  2. Visitor selects 1–5 stars.
  3. Optional text comment.
  4. Final screen asks for email (see 7.2).
- One rating per device per tour.
- Works offline:
  - stored locally if offline.
  - synced later via background sync.

**Acceptance criteria**

- Flow is simple and does not require login.
- On Free plan, rating UI is not shown.
- Admin can see ratings per tour in Feedback section.
- Offline ratings sync correctly when device comes online.

---

### 7.2 visitors (emails; Plus & Custom only)

**Requirements**

- Emails are collected as the final step of the rating/feedback flow.
- Email is optional.
- Each email stored with:
  - tour ID
  - timestamp.
- All emails appear in **Visitors** section in admin.
- Export to CSV (Admin + Editor).
- Free plan: no email collection.

**Legal link**

- Workspace settings include a **legal URL**.
- In email step of rating flow, show:
  > “By submitting your email, you agree to our [Privacy Policy](link).”
- If no URL is set, this line is hidden.

**Acceptance criteria**

- Emails collected only on Plus & Custom.
- Emails are visible in Visitors list with tour and date.
- CSV export works for Admin/Editor.

---

## 8. legal & compliance

### 8.1 accessibility

**Requirements**

- Support screen readers.
- Reasonable contrast in UI (branding must respect minimum contrast).
- Tap targets large enough.
- All images can have alt-text set in admin.
- App remains usable without complex gestures.

**Acceptance criteria**

- Basic accessibility checks pass.
- Tour creators can add alt-text to images.

---

### 8.2 gdpr

**Requirements**

- No visitor account system.
- Visitor data (rating, feedback, email) stored securely.
- Workspace-level **legal URL** field used in rating/email flow.
- Admin can:
  - view visitor data.
  - delete specific entries on request.
- Analytics is aggregated and does not identify individuals.
- DPA available to workspaces if needed.
- Custom domains: responsibility for public-facing legal/compliance text lies with the client; platform still handles storage safely.

**Acceptance criteria**

- Legal URL appears under email input in rating flow.
- Deleting a visitor record removes it from feedback & visitors sections.
- Tours include access to privacy / legal info (via menu or footer).

---

## 9. offline data & background sync (global)

Applies to **all visitor-side events**: analytics, ratings, feedback, emails, completions.

**Requirements**

- When offline:
  - all events stored locally with:
    - type
    - tour ID
    - (stop ID where relevant)
    - timestamp
    - payload (e.g. rating, email).
- Background sync:
  - app attempts to send queued events when:
    - connectivity changes from offline → online.
    - OS grants background execution time.
  - if background is not allowed by OS, sync happens next time app opens.
- Events must be idempotent (safe to retry):
  - each event has a unique ID.
  - server ignores duplicates.

**Acceptance criteria**

- Fully offline sessions are reflected in analytics once device is later online.
- Feedback & emails submitted offline appear in admin once synced.
- No noticeable duplicate entries from retries.

---

## 10. infrastructure

### 10.1 media storage & delivery

**Requirements (MVP)**

- Use cloud object storage (e.g. S3 or similar).
- Serve media over HTTPS directly from storage.
- Use consistent URL patterns or a media URL helper so CDN can be added later.
- Store metadata (type, size, duration, upload date, workspace ID).
- Set simple caching headers on media responses.

**Nice to have (later)**

- Add CDN in front of storage for performance at scale.

**Acceptance criteria**

- Media loads reliably for small–medium traffic.
- Adding CDN later does not require changing how media is referenced.

---

### 10.2 backend architecture

**Requirements**

- REST (or GraphQL) API for:
  - admin app.
  - public tour delivery.
  - offline sync endpoints.
- Authentication for admin endpoints:
  - Google OAuth
  - email/password.
- RBAC respecting plans and roles.
- Public endpoints are read-only and safe.
- Offline sync endpoints accept:
  - analytics events
  - ratings
  - feedback
  - visitor emails.
- Endpoints idempotent to handle retries.
- Pagination for lists (media, tours, visitors, feedback).
- Basic rate limiting.

**Acceptance criteria**

- Admin and visitor flows both perform adequately.
- Sync endpoints handle duplicate-retry safely.

---

### 10.3 device-side storage

**Requirements**

- Use appropriate local storage:
  - web: IndexedDB
  - native: SQLite/secure storage.
- Store:
  - downloaded tours
  - media references
  - progress
  - analytics/feedback/email events queue.
- Clear and safe cache handling (e.g. user can remove downloaded tours).

**Acceptance criteria**

- Offline tours work without network.
- Clearing a downloaded tour removes associated cached media but not analytics/feedback already synced.

---

### 10.4 performance & security

**Requirements**

- Reasonable response times:
  - public tour endpoints < ~300–500 ms under normal load.
  - admin UI < ~2s initial load.
- HTTPS everywhere.
- Data encrypted at rest.
- CSRF protection for admin.
- Input validation for uploads.
- Workspace data isolation.

**Acceptance criteria**

- No cross-workspace data leakage.
- Security basics (OWASP-style) are covered.

---

## 11. pricing plans & feature gating

### 11.1 plans

Tour limits refer to how many tours can be **managed in the admin workspace**. Each published tour requires its own visitor app deployment (separate URL).

#### Free

- 1 tour (in admin workspace).
- 1 visitor app deployment.
- Offline mode allowed.
- Platform branding visible.
- No custom branding.
- No ratings & feedback.
- No visitor emails.
- Basic analytics: **visits only**.
- QR codes.
- Single creator (no teams).

#### Plus (paid, fixed fee)

- 1 tour (in admin workspace).
- 1 visitor app deployment.
- Offline mode.
- Platform branding removed.
- Custom branding (logo, colours).
- Ratings & feedback enabled.
- Visitor emails enabled.
- Completion analytics and high-level KPIs.
- QR codes.
- Single creator (no teams).

#### Custom (enterprise)

- Unlimited tours (in admin workspace).
- Multiple visitor app deployments (one per tour).
- Offline mode.
- No platform branding.
- Advanced branding & white-label options.
- Custom domain per tour.
- Custom CSS per tour.
- Full analytics.
- Teams (Admin, Editor, Viewer).
- Higher storage quotas.
- Priority support and custom agreements.

---

### 11.2 feature gating table (summary)

**Note**: Tour counts refer to admin workspace management. Each tour = one visitor app deployment.

| Feature                      | Free          | Plus                | Custom                 |
|-----------------------------|---------------|---------------------|------------------------|
| Tours (admin workspace)     | 1             | 1                   | Unlimited              |
| Visitor app deployments     | 1             | 1                   | Multiple (one per tour)|
| Platform branding           | **Visible**   | Hidden              | Hidden                 |
| Custom branding (logo, UI)  | No            | **Yes**             | Advanced               |
| Custom CSS per tour         | No            | No                  | **Yes**                |
| Custom domain               | No            | No                  | **Yes**                |
| Offline mode                | **Yes**       | Yes                 | Yes                    |
| Ratings & feedback          | **No**        | **Yes**             | **Yes**                |
| Visitor emails (“Visitors”) | **No**        | **Yes**             | **Yes**                |
| Basic analytics (visits)    | Yes           | Yes                 | Yes                    |
| Completion/rating analytics | No            | Yes                 | Yes                    |
| Teams (multi-user)          | No            | No                  | **Yes**                |
| 3D models                   | Optional      | Optional            | Optional               |

---

# sanity check / contradictions resolved

From a senior-dev POV, key consistency points:

- **Visitors never log in** → all progress, ratings, emails are device-based + synced by event queue. ✅
- **Teams only on Custom plan** → section 3 now clearly scopes team management to Custom; Free/Plus are solo. ✅
- **Free plan has no ratings or emails** → analytics & communication sections now explicitly say those metrics/features are Plus & Custom only. ✅
- **Offline + background sync** → specified as best-effort within OS limits, with retries when app is foregrounded again. No magical “runs forever in background” promises. ✅
- **Branding vs pricing** → Free cannot change branding; Plus can; Custom adds domains + CSS. ✅
- **CDN** → no longer mandated; infra is CDN-ready but CDN is a later optimisation. ✅
- Old terminology **collections / POIs** fully replaced by **tours / stops** in the spec. ✅

From here, devs can turn this into:

- an ERD (data model),
- API spec,
- and frontend flows without running into conflicting instructions.

If you want, next step could be:  
**turn this into a Notion doc structure or API blueprint**, or **extract just the MVP slice** (what absolutely needs to be in v1).
