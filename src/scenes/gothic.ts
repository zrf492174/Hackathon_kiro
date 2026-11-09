import { bats, lightning } from '../interactions';
import { gazettePanel, grimoirePanel } from '../interactions/panels';
import { labLever } from '../interactions/labLever';
import { castleDoor } from '../interactions/castleDoor';
import { createScene } from './scene';

const castleSvg = `<svg class="castle__svg" viewBox="0 0 400 260" role="img" aria-label="A dark castle on a hill under the moon">
  <circle cx="320" cy="50" r="26" fill="#d8d4c0"/>
  <path d="M0 260 L0 210 Q120 150 200 190 Q300 150 400 205 L400 260 Z" fill="#0d0a14"/>
  <g fill="#14101f">
    <rect x="120" y="110" width="160" height="90"/>
    <rect x="100" y="80" width="40" height="120"/><polygon points="100,80 120,45 140,80"/>
    <rect x="260" y="70" width="44" height="130"/><polygon points="260,70 282,32 304,70"/>
    <rect x="190" y="90" width="30" height="50"/><polygon points="190,90 205,60 220,90"/>
  </g>
  <g class="castle__windows" fill="#ffb347">
    <rect class="castle__win castle__win--a" x="116" y="110" width="8" height="14"/>
    <rect class="castle__win castle__win--b" x="276" y="100" width="8" height="14"/>
    <rect class="castle__win castle__win--c" x="200" y="104" width="8" height="14"/>
    <rect class="castle__win castle__win--a" x="150" y="140" width="8" height="14"/>
  </g>
  <path d="M185 200 L185 170 Q205 150 225 170 L225 200 Z" fill="#050308"/>
</svg>`;

const labSvg = `<svg class="lab__svg" viewBox="0 0 400 260" role="img" aria-label="A laboratory with a Tesla coil and a stitched monster on a table">
  <rect x="0" y="220" width="400" height="40" fill="#14101f"/>
  <g class="lab__coil">
    <rect x="60" y="150" width="20" height="70" fill="#5b5f6a"/>
    <ellipse cx="70" cy="140" rx="28" ry="14" fill="#7d828f"/>
    <circle cx="70" cy="118" r="14" fill="#9aa0ae"/>
    <path class="lab__spark lab__spark--a" d="M70 104 L82 90 L74 86 L92 66" stroke="#bfe8ff" stroke-width="3" fill="none"/>
    <path class="lab__spark lab__spark--b" d="M60 106 L50 92 L58 88 L42 70" stroke="#bfe8ff" stroke-width="3" fill="none"/>
  </g>
  <rect x="140" y="180" width="200" height="14" fill="#4a3a2a"/>
  <rect x="150" y="194" width="10" height="26" fill="#4a3a2a"/><rect x="320" y="194" width="10" height="26" fill="#4a3a2a"/>
  <g class="lab__monster">
    <rect x="170" y="150" width="150" height="30" rx="6" fill="#4f7a4a"/>
    <rect x="320" y="146" width="30" height="36" rx="4" fill="#5d8a56"/>
    <rect x="322" y="146" width="26" height="8" fill="#1d1a22"/>
    <circle cx="329" cy="162" r="2" fill="#eee"/><circle cx="341" cy="162" r="2" fill="#eee"/>
    <rect x="318" y="148" width="3" height="30" fill="#c0c0c0"/><rect x="350" y="152" width="3" height="22" fill="#c0c0c0"/>
    <path d="M326 174 H344" stroke="#222" stroke-width="2" stroke-dasharray="3 2"/>
  </g>
</svg>`;

/** Haunted castle on the hill. The door leads to the library. */
export const castle = createScene(
  'scene-castle',
  'The haunted castle',
  [bats, castleDoor],
  `<p class="scene-title">The Haunted Castle</p><div class="castle">${castleSvg}</div>`,
);

/** Dr. Frankenstein's laboratory. */
export const lab = createScene(
  'scene-lab',
  'The laboratory',
  [lightning, labLever],
  `<p class="scene-title">The Laboratory</p><div class="lab">${labSvg}</div>`,
);

export const library = createScene('scene-library', 'The library of grimoires', [grimoirePanel]);

export const gazetteScene = createScene('scene-gazette', 'The haunted gazette', [gazettePanel]);
