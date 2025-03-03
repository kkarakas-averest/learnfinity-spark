import puppeteer from 'puppeteer';

async function captureConsoleOutput() {
  console.log('Starting browser to capture console logs...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', message => 
    console.log(`[Browser Console] ${message.type().toUpperCase()}: ${message.text()}`));
  
  // Capture errors
  page.on('pageerror', error => 
    console.log('[Browser Error]', error.message));
  
  // Capture request failures
  page.on('requestfailed', request => 
    console.log(`[Network Error] ${request.url()} - ${request.failure().errorText}`));

  try {
    console.log('Navigating to app...');
    await page.goto('http://localhost:8082', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Page loaded. Waiting for any additional logs (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('Error during page navigation:', error);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

captureConsoleOutput().catch(console.error); 