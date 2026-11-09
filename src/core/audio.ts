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

export type SoundName = 'wind' | 'creak' | 'whisper' | 'thunder' | 'boo' | 'chime';

const SOUND_GROUP: Record<SoundName, AudioGroup> = {
  wind: 'ambient',
  creak: 'sfx',
  whisper: 'sfx',
  thunder: 'sfx',
  chime: 'sfx',
  boo: 'scare',
};

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
    return true;
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
    }
    return true;
  }

  stopAmbient(): void {
    this.ambientStop?.();
    this.ambientStop = null;
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

  private noiseBurst(out: GainLike, cutoff: number, seconds: number, peak: number): void {
    const ctx = this.ctx as AudioContextLike;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    const t = ctx.currentTime;
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
  ): void {
    const ctx = this.ctx as AudioContextLike;
    const osc = ctx.createOscillator();
    osc.type = type;
    const t = ctx.currentTime;
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
