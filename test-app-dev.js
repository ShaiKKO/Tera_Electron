const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const settingsManager = require('./electron/config/settings-manager');
const ipcHandlers = require('./electron/ipc/handlers');

// Keep a global reference of the window object
let mainWindow;

// Initialize settings manager
async function initializeSettings() {
  try {
    console.log('Initializing settings manager...');
    const settings = await settingsManager.initialize();
    console.log('Settings initialized successfully');
    return settings;
  } catch (err) {
    console.error('Failed to initialize settings manager:', err);
    return null;
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron/preload-test.js')
    }
  });

  // Load from webpack dev server (already running on port 8080)
  const startUrl = 'http://localhost:8080';
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Open the DevTools in development
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Set up IPC handlers
function setupIpcHandlers() {
  // Register handlers from all modules
  const handlers = ipcHandlers.registerAllHandlers(mainWindow);
  // Generic message handler
  ipcMain.handle('message', async (event, args) => {
    const { channel, data } = args;
    
    console.log(`Received message on channel: ${channel}`, data);
    
    switch (channel) {
      case 'window:minimize':
        mainWindow.minimize();
        return { success: true };
        
      case 'window:maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
          return { isMaximized: false };
        } else {
          mainWindow.maximize();
          return { isMaximized: true };
        }
        
      case 'window:close':
        mainWindow.close();
        return { success: true };
        
      case 'window:focus':
        mainWindow.focus();
        return { success: true, isFocused: mainWindow.isFocused() };
        
      case 'app:get-info':
        return {
          name: app.name,
          version: app.getVersion(),
          platform: process.platform
        };
        
      default:
        console.log(`No handler for channel: ${channel}`);
        return { success: false, error: 'Channel not supported' };
    }
  });
  
  // No response version
  ipcMain.on('message-no-response', (event, args) => {
    const { channel, data } = args;
    
    console.log(`Received no-response message on channel: ${channel}`, data);
    
    switch (channel) {
      case 'window:minimize':
        mainWindow.minimize();
        break;
        
      case 'window:close':
        mainWindow.close();
        break;
        
      default:
        console.log(`No handler for no-response channel: ${channel}`);
        break;
    }
  });
  
  // Direct app info handler
  ipcMain.handle('get-app-info', () => {
    return {
      name: app.name,
      version: app.getVersion(),
      platform: process.platform
    };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // First initialize settings
  await initializeSettings();
  
  // Then create window and set up IPC
  createWindow();
  setupIpcHandlers();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
