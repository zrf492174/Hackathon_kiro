# Haunted Hollow

A Halloween horror interactive site built with Vite and TypeScript. See [PLAN.md](PLAN.md) for the full plan (Chinese).

## Scripts

- `npm run dev` start the dev server
- `npm run build` type check and build to `dist/`
- `npm test` run unit tests (Vitest)
- `npm run lint` run ESLint and Prettier checks

## Safety and accessibility

- An entry warning modal (flashing lights and sudden sounds) gates the site.
- Jump scares are off by default and can be enabled in settings.
- Safe mode disables all scares and flashing effects.
- Reduced motion is honored from the OS preference and can be toggled manually.
- Everything works with synthesized sounds and bundled placeholders; no external requests at runtime.

## Deployment

GitHub Pages, with Vite `base` set to `/Hackathon_kiro/`.
