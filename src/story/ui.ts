import { effectiveReducedMotion } from '../a11y/reducedMotion';
import type { InteractionContext } from '../interactions';
import { GOTO_EVENT } from '../interactions/castleDoor';
import { CHAPTER_AREAS, chapterOfArea, enterArea, leaveAll, parseSceneId } from '../scenes';
import type { SceneId } from '../scenes';
import { CHAPTERS, chapterIndex } from './chapters';
import { OBJECTIVE_EVENT } from './events';
import {
  advance,
  canVisit,
  chapterFromHash,
  isDone,
  loadState,
  markDone,
  open,
  saveState,
  visit,
  type StoryState,
  type StoryStorage,
} from './state';

const TYPE_MS = 22;
const VEIL_MS = 450;

/** Mounts the story layer: chapter bar, journey, in-world paths, transitions. Returns a teardown function. */
export function mountStory(
  host: HTMLElement,
  ctx: InteractionContext,
  storage: StoryStorage | null,
): () => void {
  let state: StoryState = loadState(storage);
  let area: SceneId = 'gate';
  let typer = 0;
  let busy = false;
  let veilTimer = 0;

  const bar = document.createElement('section');
  bar.className = 'story';
  bar.setAttribute('aria-label', 'Story');
  bar.innerHTML = `
    <div class="story__head">
      <p class="story__chapter"></p>
      <ol class="story__journey" aria-label="Chapters"></ol>
    </div>
    <p class="story__line"><span class="story__typed" aria-hidden="true"></span><span class="sr-only story__full" aria-live="polite"></span></p>
    <div class="story__foot">
      <p class="story__objective"></p>
      <button type="button" class="story__continue" aria-describedby="story-objective"></button>
    </div>`;
  const veil = document.createElement('div');
  veil.className = 'story__veil';
  veil.setAttribute('aria-hidden', 'true');
  const paths = document.createElement('nav');
  paths.className = 'story__paths';
  paths.setAttribute('aria-label', 'Paths nearby');
  paths.hidden = true;
  host.append(paths, bar, veil);
  const q = <T extends HTMLElement>(s: string) => bar.querySelector(s) as T;
  // Keep the collection book and the credits link in the bar so nothing floats over scene controls.
  const tools = document.createElement('div');
  tools.className = 'story__tools';
  for (const el of document.querySelectorAll<HTMLElement>('.book-btn, .site-footer a')) {
    tools.appendChild(el);
  }
  q<HTMLElement>('.story__foot').appendChild(tools);
  document.querySelector('.site-footer:empty')?.remove();

  const chapterEl = q<HTMLElement>('.story__chapter');
  const journey = q<HTMLOListElement>('.story__journey');
  const typed = q<HTMLElement>('.story__typed');
  const full = q<HTMLElement>('.story__full');
  const objective = q<HTMLElement>('.story__objective');
  objective.id = 'story-objective';
  const cont = q<HTMLButtonElement>('.story__continue');

  const still = () => {
    const s = ctx.settings.get();
    return effectiveReducedMotion(s, ctx.osReducedMotion()) || s.safeMode;
  };

  /** Narration has its own polite live region so it never overwrites an interaction's announcement. */
  const say = (text: string) => {
    clearInterval(typer);
    full.textContent = text;
    if (still()) {
      typed.textContent = text;
      return;
    }
    let n = 0;
    typed.textContent = '';
    typer = window.setInterval(() => {
      n += 2;
      typed.textContent = text.slice(0, n);
      if (n >= text.length) clearInterval(typer);
    }, TYPE_MS);
  };

  const renderJourney = () => {
    journey.innerHTML = '';
    CHAPTERS.forEach((c, i) => {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      const locked = !canVisit(state, i);
      const done = isDone(state, i);
      b.className = 'story__stop';
      b.innerHTML = `<span aria-hidden="true">${i + 1}</span><span class="story__stop-title" aria-hidden="true"> ${c.title}</span>`;
      b.setAttribute(
        'aria-label',
        `Chapter ${i + 1}: ${c.title}${done ? ', complete' : ''}${locked ? ', locked' : ''}`,
      );
      if (i === state.current) b.setAttribute('aria-current', 'step');
      if (locked) b.setAttribute('aria-disabled', 'true');
      if (done) b.classList.add('story__stop--done');
      b.addEventListener('click', () => {
        if (!locked && i !== state.current) goChapter(i);
      });
      li.appendChild(b);
      journey.appendChild(li);
    });
  };

  const renderPaths = () => {
    const chapter = CHAPTERS[state.current];
    const areas = CHAPTER_AREAS[chapter.id];
    paths.hidden = areas.length < 2;
    paths.innerHTML = '';
    for (const a of areas) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'story__sign';
      b.textContent = a.label;
      if (a.id === area) b.setAttribute('aria-current', 'location');
      b.addEventListener('click', () => goArea(a.id));
      paths.appendChild(b);
    }
  };

  const renderBar = () => {
    const chapter = CHAPTERS[state.current];
    const done = isDone(state);
    chapterEl.textContent = `Chapter ${state.current + 1} of ${CHAPTERS.length}: ${chapter.title}`;
    objective.textContent = done
      ? 'Done. ' + chapter.next + '.'
      : `Objective: ${chapter.objective}`;
    cont.textContent = done ? chapter.next : 'Press on anyway';
    cont.dataset.ready = String(done);
    bar.dataset.chapter = chapter.id;
    document.documentElement.dataset.chapter = chapter.id;
    renderJourney();
    renderPaths();
  };

  const syncHeight = () => {
    document.documentElement.style.setProperty('--story-h', `${bar.offsetHeight}px`);
  };

  const mark = () => {
    history.replaceState(null, '', `#${CHAPTERS[state.current].id}`);
  };

  const showArea = (id: SceneId) => {
    area = id;
    enterArea(id, ctx);
  };

  function goArea(id: SceneId) {
    if (busy || id === area) return;
    showArea(id);
    renderPaths();
    const label = CHAPTER_AREAS[CHAPTERS[state.current].id].find((a) => a.id === id)?.label;
    ctx.announce(`You are at: ${label ?? id}.`);
  }

  /** Fade through darkness, swap the scene while dark, fade back. Instant when motion is reduced. */
  function goChapter(index: number, startArea?: SceneId) {
    if (busy) return;
    const target = CHAPTERS[index];
    const swap = () => {
      state = { ...state, current: index };
      saveState(storage, state);
      showArea(startArea ?? CHAPTER_AREAS[target.id][0].id);
      renderBar();
      syncHeight();
      mark();
      say(`${target.title}. ${target.intro}`);
    };
    if (still()) {
      swap();
      return;
    }
    busy = true;
    veil.classList.add('story__veil--on');
    ctx.audio.play('creak');
    veilTimer = window.setTimeout(() => {
      swap();
      veil.classList.remove('story__veil--on');
      busy = false;
    }, VEIL_MS);
  }

  cont.addEventListener('click', () => {
    if (busy) return;
    const next = advance(state);
    saveState(storage, next);
    state = next;
    goChapter(next.current);
  });

  const onObjective = (e: Event) => {
    const chapter = CHAPTERS[state.current];
    if (String((e as CustomEvent).detail) !== chapter.objectiveId || isDone(state)) return;
    state = markDone(state, chapter.id);
    saveState(storage, state);
    renderBar();
    say(chapter.done);
  };
  const onGoto = (e: Event) => {
    const id = parseSceneId(String((e as CustomEvent).detail));
    const idx = chapterIndex(chapterOfArea(id));
    if (idx === state.current) goArea(id);
    else if (canVisit(state, idx)) goChapter(idx, id);
  };
  window.addEventListener(OBJECTIVE_EVENT, onObjective);
  window.addEventListener(GOTO_EVENT, onGoto);
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncHeight);
  ro?.observe(bar);

  // Deep links open their chapter (and area) directly.
  const hash = window.location.hash.replace(/^#/, '');
  const fromHash = chapterFromHash(hash);
  if (fromHash !== null) {
    state = open(state, fromHash);
    saveState(storage, state);
  } else state = visit(state, 0);
  const startArea = parseSceneId(hash);
  const inChapter = CHAPTER_AREAS[CHAPTERS[state.current].id].some((a) => a.id === startArea);
  showArea(
    inChapter && fromHash !== null ? startArea : CHAPTER_AREAS[CHAPTERS[state.current].id][0].id,
  );
  renderBar();
  syncHeight();
  say(`${CHAPTERS[state.current].title}. ${CHAPTERS[state.current].intro}`);

  return () => {
    clearInterval(typer);
    clearTimeout(veilTimer);
    ro?.disconnect();
    window.removeEventListener(OBJECTIVE_EVENT, onObjective);
    window.removeEventListener(GOTO_EVENT, onGoto);
    leaveAll();
    bar.remove();
    veil.remove();
    paths.remove();
  };
}
