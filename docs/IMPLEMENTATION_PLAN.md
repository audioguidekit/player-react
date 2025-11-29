# Implementation Checklist for Museum Audio Guide SaaS

This checklist translates the `spec.md` requirements into actionable implementation steps. Tackle sections in order; each section lists concrete tasks that should be tracked in the backlog and mapped to engineering tickets.

## Scope

This implementation plan covers **both applications**:

1. **Admin Platform** - Multi-tour workspace management (sections 1-11)
2. **Visitor App** - Single-tour Progressive Web App deployment (see PWA_ARCHITECTURE.md)

**Key Architecture**:
- Admin manages multiple tours in one workspace
- Each tour is deployed as a separate visitor app (one tour = one URL)
- Languages are configured per-tour from a global platform pool
- See `spec.md` §0.1 for detailed deployment model

## 0. Discovery & Foundations _(spec §0, §10)_
- [ ] Confirm product scope, MVP boundaries, and success metrics with stakeholders.
- [ ] Finalise tech stack choices (frontend, backend, storage, analytics, hosting, auth provider).
- [ ] Define environments (local, staging, production) and deployment pipeline.
- [ ] Establish coding standards, linting/formatting rules, and CI/CD pipelines.
- [ ] Produce domain model / ERD covering workspaces, tours, stops, media, analytics events, ratings, visitors, plans, roles.
- [ ] Define RBAC matrices for Admin/Editor/Viewer and plan enforcement strategy in backend + UI.
- [ ] Draft API surface (REST/GraphQL) including admin, public delivery, and offline sync endpoints.
- [ ] Align on data retention, privacy, and security baselines (GDPR, encryption, logging, auditing).

## 1. Content & Asset Management
### 1.1 Tours _(spec §1.1)_
- [ ] Build CRUD API + UI for tours (name, description, welcome text, cover image, plan limits).
- [ ] Implement scheduling (start/end dates) with visitor-facing “not available” fallback.
- [ ] Add per-tour language configuration and validation for dependent stops.
- [ ] Add per-tour offline toggle with large-media warning logic.
- [ ] Support stop ordering (drag & drop) and persistence.
- [ ] Implement publish/unpublish flow that controls public URL + QR activation.
- [ ] Auto-generate tour-level QR code and store downloadable PNG.
- [ ] Ensure tour state (draft/published) enforced in visitor app & sharing UI.

### 1.2 Stops _(spec §1.2)_
- [ ] Build CRUD API + UI for stops with required fields (title, descriptions, media, metadata) and optional fields (Estimated visiting time, Tags/Categories).
- [ ] Enforce language data per tour configuration; handle multi-tour assignments.
- [ ] Implement rich text editor with bold/italic/link formatting.
- [ ] Support media upload & selection, including cover media designation.
- [ ] Integrate Media Gallery for shared asset reuse and listing.
- [ ] Ensure stop updates propagate to all associated tours and visitor data caches.

### 1.3 Audio Upload _(spec §1.3)_
- [ ] Validate upload formats (`mp3`, `wav`, `m4a`), max duration (≤20 min), and configurable file-size limits.
- [ ] Store metadata (name, format, duration, size, upload date, workspace ID).
- [ ] Surface descriptive errors for invalid uploads in UI.
- [ ] Sync uploads between stop editor and Media Gallery views.
- [ ] Explicitly avoid server-side transcoding/normalisation; rely solely on validation + storage per spec.

### 1.4 Audio Transcription (Optional) _(spec §1.4)_
- [ ] Prototype async transcription workflow (request, status polling, result storage per language).
- [ ] Provide UI controls to generate, edit, delete, regenerate transcriptions.
- [ ] Handle failure states and retries gracefully.

### 1.5 Text-to-Speech (Optional) _(spec §1.5)_
- [ ] Integrate with chosen TTS provider (voice selection, language alignment).
- [ ] Store generated audio as standard media asset and expose in stop editor.
- [ ] Add regeneration and preview controls with error handling.

### 1.6 Maps & GPS _(spec §1.6)_
- [ ] Add lat/lng fields to stops with validation.
- [ ] Embed map preview component in stop editor with draggable pin + manual entry.
- [ ] Render tour map with all geo-enabled stops; support pan/zoom and tap-to-open.
- [ ] Ensure visitor app hides stops lacking coordinates from map view.

