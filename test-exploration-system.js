/**
 * TerraFlux - Exploration System Test
 * 
 * This test file verifies the functionality of the world exploration system
 * including fog of war, exploration tracking, and minimap visualization.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Global reference to the window object to prevent garbage collection
let mainWindow;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload-exploration-test.js')
    }
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, 'temp-exploration-test.html'));
  
  // Open DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

// Electron application lifecycle
app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  if (mainWindow === null) {
    createWindow();
  }
});
