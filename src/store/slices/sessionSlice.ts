import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserPreferences {
  audioEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  autoSaveInterval: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  useCompactUI: boolean;
  notificationsEnabled: boolean;
  toolbarPosition: 'top' | 'left' | 'right' | 'bottom';
  keybindings: Record<string, string>;
}

export interface SessionUser {
  id: string;
  username: string;
  isGuest: boolean;
  lastLogin: number;
}

export interface SessionState {
  // User session data
  user: SessionUser | null;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  lastActivity: number;
  
  // Recent data
  recentSaves: string[];
  recentlyVisited: string[];
}

const defaultPreferences: UserPreferences = {
  audioEnabled: true,
  musicVolume: 70,
  effectsVolume: 100,
  autoSaveInterval: 5, // in minutes
  graphicsQuality: 'medium',
  useCompactUI: false,
  notificationsEnabled: true,
  toolbarPosition: 'top',
  keybindings: {
    // Default keybindings
    'save': 'Ctrl+S',
    'new': 'Ctrl+N',
    'open': 'Ctrl+O',
    'toggleFullscreen': 'F11',
    'speedNormal': '1',
    'speedFast': '2',
    'speedVeryFast': '3',
    'pause': 'Space',
    'zoomIn': 'NumpadAdd',
    'zoomOut': 'NumpadSubtract',
  }
};

// Try to load preferences from localStorage
let savedPreferences = defaultPreferences;
try {
  const storedPrefs = localStorage.getItem('userPreferences');
  if (storedPrefs) {
    savedPreferences = {
      ...defaultPreferences,
      ...JSON.parse(storedPrefs)
    };
  }
} catch (error) {
  console.error('Failed to load preferences from localStorage', error);
}

const initialState: SessionState = {
  user: null,
  isAuthenticated: false,
  preferences: savedPreferences,
  lastActivity: Date.now(),
  recentSaves: [],
  recentlyVisited: [],
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    /**
     * Set the user session data
     */
    setUser: (state, action: PayloadAction<SessionUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload && !action.payload.isGuest;
    },
    
    /**
     * Update the last activity timestamp
     */
    updateActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    /**
     * Update user preferences
     */
    setPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
      
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    },
    
    /**
     * Add a save file to recent saves
     */
    addRecentSave: (state, action: PayloadAction<string>) => {
      // Remove if already exists
      state.recentSaves = state.recentSaves.filter(path => path !== action.payload);
      
      // Add to beginning
      state.recentSaves.unshift(action.payload);
      
      // Keep only most recent few
      state.recentSaves = state.recentSaves.slice(0, 10);
    },
    
    /**
     * Add a location to recently visited
     */
    addRecentlyVisited: (state, action: PayloadAction<string>) => {
      // Remove if already exists
      state.recentlyVisited = state.recentlyVisited.filter(path => path !== action.payload);
      
      // Add to beginning
      state.recentlyVisited.unshift(action.payload);
      
      // Keep only most recent few
      state.recentlyVisited = state.recentlyVisited.slice(0, 10);
    },
    
    /**
     * Clear session data (logout)
     */
    clearSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.lastActivity = Date.now();
    },
  },
});

export const {
  setUser,
  updateActivity,
  setPreferences,
  addRecentSave,
  addRecentlyVisited,
  clearSession
} = sessionSlice.actions;

export default sessionSlice.reducer;
