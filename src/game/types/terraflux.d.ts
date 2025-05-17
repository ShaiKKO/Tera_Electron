/**
 * TerraFlux - Global Type Declarations
 * 
 * This file contains type declarations for global objects and interfaces
 * used throughout the TerraFlux application.
 */

// Extend the Window interface to include the terraflux namespace
interface Window {
  terraflux: TerrafluxAPI;
}

// TerraFlux API exposed by the Electron preload script
interface TerrafluxAPI {
  // Logging functions
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  
  // Application functions
  getVersion: () => Promise<string>;
  openDevTools: () => Promise<void>;
  quit: () => Promise<void>;
  
  // Test-specific functions
  getEntityConfigs: () => EntityConfig[];
  
  // Window management
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // File system functions
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  getAppPath: () => Promise<string>;
  
  // Game-specific functions
  startGame: () => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  stopGame: () => Promise<void>;
  
  // Settings functions
  getSettings: () => Promise<Record<string, any>>;
  setSetting: (key: string, value: any) => Promise<void>;
}
