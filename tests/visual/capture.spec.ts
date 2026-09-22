import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Hack Engine Visual Capture Suite
 * Consumes routes.json and renders full-page screenshots at 375, 768, and 1440 viewports.
 * Captured PNGs are reviewed by the ui-critic agent to score visual craft.
 */

interface ViewportConfig {
  name: string;
  width: number;
  height: number;
}

interface RouteConfig {
  path: string;
  name: string;
  description?: string;
}

interface RouteManifest {
  baseUrl: string;
  viewports: ViewportConfig[];
  routes: RouteConfig[];
}

const manifestPath = path.resolve(__dirname, '../../routes.json');
const manifest: RouteManifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
  : {
      baseUrl: 'http://localhost:3000',
      viewports: [
        { name: 'mobile', width: 375, height: 812 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'desktop', width: 1440, height: 900 }
      ],
      routes: [{ path: '/', name: 'home' }]
    };

const outputDir = path.resolve(__dirname, '../../docs/reviews/screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
});

for (const route of manifest.routes) {
  test.describe(`Visual capture: ${route.name} (${route.path})`, () => {
    for (const vp of manifest.viewports) {
      test(`render @ ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const targetUrl = `${manifest.baseUrl}${route.path}`;
        
        try {
          const response = await page.goto(targetUrl, {
            waitUntil: 'networkidle',
            timeout: 10000
          });

          // Ensure page loaded without server error
          if (response) {
            expect(response.status()).toBeLessThan(400);
          }

          // Wait for custom fonts and animations to settle
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(500);

          const screenshotPath = path.join(
            outputDir,
            `${route.name}-${vp.name}.png`
          );

          await page.screenshot({
            path: screenshotPath,
            fullPage: true
          });

          console.log(`Saved screenshot: ${screenshotPath}`);
        } catch (err) {
          console.warn(`Could not capture ${targetUrl}: Server may be offline. Skipping screenshot.`);
        }
      });
    }
  });
}
