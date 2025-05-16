/**
 * TerraFlux - Settings Manager
 * 
 * This module manages application and game settings, including loading,
 * saving, validation, and default values. It supports device-specific
 * profiles and provides a consistent interface for the renderer process.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { app } = require('electron');
const logger = require('../error-handling/logger');
const errorHandler = require('../error-handling');
const platformUtils = require('../utils/platform');

// Promisified functions
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const statAsync = promisify(fs.stat);
const accessAsync = promisify(fs.access);

// Settings constants
const SETTINGS_FOLDER = 'settings';
const SETTINGS_FILE = 'user-settings.json';
const DEFAULT_SETTINGS_FILE = 'default-settings.json';
const TEMP_EXTENSION = '.tmp';
const BACKUP_EXTENSION = '.backup';
const SETTINGS_SCHEMA_VERSION = 1;

// Default config directory
const configDir = path.join(app.getPath('userData'), SETTINGS_FOLDER);

// Cache for settings
let cachedSettings = null;
let isInitialized = false;

/**
 * Default settings for the application and game
 * This serves as a schema for all settings
 */
const defaultSettings = {
  _metadata: {
    version: SETTINGS_SCHEMA_VERSION,
    lastModified: new Date().toISOString(),
    deviceId: null,
    deviceName: null,
    platform: null
  },
  app: {
    window: {
      rememberSize: true,
      rememberPosition: true,
      startMaximized: false,
    },
    updates: {
      checkOnStartup: true,
      autoDownload: true,
      channel: 'stable'
    },
    general: {
      language: 'en',
      showTips: true,
      crashReporting: true,
      telemetry: true
    }
  },
  game: {
    display: {
      fullscreen: false,
      vsync: true,
      resolution: 'native',
      uiScale: 1.0,
      quality: 'high',
      showFps: false
    },
    audio: {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      ambientVolume: 0.6,
      muteWhenInBackground: true
    },
    gameplay: {
      autosave: true,
      autosaveInterval: 5, // minutes
      difficultyLevel: 'normal',
      tutorialMode: true,
      pauseOnNotification: true,
      maxBackups: 5
    }
  },
  ui: {
    theme: 'system', // system, light, dark
    animations: true,
    notificationLevel: 'all', // all, important, none
    sidebarWidth: 280,
    compactMode: false
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
    colorBlindMode: 'none'
  },
  development: {
    debugMode: false,
    showConsole: false,
    logLevel: 'info',
  }
};

/**
 * Settings validation schemas
 */
const settingsValidation = {
  app: {
    window: {
      rememberSize: { type: 'boolean' },
      rememberPosition: { type: 'boolean' },
      startMaximized: { type: 'boolean' }
    },
    updates: {
      checkOnStartup: { type: 'boolean' },
      autoDownload: { type: 'boolean' },
      channel: { type: 'enum', values: ['stable', 'beta', 'alpha'] }
    },
    general: {
      language: { type: 'string', pattern: /^[a-z]{2}(-[A-Z]{2})?$/ },
      showTips: { type: 'boolean' },
      crashReporting: { type: 'boolean' },
      telemetry: { type: 'boolean' }
    }
  },
  game: {
    display: {
      fullscreen: { type: 'boolean' },
      vsync: { type: 'boolean' },
      resolution: { type: 'string' },
      uiScale: { type: 'float', min: 0.5, max: 2.0 },
      quality: { type: 'enum', values: ['low', 'medium', 'high', 'ultra'] },
      showFps: { type: 'boolean' }
    },
    audio: {
      masterVolume: { type: 'float', min: 0, max: 1 },
      musicVolume: { type: 'float', min: 0, max: 1 },
      sfxVolume: { type: 'float', min: 0, max: 1 },
      ambientVolume: { type: 'float', min: 0, max: 1 },
      muteWhenInBackground: { type: 'boolean' }
    },
    gameplay: {
      autosave: { type: 'boolean' },
      autosaveInterval: { type: 'integer', min: 1, max: 60 },
      difficultyLevel: { type: 'enum', values: ['easy', 'normal', 'hard', 'extreme'] },
      tutorialMode: { type: 'boolean' },
      pauseOnNotification: { type: 'boolean' },
      maxBackups: { type: 'integer', min: 1, max: 20 }
    }
  },
  ui: {
    theme: { type: 'enum', values: ['system', 'light', 'dark'] },
    animations: { type: 'boolean' },
    notificationLevel: { type: 'enum', values: ['all', 'important', 'none'] },
    sidebarWidth: { type: 'integer', min: 200, max: 500 },
    compactMode: { type: 'boolean' }
  },
  accessibility: {
    highContrast: { type: 'boolean' },
    largeText: { type: 'boolean' },
    reduceMotion: { type: 'boolean' },
    screenReader: { type: 'boolean' },
    colorBlindMode: { type: 'enum', values: ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] }
  },
  development: {
    debugMode: { type: 'boolean' },
    showConsole: { type: 'boolean' },
    logLevel: { type: 'enum', values: ['debug', 'info', 'warn', 'error'] }
  }
};

