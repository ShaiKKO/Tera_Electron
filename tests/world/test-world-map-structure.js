/**
 * TerraFlux - World Map Structure Test
 * 
 * This test verifies that the world map structure correctly stores and retrieves tiles.
 * It validates serialization, deserialization, and the link between game state and rendering.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

// Set environment to development
process.env.NODE_ENV = 'development';

// Create the test window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'electron', 'preload-world-test.js')
    }
  });

  // Load the test HTML file
  mainWindow.loadFile(path.join(__dirname, 'temp-world-test.html'));

  // Open DevTools
  mainWindow.webContents.openDevTools();

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize when Electron is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for the test
ipcMain.handle('test-save-world', async (event, data) => {
  try {
    const savePath = path.join(__dirname, 'test-world-save.json');
    fs.writeFileSync(savePath, JSON.stringify(data, null, 2));
    return { success: true, path: savePath };
  } catch (error) {
    console.error('Error saving world:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-load-world', async (event) => {
  try {
    const savePath = path.join(__dirname, 'test-world-save.json');
    if (fs.existsSync(savePath)) {
      const data = JSON.parse(fs.readFileSync(savePath, 'utf8'));
      return { success: true, data };
    } else {
      return { success: false, error: 'Save file not found' };
    }
  } catch (error) {
    console.error('Error loading world:', error);
    return { success: false, error: error.message };
  }
});
