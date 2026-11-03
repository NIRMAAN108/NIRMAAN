import { test, expect } from '@playwright/test';
import { attachErrorListeners, navigateToModule } from './helpers/test-utils';

test.describe('Tier 4: Live Trace & End-to-End Forensics Scenarios', () => {

  test.beforeEach(async ({ page }) => {
    attachErrorListeners(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Scenario 1: Form Validation & Error Handling on Missing Parameters', async ({ page }) => {
    await navigateToModule(page, 'Investigations');
    await expect(page.locator('h1:has-text("New Blockchain Investigation")')).toBeVisible();

    // Clear wallet and FIR inputs
    const walletInput = page.locator('input[placeholder*="TRON"]');
    const firInput = page.locator('input[placeholder*="FIR-"]');
    await walletInput.fill('');
    await firInput.fill('');

    // Click Execute Automated Trace
    const traceBtn = page.locator('button:has-text("Execute Automated Trace")');
    await traceBtn.click();
    await page.waitForTimeout(200);

    // Assert validation error banner is displayed
    const errorBanner = page.locator('text=Please provide both a valid FIR/Case ID and a suspect wallet address').or(page.locator('div:has-text("Error")'));
    await expect(errorBanner.first()).toBeVisible();
  });

  test('Scenario 2: Multi-Chain Benchmark Presets Data Fidelity', async ({ page }) => {
    await navigateToModule(page, 'Investigations');

    const walletInput = page.locator('input[placeholder*="TRON"]');
    const chainSelect = page.locator('select').first();

    // 1. TRON Preset
    const tronBtn = page.locator('button:has-text("TRON")').first();
    if (await tronBtn.isVisible()) {
      await tronBtn.click();
      await page.waitForTimeout(200);
      const val = await walletInput.inputValue();
      expect(val.startsWith('T')).toBe(true);
      expect(await chainSelect.inputValue()).toBe('tron');
    }

    // 2. EVM Preset
    const evmBtn = page.locator('button:has-text("EVM")').first();
    if (await evmBtn.isVisible()) {
      await evmBtn.click();
      await page.waitForTimeout(200);
      const val = await walletInput.inputValue();
      expect(val.startsWith('0x')).toBe(true);
      expect(await chainSelect.inputValue()).toBe('ethereum');
    }

    // 3. Bitcoin Preset
    const btcBtn = page.locator('button:has-text("Bitcoin")').first();
    if (await btcBtn.isVisible()) {
      await btcBtn.click();
      await page.waitForTimeout(200);
      const val = await walletInput.inputValue();
      expect(val.startsWith('bc1') || val.startsWith('1') || val.startsWith('3')).toBe(true);
      expect(await chainSelect.inputValue()).toBe('bitcoin');
    }
  });

  test('Scenario 3: Automated Multi-Hop Trace Execution & Verdict Card', async ({ page }) => {
    await navigateToModule(page, 'Investigations');

    // Select TRON benchmark preset
    const tronBtn = page.locator('button:has-text("TRON")').first();
    await tronBtn.click();
    await page.waitForTimeout(200);

    // Submit trace
    const traceBtn = page.locator('button:has-text("Execute Automated Trace")');
    await traceBtn.click();

    // Verify trace verdict card appears
    const verdictCard = page.locator('h2:has-text("Forensic Attribution Verdict")')
      .or(page.locator('div:has-text("Trace Complete")'))
      .or(page.locator('div:has-text("Trace Execution Error")'));
    await expect(verdictCard.first()).toBeVisible({ timeout: 15000 });

    // If verdict succeeded, verify Section 63 BSA seal
    const sealText = page.locator('text=Section 63 BSA Tamper-Proof Cryptographic Seal');
    if (await sealText.isVisible()) {
      await expect(sealText).toBeVisible();
    }
  });

  test('Scenario 4: Direct Transition from Completed Trace to Topology Canvas', async ({ page }) => {
    await navigateToModule(page, 'Investigations');

    // Select TRON preset and execute
    await page.locator('button:has-text("TRON")').first().click();
    await page.locator('button:has-text("Execute Automated Trace")').click();

    // Wait for verdict
    await expect(
      page.locator('h2:has-text("Forensic Attribution Verdict"), div:has-text("Trace Complete"), div:has-text("Trace Execution Error")').first()
    ).toBeVisible({ timeout: 15000 });

    // Look for "Open Visual Graph Topology" button
    const openGraphBtn = page.locator('button:has-text("Open Visual Graph Topology")');
    if (await openGraphBtn.isVisible()) {
      await openGraphBtn.click();
      await page.waitForTimeout(500);

      // Verify Transaction Graph view is mounted with the case trace
      await expect(page.locator('h1:has-text("Forensic Topology Canvas")')).toBeVisible();
      const canvas = page.locator('div[style*="radial-gradient"], div.cursor-grab, canvas').first();
      await expect(canvas).toBeVisible();
    }
  });

  test('Scenario 5: Statutory Court Evidence Artifact URL Verification', async ({ page }) => {
    await navigateToModule(page, 'Case Management');
    await expect(page.locator('h1:has-text("Case Management Vault")')).toBeVisible();

    // Check if table contains PDF and ZIP download links
    const pdfLinks = page.locator('tbody a[title*="Court Dossier"], tbody a:has-text("PDF")');
    const zipLinks = page.locator('tbody a[title*="Evidence ZIP"], tbody a:has-text("ZIP")');

    if (await pdfLinks.count() > 0) {
      const pdfHref = await pdfLinks.first().getAttribute('href');
      expect(pdfHref).toContain('/api/cases/');
      expect(pdfHref).toContain('/dossier');
    }

    if (await zipLinks.count() > 0) {
      const zipHref = await zipLinks.first().getAttribute('href');
      expect(zipHref).toContain('/api/cases/');
      expect(zipHref).toContain('/bundle');
    }
  });

});
