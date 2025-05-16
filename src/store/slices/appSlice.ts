import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type AppStatus = 'initializing' | 'ready' | 'loading' | 'error';

export interface AppError {
  code?: string;
  message: string;
  details?: unknown;
}

export interface AppState {
  status: AppStatus;
  isInitialized: boolean;
  isDevMode: boolean;
  version: string;
  error: AppError | null;
  pendingOperations: number;
  lastUpdated: number | null;
  // Settings-related state
  settings: Record<string, any>;
  theme?: string;
  animations?: boolean;
  autosave?: boolean;
  difficulty?: string;
  masterVolume?: number;
  musicVolume?: number;
}

// Get environment variables safely
const isDev = typeof process !== 'undefined' 
  ? process.env.NODE_ENV === 'development' 
  : (window as any).ENVIRONMENT === 'development';

const appVersion = typeof process !== 'undefined' 
  ? process.env.VERSION || '0.1.0' 
  : (window as any).APP_VERSION || '0.1.0';

const initialState: AppState = {
  status: 'initializing',
  isInitialized: false,
  isDevMode: isDev,
  version: appVersion,
  error: null,
  pendingOperations: 0,
  lastUpdated: null,
  // Settings with defaults
  settings: {},
  theme: 'system',
  animations: true,
  autosave: true,
  difficulty: 'normal',
  masterVolume: 0.8,
  musicVolume: 0.7,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    /**
     * Set a specific setting value
     */
    setSettingAction: (state, action: PayloadAction<{path: string, value: any}>) => {
      const { path, value } = action.payload;
      
      // Store in nested settings object
      state.settings = {
        ...state.settings,
        [path]: value
      };
      
      // Also update top-level state for commonly accessed settings
      // This makes it easier to access common settings in components
      switch (path) {
        case 'ui.theme':
          state.theme = value;
          break;
        case 'ui.animations':
          state.animations = value;
          break;
        case 'game.gameplay.autosave':
          state.autosave = value;
          break;
        case 'game.gameplay.difficultyLevel':
          state.difficulty = value;
          break;
        case 'game.audio.masterVolume':
          state.masterVolume = value;
          break;
        case 'game.audio.musicVolume':
          state.musicVolume = value;
          break;
      }
      
      state.lastUpdated = Date.now();
    },
    
    /**
     * Reset a specific setting to its default value
     */
    resetSettingAction: (state, action: PayloadAction<{path: string}>) => {
      const { path } = action.payload;
      
      // Remove from settings object
      const { [path]: _, ...rest } = state.settings;
      state.settings = rest;
      
      // Reset top-level state for commonly accessed settings
      switch (path) {
        case 'ui.theme':
          state.theme = initialState.theme;
          break;
        case 'ui.animations':
          state.animations = initialState.animations;
          break;
        case 'game.gameplay.autosave':
          state.autosave = initialState.autosave;
          break;
        case 'game.gameplay.difficultyLevel':
          state.difficulty = initialState.difficulty;
          break;
        case 'game.audio.masterVolume':
          state.masterVolume = initialState.masterVolume;
          break;
        case 'game.audio.musicVolume':
          state.musicVolume = initialState.musicVolume;
          break;
      }
      
      state.lastUpdated = Date.now();
    },
    
    /**
     * Update all settings at once
     */
    updateAllSettingsAction: (state, action: PayloadAction<Record<string, any>>) => {
      state.settings = action.payload;
      
      // Update top-level state for commonly accessed settings
      if (action.payload['ui.theme']) {
        state.theme = action.payload['ui.theme'];
      }
      if (action.payload['ui.animations'] !== undefined) {
        state.animations = action.payload['ui.animations'];
      }
      if (action.payload['game.gameplay.autosave'] !== undefined) {
        state.autosave = action.payload['game.gameplay.autosave'];
      }
      if (action.payload['game.gameplay.difficultyLevel']) {
        state.difficulty = action.payload['game.gameplay.difficultyLevel'];
      }
      if (action.payload['game.audio.masterVolume'] !== undefined) {
        state.masterVolume = action.payload['game.audio.masterVolume'];
      }
      if (action.payload['game.audio.musicVolume'] !== undefined) {
        state.musicVolume = action.payload['game.audio.musicVolume'];
      }
      
      state.lastUpdated = Date.now();
    },
    
    /**
     * Set the overall application status
     */
    setStatus: (state, action: PayloadAction<AppStatus>) => {
      state.status = action.payload;
    },
    
    /**
     * Signal that the app has completed initialization
     */
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
      if (action.payload) {
        state.status = 'ready';
      }
    },
    
    /**
     * Set application error state
     */
    setError: (state, action: PayloadAction<AppError | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    
    /**
     * Start a pending operation (shows loader)
     */
    startOperation: (state) => {
      state.pendingOperations += 1;
      if (state.status !== 'error') {
        state.status = 'loading';
      }
    },
    
    /**
     * Complete a pending operation
     */
    completeOperation: (state) => {
      state.pendingOperations = Math.max(0, state.pendingOperations - 1);
      if (state.pendingOperations === 0 && state.status !== 'error') {
        state.status = 'ready';
      }
    },
    
    /**
     * Update the lastUpdated timestamp
     */
    updateTimestamp: (state) => {
      state.lastUpdated = Date.now();
    },
    
    /**
     * Reset the application state entirely (used after errors or for logout)
     */
    resetAppState: () => {
      return {
        ...initialState,
        isDevMode: isDev,
        version: appVersion,
      };
    },
  },
});

export const {
  setStatus,
  setInitialized,
  setError,
  startOperation,
  completeOperation,
  updateTimestamp,
  resetAppState,
  setSettingAction,
  resetSettingAction,
  updateAllSettingsAction,
} = appSlice.actions;

export default appSlice.reducer;
