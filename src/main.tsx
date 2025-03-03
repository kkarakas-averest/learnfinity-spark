
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Application starting...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  createRoot(rootElement).render(<App />);
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Failed to render the application:', error);
  // Show a basic error message on the page
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; text-align: center;">
      <h1>Application Error</h1>
      <p>Sorry, there was a problem loading the application. Please check the console for details.</p>
    </div>
  `;
}
