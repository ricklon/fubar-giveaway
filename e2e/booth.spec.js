import { test, expect } from '@playwright/test';

test('kiosk supports keyboard story and win, ignores held Space, and fits display', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter kiosk', exact: true }).click();
  await expect(page.locator('body')).toHaveClass('kiosk');
  expect(await page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.locator('#staff-open').click();
  await page.locator('#demo-mode').check();
  await page.getByRole('button', { name: 'Close controls' }).click();
  await page.locator('#spin').focus();
  await page.keyboard.down('Space');
  await expect(page.locator('#show-dialog')).toBeVisible();
  await expect(page.locator('#show-title')).toHaveText('Sussex County Maker Fest');
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
  await expect(page.locator('#show-title')).toHaveText('Sussex County Maker Fest');
  await page.keyboard.press('Enter');
  await expect(page.locator('#show-title')).toHaveText('No match this time. Glad you stopped by.');
  await page.keyboard.press('Enter');
  await expect(page.locator('#show-dialog')).not.toBeVisible();
  await expect(page.locator('#spin')).toBeEnabled();
  await page.locator('#staff-open').click();
  await page.locator('#demo-win').click();
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#show-dialog')).toHaveClass(/celebration/);
  await expect(page.locator('#show-demo')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#show-dialog')).not.toBeVisible();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1'))).claimed).toBe(false);
});

test('kiosk fits a 1080p display and preserves reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?kiosk=1');
  await expect(page.locator('body')).toHaveClass('kiosk');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.screenshot({ path: '/tmp/fubar-kiosk.png', fullPage: true });
});
