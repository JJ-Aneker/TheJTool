const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForSelector('.efdt-root', { timeout: 10000 });
  await page.screenshot({ path: './efdt-screenshot.png', fullPage: false });
  await browser.close();
  console.log('Screenshot saved to efdt-screenshot.png');
})();
