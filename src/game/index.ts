/**
 * TerraFlux - Game Entry Point
 * 
 * Main entry point for initializing the game within the Electron application.
 * This file serves as the bridge between the Electron IPC system and the game engine.
 */

import { gameExample } from './example/GameExample';
import { game, GameEventType } from './core/Game';

/**
 * Initialize game when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Game DOM ready, waiting for init event from Electron');
  
  // Create game container for rendering
  const container = document.createElement('div');
  container.id = 'game-container';
  container.style.width = '800px';
  container.style.height = '600px';
  container.style.margin = '20px auto';
  document.body.appendChild(container);

  // Listen for initialization events from the Electron main process
  window.electron.onGameInit((config: any) => {
    console.log('Received game init from Electron with config:', config);
    
    // Apply configuration
    if (config.debug !== undefined) game.debug = config.debug;
    if (config.targetFPS !== undefined) game.targetFPS = config.targetFPS;
    if (config.useFixedTimestep !== undefined) game.useFixedTimestep = config.useFixedTimestep;
    if (config.fixedTimestepValue !== undefined) game.fixedTimestepValue = config.fixedTimestepValue;
    if (config.timeScale !== undefined) game.timeScale = config.timeScale;
    
    // Initialize the game example
    initGame();
  });
  
  // If no init event received after a timeout, auto-initialize (for browser testing)
  setTimeout(() => {
    if (game.state === 'uninitialized') {
      console.log('No init from Electron received, auto-initializing game');
      initGame();
    }
  }, 1000);
});

/**
 * Initialize the game
 */
async function initGame() {
  try {
    // Register event listeners
    game.eventEmitter.subscribe(GameEventType.UPDATE, onGameUpdate);
    game.eventEmitter.subscribe(GameEventType.ERROR, onGameError);
    
    // Initialize the game example
    await gameExample.init();
    
    // Notify Electron that the game has initialized
    window.electron.sendGameState(game.state);
    
    console.log('Game initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    window.electron.sendGameError(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Handle game updates
 */
function onGameUpdate(game: any, deltaTime: number) {
  // Send game stats to Electron every second
  if (game.stats.totalFrames % 60 === 0) {
    // Add deltaTime to the stats
    const statsWithDelta = {
      ...game.stats,
      deltaTime
    };
    window.electron.sendGameStats(statsWithDelta);
  }
}

/**
 * Handle game errors
 */
function onGameError(game: any, error: Error) {
  console.error('Game error:', error);
  window.electron.sendGameError(error.message);
}

// Electron interface types are defined in src/app/types/electron.d.ts

// Export coordinate system components
import { CoordinateSystem } from './core/utils/CoordinateSystem';
import { CoordinateSystemVerification } from './core/utils/CoordinateSystemVerification';
import { HexPositionComponent } from './components/HexPosition';
import { HexPathfinding } from './core/pathfinding/HexPathfinding';

// Export the game for direct access
export { 
  game, 
  gameExample,
  // Coordinate system exports
  CoordinateSystem,
  CoordinateSystemVerification,
  HexPositionComponent,
  HexPathfinding
};

// Add to window.TeraFlux if it exists (for testing)
if (typeof window !== 'undefined') {
  // Create TeraFlux namespace if doesn't exist
  if (!window.TeraFlux) {
    window.TeraFlux = { Game: {} };
  } else if (!window.TeraFlux.Game) {
    window.TeraFlux.Game = {};
  }
  
  // Add coordinate system components to TeraFlux namespace
  if (window.TeraFlux && window.TeraFlux.Game) {
    window.TeraFlux.Game.CoordinateSystem = CoordinateSystem;
    window.TeraFlux.Game.CoordinateSystemVerification = CoordinateSystemVerification;
    window.TeraFlux.Game.HexPositionComponent = HexPositionComponent;
    window.TeraFlux.Game.HexPathfinding = HexPathfinding;
  }
}
