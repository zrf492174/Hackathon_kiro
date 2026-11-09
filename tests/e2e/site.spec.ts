import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('./');
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
  await enter(page);
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
