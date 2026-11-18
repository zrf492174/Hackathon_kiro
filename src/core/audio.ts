export type AudioGroup = 'ambient' | 'sfx' | 'scare';

export const DEFAULT_VOLUMES: Readonly<Record<AudioGroup, number>> = {
  ambient: 0.35,
  sfx: 0.6,
  scare: 0.5,
};

/** Minimal structural types so the manager can be tested without a browser. */
export interface GainLike {
  gain: {
    value: number;
    setValueAtTime(v: number, t: number): unknown;
    linearRampToValueAtTime(v: number, t: number): unknown;
  };
  connect(dest: unknown): unknown;
  disconnect?(): void;
}

export interface AudioContextLike {
  currentTime: number;
  state: string;
  destination: unknown;
  sampleRate: number;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close?(): Promise<void>;
  createGain(): GainLike;
  createOscillator(): {
    type: string;
    frequency: {
      value: number;
      setValueAtTime(v: number, t: number): unknown;
      linearRampToValueAtTime(v: number, t: number): unknown;
    };
    connect(dest: unknown): unknown;
    start(t?: number): void;
    stop(t?: number): void;
  };
  createBufferSource(): {
    buffer: unknown;
    loop: boolean;
    connect(dest: unknown): unknown;
    start(t?: number): void;
    stop(t?: number): void;
  };
  createBuffer(
    channels: number,
    length: number,
    rate: number,
  ): {
    getChannelData(c: number): Float32Array;
  };
  createBiquadFilter(): {
    type: string;
    frequency: { value: number };
    Q: { value: number };
    connect(dest: unknown): unknown;
  };
}

export type SoundName =
  | 'wind'
  | 'creak'
  | 'whisper'
  | 'thunder'
  | 'boo'
  | 'chime'
  | 'owl'
  | 'bell'
  | 'timber'
  | 'footsteps'
  | 'latch';

const SOUND_GROUP: Record<SoundName, AudioGroup> = {
  wind: 'ambient',
  creak: 'sfx',
  whisper: 'sfx',
  thunder: 'sfx',
  chime: 'sfx',
  owl: 'ambient',
  bell: 'ambient',
  timber: 'ambient',
  footsteps: 'sfx',
  latch: 'sfx',
  boo: 'scare',
};

/** Level of each continuous ambience bed (0 to 1) and the occasional sounds heard in a chapter. */
export interface AmbienceMix {
  wind: number;
  rain: number;
  drone: number;
  heartbeat: boolean;
  events: SoundName[];
}

const SILENT: AmbienceMix = { wind: 0, rain: 0, drone: 0, heartbeat: false, events: [] };

export const AMBIENCE: Readonly<Record<string, AmbienceMix>> = {
  gate: { wind: 0.7, rain: 0, drone: 0.15, heartbeat: false, events: ['owl', 'bell'] },
  grounds: {
    wind: 0.55,
    rain: 0,
    drone: 0.25,
    heartbeat: false,
    events: ['owl', 'bell', 'timber'],
  },
  attic: { wind: 0.25, rain: 0, drone: 0.35, heartbeat: true, events: ['timber', 'whisper'] },
  castle: { wind: 0.35, rain: 0.6, drone: 0.45, heartbeat: true, events: ['thunder', 'timber'] },
  archive: { wind: 0.15, rain: 0.2, drone: 0.15, heartbeat: false, events: ['timber'] },
};

/** Ambience for a chapter. The heartbeat is a scare effect, so it only plays when scares are allowed. */
export function ambienceMix(
  chapter: string | null | undefined,
  scaresAllowed: boolean,
): AmbienceMix {
  const base = (chapter && AMBIENCE[chapter]) || SILENT;
  return { ...base, events: [...base.events], heartbeat: base.heartbeat && scaresAllowed };
}

/** Sound that carries the visitor between chapters. */
export function transitionSound(to: string): SoundName {
  return to === 'attic' || to === 'castle' ? 'creak' : 'footsteps';
}

/** Gain for the lab's electric hum at a voltage (0 to 100 kV) when the lever is on. */
export function humLevel(voltage: unknown, live: boolean): number {
  if (!live) return 0;
  const n = typeof voltage === 'number' ? voltage : Number.parseFloat(String(voltage));
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n / 100)) : 0;
}

const BED_GAIN = { wind: 0.5, rain: 0.25, drone: 0.12, hum: 0.09 };
const TICK_MS = 2000;

export interface AudioOptions {
  createContext?: () => AudioContextLike;
  /** Returns true when scare sounds may play. */
  scaresAllowed?: () => boolean;
}

function defaultCreateContext(): AudioContextLike {
  const Ctor =
    (globalThis as { AudioContext?: new () => AudioContextLike }).AudioContext ??
    (globalThis as { webkitAudioContext?: new () => AudioContextLike }).webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio not supported');
  return new Ctor();
}

