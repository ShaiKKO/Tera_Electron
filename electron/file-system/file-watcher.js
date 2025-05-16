/**
 * TerraFlux - File Watcher
 * 
 * This module provides file system watching capabilities with debouncing,
 * error handling, and normalized events for different platforms.
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');
const logger = require('../error-handling/logger');

// Event emitter for file changes
const fileEvents = new EventEmitter();

// Active watchers
const watchers = new Map();

/**
 * Watch a file or directory for changes
 * @param {string} pathToWatch - Path to file or directory to watch
 * @param {Object} [options={}] - Watch options
 * @param {boolean} [options.recursive=false] - Watch directories recursively
 * @param {boolean} [options.ignoreInitial=true] - Ignore initial add events
 * @param {Array<string>} [options.ignorePatterns=[]] - Patterns to ignore
 * @param {number} [options.debounceMs=300] - Debounce time in milliseconds
 * @returns {string} Watcher ID for stopping the watcher later
 */
function watch(pathToWatch, options = {}) {
  const {
    recursive = false,
    ignoreInitial = true,
    ignorePatterns = [],
    debounceMs = 300
  } = options;
  
  // Generate a unique ID for this watcher
  const watcherId = `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Default ignore patterns
    const defaultIgnorePatterns = [
      /(^|[\/\\])\../,  // dotfiles
      '**/node_modules/**',
      '**/.git/**'
    ];
    
    // Normalize path
    const normalizedPath = path.normalize(pathToWatch);
    
    // Create watcher
    const watcher = chokidar.watch(normalizedPath, {
      persistent: true,
      ignoreInitial,
      awaitWriteFinish: {
        stabilityThreshold: debounceMs,
        pollInterval: 100
      },
      ignored: [...defaultIgnorePatterns, ...ignorePatterns],
      depth: recursive ? undefined : 0
    });
    
    // Set up event handlers with debouncing
    watcher.on('add', filePath => {
      logger.debug(`File added: ${filePath}`);
      fileEvents.emit('file-added', { path: filePath, watcherId });
      fileEvents.emit('any-change', { type: 'add', path: filePath, watcherId });
    });
    
    watcher.on('change', filePath => {
      logger.debug(`File changed: ${filePath}`);
      fileEvents.emit('file-changed', { path: filePath, watcherId });
      fileEvents.emit('any-change', { type: 'change', path: filePath, watcherId });
    });
    
    watcher.on('unlink', filePath => {
      logger.debug(`File deleted: ${filePath}`);
      fileEvents.emit('file-deleted', { path: filePath, watcherId });
      fileEvents.emit('any-change', { type: 'unlink', path: filePath, watcherId });
    });
    
    // Only trigger directory events if watching recursively
    if (recursive) {
      watcher.on('addDir', dirPath => {
        logger.debug(`Directory added: ${dirPath}`);
        fileEvents.emit('dir-added', { path: dirPath, watcherId });
        fileEvents.emit('any-change', { type: 'addDir', path: dirPath, watcherId });
      });
      
      watcher.on('unlinkDir', dirPath => {
        logger.debug(`Directory deleted: ${dirPath}`);
        fileEvents.emit('dir-deleted', { path: dirPath, watcherId });
        fileEvents.emit('any-change', { type: 'unlinkDir', path: dirPath, watcherId });
      });
    }
    
    // Handle errors
    watcher.on('error', error => {
      logger.error(`File watcher error: ${error.message}`, {
        watcherId,
        path: normalizedPath,
        error
      });
      fileEvents.emit('watcher-error', { error, path: normalizedPath, watcherId });
    });
    
    // Ready event
    watcher.on('ready', () => {
      logger.info(`File watcher ready: ${normalizedPath}`, {
        watcherId,
        recursive
      });
      fileEvents.emit('watcher-ready', { path: normalizedPath, watcherId });
    });
    
    // Store the watcher
    watchers.set(watcherId, {
      watcher,
      path: normalizedPath,
      options
    });
    
    return watcherId;
  } catch (error) {
    logger.error(`Failed to create file watcher for ${pathToWatch}: ${error.message}`, {
      error
    });
    throw error;
  }
}

/**
 * Stop watching a file or directory
 * @param {string} watcherId - ID of the watcher to stop
 * @returns {boolean} Whether the watcher was successfully stopped
 */
function unwatch(watcherId) {
  try {
    if (!watchers.has(watcherId)) {
      logger.warn(`Attempted to stop non-existent watcher: ${watcherId}`);
      return false;
    }
    
    const { watcher, path: watchPath } = watchers.get(watcherId);
    
    // Close the watcher
    watcher.close();
    
    // Remove from active watchers
    watchers.delete(watcherId);
    
    logger.info(`Stopped file watcher: ${watchPath}`, { watcherId });
    fileEvents.emit('watcher-stopped', { path: watchPath, watcherId });
    
    return true;
  } catch (error) {
    logger.error(`Failed to stop file watcher ${watcherId}: ${error.message}`, {
      error
    });
    return false;
  }
}

/**
 * Stop all file watchers
 */
function unwatchAll() {
  try {
    const watcherIds = [...watchers.keys()];
    
    for (const id of watcherIds) {
      unwatch(id);
    }
    
    logger.info(`Stopped all file watchers (${watcherIds.length} total)`);
  } catch (error) {
    logger.error(`Failed to stop all file watchers: ${error.message}`, {
      error
    });
  }
}

/**
 * Check if a path is being watched
 * @param {string} pathToCheck - File or directory path to check
 * @returns {boolean} Whether the path is being watched
 */
function isWatching(pathToCheck) {
  const normalizedPath = path.normalize(pathToCheck);
  
  for (const { path: watchPath } of watchers.values()) {
    if (watchPath === normalizedPath) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get information about all active watchers
 * @returns {Array<Object>} Array of watcher info objects
 */
function getActiveWatchers() {
  return Array.from(watchers.entries()).map(([id, { path: watchPath, options }]) => ({
    id,
    path: watchPath,
    options
  }));
}

// Clean up watchers on process exit
process.on('exit', () => {
  unwatchAll();
});

module.exports = {
  watch,
  unwatch,
  unwatchAll,
  isWatching,
  getActiveWatchers,
  events: fileEvents
};
