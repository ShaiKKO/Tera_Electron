/**
 * TerraFlux - Save Manager
 * 
 * This module handles game save file operations, including saving,
 * loading, error handling, corruption detection, automatic backups,
 * and metadata tracking.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { app } = require('electron');
const errorHandler = require('../error-handling');
const logger = require('../error-handling/logger');
const zlib = require('zlib');

// Promisified functions
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);
const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);
const readdirAsync = promisify(fs.readdir);

// Save file constants
const SAVE_EXTENSION = '.tfsave';
const BACKUP_EXTENSION = '.backup';
const AUTOSAVE_PREFIX = 'autosave_';
const TEMP_EXTENSION = '.tmp';
const SAVE_SCHEMA_VERSION = 1;

// Default save directory
const DEFAULT_SAVE_DIR = path.join(app.getPath('userData'), 'saves');
let saveDirectory = DEFAULT_SAVE_DIR;

/**
 * Set the save directory
 * @param {string} dirPath - New save directory path
 */
function setSaveDirectory(dirPath) {
  saveDirectory = dirPath;
  ensureSaveDirectoryExists();
}

/**
 * Get the current save directory
 * @returns {string} The current save directory path
 */
function getSaveDirectory() {
  return saveDirectory;
}

/**
 * Ensure the save directory exists
 * @returns {Promise<void>}
 */
