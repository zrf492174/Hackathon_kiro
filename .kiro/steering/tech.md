# Tech

- Vite + TypeScript (strict), native DOM, CSS animations, Canvas 2D.
- Web Audio API through `core/audio.ts` AudioManager; audio starts only after a user gesture.
- Vitest for unit tests in `tests/unit`. Run `npm test`, `npm run build`, `npm run lint`.
- Interaction modules expose `init(ctx)` and `destroy()`.
- Pause animation and audio when the page is hidden.
- Vite base is `/Hackathon_kiro/`. No runtime third-party requests.
- Do not use em dashes in written content.