## 2. Visitor App & Offline Experience
### 2.1 Offline Mode (Per Tour) _(spec §2.1)_
- [ ] Implement start screen with download gating when offline mode is enabled.
- [ ] Build offline package generator per tour + language (text, audio, images, video, later 3D).
- [ ] Enforce single active download; handle pause/resume/cancellation states.
- [ ] Add creator warning for videos >10 MB when toggling offline mode.
- [ ] Show “not available offline” messaging when required.
- [ ] Provide UI to manage downloaded tours (list, delete, storage usage).

### 2.2 Audio Player _(spec §2.2)_
- [ ] Build persistent audio player with play/pause and optional ±15 s skip.
- [ ] Implement background audio handling to ensure playback continues when device screen is locked.
- [ ] Display stop title, cover media, elapsed/total time; disallow free scrubbing.
- [ ] Persist playback position per stop for resume after navigation or app relaunch.
- [ ] Trigger “completed” state at ≥85 % playback; handle missing language audio message.

### 2.3 Progress Tracking _(spec §2.3)_
- [ ] Store stop-level completion state + last position locally (IndexedDB/SQLite).
- [ ] Compute tour-level completion percentage and progress bar.
- [ ] Ensure progress is language-agnostic and survives restarts.

### 2.4 QR Codes _(spec §2.4)_
- [ ] Generate tour + stop QR PNGs on publish; expose download buttons.
- [ ] Implement QR entry points in visitor app (tour start, specific stop).
- [ ] Respect tour state/offline availability when scanning codes.

### 2.5 3D Model Support (Optional) _(spec §2.5)_
- [ ] Add upload + metadata handling for GLTF/GLB/USDZ files.
- [ ] Integrate 3D viewer with rotate/zoom/pan and device capability checks.
- [ ] Provide fallback messaging for unsupported devices.

## 3. Admin Accounts, Workspaces & Roles
### 3.1 Authentication (Creators Only) _(spec §3.1)_
- [ ] Implement Google OAuth + email/password auth with secure session handling.
- [ ] Build password reset flow (request, token validation, update).
- [ ] Route creators to dashboard post-login; ensure visitor app never prompts for login.

### 3.2 Workspaces _(spec §3.2)_
- [ ] Auto-create workspace on account creation; store name, plan, legal URL.
- [ ] Provide settings UI for editing name and legal link; expose plan information.

### 3.3 Team & Roles _(spec §3.3)_
- [ ] Enforce plan-based access: hide team UI for Free/Plus; enable for Custom.
- [ ] Implement invite flow (email, role assignment, acceptance).
- [ ] Provide member management (list, role update, removal) for Admins on Custom plan.
- [ ] Enforce RBAC for admin operations (billing, settings, content access).

### 3.4 Account Section _(spec §3.4)_
- [ ] Build profile management (name, email, password change).
- [ ] Implement billing section for Admins on paid plans (plan, invoices, payment method, plan changes).

## 4. Branding & White-Label _(spec §4)_
- [ ] Add workspace-level branding settings (primary/secondary colours, logo upload) gated to Plus/Custom.
- [ ] Apply branding tokens across visitor UI (start, stop, player, offline screens).
- [ ] For Custom plan, implement advanced branding: remove platform branding, custom domain config, footer/legal text, app icon.
- [ ] Provide per-tour custom CSS editor (Custom plan) with validation/sandboxing and reset option.

## 5. Publishing & Sharing _(spec §5)_
- [ ] Implement publish/unpublish controls for tours with audit trail and permission checks.
- [ ] Ensure preview mode bypasses publication while keeping public access locked and restricted to Admin/Editor use only.
- [ ] Build sharing panel for published tours (public URL display, copy button, QR download) hidden for drafts.
- [ ] Limit stop sharing to QR-only per spec.

## 6. Analytics _(spec §6.1)_
- [ ] Design analytics data model (events, aggregation jobs, storage, retention).
- [ ] Build global dashboard covering spec KPIs: total visits, average completion rate, average rating (Plus/Custom), visitor email count (Plus/Custom), total audio plays, top visit tour, lowest completion tour, visits-over-time chart.
- [ ] Implement tour-level analytics views with visits, tour completion rate, average rating (Plus/Custom), visitor emails (Plus/Custom), download counts, visits/completions over time.
- [ ] Apply plan-based gating (Free = visits only, Plus/Custom = full metrics).
- [ ] Implement date range filtering controls (last 7/30/90 days + custom range) for all analytics views.
- [ ] Ensure analytics update in near real-time from online + synced offline events.

