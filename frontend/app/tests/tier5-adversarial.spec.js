import { test, expect } from '@playwright/test';
import { attachErrorListeners, evaluateLayoutMetrics, navigateToModule } from './helpers/test-utils';

const ALL_VIEWPORTS = [
  // 10 Standard Matrix Viewports
  { width: 320, height: 568, name: '320px (Mobile S - iPhone SE)' },
  { width: 375, height: 667, name: '375px (Mobile M - iPhone 8)' },
  { width: 390, height: 844, name: '390px (Mobile L - iPhone 12/13/14)' },
  { width: 412, height: 915, name: '412px (Mobile - Pixel/Samsung)' },
  { width: 768, height: 1024, name: '768px (Tablet Portrait - iPad Mini)' },
  { width: 820, height: 1180, name: '820px (Tablet - iPad Air)' },
  { width: 1024, height: 768, name: '1024px (Desktop Small / Laptop)' },
  { width: 1280, height: 800, name: '1280px (Standard Desktop)' },
  { width: 1440, height: 900, name: '1440px (Desktop HD)' },
  { width: 1920, height: 1080, name: '1920px (Full HD Desktop)' },
  // Extreme Viewports
  { width: 280, height: 653, name: '280px (Extreme Mobile - Galaxy Fold)' },
  { width: 360, height: 740, name: '360px (Small Android)' },
  { width: 2560, height: 1440, name: '2560px (Extreme Desktop - 4K/Ultrawide)' },
];

