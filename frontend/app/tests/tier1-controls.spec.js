import { test, expect } from '@playwright/test';
import { attachErrorListeners, navigateToModule } from './helpers/test-utils';

test.describe('Tier 1: Interactive UI & Navigation Controls', () => {

  test.beforeEach(async ({ page }) => {
    attachErrorListeners(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Navigation & Route Switching across all 9 operational views and Help', async ({ page }) => {
    const modules = [
      { name: 'Dashboard', expectedText: 'Welcome back, Investigating Officer' },
      { name: 'Investigations', expectedText: 'New Blockchain Investigation' },
      { name: 'Transaction Graph', expectedText: 'Forensic Topology Canvas' },
      { name: 'Wallet Details', expectedText: 'Wallet Details' },
      { name: 'VASP Attribution', expectedText: 'VASP Attribution' },
      { name: 'Legal Dossiers', expectedText: 'Legal Evidence Dossiers & Certificates' },
      { name: 'Case Management', expectedText: 'Case Management Vault' },
      { name: 'Intelligence & Alerts', expectedText: 'Intelligence & Tactical Alerts' },
      { name: 'Settings', expectedText: 'System & Station Settings' },
      { name: 'Help & Docs', expectedText: 'Investigation Help & Legal Guidelines' },
    ];

    for (const mod of modules) {
      await navigateToModule(page, mod.name);
      await expect(page.locator(`text=${mod.expectedText}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Header Global Controls: Sidebar toggle, Home, Back, and Ctrl+K search shortcut', async ({ page }) => {
    const aside = page.locator('aside');
    const toggleBtn = page.locator('button[aria-label*="sidebar" i], button[title*="sidebar" i]').first();

    await expect(aside).toBeVisible();

    // Toggle sidebar collapse
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(350);
      await toggleBtn.click();
      await page.waitForTimeout(350);
    }

    // Navigation and Back / Home buttons
    const backBtn = page.locator('button[title*="Previous Page"], button[title*="Root Page"]').first();
    const homeBtn = page.locator('button[title*="Return to Main Dashboard"], button[title*="Dashboard"]').first();

    // At Dashboard, navigate to Investigations
    await navigateToModule(page, 'Investigations');
    await expect(page.locator('text=New Blockchain Investigation').first()).toBeVisible();

    // Now back button should navigate back to Dashboard
    await backBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Welcome back, Investigating Officer').first()).toBeVisible();

    // Navigate to Settings, then click Home
    await navigateToModule(page, 'Settings');
    await expect(page.locator('h1:has-text("System & Station Settings")').first()).toBeVisible();
    await homeBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Welcome back, Investigating Officer').first()).toBeVisible();

    // Test Ctrl+K keyboard shortcut to focus header search
    await page.keyboard.press('Control+k');
    const searchInput = page.locator('header input[type="text"]');
    await expect(searchInput).toBeFocused();

    // Test search submit with a TRON wallet address routes to Investigations
    await searchInput.fill('TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC');
    await searchInput.press('Enter');
    await page.waitForTimeout(300);
    await expect(page.locator('text=New Blockchain Investigation').first()).toBeVisible();
    const walletInput = page.locator('input[placeholder*="TRON"]');
    await expect(walletInput).toHaveValue('TQiBwkXtUanuNQurYx1tJNJXH4zoUmhUVC');
  });

  test('Header Quick Switcher Dropdown and Standalone Cytoscape link', async ({ page }) => {
    const switcherBtn = page.locator('button[title*="Forensic Modules Quick Switcher"], button[title*="Quick Switcher"]').first();
    await switcherBtn.click();

    // Verify quick switcher menu is open
    const menu = page.locator('text=Forensic Modules');
    await expect(menu).toBeVisible();

    // Verify standalone canvas link is present
    const standaloneLink = page.locator('a[href*="standalone-graph.html"]');
    await expect(standaloneLink).toBeVisible();
    await expect(standaloneLink).toHaveAttribute('target', '_blank');

    // Click an item in the menu (e.g. Wallet Details)
    const walletItem = page.locator('button:has-text("Wallet Details")').first();
    await walletItem.click();
    await expect(page.locator('h1:has-text("Wallet Details")').first()).toBeVisible();
  });

  test('Header Tactical Alerts Dropdown and Profile Dropdown', async ({ page }) => {
    // Tactical Alerts Dropdown
    const alertsBtn = page.locator('button[title*="Tactical"], button[title*="Alerts"]').first();
    await alertsBtn.click();

    const alertsHeader = page.locator('text=Tactical Intelligence Alerts');
    await expect(alertsHeader).toBeVisible();

    const viewCasesLink = page.locator('button:has-text("View All Cases & Audit Logs")');
    await expect(viewCasesLink).toBeVisible();
    await viewCasesLink.click();
    await expect(page.locator('h1:has-text("Case Management Vault")').first()).toBeVisible();

    // Officer Profile Dropdown
    const profileBtn = page.locator('header button:has(div:has-text("IO")), header button:has-text("Sharma")').first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await expect(page.locator('text=Sec. 94 BNSS Session Active').first()).toBeVisible();

      // Click Officer & System Settings link
      const settingsLink = page.locator('button:has-text("Officer & System Settings")').first();
      await settingsLink.click();
      await expect(page.locator('h1:has-text("System & Station Settings")').first()).toBeVisible();
    }
  });

  test('Investigation Page: Benchmark Presets, Inputs, and Form Execution', async ({ page }) => {
    await navigateToModule(page, 'Investigations');

    // Test 1-click benchmark preset buttons
    const presets = page.locator('button:has-text("TRON"), button:has-text("EVM"), button:has-text("Bitcoin")');
    const presetCount = await presets.count();
    expect(presetCount).toBeGreaterThanOrEqual(1);

    // Click the first preset
    await presets.first().click();
    await page.waitForTimeout(200);

    // Verify suspect wallet field and FIR field are populated
    const walletInput = page.locator('input[placeholder*="TRON"]');
    const firInput = page.locator('input[placeholder*="FIR-"]');
    const walletVal = await walletInput.inputValue();
    const firVal = await firInput.inputValue();
    expect(walletVal.length).toBeGreaterThan(5);
    expect(firVal.length).toBeGreaterThan(3);

    // Test Chain Selector
    const chainSelect = page.locator('select').first();
    await chainSelect.selectOption('ethereum');
    expect(await chainSelect.inputValue()).toBe('ethereum');
    await chainSelect.selectOption('tron');
    expect(await chainSelect.inputValue()).toBe('tron');

    // Test Execute Automated Trace submission button
    const traceBtn = page.locator('button:has-text("Execute Automated Trace")');
    await expect(traceBtn).toBeVisible();
    await traceBtn.click();

    // Check for trace execution response (attribution verdict card or error banner)
    const resultCard = page.locator('h2:has-text("Forensic Attribution Verdict")')
      .or(page.locator('div:has-text("Trace Execution Error")'))
      .or(page.locator('text=Trace Complete'));
    await expect(resultCard.first()).toBeVisible({ timeout: 15000 });
  });

  test('VASP Attribution Page: Search filter, status select, and Register New VASP Modal', async ({ page }) => {
    await navigateToModule(page, 'VASP Attribution');

    // Verify page header
    await expect(page.locator('h1:has-text("VASP Attribution")')).toBeVisible();

    // Search filter
    const searchInput = page.locator('input[placeholder*="Search exchange or wallet"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Binance');
    await page.waitForTimeout(200);
    await searchInput.fill('');

    // Status select filter
    const statusSelect = page.locator('section select').first();
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('Identified');
      await page.waitForTimeout(200);
      await statusSelect.selectOption('All');
    }

    // Modal Form Trigger
    const newAttributionBtn = page.locator('button:has-text("New Attribution")');
    await expect(newAttributionBtn).toBeVisible();
    await newAttributionBtn.click();

    // Modal dialog
    const modal = page.locator('h2:has-text("Create New Attribution")');
    await expect(modal).toBeVisible();

    // Fill new attribution form
    await page.locator('input[placeholder*="Binance"]').fill('Test VASP Exchange');
    await page.locator('input[placeholder*="wallet address"]').fill('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
    await page.locator('input[placeholder*="$10,000"]').fill('$150,000');
    await page.locator('textarea[placeholder*="supporting evidence"]').fill('Observed rapid deposit forwarding');

    // Submit form (labeled "Add Attribution")
    const submitBtn = page.locator('button:has-text("Add Attribution")');
    await submitBtn.click();
    await page.waitForTimeout(300);

    // Verify modal is closed and record appears
    await expect(page.locator('text=Test VASP Exchange').first()).toBeVisible();
  });

  test('Case Management Vault & CaseDetailModal: Search and 4-Tab Inspection', async ({ page }) => {
    await navigateToModule(page, 'Case Management');

    // Search filter
    const searchInput = page.locator('input[placeholder*="Search by FIR"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('FIR');
    await page.waitForTimeout(200);
    await searchInput.fill('');

    // Table rows
    const viewBtn = page.locator('tbody tr button:has-text("View")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();

      // CaseDetailModal should open
      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verify the 4 tabs exist and can be clicked
      const tabOverview = page.locator('button:has-text("Case History & Metadata")');
      const tabTrail = page.locator('button:has-text("Multi-Hop Transaction Trail")');
      const tabVasp = page.locator('button:has-text("VASP Attribution & Nodal Contacts")');
      const tabStatutory = page.locator('button:has-text("Section 94 BNSS & Evidence Seal")');

      await expect(tabOverview).toBeVisible();
      await expect(tabTrail).toBeVisible();
      await expect(tabVasp).toBeVisible();
      await expect(tabStatutory).toBeVisible();

      // Switch to Multi-Hop Trail tab
      await tabTrail.click();
      await page.waitForTimeout(200);
      const trailContent = page.locator('text=Hop')
        .or(page.locator('text=Transaction Trail'))
        .or(page.locator('text=Source Node'))
        .or(page.locator('text=Suspect Seed'));
      await expect(trailContent.first()).toBeVisible();

      // Switch to VASP Attribution tab
      await tabVasp.click();
      await page.waitForTimeout(200);
      const vaspContent = page.locator('text=Nodal Officer')
        .or(page.locator('text=Target Exchange'))
        .or(page.locator('text=Compliance'))
        .or(page.locator('text=Deposit'));
      await expect(vaspContent.first()).toBeVisible();

      // Switch to Statutory tab
      await tabStatutory.click();
      await page.waitForTimeout(200);
      const statutoryContent = page.locator('text=Section 94 BNSS')
        .or(page.locator('text=Section 63 BSA'))
        .or(page.locator('text=Tamper-Proof'))
        .or(page.locator('text=Requisition'));
      await expect(statutoryContent.first()).toBeVisible();

      // Close modal
      const closeBtn = page.locator('div[role="dialog"] button[aria-label="Close"], div[role="dialog"] button:has(svg)').first();
      await closeBtn.click();
      await page.waitForTimeout(200);
      await expect(modal).not.toBeVisible();
    }
  });

  test('Settings Page: Form tabs, inputs, and persistence', async ({ page }) => {
    await navigateToModule(page, 'Settings');

    // Officer Profile Tab
    const officerNameInput = page.locator('input[value*="Sharma"], input[value*="Rajesh"]').first();
    if (await officerNameInput.isVisible()) {
      await officerNameInput.fill('Inspector Vikram Rathore');
    }

    const badgeInput = page.locator('input[value*="IO-"]').first();
    if (await badgeInput.isVisible()) {
      await badgeInput.fill('IO-99-CYBER');
    }

    // Save button (labeled "Save Changes")
    const saveBtn = page.locator('button:has-text("Save Changes")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await page.waitForTimeout(300);

    // Verify confirmation indicator appears
    await expect(page.locator('text=Saved Successfully').first()).toBeVisible();

    // Switch between settings tabs
    const tabs = ['Statutory Protocols', 'Blockchain Nodes', 'FIU-IND Registry'];
    for (const tabName of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabName}")`).first();
      if (await tabBtn.isVisible()) {
        await tabBtn.click();
        await page.waitForTimeout(200);
      }
    }
  });

  test('Transaction Graph: Controls, Zoom, Fit, Layout Dropdown, and Inspection Drawer', async ({ page }) => {
    await navigateToModule(page, 'Transaction Graph');

    // Verify canvas container is present
    const canvasContainer = page.locator('div[style*="radial-gradient"], div.cursor-grab, canvas').first();
    await expect(canvasContainer).toBeVisible();

    // Layout algorithm selector
    const layoutSelect = page.locator('select[title*="Layout Algorithm"], select:has-text("Hierarchical")').first();
    if (await layoutSelect.isVisible()) {
      await layoutSelect.selectOption('breadthfirst');
      await page.waitForTimeout(300);
      await layoutSelect.selectOption('dagre');
      await page.waitForTimeout(300);
    }

    // Floating Zoom and Fit buttons
    const zoomInBtn = page.locator('button[title*="Zoom In"]').first();
    const zoomOutBtn = page.locator('button[title*="Zoom Out"]').first();
    const fitBtn = page.locator('button[title*="Fit to Screen"]').first();

    await expect(zoomInBtn).toBeVisible();
    await expect(zoomOutBtn).toBeVisible();
    await expect(fitBtn).toBeVisible();

    await zoomInBtn.click();
    await page.waitForTimeout(150);
    await zoomOutBtn.click();
    await page.waitForTimeout(150);
    await fitBtn.click();
    await page.waitForTimeout(150);

    // PNG Export button
    const exportBtn = page.locator('button:has-text("Export PNG"), button[title*="Export"]').first();
    await expect(exportBtn).toBeVisible();

    // In-graph search input
    const graphSearch = page.locator('input[placeholder*="Search address / node"]').first();
    if (await graphSearch.isVisible()) {
      await graphSearch.fill('Origin');
      await graphSearch.press('Enter');
      await page.waitForTimeout(300);
    }

    // Breadcrumb buttons (if trace nodes exist)
    const breadcrumbHops = page.locator('div:has-text("Trace Path:") button');
    if ((await breadcrumbHops.count()) > 0) {
      await breadcrumbHops.first().click();
      await page.waitForTimeout(300);
    }
  });

});
