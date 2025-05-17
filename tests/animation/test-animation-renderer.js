/**
 * TerraFlux - Animation & Visual Effects Test Renderer
 * 
 * This script demonstrates the animation and visual effects systems
 * by creating a test environment with multiple entities that have
 * animations and visual effects applied to them.
 */

import * as PIXI from 'pixi.js';

// Constants
const HEX_SIZE = 40;
const GRID_RADIUS = 5;
const CAMERA_SPEED = 10;
const CAMERA_MOMENTUM = 0.85;
const ANIMATION_FRAME_DURATION = 0.2; // 200ms per frame

// Visual effect types (matching the ones in src/game/components/VisualEffect.ts)
const VisualEffectType = {
  GLOW: 'glow',
  TEXT: 'text',
  TINT: 'tint',
  SCALE: 'scale',
  PARTICLES: 'particles',
  DISTORTION: 'distortion'
};

// Render layer types (matching the ones in src/game/rendering/types.ts)
const RenderLayerType = {
  BACKGROUND: 'background',
  TILES: 'tiles',
  ENTITIES: 'entities',
  EFFECTS: 'effects',
  UI: 'ui'
};

// Game state
let app;
let gameEntities = new Map();
let systems;
let cameraController;
let hexGrid;
let lastTimestamp = 0;
let effectCount = 0;

// Game managers and classes (we'll create mock versions for the test)
const entityManager = {
  registerEntity: (entity) => {
    console.log(`Registered entity: ${entity.id}`);
    return entity;
  }
};

const renderManager = {
  initialize: (pixiApp) => {
    console.log('Render manager initialized');
    app = pixiApp;
  },
  createLayer: (layerType) => {
    console.log(`Created layer: ${layerType}`);
    return new PIXI.Container();
  },
  getContainer: () => app.stage
};

const textureManager = {
  registerTexture: (name, texture) => {
    console.log(`Registered texture: ${name}`);
  }
};

// Mock classes
class Entity {
  constructor(id) {
    this.id = id;
    this.components = new Map();
  }
  
  addComponent(component) {
    this.components.set(component.constructor.TYPE_ID || component.constructor.name, component);
    return component;
  }
  
  getComponent(typeId) {
    return this.components.get(typeId);
  }
}

class Position {
  static TYPE_ID = 'Position';
  
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class HexPosition {
  static TYPE_ID = 'HexPosition';
  
  constructor(q, r) {
    this.q = q;
    this.r = r;
  }
}

class Renderable {
  static TYPE_ID = 'Renderable';
  
  constructor() {
    this.textureName = '';
    this.layer = RenderLayerType.ENTITIES;
    this.visible = true;
    this.scale = { x: 1, y: 1 };
    this.rotation = 0;
    this.tint = 0xffffff;
    this.alpha = 1.0;
    this.zIndex = 0;
  }
}

class Animated {
  static TYPE_ID = 'Animated';
  
  constructor() {
    this.animations = new Map();
    this.currentAnimation = '';
    this.playing = false;
    this.loop = true;
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }
  
  addAnimation(name, config) {
    this.animations.set(name, config);
  }
  
  setCurrentAnimation(name) {
    if (this.animations.has(name)) {
      this.currentAnimation = name;
      this.currentFrame = 0;
      this.elapsedTime = 0;
    }
  }
  
  getAnimationNames() {
    return Array.from(this.animations.keys());
  }
  
  getCurrentAnimation() {
    return this.currentAnimation;
  }
}

class VisualEffect {
  static TYPE_ID = 'VisualEffect';
  
  constructor() {
    this.effects = [];
  }
}

class SystemManager {
  constructor() {
    this.systems = new Map();
  }
  
  addSystem(system) {
    this.systems.set(system.constructor.ID || system.constructor.name, system);
  }
  
  getSystem(id) {
    return this.systems.get(id);
  }
  
  update(deltaTime) {
    // Update systems in the correct order
    for (const system of this.systems.values()) {
      if (system.update) {
        system.update(deltaTime);
      }
    }
  }
}

class RenderSystem {
  static ID = 'RenderSystem';
  
  initialize() {
    console.log('RenderSystem initialized');
  }
  
  update(deltaTime) {
    // Update rendering for all entities with renderable components
  }
}

class AnimationSystem {
  static ID = 'AnimationSystem';
  
