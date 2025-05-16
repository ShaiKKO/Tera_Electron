/**
 * TerraFlux - Platform Utilities
 * 
 * This module provides platform detection utilities and constants
 * for different operating systems.
 */

const os = require('os');

/**
 * Platform detection constants
 */
const platform = process.platform;

/**
 * Check if the current platform is macOS
 * @type {boolean}
 */
const isMac = platform === 'darwin';

/**
 * Check if the current platform is Windows
 * @type {boolean}
 */
const isWindows = platform === 'win32';

/**
 * Check if the current platform is Linux
 * @type {boolean}
 */
const isLinux = platform === 'linux';

/**
 * Get detailed information about the current platform
 * @returns {Object} Platform information
 */
function getPlatformInfo() {
  return {
    platform,
    isMac,
    isWindows,
    isLinux,
    osVersion: os.release(),
    osArch: os.arch(),
    osType: os.type(),
    cpuArchitecture: process.arch,
    cpuCores: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    userInfo: os.userInfo()
  };
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes - Bytes to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get system memory info formatted for display
 * @returns {Object} Memory info
 */
function getMemoryInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  return {
    total: formatBytes(totalMemory),
    free: formatBytes(freeMemory),
    used: formatBytes(usedMemory),
    percentUsed: Math.round((usedMemory / totalMemory) * 100)
  };
}

/**
 * Get a unique machine ID
 * @returns {Promise<string>} Machine ID
 */
async function getMachineId() {
  return new Promise((resolve) => {
    // Generate a stable machine ID based on hostname and some hardware info
    const hostname = os.hostname();
    const cpuInfo = os.cpus()[0]?.model || '';
    const totalMemory = os.totalmem();
    
    // Create a simple hash from these values
    const combinedString = `${hostname}-${cpuInfo}-${totalMemory}`;
    let hash = 0;
    for (let i = 0; i < combinedString.length; i++) {
      const char = combinedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Return as hex string for consistent format
    const hexHash = Math.abs(hash).toString(16);
    resolve(hexHash);
  });
}

/**
 * Get machine name
 * @returns {Promise<string>} Machine name
 */
async function getMachineName() {
  return Promise.resolve(os.hostname());
}

/**
 * Check if the system is running in a virtual machine
 * @returns {boolean} Whether the system is likely running in a VM
 */
function isVirtualMachine() {
  // This is a basic detection that can be expanded
  // More sophisticated detection would check for VM-specific hardware/drivers
  const cpuModel = os.cpus()[0]?.model || '';
  let manufacturer = '';
  
  try {
    // Attempt to get system manufacturer on Windows
    if (isWindows) {
      const { execSync } = require('child_process');
      const result = execSync('wmic computersystem get manufacturer', { encoding: 'utf8' });
      if (result) {
        const lines = result.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          manufacturer = lines[1].trim();
        }
      }
    }
    
    // Check for common VM indicators
    const vmIndicators = [
      'VMware',
      'VirtualBox',
      'Xen',
      'KVM',
      'Parallels',
      'Virtual Machine',
      'QEMU',
      'Hyper-V'
    ];
    
    return vmIndicators.some(indicator => 
      cpuModel.includes(indicator) || manufacturer.includes(indicator)
    );
  } catch (error) {
    console.error('Error detecting virtual machine:', error);
    return false;
  }
}

module.exports = {
  isMac,
  isWindows,
  isLinux,
  getPlatformInfo,
  formatBytes,
  getMemoryInfo,
  isVirtualMachine,
  getMachineId,
  getMachineName
};
