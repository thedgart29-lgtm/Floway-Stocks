const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
    page.on('pageerror', error => console.error('BROWSER_PAGE_ERROR:', error.message));
    console.log('Navigating...');
    await page.goto('http://localhost:5173');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Logging in...');
    const loginInputs = await page.$$('input');
    if (loginInputs.length >= 2) {
      await loginInputs[0].type('admin@pixivo.in');
      await loginInputs[1].type('admin123');
      await page.click('button'); // Login button
    }
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('Typing...');
    const inputs = await page.$$('.input-field');
    if (inputs.length >= 3) {
      await inputs[0].type('Test');
      await inputs[1].type('123');
      await inputs[2].type('test@test.com');
      await page.click('button[type=submit]');
      console.log('Clicked submit');
    } else {
      console.log('No inputs found on supplier page');
    }
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();
  } catch(e) {
    console.error(e);
  }
})();
