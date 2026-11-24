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