export class AudioManager {
  private ctx: AudioContextLike | null = null;
  private master: GainLike | null = null;
  private groups = new Map<AudioGroup, GainLike>();
  private volumes: Record<AudioGroup, number> = { ...DEFAULT_VOLUMES };
  private muted = false;
  private hidden = false;
  private ambientStop: (() => void) | null = null;
  private chapter: string | null = null;
  private beds: Record<'wind' | 'rain' | 'drone' | 'hum', GainLike> | null = null;
  private bedStop: (() => void)[] = [];
  private tick: ReturnType<typeof setInterval> | null = null;
  private hum = 0;
  private readonly createContext: () => AudioContextLike;
  private readonly scaresAllowed: () => boolean;

  constructor(options: AudioOptions = {}) {
    this.createContext = options.createContext ?? defaultCreateContext;
    this.scaresAllowed = options.scaresAllowed ?? (() => false);
  }

  get started(): boolean {
    return this.ctx !== null;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  getVolume(group: AudioGroup): number {
    return this.volumes[group];
  }

  /** Must be called from a user gesture. Safe to call repeatedly. */
  async start(): Promise<boolean> {
    if (!this.ctx) {
      try {
        this.ctx = this.createContext();
      } catch {
        return false;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      for (const g of Object.keys(this.volumes) as AudioGroup[]) {
        const node = this.ctx.createGain();
        node.gain.value = this.volumes[g];
        node.connect(this.master);
        this.groups.set(g, node);
      }
    }
    if (!this.hidden && this.ctx.state === 'suspended') await this.ctx.resume();
    if (this.chapter) this.applyAmbience();
    return true;
  }

  /** Crossfade to a chapter's ambience. Before start() it is remembered and applied on start. */
  setAmbience(chapter: string): void {
    this.chapter = chapter;
    if (this.ctx) this.applyAmbience();
  }

  get ambience(): string | null {
    return this.chapter;
  }

  /** Lab hum, 0 to 1. Rises with the voltage while the lever is on. */
  setHum(level: number): void {
    this.hum = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
    if (this.beds && this.ctx) this.ramp(this.beds.hum, this.hum * BED_GAIN.hum, 0.4);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      const t = this.ctx.currentTime;
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.15);
    }
  }