## 7. Communication & Audience Features
### 7.1 Ratings & Feedback (Plus & Custom) _(spec §7.1)_
- [ ] Build visitor flow (prompt, star rating, optional comment, offline storage).
- [ ] Enforce one rating per device per tour; sync offline submissions.
- [ ] Provide admin feedback UI with filtering, status, and visibility controls (Plus/Custom only).

### 7.2 Visitor Emails (Plus & Custom) _(spec §7.2)_
- [ ] Extend feedback flow with optional email capture + legal link text when available.
- [ ] Store emails with tour ID + timestamp; ensure secure handling + deletion capability.
- [ ] Build Visitors list with filtering, detail view, and CSV export for Admin/Editor.

## 8. Legal & Compliance _(spec §8)_
- [ ] Add alt-text fields for all media; ensure screen-reader labels, focus states, keyboard navigation, and minimum contrast/tap-target sizing meet accessibility guidelines.
- [ ] Implement privacy/legal links in visitor app (start screen footer or menu).
- [ ] Provide admin tools to delete visitor data on request; ensure audit logging.
- [ ] Document GDPR-compliant data handling and DPA availability.

## 9. Offline Data & Background Sync _(spec §9)_
- [ ] Implement local event queue storing type, IDs, payload, timestamps, unique IDs.
- [ ] Build background/foreground sync triggers with retry/backoff logic.
- [ ] Ensure server-side idempotency and duplicate suppression.
- [ ] Provide diagnostics/telemetry for sync health and error reporting.

## 10. Infrastructure & Platform _(spec §10)_
- [ ] Provision cloud storage (e.g., S3) with metadata tracking + HTTPS access + caching headers.
- [ ] Architect backend (services, databases, message queues) with scalability considerations.
- [ ] Implement offline sync APIs for analytics, feedback, ratings, emails with pagination & rate limiting.
- [ ] Set up local/offline storage layers per platform (IndexedDB, SQLite).
- [ ] Implement cache eviction policy and user-facing "Clear Data" controls for downloaded content.
- [ ] Enforce security best practices (HTTPS, encryption at rest, CSRF, input validation, workspace isolation).
- [ ] Design path to add CDN without breaking media URLs.

## 11. Pricing Plans & Feature Gating _(spec §11)_
- [ ] Encode plan entitlements (Free/Plus/Custom) in backend and client feature flags.
- [ ] Validate plan limits (tour counts, branding, ratings, emails, teams, analytics scope).
- [ ] Build upgrade/downgrade flows, billing integration, and plan-aware UI states.
- [ ] Add automated tests covering gating logic for admin + visitor surfaces.

## 12. Visitor App Deployment Strategy _(spec §0.1)_
- [ ] Design build pipeline for generating single-tour visitor app bundles from admin data.
- [ ] Implement tour-to-deployment mapping (each tour = one build configuration).
- [ ] Create deployment configuration template for each tour (includes tour ID, selected languages, branding).
- [ ] Set up automated deployment workflow (admin publishes tour → triggers visitor app build/deploy).
- [ ] Configure domain/subdomain strategy per plan (Free/Plus: subdomain, Custom: custom domain).
- [ ] Implement language bundle generation per tour (only include selected languages in visitor app).
- [ ] Create visitor app environment configuration (API endpoints, tour ID, language list).
- [ ] Test multi-deployment scenario (3+ tours each with different languages/branding).
- [ ] Document deployment process for operators and Custom plan clients.
- [ ] Implement rollback mechanism for failed deployments.

## 13. QA, Testing & Launch Readiness _(spec §§6.1, 8, 9, 10)_
- [ ] Define testing strategy (unit, integration, end-to-end, accessibility, performance).
- [ ] Create seed data & fixtures for tours/stops to support demos and automated tests.
- [ ] Run load/perf tests for public endpoints (<500 ms) and admin (<2 s initial load).
- [ ] Conduct security review (OWASP checklist, pen-test readiness).
- [ ] Prepare rollout plan, monitoring, alerting, and support playbooks.
- [ ] Document user guides, admin onboarding, and support FAQs.

