/**
 * TerraFlux PixiJS Integration Test - Electron Launcher
 * 
 * This script launches the PixiJS integration test in an Electron window
 * for testing the rendering system in the proper application context.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle Squirrel startup events
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Enable hot reload for development
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reloader')(module, {
      debug: true,
      watchRenderer: true
    });
  } catch (err) {
    console.error('Error setting up electron-reloader:', err);
  }
}

// Window reference to prevent garbage collection
let mainWindow;

// Create application window
async function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'TerraFlux - PixiJS Integration Test',
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      devTools: true,
    },
  });

  // Maximize window on startup
  mainWindow.maximize();

  // Load the test HTML file
  const testPath = path.join(__dirname, 'test-pixi-integration.html');
  
  // Check if file exists
  if (fs.existsSync(testPath)) {
    // Load the file using file:// protocol
    await mainWindow.loadFile(testPath);
    
    // Open DevTools for debugging
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } else {
    console.error(`Test file does not exist: ${testPath}`);
    mainWindow.webContents.loadURL('data:text/html,<h1>Error: Test file not found</h1>');
  }

  // Log when window is closed
  mainWindow.on('closed', () => {
    console.log('PixiJS integration test window closed');
    mainWindow = null;
  });
}

// Create window when Electron has initialized
app.on('ready', () => {
  console.log('Starting TerraFlux PixiJS integration test...');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create window when dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
