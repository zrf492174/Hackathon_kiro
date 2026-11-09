# Haunted Hollow

A Halloween horror interactive site built with Vite and TypeScript.

**Live site:** https://zrf492174.github.io/Hackathon_kiro/

See [PLAN.md](PLAN.md) for the full plan (Chinese).

## Features

- Entry warning modal, then four scenes: Gate, Attic, Graveyard and Pumpkin patch (keyboard accessible navigation).
- Interactions: popup ghosts, pumpkin puzzle, flashlight, cobweb, bats, lightning and rain, glowing eyes, candles.
- Easter eggs: Konami code, seven clicks on the moon, typing "boo".
- Collection book listing discovered assets with author and license.
- Touch support and 44px minimum touch targets.

## Safety and accessibility

- Jump scares are off by default and can be enabled in settings.
- Safe mode disables all scares and flashing effects.
- Reduced motion is honored from the OS preference and can be toggled manually.
- Everything works with synthesized sounds and bundled placeholders; no external requests at runtime.

## Scripts

- `npm run dev` start the dev server
- `npm run build` type check and build to `dist/`
- `npm run preview` serve the built site at `/Hackathon_kiro/`
- `npm test` run unit tests (Vitest)
- `npm run test:e2e` run Playwright and axe accessibility tests (needs `npx playwright install chromium`)
- `npm run lint` run ESLint and Prettier checks
- `npm run assets:collect` / `assets:collect:all` collect openly licensed assets (API keys via env)
- `npm run lit:collect` gathers Halloween-themed paper and news metadata (OpenAlex, Crossref, Europe PMC, arXiv, GDELT, Wikinews) into `public/data/grimoire.json` and `public/data/gazette.json`. Metadata only, no full text; abstract snippets (max 300 chars) only where the licence allows. Use `-- --offline --dry-run` to run against test fixtures without network or writes. `npm run lit:verify` validates the committed datasets. Entries flagged `sample: true` are hand-seeded and pending confirmation. A weekly workflow opens a PR with updates.
- `npm run assets:verify` validate the manifest and files
- `npm run assets:credits` regenerate [CREDITS.md](CREDITS.md)

## How Kiro was used

The project was planned with Kiro specs (see PLAN.md and `.agents/tasks`), then implemented feature by feature by Kiro agents with steering rules in `.kiro/steering`, including review passes, unit and e2e tests, and CI workflows.

## Deployment

Hosted on GitHub Pages with Vite `base` set to `/Hackathon_kiro/`.

1. Merge the work into `main`.
2. In the repo go to Settings > Pages and set Source to **GitHub Actions**.
3. The `deploy.yml` workflow builds and publishes `dist/` on every push to `main` (or run it manually).

`public/404.html` provides the Pages not-found page.
