# Deployment content tooling (dev-only)

This repo ships exactly one committed tour: **barcelona**, a small public demo
(`src/data/tour/barcelona/`). Real client tour-sets (e.g. a "New York" build)
never live in this repo — they live in `tours-content/`, a separate, gitignored
git repo nested at `player-react/tours-content/`, so they can have their own
history without ever touching `player-react`'s. Its remote is
[github.com/agilek/tours-content](https://github.com/agilek/tours-content) —
**private**, and it must stay that way (real client content lives there).

`src/data/tour/**/*.json` is discovered at **build time** via `import.meta.glob`
(`src/services/tourDiscovery.ts`) — whatever is physically in that folder when
`vite build` runs is what ships. These scripts just stage the right content
there before you run `dev`/`build`, and never run in CI or get imported by app
code.

## Layout of `tours-content/`

```
tours-content/
  <deployment>/
    deployment.json      # { "r2Prefix": "new-york" } — R2 key prefix for this deployment
    app.json              # optional; only needed if the deployment bundles >1 tour
    tours/
      <tourId>/{metadata,en,de,...}.json, route.geojson   # same shape as src/data/tour/<id>/
    assets/
      images/<tourId>/*.webp     # local originals; "app" is app.json's logo/hero/splash
      audio/<tourId>/*.mp3       # local originals (optional — omit if a tour's audioFile
                                  # fields are plain R2 URLs, as most are today)
```

## Switching is always explicit

`bun run dev` and `bun run build` use whatever is currently in
`src/data/tour/` — they never switch deployments for you. Switch with
`tour:use`, and switch back the same way:

```bash
bun run tour:use new-york   # switch
bun run dev                 # runs new-york
bun run tour:use barcelona  # back to the repo's tracked demo
```

`tour:use` is the only thing that clears `src/data/tour/` — it used to be
wired into `dev`/`build`, which silently deleted any tour authored directly
in the repo.

A dev server left running across a switch picks the change up — the tour data
is an eager `import.meta.glob`, so adding or removing folders under
`src/data/tour/` re-resolves it and Vite triggers a **full page reload** (not
an in-place HMR patch). Run `tour:use` in a second terminal and the browser
swaps deployments on its own; player state resets, as with any reload.

A `pre-commit` hook (`.githooks/pre-commit`, wired via
`git config core.hooksPath .githooks` — already set for this checkout) also
refuses to commit anything under `src/data/tour/` other than `barcelona/` or
`_fixture/`, as a second line of defense in case something ever gets staged
while a different deployment is active.

## Commands

- **`bun run tour:use <deployment>`** — switch which content is active locally.
  - `bun run tour:use barcelona` restores this repo's own tracked demo (`git checkout`).
  - `bun run tour:use new-york` clears `src/data/tour/*` (keeping `_fixture/`, the
    test-only fixture tour) and stages `tours-content/new-york/` into
    `src/data/tour/` + `public/images/` + `public/audio/`. Runs `bun run validate`
    afterward.
- **`bun run tour:sync-r2 <deployment>`** — uploads `tours-content/<deployment>/assets/**`
  to the `superguided-audio` R2 bucket under that deployment's prefix, and **deletes**
  any object under that prefix this script uploaded before but no longer has a
  matching local file for (a renamed/removed local asset doesn't linger in the
  bucket forever). Requires `wrangler` already authenticated locally. Tracks what
  it last uploaded in `tours-content/<deployment>/.r2-sync-manifest.json` — commit
  that file in the `tours-content` repo so a sync from a different clone still
  knows what's already up there (wrangler's R2 CLI has no "list objects" command,
  so this is the only way to detect staleness without new credentials/tooling).
- **`bun run tour:build <deployment> [--remote-assets]`** — `tour:use` + `bun run build`,
  producing a standalone `dist/` for that one deployment. With `--remote-assets`,
  first rewrites any local `/images/tours/...` / `/audio/tours/...` paths in the
  staged `src/data/tour` copy to that deployment's R2 URLs (run `tour:sync-r2`
  first so those URLs actually resolve) — use this for a build you're sharing
  standalone (e.g. on a website), so it isn't carrying local-only asset paths.

## Adding a new deployment

1. `mkdir -p tours-content/<name>/{tours,assets/images,assets/audio}`
2. Add `tours/<tourId>/{metadata,en,...}.json` following the shape of any folder
   under `src/data/tour/` today (or `docs/adding-tours.md`).
3. Drop local image/audio originals under `assets/`, referencing them from the
   tour JSON as `/images/tours/<tourId>/...` / `/audio/tours/<tourId>/...`
   (only for assets you want available offline / rewritten to R2 later — assets
   can also just be plain R2 URLs already, like `barcelona`'s).
4. `echo '{"r2Prefix": "<name>"}' > tours-content/<name>/deployment.json`
5. `bun run tour:use <name>` to try it locally.
