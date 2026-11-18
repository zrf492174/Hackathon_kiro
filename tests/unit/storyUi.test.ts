// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/scenes', async (orig) => {
  const real = await orig<typeof import('../../src/scenes')>();
  return { ...real, enterArea: vi.fn(), leaveAll: vi.fn() };
});

import { mountStory } from '../../src/story/ui';
import { signal } from '../../src/story/events';
import { GOTO_EVENT } from '../../src/interactions/castleDoor';
import type { InteractionContext } from '../../src/interactions';

function makeCtx(reduced: boolean) {
  const announce = vi.fn();
  const ctx = {
    root: document.body,
    settings: {
      get: () => ({
        muted: true,
        reducedMotion: reduced,
        scaresEnabled: true,
        safeMode: false,
        flashlight: false,
      }),
    },
    audio: { setAmbience: vi.fn(), play: vi.fn() },
    osReducedMotion: () => false,
    announce,
    addScore: vi.fn(),
  } as unknown as InteractionContext;
  return { ctx, announce };
}

describe('story ui', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    window.location.hash = '';
  });
  afterEach(() => vi.useRealTimers());

  it('shows narration instantly under reduced motion and swaps chapters without a veil', () => {
    const { ctx } = makeCtx(true);
    const off = mountStory(document.body, ctx, null);
    const typed = document.querySelector('.story__typed') as HTMLElement;
    expect(typed.textContent).toBe(document.querySelector('.story__full')?.textContent);
    expect(typed.textContent).not.toBe('');
    signal('gate-open');
    (document.querySelector('.story__continue') as HTMLButtonElement).click();
    expect(document.querySelector('.story__chapter')?.textContent).toContain('Chapter 2 of 5');
    expect(document.activeElement).toBe(document.querySelector('.story__chapter'));
    off();
  });

  it('types text over time with motion and teardown clears the timers', () => {
    vi.useFakeTimers();
    const { ctx } = makeCtx(false);
    const off = mountStory(document.body, ctx, null);
    const typed = document.querySelector('.story__typed') as HTMLElement;
    const full = document.querySelector('.story__full')?.textContent ?? '';
    expect(typed.textContent!.length).toBeLessThan(full.length);
    vi.advanceTimersByTime(60);
    off();
    const frozen = typed.textContent;
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(typed.textContent).toBe(frozen);
    expect(document.querySelector('.story')).toBeNull();
  });

  it('ignores continue while the veil is busy and cancels a pending swap on teardown', () => {
    vi.useFakeTimers();
    const { ctx } = makeCtx(false);
    const off = mountStory(document.body, ctx, null);
    const chapter = document.querySelector('.story__chapter') as HTMLElement;
    const cont = document.querySelector('.story__continue') as HTMLButtonElement;
    cont.click();
    cont.click();
    vi.advanceTimersByTime(450);
    expect(chapter.textContent).toContain('Chapter 2 of 5');
    cont.click();
    off();
    vi.advanceTimersByTime(5000);
    expect(chapter.textContent).toContain('Chapter 2 of 5');
  });

  it('keeps focus on a rebuilt journey stop and announces a locked goto', () => {
    const { ctx, announce } = makeCtx(true);
    const off = mountStory(document.body, ctx, null);
    const stop = document.querySelectorAll<HTMLButtonElement>('.story__stop')[0];
    stop.focus();
    signal('gate-open');
    expect(document.activeElement).toBe(document.querySelectorAll('.story__stop')[0]);
    window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: 'archive' }));
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('locked'));
    off();
  });
});
