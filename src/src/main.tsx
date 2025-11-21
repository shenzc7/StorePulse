import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Add global error handler to catch and display errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.innerHTML.includes('Error')) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>JavaScript Error</h1>
        <pre>${event.error?.message || 'Unknown error'}</pre>
        <pre>${event.error?.stack || ''}</pre>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const root = document.getElementById('root');
  if (root && !root.innerHTML.includes('Error')) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace;">
        <h1>Promise Rejection Error</h1>
        <pre>${String(event.reason)}</pre>
      </div>
    `;
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Import and render App
import('./app').then(({ App }) => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}).catch((error) => {
  console.error('Failed to load App:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Failed to load application</h1>
      <pre>${String(error)}</pre>
      <pre>${error?.stack || ''}</pre>
    </div>
  `;
});
