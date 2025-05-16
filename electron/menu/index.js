/**
 * TerraFlux - Application Menu Module
 * 
 * This module provides application menu functionality for the main window,
 * with platform-specific menu options and keyboard shortcuts.
 */

const { Menu, app, shell, dialog } = require('electron');
const { isMac, isWindows, isLinux } = require('../utils/platform');
const logger = require('../error-handling/logger');

/**
 * Setup application menu for the specified window
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 */
function setup(mainWindow) {
  logger.debug('Setting up application menu');
  
  const template = buildMenuTemplate(mainWindow);
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Build application menu template with platform-specific items
 * @param {Electron.BrowserWindow} mainWindow - The main application window
 * @returns {Array} Menu template
 */
function buildMenuTemplate(mainWindow) {
  // Common menu items that appear in all menus
  const commonMenuItems = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:new-game');
            }
          }
        },
        {
          label: 'Load Game',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:load-game');
            }
          }
        },
        {
          label: 'Save Game',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:save-game');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:settings');
            }
          }
        },
        { type: 'separator' },
        { 
          label: isMac ? 'Quit' : 'Exit',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About TerraFlux',
          click: () => {
            const version = app.getVersion();
            dialog.showMessageBox(mainWindow, {
              title: 'About TerraFlux',
              message: `TerraFlux v${version}`,
              detail: 'Colony simulation and exploration game inspired by RimWorld',
              buttons: ['OK'],
              icon: null // TODO: Add app icon
            });
          }
        },
        {
          label: 'Documentation',
          click: async () => {
            await shell.openExternal('https://github.com/TerraFlux/docs');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/TerraFlux/issues');
          }
        }
      ]
    }
  ];
  
  // MacOS specific first menu (App menu)
  if (isMac) {
    commonMenuItems.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }
  
  // Add Developer menu in development mode
  if (process.env.NODE_ENV === 'development') {
    commonMenuItems.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Reload App',
          click: () => {
            app.relaunch();
            app.exit(0);
          }
        },
        {
          label: 'Toggle FPS Counter',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('dev:toggle-fps');
            }
          }
        },
        {
          label: 'Toggle Wireframe Mode',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('dev:toggle-wireframe');
            }
          }
        }
      ]
    });
  }
  
  return commonMenuItems;
}

/**
 * Create a context menu for right-click in the app
 * @param {Electron.BrowserWindow} targetWindow - The window to attach the context menu to
 */
function createContextMenu(targetWindow) {
  targetWindow.webContents.on('context-menu', (event, params) => {
    const template = [
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ];
    
    // Add additional context items based on element type
    if (params.isEditable) {
      template.unshift({ role: 'undo' });
      template.unshift({ role: 'redo' });
    }
    
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: targetWindow });
  });
}

module.exports = {
  setup,
  createContextMenu,
  buildMenuTemplate
};
