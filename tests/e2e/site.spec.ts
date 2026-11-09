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
