const stones = Array.from({ length: 7 }, (_, r) =>
  Array.from({ length: 12 }, (_, c) => {
    const x = c * 54 + (r % 2 ? -27 : 0);
    return `<rect x="${x + 1}" y="${r * 38 + 1}" width="52" height="36" fill="${(r + c) % 3 ? '#1f1b2b' : '#262033'}"/>`;
  }).join(''),
).join('');

const gauge = (
  cx: number,
  cy: number,
  angle: number,
  id: string,
) => `<g class="lab__gauge" data-gauge="${id}">
  <circle cx="${cx}" cy="${cy}" r="17" fill="#2b2a2e" stroke="#9a7b3c" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="13" fill="#d9cfae"/>
  <path d="M${cx - 9} ${cy + 6} A11 11 0 0 1 ${cx + 9} ${cy + 6}" stroke="#4a3a2a" stroke-width="1" fill="none" stroke-dasharray="1.5 2.5"/>
  <line class="lab__needle" x1="${cx}" y1="${cy + 3}" x2="${cx + 10}" y2="${cy - 3}" stroke="#a02020" stroke-width="1.8" transform="rotate(${angle} ${cx} ${cy + 3})"/>
  <circle cx="${cx}" cy="${cy + 3}" r="2" fill="#222"/></g>`;

const book = (x: number, w: number, c: string) =>
  `<rect x="${x}" y="0" width="${w}" height="30" fill="${c}"/><rect x="${x + 2}" y="6" width="${w - 4}" height="2" fill="#c9a24b"/>`;

