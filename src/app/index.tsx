import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../store';
import App from './components/App';
import '../styles/global.css';

// Get the root element from the HTML
const container = document.getElementById('root');

// Create a root
if (!container) {
  throw new Error('Root container not found in the DOM');
}

const root = createRoot(container);

// Render the application
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Handle unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Here you could log to an error service or display a global error UI
});

// Listen for IPC messages from the main process
// These will be used for communication between Electron main and renderer processes
window.addEventListener('DOMContentLoaded', () => {
  // Set up IPC listeners here when using Electron
  if (window.electronAPI) {
    console.log('Electron API detected, setting up IPC listeners');
    // Example: window.electronAPI.onAppEvent((event) => console.log('App event:', event));
  }
});