async function ensureSaveDirectoryExists() {
  try {
    await statAsync(saveDirectory);
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await mkdirAsync(saveDirectory, { recursive: true });
        logger.info(`Created save directory: ${saveDirectory}`);
      } catch (mkdirError) {
        logger.error(`Failed to create save directory: ${mkdirError.message}`, {
          error: mkdirError
        });
        throw mkdirError;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Save game data with error handling, validation and automatic backups
 * @param {string} saveName - Save file name (without extension)
 * @param {Object} data - Game state data to save
 * @param {Object} [options={}] - Save options
 * @param {boolean} [options.compress=true] - Whether to compress the save file
 * @param {boolean} [options.createBackup=true] - Whether to create a backup
 * @param {boolean} [options.autosave=false] - Whether this is an autosave
 * @returns {Promise<Object>} Save result with metadata
 */
async function saveGame(saveName, data, options = {}) {
  const {
    compress = true,
    createBackup = true,
    autosave = false
  } = options;
  
  // Use proper prefix for autosaves
  const finalSaveName = autosave ? 
    `${AUTOSAVE_PREFIX}${saveName}` : 
    saveName;
  
  // Construct file paths
  const fileName = `${finalSaveName}${SAVE_EXTENSION}`;
  const filePath = path.join(saveDirectory, fileName);
  const tempPath = path.join(saveDirectory, `${finalSaveName}${TEMP_EXTENSION}`);
  
  try {
    await ensureSaveDirectoryExists();
    
    // Add metadata to save data
    const saveData = {
      _metadata: {
        version: SAVE_SCHEMA_VERSION,
        saveDate: new Date().toISOString(),
        checksum: null, // Will be calculated after serialization
        isAutosave: autosave
      },
      gameState: data 
    };
    
    // Serialize data to JSON
    const jsonData = JSON.stringify(saveData);
    
    // Calculate checksum for integrity verification
    const checksum = calculateChecksum(jsonData);
    saveData._metadata.checksum = checksum;
    
    // Re-serialize with the checksum included
    let finalData = JSON.stringify(saveData);
    
    // Compress if requested
    if (compress) {
      finalData = await gzipAsync(Buffer.from(finalData, 'utf8'));
    }
    
    // Create backup if requested and existing file exists
    if (createBackup) {
      await createBackupFile(filePath);
    }
    
    // Write to temporary file first
    await writeFileAsync(tempPath, finalData);
    
    // Then rename to final file path (atomic operation)
    fs.renameSync(tempPath, filePath);
    
    logger.info(`Game saved successfully: ${filePath}`, {
      saveName: finalSaveName,
      compressed: compress,
      backupCreated: createBackup,
      isAutosave: autosave
    });
    
    return {
      success: true,
      path: filePath,
      name: finalSaveName,
      date: saveData._metadata.saveDate,
      isAutosave: autosave
    };
  } catch (error) {
    const appError = errorHandler.createError(
      'GAME_SAVE_FAILED',
      `Failed to save game data: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    
    // Clean up temp file if it exists
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (cleanupError) {
      logger.warn('Failed to clean up temporary save file', {
        error: cleanupError
      });
    }
    
    throw appError;
  }
}

/**
 * Load game data with error handling and validation
 * @param {string} saveName - Save file name (without extension)
 * @param {Object} [options={}] - Load options
 * @param {boolean} [options.validateChecksum=true] - Whether to validate checksum
 * @param {boolean} [options.useBackupOnFailure=true] - Whether to try backup if main file fails
 * @returns {Promise<Object>} Loaded game state data
 */
async function loadGame(saveName, options = {}) {
  const {
    validateChecksum = true,
    useBackupOnFailure = true
  } = options;
  
  // Construct file paths
  const fileName = `${saveName}${SAVE_EXTENSION}`;
  const filePath = path.join(saveDirectory, fileName);
  const backupPath = `${filePath}${BACKUP_EXTENSION}`;
  
  try {
    // First try to load the main save file
    return await loadSaveFile(filePath, validateChecksum);
  } catch (error) {
    // If using backup on failure and backup exists, try to load it
    if (useBackupOnFailure) {
      try {
        if (fs.existsSync(backupPath)) {
          logger.warn(`Main save file failed to load, attempting backup: ${backupPath}`, {
            originalError: error.message
          });
          
          return await loadSaveFile(backupPath, validateChecksum);
        }
      } catch (backupError) {
        logger.error(`Backup save file also failed to load: ${backupError.message}`, {
          originalError: error.message,
          backupError
        });
        
        // Re-throw original error since both attempts failed
        throw error;
      }
    }
    
    // If not using backup or backup doesn't exist, throw the original error
    throw error;
  }
}

/**
 * Get a list of available save files
 * @returns {Promise<Array<Object>>} List of save files with metadata
 */
async function listSaveFiles() {
  try {
    await ensureSaveDirectoryExists();
    
    const files = await readdirAsync(saveDirectory);
    
    const saveFiles = files.filter(file => 
      file.endsWith(SAVE_EXTENSION) && !file.endsWith(BACKUP_EXTENSION)
    );
    
    const saveInfoPromises = saveFiles.map(async (fileName) => {
      try {
        const filePath = path.join(saveDirectory, fileName);
        const stats = await statAsync(filePath);
        
        let metadata = null;
        try {
          const quickMetadata = await getQuickMetadata(filePath);
          metadata = quickMetadata;
        } catch (metadataError) {
          logger.warn(`Failed to read metadata from save file: ${fileName}`, {
            error: metadataError
          });
        }
        
        const saveName = fileName.endsWith(SAVE_EXTENSION) ?
          fileName.substring(0, fileName.length - SAVE_EXTENSION.length) :
          fileName;
          
        const isAutosave = saveName.startsWith(AUTOSAVE_PREFIX);
        
        return {
          name: saveName,
          path: filePath,
          fileName,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isAutosave,
          metadata
        };
      } catch (fileError) {
        logger.warn(`Error reading save file info: ${fileName}`, {
          error: fileError
        });
        return null;
      }
    });
    
    const saveInfoList = (await Promise.all(saveInfoPromises))
      .filter(info => info !== null)
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
    
    return saveInfoList;
  } catch (error) {
    const appError = errorHandler.createError(
      'GAME_LIST_SAVES_FAILED',
      `Failed to list save files: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Create a backup of a save file
 * @param {string} filePath - Path to the save file
 * @returns {Promise<boolean>} Whether a backup was created
 */
async function createBackupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const backupPath = `${filePath}${BACKUP_EXTENSION}`;
      await fs.promises.copyFile(filePath, backupPath);
      logger.debug(`Created backup: ${backupPath}`);
      return true;
    }
  } catch (error) {
    logger.warn(`Failed to create backup: ${error.message}`, {
      filePath,
      error
    });
  }
  
  return false;
}

/**
 * Load a save file with decompression and validation
 * @param {string} filePath - Path to the save file
 * @param {boolean} validateChecksum - Whether to validate checksum
 * @returns {Promise<Object>} Loaded game state data
 */
async function loadSaveFile(filePath, validateChecksum) {
  try {
    let data = await readFileAsync(filePath);
    
    // Check if file is compressed (gzipped files start with 0x1F 0x8B)
    const isCompressed = data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B;
    
    if (isCompressed) {
      data = await gunzipAsync(data);
      data = data.toString('utf8');
    }
    
    let saveData;
    try {
      saveData = JSON.parse(data);
    } catch (jsonError) {
      throw errorHandler.createError(
        'GAME_SAVE_CORRUPTED',
        `Save file is corrupted (invalid JSON): ${jsonError.message}`,
        jsonError,
        'ERROR'
      );
    }
    
    // Validate file structure
    if (!saveData || !saveData._metadata || !saveData.gameState) {
      throw errorHandler.createError(
        'GAME_SAVE_INVALID',
        'Save file has an invalid structure',
        null,
        'ERROR'
      );
    }
    
    // Validate checksum if requested
    if (validateChecksum && saveData._metadata.checksum) {
      const storedChecksum = saveData._metadata.checksum;
      
      // Temporarily remove checksum for verification
      saveData._metadata.checksum = null;
      
      // Calculate checksum of data without the stored checksum
      const jsonData = JSON.stringify(saveData);
      const calculatedChecksum = calculateChecksum(jsonData);
      
      // Restore original checksum
      saveData._metadata.checksum = storedChecksum;
      
      if (storedChecksum !== calculatedChecksum) {
        throw errorHandler.createError(
          'GAME_SAVE_CORRUPTED',
          'Save file is corrupted (checksum mismatch)',
          {
            storedChecksum,
            calculatedChecksum
          },
          'ERROR'
        );
      }
    }
    
    logger.info(`Game loaded successfully: ${filePath}`, {
      version: saveData._metadata.version,
      date: saveData._metadata.saveDate,
      isCompressed
    });
    
    return saveData.gameState;
  } catch (error) {
    if (error.code) {
      // Already a formatted error
      throw error;
    }
    
    const appError = errorHandler.createError(
      'GAME_LOAD_FAILED',
      `Failed to load game data: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Calculate a checksum for data integrity verification
 * @param {string} data - Data to calculate checksum for
 * @returns {string} Calculated checksum
 */
function calculateChecksum(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Quickly extract metadata from a save file without loading the full file
 * @param {string} filePath - Path to the save file
 * @returns {Promise<Object>} Extracted metadata
 */
async function getQuickMetadata(filePath) {
  try {
    let data = await readFileAsync(filePath);
    
    // Check if file is compressed
    const isCompressed = data.length >= 2 && data[0] === 0x1F && data[1] === 0x8B;
    
    if (isCompressed) {
      data = await gunzipAsync(data);
      data = data.toString('utf8');
    }
    
    // Parse just enough to extract metadata
    const saveData = JSON.parse(data);
    
    if (!saveData || !saveData._metadata) {
      throw new Error('Invalid save file structure');
    }
    
    return saveData._metadata;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  saveGame,
  loadGame,
  listSaveFiles,
  setSaveDirectory,
  getSaveDirectory,
  SAVE_EXTENSION,
  AUTOSAVE_PREFIX
};
