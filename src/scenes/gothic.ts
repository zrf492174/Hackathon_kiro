import { bats, lightning } from '../interactions';
import { gazettePanel, grimoirePanel } from '../interactions/panels';
import { labLever } from '../interactions/labLever';
import { castleDoor } from '../interactions/castleDoor';
import { createFigures } from '../interactions/figures';
import { labControls } from '../interactions/labControls';
import { labMonster } from '../interactions/labMonster';
import { LAB_SVG } from './labArt';
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

/** Haunted castle on the hill. The door leads to the library. */
export const castle = createScene(
  'scene-castle',
  'The haunted castle',
  [bats, castleDoor, createFigures('castle')],
  `<p class="scene-title">The Haunted Castle</p><div class="castle">${castleSvg}</div>`,
);

/** Dr. Frankenstein's laboratory. */
export const lab = createScene(
  'scene-lab',
  'The laboratory',
  [lightning, labLever, labControls, labMonster],
  `<p class="scene-title">The Laboratory</p><div class="lab">${LAB_SVG}</div>`,
);

export const library = createScene('scene-library', 'The library of grimoires', [grimoirePanel]);

export const gazetteScene = createScene('scene-gazette', 'The haunted gazette', [gazettePanel]);
