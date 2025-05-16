import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type GameSpeed = 'paused' | 'normal' | 'fast' | 'ultra';
export type SaveStatus = 'unsaved' | 'saving' | 'saved' | 'error';

export interface Colony {
  id: string;
  name: string;
  foundedDate: number;
  population: number;
}

export interface GameMap {
  id: string;
  name: string;
  seed: number;
  size: { width: number; height: number };
  biome: string;
}

export interface GameState {
  // Core game state
  isGameActive: boolean;
  gameId: string | null;
  gameSpeed: GameSpeed;
  tick: number;
  isPaused: boolean;
  
  // Game world related
  map: GameMap | null;
  selectedColony: string | null;
  colonies: Record<string, Colony>;
  
  // Save/Load state
  currentSavePath: string | null;
  saveStatus: SaveStatus;
  lastSaveTime: number | null;
  
  // Selector state
  selectedEntity: string | null;
  selectedTile: { x: number; y: number } | null;
  highlightedEntities: string[];
}

const initialState: GameState = {
  isGameActive: false,
  gameId: null,
  gameSpeed: 'normal',
  tick: 0,
  isPaused: true,
  
  map: null,
  selectedColony: null,
  colonies: {},
  
  currentSavePath: null,
  saveStatus: 'unsaved',
  lastSaveTime: null,
  
  selectedEntity: null,
  selectedTile: null,
  highlightedEntities: [],
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    /**
     * Set if a game is currently active
     */
    setGameActive: (state, action: PayloadAction<boolean>) => {
      state.isGameActive = action.payload;
      if (!action.payload) {
        // Reset certain properties when game isn't active
        state.selectedEntity = null;
        state.selectedTile = null;
        state.highlightedEntities = [];
      }
    },
    
    /**
     * Set current game ID
     */
    setGameId: (state, action: PayloadAction<string | null>) => {
      state.gameId = action.payload;
    },
    
    /**
     * Set the game speed
     */
    setGameSpeed: (state, action: PayloadAction<GameSpeed>) => {
      state.gameSpeed = action.payload;
      state.isPaused = action.payload === 'paused';
    },
    
    /**
     * Update the game tick
     */
    incrementTick: (state) => {
      state.tick += 1;
    },
    
    /**
     * Set game map
     */
    setMap: (state, action: PayloadAction<GameMap | null>) => {
      state.map = action.payload;
    },
    
    /**
     * Set the selected colony ID
     */
    selectColony: (state, action: PayloadAction<string | null>) => {
      state.selectedColony = action.payload;
    },
    
    /**
     * Add or update a colony
     */
    updateColony: (state, action: PayloadAction<Colony>) => {
      state.colonies[action.payload.id] = action.payload;
    },
    
    /**
     * Remove a colony
     */
    removeColony: (state, action: PayloadAction<string>) => {
      delete state.colonies[action.payload];
      if (state.selectedColony === action.payload) {
        state.selectedColony = null;
      }
    },
    
    /**
     * Set the current save file path
     */
    setSavePath: (state, action: PayloadAction<string | null>) => {
      state.currentSavePath = action.payload;
    },
    
    /**
     * Update save status
     */
    setSaveStatus: (state, action: PayloadAction<SaveStatus>) => {
      state.saveStatus = action.payload;
      if (action.payload === 'saved') {
        state.lastSaveTime = Date.now();
      }
    },
    
    /**
     * Select an entity
     */
    selectEntity: (state, action: PayloadAction<string | null>) => {
      state.selectedEntity = action.payload;
      // Deselect tile when selecting entity
      if (action.payload) {
        state.selectedTile = null;
      }
    },
    
    /**
     * Select a tile by coordinates
     */
    selectTile: (state, action: PayloadAction<{ x: number; y: number } | null>) => {
      state.selectedTile = action.payload;
      // Deselect entity when selecting tile
      if (action.payload) {
        state.selectedEntity = null;
      }
    },
    
    /**
     * Highlight one or more entities
     */
    highlightEntities: (state, action: PayloadAction<string[]>) => {
      state.highlightedEntities = action.payload;
    },
    
    /**
     * Reset all game state (new game)
     */
    resetGameState: () => initialState,
  },
});

export const {
  setGameActive,
  setGameId,
  setGameSpeed,
  incrementTick,
  setMap,
  selectColony,
  updateColony,
  removeColony,
  setSavePath,
  setSaveStatus,
  selectEntity,
  selectTile,
  highlightEntities,
  resetGameState
} = gameSlice.actions;

export default gameSlice.reducer;
