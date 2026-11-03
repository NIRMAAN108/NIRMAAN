import { test, expect } from '@playwright/test';
import { attachErrorListeners, evaluateLayoutMetrics, navigateToModule } from './helpers/test-utils';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320px (Mobile S)' },
  { width: 375, height: 667, name: '375px (Mobile M)' },
  { width: 390, height: 844, name: '390px (Mobile L - iPhone 12/13/14)' },
  { width: 412, height: 915, name: '412px (Mobile - Pixel/Samsung)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait)' },
  { width: 820, height: 1180, name: '820px (Tablet Air)' },
  { width: 1024, height: 768, name: '1024px (Desktop Small / Laptop)' },
  { width: 1280, height: 800, name: '1280px (Standard Desktop)' },
  { width: 1440, height: 900, name: '1440px (Desktop HD)' },
  { width: 1920, height: 1080, name: '1920px (Full HD Desktop)' },
];

test.describe('Tier 2: Multi-Viewport Responsive Matrix & Layout Metrics', () => {

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name} [${vp.width}x${vp.height}]: Assert 0px overflow, in-flow sidebar, zero exceptions`, async ({ page }) => {
      const { pageErrors } = attachErrorListeners(page);

      // Set viewport dimensions
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 1. Check layout integrity on initial Dashboard
      const dashMetrics = await evaluateLayoutMetrics(page);
      expect(dashMetrics.sidebarOverlapsMain).toBe(false);
      expect(dashMetrics.overflow).toBeLessThanOrEqual(0);

      // 2. Navigate to Investigations
      await navigateToModule(page, 'Investigations');
      await page.waitForTimeout(200);
      const invMetrics = await evaluateLayoutMetrics(page);
      expect(invMetrics.sidebarOverlapsMain).toBe(false);
      expect(invMetrics.overflow).toBeLessThanOrEqual(0);

      // 3. Navigate to Transaction Graph
      await navigateToModule(page, 'Transaction Graph');
      await page.waitForTimeout(200);
      const graphMetrics = await evaluateLayoutMetrics(page);
      expect(graphMetrics.sidebarOverlapsMain).toBe(false);
      expect(graphMetrics.overflow).toBeLessThanOrEqual(0);

      // 4. Navigate to Case Management Vault
      await navigateToModule(page, 'Case Management');
      await page.waitForTimeout(200);
      const caseMetrics = await evaluateLayoutMetrics(page);
      expect(caseMetrics.sidebarOverlapsMain).toBe(false);
      expect(caseMetrics.overflow).toBeLessThanOrEqual(0);

      // 5. Navigate to VASP Attribution
      await navigateToModule(page, 'VASP Attribution');
      await page.waitForTimeout(200);
      const vaspMetrics = await evaluateLayoutMetrics(page);
      expect(vaspMetrics.sidebarOverlapsMain).toBe(false);
      expect(vaspMetrics.overflow).toBeLessThanOrEqual(0);

      // 6. Navigate to Settings
      await navigateToModule(page, 'Settings');
      await page.waitForTimeout(200);
      const settingsMetrics = await evaluateLayoutMetrics(page);
      expect(settingsMetrics.sidebarOverlapsMain).toBe(false);
      expect(settingsMetrics.overflow).toBeLessThanOrEqual(0);

      // Verify zero unhandled exceptions
      expect(pageErrors).toEqual([]);
    });
  }

});
