import {
  clampPage,
  doiUrl,
  escapeHtml,
  filterByTopic,
  formatCitation,
  loadDataset,
  safeUrl,
  topicsOf,
  type PublicRecord,
} from './records';

const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹ';

function link(href: string, text: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

/** Renders one record as a spell page. All text is escaped. */
export function renderSpell(r: PublicRecord, index: number, total: number): string {
  const href = r.doi ? doiUrl(r.doi) : safeUrl(r.url);
  const rune = RUNES[index % RUNES.length];
  const snippet = r.abstractSnippet
    ? `<p class="spell__abstract">${escapeHtml(r.abstractSnippet)}</p>`
    : '';
  const sample = r.sample ? '<span class="badge">sample</span>' : '';
  const ref = href
    ? `<p class="spell__link">${link(href, r.doi ? `DOI ${r.doi}` : 'Read the original')}</p>`
    : '';
  return `<article class="spell" aria-label="Incantation ${index + 1} of ${total}">
    <p class="spell__rune" aria-hidden="true">${rune}</p>
    <h3 class="spell__title">${escapeHtml(r.title)}</h3>
    <p class="spell__meta">Inscribed by ${escapeHtml(r.authors.join(', ') || 'an unknown hand')}${
      r.year ? `, ${r.year}` : ''
    }${r.venue ? ` &middot; ${escapeHtml(r.venue)}` : ''} ${sample}</p>
    <p class="spell__cite">${escapeHtml(formatCitation(r))}</p>
    ${snippet}${ref}
  </article>`;
}

export interface Grimoire {
  destroy(): void;
}

/** Mounts the spellbook into host. Falls back to a message if data is unavailable. */
export async function mountGrimoire(
  host: HTMLElement,
  isReduced: () => boolean,
  announce: (m: string) => void,
): Promise<Grimoire> {
  let dead = false;
  let keyHandler: ((e: KeyboardEvent) => void) | null = null;
  const wrap = document.createElement('div');
  wrap.className = 'grimoire';
  wrap.innerHTML = '<p class="grimoire__status">The pages are stirring...</p>';
  host.appendChild(wrap);
  const data = await loadDataset('grimoire.json');
  if (dead) return { destroy() {} };
  if (!data || data.records.length === 0) {
    wrap.innerHTML =
      '<p class="grimoire__status" role="status">The grimoire is sealed. Its pages could not be loaded while offline.</p>';
    return { destroy: () => wrap.remove() };
  }
  const topics = topicsOf(data.records);
  wrap.innerHTML = `
    <h2 class="grimoire__heading">The Grimoire of Forbidden Science</h2>
    <label class="grimoire__filter">Chapter
      <select>${['all', ...topics]
        .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
        .join('')}</select>
    </label>
    <div class="grimoire__book" tabindex="-1"></div>
    <div class="grimoire__controls">
      <button type="button" data-dir="-1">Previous page</button>
      <span class="grimoire__count"></span>
      <button type="button" data-dir="1">Next page</button>
    </div>
    <p class="grimoire__terms">${escapeHtml(data.meta.terms ?? '')}</p>`;
  const book = wrap.querySelector('.grimoire__book') as HTMLElement;
  const count = wrap.querySelector('.grimoire__count') as HTMLElement;
  const select = wrap.querySelector('select') as HTMLSelectElement;
  const prev = wrap.querySelector('[data-dir="-1"]') as HTMLButtonElement;
  const next = wrap.querySelector('[data-dir="1"]') as HTMLButtonElement;
  let list = data.records;
  let page = 0;
  const show = (turn: boolean) => {
    page = clampPage(page, list.length);
    const r = list[page];
    book.innerHTML = r ? renderSpell(r, page, list.length) : '<p>This chapter is empty.</p>';
    count.textContent = `Page ${list.length ? page + 1 : 0} of ${list.length}`;
    prev.disabled = page === 0;
    next.disabled = page >= list.length - 1;
    book.classList.remove('turning');
    if (turn && !isReduced()) {
      void book.offsetWidth;
      book.classList.add('turning');
    }
    if (r) announce(`Page ${page + 1} of ${list.length}: ${r.title}`);
  };
  const turn = (d: number) => {
    const to = clampPage(page + d, list.length);
    if (to === page) return;
    page = to;
    show(true);
  };
  prev.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  select.addEventListener('change', () => {
    list = filterByTopic(data.records, select.value);
    page = 0;
    show(false);
  });
  keyHandler = (e) => {
    const t = e.target as HTMLElement | null;
    if (t && t.closest('select, input, textarea')) return;
    if (e.key === 'ArrowLeft') turn(-1);
    else if (e.key === 'ArrowRight') turn(1);
  };
  document.addEventListener('keydown', keyHandler);
  show(false);
  return {
    destroy() {
      dead = true;
      if (keyHandler) document.removeEventListener('keydown', keyHandler);
      wrap.remove();
    },
  };
}
