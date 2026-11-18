import { describe, expect, it } from 'vitest';
import {
  AMBIENCE,
  AudioManager,
  ambienceMix,
  humLevel,
  transitionSound,
  type AudioContextLike,
} from '../../src/core/audio';

function fakeCtx() {
  const calls = { resume: 0, suspend: 0, sources: 0, oscs: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime(v: number) {
      this.value = v;
    },
    linearRampToValueAtTime(v: number) {
      this.value = v;
    },
  });
  const ctx: AudioContextLike = {
    currentTime: 0,
    state: 'suspended',
    destination: {},
    sampleRate: 100,
    async resume() {
      calls.resume++;
      ctx.state = 'running';
    },
    async suspend() {
      calls.suspend++;
      ctx.state = 'suspended';
    },
    createGain: () => ({ gain: param(), connect: () => undefined }),
    createOscillator: () => {
      calls.oscs++;
      return {
        type: '',
        frequency: param(),
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      };
    },
    createBufferSource: () => {
      calls.sources++;
      return {
        buffer: null,
        loop: false,
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      };
    },
    createBuffer: (_c, len) => ({ getChannelData: () => new Float32Array(len) }),
    createBiquadFilter: () => ({
      type: '',
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: () => undefined,
    }),
  };
  return { ctx, calls };
}

describe('AudioManager', () => {
  it('does not create a context until started (gesture)', () => {
    let created = 0;
    const m = new AudioManager({
      createContext: () => {
        created++;
        return fakeCtx().ctx;
      },
    });
    expect(m.started).toBe(false);
    expect(m.play('wind')).toBe(false);
    expect(created).toBe(0);
  });

  it('start creates and resumes the context once', async () => {
    const f = fakeCtx();
    let created = 0;
    const m = new AudioManager({
      createContext: () => {
        created++;
        return f.ctx;
      },
    });
    expect(await m.start()).toBe(true);
    expect(await m.start()).toBe(true);
    expect(created).toBe(1);
    expect(f.calls.resume).toBe(1);
  });

  it('start returns false when Web Audio is unavailable', async () => {
    const m = new AudioManager({
      createContext: () => {
        throw new Error('unsupported');
      },
    });
    expect(await m.start()).toBe(false);
    expect(m.play('creak')).toBe(false);
  });

  it('mute and volume clamp', async () => {
    const m = new AudioManager({ createContext: () => fakeCtx().ctx });
    m.setMuted(true);
    expect(m.isMuted).toBe(true);
    await m.start();
    m.setVolume('sfx', 5);
    expect(m.getVolume('sfx')).toBe(1);
    m.setVolume('sfx', -1);
    expect(m.getVolume('sfx')).toBe(0);
    m.setVolume('sfx', NaN);
    expect(m.getVolume('sfx')).toBe(0);
  });

  it('scare sounds are blocked unless allowed', async () => {
    let allowed = false;
    const m = new AudioManager({
      createContext: () => fakeCtx().ctx,
      scaresAllowed: () => allowed,
    });
    await m.start();
    expect(m.play('boo')).toBe(false);
    expect(m.play('creak')).toBe(true);
    allowed = true;
    expect(m.play('boo')).toBe(true);
  });

  it('suspends when hidden and resumes when visible', async () => {
    const f = fakeCtx();
    const m = new AudioManager({ createContext: () => f.ctx });
    await m.start();
    m.setHidden(true);
    expect(f.calls.suspend).toBe(1);
    m.setHidden(false);
    expect(f.calls.resume).toBe(2);
  });

  it('does not resume on start while hidden', async () => {
    const f = fakeCtx();
    const m = new AudioManager({ createContext: () => f.ctx });
    m.setHidden(true);
    await m.start();
    expect(f.calls.resume).toBe(0);
  });

  it('wind loops once and can be stopped', async () => {
    const f = fakeCtx();
    const m = new AudioManager({ createContext: () => f.ctx });
    await m.start();
    m.play('wind');
    m.play('wind');
    expect(f.calls.sources).toBe(1);
    m.stopAmbient();
    m.play('wind');
    expect(f.calls.sources).toBe(2);
  });
});

describe('chapter ambience', () => {
  it('mixes per chapter and gates the heartbeat behind scares', () => {
    expect(ambienceMix('castle', false).rain).toBeGreaterThan(0);
    expect(ambienceMix('castle', false).heartbeat).toBe(false);
    expect(ambienceMix('castle', true).heartbeat).toBe(true);
    expect(ambienceMix('gate', true).heartbeat).toBe(false);
    expect(ambienceMix('grounds', false).wind).toBeGreaterThan(ambienceMix('archive', false).wind);
    expect(ambienceMix('nowhere', true)).toMatchObject({
      wind: 0,
      rain: 0,
      drone: 0,
      heartbeat: false,
    });
    for (const id of Object.keys(AMBIENCE)) {
      for (const e of AMBIENCE[id].events) expect(e).not.toBe('boo');
    }
  });

  it('picks a transition sound and a hum level', () => {
    expect(transitionSound('castle')).toBe('creak');
    expect(transitionSound('grounds')).toBe('footsteps');
    expect(humLevel(75, true)).toBe(0.75);
    expect(humLevel('120', true)).toBe(1);
    expect(humLevel(80, false)).toBe(0);
    expect(humLevel('x', true)).toBe(0);
  });

  it('remembers the chapter before start and builds beds once after the gesture', async () => {
    const f = fakeCtx();
    const m = new AudioManager({ createContext: () => f.ctx });
    m.setAmbience('castle');
    expect(f.calls.sources).toBe(0);
    await m.start();
    expect(m.ambience).toBe('castle');
    const sources = f.calls.sources;
    expect(sources).toBe(2); // wind and rain noise beds
    m.setAmbience('attic');
    m.setHum(0.5);
    expect(f.calls.sources).toBe(sources);
    m.dispose();
  });

  it('new one-off sounds play once started', async () => {
    const f = fakeCtx();
    const m = new AudioManager({ createContext: () => f.ctx });
    expect(m.play('owl')).toBe(false);
    await m.start();
    for (const s of ['owl', 'bell', 'timber', 'footsteps', 'latch'] as const) {
      expect(m.play(s)).toBe(true);
    }
    m.dispose();
  });
});
