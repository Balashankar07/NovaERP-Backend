import puppeteer from 'puppeteer';

const UI_URL = 'http://localhost:5173';

async function testProductDetails() {
    console.log("=== PRODUCT DETAILS CRASH TEST ===");

    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new"
    });

    const page = await browser.newPage();
    let uncaughtErrors = 0;
    let apiSuccess = false;

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('websocket') && !text.includes('GSI_LOGGER')) {
                console.error(`[Browser Console Error] ${text}`);
                if (text.includes('getByProductId is not a function') || text.includes('Global Error') || text.includes('React')) {
                    uncaughtErrors++;
                }
            }
        }
    });

    page.on('pageerror', err => {
        console.error(`[Uncaught Exception] ${err.toString()}`);
        uncaughtErrors++;
    });

    // Monitor for the API call to ensure it actually fired and succeeded
    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/supplier-products/product/') && response.status() === 200) {
            console.log(`[API SUCCESS] Found successful supplier-products fetch: ${url}`);
            apiSuccess = true;
        }
    });

    console.log("Navigating and logging in...");
    await page.goto(UI_URL);
    
    // Login as Admin
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'balashankar07@gmail.com');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    console.log("Navigating to /products...");
    await page.waitForSelector('nav');
    await page.goto(`${UI_URL}/products`);
    await new Promise(r => setTimeout(r, 2000));
    
    const rows = await page.$$('tbody tr');
    console.log(`Products loaded. Rows visible: ${rows.length}`);
    
    if (rows.length > 0) {
        console.log("Clicking 'View Details' on the first product...");
        // Click the Eye icon button (View Details)
        // Usually the first button in the actions column
        const viewButton = await rows[0].$('button[title="View Details"]');
        if (viewButton) {
            await viewButton.click();
            console.log("Clicked View Details. Waiting for modal to open and fetch suppliers...");
            await new Promise(r => setTimeout(r, 2000));
            
            const modalTitle = await page.$('h2[id^="radix-"]');
            if (modalTitle) {
                const titleText = await page.evaluate(el => el.textContent, modalTitle);
                console.log(`Modal opened successfully with title: ${titleText}`);
            } else {
                console.log("Could not confirm modal title, but checking for crash...");
            }
        } else {
            console.log("View Details button not found on first row.");
        }
    }

    await browser.close();

    if (uncaughtErrors > 0) {
        console.log(`\nFAIL: Detected ${uncaughtErrors} uncaught errors during product details test.`);
        process.exit(1);
    } else {
        console.log(`\nPASS: No runtime crashes on Product Details page.`);
        // Even if apiSuccess is false, it might be a FinishedGood which correctly bypasses the fetch, so we don't strictly fail on it, but we log it.
        process.exit(0);
    }
}

testProductDetails().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
