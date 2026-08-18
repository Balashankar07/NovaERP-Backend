const puppeteer = require("puppeteer");

async function main() {
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", err => errors.push(err.toString()));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  try {
    console.log("Navigating to login...");
    await page.goto("http://localhost:5173/auth/login", { waitUntil: "networkidle2" });
    await page.type("input[type=\"email\"]", "balashankar07@gmail.com");
    await page.type("input[type=\"password\"]", "Admin@123");
    await page.click("button[type=\"submit\"]");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Navigating to /procurement/requests...");
    await page.goto("http://localhost:5173/procurement/requests", { waitUntil: "networkidle2" });
    
    // Wait for the table to load
    await new Promise(r => setTimeout(r, 2000));
    
    const prHtml = await page.content();
    if (prHtml.includes("Failed to load PRs")) {
      console.log("FAIL: 'Failed to load PRs' is visible on the page.");
    } else {
      console.log("PASS: PRs loaded successfully.");
    }

    // Try to open PR Form
    console.log("Opening PR Form...");
    const createPrBtn = await page.$("button:has-text('Create PR')") || await page.$x("//button[contains(text(), 'Create PR')]").then(els => els[0]);
    if (createPrBtn) {
      await createPrBtn.click();
      await new Promise(r => setTimeout(r, 1000)); // wait for dialog
      // close it via keyboard
      await page.keyboard.press("Escape");
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Navigating to /procurement/orders...");
    await page.goto("http://localhost:5173/procurement/orders", { waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    const poHtml = await page.content();
    if (poHtml.includes("Failed to load POs")) {
      console.log("FAIL: 'Failed to load POs' is visible on the page.");
    } else {
      console.log("PASS: POs loaded successfully.");
    }

    console.log("Opening PO Details...");
    const viewBtn = await page.$("button:has-text('View')") || await page.$x("//button[contains(text(), 'View')]").then(els => els[0]);
    if (viewBtn) {
      await viewBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.keyboard.press("Escape");
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Errors captured:", errors);

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }
}
main();
