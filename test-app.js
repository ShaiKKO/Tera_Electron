const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const settingsManager = require('./electron/config/settings-manager');
const ipcHandlers = require('./electron/ipc/handlers');

// Keep a global reference of the window object
let mainWindow;

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

  // Log when page starts loading
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Page started loading...');
  });

  // Log when DOM is ready
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    
    // Wait a moment for React to initialize completely
    setTimeout(() => {
      // Create a basic settings UI and inject it into the page
      mainWindow.webContents.executeJavaScript(`
        (function() {
          console.log('Testing direct settings panel injection...');
          
          try {
            // Create a container for our settings panel
            const mainContentEl = document.querySelector('body');
            if (!mainContentEl) {
              console.error('Could not find body element');
              return false;
            }
            
            console.log('Found main content element, injecting settings panel...');
            
            // Create a simple direct container for settings
            const settingsContainer = document.createElement('div');
            settingsContainer.id = 'direct-settings-container';
            settingsContainer.style.padding = '20px';
            settingsContainer.style.backgroundColor = '#f5f5f5';
            settingsContainer.style.color = '#333';
            settingsContainer.style.fontFamily = 'Arial, sans-serif';
            
            // Set some content
            settingsContainer.innerHTML = \`
              <h2 style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Game Settings</h2>
              <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">Display Settings</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 4px;">
                  <div>
                    <div style="font-weight: 500; margin-bottom: 4px;">Theme</div>
                    <div style="font-size: 12px; color: #666;">Select application theme</div>
                  </div>
                  <div>
                    <select id="theme-select" style="padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                    <button style="margin-left: 8px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 4px;">
                  <div>
                    <div style="font-weight: 500; margin-bottom: 4px;">UI Animations</div>
                    <div style="font-size: 12px; color: #666;">Enable/disable UI animations</div>
                  </div>
                  <div>
                    <div id="toggle-animations" style="width: 48px; height: 24px; background: #28a745; border-radius: 12px; display: flex; align-items: center; padding: 0 2px; cursor: pointer; position: relative;">
                      <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; right: 4px; transition: transform 0.2s;"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">Game Options</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 4px;">
                  <div>
                    <div style="font-weight: 500; margin-bottom: 4px;">Autosave</div>
                    <div style="font-size: 12px; color: #666;">Automatically save game progress</div>
                  </div>
                  <div>
                    <div id="toggle-autosave" style="width: 48px; height: 24px; background: #28a745; border-radius: 12px; display: flex; align-items: center; padding: 0 2px; cursor: pointer; position: relative;">
                      <div style="width: 20px; height: 20px; background: white; border-radius: 50%; position: absolute; right: 4px; transition: transform 0.2s;"></div>
                    </div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(0,0,0,0.05); margin-bottom: 10px; border-radius: 4px;">
                  <div>
                    <div style="font-weight: 500; margin-bottom: 4px;">Difficulty</div>
                    <div style="font-size: 12px; color: #666;">Set game difficulty level</div>
                  </div>
                  <div>
                    <select id="difficulty-select" style="padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                      <option value="extreme">Extreme</option>
                    </select>
                    <button style="margin-left: 8px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 24px;">
                <button id="reset-all" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Reset All Settings</button>
              </div>
            \`;
            
            // Clear main content and add our container
            mainContentEl.innerHTML = '';
            mainContentEl.appendChild(settingsContainer);
            
            console.log('Settings panel successfully injected into DOM');
            
            setTimeout(() => {
              try {
                // Add event listeners for our mock settings UI
                document.getElementById('theme-select').addEventListener('change', (e) => {
                  console.log('Theme changed to:', e.target.value);
                  window.electron.settings.set('ui.theme', e.target.value);
                });
                
                document.getElementById('toggle-animations').addEventListener('click', () => {
                  console.log('Toggling animations');
                  window.electron.settings.set('ui.animations', true);
                });
                
                document.getElementById('toggle-autosave').addEventListener('click', () => {
                  console.log('Toggling autosave');
                  window.electron.settings.set('game.gameplay.autosave', true);
                });
                
                document.getElementById('difficulty-select').addEventListener('change', (e) => {
                  console.log('Difficulty changed to:', e.target.value);
                  window.electron.settings.set('game.gameplay.difficultyLevel', e.target.value);
                });
                
                document.getElementById('reset-all').addEventListener('click', () => {
                  console.log('Resetting all settings');
                  window.electron.settings.resetAll();
                });
                
                console.log('Event listeners added to settings controls');
              } catch (e) {
                console.error('Error setting up event listeners:', e);
              }
            }, 200);
            
            return true;
          } catch (error) {
            console.error('Error injecting settings panel:', error);
            return false;
          }
        })();
      `).then(result => {
        console.log('Settings injection result:', result);
      }).catch(err => {
        console.error('Error executing script:', err);
      });
    }, 1000);
  });

  // Load the index.html of the app
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'src/index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools in development
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

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

// Set up IPC handlers
function setupIpcHandlers() {
  // Register handlers from all modules
  const handlers = ipcHandlers.registerAllHandlers(mainWindow);
  
  // Add logger handlers for test debugging
  ipcMain.on('log', (event, data) => {
    const { level, args } = data;
    console[level || 'log']('[Renderer]', ...(Array.isArray(args) ? args : [args]));
  });
  
  // Also register the legacy message handler
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
