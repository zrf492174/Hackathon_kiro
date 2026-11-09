import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('./');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Enter muted' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

async function goScene(page: Page, name: string) {
  await page.locator('.scene-nav').getByRole('button', { name, exact: true }).click();
}

test('warning then enter shows the gate', async ({ page }) => {
  await enter(page);
  await expect(page.getByRole('heading', { name: 'Haunted Hollow' })).toBeVisible();
});

test('mute toggle in settings', async ({ page }) => {
  await enter(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  const mute = page.getByLabel('Mute sound');
  await expect(mute).toBeChecked();
  await mute.uncheck();
  await expect(mute).not.toBeChecked();
});

test('pumpkin click does not break the page', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Pumpkin patch');
  const pumpkin = page.locator('.pumpkin').first();
  await pumpkin.click();
  await expect(pumpkin).toBeVisible();
});

test('collection book opens', async ({ page }) => {
  await enter(page);
  await page.locator('.book-btn').click();
  await expect(page.locator('.book')).toBeVisible();
});

test('no serious accessibility violations', async ({ page }) => {
  await enter(page);
  const results = await new AxeBuilder({ page }).analyze();
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    bad.map((v) => `${v.id}: ${v.help} [${v.nodes.map((n) => n.target.join(' ')).join(', ')}]`),
  ).toEqual([]);
});

test('first load under the base path: no errors, assets 200, warning visible', async ({ page }) => {
  const errors: string[] = [];
  const bad: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`);
  });
  const res = await page.goto('./');
  expect(res?.status()).toBe(200);
  const scripts = await page
    .locator('script[type="module"]')
    .evaluateAll((els) => els.map((e) => (e as HTMLScriptElement).src));
  expect(scripts.length).toBeGreaterThan(0);
  for (const s of scripts) {
    expect(s).toContain('/Hackathon_kiro/assets/');
    expect(s).not.toContain('/src/');
  }
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enter muted' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter muted' }).click();
  await expect(page.getByRole('heading', { name: 'Haunted Hollow' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
  expect(bad).toEqual([]);
});

async function axeClean(page: Page) {
  await page.waitForTimeout(800); // let page-turn animation finish
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.map(
    (v) =>
      `${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message ?? '')).join(' | ')}`,
  );
}

test('castle door leads to the library; pages turn by keyboard; DOI link is safe', async ({
  page,
}) => {
  await enter(page);
  await goScene(page, 'Castle');
  expect(await axeClean(page)).toEqual([]);
  await page.getByRole('button', { name: /drawbridge/i }).click();
  await expect(page.locator('.grimoire__book .spell')).toBeVisible();
  const first = await page.locator('.spell__title').innerText();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.grimoire__count')).toContainText('Page 2');
  expect(await page.locator('.spell__title').innerText()).not.toBe(first);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.grimoire__count')).toContainText('Page 1');
  await page.locator('.grimoire select').selectOption({ index: 1 });
  const doi = page.locator('.spell a[href^="https://doi.org/"]');
  await page.locator('.grimoire select').selectOption('all');
  for (let i = 0; i < 12 && (await doi.count()) === 0; i++) await page.keyboard.press('ArrowRight');
  await expect(doi.first()).toHaveAttribute('rel', 'noopener noreferrer');
  expect(await axeClean(page)).toEqual([]);
});

test('lab lever toggles aria-pressed and is accessible', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Laboratory');
  const lever = page.getByRole('button', { name: 'Pull the lever' });
  await expect(lever).toHaveAttribute('aria-pressed', 'false');
  await lever.click();
  await expect(lever).toHaveAttribute('aria-pressed', 'true');
  expect(await axeClean(page)).toEqual([]);
});

test('gazette lists news with terms and axe passes', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Gazette');
  await expect(page.locator('.gazette__item').first()).toBeVisible();
  await expect(page.locator('.gazette__lic').first()).toContainText('Terms');
  expect(await axeClean(page)).toEqual([]);
});

test('reduced motion stops window flicker', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await goScene(page, 'Castle');
  const anim = await page
    .locator('.castle__win')
    .first()
    .evaluate((e) => getComputedStyle(e).animationName);
  expect(anim).toBe('none');
});

test('grouped nav reaches every scene with aria-current', async ({ page }) => {
  await enter(page);
  const nav = page.locator('.scene-nav');
  await expect(nav.getByRole('group')).toHaveCount(2);
  for (const n of [
    'Gate',
    'Pumpkin patch',
    'Graveyard',
    'Foggy Town',
    'Attic',
    'Castle',
    'Laboratory',
    'Library',
    'Gazette',
  ]) {
    const b = nav.getByRole('button', { name: n, exact: true });
    await b.click();
    await expect(b).toHaveAttribute('aria-current', 'page');
    const box = await b.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('graveyard tombstone reveals an epitaph; axe passes', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Graveyard');
  await page.getByRole('button', { name: 'Tombstone of Mirabel Thorne', exact: false }).click();
  await expect(page.locator('.yard__epitaph')).toContainText('Please stop knocking');
  expect(await axeClean(page)).toEqual([]);
});

test('horror homage figure is a keyboard button', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Castle');
  const f = page.getByRole('button', { name: 'Caped gentleman silhouette' });
  await f.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#live')).toContainText('Welcome');
});

test('lab voltage control and lever', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Laboratory');
  const volt = page.getByLabel('Voltage');
  await volt.fill('100');
  const lever = page.getByRole('button', { name: 'Pull the lever' });
  await lever.click();
  await expect(lever).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.scene-lab')).toHaveCSS('--arc', '1');
  await page.getByRole('button', { name: 'Green flask' }).click();
  await expect(page.getByRole('button', { name: 'Green flask' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(await axeClean(page)).toEqual([]);
});

test('lab creature sits up above 70 and lies down at 70', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Laboratory');
  const stage = page.locator('.scene-lab');
  await page.getByRole('button', { name: 'Pull the lever' }).click();
  await page.getByLabel('Voltage').fill('75');
  await expect(stage).toHaveClass(/lab--awake/);
  await expect(page.locator('#live')).toContainText('The creature sits up');
  await expect(stage).toHaveClass(/lab--walking/, { timeout: 6000 });
  await page.getByLabel('Voltage').fill('70');
  await expect(stage).not.toHaveClass(/lab--awake/);
  await expect(page.locator('#live')).toContainText('lies back down');
});

test('foggy town reveals a creature and axe passes', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Foggy Town');
  await page.getByRole('button', { name: 'Listen' }).click();
  await expect(page.locator('.creature--shown')).toHaveCount(1);
  await expect(page.locator('.town__status')).not.toBeEmpty();
  expect(await axeClean(page)).toEqual([]);
});

test('gazette has an aged gradient background', async ({ page }) => {
  await enter(page);
  await goScene(page, 'Gazette');
  const bg = await page.locator('.gazette').evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(bg).toContain('gradient');
});

test('reduced motion keeps new scenes static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await goScene(page, 'Foggy Town');
  expect(
    await page.locator('.town__fog--a').evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await goScene(page, 'Graveyard');
  expect(await page.locator('.yard__mist').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  );
});
