import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('[Main] Application starting...');

const renderApp = () => {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    console.log('[Main] Root element found, attempting to render');
    
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log('[Main] Application rendered successfully');
  } catch (error) {
    console.error('[Main] Failed to render the application:', error);
    // Show a basic error message on the page
    document.body.innerHTML = `
      <div style="color: red; padding: 20px; text-align: center;">
        <h1>Application Error</h1>
        <p>Sorry, there was a problem loading the application. Please check the console for details.</p>
        <pre style="text-align: left; background: #f7f7f7; padding: 10px; border-radius: 5px; max-width: 800px; margin: 0 auto; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
};

// Ensure the DOM is fully loaded before rendering
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderApp);
} else {
  renderApp();
}
