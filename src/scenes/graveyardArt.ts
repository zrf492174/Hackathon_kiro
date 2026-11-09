const tree = (
  x: number,
  s: number,
) => `<g transform="translate(${x} 470) scale(${s})" fill="none" stroke="#06040c" stroke-linecap="round">
  <path stroke-width="10" d="M0 0 C-4 -60 4 -110 -2 -170"/>
  <path stroke-width="6" d="M-2 -110 C-30 -130 -44 -150 -60 -190 M-2 -140 C20 -160 40 -170 52 -210 M-1 -165 C-12 -190 -8 -210 -20 -235"/>
  <path stroke-width="3" d="M-44 -150 L-70 -158 M-44 -150 L-52 -178 M40 -168 L66 -170 M40 -168 L44 -194"/></g>`;

const fence = Array.from(
  { length: 26 },
  (_, i) =>
    `<path d="M${20 + i * 38} 560 V500 L${24 + i * 38} 490 L${28 + i * 38} 500 V560" fill="#07050d"/>`,
).join('');

/** Layered, original graveyard backdrop. Decorative: the interactive parts are real buttons. */
export const GRAVEYARD_SVG = `<svg class="yard__svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="yardMoon"><stop offset="0" stop-color="#f4efd8"/><stop offset="0.5" stop-color="#d8d4c0" stop-opacity="0.35"/><stop offset="1" stop-color="#d8d4c0" stop-opacity="0"/></radialGradient>
    <linearGradient id="yardSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07060f"/><stop offset="1" stop-color="#1d1730"/></linearGradient>
    <linearGradient id="yardMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8a0c8" stop-opacity="0"/><stop offset="1" stop-color="#a8a0c8" stop-opacity="0.35"/></linearGradient>
  </defs>
  <rect width="1000" height="600" fill="url(#yardSky)"/>
  <circle cx="780" cy="120" r="150" fill="url(#yardMoon)"/>
  <circle cx="780" cy="120" r="44" fill="#ece6cc"/>
  <circle cx="768" cy="110" r="8" fill="#cfc9ac"/><circle cx="796" cy="134" r="5" fill="#cfc9ac"/>
  <path d="M0 430 Q150 380 300 420 T560 400 T800 410 T1000 390 V600 H0 Z" fill="#0f0b1a"/>
  <g class="yard__crypt">
    <rect x="130" y="360" width="170" height="120" fill="#13101e"/>
    <polygon points="120,360 215,300 310,360" fill="#191427"/>
    <rect x="195" y="410" width="40" height="70" rx="18" fill="#030207"/>
    <path d="M205 330 h20 M215 322 v18" stroke="#3a3350" stroke-width="3"/>
    <rect x="145" y="380" width="20" height="30" fill="#2a2338"/>
  </g>
  ${tree(70, 1.1)}${tree(930, 1.3)}${tree(520, 0.8)}
  <g class="yard__crows" fill="#05030a">
    <path d="M560 90 q10 -12 22 0 q-10 -4 -22 0 z"/><path d="M610 130 q9 -10 18 0 q-9 -3 -18 0z"/><path d="M470 70 q8 -9 17 0 q-8 -3 -17 0z"/>
  </g>
  <g class="yard__crow-perch" fill="#05030a"><ellipse cx="402" cy="446" rx="12" ry="8"/><circle cx="414" cy="440" r="5"/><path d="M418 440 l9 2 l-9 2z"/></g>
  <g class="yard__digger">
    <path d="M600 470 l8 -50 l22 0 l8 50z" fill="#07050d"/>
    <circle cx="619" cy="408" r="9" fill="#07050d"/>
    <path d="M606 402 h26 l-4 -8 h-18z" fill="#07050d"/>
    <path d="M640 430 l30 -26" stroke="#07050d" stroke-width="4"/>
    <circle class="yard__lantern" cx="676" cy="430" r="14" fill="#ffb347" opacity="0.9"/>
    <circle cx="676" cy="430" r="40" fill="#ffb347" opacity="0.12"/>
    <path d="M668 416 h16" stroke="#07050d" stroke-width="3"/>
  </g>
  <g class="yard__fence">${fence}<path d="M10 510 H990 M10 540 H990" stroke="#07050d" stroke-width="5"/></g>
  <rect y="380" width="1000" height="220" fill="url(#yardMist)"/>
  <rect class="yard__mist" x="-200" y="470" width="1400" height="120" fill="url(#yardMist)"/>
</svg>`;