  initialize() {
    console.log('AnimationSystem initialized');
  }
  
  update(deltaTime) {
    // Update animations for all entities with animated components
  }
  
  playAnimation(entity, animationName, reset = true) {
    const animated = entity.getComponent(Animated.TYPE_ID);
    if (animated && animated.animations.has(animationName)) {
      animated.setCurrentAnimation(animationName);
      animated.playing = true;
      if (reset) {
        animated.currentFrame = 0;
        animated.elapsedTime = 0;
      }
      return true;
    }
    return false;
  }
}

class VisualEffectSystem {
  static ID = 'VisualEffectSystem';
  
  initialize() {
    console.log('VisualEffectSystem initialized');
    this.activeEffects = new Map();
  }
  
  update(deltaTime) {
    // Update and render all active visual effects
  }
  
  addEffect(entity, effectConfig) {
    const effectId = effectConfig.id || `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store effect data
    if (!this.activeEffects.has(entity.id)) {
      this.activeEffects.set(entity.id, new Map());
    }
    
    this.activeEffects.get(entity.id).set(effectId, {
      config: effectConfig,
      startTime: Date.now(),
      entity: entity
    });
    
    // If effect has a duration, schedule removal
    if (effectConfig.duration) {
      setTimeout(() => {
        this.removeEffect(entity, effectId);
      }, effectConfig.duration * 1000);
    }
    
    return effectId;
  }
  
  removeEffect(entity, effectId) {
    if (this.activeEffects.has(entity.id)) {
      this.activeEffects.get(entity.id).delete(effectId);
      
      // Clean up empty maps
      if (this.activeEffects.get(entity.id).size === 0) {
        this.activeEffects.delete(entity.id);
      }
    }
  }
}

class HexGrid {
  constructor(config) {
    this.config = config;
    this.tiles = new Map();
    this.container = new PIXI.Container();
    this.gridVisible = true;
  }
  
  generate() {
    console.log(`Generating hex grid with radius ${this.config.radius}`);
    
    // In a real implementation, this would create the hex grid tiles
    // For now, we'll just create a placeholder
    const graphics = new PIXI.Graphics();
    graphics.lineStyle(1, this.config.gridColor || 0x888888, this.config.gridAlpha || 0.5);
    
    // Draw a circle to represent the grid
    graphics.drawCircle(0, 0, this.config.radius * this.config.hexSize);
    
    this.container.addChild(graphics);
    renderManager.getContainer().addChild(this.container);
  }
  
  toggleGrid() {
    this.gridVisible = !this.gridVisible;
    this.container.visible = this.gridVisible;
  }
}

class CameraController {
  constructor(config) {
    this.config = config;
    this.container = config.container;
    this.position = { x: 0, y: 0 };
    this.targetPosition = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.zoom = 1;
    this.targetZoom = 1;
    this.enabled = false;
    this.onZoomChanged = null;
  }
  
  enable() {
    this.enabled = true;
    
    // Center the stage
    this.container.x = window.innerWidth / 2;
    this.container.y = window.innerHeight / 2;
  }
  
  update(deltaTime) {
    if (!this.enabled) return;
    
    // Update position with momentum
    this.velocity.x = (this.targetPosition.x - this.position.x) * this.config.moveSpeed * deltaTime;
    this.velocity.y = (this.targetPosition.y - this.position.y) * this.config.moveSpeed * deltaTime;
    
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    
    // Update zoom
    this.zoom += (this.targetZoom - this.zoom) * this.config.zoomSpeed * 10 * deltaTime;
    
    // Apply to container
    this.container.x = window.innerWidth / 2 - this.position.x * this.zoom;
    this.container.y = window.innerHeight / 2 - this.position.y * this.zoom;
    this.container.scale.set(this.zoom);
  }
  
  setZoom(zoom) {
    this.targetZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, zoom));
    
    if (this.onZoomChanged) {
      this.onZoomChanged(this.targetZoom);
    }
  }
  
  resetPosition() {
    this.targetPosition = { x: 0, y: 0 };
  }
  
  resetZoom() {
    this.setZoom(1);
  }
  
  handleResize() {
    // Adjust for new window size
    this.container.x = window.innerWidth / 2 - this.position.x * this.zoom;
    this.container.y = window.innerHeight / 2 - this.position.y * this.zoom;
  }
}

// Mocked CoordinateSystem utility
const CoordinateSystem = {
  hexToWorld: (q, r, hexSize) => {
    // Convert hex coordinates to world coordinates
    // This is a simplified version of the actual conversion
    const x = hexSize * (3/2 * q);
    const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  }
};

// Placeholder textures for testing (would normally be loaded from assets)
const TEXTURE_CONFIGS = {
  // Character animations
  'char_idle_1': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle' },
  'char_idle_2': { color: 0x3a7ca8, width: 32, height: 32, shape: 'circle' },
  'char_idle_3': { color: 0x3a7ca8, width: 28, height: 28, shape: 'circle' },
  
  'char_walk_1': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle', offsetY: -2 },
  'char_walk_2': { color: 0x3a7ca8, width: 30, height: 28, shape: 'circle', offsetY: 0 },
  'char_walk_3': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle', offsetY: 2 },
  'char_walk_4': { color: 0x3a7ca8, width: 30, height: 28, shape: 'circle', offsetY: 0 },
  
  'char_attack_1': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle' },
  'char_attack_2': { color: 0xff3838, width: 36, height: 36, shape: 'circle' },
  'char_attack_3': { color: 0xff3838, width: 40, height: 40, shape: 'circle' },
  'char_attack_4': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle' },
  
  'char_harvest_1': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle' },
  'char_harvest_2': { color: 0x3a7ca8, width: 30, height: 34, shape: 'circle', offsetY: 2 },
  'char_harvest_3': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle', offsetY: -2 },
  
  'char_build_1': { color: 0x3a7ca8, width: 30, height: 30, shape: 'circle' },
  'char_build_2': { color: 0x3a7ca8, width: 32, height: 30, shape: 'circle', offsetX: 2 },
  'char_build_3': { color: 0x3a7ca8, width: 32, height: 30, shape: 'circle', offsetX: -2 },
  
  // Building animations
  'building_default': { color: 0xa85e3a, width: 40, height: 40, shape: 'rect' },
  'building_construct_1': { color: 0xa85e3a, width: 40, height: 10, shape: 'rect' },
  'building_construct_2': { color: 0xa85e3a, width: 40, height: 20, shape: 'rect' },
  'building_construct_3': { color: 0xa85e3a, width: 40, height: 30, shape: 'rect' },
  'building_construct_4': { color: 0xa85e3a, width: 40, height: 40, shape: 'rect' },
  
  'building_operate_1': { color: 0xa85e3a, width: 40, height: 40, shape: 'rect' },
  'building_operate_2': { color: 0xa85e3a, width: 42, height: 42, shape: 'rect' },
  'building_operate_3': { color: 0xa85e3a, width: 40, height: 40, shape: 'rect' },
  
  'building_damaged_1': { color: 0xa85e3a, width: 40, height: 40, shape: 'rect' },
  'building_damaged_2': { color: 0x783e1a, width: 40, height: 38, shape: 'rect' },
  'building_damaged_3': { color: 0x783e1a, width: 38, height: 38, shape: 'rect' },
  
  // Resource animations
  'resource_default': { color: 0xf0c040, width: 25, height: 25, shape: 'triangle' },
  
  'resource_depleting_1': { color: 0xf0c040, width: 25, height: 25, shape: 'triangle' },
  'resource_depleting_2': { color: 0xd0a020, width: 22, height: 22, shape: 'triangle' },
  'resource_depleting_3': { color: 0xd0a020, width: 20, height: 20, shape: 'triangle' },
  
  'resource_depleted_1': { color: 0xb08000, width: 18, height: 18, shape: 'triangle' },
  'resource_depleted_2': { color: 0xb08000, width: 15, height: 15, shape: 'triangle' },
  'resource_depleted_3': { color: 0xb08000, width: 12, height: 12, shape: 'triangle' },
  
  // Particle textures
  'particle': { color: 0xffffff, width: 5, height: 5, shape: 'circle' },
  'glow': { color: 0xffffff, width: 20, height: 20, shape: 'circle', alpha: 0.5 },
  'smoke': { color: 0xaaaaaa, width: 10, height: 10, shape: 'circle', alpha: 0.6 },
};

// Animation definitions (would normally be loaded from configuration)
const ANIMATION_CONFIGS = {
  // Character animations
  idle: {
    frames: [
      { texture: 'char_idle_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_2', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  walk: {
    frames: [
      { texture: 'char_walk_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_4', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  attack: {
    frames: [
      { texture: 'char_attack_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_4', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: false
  },
  
  harvest: {
    frames: [
      { texture: 'char_harvest_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_1', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  build: {
    frames: [
      { texture: 'char_build_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_build_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_build_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_build_1', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  // Building animations
  construct: {
    frames: [
      { texture: 'building_construct_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_3', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_4', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: false
  },
  
  operate: {
    frames: [
      { texture: 'building_operate_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_operate_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_operate_3', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: true
  },
  
  damaged: {
    frames: [
      { texture: 'building_damaged_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'building_damaged_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'building_damaged_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'building_damaged_2', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  // Resource animations
  default: {
    frames: [
      { texture: 'resource_default', duration: ANIMATION_FRAME_DURATION * 4 }
    ],
    loop: true
  },
  
  depleting: {
    frames: [
      { texture: 'resource_depleting_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_3', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_2', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: true
  },
  
  depleted: {
    frames: [
      { texture: 'resource_depleted_1', duration: ANIMATION_FRAME_DURATION * 3 },
      { texture: 'resource_depleted_2', duration: ANIMATION_FRAME_DURATION * 3 },
      { texture: 'resource_depleted_3', duration: ANIMATION_FRAME_DURATION * 3 }
    ],
    loop: false
  }
};

// Effect definitions
const EFFECT_CONFIGS = {
  // Glow effects
  glow: {
    type: VisualEffectType.GLOW,
    color: 0x00ff00,
    intensity: 0.8,
    blurRadius: 15,
    duration: 2.0
  },
  
  // Text effects (like damage numbers or status)
  'damage-text': {
    type: VisualEffectType.TEXT,
    text: '150',
    color: 0xff0000,
    fontSize: 20,
    fontFamily: 'Arial',
    offsetY: -30,
    float: true,
    floatSpeed: 40,
    fadeOut: true,
    duration: 1.5
  },
  
  // Tint effects
  tint: {
    type: VisualEffectType.TINT,
    color: 0xff00ff,
    duration: 0.5,
    fadeOut: true
  },
  
  // Scale effects (pulsing, growing, shrinking)
  scale: {
    type: VisualEffectType.SCALE,
    scale: 1.3,
    duration: 1.0,
    pulse: true,
    pulseFrequency: 2.0
  },
  
  // Particle effects
  particles: {
    type: VisualEffectType.PARTICLES,
    texture: 'particle',
    count: 20,
    speed: 50,
    spread: 360,
    gravity: 0.5,
    duration: 2.0
  },
  
  // Distortion effects
  distortion: {
    type: VisualEffectType.DISTORTION,
    intensity: 0.5,
    animate: true,
    duration: 2.0
  },
  
  // Text floating above entities
  text: {
    type: VisualEffectType.TEXT,
    text: 'Resource',
    color: 0xffffff,
    fontSize: 12,
    fontFamily: 'Arial',
    offsetY: -25,
    duration: 3.0
  }
};

/**
 * Initialize the application
 */
async function initialize() {
  // Log initialization
  window.terraflux.log('Initializing Animation & Visual Effects Test');
  
  // Create the PIXI application
  app = new PIXI.Application({
    width: window.innerWidth - 340, // Account for control panel
    height: window.innerHeight - 100, // Account for header/footer
    backgroundColor: 0x2f2f2f,
    antialias: true,
    resolution: window.devicePixelRatio || 1
  });

  // Add the PIXI canvas to the page
  const renderContainer = document.getElementById('render-canvas');
  if (renderContainer) {
    renderContainer.appendChild(app.view);
  }
  
  // Initialize render manager with the PIXI app
  renderManager.initialize(app);
  
  // Create layers
  renderManager.createLayer(RenderLayerType.BACKGROUND);
  renderManager.createLayer(RenderLayerType.TILES);
  renderManager.createLayer(RenderLayerType.ENTITIES);
  renderManager.createLayer(RenderLayerType.EFFECTS);
  renderManager.createLayer(RenderLayerType.UI);
  
  // Generate placeholder textures
  await generatePlaceholderTextures();
  
  // Initialize hex grid
  initializeHexGrid();
  
  // Create ECS systems
  initializeSystems();
  
  // Initialize camera controller
  initializeCamera();
  
  // Load and create entities from configuration
  await loadEntities();
  
  // Set up UI controls
  setupUIControls();
  
  // Start the game loop
  app.ticker.add(gameLoop);
  
  // Hide loading overlay
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
  
  // Log completion
  window.terraflux.log('Initialization complete');
}

/**
 * Generate placeholder textures for testing
 */
async function generatePlaceholderTextures() {
  window.terraflux.log('Generating placeholder textures');
  
  // Generate textures based on config
  for (const [name, config] of Object.entries(TEXTURE_CONFIGS)) {
    const graphic = new PIXI.Graphics();
    graphic.beginFill(config.color, config.alpha || 1.0);
    
    // Draw shape based on config
    switch (config.shape) {
      case 'circle':
        graphic.drawCircle(0, 0, config.width / 2);
        break;
      case 'rect':
        graphic.drawRect(
          -config.width / 2, 
          -config.height / 2, 
          config.width, 
          config.height
        );
        break;
      case 'triangle':
        graphic.drawPolygon([
          -config.width / 2, config.height / 2,
          config.width / 2, config.height / 2,
          0, -config.height / 2
        ]);
        break;
    }
    
    graphic.endFill();
    
    // Generate texture from graphics
    const texture = app.renderer.generateTexture(graphic);
    
    // Register the texture with TextureManager
    textureManager.registerTexture(name, texture);
  }
  
  window.terraflux.log('Textures generated successfully');
}

/**
 * Initialize hex grid
 */
function initializeHexGrid() {
  window.terraflux.log('Initializing hex grid');
  
  // Create hex grid
  hexGrid = new HexGrid({
    radius: GRID_RADIUS,
    hexSize: HEX_SIZE,
    drawCoordinates: true,
    drawGrid: true,
    gridColor: 0x444444,
    gridAlpha: 0.5,
    layer: RenderLayerType.TILES
  });
  
  // Generate the grid
  hexGrid.generate();
  
  window.terraflux.log('Hex grid initialized with radius', GRID_RADIUS);
}

/**
 * Initialize game systems
 */
function initializeSystems() {
  window.terraflux.log('Initializing game systems');
  
  // Create system manager
  systems = new SystemManager();
  
  // Create and register systems
  const renderSystem = new RenderSystem();
  const animationSystem = new AnimationSystem();
  const visualEffectSystem = new VisualEffectSystem();
  
  // Initialize systems
  renderSystem.initialize();
  animationSystem.initialize();
  visualEffectSystem.initialize();
  
  // Add systems to manager
  systems.addSystem(renderSystem);
  systems.addSystem(animationSystem);
  systems.addSystem(visualEffectSystem);
  
  window.terraflux.log('Game systems initialized');
}

/**
 * Initialize camera controller
 */
function initializeCamera() {
  window.terraflux.log('Initializing camera controller');
  
  // Get the container to attach camera controller
  const container = renderManager.getContainer();
  
  if (!container) {
    window.terraflux.log('Error: Failed to get render container for camera');
    return;
  }
  
  // Create camera controller
  cameraController = new CameraController({
    container,
    moveSpeed: CAMERA_SPEED,
    zoomSpeed: 0.1,
    momentum: CAMERA_MOMENTUM,
    minZoom: 0.5,
    maxZoom: 2.0
  });
  
  // Enable the controller
  cameraController.enable();
  
  window.terraflux.log('Camera controller initialized');
}

/**
 * Load entities from configuration
 */
async function loadEntities() {
  // Get entity configurations from main process
  const entityConfigs = await window.terraflux.getEntityConfigs();
  window.terraflux.log('Loading entities:', entityConfigs);
  
  // Create entities based on config
  for (const config of entityConfigs) {
    createEntity(config);
  }
  
  // Update entity count display
  updateEntityCount();
  
  window.terraflux.log('Entities loaded successfully');
}

/**
 * Create an entity based on configuration
 */
function createEntity(config) {
  // Create the entity
  const entity = new Entity(config.id);
  
  // Add position components
  const worldPos = CoordinateSystem.hexToWorld(config.position.q, config.position.r, HEX_SIZE);
  entity.addComponent(new Position(worldPos.x, worldPos.y));
  entity.addComponent(new HexPosition(config.position.q, config.position.r));
  
  // Add renderable component with default texture
  const renderable =
