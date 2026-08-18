import puppeteer from 'puppeteer';

const UI_URL = 'http://localhost:5173';

async function auditUIRuntime() {
    console.log("=== UI RUNTIME AUDIT ===");

    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new"
    });

    const page = await browser.newPage();
    let uncaughtErrors = 0;
    const errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('websocket') && !text.includes('GSI_LOGGER')) {
                errors.push(`[Console Error] ${text}`);
                if (text.includes('TypeError') || text.includes('Global Error') || text.includes('React')) {
                    uncaughtErrors++;
                }
            }
        }
    });

    page.on('pageerror', err => {
        errors.push(`[Uncaught Exception] ${err.toString()}`);
        uncaughtErrors++;
    });

    console.log("Logging in...");
    await page.goto(UI_URL);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'balashankar07@gmail.com');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('nav');

    const routes = [
        '/dashboard',
        '/products',
        '/boms',
        '/procurement/suppliers',
        '/procurement/requests',
        '/procurement/orders',
        '/inventory/stock',
        '/inventory/warehouses',
        '/inventory/transactions',
        '/settings/users',
        '/settings/roles'
    ];

    for (const route of routes) {
        console.log(`Checking route: ${route}`);
        await page.goto(`${UI_URL}${route}`);
        await new Promise(r => setTimeout(r, 2000));
        
        // Wait for potential data load
        const h1 = await page.$('h1');
        if (h1) {
            const titleText = await page.evaluate(el => el.textContent, h1);
            console.log(`  -> Loaded: ${titleText}`);
        } else {
            console.log(`  -> Warning: No H1 found`);
        }
    }

    await browser.close();

    console.log(`\nUI Audit Complete. Fatal Errors: ${uncaughtErrors}`);
    if (errors.length > 0) {
        console.log("Logged Errors:");
        errors.forEach(e => console.log(e));
    }
}

auditUIRuntime().catch(console.error);
