/**
 * TerraFlux - File IPC Handlers
 * 
 * This module handles file-related IPC messages from the renderer process,
 * such as file selection, reading, writing, etc.
 */

const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { MessageTypes } = require('../protocol');
const logger = require('../../error-handling/logger');
const fileSystem = require('../../file-system');

/**
 * Register file-related IPC handlers
 * @param {Electron.BrowserWindow} mainWindow - The main window
 * @returns {Object} Map of message types to handler functions
 */
function registerHandlers(mainWindow) {
  const handlers = {
    // Handler for file:select-directory message
    [MessageTypes.FILE_SELECT_DIRECTORY]: async ({ payload }) => {
      logger.debug('Handling file:select-directory request');
      
      const options = {
        title: payload?.title || 'Select Directory',
        properties: ['openDirectory']
      };
      
      // Default path
      if (payload?.defaultPath) {
        options.defaultPath = payload.defaultPath;
      }
      
      const result = await dialog.showOpenDialog(mainWindow, options);
      
      return {
        canceled: result.canceled,
        directoryPath: result.filePaths && result.filePaths[0]
      };
    },
    
    // Handler for file:select-save-path message
    [MessageTypes.FILE_SELECT_SAVE_PATH]: async ({ payload }) => {
      logger.debug('Handling file:select-save-path request');
      
      const options = {
        title: payload?.title || 'Save File',
        properties: ['createDirectory', 'showOverwriteConfirmation']
      };
      
      // File filters 
      if (payload?.filters) {
        options.filters = payload.filters;
      } else {
        options.filters = [
          { name: 'All Files', extensions: ['*'] }
        ];
      }
      
      // Default path
      if (payload?.defaultPath) {
        options.defaultPath = payload.defaultPath;
      }
      
      const result = await dialog.showSaveDialog(mainWindow, options);
      
      return {
        canceled: result.canceled,
        filePath: result.filePath
      };
    },
    
    // Handler for file:select-load-path message
    [MessageTypes.FILE_SELECT_LOAD_PATH]: async ({ payload }) => {
      logger.debug('Handling file:select-load-path request');
      
      const options = {
        title: payload?.title || 'Open File',
        properties: ['openFile']
      };
      
      // File filters
      if (payload?.filters) {
        options.filters = payload.filters;
      } else {
        options.filters = [
          { name: 'All Files', extensions: ['*'] }
        ];
      }
      
      // Default path
      if (payload?.defaultPath) {
        options.defaultPath = payload.defaultPath;
      }
      
      const result = await dialog.showOpenDialog(mainWindow, options);
      
      return {
        canceled: result.canceled,
        filePath: result.filePaths && result.filePaths[0]
      };
    },
    
    // Handler for file:read message
    [MessageTypes.FILE_READ]: async ({ payload }) => {
      logger.debug('Handling file:read request', { path: payload?.path });
      
      if (!payload?.path) {
        throw new Error('File path is required');
      }
      
      try {
        const content = await fileSystem.readFile(payload.path, payload.options);
        return { 
          content,
          path: payload.path
        };
      } catch (error) {
        logger.error('Error reading file', { error, path: payload.path });
        throw error;
      }
    },
    
    // Handler for file:write message
    [MessageTypes.FILE_WRITE]: async ({ payload }) => {
      logger.debug('Handling file:write request', { path: payload?.path });
      
      if (!payload?.path || payload?.content === undefined) {
        throw new Error('File path and content are required');
      }
      
      try {
        await fileSystem.writeFile(payload.path, payload.content, payload.options);
        return { 
          success: true,
          path: payload.path
        };
      } catch (error) {
        logger.error('Error writing file', { error, path: payload.path });
        throw error;
      }
    },
    
    // Handler for game:save message (for testing)
    [MessageTypes.GAME_SAVE]: async ({ payload }) => {
      logger.debug('Handling game:save request', { path: payload?.filePath });
      
      if (!payload?.filePath || !payload?.data) {
        throw new Error('File path and data are required for saving');
      }
      
      try {
        // Convert data to JSON if it's not a string
        let dataToSave = payload.data;
        
        if (typeof dataToSave !== 'string') {
          const options = payload.options || {};
          dataToSave = options.pretty 
            ? JSON.stringify(dataToSave, null, 2) 
            : JSON.stringify(dataToSave);
        }
        
        await fileSystem.writeFile(payload.filePath, dataToSave);
        
        return { 
          success: true,
          path: payload.filePath
        };
      } catch (error) {
        logger.error('Error saving game data', { error, path: payload.filePath });
        throw error;
      }
    },
    
    // Handler for game:load message (for testing)
    [MessageTypes.GAME_LOAD]: async ({ payload }) => {
      logger.debug('Handling game:load request', { path: payload?.filePath });
      
      if (!payload?.filePath) {
        throw new Error('File path is required for loading');
      }
      
      try {
        const content = await fileSystem.readFile(payload.filePath, { encoding: 'utf8' });
        
        // Parse JSON if requested
        let result = content;
        
        if (payload.options?.parseJson) {
          try {
            result = JSON.parse(content);
          } catch (parseError) {
            logger.warn('Failed to parse JSON', { error: parseError });
            throw new Error(`Failed to parse file as JSON: ${parseError.message}`);
          }
        }
        
        return { 
          data: result,
          path: payload.filePath
        };
      } catch (error) {
        logger.error('Error loading game data', { error, path: payload.filePath });
        throw error;
      }
    }
  };
  
  return handlers;
}

module.exports = {
  registerHandlers
};
