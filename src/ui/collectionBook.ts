import type { AssetRecord } from '../core/assets';
import type { CollectionStore } from '../core/collection';
import { trapFocus } from '../a11y/focus';

/** Records to show: discovered ids, in manifest order. Pure for testing. */
export function discoveredRecords(records: AssetRecord[], ids: string[]): AssetRecord[] {
  const set = new Set(ids);
  return records.filter((r) => set.has(r.id));
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function safeUrl(u: string | undefined): string | null {
  return u && /^https?:\/\//i.test(u) ? u : null;
}

/** Mounts a button that opens an accessible dialog listing discovered assets. */
export function mountCollectionBook(
  host: HTMLElement,
  store: CollectionStore,
  getRecords: () => AssetRecord[],
): () => void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'book-btn';
  btn.textContent = 'Collection';
  host.appendChild(btn);

  btn.addEventListener('click', () => {
    const dlg = document.createElement('div');
    dlg.className = 'book';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'book-title');
    const items = discoveredRecords(getRecords(), store.list());
    const list = items
      .map((r) => {
        const page = safeUrl(r.source?.pageUrl);
        const lic = safeUrl(r.licenseUrl);
        return `<li><strong>${esc(r.title)}</strong> by ${esc(r.author)}, ${
          lic ? `<a href="${esc(lic)}" rel="noopener">${esc(r.license)}</a>` : esc(r.license)
        }${page ? ` (<a href="${esc(page)}" rel="noopener">source</a>)` : ''}</li>`;
      })
      .join('');
    dlg.innerHTML = `<h2 id="book-title">Collection book</h2>
      <p>${items.length} found</p>
      ${items.length ? `<ul>${list}</ul>` : '<p>Nothing discovered yet. Banish ghosts and light pumpkins.</p>'}
      <button type="button" class="book-close">Close</button>`;
    document.body.appendChild(dlg);
    const release = trapFocus(dlg);
    const close = () => {
      release();
      document.removeEventListener('keydown', onKey);
      dlg.remove();
      btn.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    (dlg.querySelector('.book-close') as HTMLButtonElement).addEventListener('click', close);
    (dlg.querySelector('.book-close') as HTMLButtonElement).focus();
  });
  return () => btn.remove();
}
