import { test, expect } from '@playwright/test';
import { attachErrorListeners, navigateToModule } from './helpers/test-utils';

test.describe('Tier 3: Cross-Feature Forensic Workflows', () => {

  test.beforeEach(async ({ page }) => {
    attachErrorListeners(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Workflow 1: Dashboard → Case Details Modal → Graph Canvas → Case Vault', async ({ page }) => {
    // 1. Start on Dashboard
    await expect(page.locator('text=Welcome back, Investigating Officer').first()).toBeVisible();

    // 2. Click a recent case in the investigations table
    const caseRow = page.locator('tbody tr').first();
    await expect(caseRow).toBeVisible();
    await caseRow.click();

    // 3. Inspect CaseDetailModal
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Verify metadata highlights
    await expect(page.locator('text=Reported Loss').first()).toBeVisible();
    await expect(page.locator('text=Total Traced').first()).toBeVisible();

    // Step through tabs
    const tabTrail = page.locator('button:has-text("Multi-Hop Transaction Trail")');
    await tabTrail.click();
    await page.waitForTimeout(200);

    const tabVasp = page.locator('button:has-text("VASP Attribution & Nodal Contacts")');
    await tabVasp.click();
    await page.waitForTimeout(200);

    const tabStatutory = page.locator('button:has-text("Section 94 BNSS & Evidence Seal")');
    await tabStatutory.click();
    await page.waitForTimeout(200);

    // 4. Click "Full Graph Canvas" or close modal and navigate to Transaction Graph
    const closeBtn = page.locator('div[role="dialog"] button[aria-label="Close"], div[role="dialog"] button:has(svg)').first();
    await closeBtn.click();
    await page.waitForTimeout(200);

    // Navigate to Transaction Graph
    await navigateToModule(page, 'Transaction Graph');
    await expect(page.locator('h1:has-text("Forensic Topology Canvas")')).toBeVisible();

    // 5. Navigate to Case Management Vault
    await navigateToModule(page, 'Case Management');
    await expect(page.locator('h1:has-text("Case Management Vault")')).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('Workflow 2: Global Omnibox Search Routing (Wallet Address & FIR query)', async ({ page }) => {
    const searchInput = page.locator('header input[type="text"]');

    // Search a suspect wallet address starting with 0x (EVM)
    await searchInput.fill('0x95222290DD7853684454F4275E597E3A63725F78');
    await searchInput.press('Enter');
    await page.waitForTimeout(300);

    // Should route to Investigations page with wallet input pre-filled
    await expect(page.locator('h1:has-text("New Blockchain Investigation")')).toBeVisible();
    const walletInput = page.locator('input[placeholder*="TRON"]');
    await expect(walletInput).toHaveValue('0x95222290DD7853684454F4275E597E3A63725F78');

    // Search an FIR identifier
    await searchInput.fill('FIR-88/2026');
    await searchInput.press('Enter');
    await page.waitForTimeout(300);

    // Should route to Case Management with search pre-filled
    await expect(page.locator('h1:has-text("Case Management Vault")')).toBeVisible();
    const caseSearch = page.locator('input[placeholder*="Search by FIR"]');
    await expect(caseSearch).toHaveValue('FIR-88/2026');
  });

  test('Workflow 3: VASP Attribution Lifecycle (Filter, Create, Attrib Select)', async ({ page }) => {
    await navigateToModule(page, 'VASP Attribution');
    await expect(page.locator('h1:has-text("VASP Attribution")')).toBeVisible();

    // Click New Attribution
    const newBtn = page.locator('button:has-text("New Attribution")');
    await newBtn.click();

    // Fill form
    await page.locator('input[placeholder*="Binance"]').fill('Coinbase Global India');
    await page.locator('input[placeholder*="wallet address"]').fill('0x71C8360562abf9f65a8b23605C3d42426649706D');
    await page.locator('input[placeholder*="$10,000"]').fill('$500,000');
    await page.locator('textarea[placeholder*="supporting evidence"]').fill('Identified master hot wallet consolidation cluster');

    // Submit
    await page.locator('button:has-text("Add Attribution")').click();
    await page.waitForTimeout(300);

    // Verify newly registered attribution appears in the listing
    const recordRow = page.locator('button:has-text("Coinbase Global India")').first();
    await expect(recordRow).toBeVisible();

    // Click the row to verify side inspector panel updates
    await recordRow.click();
    await expect(page.locator('text=Coinbase Global India').first()).toBeVisible();
  });

  test('Workflow 4: Officer Settings Preset & Header Profile Synchronization', async ({ page }) => {
    await navigateToModule(page, 'Settings');
    await expect(page.locator('h1:has-text("System & Station Settings")')).toBeVisible();

    // Apply State Police Preset (Maharashtra Cyber HQ)
    const mhPreset = page.locator('button:has-text("Maharashtra Cyber HQ")').first();
    if (await mhPreset.isVisible()) {
      await mhPreset.click();
      await page.waitForTimeout(200);

      // Verify input values updated
      const nameInput = page.locator('input[value*="Kadam"], input[value*="Sachin"]').first();
      await expect(nameInput).toBeVisible();

      // Click Save Changes
      await page.locator('button:has-text("Save Changes")').click();
      await page.waitForTimeout(300);
      await expect(page.locator('text=Saved Successfully')).toBeVisible();

      // Open header profile dropdown to check synchronization
      const profileBtn = page.locator('header button:has-text("Kadam"), header button:has(div:has-text("SK")), header button:has(div:has-text("IO"))').first();
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
        await expect(page.locator('text=Maharashtra').first()).toBeVisible();
      }
    }
  });

});
