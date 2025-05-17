/**
 * TerraFlux - Animation & Visual Effects Test Renderer
 * 
 * This script demonstrates the animation and visual effects systems
 * by creating a test environment with multiple entities that have
 * animations and visual effects applied to them.
 */

/// <reference path="src/game/types/terraflux.d.ts" />
/// <reference path="src/game/types/animation-test.d.ts" />

import * as PIXI from 'pixi.js';
import { Entity } from './src/game/core/ecs/Entity';
import { PositionComponent } from './src/game/components/Position';
import { HexPositionComponent } from './src/game/components/HexPosition';
import { Renderable } from './src/game/components/Renderable';
import { Animated, AnimationDefinition } from './src/game/components/Animated';
import { VisualEffect, VisualEffectType, VisualEffectProperties } from './src/game/components/VisualEffect';
import { RenderSystem } from './src/game/rendering/systems/RenderSystem';
import { AnimationSystem } from './src/game/rendering/systems/AnimationSystem';
import { VisualEffectSystem } from './src/game/rendering/systems/VisualEffectSystem';
import { renderManager } from './src/game/rendering/RenderManager';
import { textureManager } from './src/game/rendering/TextureManager';
import { entityManager } from './src/game/core/ecs/EntityManager';
import { SystemManager } from './src/game/core/ecs/SystemManager';
import { HexGrid } from './src/game/rendering/tiles/HexGrid';
import { RenderLayerType } from './src/game/rendering/types';
import { CameraController } from './src/game/core/input/CameraController';
import { CoordinateSystem } from './src/game/core/utils/CoordinateSystem';

// Constants
const HEX_SIZE = 40;
const GRID_RADIUS = 5;
const CAMERA_SPEED = 10;
const CAMERA_MOMENTUM = 0.85;
const ANIMATION_FRAME_DURATION = 0.2; // 200ms per frame

// Game state
let app: PIXI.Application;
let gameEntities: Map<string, Entity> = new Map();
let systems: SystemManager;
let cameraController: CameraController;
let hexGrid: HexGrid;
let lastTimestamp = 0;
let effectCount = 0;

// Interface for texture configuration
interface TextureConfig {
  color: number;
  width: number;
  height: number;
  shape: 'circle' | 'rect' | 'triangle';
  alpha?: number;
  offsetX?: number;
  offsetY?: number;
}

// Texture configurations map
interface TextureConfigMap {
  [key: string]: TextureConfig;
}

