import { fogTown } from '../interactions/fogTown';
import { createScene } from './scene';

const building = (x: number, w: number, h: number, broken: boolean) =>
  `<path d="M${x} 400 V${400 - h} ${broken ? `L${x + w * 0.3} ${400 - h - 14} L${x + w * 0.5} ${400 - h + 10} L${x + w * 0.8} ${400 - h - 20}` : `L${x + w / 2} ${400 - h - 30}`} L${x + w} ${400 - h} V400 Z" fill="#0a0810"/>
   <rect x="${x + 10}" y="${400 - h + 24}" width="9" height="14" fill="#14101f"/><rect x="${x + w - 24}" y="${400 - h + 50}" width="9" height="14" fill="#14101f"/>`;

const SVG = `<svg class="town__svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs><linearGradient id="townSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a12"/><stop offset="1" stop-color="#2a2833"/></linearGradient></defs>
  <rect width="1000" height="400" fill="url(#townSky)"/>
  <g opacity="0.55">${building(40, 130, 200, true)}${building(260, 110, 150, false)}${building(640, 140, 180, true)}${building(860, 120, 220, false)}</g>
  <g>${building(130, 120, 260, true)}${building(430, 150, 230, true)}${building(760, 110, 280, false)}</g>
  <rect y="360" width="1000" height="40" fill="#0b0910"/>
  <path d="M0 372 H1000" stroke="#1c1824" stroke-width="3" stroke-dasharray="30 24"/>
  <g class="town__lamp"><path d="M560 372 V250 q0 -16 18 -16 h8" stroke="#0a0810" stroke-width="5" fill="none"/><circle class="town__lamp-glow" cx="590" cy="238" r="9" fill="#d8c88a"/></g>
  <g class="town__sirenpole"><rect x="296" y="180" width="8" height="192" fill="#2a2024"/>
    <g class="town__siren"><path d="M270 190 L330 180 L330 214 L270 204 Z" fill="#6a3a22"/><ellipse cx="270" cy="197" rx="6" ry="9" fill="#4a2a1a"/><rect x="326" y="178" width="14" height="38" fill="#5a3020"/>
    <path d="M280 188 l6 14 M300 186 l4 18" stroke="#8a4a22" stroke-width="2"/></g></g>
</svg>`;

/** Foggy Town: the home of the tagline. Dense fog, ruined streets, a rusty siren, creatures in the mist. */
export const foggyTown = createScene(
  'scene-fog',
  'Foggy Town',
  [fogTown],
  `<p class="scene-title">Foggy Town</p>
   <div class="town">${SVG}
     <div class="town__fog town__fog--a"></div><div class="town__fog town__fog--b"></div><div class="town__fog town__fog--c"></div>
     <div class="town__lantern"></div>
   </div>`,
);
