import './styles/fonts.css';
import './styles/theme.css';
import './styles/fx.css';
import { AudioManager } from './core/audio';
import { createBrowserSettings, scaresActive } from './core/settings';
import { startFog } from './core/fog';
import {
  applyMotionAttributes,
  effectiveReducedMotion,
  osPrefersReducedMotion,
} from './a11y/reducedMotion';
import { showWarningModal } from './ui/warningModal';
import { mountSettingsPanel } from './ui/settingsPanel';
import { loadAssets } from './core/assets';
import { mountSceneNav } from './scenes';
import { easterEggs, touch } from './interactions';
import { createBrowserCollection } from './core/collection';
import { mountCollectionBook } from './ui/collectionBook';
import './styles/interactions.css';
import './styles/grimoire.css';

const settings = createBrowserSettings();
const audio = new AudioManager({ scaresAllowed: () => scaresActive(settings.get()) });
const root = document.documentElement;
const app = document.getElementById('app') as HTMLElement;

const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const applyMotion = () => applyMotionAttributes(settings.get(), osPrefersReducedMotion(), root);
applyMotion();
media?.addEventListener?.('change', applyMotion);

app.innerHTML = `
  <main>
    <h1 class="glitch" data-text="Haunted Hollow">Haunted Hollow</h1>
    <p class="tagline">Something is watching from the fog.</p>
    <div id="live" class="sr-only" aria-live="polite"></div>
  </main>
  <footer class="site-footer"><a href="https://github.com/zrf492174/Hackathon_kiro/blob/main/CREDITS.md" rel="noopener">Credits and licenses</a></footer>
  <canvas id="fog" class="fx" aria-hidden="true"></canvas>
  <div class="fx vignette" aria-hidden="true"></div>
  <div class="fx grain" aria-hidden="true"></div>
  <div class="candle" aria-hidden="true"></div>`;

startFog(app.querySelector('#fog') as HTMLCanvasElement, () =>
  effectiveReducedMotion(settings.get(), osPrefersReducedMotion()),
);
mountSettingsPanel(document.body, settings);

settings.subscribe((s) => {
  applyMotion();
  audio.setMuted(s.muted);
});

audio.bindVisibility();

void showWarningModal(document.body).then(async ({ sound }) => {
  if (!sound) settings.set({ muted: true });
  if (await audio.start()) {
    audio.setMuted(settings.get().muted);
    audio.play('wind');
  }
});

const live = document.getElementById('live') as HTMLElement;
const collection = createBrowserCollection();
void loadAssets(import.meta.env.BASE_URL).then((assets) => {
  const ctx = {
    root: app,
    settings,
    assets,
    audio,
    osReducedMotion: osPrefersReducedMotion,
    announce: (m: string) => {
      live.textContent = m;
    },
    addScore: () => undefined,
    discover: (url: string) => {
      const rec = assets.recordForUrl(url);
      if (rec && collection.add(rec.id)) live.textContent = `Discovered: ${rec.title}.`;
    },
  };
  mountCollectionBook(document.body, collection, () => assets.records());
  touch.init(ctx);
  easterEggs.init(ctx);
  mountSceneNav(app, ctx);
});
