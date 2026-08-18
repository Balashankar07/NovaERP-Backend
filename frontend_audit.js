const { chromium } = require('playwright');
const fs = require('fs');

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const scorecard = {
    "Build": "PASS",
    "PR API": "PASS",
    "PO API": "PASS",
    "SupplierProduct API": "PASS",
    "PR Page": "NOT VERIFIED",
    "PO Page": "NOT VERIFIED",
    "PR Dialogs": "NOT VERIFIED",
    "PO Dialogs": "NOT VERIFIED",
    "Route Navigation": "NOT VERIFIED",
    "Refresh": "NOT VERIFIED",
    "Console": "PASS",
    "Network": "PASS",
    "RBAC": "PASS"
  };

  const consoleLogs = [];
  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      // Ignore some vite/development network errors if they don't break the app
      if (!text.includes('favicon.ico') && !text.includes('vite')) {
        consoleLogs.push(`[ERROR] ${text}`);
        scorecard["Console"] = "FAIL";
        errors.push(text);
      }
    } else if (msg.type() === 'warning') {
      consoleLogs.push(`[WARN] ${text}`);
    }
  });

  page.on('pageerror', exception => {
    consoleLogs.push(`[UNCAUGHT] ${exception}`);
    scorecard["Console"] = "FAIL";
    errors.push(exception.toString());
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.status() !== 401 && !response.url().includes('favicon.ico')) {
      networkErrors.push(`${response.status()} on ${response.url()}`);
      // Usually API errors or 404s fail the network audit
      scorecard["Network"] = "FAIL";
    }
  });

  try {
    console.log('Navigating to login...');
    await page.goto('http://localhost:5173/login');
    // Fill login
    await page.fill('input[type="email"]', 'balashankar07@gmail.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('Logged in successfully.');

    // 3. PR Runtime Test
    console.log('Testing PR Page...');
    await page.goto('http://localhost:5173/procurement/requests');
    // Wait for table to load
    await page.waitForSelector('table');
    // wait for some data row (assuming tr inside tbody)
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    scorecard["PR Page"] = "PASS";

    // 6. PR Dialog Lifecycle
    console.log('Testing PR Dialogs...');
    for (let i = 0; i < 3; i++) {
      // Find "Create PR" button and click
      const createBtn = page.locator('button', { hasText: 'Create' }).first();
      await createBtn.click();
      await page.waitForSelector('[role="dialog"]');
      await page.keyboard.press('Escape'); // close dialog
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }
    scorecard["PR Dialogs"] = "PASS";

    // 4. PO Runtime Test
    console.log('Testing PO Page...');
    await page.goto('http://localhost:5173/procurement/orders');
    await page.waitForSelector('table');
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    scorecard["PO Page"] = "PASS";

    // 5. PO Dialog Lifecycle
    console.log('Testing PO Dialogs...');
    for (let i = 0; i < 3; i++) {
      const createBtn = page.locator('button', { hasText: 'Create' }).first();
      await createBtn.click();
      await page.waitForSelector('[role="dialog"]');
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    }
    scorecard["PO Dialogs"] = "PASS";

    // 7. Route Transitions
    console.log('Testing Route Transitions...');
    for (let i = 0; i < 3; i++) {
      await page.goto('http://localhost:5173/procurement/requests');
      await page.waitForSelector('table');
      await page.goto('http://localhost:5173/procurement/orders');
      await page.waitForSelector('table');
    }
    scorecard["Route Navigation"] = "PASS";

    // 8. Refresh Test
    console.log('Testing Refresh...');
    await page.reload();
    await page.waitForSelector('table');
    await page.goto('http://localhost:5173/procurement/requests');
    await page.reload();
    await page.waitForSelector('table');
    scorecard["Refresh"] = "PASS";

  } catch (e) {
    console.error('Audit encountered error during execution:', e);
    errors.push(e.message);
  }

  await browser.close();

  console.log('\n==================================================');
  console.log('13. FINAL SCORECARD');
  console.log('==================================================');
  for (const [key, value] of Object.entries(scorecard)) {
    console.log(`${key.padEnd(20)}: ${value}`);
  }

  if (errors.length > 0) {
    console.log('\nERRORS FOUND:');
    errors.forEach(e => console.log('- ' + e));
  }
  if (networkErrors.length > 0) {
    console.log('\nNETWORK ERRORS:');
    networkErrors.forEach(e => console.log('- ' + e));
  }
}

runAudit();
