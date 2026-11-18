import { candles, cobweb, eyes, flashlight, popupGhost } from '../interactions';
import { createFigures } from '../interactions/figures';
import { createScene } from './scene';

const LOFT_SVG = `<svg class="loft__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="loftWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120c08"/><stop offset="1" stop-color="#21160e"/></linearGradient>
    <radialGradient id="loftMoon" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#b8c4e0"/><stop offset="1" stop-color="#4a5878"/></radialGradient>
    <linearGradient id="loftShaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8b8e0" stop-opacity="0.22"/><stop offset="1" stop-color="#a8b8e0" stop-opacity="0"/></linearGradient>
    <filter id="loftWood"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 0.05  0 0 0 0 0.03  0 0 0 0 0.01  0 0 0 0.6 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>
  <rect width="1000" height="600" fill="url(#loftWall)"/>
  <circle cx="500" cy="170" r="58" fill="url(#loftMoon)" opacity="0.75"/>
  <path d="M500 112 V228 M442 170 H558" stroke="#120c08" stroke-width="7"/>
  <circle cx="500" cy="170" r="58" fill="none" stroke="#24170d" stroke-width="12"/>
  <polygon points="450,200 550,200 700,600 300,600" fill="url(#loftShaft)"/>
  <g><path d="M500 -40 L-200 640" stroke="#24170d" stroke-width="26"/><path d="M500 -40 L60 640" stroke="#24170d" stroke-width="20"/><path d="M500 -40 L260 640" stroke="#24170d" stroke-width="14"/><path d="M500 -40 L740 640" stroke="#24170d" stroke-width="14"/><path d="M500 -40 L940 640" stroke="#24170d" stroke-width="20"/><path d="M500 -40 L1200 640" stroke="#24170d" stroke-width="26"/></g>
  <path d="M500 -40 L-200 640 L-400 640 L-400 -40 Z M500 -40 L1200 640 L1400 640 L1400 -40 Z" fill="#080503"/>
  <rect y="470" width="1000" height="130" fill="#1a110a"/>
  <rect y="470" width="1000" height="130" filter="url(#loftWood)"/>
  <path d="M0 500 H1000" stroke="#0d0805" stroke-width="2"/><path d="M0 530 H1000" stroke="#0d0805" stroke-width="2"/><path d="M0 565 H1000" stroke="#0d0805" stroke-width="2"/>
  <g class="loft__sheet"><path d="M170 470 Q160 380 200 340 Q240 300 290 330 Q330 360 320 470 Z" fill="#4a4540" opacity="0.7"/><path d="M200 350 Q230 420 210 470 M270 340 Q290 400 300 470" stroke="#2e2a26" stroke-width="3" fill="none"/></g>
  <g class="loft__trunk"><rect x="660" y="400" width="210" height="80" rx="6" fill="#3a2414"/><path d="M660 410 Q765 360 870 410 Z" fill="#46301c"/>
    <rect x="700" y="388" width="14" height="92" fill="#6a5a3a"/><rect x="816" y="388" width="14" height="92" fill="#6a5a3a"/><rect x="756" y="420" width="18" height="16" fill="#8a7a50"/>
    <rect x="740" y="380" width="44" height="12" fill="#d9c58e" transform="rotate(-6 762 386)"/></g>
  <ellipse cx="765" cy="482" rx="120" ry="8" fill="#000" opacity="0.6"/><ellipse cx="245" cy="472" rx="90" ry="6" fill="#000" opacity="0.5"/>
</svg>`;

/** The attic: candles to blow out, cobwebs, watching eyes and ghosts. */
export const attic = createScene(
  'scene-attic',
  'The dusty attic',
  [cobweb, candles, flashlight, eyes, popupGhost, createFigures('attic')],
  `<p class="scene-title">The Attic</p><div class="loft">${LOFT_SVG}</div>
   <p class="attic__letter">A letter on the trunk, in an old hand: "I built something and it frightened me. I hid in the dark so it would not see. If you blow out the candles, you will hear it. Go down to the castle and meet it kindly."</p>`,
);
