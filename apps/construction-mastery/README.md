# Construction Mastery (web)

Standalone SPA for **Construction Mastery: The Estimator's Quest**, hosted on djgolding.com at `/construction-mastery/`.

## Develop

```bash
cd apps/construction-mastery
npm install
npm run dev
```

## Build (writes into `/construction-mastery/` for Cloudflare ASSETS)

```bash
cd apps/construction-mastery
npm install
npm run build
```

Built files are committed under `/construction-mastery/` so Wrangler can serve them without a build step on deploy.

## Storage

Same keys as the Cursor canvas:

- `construction-mastery-estimators-quest-v1`
- `construction-mastery-estimators-quest-v1-backup`
- Save Scroll prefix: `CMQ1.`

## Install as its own desktop app (Chrome)

This path has its own manifest (`id` / `scope` `/construction-mastery/`), PNG icons, and service worker. Jamo Sports Hub’s manifest scope is `/sports/` so it should not capture this URL.

On Windows Chrome: open https://djgolding.com/construction-mastery/ → ⋮ menu → **Cast, save, and share** → **Install page as app…** (or **Install Construction Mastery**). Do not use the blue **Open in app** chip if it still names Jamo Sports Hub (that’s the older broad-scope Sports Hub install until Chrome refreshes it).
