import { trapFocus } from '../a11y/focus';

export interface WarningResult {
  sound: boolean;
}

/** Blocks entry until the visitor confirms. Resolves on a user gesture. */
export function showWarningModal(parent: HTMLElement): Promise<WarningResult> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="warn-title" aria-describedby="warn-desc">
        <h2 id="warn-title" class="glitch" data-text="Warning">Warning</h2>
        <p id="warn-desc">
          This site has a spooky atmosphere, dim lighting, and occasional flickering light.
          It may include sudden sounds if you turn on jump scares. Jump scares are off by default.
          If you are sensitive to flashing light, enable Safe mode in settings.
        </p>
        <div class="modal-actions">
          <button type="button" class="btn primary" data-action="sound">Enter with sound</button>
          <button type="button" class="btn" data-action="silent">Enter muted</button>
        </div>
      </div>`;
    parent.appendChild(overlay);
    const release = trapFocus(overlay);
    const first = overlay.querySelector<HTMLButtonElement>('[data-action="silent"]');
    first?.focus();
    const finish = (sound: boolean) => {
      release();
      overlay.remove();
      resolve({ sound });
    };
    overlay.querySelector('[data-action="sound"]')?.addEventListener('click', () => finish(true));
    overlay.querySelector('[data-action="silent"]')?.addEventListener('click', () => finish(false));
  });
}