  setVolume(group: AudioGroup, volume: number): void {
    const v = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 0));
    this.volumes[group] = v;
    const node = this.groups.get(group);
    if (node && this.ctx) {
      const t = this.ctx.currentTime;
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(v, t + 0.1);
    }
  }

  /** Pause when the tab is hidden, resume when visible again. */
  setHidden(hidden: boolean): void {
    this.hidden = hidden;
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  bindVisibility(doc: Document = document): () => void {
    const handler = () => this.setHidden(doc.visibilityState === 'hidden');
    doc.addEventListener('visibilitychange', handler);
    return () => doc.removeEventListener('visibilitychange', handler);
  }

  canPlay(name: SoundName): boolean {
    if (!this.ctx || !this.master) return false;
    if (SOUND_GROUP[name] === 'scare' && !this.scaresAllowed()) return false;
    return true;
  }

  /** Plays a synthesized sound. Returns false when it was not played. */
  play(name: SoundName): boolean {
    if (!this.canPlay(name) || !this.ctx) return false;
    const out = this.groups.get(SOUND_GROUP[name]);
    if (!out) return false;
    switch (name) {
      case 'wind':
        this.startWind(out);
        break;
      case 'creak':
        this.tone(out, 'sawtooth', 90, 55, 0.9, 0.12);
        break;
      case 'whisper':
        this.noiseBurst(out, 1800, 1.2, 0.08);
        break;
      case 'thunder':
        this.noiseBurst(out, 160, 2.5, 0.35);
        break;
      case 'chime':
        this.tone(out, 'sine', 660, 660, 0.8, 0.1);
        break;
      case 'boo':
        this.tone(out, 'triangle', 220, 110, 0.6, 0.25);
        break;
      case 'owl':
        // Two soft hoots, the second lower.
        this.tone(out, 'sine', 420, 380, 0.45, 0.05);
        this.tone(out, 'sine', 380, 330, 0.7, 0.05, 0.6);
        break;
      case 'bell':
        // A distant bell: a low partial and a quieter inharmonic one, long decay.
        this.tone(out, 'sine', 196, 196, 3.5, 0.04);
        this.tone(out, 'sine', 466, 466, 2.5, 0.015);
        break;
      case 'timber':
        this.tone(out, 'sawtooth', 70, 48, 1.4, 0.035);
        break;
      case 'footsteps':
        for (let i = 0; i < 4; i++) this.noiseBurst(out, 900, 0.16, 0.12, i * 0.42);
        break;
      case 'latch':
        this.noiseBurst(out, 3000, 0.08, 0.2);
        this.tone(out, 'square', 140, 90, 0.18, 0.05, 0.05);
        break;
    }
    return true;
  }

  stopAmbient(): void {
    this.ambientStop?.();
    this.ambientStop = null;
    if (this.tick) clearInterval(this.tick);
    this.tick = null;
    for (const s of this.bedStop) s();
    this.bedStop = [];
    this.beds = null;
  }

  private ramp(g: GainLike, to: number, seconds: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(to, t + seconds);
  }

  private mix(): AmbienceMix {
    return ambienceMix(this.chapter, this.scaresAllowed());
  }

  private applyAmbience(): void {
    if (!this.ctx) return;
    const beds = this.ensureBeds();
    if (!beds) return;
    const m = this.mix();
    this.ramp(beds.wind, m.wind * BED_GAIN.wind, 2.5);
    this.ramp(beds.rain, m.rain * BED_GAIN.rain, 2.5);
    this.ramp(beds.drone, m.drone * BED_GAIN.drone, 3);
    this.ramp(beds.hum, this.chapter === 'castle' ? this.hum * BED_GAIN.hum : 0, 1);
    if (!this.tick) this.tick = setInterval(() => this.onTick(), TICK_MS);
  }

  /** Wind gusts, distant one-off sounds and the heartbeat. Skipped while the tab is hidden. */
  private onTick(): void {
    if (!this.ctx || !this.beds || this.hidden) return;
    const m = this.mix();
    this.ramp(this.beds.wind, m.wind * BED_GAIN.wind * (0.55 + Math.random() * 0.9), 1.8);
    if (m.events.length && Math.random() < 0.14) {
      this.play(m.events[Math.floor(Math.random() * m.events.length)]);
    }
    const scare = this.groups.get('scare');
    if (m.heartbeat && scare) {
      const fast = this.chapter === 'castle' ? 0.3 + this.hum * 0.5 : 0;
      const beats = fast > 0.6 ? 3 : 2;
      for (let b = 0; b < beats; b++) {
        const at = b * (TICK_MS / 1000 / beats);
        this.tone(scare, 'sine', 62, 42, 0.14, 0.12, at);
        this.tone(scare, 'sine', 55, 38, 0.16, 0.08, at + 0.24);
      }
    }
  }

  private ensureBeds() {
    if (this.beds) return this.beds;
    const ctx = this.ctx;
    const out = this.groups.get('ambient');
    if (!ctx || !out) return null;
    const bed = (build: (g: GainLike) => () => void) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(out);
      this.bedStop.push(build(g));
      return g;
    };
    const noise = (g: GainLike, type: string, freq: number, q: number) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(3);
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      src.connect(f);
      f.connect(g);
      src.start();
      return () => src.stop();
    };
    const osc = (g: GainLike, type: string, freq: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 220;
      f.Q.value = 0.7;
      o.connect(f);
      f.connect(g);
      o.start();
      return () => o.stop();
    };
    this.beds = {
      wind: bed((g) => noise(g, 'lowpass', 380, 0.8)),
      rain: bed((g) => noise(g, 'highpass', 2200, 0.5)),
      drone: bed((g) => {
        const a = osc(g, 'sawtooth', 43.6);
        const b = osc(g, 'sawtooth', 44.3);
        return () => {
          a();
          b();
        };
      }),
      hum: bed((g) => osc(g, 'sawtooth', 60)),
    };
    return this.beds;
  }

  dispose(): void {
    this.stopAmbient();
    void this.ctx?.close?.();
    this.ctx = null;
    this.master = null;
    this.groups.clear();
  }

  private startWind(out: GainLike): void {
    if (!this.ctx || this.ambientStop) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(2);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 3);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start();
    this.ambientStop = () => {
      const t = ctx.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 1);
      src.stop(t + 1.1);
    };
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx as AudioContextLike;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private noiseBurst(
    out: GainLike,
    cutoff: number,
    seconds: number,
    peak: number,
    delay = 0,
  ): void {
    const ctx = this.ctx as AudioContextLike;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + seconds * 0.3);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    src.connect(filter);
    filter.connect(g);
    g.connect(out);
    src.start(t);
    src.stop(t + seconds);
  }

  private tone(
    out: GainLike,
    type: string,
    from: number,
    to: number,
    seconds: number,
    peak: number,
    delay = 0,
  ): void {
    const ctx = this.ctx as AudioContextLike;
    const osc = ctx.createOscillator();
    osc.type = type;
    const t = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.linearRampToValueAtTime(to, t + seconds);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.05);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + seconds);
  }
}
