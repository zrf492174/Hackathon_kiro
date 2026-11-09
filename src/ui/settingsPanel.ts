import type { SettingsStore } from '../core/settings';

interface Row {
  key: 'muted' | 'reducedMotion' | 'scaresEnabled' | 'safeMode' | 'flashlight';
  label: string;
}

const ROWS: Row[] = [
  { key: 'muted', label: 'Mute sound' },
  { key: 'reducedMotion', label: 'Reduce motion' },
  { key: 'scaresEnabled', label: 'Enable jump scares' },
  { key: 'flashlight', label: 'Flashlight mode (dark page, follows pointer or focus)' },
  { key: 'safeMode', label: 'Safe mode (no scares, no flashing)' },
];

export function mountSettingsPanel(parent: HTMLElement, store: SettingsStore): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'settings';
  wrap.innerHTML = `
    <button type="button" class="btn settings-toggle" aria-expanded="false" aria-controls="settings-panel">Settings</button>
    <div id="settings-panel" class="settings-panel" role="group" aria-label="Settings" hidden></div>`;
  const toggle = wrap.querySelector<HTMLButtonElement>('.settings-toggle') as HTMLButtonElement;
  const panel = wrap.querySelector<HTMLElement>('#settings-panel') as HTMLElement;
  const inputs = new Map<Row['key'], HTMLInputElement>();

  for (const row of ROWS) {
    const label = document.createElement('label');
    label.className = 'setting-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.addEventListener('change', () => store.set({ [row.key]: input.checked }));
    label.append(input, document.createTextNode(' ' + row.label));
    panel.appendChild(label);
    inputs.set(row.key, input);
  }

  const sync = () => {
    const s = store.get();
    for (const [key, input] of inputs) input.checked = s[key];
    const scare = inputs.get('scaresEnabled');
    if (scare) scare.disabled = s.safeMode;
  };
  sync();
  const unsub = store.subscribe(sync);

  toggle.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });

  parent.appendChild(wrap);
  return () => {
    unsub();
    wrap.remove();
  };
}
