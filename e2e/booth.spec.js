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
  await page.keyboard.press('Space');
  await expect(page.locator('#show-title')).toHaveText('No match this time. Glad you stopped by.');
  await page.keyboard.press('Space');
  await expect(page.locator('#show-dialog')).not.toBeVisible();
  await expect(page.locator('#spin')).toBeEnabled();
  await page.locator('#staff-open').click();
  await page.locator('#demo-win').click();
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#show-dialog')).toHaveClass(/celebration/);
  await expect(page.locator('#show-demo')).toBeVisible();
  await page.keyboard.press('Space');
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

test('Dummy 13 kit preview uses its photo without consuming a prize', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const before = await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1'));
  await page.locator('#staff-open').click();
  await page.locator('#preview-prize').selectOption('figure');
  await page.locator('#demo-win').click();
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.locator('#show-next').click();
  await expect(page.locator('#show-kicker')).toHaveText('DUMMY 13 KIT WINNER');
  await expect(page.locator('#show-art img')).toHaveAttribute('src', /prizes\/poseable-figure.jpg$/);
  expect(await page.locator('#show-art img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.reel img')).toHaveCount(3);
  await expect(page.locator('#show-demo')).toBeVisible();
  await page.screenshot({ path: '/tmp/fubar-dummy13-preview.png' });
  await page.locator('#show-next').click();
  expect(await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1'))).toBe(before);
});

test('an existing puzzle win opens the kit after thirty minutes and survives refresh', async ({ page }) => {
  const hourStart = Date.UTC(2026, 8, 25, 12);
  await page.clock.setFixedTime(hourStart + 20 * 60_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?kiosk=1');
  await page.evaluate(({ hourStart }) => localStorage.setItem('fubar-hourly-drawing-v1', JSON.stringify({
    hour: Math.floor(hourStart / 3_600_000), winAt: hourStart, claimed: true, lastWinAt: hourStart + 10 * 60_000,
  })), { hourStart });
  await page.reload();
  await expect(page.locator('.prize-detail h3')).toHaveText('Dummy 13 kit');
  await expect(page.locator('#countdown')).toHaveText('20:00');
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  await page.locator('#spin').click();
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.locator('#show-next').click();
  await expect(page.locator('#show-title')).toHaveText('No match this time. Glad you stopped by.');
  await page.locator('#show-next').click();
  await page.clock.setFixedTime(hourStart + 40 * 60_000);
  await page.reload();
  await page.locator('#spin').click();
  await expect(page.locator('#show-dialog')).toBeVisible();
  await page.locator('#show-next').click();
  await expect(page.locator('#show-kicker')).toHaveText('DUMMY 13 KIT WINNER');
  await expect(page.locator('#show-demo')).toBeHidden();
  await page.locator('#show-next').click();
  await page.reload();
  await expect(page.locator('#spin')).toBeDisabled();
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1')));
  expect(saved.claimedPrizes).toEqual(['puzzle', 'figure']);
  expect(saved.lastWinAt).toBe(hourStart + 40 * 60_000);
});


test('both prizes are visible before a spin and browsing preserves the live schedule', async ({ page }) => {
  await page.goto('/?kiosk=1');
  const options = page.getByRole('group', { name: 'Prizes you could win' });
  await expect(options.getByRole('button', { name: /FUBAR Puzzle/ })).toBeVisible();
  await expect(options.getByRole('button', { name: /Dummy 13 kit/ })).toBeVisible();
  const before = await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1'));
  await options.getByRole('button', { name: /Dummy 13 kit/ }).click();
  await expect(page.locator('.prize-detail h3')).toHaveText('Dummy 13 kit');
  await expect(page.locator('#hero-puzzle img')).toHaveAttribute('src', /poseable-figure.jpg$/);
  await expect(page.locator('.machine-title p')).toContainText('This spin: FUBAR Puzzle');
  await expect(options.getByRole('button', { name: /Dummy 13 kit/ })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('fubar-hourly-drawing-v1'))).toBe(before);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  expect(await page.locator('.prize-card').evaluate(card => card.querySelector('#countdown').getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom)).toBe(true);
  await page.screenshot({ path: '/tmp/fubar-prize-options.png', fullPage: true });
  await page.locator('#staff-open').click();
  await page.locator('#demo-mode').check();
  await page.getByRole('button', { name: 'Close controls' }).click();
  await expect(page.locator('.machine-title p')).toContainText('This spin: Dummy 13 kit');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(options.getByRole('button', { name: /Dummy 13 kit/ })).toBeVisible();
  await expect(options.getByRole('button', { name: /FUBAR Puzzle/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
