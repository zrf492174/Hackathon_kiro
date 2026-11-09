import { describe, expect, it } from 'vitest';
import { AudioManager, type AudioContextLike } from '../../src/core/audio';

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
