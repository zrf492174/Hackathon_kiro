import { escapeHtml, loadDataset, safeUrl, type PublicRecord } from './records';

export function renderItem(r: PublicRecord): string {
  const href = safeUrl(r.url);
  const title = href
    ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>`
    : escapeHtml(r.title);
  return `<li class="gazette__item">
    <h3>${title}</h3>
    <p class="gazette__meta">${escapeHtml(r.venue ?? r.source)}${r.year ? `, ${r.year}` : ''}
      ${r.sample ? '<span class="badge">sample</span>' : ''}</p>
    <p class="gazette__lic">Terms: ${escapeHtml(r.license)}</p>
  </li>`;
}

export interface Gazette {
  destroy(): void;
}

export async function mountGazette(host: HTMLElement): Promise<Gazette> {
  let dead = false;
  const wrap = document.createElement('div');
  wrap.className = 'gazette';
  wrap.innerHTML = '<p>The raven is still flying...</p>';
  host.appendChild(wrap);
  const data = await loadDataset('gazette.json');
  if (dead) return { destroy() {} };
  if (!data || data.records.length === 0) {
    wrap.innerHTML =
      '<p role="status">The raven returned empty-clawed. The gazette could not be loaded while offline.</p>';
  } else {
    wrap.innerHTML = `
      <h2 class="gazette__masthead">The Haunted Gazette</h2>
      <p class="gazette__dateline"><span>Vol. XIII</span><span>Late Moonlight Edition</span><span>Price: One Whisper</span></p>
      <p class="gazette__raven" aria-hidden="true">
        <svg viewBox="0 0 60 30" width="60" height="30"><path d="M2 20 Q20 0 38 12 L58 8 L44 16 Q36 28 18 26 Z" fill="#111"/><circle cx="34" cy="12" r="1.5" fill="#e8d8b0"/></svg>
        Delivered by raven
      </p>
      ${
        data.records.every((r) => r.sample)
          ? '<p class="gazette__notice" role="note">These are reference links, not news stories, until live news is collected.</p>'
          : ''
      }
      <ul class="gazette__list">${data.records.map(renderItem).join('')}</ul>
      <p class="gazette__terms">${escapeHtml(data.meta.terms ?? '')}</p>`;
  }
  return {
    destroy() {
      dead = true;
      wrap.remove();
    },
  };
}
