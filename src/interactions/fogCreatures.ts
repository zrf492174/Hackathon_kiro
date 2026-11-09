export type RevealKind = 'listen' | 'search';

export interface FogCreature {
  id: string;
  kind: RevealKind;
  /** Announced text when revealed (no trademarked names). */
  caption: string;
  /** Position in the town, viewport percent. */
  x: number;
  y: number;
  w: number;
  svg: string;
}

const E = (x: number, y: number, r = 2) =>
  `<circle class="creature__eye" cx="${x}" cy="${y}" r="${r}"/>`;

/** Original silhouettes inspired by foggy-town horror archetypes. Nothing here traces a film design. */
export const FOG_CREATURES: FogCreature[] = [
  {
    id: 'nurse',
    kind: 'listen',
    caption:
      'Slow footsteps. A faceless figure in a stained apron drags a rusty hook along the road.',
    x: 18,
    y: 56,
    w: 11,
    svg: `<path d="M26 28 L18 100 H42 L34 28 Z" fill="#0b0912"/><path d="M20 60 H40" stroke="#6a1a1a" stroke-width="3"/>
      <ellipse cx="30" cy="18" rx="9" ry="11" fill="#cfc6c0"/><path d="M20 12 H40 L36 6 H24Z" fill="#0b0912"/>
      <path d="M38 50 L56 42 V96" stroke="#5a2a14" stroke-width="3" fill="none"/><path d="M56 42 q8 -4 6 6" stroke="#8a3a14" stroke-width="3" fill="none"/>`,
  },
  {
    id: 'executioner',
    kind: 'search',
    caption: 'Something very tall stands in the fog, dragging a huge blade behind it.',
    x: 70,
    y: 48,
    w: 13,
    svg: `<path d="M22 34 L12 120 H48 L38 34 Z" fill="#0a0810"/><path d="M26 20 Q30 4 34 20 L38 36 H22 Z" fill="#0a0810"/>
      <rect x="22" y="30" width="16" height="6" fill="#2a1414"/>${E(27, 24, 1.3)}${E(33, 24, 1.3)}
      <path d="M40 60 L58 118 L52 120 L36 64Z" fill="#6b6f76"/><rect x="34" y="54" width="8" height="12" fill="#2a1a10"/>`,
  },
  {
    id: 'crawlers',
    kind: 'listen',
    caption: 'Pale shapes scuttle across the road, low to the ground, and then stop.',
    x: 40,
    y: 80,
    w: 14,
    svg: `<g fill="#c9c2c0"><ellipse cx="20" cy="40" rx="14" ry="5"/><circle cx="8" cy="36" r="4"/><path d="M12 42 l-8 8 M20 44 l-4 10 M28 44 l4 10 M32 40 l10 8"  stroke="#c9c2c0" stroke-width="2"/></g>
      <g fill="#b9b2b0" transform="translate(30 12)"><ellipse cx="20" cy="40" rx="12" ry="4"/><circle cx="32" cy="37" r="3.5"/><path d="M12 42 l-6 8 M20 43 l-2 9 M28 43 l4 9" stroke="#b9b2b0" stroke-width="2"/></g>`,
  },
  {
    id: 'tentacles',
    kind: 'search',
    caption: 'Enormous tentacles curl out of the mist above the rooftops, feeling for something.',
    x: 4,
    y: 4,
    w: 30,
    svg: `<g fill="none" stroke="#0e0b18" stroke-linecap="round"><path stroke-width="12" d="M10 0 C30 40 -10 70 40 100 C70 120 50 150 80 170"/>
      <path stroke-width="9" d="M60 0 C40 30 90 60 70 90 C60 110 100 130 90 160"/><path stroke-width="6" d="M100 0 C110 30 80 50 110 80"/></g>
      <g fill="#2a2638"><circle cx="30" cy="60" r="2.5"/><circle cx="52" cy="104" r="2.5"/><circle cx="72" cy="86" r="2"/></g>`,
  },
  {
    id: 'moths',
    kind: 'listen',
    caption:
      'A wingbeat like wet paper. A giant moth with glowing eyes hovers over the street lamps.',
    x: 52,
    y: 14,
    w: 16,
    svg: `<path d="M50 40 Q10 0 4 40 Q10 64 50 52 Z" fill="#17131f" stroke="#2c2640"/><path d="M50 40 Q90 0 96 40 Q90 64 50 52 Z" fill="#17131f" stroke="#2c2640"/>
      <ellipse cx="50" cy="48" rx="5" ry="18" fill="#0b0912"/><path d="M46 32 L38 20 M54 32 L62 20" stroke="#0b0912" stroke-width="2"/>${E(47, 36, 2.2)}${E(53, 36, 2.2)}
      <circle cx="22" cy="36" r="6" fill="#2c2640"/><circle cx="78" cy="36" r="6" fill="#2c2640"/>`,
  },
  {
    id: 'lurker',
    kind: 'search',
    caption: 'Something huge shifts inside the mist. Two pale eyes, far too high up, watch you.',
    x: 34,
    y: 30,
    w: 20,
    svg: `<path d="M10 120 Q0 60 40 40 Q80 20 120 40 Q160 60 150 120 Z" fill="#0c0a14" opacity="0.92"/>${E(60, 62, 5)}${E(100, 62, 5)}`,
  },
  {
    id: 'cultist',
    kind: 'listen',
    caption: 'A hooded figure stands motionless under a dead lamp, murmuring in the fog.',
    x: 84,
    y: 62,
    w: 8,
    svg: `<path d="M30 14 Q16 18 12 50 L6 110 H54 L48 50 Q44 18 30 14 Z" fill="#120c1c"/><ellipse cx="30" cy="34" rx="8" ry="11" fill="#030206"/>${E(27, 33, 1.2)}${E(33, 33, 1.2)}
      <path d="M22 70 h16 M30 62 v18" stroke="#6a1a1a" stroke-width="2"/>`,
  },
];

export function creaturesOfKind(kind: RevealKind): FogCreature[] {
  return FOG_CREATURES.filter((c) => c.kind === kind);
}

/** Deterministic rotation through the creatures of a kind so every one is eventually seen. */
export function nextCreature(kind: RevealKind, counter: number): FogCreature {
  const list = creaturesOfKind(kind);
  return list[((counter % list.length) + list.length) % list.length];
}

/** Whether a reveal started at `start` is still showing at `now`. */
export function isRevealActive(start: number, now: number, durationMs: number): boolean {
  return now >= start && now - start < durationMs;
}

/** Whether a pointer at (px,py) is within radius of a creature's centre (all viewport percent). */
export function pointerNear(
  c: Pick<FogCreature, 'x' | 'y' | 'w'>,
  px: number,
  py: number,
  radius = 14,
): boolean {
  const cx = c.x + c.w / 2;
  const cy = c.y + c.w / 2;
  return Math.hypot(px - cx, py - cy) <= radius;
}
