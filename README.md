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

## Gothic scenes: castle, laboratory, library, gazette

- **Castle**: SVG castle on a hill with slow window flicker (under 3 flashes per second, static in safe mode and reduced motion). A stair inside leads down to the laboratory (same chapter).
- **Laboratory**: Frankenstein style lab with a Tesla coil and a stitched monster. The lever is a toggle button (`aria-pressed`); animation is static in safe mode and reduced motion.
- **Library**: `public/data/grimoire.json` shown as an ancient spellbook, one paper per page. Use the buttons or ArrowLeft/ArrowRight to turn pages, and the chapter filter to pick a topic. Entries marked `sample` are hand-seeded.
- **Gazette**: `public/data/gazette.json` as a haunted newspaper. Only headlines, links and licence/terms text are shown.

Data is fetched from the site's own `data/` folder (works under the `/Hackathon_kiro/` base) and shows a friendly message if unavailable. Refresh it with the literature collector.

## v4 polish

- **Graveyard**: layered SVG scene (moon, dead trees, crypt, iron fence, crows, gravedigger lantern, mist) with focusable tombstones that reveal epitaphs and a slowly rising hand (static under reduced motion or safe mode).
- **Gazette**: aged, yellowed newspaper with a CSS-only gradient, paper grain, serif masthead, dateline and columns.
- **Classic horror homages**: original silhouettes (long-fingered stair shadow, caped gentleman, gaunt wanderer, sleepwalker, bandaged wanderer, werewolf) as keyboard-focusable buttons in the gate, attic, graveyard and castle. Motion only when allowed; no flashing.
- **Laboratory**: stone interior with a stormy window, Tesla coils, gauges, a sheet-covered stitched creature and a hunched assistant; lever, voltage slider and bubbling flasks.
- **Navigation**: replaced in v5 by the story layer described below.
- **Foggy Town**: dense layered fog with a density slider, a rusty siren, and creatures revealed by Listen / Search buttons or the lantern pointer.

### Homage credit

Inspired by classic horror cinema, including Silent Hill and The Mist. All artwork is original inline SVG/CSS; no film designs are copied or traced.

## v5 story: one night in five chapters

The scenes are now one linear story instead of separate buttons. A story bar at the bottom shows the chapter, a narration line (typed out, or shown at once with reduced motion or safe mode, and always read by screen readers through a polite live region), the current objective and one continue button.

| Chapter       | Merged scenes                                                                 | Objective                                                     |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1 The Gate    | gate                                                                          | Lift the latch (a note from the Keeper is nailed to the gate) |
| 2 The Grounds | pumpkin patch, churchyard, foggy street (wooden signposts move between them)  | Light the five pumpkins in order, which opens the hidden door |
| 3 The Attic   | attic (rafters, moonlit window, a letter on the trunk)                        | Blow out all three candles                                    |
| 4 The Castle  | castle hall and laboratory (the stair leads down)                             | Raise the voltage above 70 kV and pull the lever              |
| 5 The Archive | grimoire and gazette in one tablist, with the Keeper's ledger and an epilogue | Turn a page; the epilogue opens the collection book           |

- Nobody gets stuck: before the objective is met the button reads "Press on anyway"; afterwards it is highlighted with a narrative label. No timed or precision actions gate progress.
- The journey list (`aria-current="step"`) lets visitors revisit reached chapters; locked ones are `aria-disabled`. Progress is kept in `localStorage` under `hollow:story`.
- Deep links still work: `#gate`, `#grounds`, `#attic`, `#castle`, `#archive`, and the old ids `#patch`, `#graveyard`, `#fog`, `#lab`, `#library`, `#gazette` open the chapter that now contains them.
- Chapter changes fade through black with a synthesized footstep or door sound; the fade is instant under reduced motion.
- Code: `src/story/` (chapters, pure state, objective events, story bar UI), `src/scenes/archive.ts`, `src/styles/story.css`.

### Atmosphere techniques

- **Fog**: `src/core/fog.ts` renders three bands of fractal value noise at 96x54 pixels, scaled up with smoothing. Far bands are fine and slow and near bands are coarse and fast, so the fog has parallax. It is densest near the ground and tinted per chapter. It runs at about 20 frames per second, pauses when the tab is hidden, and draws one still frame under reduced motion.
- **Light**: a blend layer adds cool moonlight from the upper right and warm lamp, pumpkin and candle pools per chapter, which breathe slowly with no flashing. The vignette and slowed film grain (about 2 changes per second, well under 3 Hz) complete the effect. Gentle pointer parallax is turned off with reduced motion or safe mode.
- **Materials**: inline SVG `feTurbulence` textures cover stone (gate pillars, lit with `feDiffuseLighting`), paper (notes and letters) and wood (signposts, attic floor). Soft contact shadows sit under pumpkins, candles, stones, the trunk and the gate, and far layers are slightly blurred for depth of field.
- **Sound**: `AudioManager.setAmbience(chapter)` crossfades synthesized beds: filtered noise wind with gusts, rain in the castle, and a low detuned drone. Occasional distant sounds play (owl, bell, creaking timber, thunder), plus a lab hum that rises with the voltage. The heartbeat counts as a scare, so it only plays when scares are enabled. Everything starts only after the entry gesture, respects mute and pauses when hidden.

### Licensing stance

Every visual and sound in v5 is original: inline SVG, CSS, canvas and Web Audio synthesis, written for this project. No photos, recordings, fonts or designs from films or games were added, and no trademarked names appear in the visible UI. If real photos or recordings are added later, use only CC0 or self-made files and record each one in `public/assets/manifest.json`, then run `npm run assets:credits` so `CREDITS.md` stays complete (see `.kiro/steering/assets-policy.md`).
