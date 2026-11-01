import { test, expect } from '@playwright/test';

for (const system of ['light', 'dark']) {
  test(`theme follows ${system} system preference until an explicit keyboard choice`, async ({ page }) => {
    const other = system === 'light' ? 'dark' : 'light';
    await page.emulateMedia({ colorScheme: system });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
    await expect(page.locator('html')).toHaveCSS('color-scheme', system);
    await expect(toggle).toHaveAttribute('aria-pressed', String(system === 'dark'));
    await expect(page.locator('[data-favicon]')).toHaveAttribute('href', `assets/favicon${system === 'dark' ? '-dark' : ''}-32.png?v=2`);

    await page.emulateMedia({ colorScheme: other });
    await expect(page.locator('html')).toHaveCSS('color-scheme', other);
    await expect(page.locator('[data-favicon]')).toHaveAttribute('href', `assets/favicon${other === 'dark' ? '-dark' : ''}-32.png?v=2`);
    await page.emulateMedia({ colorScheme: system });
    await expect(page.locator('html')).toHaveCSS('color-scheme', system);

    await toggle.focus();
    await page.keyboard.press(system === 'light' ? 'Space' : 'Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', String(other === 'dark'));
    await expect(page.locator('html')).toHaveCSS('color-scheme', other);
    await page.reload();
    await expect(page.locator('html')).toHaveCSS('color-scheme', other);
    await page.emulateMedia({ colorScheme: other });
    await page.emulateMedia({ colorScheme: system });
    await expect(page.locator('html')).toHaveCSS('color-scheme', other);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', other === 'dark' ? '#0d0f12' : '#ffffff');
    await expect(page.locator('[data-favicon]')).toHaveAttribute('href', `assets/favicon${system === 'dark' ? '-dark' : ''}-32.png?v=2`);
  });
}

test('theme control remains usable when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage is blocked', 'SecurityError'); },
    });
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
});

test('approved products, sharing assets and responsive navigation work in both themes', async ({ page, request }) => {
  const names = ['SQLBuild', 'SQLTide', 'SQLClean', 'Fensu', 'SQLQuack', 'SQLLoad'];
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 3 })).toHaveText(names);
    await expect(page.getByRole('link', { name: 'SQLStack on GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/sqlstack-io');
    await expect(page.getByText('Compile-time checks, tested behaviour and enforceable architecture.', { exact: true })).toBeVisible();
    await expect(page.locator('footer')).toContainText('Independent tools. Shared foundations. 100% open source.');
    for (const name of names.slice(4)) {
      const card = page.getByRole('article', { name, exact: true });
      await expect(card.getByText('Coming soon', { exact: true })).toBeVisible();
      await expect(card.getByRole('link')).toHaveCount(0);
    }
    await expect(page.getByRole('article', { name: 'Fensu', exact: true })).not.toContainText(/pre-release|coming soon/i);
    for (const width of [320, 390, 768, 1536]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toBeInViewport();
    }
    await expect(page.locator('.hero').getByRole('link')).toHaveCount(1);
    await expect(page.locator('.hero').getByRole('link')).toHaveAccessibleName('View on GitHub');
    await expect(page.locator('.hero').getByRole('link')).toHaveAttribute('href', 'https://github.com/sqlstack-io/sqlstack');
    await page.getByRole('link', { name: 'Skip to tools', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#tools$/);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'SQLBuild website', exact: true })).toBeFocused();
  }

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sqlstack.io/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://sqlstack.io/');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', 'https://sqlstack.io/assets/og-sqlstack-dark.png');
  }
  for (const [path, width, height] of [
    ['/assets/og-sqlstack-dark.png', 1200, 630],
    ['/assets/favicon-16.png', 16, 16],
    ['/assets/favicon-32.png', 32, 32],
    ['/assets/favicon-dark-32.png', 32, 32],
    ['/assets/apple-touch-icon.png', 180, 180],
  ]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toBe('image/png');
    const png = await response.body();
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([width, height]);
  }
  const icon = await request.get('/favicon.ico');
  expect(icon.ok()).toBe(true);
  const ico = await icon.body();
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(3);
  expect([ico[6], ico[22], ico[38]]).toEqual([16, 32, 48]);

  for (const path of ['/assets/favicon-16.png', '/assets/favicon-32.png', '/assets/favicon-dark-32.png', '/favicon.ico']) {
    const pixels = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const corners = [0, canvas.width - 1, canvas.width * (canvas.height - 1), canvas.width * canvas.height - 1];
      return {
        corners: corners.map((pixel) => data[pixel * 4 + 3]),
        opaquePixels: Array.from(data).filter((value, index) => index % 4 === 3 && value === 255).length,
      };
    }, path);
    expect(pixels.corners, path).toEqual([0, 0, 0, 0]);
    expect(pixels.opaquePixels, path).toBeGreaterThan(0);
  }
});
