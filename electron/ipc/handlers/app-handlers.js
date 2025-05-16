/**
 * TerraFlux - App IPC Handlers
 * 
 * This module handles app-related IPC messages from the renderer process,
 * such as app information, quitting, restarting, etc.
 */

const { app } = require('electron');
const { MessageTypes, createResponse } = require('../protocol');
const logger = require('../../error-handling/logger');
const { getPlatformInfo } = require('../../utils/platform');

/**
 * Register app-related IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main window
 * @returns {Object} Map of message types to handler functions
 */
function registerHandlers(mainWindow) {
  const handlers = {
    // Handler for app:get-info message
    [MessageTypes.APP_GET_INFO]: async ({ payload, sender }) => {
      logger.debug('Handling app:get-info request');
      
      return {
        name: app.name,
        version: app.getVersion(),
        appPath: app.getAppPath(),
        isPackaged: app.isPackaged,
        locale: app.getLocale(),
        platform: getPlatformInfo()
      };
    },
    
    // Handler for app:get-paths message
    [MessageTypes.APP_GET_PATHS]: async ({ payload }) => {
      logger.debug('Handling app:get-paths request');
      
      const pathType = payload?.type || 'all';
      
      // If specific path type is requested
      if (pathType !== 'all') {
        return { [pathType]: app.getPath(pathType) };
      }
      
      // Return all paths
      return {
        home: app.getPath('home'),
        appData: app.getPath('appData'),
        userData: app.getPath('userData'),
        temp: app.getPath('temp'),
        downloads: app.getPath('downloads'),
        documents: app.getPath('documents'),
        desktop: app.getPath('desktop'),
        logs: app.getPath('logs'),
        crashDumps: app.getPath('crashDumps')
      };
    },
    
    // Handler for app:quit message
    [MessageTypes.APP_QUIT]: async ({ payload }) => {
      logger.info('Handling app:quit request');
      
      // Optional force parameter
      const force = payload?.force === true;
      
      // Schedule app quit for the next tick
      setTimeout(() => {
        if (force) {
          app.exit(0);
        } else {
          app.quit();
        }
      }, 200);
      
      return { success: true };
    },
    
    // Handler for app:restart message
    [MessageTypes.APP_RESTART]: async ({ payload }) => {
      logger.info('Handling app:restart request');
      
      // Schedule app restart for the next tick
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 200);
      
      return { success: true };
    }
  };
  
  return handlers;
}

module.exports = {
  registerHandlers
};