test.describe('Tier 5: Adversarial Stress & Empirical Bug Hunting Suite', () => {

  test.beforeEach(async ({ page }) => {
    attachErrorListeners(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  // =========================================================================
  // 1. ADVERSARIAL MULTI-VIEWPORT & EXTREME VIEWPORT STRESS
  // =========================================================================

  for (const vp of ALL_VIEWPORTS) {
    test(`Viewport Stress [${vp.name}]: 0px overflow, in-flow sidebar, zero exceptions across all core routes`, async ({ page }) => {
      const { pageErrors } = attachErrorListeners(page);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const pagesToAudit = [
        'Dashboard',
        'Investigations',
        'Transaction Graph',
        'Wallet Details',
        'VASP Attribution',
        'Legal Dossiers',
        'Case Management',
        'Intelligence & Alerts',
        'Settings',
        'Help & Docs'
      ];

      for (const moduleName of pagesToAudit) {
        await navigateToModule(page, moduleName);
        await page.waitForTimeout(100);

        const metrics = await evaluateLayoutMetrics(page);
        expect(metrics.sidebarOverlapsMain, `Sidebar overlap detected on ${moduleName} at ${vp.width}px`).toBe(false);
        expect(metrics.overflow, `Horizontal overflow detected (${metrics.overflow}px) on ${moduleName} at ${vp.width}px`).toBeLessThanOrEqual(0);
      }

      expect(pageErrors, `Unhandled page errors observed on viewport ${vp.name}`).toEqual([]);
    });
  }

  test('Dynamic Viewport Thrashing & Rapid Window Resizing Stress', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);

    // Rapidly thrash viewport across extreme breakpoints
    const bounceSizes = [
      { width: 1920, height: 1080 },
      { width: 320, height: 568 },
      { width: 1024, height: 768 },
      { width: 280, height: 653 },
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
      { width: 820, height: 1180 },
      { width: 2560, height: 1440 },
      { width: 412, height: 915 },
      { width: 1280, height: 800 }
    ];

    for (let i = 0; i < bounceSizes.length; i++) {
      const size = bounceSizes[i];
      await page.setViewportSize(size);
      // Allow 350ms for CSS transition duration-300 to settle
      await page.waitForTimeout(350);

      // Verify layout integrity after resize
      const metrics = await evaluateLayoutMetrics(page);
      expect(metrics.sidebarOverlapsMain, `Sidebar overlapped after dynamic resize to ${size.width}px`).toBe(false);
      expect(metrics.overflow, `Overflow (${metrics.overflow}px) after dynamic resize to ${size.width}px`).toBeLessThanOrEqual(0);

      // Verify sidebar auto-collapse state logic (<1024px should collapse, >=1024px should expand)
      const aside = page.locator('aside');
      if (await aside.isVisible()) {
        const box = await aside.boundingBox();
        if (box) {
          if (size.width < 1024) {
            expect(box.width).toBeLessThanOrEqual(75); // collapsed width ~72px
          } else {
            expect(box.width).toBeGreaterThanOrEqual(250); // expanded width ~260px
          }
        }
      }
    }

    expect(pageErrors).toEqual([]);
  });

  // =========================================================================
  // 2. GRAPH CONTROLS ADVERSARIAL STRESS
  // =========================================================================

  test('Graph Scrubber Boundary Stress: Step backward past inception & step forward past max', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Transaction Graph');
    await expect(page.locator('h1:has-text("Forensic Topology Canvas")')).toBeVisible();

    const scrubberBar = page.locator('[data-testid="timeline-scrubber-bar"]');
    if (await scrubberBar.isVisible()) {
      const stepBackBtn = page.locator('[data-testid="timeline-step-backward-btn"]');
      const stepForwardBtn = page.locator('[data-testid="timeline-step-forward-btn"]');
      const hopBadge = page.locator('[data-testid="timeline-hop-badge"]');
      const timestampReadout = page.locator('[data-testid="timeline-timestamp-readout"]');

      // 1. Repeatedly click Step Backward 15 times to stress past inception (T0)
      for (let i = 0; i < 15; i++) {
        await stepBackBtn.click();
      }
      await page.waitForTimeout(200);

      // Verify hop badge and timestamp remain clamped and valid without NaN or error
      const backwardText = await timestampReadout.innerText();
      expect(backwardText).not.toContain('NaN');
      expect(backwardText).not.toContain('undefined');
      expect(backwardText).toContain('Trace Inception');
      expect(await hopBadge.innerText()).toContain('Hop 0/');

      // 2. Repeatedly click Step Forward 15 times to stress past completion
      for (let i = 0; i < 15; i++) {
        await stepForwardBtn.click();
      }
      await page.waitForTimeout(200);

      const forwardText = await timestampReadout.innerText();
      expect(forwardText).not.toContain('NaN');
      expect(forwardText).not.toContain('undefined');
      expect(forwardText).toContain('UTC');

      // 3. Reset Scrubber
      const resetScrubberBtn = page.locator('[data-testid="timeline-reset-btn"]');
      await resetScrubberBtn.click();
      await page.waitForTimeout(200);
      expect(await timestampReadout.innerText()).toContain('UTC');
    }

    expect(pageErrors).toEqual([]);
  });

  test('Graph Scrubber Auto-Playback & Concurrency Stress: Scrub while playing', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Transaction Graph');

    const scrubberBar = page.locator('[data-testid="timeline-scrubber-bar"]');
    if (await scrubberBar.isVisible()) {
      const playPauseBtn = page.locator('[data-testid="timeline-play-pause-btn"]');
      const rangeSlider = page.locator('[data-testid="timeline-range-slider"]');

      // 1. Start Auto-Step playback
      await playPauseBtn.click();
      await page.waitForTimeout(500); // let it tick

      // 2. Concurrently drag / change slider while playing
      const minVal = await rangeSlider.getAttribute('min');
      const maxVal = await rangeSlider.getAttribute('max');
      const midVal = Math.floor((Number(minVal) + Number(maxVal)) / 2);

      await rangeSlider.fill(String(midVal));
      await rangeSlider.dispatchEvent('change');
      await page.waitForTimeout(300);

      // Verify playback pauses automatically on manual interaction without error
      const playBtnLabel = await playPauseBtn.getAttribute('aria-label');
      expect(playBtnLabel).toContain('Play timeline playback');

      // 3. Rapid play/pause toggling (10 rapid clicks)
      for (let i = 0; i < 10; i++) {
        await playPauseBtn.click();
      }
      await page.waitForTimeout(200);

      // 4. Reset scrubber
      await page.locator('[data-testid="timeline-reset-btn"]').click();
    }

    expect(pageErrors).toEqual([]);
  });

  test('Graph Zoom & Layout Rapid Stress: Extreme zoom levels & rapid layout reset', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Transaction Graph');

    const zoomInBtn = page.locator('button[title*="Zoom In"]').first();
    const zoomOutBtn = page.locator('button[title*="Zoom Out"]').first();
    const fitBtn = page.locator('button[title*="Fit to Screen"]').first();
    const resetLayoutBtn = page.locator('[data-testid="reset-layout-toolbar-btn"]');

    // 1. Rapidly click Zoom In 20 times (super zoom)
    for (let i = 0; i < 20; i++) {
      await zoomInBtn.click();
    }
    await page.waitForTimeout(200);

    // 2. Rapidly click Zoom Out 25 times (micro zoom)
    for (let i = 0; i < 25; i++) {
      await zoomOutBtn.click();
    }
    await page.waitForTimeout(200);

    // 3. Fit to Screen
    await fitBtn.click();
    await page.waitForTimeout(300);

    // 4. Rapid-fire Reset Layout (10 clicks)
    for (let i = 0; i < 10; i++) {
      await resetLayoutBtn.click();
    }
    await page.waitForTimeout(500);

    // 5. Layout Algorithm Switching Stress
    const layoutSelect = page.locator('select[title*="Layout Algorithm"], select:has-text("Hierarchical")').first();
    if (await layoutSelect.isVisible()) {
      const layouts = ['breadthfirst', 'concentric', 'circle', 'dagre'];
      for (const lay of layouts) {
        await layoutSelect.selectOption(lay);
        await page.waitForTimeout(200);
        await resetLayoutBtn.click();
      }
    }

    expect(pageErrors).toEqual([]);
  });

  test('In-Graph Search & Node Drawer Stress: Malformed queries, injections, rapid selection', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Transaction Graph');

    const searchInput = page.locator('input[placeholder*="Search address / node"]').first();
    if (await searchInput.isVisible()) {
      const adversarialInputs = [
        '', // Empty
        '   ', // Whitespace
        '<script>alert(1)</script>', // XSS payload
        "' OR '1'='1' --", // SQL injection
        '.*+?^${}()|[]\\', // Regex special characters
        '🕵️‍♂️🔍💎🚨', // Unicode emojis
        'A'.repeat(500), // Extreme length
        'NonExistentAddress1234567890XYZ' // Negative case
      ];

      for (const val of adversarialInputs) {
        await searchInput.fill(val);
        await searchInput.press('Enter');
        await page.waitForTimeout(100);
      }
    }

    // Node inspection drawer interactions
    // Click breadcrumb hops if available inside Trace Path bar
    const tracePathBar = page.locator('div.backdrop-blur-md:has(span:has-text("Trace Path:"))');
    if (await tracePathBar.isVisible()) {
      const breadcrumbs = tracePathBar.locator('button');
      const bCount = await breadcrumbs.count();
      for (let i = 0; i < Math.min(bCount, 5); i++) {
        await breadcrumbs.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    // Export PNG
    const exportBtn = page.locator('button:has-text("Export PNG"), button[title*="Export"]').first();
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(900); // Allow export state transition to finish
    }

    expect(pageErrors).toEqual([]);
  });

  // =========================================================================
  // 3. ADVERSARIAL UI CONTROLS, MODALS & INPUTS STRESS
  // =========================================================================

  test('Sidebar Rapid Collapse/Expand & Header Dropdown Interference Stress', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);

    // 1. Rapid sidebar toggling (15 rapid toggles)
    const toggleBtn = page.locator('button[aria-label*="sidebar" i], button[title*="sidebar" i]').first();
    for (let i = 0; i < 15; i++) {
      await toggleBtn.click();
    }
    await page.waitForTimeout(300);

    // Verify layout non-overlap after rapid toggling
    const metrics = await evaluateLayoutMetrics(page);
    expect(metrics.sidebarOverlapsMain).toBe(false);
    expect(metrics.overflow).toBeLessThanOrEqual(0);

    // 2. Header dropdown rapid opening & cross-menu toggling
    const switcherBtn = page.locator('button[title*="Quick Switcher"]').first();
    const alertsBtn = page.locator('button[title*="Tactical"], button[title*="Alerts"]').first();
    const profileBtn = page.locator('header button:has(div:has-text("IO")), header button:has-text("Sharma")').first();

    for (let i = 0; i < 5; i++) {
      await switcherBtn.click();
      await alertsBtn.click();
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
      }
    }
    await page.waitForTimeout(200);

    // 3. Dismiss via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('text=Tactical Intelligence Alerts')).not.toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('CaseDetailModal Stress: Rapid Tab Cycling & Escape / Backdrop Dismissal', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Case Management');

    const viewBtn = page.locator('tbody tr button:has-text("View")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();

      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      const tabOverview = page.locator('button:has-text("Case History & Metadata")');
      const tabTrail = page.locator('button:has-text("Multi-Hop Transaction Trail")');
      const tabVasp = page.locator('button:has-text("VASP Attribution & Nodal Contacts")');
      const tabStatutory = page.locator('button:has-text("Section 94 BNSS & Evidence Seal")');

      // Rapidly cycle tabs 10 times in succession
      for (let i = 0; i < 5; i++) {
        await tabTrail.click();
        await tabVasp.click();
        await tabStatutory.click();
        await tabOverview.click();
      }

      // Check modal tab bar responsiveness (verify no page overflow caused by modal)
      const metrics = await evaluateLayoutMetrics(page);
      expect(metrics.overflow).toBeLessThanOrEqual(0);

      // Dismiss modal with Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }

    expect(pageErrors).toEqual([]);
  });

  test('Form Inputs & Validation Adversarial Stress: Malformed, Empty, and Oversized Inputs', async ({ page }) => {
    const { pageErrors } = attachErrorListeners(page);
    await navigateToModule(page, 'Investigations');

    const walletInput = page.locator('input[placeholder*="TRON"]');
    const firInput = page.locator('input[placeholder*="FIR-"]');
    const traceBtn = page.locator('button:has-text("Execute Automated Trace")');

    // 1. Submit empty form
    await walletInput.fill('');
    await firInput.fill('');
    await traceBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator('text=Please provide both a valid FIR/Case ID and a suspect wallet address').or(page.locator('div:has-text("Error")')).first()).toBeVisible();

    // 2. Submit with 3000-character string in wallet input
    await walletInput.fill('T' + '9'.repeat(3000));
    await firInput.fill('FIR-TEST-ADVERSARIAL');
    await traceBtn.click();
    await page.waitForTimeout(1000);

    // 3. Settings form adversarial inputs
    await navigateToModule(page, 'Settings');
    const officerInput = page.locator('input[value*="Sharma"], input[value*="Rajesh"]').first();
    if (await officerInput.isVisible()) {
      await officerInput.fill('<b style="color:red">Adversarial Officer</b>');
      const saveBtn = page.locator('button:has-text("Save Changes")');
      await saveBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Saved Successfully').first()).toBeVisible();
    }

    expect(pageErrors).toEqual([]);
  });

});
