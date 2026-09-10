const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception.message}`);
  });

  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('localhost')) {
      errors.push(`Network Error: ${response.status()} ${response.url()}`);
    }
  });

  console.log("Checking /production...");
  await page.goto('http://localhost:5173/production', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for React to render

  if (errors.length > 0) {
    console.log("ERRORS ON /production:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("/production loaded without errors.");
  }
  
  errors.length = 0; // Clear errors
  
  console.log("\nChecking /production/orders...");
  await page.goto('http://localhost:5173/production/orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  if (errors.length > 0) {
    console.log("ERRORS ON /production/orders:");
    errors.forEach(e => console.log(e));
  } else {
    console.log("/production/orders loaded without errors.");
  }

  await browser.close();
})();