/** Stone laboratory interior. All shapes are original. Interactive controls are real HTML elements. */
export const LAB_SVG = `<svg class="lab__svg" viewBox="0 0 640 400" role="img" aria-label="A stone laboratory: a stormy arched window, Tesla coils, a wall of gauges, an operating table with a sheet-covered stitched creature, and a hunched assistant">
  <defs>
    <radialGradient id="labGlow"><stop offset="0" stop-color="#bfe8ff" stop-opacity="0.8"/><stop offset="1" stop-color="#bfe8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="labStorm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0c1e"/><stop offset="1" stop-color="#2a2f55"/></linearGradient>
  </defs>
  <g>${stones}</g>
  <rect y="0" width="640" height="400" fill="#07050d" opacity="0.35"/>
  <g class="lab__window">
    <path d="M250 190 V70 A70 70 0 0 1 390 70 V190 Z" fill="url(#labStorm)" stroke="#3a3548" stroke-width="8"/>
    <path d="M300 40 q20 -8 40 0 q16 4 8 14 q-24 6 -48 0 q-8 -6 0 -14z" fill="#3b4068"/>
    <path d="M270 90 q24 -10 52 0 q14 6 4 14 q-30 8 -58 0z" fill="#2c3052"/>
    <circle cx="360" cy="60" r="13" fill="#d8d4c0" opacity="0.85"/>
    <path class="lab__bolt" d="M322 40 L310 90 L328 90 L312 150" stroke="#e8f4ff" stroke-width="3" fill="none"/>
    <path d="M320 60 V190 M250 120 H390" stroke="#3a3548" stroke-width="4"/>
  </g>
  <g class="lab__shelf">
    <rect x="20" y="86" width="150" height="8" fill="#4a3a2a"/>
    <g transform="translate(26 56)">${book(0, 12, '#5a1d1d')}${book(14, 9, '#1d3a5a')}${book(25, 14, '#3a2a5a')}${book(41, 10, '#5a4a1d')}</g>
    <g transform="translate(112 60)"><ellipse cx="14" cy="12" rx="12" ry="11" fill="#d9d2c0"/><rect x="8" y="20" width="12" height="6" fill="#d9d2c0"/><circle cx="9" cy="12" r="3" fill="#07050d"/><circle cx="19" cy="12" r="3" fill="#07050d"/></g>
    <rect x="20" y="146" width="150" height="8" fill="#4a3a2a"/>
    <g transform="translate(30 118)">${book(0, 10, '#1d4a3a')}${book(12, 14, '#5a1d3a')}${book(28, 9, '#4a3a2a')}</g>
    <g transform="translate(104 128)"><ellipse cx="14" cy="8" rx="11" ry="10" fill="#cfc8b4"/><circle cx="10" cy="8" r="2.6" fill="#07050d"/><circle cx="18" cy="8" r="2.6" fill="#07050d"/></g>
  </g>
  <g class="lab__gauges">
    <rect x="450" y="40" width="170" height="110" rx="6" fill="#171421" stroke="#3a3548" stroke-width="3"/>
    ${gauge(480, 72, -40, 'a')}${gauge(530, 72, 10, 'b')}${gauge(580, 72, 50, 'c')}${gauge(480, 120, 20, 'd')}${gauge(530, 120, -20, 'e')}
    <rect x="562" y="106" width="36" height="22" fill="#2b2a2e" stroke="#9a7b3c"/><circle class="lab__lamp" cx="580" cy="117" r="5" fill="#a02020"/>
  </g>
  <path d="M600 150 C590 200 520 190 500 250 S470 300 440 320" stroke="#0a0710" stroke-width="5" fill="none"/>
  <path d="M610 150 C600 215 540 215 520 270 S490 310 462 330" stroke="#4a2a1a" stroke-width="3" fill="none"/>
  <g class="lab__coil lab__coil--left">
    <rect x="52" y="210" width="26" height="110" fill="#5b5f6a"/>
    <g fill="none" stroke="#b87333" stroke-width="3"><path d="M50 224 h30 M50 236 h30 M50 248 h30 M50 260 h30 M50 272 h30 M50 284 h30"/></g>
    <ellipse cx="65" cy="206" rx="32" ry="14" fill="#7d828f"/>
    <circle cx="65" cy="180" r="18" fill="#9aa0ae"/>
    <circle class="lab__aura" cx="65" cy="180" r="44" fill="url(#labGlow)"/>
  </g>
  <g class="lab__coil lab__coil--right">
    <rect x="552" y="230" width="22" height="90" fill="#5b5f6a"/>
    <g fill="none" stroke="#b87333" stroke-width="3"><path d="M550 244 h26 M550 258 h26 M550 272 h26 M550 286 h26"/></g>
    <ellipse cx="563" cy="226" rx="28" ry="12" fill="#7d828f"/>
    <circle cx="563" cy="204" r="15" fill="#9aa0ae"/>
  </g>
  <g class="lab__arcs" fill="none" stroke="#bfe8ff" stroke-linecap="round" stroke-linejoin="round">
    <path class="lab__spark lab__spark--a" d="M83 176 L120 160 L112 178 L160 160 L152 180 L200 170 L248 250"/>
    <path class="lab__spark lab__spark--b" d="M548 202 L520 190 L526 208 L480 196 L488 216 L440 220 L350 262"/>
    <path class="lab__spark lab__spark--a" d="M72 164 L90 140 L82 134 L110 108"/>
    <path class="lab__spark lab__spark--b" d="M560 190 L548 170 L558 166 L544 144"/>
  </g>
  <rect y="320" width="640" height="80" fill="#15111e"/>
  <rect y="320" width="640" height="6" fill="#2a2338"/>
  <g class="lab__table">
    <rect x="170" y="268" width="270" height="16" rx="3" fill="#4a3a2a"/>
    <rect x="186" y="284" width="12" height="62" fill="#3a2c20"/><rect x="412" y="284" width="12" height="62" fill="#3a2c20"/>
    <path d="M186 346 h28 M398 346 h28" stroke="#3a2c20" stroke-width="5"/>
    <g class="lab__monster">
      <path d="M182 268 Q190 226 240 224 L330 226 Q390 224 422 250 L428 268 Z" fill="#d9d2c0"/>
      <path d="M250 228 Q280 244 320 230 M200 250 Q240 262 270 258" stroke="#bfb8a4" stroke-width="2" fill="none"/>
      <g class="lab__face">
        <ellipse cx="404" cy="244" rx="20" ry="13" fill="#7a8a62"/>
        <path d="M388 238 h14 v10 h-14z" fill="#8a7a62"/><path d="M404 244 h16 v-6 h-16z" fill="#6a7a52"/>
        <path d="M386 232 q16 -8 34 0" stroke="#0a0710" stroke-width="5" fill="none"/>
        <circle class="lab__eye" cx="396" cy="241" r="3" fill="#ffd23a"/><circle class="lab__eye" cx="410" cy="241" r="3" fill="#ffd23a"/>
        <path d="M388 252 h30" stroke="#1d1a22" stroke-width="1.5" stroke-dasharray="3 2"/>
        <path d="M404 232 v-4 M398 232 v-4 M410 232 v-4" stroke="#1d1a22" stroke-width="1"/>
      </g>
      <g class="lab__arm" transform="translate(300 262)"><path d="M0 0 q20 14 40 6 q18 -6 16 0 l2 10 q-20 6 -42 4 q-14 -2 -18 -12z" fill="#7a8a62"/>
        <path d="M14 4 v10 M24 4 v10 M34 4 v10" stroke="#1d1a22" stroke-width="1.3"/><path d="M52 4 l8 0 M52 10 l8 2 M50 14 l8 4" stroke="#6a7a52" stroke-width="3"/></g>
    </g>
    <g class="lab__stirrups"><rect x="170" y="262" width="270" height="8" fill="#6a6a72" opacity="0.7"/></g>
  </g>
  <g class="lab__walker"><g class="lab__walker-flip">
    <g class="lab__legs"><rect class="lab__leg lab__leg--a" x="-13" y="-40" width="11" height="40" rx="3" fill="#2a2833"/><rect class="lab__leg lab__leg--b" x="2" y="-40" width="11" height="40" rx="3" fill="#2a2833"/></g>
    <rect x="-17" y="-88" width="34" height="52" rx="5" fill="#d9d2c0"/>
    <path d="M-17 -60 h34 M-6 -88 v52" stroke="#bfb8a4" stroke-width="2" fill="none" stroke-dasharray="4 3"/>
    <g class="lab__walker-arm"><rect x="4" y="-84" width="28" height="9" rx="4" fill="#7a8a62"/><path d="M14 -84 v9 M22 -84 v9" stroke="#1d1a22" stroke-width="1.2"/></g>
    <rect x="-14" y="-114" width="28" height="26" rx="3" fill="#7a8a62"/>
    <rect x="-15" y="-117" width="30" height="8" fill="#0a0710"/>
    <path d="M-14 -100 h-5 M14 -100 h5" stroke="#9aa0ae" stroke-width="3"/>
    <circle class="lab__eye" cx="-3" cy="-102" r="2.4" fill="#ffd23a"/><circle class="lab__eye" cx="7" cy="-102" r="2.4" fill="#ffd23a"/>
    <path d="M-6 -93 h16" stroke="#1d1a22" stroke-width="1.5" stroke-dasharray="3 2"/>
  </g></g>
  <g class="lab__assistant" fill="#07050d">
    <path d="M492 330 Q476 280 496 262 Q512 244 530 252 Q548 262 540 300 L548 330 Z"/>
    <circle cx="520" cy="244" r="12"/>
    <path d="M530 240 q8 -2 10 6 q-6 2 -10 -2z"/>
    <path d="M504 286 l-16 30 M538 286 l14 28" stroke="#07050d" stroke-width="7" stroke-linecap="round"/>
    <circle class="lab__eye" cx="524" cy="244" r="1.8" fill="#ffd23a"/>
  </g>
  <g class="lab__floor-props">
    <g transform="translate(96 330)"><ellipse cx="14" cy="10" rx="13" ry="12" fill="#d9d2c0"/><circle cx="9" cy="10" r="3" fill="#07050d"/><circle cx="19" cy="10" r="3" fill="#07050d"/></g>
    <g transform="translate(124 340) rotate(-6)"><rect width="30" height="8" fill="#5a1d1d"/><rect y="8" width="28" height="7" fill="#1d3a5a"/></g>
  </g>
</svg>`;

export const FLASKS = [
  {
    id: 'green',
    label: 'Green flask',
    color: '#6bd36b',
    note: 'The green flask bubbles and hisses.',
  },
  {
    id: 'violet',
    label: 'Violet flask',
    color: '#b46bff',
    note: 'The violet flask foams over the rim.',
  },
  { id: 'amber', label: 'Amber flask', color: '#ffb347', note: 'The amber flask simmers gently.' },
] as const;
