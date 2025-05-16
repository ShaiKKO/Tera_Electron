/**
 * TerraFlux - Coordinate System and Rendering Test
 * 
 * This test demonstrates the integration between the coordinate system
 * and the rendering system, showing both Cartesian and Hex grid rendering.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { systemManager } = require('./src/game/core/ecs/SystemManager');
const { entityManager } = require('./src/game/core/ecs/EntityManager');
const { renderSystem } = require('./src/game/rendering/systems/RenderSystem');
const { Entity } = require('./src/game/core/ecs/Entity');
const { POSITION_COMPONENT_ID, PositionComponent } = require('./src/game/components/Position');
const { HEX_POSITION_COMPONENT_ID, HexPositionComponent } = require('./src/game/components/HexPosition');
const { Renderable } = require('./src/game/components/Renderable');
const { RenderLayerType } = require('./src/game/rendering/types');
const { CoordinateSystem } = require('./src/game/core/utils/CoordinateSystem');

// Configuration
const WINDOW_WIDTH = 1280;
const WINDOW_HEIGHT = 720;
const GRID_SIZE = 64;
const HEX_SIZE = 32;

// Application state
let mainWindow = null;

/**
 * Initialize the test window
 */
async function initializeTest() {
  // Create entities with different coordinate systems
  createTestEntities();
  
  // Set up the window
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    title: 'TerraFlux Coordinate System Test',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    show: false
  });
  
  // Load the test HTML
  await mainWindow.loadFile(path.join(__dirname, 'temp-game-test.html'));
  
  // Show window once ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Initialize systems
    systemManager.initialize().then(() => {
      console.log('Systems initialized');
      
      // Start game loop
      startGameLoop();
    });
  });
  
  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

/**
 * Create test entities with different coordinate systems
 */
function createTestEntities() {
  console.log('Creating test entities...');
  
  // Create a grid of entities with standard positions
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      const entity = new Entity();
      
      // Add position component
      const position = new PositionComponent(
        100 + x * GRID_SIZE,
        100 + y * GRID_SIZE
      );
      entity.addComponent(position);
      
      // Add renderable component
      const renderable = new Renderable({
        layer: RenderLayerType.ENTITIES,
        spriteUrl: 'square.png', // This would be loaded by TextureManager in a real app
        visible: true,
        crystallineIntensity: (x + y) % 5 === 0 ? 0.5 : 0, // Add some special effects
        energyGlowIntensity: (x + y) % 7 === 0 ? 0.7 : 0
      });
      entity.addComponent(renderable);
      
      // Register the entity
      entityManager.registerEntity(entity);
    }
  }
  
  // Create a hex grid of entities
  for (let q = -5; q <= 5; q++) {
    for (let r = -5; r <= 5; r++) {
      // Skip if we're outside a radius of 5
      if (Math.abs(q + r) > 5) continue;
      
      const entity = new Entity();
      
      // Add hex position component
      const hexPosition = new HexPositionComponent(q, r);
      entity.addComponent(hexPosition);
      
      // Add renderable component
      const renderable = new Renderable({
        layer: RenderLayerType.ENTITIES,
        spriteUrl: 'hex.png', // This would be loaded by TextureManager in a real app
        visible: true,
        hoverHeight: (q * r) % 3 === 0 ? 10 : 0, // Add some hover effects
        hoverSpeed: 0.5
      });
      entity.addComponent(renderable);
      
      // Register the entity
      entityManager.registerEntity(entity);
    }
  }
  
  console.log(`Created ${entityManager.getEntityCount()} entities`);
}

/**
 * Start the game loop
 */
function startGameLoop() {
  let lastTime = performance.now();
  
  // Game loop function
  function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update systems
    systemManager.update(deltaTime);
    
    // Request next frame
    requestAnimationFrame(gameLoop);
  }
  
  // Start the loop
  gameLoop();
}

// Start the application when Electron is ready
app.whenReady().then(() => {
  console.log('Starting TerraFlux coordinate system test...');
  
  // Initialize the system manager
  systemManager.registerSystem(renderSystem);
  
  // Initialize the test
  initializeTest();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app activation (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    initializeTest();
  }
});
