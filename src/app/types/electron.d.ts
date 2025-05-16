/**
 * Type definitions for Electron IPC APIs exposed to the renderer process
 */

interface ElectronSettings {
  /**
   * Get all settings
   * @returns Promise<Record<string, any>> All settings
   */
  getAll: () => Promise<Record<string, any>>;

  /**
   * Get a specific setting
   * @param path - Dot notation path to the setting (e.g. 'game.audio.volume')
   * @param defaultValue - Default value if setting doesn't exist
   * @returns Promise<any> The setting value
   */
  get: (path: string, defaultValue?: any) => Promise<any>;

  /**
   * Set a setting value
   * @param path - Dot notation path to the setting (e.g. 'game.audio.volume')
   * @param value - The value to set
   * @param saveImmediately - Whether to save immediately (defaults to true)
   * @returns Promise<boolean> Whether the value was changed
   */
  set: (path: string, value: any, saveImmediately?: boolean) => Promise<boolean>;

  /**
   * Reset a setting to its default value
   * @param path - Dot notation path to the setting (e.g. 'game.audio.volume')
   * @returns Promise<any> The default value
   */
  reset: (path: string) => Promise<any>;

  /**
   * Reset all settings to their default values
   * @returns Promise<Record<string, any>> The default settings
   */
  resetAll: () => Promise<Record<string, any>>;

  /**
   * Export settings to a file
   * @param filePath - Optional path to export to. If not provided, a file dialog will be shown.
   * @returns Promise<{exported: boolean, filePath?: string, canceled?: boolean}> Result of the operation
   */
  export: (filePath?: string) => Promise<{exported: boolean, filePath?: string, canceled?: boolean}>;

  /**
   * Import settings from a file
   * @param filePath - Optional path to import from. If not provided, a file dialog will be shown.
   * @returns Promise<{imported: boolean, filePath?: string, settings?: Record<string, any>, canceled?: boolean}> Result of the operation
   */
  import: (filePath?: string) => Promise<{imported: boolean, filePath?: string, settings?: Record<string, any>, canceled?: boolean}>;
}

/**
 * Game-specific IPC methods for communication with Electron main process
 */
interface ElectronGameAPI {
  /**
   * Send game state updates to the main process
   * @param state - The current game state
   */
  sendGameState: (state: string) => void;

  /**
   * Send game statistics to the main process
   * @param stats - Game performance statistics
   */
  sendGameStats: (stats: any) => void;

  /**
   * Send log messages to the main process
   * @param message - Log message
   */
  sendGameLog: (message: string) => void;

  /**
   * Send error messages to the main process
   * @param error - Error message
   */
  sendGameError: (error: string) => void;

  /**
   * Register callback for game initialization events
   * @param callback - Function called when main process sends initialization data
   */
  onGameInit: (callback: (config: any) => void) => void;
}

interface ElectronAPI {
  // App events
  onAppEvent: (callback: (event: string) => void) => void;
  
  // Window operations
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // File operations
  saveFile: (data: any, fileName?: string) => Promise<string>;
  openFile: () => Promise<{ filePath: string; data: any }>;
  
  // App version info
  getAppVersion: () => Promise<string>;
  
  // Native dialogs
  showMessageBox: (options: { 
    type: 'info' | 'warning' | 'error' | 'question';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => Promise<{ response: number }>;
}

// Add the electronAPI to the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: {
      settings: ElectronSettings;
      sendMessage: (channel: string, payload?: any) => Promise<any>;
      sendMessageNoResponse: (channel: string, payload?: any) => void;
      onMessage: (channel: string, callback: Function) => Function;
      onMessageOnce: (channel: string, callback: Function) => void;
      getAppInfo: () => Promise<any>;
      platform: {
        isMac: boolean;
        isWindows: boolean;
        isLinux: boolean;
        processType: string;
        processVersion: Record<string, string>;
      };
      
      // Game-specific methods
      sendGameState: ElectronGameAPI['sendGameState'];
      sendGameStats: ElectronGameAPI['sendGameStats'];
      sendGameLog: ElectronGameAPI['sendGameLog'];
      sendGameError: ElectronGameAPI['sendGameError']; 
      onGameInit: ElectronGameAPI['onGameInit'];
    };
  }
}

export {};
