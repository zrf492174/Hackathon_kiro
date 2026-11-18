import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function enter(page: Page, hash = '') {
  await page.goto(`./${hash ? '#' + hash : ''}`);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Enter muted' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
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
  await enter(page, 'patch');
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

test('archive tabs; pages turn by keyboard; DOI link is safe', async ({ page }) => {
  await enter(page, 'archive');
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
  await enter(page, 'lab');
  const lever = page.getByRole('button', { name: 'Pull the lever' });
  await expect(lever).toHaveAttribute('aria-pressed', 'false');
  await lever.click();
  await expect(lever).toHaveAttribute('aria-pressed', 'true');
  expect(await axeClean(page)).toEqual([]);
});

test('gazette lists news with terms and axe passes', async ({ page }) => {
  await enter(page, 'archive');
  await page.getByRole('tab', { name: 'Gazette' }).click();
  await expect(page.locator('.gazette__item').first()).toBeVisible();
  await expect(page.locator('.gazette__lic').first()).toContainText('Terms');
  expect(await axeClean(page)).toEqual([]);
});

test('reduced motion stops window flicker', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page, 'castle');
  const anim = await page
    .locator('.castle__win')
    .first()
    .evaluate((e) => getComputedStyle(e).animationName);
  expect(anim).toBe('none');
});

test('castle stair leads down to the laboratory within the chapter', async ({ page }) => {
  await enter(page, 'castle');
  expect(await axeClean(page)).toEqual([]);
  await page.getByRole('button', { name: /stair down to the laboratory/i }).click();
  await expect(page.locator('.scene-lab')).toBeVisible();
  await expect(page.locator('.story__chapter')).toContainText('Chapter 4 of 5');
  await page.getByRole('button', { name: 'Castle hall' }).click();
  await expect(page.locator('.scene-castle')).toBeVisible();
});

test('archive has an accessible tablist for grimoires and gazette', async ({ page }) => {
  await enter(page, 'archive');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(2);
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.gazette__item').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open the collection book' })).toBeVisible();
});

test('no scene nav; story walks five chapters by keyboard and axe passes in each', async ({
  page,
}) => {
  await enter(page);
  await expect(page.locator('.scene-nav')).toHaveCount(0);
  const cont = page.locator('.story__continue');
  const chapters = ['The Gate', 'The Grounds', 'The Attic', 'The Castle', 'The Archive'];
  for (let i = 0; i < chapters.length; i++) {
    await expect(page.locator('.story__chapter')).toHaveText(
      `Chapter ${i + 1} of 5: ${chapters[i]}`,
    );
    await expect(page.locator('.story__journey [aria-current="step"]')).toHaveAttribute(
      'aria-label',
      new RegExp(`Chapter ${i + 1}:`),
    );
    const box = await cont.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(await axeClean(page)).toEqual([]);
    if (i < chapters.length - 1) {
      await cont.focus();
      await page.keyboard.press('Enter');
    }
  }
  // locked chapters are disabled, reached ones can be revisited
  await page.locator('.story__journey button').first().click();
  await expect(page.locator('.story__chapter')).toContainText('Chapter 1 of 5');
  await expect(page.locator('.story__journey button').nth(4)).not.toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('objectives complete from the real interactions and mark the continue button ready', async ({
  page,
}) => {
  await enter(page);
  const cont = page.locator('.story__continue');
  await expect(cont).toHaveAttribute('data-ready', 'false');
  await expect(cont).toHaveText('Press on anyway');
  await page.getByRole('button', { name: 'Lift the latch' }).click();
  await expect(cont).toHaveAttribute('data-ready', 'true');
  await cont.click();
  await expect(page.locator('.story__chapter')).toContainText('The Grounds');
  for (const n of [3, 1, 5, 2, 4]) {
    await page.getByRole('button', { name: new RegExp(`^Pumpkin ${n},`) }).click();
  }
  await expect(cont).toHaveAttribute('data-ready', 'true');
});

test('blowing out all candles marks the attic ready', async ({ page }) => {
  await enter(page, 'attic');
  const cont = page.locator('.story__continue');
  await expect(cont).toHaveAttribute('data-ready', 'false');
  for (const n of [1, 2, 3]) {
    await page.getByRole('button', { name: new RegExp(`^Candle ${n},`) }).click();
  }
  await expect(cont).toHaveAttribute('data-ready', 'true');
});

test('waking the lab creature marks the castle ready', async ({ page }) => {
  await enter(page, 'lab');
  const cont = page.locator('.story__continue');
  await expect(cont).toHaveAttribute('data-ready', 'false');
  await page.getByRole('button', { name: 'Pull the lever' }).click();
  await page.getByLabel('Voltage').fill('75');
  await expect(cont).toHaveAttribute('data-ready', 'true');
});

test('turning a grimoire page marks the archive ready', async ({ page }) => {
  await enter(page, 'archive');
  const cont = page.locator('.story__continue');
  await expect(cont).toHaveAttribute('data-ready', 'false');
  await page.getByRole('tab', { name: 'Grimoires' }).click();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(cont).toHaveAttribute('data-ready', 'true');
});

test('legacy hashes open the merged chapter', async ({ page }) => {
  await enter(page, 'library');
  await expect(page.locator('.story__chapter')).toContainText('The Archive');
  await expect(page.getByRole('tab', { name: 'Grimoires' })).toBeVisible();
});

test('graveyard tombstone reveals an epitaph; axe passes', async ({ page }) => {
  await enter(page, 'graveyard');
  await page.getByRole('button', { name: 'Tombstone of Mirabel Thorne', exact: false }).click();
  await expect(page.locator('.yard__epitaph')).toContainText('Please stop knocking');
  expect(await axeClean(page)).toEqual([]);
});

test('horror homage figure is a keyboard button', async ({ page }) => {
  await enter(page, 'castle');
  const f = page.getByRole('button', { name: 'Caped gentleman silhouette' });
  await f.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#live')).toContainText('Welcome');
});

test('lab voltage control and lever', async ({ page }) => {
  await enter(page, 'lab');
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
  await enter(page, 'lab');
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
  await enter(page, 'fog');
  await page.getByRole('button', { name: 'Listen' }).click();
  await expect(page.locator('.creature--shown')).toHaveCount(1);
  await expect(page.locator('.town__status')).not.toBeEmpty();
  expect(await axeClean(page)).toEqual([]);
});

test('gazette has an aged gradient background', async ({ page }) => {
  await enter(page, 'archive');
  await page.getByRole('tab', { name: 'Gazette' }).click();
  const bg = await page.locator('.gazette').evaluate((e) => getComputedStyle(e).backgroundImage);
  expect(bg).toContain('gradient');
});

test('reduced motion keeps new scenes static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page, 'fog');
  expect(
    await page.locator('.town__fog--a').evaluate((e) => getComputedStyle(e).animationName),
  ).toBe('none');
  await page.getByRole('button', { name: 'Churchyard' }).click();
  expect(await page.locator('.yard__mist').evaluate((e) => getComputedStyle(e).animationName)).toBe(
    'none',
  );
});

test('reduced motion keeps grain, light flicker and parallax still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page, 'attic');
  const anim = (sel: string) =>
    page.locator(sel).evaluate((e) => getComputedStyle(e).animationName);
  expect(await anim('.grain')).toBe('none');
  expect(await anim('.light__pool')).toBe('none');
  await page.mouse.move(10, 10);
  await page.mouse.move(600, 400);
  expect(await page.locator('#fog').evaluate((e) => getComputedStyle(e).transform)).toBe('none');
  await expect(page.locator('.loft__svg')).toBeVisible();
});
