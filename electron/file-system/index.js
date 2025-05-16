/**
 * TerraFlux - File System Module
 * 
 * This module provides file system operations with error handling
 * and integration with the application's logging system.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { app } = require('electron');
const errorHandler = require('../error-handling');
const logger = require('../error-handling/logger');
const saveManager = require('./save-manager');
const fileWatcher = require('./file-watcher');

// Promisified fs functions
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);

/**
 * Read a file with error handling
 * @param {string} filePath - Path to the file
 * @param {string} [encoding='utf8'] - File encoding
 * @returns {Promise<string|Buffer>} File contents
 */
async function readFile(filePath, encoding = 'utf8') {
  try {
    const data = await readFileAsync(filePath, encoding);
    logger.debug(`Read file: ${filePath}`);
    return data;
  } catch (error) {
    const errorCode = error.code === 'ENOENT' ? 
      'FILE_NOT_FOUND' : 
      'FILE_READ_FAILED';
    
    const appError = errorHandler.createError(
      errorCode,
      `Failed to read file '${path.basename(filePath)}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Write data to a file with error handling
 * @param {string} filePath - Path to the file
 * @param {string|Buffer} data - Data to write
 * @param {string} [encoding='utf8'] - File encoding
 * @returns {Promise<void>}
 */
async function writeFile(filePath, data, encoding = 'utf8') {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);
    
    // Write file
    await writeFileAsync(filePath, data, encoding);
    logger.debug(`Wrote file: ${filePath}`);
  } catch (error) {
    const appError = errorHandler.createError(
      'FILE_WRITE_FAILED',
      `Failed to write file '${path.basename(filePath)}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await statAsync(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await mkdirAsync(dirPath, { recursive: true });
        logger.debug(`Created directory: ${dirPath}`);
      } catch (mkdirError) {
        const appError = errorHandler.createError(
          'FILE_CREATE_DIR_FAILED',
          `Failed to create directory '${dirPath}': ${mkdirError.message}`,
          mkdirError,
          'ERROR'
        );
        
        errorHandler.handleError(appError);
        throw appError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Check if a file or directory exists
 * @param {string} path - Path to check
 * @returns {Promise<boolean>} Whether the path exists
 */
async function exists(path) {
  try {
    await statAsync(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Read a directory and list its contents
 * @param {string} dirPath - Directory path
 * @returns {Promise<Array<{name: string, path: string, isDirectory: boolean}>>} Directory contents
 */
async function readDirectory(dirPath) {
  try {
    const items = await readdirAsync(dirPath, { withFileTypes: true });
    
    const result = await Promise.all(items.map(async (item) => {
      const itemPath = path.join(dirPath, item.name);
      const isDirectory = item.isDirectory();
      
      return {
        name: item.name,
        path: itemPath,
        isDirectory
      };
    }));
    
    return result;
  } catch (error) {
    const errorCode = error.code === 'ENOENT' ? 
      'FILE_NOT_FOUND' : 
      'FILE_READ_DIR_FAILED';
    
    const appError = errorHandler.createError(
      errorCode,
      `Failed to read directory '${dirPath}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Get application paths
 * @returns {Object} An object containing application paths
 */
function getAppPaths() {
  try {
    return {
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      appData: app.getPath('appData'),
      temp: app.getPath('temp'),
      downloads: app.getPath('downloads'),
      logs: logger.logDir,
      home: app.getPath('home'),
      desktop: app.getPath('desktop'),
      appPath: app.getAppPath()
    };
  } catch (error) {
    logger.warn('Failed to get some app paths', { error });
    
    // Return what we can
    return {
      appPath: app.getAppPath(),
      temp: path.join(process.cwd(), 'temp'),
      logs: logger.logDir
    };
  }
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  try {
    await unlinkAsync(filePath);
    logger.debug(`Deleted file: ${filePath}`);
  } catch (error) {
    const appError = errorHandler.createError(
      'FILE_DELETE_FAILED',
      `Failed to delete file '${path.basename(filePath)}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Read a JSON file with error handling
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<Object>} Parsed JSON object
 */
async function readJsonFile(filePath) {
  try {
    const data = await readFile(filePath);
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'FILE_READ_FAILED' || error.code === 'FILE_NOT_FOUND') {
      throw error;
    }
    
    const appError = errorHandler.createError(
      'FILE_PARSE_FAILED',
      `Failed to parse JSON file '${path.basename(filePath)}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Write a JSON file with error handling
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @param {boolean} [pretty=false] - Whether to pretty-print the JSON
 * @returns {Promise<void>}
 */
async function writeJsonFile(filePath, data, pretty = false) {
  try {
    const jsonString = JSON.stringify(
      data,
      null,
      pretty ? 2 : 0
    );
    
    await writeFile(filePath, jsonString);
  } catch (error) {
    if (error.code === 'FILE_WRITE_FAILED') {
      throw error;
    }
    
    const appError = errorHandler.createError(
      'FILE_WRITE_FAILED',
      `Failed to write JSON file '${path.basename(filePath)}': ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

module.exports = {
  readFile,
  writeFile,
  ensureDirectoryExists,
  exists,
  readDirectory,
  getAppPaths,
  deleteFile,
  readJsonFile,
  writeJsonFile,
  saveManager,
  fileWatcher
};
