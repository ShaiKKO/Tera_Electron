/**
 * TerraFlux - Window IPC Handlers
 * 
 * This module handles window-related IPC messages from the renderer process,
 * such as maximize, minimize, close, focus, etc.
 */

const { BrowserWindow } = require('electron');
const { MessageTypes } = require('../protocol');
const logger = require('../../error-handling/logger');

/**
 * Register window-related IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main window
 * @returns {Object} Map of message types to handler functions
 */
function registerHandlers(mainWindow) {
  const handlers = {
    // Handler for window:maximize message
    [MessageTypes.WINDOW_MAXIMIZE]: async ({ payload, sender }) => {
      logger.debug('Handling window:maximize request');
      
      let targetWindow = mainWindow;
      // If windowId is provided, find that window
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      const isMaximized = targetWindow.isMaximized();
      
      if (isMaximized) {
        targetWindow.unmaximize();
      } else {
        targetWindow.maximize();
      }
      
      return { 
        isMaximized: !isMaximized,
        windowId: targetWindow.id
      };
    },
    
    // Handler for window:unmaximize message
    [MessageTypes.WINDOW_UNMAXIMIZE]: async ({ payload, sender }) => {
      logger.debug('Handling window:unmaximize request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      targetWindow.unmaximize();
      
      return { success: true, windowId: targetWindow.id };
    },
    
    // Handler for window:minimize message
    [MessageTypes.WINDOW_MINIMIZE]: async ({ payload, sender }) => {
      logger.debug('Handling window:minimize request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      targetWindow.minimize();
      
      return { success: true, windowId: targetWindow.id };
    },
    
    // Handler for window:close message
    [MessageTypes.WINDOW_CLOSE]: async ({ payload, sender }) => {
      logger.debug('Handling window:close request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      targetWindow.close();
      
      return { success: true };
    },
    
    // Handler for window:focus message
    [MessageTypes.WINDOW_FOCUS]: async ({ payload, sender }) => {
      logger.debug('Handling window:focus request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      if (!targetWindow.isFocused()) {
        targetWindow.focus();
      }
      
      return { success: true, isFocused: targetWindow.isFocused() };
    },
    
    // Handler for window:set-bounds message
    [MessageTypes.WINDOW_SET_BOUNDS]: async ({ payload, sender }) => {
      logger.debug('Handling window:set-bounds request', { payload });
      
      if (!payload || (!payload.width && !payload.height && payload.x === undefined && payload.y === undefined)) {
        throw new Error('Missing required bounds parameters');
      }
      
      let targetWindow = mainWindow;
      if (payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      const bounds = {};
      if (payload.width !== undefined) bounds.width = payload.width;
      if (payload.height !== undefined) bounds.height = payload.height;
      if (payload.x !== undefined) bounds.x = payload.x;
      if (payload.y !== undefined) bounds.y = payload.y;
      
      targetWindow.setBounds(bounds);
      
      return { 
        success: true, 
        bounds: targetWindow.getBounds()
      };
    },
    
    // Handler for window:get-bounds message
    [MessageTypes.WINDOW_GET_BOUNDS]: async ({ payload, sender }) => {
      logger.debug('Handling window:get-bounds request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      return targetWindow.getBounds();
    },
    
    // Handler for window:set-fullscreen message
    [MessageTypes.WINDOW_SET_FULLSCREEN]: async ({ payload, sender }) => {
      logger.debug('Handling window:fullscreen request');
      
      let targetWindow = mainWindow;
      if (payload && payload.windowId) {
        const allWindows = BrowserWindow.getAllWindows();
        const foundWindow = allWindows.find(win => win.id === payload.windowId);
        if (foundWindow) {
          targetWindow = foundWindow;
        }
      }
      
      const fullscreen = payload?.fullscreen !== false;
      targetWindow.setFullScreen(fullscreen);
      
      return { 
        success: true, 
        isFullScreen: targetWindow.isFullScreen() 
      };
    }
  };
  
  return handlers;
}

module.exports = {
  registerHandlers
};
