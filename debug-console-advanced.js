import puppeteer from 'puppeteer';

async function advancedDebugging() {
  console.log('Starting advanced debugging session...');
  const browser = await puppeteer.launch({
    headless: false, // Use headed mode to see what's happening
    args: ['--window-size=1366,768'],
    defaultViewport: { width: 1366, height: 768 }
  });
  
  const page = await browser.newPage();
  
  // Capture detailed console logs
  page.on('console', message => {
    const type = message.type().toUpperCase();
    const text = message.text();
    console.log(`[BROWSER ${type}]`, text);
    
    // Log stack traces for errors if available
    if (type === 'ERROR' && typeof message.stackTrace === 'function') {
      try {
        const stackTrace = message.stackTrace();
        if (stackTrace && Array.isArray(stackTrace) && stackTrace.length) {
          console.log('Error stack trace:');
          stackTrace.forEach(frame => {
            console.log(`  at ${frame.functionName || '(anonymous)'} (${frame.url}:${frame.lineNumber}:${frame.columnNumber})`);
          });
        }
      } catch (err) {
        console.log('Could not get stack trace:', err.message);
      }
    }
  });
  
  // Capture unhandled exceptions
  page.on('pageerror', error => {
    console.error('[BROWSER EXCEPTION]', error.message);
  });
  
  // Capture network failures
  page.on('requestfailed', request => {
    console.log(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    // Inject performance monitoring script
    await page.evaluateOnNewDocument(() => {
      window.addEventListener('load', () => {
        console.log('[PERFORMANCE] Document loaded:', performance.now().toFixed(2) + 'ms');
        
        // Check if React root is present
        const rootElement = document.getElementById('root');
        console.log('[DOM] Root element found:', !!rootElement);
        
        if (rootElement) {
          console.log('[DOM] Root children count:', rootElement.childNodes.length);
          
          // Monitor for changes in the root element
          const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
              if (mutation.type === 'childList') {
                console.log('[DOM] Root children changed:', rootElement.childNodes.length);
              }
            }
          });
          
          observer.observe(rootElement, { childList: true, subtree: true });
          
          // Check React state after a short delay
          setTimeout(() => {
            console.log('[DOM] Root children after delay:', rootElement.childNodes.length);
            console.log('[DOM] Root HTML:', rootElement.innerHTML.slice(0, 500) + (rootElement.innerHTML.length > 500 ? '...' : ''));
          }, 2000);
        }
      });
      
      // Track specific React errors
      const originalError = console.error;
      console.error = function(...args) {
        if (args[0] && typeof args[0] === 'string' && (
           args[0].includes('TypeError') || 
           args[0].includes('includes is not a function'))
        ) {
          console.log('[REACT ERROR DETAIL]', JSON.stringify(args));
        }
        originalError.apply(console, args);
      };
      
      // Add specific debugging for React Router
      setTimeout(() => {
        try {
          // Get all routes in the application
          const routes = Array.from(document.querySelectorAll('[data-reactroot]'))
            .map(el => el.getAttribute('data-testid') || el.id || el.className);
          console.log('[ROUTER DEBUG] Found routes:', routes);
        } catch (err) {
          console.error('[ROUTER DEBUG] Error inspecting routes:', err.message);
        }
      }, 1000);
    });
    
    // Navigate to the app with a longer timeout
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    
    // Let the page run for a while to capture more errors
    console.log('Page loaded. Monitoring for 15 seconds...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('Screenshot saved to debug-screenshot.png');
    
    // Check for specific class name issues
    const hasTypeError = await page.evaluate(() => {
      return window.__DEBUG_HAS_TYPE_ERROR || false;
    });
    
    if (hasTypeError) {
      console.log('[DETECTED] Type error was found during rendering');
    }
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
    console.log('Debugging session ended.');
  }
}

advancedDebugging().catch(console.error); 