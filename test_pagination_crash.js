import puppeteer from 'puppeteer';

const UI_URL = 'http://localhost:5173';

async function testPaginationCrash() {
    console.log("=== PAGINATION CRASH TEST ===");

    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: "new"
    });

    const page = await browser.newPage();
    let uncaughtErrors = 0;

    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            if (!text.includes('favicon') && !text.includes('websocket')) {
                console.error(`[Browser Console Error] ${text}`);
                if (text.includes('TypeError: Cannot read properties of undefined (reading \'totalPages\')')) {
                    uncaughtErrors++;
                }
                // Any react runtime error also counts
                if (text.includes('Global Error') || text.includes('React')) {
                    uncaughtErrors++;
                }
            }
        }
    });

    page.on('pageerror', err => {
        console.error(`[Uncaught Exception] ${err.toString()}`);
        uncaughtErrors++;
    });

    console.log("Navigating and logging in...");
    await page.goto(UI_URL);
    
    // Login as Admin (who has access to users and roles)
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'balashankar07@gmail.com');
    await page.type('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForSelector('nav');
    
    console.log("Navigating to /settings/users...");
    await page.goto(`${UI_URL}/settings/users`);
    await new Promise(r => setTimeout(r, 2000));
    const userTableRows = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`Users loaded. Rows visible: ${userTableRows}`);

    console.log("Navigating to /settings/roles...");
    await page.goto(`${UI_URL}/settings/roles`);
    await new Promise(r => setTimeout(r, 2000));
    const roleTableRows = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`Roles loaded. Rows visible: ${roleTableRows}`);

    await browser.close();

    if (uncaughtErrors > 0) {
        console.log(`\nFAIL: Detected ${uncaughtErrors} uncaught errors during pagination test.`);
        process.exit(1);
    } else {
        console.log("\nPASS: No runtime crashes on Users and Roles pages.");
        process.exit(0);
    }
}

testPaginationCrash().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
