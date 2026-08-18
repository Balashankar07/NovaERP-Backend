import puppeteer from 'puppeteer';

const UI_URL = 'http://localhost:5173';

async function runBrowserTest() {
    console.log("=== BROWSER TEST: PURCHASE REQUEST FORM ===");
    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new"
    });

    let uncaughtErrors = 0;
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('websocket')) {
                console.error(`[Browser Error] ${text}`);
                if (text.includes('TypeError') || text.includes('React')) uncaughtErrors++;
            }
        }
    });

    page.on('pageerror', err => {
        console.error(`[Uncaught Exception] ${err.toString()}`);
        uncaughtErrors++;
    });

    let componentFetchFired = false;
    let componentFetchSuccess = false;

    page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/Products') && url.includes('productType=2') && response.request().method() === 'GET') {
            componentFetchFired = true;
            if (response.status() === 200) {
                componentFetchSuccess = true;
                console.log("[API TRACE] Products API for components fired successfully.");
            }
        }
    });

    try {
        console.log("Logging in...");
        await page.goto(UI_URL);
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'balashankar07@gmail.com');
        await page.type('input[type="password"]', 'Admin@123');
        await page.click('button[type="submit"]');

        console.log("Navigating to Purchase Requests...");
        await page.waitForSelector('nav');
        await page.goto(`${UI_URL}/procurement/requests`);
        
        console.log("Waiting for data load...");
        await new Promise(r => setTimeout(r, 2000));
        
        // Find the 'Create PR' button
        console.log("Clicking Create PR...");
        const buttons = await page.$$('button');
        let createBtn = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Create Request') || text.includes('Create PR')) {
                createBtn = btn;
                break;
            }
        }
        
        if (createBtn) {
            await createBtn.click();
            console.log("Opened dialog. Waiting for API to fetch components...");
            await new Promise(r => setTimeout(r, 1500));
            
            // Check dropdown text
            const dropdown = await page.$('button[role="combobox"]');
            if (dropdown) {
                const text = await page.evaluate(el => el.textContent, dropdown);
                console.log(`Dropdown status: ${text}`);
                if (text.includes('No components available') || text.includes('Failed')) {
                    console.error("[FAIL] Dropdown failed to load components");
                    uncaughtErrors++;
                } else if (text.includes('Add Component')) {
                    console.log("[PASS] Dropdown successfully loaded components.");
                }
            } else {
                console.log("Could not find combobox.");
            }
            
        } else {
            console.log("Could not find create button.");
        }
    } catch (e) {
        console.error("Test execution error:", e);
    } finally {
        await browser.close();
    }

    if (!componentFetchFired) {
        console.log("[FAIL] The product API was never called by the dialog.");
        process.exit(1);
    }

    if (uncaughtErrors > 0) {
        console.log(`\nFAIL: Detected ${uncaughtErrors} errors during PR form test.`);
        process.exit(1);
    } else {
        console.log(`\nPASS: PR form components loaded successfully.`);
        process.exit(0);
    }
}

runBrowserTest();