/**
 * Initialize the settings manager
 * @returns {Promise<Object>} The current settings
 */
async function initialize() {
  if (isInitialized) {
    return cachedSettings;
  }
  
  try {
    // Make sure the config directory exists
    await ensureConfigDirectory();
    
    // Load settings (or create if they don't exist)
    const settings = await loadSettings();
    
    // Update device-specific metadata
    settings._metadata.deviceId = await platformUtils.getMachineId();
    settings._metadata.deviceName = await platformUtils.getMachineName();
    settings._metadata.platform = platformUtils.getPlatformInfo();
    
    // Cache the settings
    cachedSettings = settings;
    isInitialized = true;
    
    logger.info('Settings manager initialized successfully');
    
    return settings;
  } catch (error) {
    const appError = errorHandler.createError(
      'SETTINGS_INIT_FAILED',
      `Failed to initialize settings manager: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Ensure the configuration directory exists
 * @returns {Promise<void>}
 */
async function ensureConfigDirectory() {
  try {
    await statAsync(configDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      try {
        await mkdirAsync(configDir, { recursive: true });
        logger.info(`Created settings directory: ${configDir}`);
      } catch (mkdirError) {
        logger.error(`Failed to create settings directory: ${mkdirError.message}`, {
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
 * Load settings from disk
 * @param {boolean} [bypassCache=false] - Whether to bypass the cache and load directly from disk
 * @returns {Promise<Object>} The loaded settings
 */
async function loadSettings(bypassCache = false) {
  // Return cached settings if initialized and not bypassing cache
  if (isInitialized && !bypassCache && cachedSettings) {
    return { ...cachedSettings };
  }
  
  const settingsPath = path.join(configDir, SETTINGS_FILE);
  
  try {
    // Check if the settings file exists
    await accessAsync(settingsPath, fs.constants.R_OK);
    
    // Read the settings file
    const settingsData = await readFileAsync(settingsPath, 'utf8');
    let settings;
    
    try {
      settings = JSON.parse(settingsData);
      logger.debug('Settings loaded from file');
    } catch (parseError) {
      logger.warn(`Failed to parse settings file, using default settings: ${parseError.message}`);
      settings = { ...defaultSettings };
      
      // Create backup of corrupted file
      const backupPath = `${settingsPath}.corrupted-${Date.now()}`;
      try {
        await writeFileAsync(backupPath, settingsData);
        logger.info(`Created backup of corrupted settings file: ${backupPath}`);
      } catch (backupError) {
        logger.error(`Failed to backup corrupted settings file: ${backupError.message}`);
      }
    }
    
    // Validate and repair settings if needed
    const validatedSettings = validateAndRepairSettings(settings);
    
    return validatedSettings;
  } catch (error) {
    // If file doesn't exist, create with default settings
    if (error.code === 'ENOENT') {
      logger.info('Settings file not found, creating with default values');
      const newSettings = { ...defaultSettings };
      await saveSettings(newSettings);
      return newSettings;
    }
    
    // Handle other errors
    logger.error(`Failed to load settings: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Save settings to disk
 * @param {Object} settings - The settings to save
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  try {
    // Make sure the config directory exists
    await ensureConfigDirectory();
    
    // Update metadata
    settings._metadata = settings._metadata || {};
    settings._metadata.lastModified = new Date().toISOString();
    settings._metadata.version = SETTINGS_SCHEMA_VERSION;
    
    // Validate settings before saving
    const validatedSettings = validateAndRepairSettings(settings);
    
    // Prepare file paths
    const settingsPath = path.join(configDir, SETTINGS_FILE);
    const tempPath = path.join(configDir, `${SETTINGS_FILE}${TEMP_EXTENSION}`);
    
    // Create backup of existing settings if they exist
    try {
      await accessAsync(settingsPath, fs.constants.R_OK);
      const backupPath = `${settingsPath}${BACKUP_EXTENSION}`;
      await fs.promises.copyFile(settingsPath, backupPath);
      logger.debug('Created settings backup before saving');
    } catch (backupError) {
      // Ignore if file doesn't exist
      if (backupError.code !== 'ENOENT') {
        logger.warn(`Failed to create settings backup: ${backupError.message}`);
      }
    }
    
    // Write to temp file first
    const settingsJson = JSON.stringify(validatedSettings, null, 2);
    await writeFileAsync(tempPath, settingsJson, 'utf8');
    
    // Rename to final file (atomic operation)
    await fs.promises.rename(tempPath, settingsPath);
    
    // Update cache
    cachedSettings = { ...validatedSettings };
    
    logger.debug('Settings saved successfully');
  } catch (error) {
    const appError = errorHandler.createError(
      'SETTINGS_SAVE_FAILED',
      `Failed to save settings: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Validate settings against the schema and repair if necessary
 * @param {Object} settings - The settings to validate
 * @returns {Object} The validated and repaired settings
 */
function validateAndRepairSettings(settings) {
  // Start with a deep clone of the default settings
  const validatedSettings = JSON.parse(JSON.stringify(defaultSettings));
  
  // Preserve metadata if it exists
  if (settings && settings._metadata) {
    validatedSettings._metadata = {
      ...validatedSettings._metadata,
      ...settings._metadata
    };
  }
  
  // Helper function to recursively validate and repair settings
  function validateRecursive(source, target, schema, path = '') {
    if (!source || typeof source !== 'object') return;
    
    Object.keys(schema).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If this is a validation schema (has a type)
      if (schema[key].type) {
        if (source[key] !== undefined) {
          // Validate and repair based on type
          const isValid = validateValue(source[key], schema[key], currentPath);
          
          if (isValid) {
            target[key] = source[key];
          } else {
            logger.warn(`Invalid setting at ${currentPath}, using default`);
            // Keep the default value that's already in target
          }
        }
      } 
      // Recurse into nested objects
      else if (typeof schema[key] === 'object') {
        if (source[key] && typeof source[key] === 'object') {
          validateRecursive(source[key], target[key], schema[key], currentPath);
        }
      }
    });
  }
  
  // Apply the validation recursively
  validateRecursive(settings, validatedSettings, settingsValidation);
  
  return validatedSettings;
}

/**
 * Validate a single value against its schema
 * @param {any} value - The value to validate
 * @param {Object} schema - The schema to validate against
 * @param {string} path - The path to the value (for logging)
 * @returns {boolean} Whether the value is valid
 */
function validateValue(value, schema, path) {
  switch (schema.type) {
    case 'boolean':
      return typeof value === 'boolean';
      
    case 'integer':
      if (typeof value !== 'number' || !Number.isInteger(value)) return false;
      if (schema.min !== undefined && value < schema.min) return false;
      if (schema.max !== undefined && value > schema.max) return false;
      return true;
      
    case 'float':
    case 'number':
      if (typeof value !== 'number') return false;
      if (schema.min !== undefined && value < schema.min) return false;
      if (schema.max !== undefined && value > schema.max) return false;
      return true;
      
    case 'string':
      if (typeof value !== 'string') return false;
      if (schema.pattern && !schema.pattern.test(value)) return false;
      return true;
      
    case 'enum':
      return schema.values && schema.values.includes(value);
      
    default:
      logger.warn(`Unknown validation type: ${schema.type} at ${path}`);
      return false;
  }
}

/**
 * Get the full settings object
 * @returns {Promise<Object>} The current settings
 */
async function getSettings() {
  if (!isInitialized) {
    await initialize();
  }
  return { ...cachedSettings };
}

/**
 * Get a specific setting value
 * @param {string} path - The dot-notation path to the setting
 * @param {any} [defaultValue=undefined] - The default value if setting doesn't exist
 * @returns {Promise<any>} The setting value
 */
async function getSetting(path, defaultValue = undefined) {
  if (!isInitialized) {
    await initialize();
  }
  
  const parts = path.split('.');
  let current = cachedSettings;
  
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== 'object') {
      return defaultValue;
    }
    current = current[part];
  }
  
  return current !== undefined ? current : defaultValue;
}

/**
 * Set a specific setting value
 * @param {string} path - The dot-notation path to the setting
 * @param {any} value - The value to set
 * @param {boolean} [saveImmediately=true] - Whether to save immediately
 * @returns {Promise<boolean>} Whether the setting was changed
 */
async function setSetting(path, value, saveImmediately = true) {
  if (!isInitialized) {
    await initialize();
  }
  
  const parts = path.split('.');
  const lastPart = parts.pop();
  let current = cachedSettings;
  
  // Navigate to the parent of the setting we want to change
  for (const part of parts) {
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Check if the value would actually change
  if (current[lastPart] === value) {
    return false;
  }
  
  // Set the new value
  current[lastPart] = value;
  
  // Save if requested
  if (saveImmediately) {
    await saveSettings(cachedSettings);
  }
  
  return true;
}

/**
 * Reset a specific setting to its default value
 * @param {string} path - The dot-notation path to the setting
 * @returns {Promise<any>} The default value for the setting
 */
async function resetSetting(path) {
  if (!isInitialized) {
    await initialize();
  }
  
  // Get default value
  const parts = path.split('.');
  let defaultValue = JSON.parse(JSON.stringify(defaultSettings));
  
  for (const part of parts) {
    if (defaultValue === undefined || defaultValue === null) {
      throw new Error(`Invalid setting path: ${path}`);
    }
    defaultValue = defaultValue[part];
  }
  
  // Set to default
  await setSetting(path, defaultValue);
  
  logger.info(`Reset setting ${path} to default value`);
  return defaultValue;
}

/**
 * Reset all settings to their default values
 * @returns {Promise<void>}
 */
async function resetAllSettings() {
  cachedSettings = JSON.parse(JSON.stringify(defaultSettings));
  
  // Update device-specific metadata
  cachedSettings._metadata.deviceId = await platformUtils.getMachineId();
  cachedSettings._metadata.deviceName = await platformUtils.getMachineName();
  cachedSettings._metadata.platform = platformUtils.getPlatformInfo();
  
  await saveSettings(cachedSettings);
  logger.info('All settings reset to default values');
}

/**
 * Export settings to a JSON file
 * @param {string} filePath - The path to export to
 * @returns {Promise<void>}
 */
async function exportSettings(filePath) {
  try {
    const settings = await getSettings();
    const settingsJson = JSON.stringify(settings, null, 2);
    await writeFileAsync(filePath, settingsJson, 'utf8');
    logger.info(`Settings exported to ${filePath}`);
  } catch (error) {
    const appError = errorHandler.createError(
      'SETTINGS_EXPORT_FAILED',
      `Failed to export settings: ${error.message}`,
      error,
      'ERROR'
    );
    
    errorHandler.handleError(appError);
    throw appError;
  }
}

/**
 * Import settings from a JSON file
 * @param {string} filePath - The path to import from
 * @returns {Promise<void>}
 */
async function importSettings(filePath) {
  try {
    const settingsJson = await readFileAsync(filePath, 'utf8');
    let importedSettings;
    
    try {
      importedSettings = JSON.parse(settingsJson);
    } catch (parseError) {
      const appError = errorHandler.createError(
        'SETTINGS_IMPORT_INVALID',
        `Invalid settings file: ${parseError.message}`,
        parseError,
        'ERROR'
      );
      
      errorHandler.handleError(appError);
      throw appError;
    }
    
    // Validate and repair imported settings
    const validatedSettings = validateAndRepairSettings(importedSettings);
    
    // Save the imported settings
    await saveSettings(validatedSettings);
    
    logger.info(`Settings imported from ${filePath}`);
  } catch (error) {
    if (error.code !== 'SETTINGS_IMPORT_INVALID') {
      const appError = errorHandler.createError(
        'SETTINGS_IMPORT_FAILED',
        `Failed to import settings: ${error.message}`,
        error,
        'ERROR'
      );
      
      errorHandler.handleError(appError);
      throw appError;
    }
    
    // Re-throw the already-handled error
    throw error;
  }
}

/**
 * Apply settings to the application (e.g., window size, theme, etc.)
 * @param {Object} [options={}] - Options for applying settings
 * @returns {Promise<void>}
 */
async function applySettings(options = {}) {
  if (!isInitialized) {
    await initialize();
  }
  
  logger.info('Applying settings to application');
  
  // Emit settings-applied event
  // TODO: Implement when we have an event system
  
  return cachedSettings;
}

// Export the API
module.exports = {
  initialize,
  getSettings,
  getSetting,
  setSetting,
  saveSettings,
  resetSetting,
  resetAllSettings,
  exportSettings,
  importSettings,
  applySettings,
  SETTINGS_SCHEMA_VERSION
};
