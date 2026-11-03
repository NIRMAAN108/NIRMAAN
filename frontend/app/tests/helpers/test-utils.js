/**
 * NIRMAAN (ChainTrace AI) - Automated Test Suite Helper Utilities
 * Contains shared helpers for viewport metrics, console monitoring, and navigation.
 */

export const TARGET_VIEWPORTS = [
  { width: 320, height: 568, name: '320px-mobile-s' },
  { width: 375, height: 667, name: '375px-mobile-m' },
  { width: 390, height: 844, name: '390px-mobile-l' },
  { width: 412, height: 915, name: '412px-mobile-android' },
  { width: 768, height: 1024, name: '768px-tablet-portrait' },
  { width: 820, height: 1180, name: '820px-tablet-air' },
  { width: 1024, height: 768, name: '1024px-desktop-small' },
  { width: 1280, height: 800, name: '1280px-desktop-std' },
  { width: 1440, height: 900, name: '1440px-desktop-hd' },
  { width: 1920, height: 1080, name: '1920px-desktop-fhd' },
];

export const APP_PAGES = [
  'Dashboard',
  'Investigations',
  'Transaction Graph',
  'Wallet Details',
  'VASP Attribution',
  'Legal Dossiers',
  'Case Management',
  'Intelligence & Alerts',
  'Settings',
  'Help & Docs',
];

/**
 * Attaches console error and page exception listeners to the page.
 * Returns arrays of captured errors.
 */
export function attachErrorListeners(page) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out benign external fetch failures (when offline / no backend)
      if (
        !text.includes('Failed to load resource') &&
        !text.includes('ERR_CONNECTION_REFUSED') &&
        !text.includes('net::ERR_')
      ) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  return { consoleErrors, pageErrors };
}

/**
 * Checks horizontal overflow and in-flow sidebar alignment metrics.
 * Assertions:
 * 1. Horizontal overflow: scrollWidth - innerWidth <= 0
 * 2. In-flow sidebar non-overlap: aside.right <= main.left + 0.5 (allowing subpixel rounding)
 */
export async function evaluateLayoutMetrics(page) {
  return await page.evaluate(() => {
    const docElem = document.documentElement;
    const scrollW = docElem.scrollWidth;
    const innerW = window.innerWidth;
    const overflow = Math.max(0, scrollW - innerW);

    const aside = document.querySelector('aside');
    const main = document.querySelector('main');

    let sidebarRight = 0;
    let mainLeft = 0;
    let sidebarOverlapsMain = false;
    let sidebarPresent = false;

    if (aside && main) {
      sidebarPresent = true;
      const asideRect = aside.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      sidebarRight = asideRect.right;
      mainLeft = mainRect.left;

      // In a strict side-by-side flex layout, aside.right must be <= main.left (+0.5px tolerance for subpixel rendering)
      if (asideRect.width > 0 && asideRect.right > (mainRect.left + 0.5)) {
        sidebarOverlapsMain = true;
      }
    }

    return {
      scrollWidth: scrollW,
      innerWidth: innerW,
      overflow,
      sidebarPresent,
      sidebarRight,
      mainLeft,
      sidebarOverlapsMain,
    };
  });
}

/**
 * Navigates to a specific module via the sidebar or quick switcher.
 */
export async function navigateToModule(page, moduleName) {
  // Check if sidebar has nav button with this module text
  const navBtn = page.locator('aside nav button').filter({ hasText: moduleName }).first();
  if (await navBtn.isVisible()) {
    await navBtn.scrollIntoViewIfNeeded();
    await navBtn.click();
    await page.waitForTimeout(250);
    return;
  }

  // Check title or aria-label attribute (when sidebar is collapsed)
  const attrBtn = page.locator(`aside button[aria-label="${moduleName}"], aside button[title="${moduleName}"]`).first();
  if (await attrBtn.isVisible()) {
    await attrBtn.click();
    await page.waitForTimeout(250);
    return;
  }

  // Secondary buttons outside nav (Settings, Help & Docs)
  const secondaryBtn = page.locator('aside button').filter({ hasText: moduleName }).first();
  if (await secondaryBtn.isVisible()) {
    await secondaryBtn.scrollIntoViewIfNeeded();
    await secondaryBtn.click();
    await page.waitForTimeout(250);
    return;
  }

  // Fallback to Header quick switcher dropdown
  const switcherBtn = page.locator('button[title*="Quick Switcher"]').first();
  if (await switcherBtn.isVisible()) {
    await switcherBtn.click();
    const item = page.locator('button').filter({ hasText: moduleName }).first();
    if (await item.isVisible()) {
      await item.click();
      await page.waitForTimeout(250);
    }
  }
}
