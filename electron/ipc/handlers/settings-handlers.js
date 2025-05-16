/**
 * TerraFlux - Settings IPC Handlers
 * 
 * This module handles settings-related IPC messages from the renderer process,
 * providing access to the settings manager functionality.
 */

const { MessageTypes } = require('../protocol');
const logger = require('../../error-handling/logger');
const settingsManager = require('../../config/settings-manager');
const { dialog, app } = require('electron');
const path = require('path');

/**
 * Register settings-related IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main window
 * @returns {Object} Map of message types to handler functions
 */
function registerHandlers(mainWindow) {
  const handlers = {
    // Handler for settings:get message
    [MessageTypes.SETTINGS_GET]: async ({ payload }) => {
      logger.debug('Handling settings:get request', {
        path: payload?.path || 'all'
      });
      
      // Initialize settings if not already done
      if (!payload || !payload.path) {
        // Return all settings
        return await settingsManager.getSettings();
      } else {
        // Return a specific setting
        const value = await settingsManager.getSetting(
          payload.path, 
          payload.defaultValue
        );
        return {
          path: payload.path,
          value
        };
      }
    },
    
    // Handler for settings:set message
    [MessageTypes.SETTINGS_SET]: async ({ payload }) => {
      logger.debug('Handling settings:set request', {
        path: payload?.path
      });
      
      if (!payload || !payload.path) {
        throw new Error('Setting path is required');
      }
      
      const changed = await settingsManager.setSetting(
        payload.path, 
        payload.value, 
        payload.saveImmediately !== false
      );
      
      return {
        path: payload.path,
        value: payload.value,
        changed
      };
    },
    
    // Handler for settings:reset message
    [MessageTypes.SETTINGS_RESET]: async ({ payload }) => {
      logger.debug('Handling settings:reset request');
      
      // If path is provided, only reset that setting
      if (payload && payload.path) {
        // Get the default value for this path
        const defaultSettings = await settingsManager.resetSetting(payload.path);
        
        return {
          path: payload.path,
          resetSuccessful: true
        };
      } else {
        // Reset all settings
        await settingsManager.resetAllSettings();
        
        return {
          resetSuccessful: true,
          settings: await settingsManager.getSettings()
        };
      }
    },
    
    // Handler for settings:import message
    [MessageTypes.SETTINGS_IMPORT]: async ({ payload }) => {
      logger.debug('Handling settings:import request');
      
      let filePath;
      
      // If file path is provided, use it, otherwise show dialog
      if (payload && payload.filePath) {
        filePath = payload.filePath;
      } else {
        // Show file selector dialog
        const result = await dialog.showOpenDialog(mainWindow, {
          title: 'Import Settings',
          filters: [
            { name: 'Settings Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ],
          properties: ['openFile']
        });
        
        if (result.canceled || !result.filePaths || !result.filePaths[0]) {
          return { imported: false, canceled: true };
        }
        
        filePath = result.filePaths[0];
      }
      
      try {
        await settingsManager.importSettings(filePath);
        
        return {
          imported: true,
          filePath,
          settings: await settingsManager.getSettings()
        };
      } catch (error) {
        logger.error(`Failed to import settings: ${error.message}`, { error });
        
        throw error;
      }
    },
    
    // Handler for settings:export message
    [MessageTypes.SETTINGS_EXPORT]: async ({ payload }) => {
      logger.debug('Handling settings:export request');
      
      let filePath;
      
      // If file path is provided, use it, otherwise show dialog
      if (payload && payload.filePath) {
        filePath = payload.filePath;
      } else {
        // Generate a default filename with date
        const date = new Date().toISOString().split('T')[0];
        const defaultPath = path.join(
          app.getPath('downloads'), 
          `terraflux-settings-${date}.json`
        );
        
        // Show file save dialog
        const result = await dialog.showSaveDialog(mainWindow, {
          title: 'Export Settings',
          defaultPath: defaultPath,
          filters: [
            { name: 'Settings Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (result.canceled || !result.filePath) {
          return { exported: false, canceled: true };
        }
        
        filePath = result.filePath;
      }
      
      try {
        await settingsManager.exportSettings(filePath);
        
        return {
          exported: true,
          filePath
        };
      } catch (error) {
        logger.error(`Failed to export settings: ${error.message}`, { error });
        
        throw error;
      }
    }
  };
  
  return handlers;
}

module.exports = {
  registerHandlers
};