// Placeholder textures for testing (would normally be loaded from assets)
const TEXTURE_CONFIGS: TextureConfigMap = {
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
const ANIMATION_CONFIGS: Record<string, AnimationDefinition> = {
  // Character animations
  idle: {
    name: 'idle',
    frames: [
      { texture: 'char_idle_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_idle_2', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  walk: {
    name: 'walk',
    frames: [
      { texture: 'char_walk_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_walk_4', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  attack: {
    name: 'attack',
    frames: [
      { texture: 'char_attack_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_attack_4', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: false
  },
  
  harvest: {
    name: 'harvest',
    frames: [
      { texture: 'char_harvest_1', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_2', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_3', duration: ANIMATION_FRAME_DURATION },
      { texture: 'char_harvest_1', duration: ANIMATION_FRAME_DURATION }
    ],
    loop: true
  },
  
  build: {
    name: 'build',
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
    name: 'construct',
    frames: [
      { texture: 'building_construct_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_3', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_construct_4', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: false
  },
  
  operate: {
    name: 'operate',
    frames: [
      { texture: 'building_operate_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_operate_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'building_operate_3', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: true
  },
  
  damaged: {
    name: 'damaged',
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
    name: 'default',
    frames: [
      { texture: 'resource_default', duration: ANIMATION_FRAME_DURATION * 4 }
    ],
    loop: true
  },
  
  depleting: {
    name: 'depleting',
    frames: [
      { texture: 'resource_depleting_1', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_2', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_3', duration: ANIMATION_FRAME_DURATION * 2 },
      { texture: 'resource_depleting_2', duration: ANIMATION_FRAME_DURATION * 2 }
    ],
    loop: true
  },
  
  depleted: {
    name: 'depleted',
    frames: [
      { texture: 'resource_depleted_1', duration: ANIMATION_FRAME_DURATION * 3 },
      { texture: 'resource_depleted_2', duration: ANIMATION_FRAME_DURATION * 3 },
      { texture: 'resource_depleted_3', duration: ANIMATION_FRAME_DURATION * 3 }
    ],
    loop: false
  }
};

// Effect definitions
const EFFECT_CONFIGS: Record<string, VisualEffectProperties> = {
  // Glow effects
  glow: {
    id: 'glow',
    type: VisualEffectType.GLOW,
    color: 0x00ff00,
    intensity: 0.8,
    blurRadius: 15,
    duration: 2.0
  },
  
  // Text effects (like damage numbers or status)
  'damage-text': {
    id: 'damage-text',
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
    id: 'tint',
    type: VisualEffectType.TINT,
    color: 0xff00ff,
    duration: 0.5,
    fadeOut: true
  },
  
  // Scale effects (pulsing, growing, shrinking)
  scale: {
    id: 'scale',
    type: VisualEffectType.SCALE,
    scale: 1.3,
    duration: 1.0,
    pulse: true,
    pulseFrequency: 2.0
  },
  
  // Particle effects
  particles: {
    id: 'particles',
    type: VisualEffectType.PARTICLES,
    texture: 'particle',
    count: 20,
    speed: 50,
    spread: 360,
    gravity: 0.5,
    duration: 2.0,
    // These are required by the ParticleEffect interface but not present in the original config
    rate: 10,
    lifetimeMin: 0.5,
    lifetimeMax: 1.5,
    speedMin: 30,
    speedMax: 70
  },
  
  // Distortion effects
  distortion: {
    id: 'distortion',
    type: VisualEffectType.DISTORTION,
    intensity: 0.5,
    animate: true,
    duration: 2.0
  },
  
  // Text floating above entities
  text: {
    id: 'text',
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
async function initialize(): Promise<void> {
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
    renderContainer.appendChild(app.view as HTMLCanvasElement);
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
async function generatePlaceholderTextures(): Promise<void> {
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
function initializeHexGrid(): void {
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
function initializeSystems(): void {
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
function initializeCamera(): void {
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
async function loadEntities(): Promise<void> {
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
function createEntity(config: EntityConfig): Entity {
  // Create the entity
  const entity = new Entity(config.id);
  
  // Add position components
  const worldPos = CoordinateSystem.hexToWorld(config.position.q, config.position.r, HEX_SIZE);
  entity.addComponent(new PositionComponent(worldPos.x, worldPos.y));
  entity.addComponent(new HexPositionComponent(config.position.q, config.position.r));
  
  // Add renderable component with default texture
  const renderable = new Renderable();
  renderable.layer = RenderLayerType.ENTITIES;
  
  // Different default textures based on entity type
  let defaultTexture = 'char_idle_1';
  if (config.id.startsWith('building')) {
    defaultTexture = 'building_default';
  } else if (config.id.startsWith('resource')) {
    defaultTexture = 'resource_default';
  }
  
  renderable.textureName = defaultTexture;
  entity.addComponent(renderable);
  
  // Add animated component with appropriate animations
  const animated = new Animated({
    animations: config.animations.map(name => ANIMATION_CONFIGS[name]).filter(Boolean),
    defaultAnimation: config.animations[0] || 'idle',
    autoplay: true
  });
  
  entity.addComponent(animated);
  
  // Register entity with entity manager
  entityManager.registerEntity(entity);
  
  // Store in our local map for easy access
  gameEntities.set(config.id, entity);
  
  return entity;
}

/**
 * Set up UI controls for interacting with entities
 */
function setupUIControls(): void {
  window.terraflux.log('Setting up UI controls');
  
  // Get container for entity controls
  const controlsContainer = document.getElementById('entity-controls-container');
  if (!controlsContainer) return;
  
  // Clear existing controls
  controlsContainer.innerHTML = '';
  
  // Create controls for each entity
  for (const [id, entity] of gameEntities.entries()) {
    // Get components
    const animated = entity.getComponent(Animated.TYPE_ID) as Animated;
    
    // Skip if entity doesn't have required components
    if (!animated) continue;
    
    // Create container for this entity's controls
    const entityControls = document.createElement('div');
    entityControls.className = 'entity-controls';
    
    // Add header with entity ID
    const header = document.createElement('div');
    header.className = 'entity-header';
    header.innerHTML = `<h3>${id}</h3>`;
    entityControls.appendChild(header);
    
    // Create animation selector
    const animationGroup = document.createElement('div');
    animationGroup.className = 'control-group';
    animationGroup.innerHTML = `<label for="${id}-animation">Animation:</label>`;
    
    const animationSelect = document.createElement('select');
    animationSelect.id = `${id}-animation`;
    
    // Add options for each animation
    const animations = animated.animationNames;
    for (const anim of animations) {
      const option = document.createElement('option');
      option.value = anim;
      option.textContent = anim;
      if (anim === animated.state.currentAnimation) {
        option.selected = true;
      }
      animationSelect.appendChild(option);
    }
    
    // Add event listener
    animationSelect.addEventListener('change', () => {
      const animSystem = systems.getSystem(AnimationSystem.ID) as AnimationSystem;
      if (animSystem) {
        animSystem.playAnimation(entity, animationSelect.value);
        window.terraflux.log(`Playing animation '${animationSelect.value}' on entity ${id}`);
      }
    });
    
    animationGroup.appendChild(animationSelect);
    entityControls.appendChild(animationGroup);
    
    // Get entity config to know which effects are available
    const entityConfig = Array.from(window.terraflux.getEntityConfigs())
      .find(config => config.id === id);
    
    if (entityConfig && entityConfig.effects.length > 0) {
      // Create effect buttons
      const effectGroup = document.createElement('div');
      effectGroup.className = 'control-group';
      effectGroup.innerHTML = '<label>Effects:</label>';
      
      // Create a button for each effect
      for (const effectName of entityConfig.effects) {
        if (EFFECT_CONFIGS[effectName]) {
          const button = document.createElement('button');
          button.className = 'effect-button';
          button.textContent = effectName;
          
          // Add event listener
          button.addEventListener('click', () => {
            applyEffect(entity, effectName);
          });
          
          effectGroup.appendChild(button);
        }
      }
      
      entityControls.appendChild(effectGroup);
    }
    
    // Add to container
    controlsContainer.appendChild(entityControls);
  }
  
  // Setup camera controls
  setupCameraControls();
  
  window.terraflux.log('UI controls initialized');
}

/**
 * Set up camera control UI
 */
function setupCameraControls(): void {
  // Reset camera button
  const resetButton = document.getElementById('reset-camera');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      cameraController.resetPosition();
      cameraController.resetZoom();
    });
  }
  
  // Toggle grid button
  const toggleGridButton = document.getElementById('toggle-grid');
  if (toggleGridButton) {
    toggleGridButton.addEventListener('click', () => {
      hexGrid.toggleGrid();
    });
  }
  
  // Zoom slider
  const zoomSlider = document.getElementById('zoom-slider') as HTMLInputElement;
  if (zoomSlider) {
    zoomSlider.addEventListener('input', () => {
      const zoom = parseFloat(zoomSlider.value);
      cameraController.setZoom(zoom);
    });
    
    // Update slider when camera zooms
    cameraController.onZoomChanged = (zoom) => {
      zoomSlider.value = zoom.toString();
    };
  }
}

/**
 * Apply an effect to an entity
 */
function applyEffect(entity: Entity, effectName: string): void {
  const effectConfig = EFFECT_CONFIGS[effectName];
  if (!effectConfig) return;
  
  // Get visual effect system
  const visualEffectSystem = systems.getSystem(VisualEffectSystem.ID) as VisualEffectSystem;
  if (!visualEffectSystem) return;
  
  // Create a unique ID for this effect instance
  const effectId = `${effectName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Clone the effect config and add the ID
  const effectInstance = {
    ...effectConfig,
    id: effectId
  };
  
  // Apply the effect
  visualEffectSystem.addEffect(entity, effectInstance);
  
  // Log
  window.terraflux.log(`Applied effect '${effectName}' to entity ${entity.id}`);
  
  // Update effect count
  effectCount++;
  updateEffectCount();
}

/**
 * Update the entity count display
 */
function updateEntityCount(): void {
  const countElement = document.getElementById('entity-count');
  if (countElement) {
    countElement.textContent = `Entities: ${gameEntities.size}`;
  }
}

/**
 * Update the effect count display
 */
function updateEffectCount(): void {
  const countElement = document.getElementById('effect-count');
  if (countElement) {
    countElement.textContent = `Effects: ${effectCount}`;
  }
}

/**
 * Update FPS display
 */
function updateFPS(fps: number): void {
  const fpsElement = document.getElementById('fps');
  if (fpsElement) {
    fpsElement.textContent = `FPS: ${fps.toFixed(1)}`;
  }
}

/**
 * Main game loop
 */
function gameLoop(deltaTime: number): void {
  // Current timestamp
  const timestamp = performance.now();
  
  // Calculate FPS (only update twice per second to avoid flicker)
  if (timestamp - lastTimestamp > 500) {
    const fps = app.ticker.FPS;
    updateFPS(fps);
    lastTimestamp = timestamp;
  }
  
  // Convert PIXI delta time to seconds
  const deltaSeconds = deltaTime / 60;
  
  // Update camera
  cameraController.update(deltaSeconds);
  
  // Update game systems
  systems.update(deltaSeconds);
}

/**
 * Handle window resize
 */
function handleResize(): void {
  // Update canvas size
  if (app) {
    app.renderer.resize(window.innerWidth - 340, window.innerHeight - 100);
  }
}

// Listen for window resize
window.addEventListener('resize', handleResize);

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
