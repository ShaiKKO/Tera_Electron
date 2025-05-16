/**
 * TerraFlux - Render Manager
 * 
 * Central manager for the PixiJS rendering system.
 * Handles application setup, layer management, and rendering pipeline.
 */

import * as PIXI from 'pixi.js';
import { eventEmitter } from '../core/ecs/EventEmitter';
import { 
  RenderOptions, 
  RenderLayerType, 
  RenderLayerConfig,
  RenderStats,
  RenderEventType,
  LayerChild 
} from './types';
import { LayerManager } from './LayerManager';

// Default rendering options
const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a2e,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  powerPreference: 'high-performance'
};

/**
 * Core rendering manager class
 */
export class RenderManager {
  /**
   * PixiJS application instance
   */
  private _app: PIXI.Application;

  /**
   * Layer manager for organizing display objects
   */
  private _layerManager: LayerManager;

  /**
   * DOM container element where canvas is attached
   */
  private _container: HTMLElement | null = null;

  /**
   * Performance stats for rendering
   */
  private _stats: RenderStats = {
    fps: 0,
    renderTime: 0,
    drawCalls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    sprites: 0,
    particleCount: 0,
    visibleObjects: 0,
    totalObjects: 0,
    textureMemory: 0,
    geometryMemory: 0
  };

  /**
   * Last frame timestamp for calculating fps
   */
  private _lastFrameTime: number = 0;

  /**
   * Whether the renderer has been initialized
   */
  private _initialized: boolean = false;

  /**
   * Whether the renderer is currently rendering
   */
  private _isRendering: boolean = false;

  /**
   * Frame count for statistics
   */
  private _frameCount: number = 0;

  /**
   * Whether to record performance stats
   */
  private _recordStats: boolean = false;

  /**
   * Tracks if context loss has occurred
   */
  private _contextLost: boolean = false;

  /**
   * Camera parameters
   */
  private _camera = {
    x: 0,
    y: 0,
    zoom: 1,
    rotation: 0
  };

  /**
   * Constructor for RenderManager
   * 
   * @param options Configuration options for the renderer
   */
  constructor(options: Partial<RenderOptions> = {}) {
    // Merge default options with provided options
    const renderOptions = { ...DEFAULT_RENDER_OPTIONS, ...options };

    // Create PixiJS application
    this._app = new PIXI.Application({
      width: renderOptions.width,
      height: renderOptions.height,
      backgroundColor: renderOptions.backgroundColor,
      antialias: renderOptions.antialias,
      resolution: renderOptions.resolution,
      autoDensity: renderOptions.autoDensity,
      clearBeforeRender: renderOptions.clearBeforeRender ?? true,
      preserveDrawingBuffer: renderOptions.preserveDrawingBuffer ?? false,
      powerPreference: renderOptions.powerPreference
    });

    // Create layer manager
    this._layerManager = new LayerManager(this._app.stage);

    // Setup the default layers
    this._setupDefaultLayers();

    // Create resize observer for responsive rendering
    if (typeof ResizeObserver !== 'undefined') {
      this._setupResizeObserver();
    }

    // Setup WebGL context event handlers
    this._setupContextEventHandlers();
  }

  /**
   * Initialize the renderer and attach to DOM
   * 
   * @param container DOM element to attach the canvas to
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(container: HTMLElement): Promise<void> {
    if (this._initialized) {
      console.warn('RenderManager already initialized');
      return;
    }

    // Store container reference
    this._container = container;

    // Append canvas to container
    container.appendChild(this._app.view as HTMLCanvasElement);

    // Handle container resizing - set initial size
    this._handleResize();

    // Mark as initialized
    this._initialized = true;

    // Start rendering if not already
    if (!this._isRendering) {
      this._startRendering();
    }

    // Emit initialized event
    eventEmitter.emit(RenderEventType.INITIALIZED, this);
  }

  /**
   * Setup WebGL context event handlers
   */
  private _setupContextEventHandlers(): void {
    const canvas = this._app.view as HTMLCanvasElement;

    // WebGL context lost handler
    canvas.addEventListener('webglcontextlost', (event) => {
      // Prevent default to allow automatic context restoration
      event.preventDefault();
      this._contextLost = true;
      
      // Stop rendering to avoid errors
      this.stopRendering();
      
      // Emit error event
      eventEmitter.emit(RenderEventType.RENDER_ERROR, this, new Error('WebGL context lost'));
      
      console.warn('WebGL context lost. Waiting for restoration...');
    });

    // WebGL context restored handler
    canvas.addEventListener('webglcontextrestored', () => {
      this._contextLost = false;
      
      // Reinitialize renderer
      this._handleContextRestoration();
      
      // Restart rendering
      this._startRendering();
      
      console.log('WebGL context restored');
    });
  }

  /**
   * Handle WebGL context restoration
   */
  private _handleContextRestoration(): void {
    // Recreate all textures and display objects
    // This would normally need to re-upload all textures to GPU,
    // but PIXI should handle most of this automatically.

    // Notify the layer manager to refresh its contents
    this._layerManager.getLayers().forEach((layer: PIXI.Container) => {
      // Force update all layers
      layer.visible = layer.visible;
    });

    // Emit event so systems can respond
    eventEmitter.emit(RenderEventType.RENDER_ERROR, this, new Error('Context restored, textures reloaded'));
  }

  /**
   * Setup default render layers
   */
  private _setupDefaultLayers(): void {
    // Define the default layers with their z-index
    const defaultLayers: RenderLayerConfig[] = [
      { name: RenderLayerType.BACKGROUND, zIndex: 10, visible: true },
      { name: RenderLayerType.TERRAIN, zIndex: 20, visible: true, sortable: true },
      { name: RenderLayerType.TERRAIN_DECORATION, zIndex: 30, visible: true },
      { name: RenderLayerType.GRID, zIndex: 40, visible: true },
      { name: RenderLayerType.SELECTION, zIndex: 50, visible: true },
      { name: RenderLayerType.ENTITIES_BELOW, zIndex: 60, visible: true, sortable: true },
      { name: RenderLayerType.ENTITIES, zIndex: 70, visible: true, sortable: true },
      { name: RenderLayerType.ENTITIES_ABOVE, zIndex: 80, visible: true, sortable: true },
      { name: RenderLayerType.EFFECTS, zIndex: 90, visible: true },
      { name: RenderLayerType.UI_BACKGROUND, zIndex: 100, visible: true },
      { name: RenderLayerType.UI, zIndex: 110, visible: true },
      { name: RenderLayerType.UI_FOREGROUND, zIndex: 120, visible: true },
      { name: RenderLayerType.DEBUG, zIndex: 1000, visible: false }
    ];

    // Add each layer to the layer manager
    defaultLayers.forEach(layer => {
      this._layerManager.createLayer(layer);
    });
  }

  /**
   * Setup resize observer for responsive rendering
   */
  private _setupResizeObserver(): void {
    // Create resize observer
    const resizeObserver = new ResizeObserver(entries => {
      // We only care about the first entry (our container)
      if (entries.length > 0) {
        this._handleResize();
      }
    });

    // Start observing once container is set
    const startObserving = () => {
      if (this._container) {
        resizeObserver.observe(this._container);
      } else {
        // If container not yet set, try again in next frame
        requestAnimationFrame(startObserving);
      }
    };

    // Start observing
    startObserving();
  }

  /**
   * Handle container resize
   */
  private _handleResize(): void {
    if (!this._container) return;

    // Get container dimensions
    const width = this._container.clientWidth;
    const height = this._container.clientHeight;

    // Skip if dimensions are 0 (container not properly mounted yet)
    if (width === 0 || height === 0) return;

    // Resize renderer
    this._app.renderer.resize(width, height);

    // Update stage position for camera centering
    this._updateCameraTransform();

    // Emit resize event
    eventEmitter.emit(RenderEventType.RESIZE, this, width, height);
  }

  /**
   * Start the rendering loop
   */
  private _startRendering(): void {
    if (this._isRendering || this._contextLost) return;

    this._isRendering = true;
    this._lastFrameTime = performance.now();

    // Start ticker (uses requestAnimationFrame internally)
    this._app.ticker.add(this._renderFrame.bind(this));
  }

  /**
   * Stop the rendering loop
   */
  public stopRendering(): void {
    if (!this._isRendering) return;

    this._isRendering = false;
    this._app.ticker.remove(this._renderFrame.bind(this));
  }

  /**
   * Main render frame callback
   * 
   * @param delta Delta time from PixiJS ticker
   */
  private _renderFrame(delta: number): void {
    // Skip if context lost
    if (this._contextLost) return;

    // Calculate performance metrics if enabled
    if (this._recordStats) {
      // Start timing
      const startTime = performance.now();

      // Update stats
      this._updateStats(startTime);

      // Every 30 frames, emit stats update event
      if (this._frameCount % 30 === 0) {
        eventEmitter.emit(RenderEventType.RENDER_STATS_UPDATE, this, this._stats);
      }

      this._frameCount++;
    }

    // Additional custom rendering logic would go here
  }

  /**
   * Update renderer statistics
   * 
   * @param currentTime Current frame timestamp
   */
  private _updateStats(currentTime: number): void {
    // Calculate time since last frame
    const deltaTime = currentTime - this._lastFrameTime;
    this._lastFrameTime = currentTime;

    // Calculate FPS with exponential moving average (lower weight to recent frames)
    const alpha = 0.05; // Smoothing factor
    const instantFps = 1000 / (deltaTime || 16.67); // Avoid division by zero
    this._stats.fps = instantFps * alpha + this._stats.fps * (1 - alpha);

    // Extract renderer statistics
    // Use any to access internal PIXI renderer properties
    const renderer = this._app.renderer as any;

    if (renderer && renderer.renderingToScreen) {
      // Get WebGL renderer stats
      if (renderer.gl && renderer.state) {
        // Basic stats available on all renderer types
        const renderTime = renderer.lastObjectRendered?.timing?.renderMs ?? 0;
        this._stats.renderTime = renderTime * alpha + this._stats.renderTime * (1 - alpha);

        // Get more detailed stats from WebGL renderer if available
        if (renderer.textureGC) {
          this._stats.textureMemory = renderer.textureGC.managedSize || 0;
        }

        // Try to capture draw call count - this is PIXI internals and may change
        if (renderer.state) {
          // Estimate draw calls from state changes (approximation)
          this._stats.drawCalls = renderer.state._stateId || 0;
        }

        // Count sprite objects
        let totalObjects = 0;
        let visibleObjects = 0;
        let sprites = 0;

        // Count objects by traversing the scene graph
        const countObjects = (container: PIXI.Container) => {
          totalObjects++;
          if (container.visible) {
            visibleObjects++;
            
            // Count by type
            if (container instanceof PIXI.Sprite) {
              sprites++;
            }
          }

          for (let i = 0; i < container.children.length; i++) {
            const child = container.children[i];
            countObjects(child as PIXI.Container);
          }
        };

        // Start counting from stage
        countObjects(this._app.stage);

        // Update stats
        this._stats.totalObjects = totalObjects;
        this._stats.visibleObjects = visibleObjects;
        this._stats.sprites = sprites;
      }
    }
  }

  /**
   * Enable or disable performance stats recording
   * 
   * @param enabled Whether to record stats
   */
  public setStatsRecording(enabled: boolean): void {
    this._recordStats = enabled;
  }

  /**
   * Get the current renderer statistics
   * 
   * @returns Current render stats
   */
  public getStats(): Readonly<RenderStats> {
    return this._stats;
  }

  /**
   * Get the renderer's canvas element
   * 
   * @returns Canvas element
   */
  public getCanvas(): HTMLCanvasElement {
    return this._app.view as HTMLCanvasElement;
  }

  /**
   * Get the PixiJS application instance
   * 
   * @returns PixiJS application
   */
  public getApp(): PIXI.Application {
    return this._app;
  }

  /**
   * Get the layer manager
   * 
   * @returns Layer manager
   */
  public getLayerManager(): LayerManager {
    return this._layerManager;
  }

  /**
   * Add a display object to a specific layer
   * 
   * @param object Display object to add
   * @param layerType Layer to add object to
   * @returns Boolean indicating success
   */
  public addToLayer(object: PIXI.DisplayObject & Partial<LayerChild>, layerType: RenderLayerType): boolean {
    return this._layerManager.addToLayer(object, layerType);
  }

  /**
   * Remove a display object from its layer
   * 
   * @param object Display object to remove
   * @returns Boolean indicating success
   */
  public removeFromLayer(object: PIXI.DisplayObject): boolean {
    return this._layerManager.removeFromLayer(object);
  }

  /**
   * Set the visibility of a specific layer
   * 
   * @param layerType Layer to change visibility
   * @param visible Whether layer should be visible
   */
  public setLayerVisibility(layerType: RenderLayerType, visible: boolean): void {
    this._layerManager.setLayerVisibility(layerType, visible);
    eventEmitter.emit(RenderEventType.LAYER_VISIBILITY_CHANGE, this, layerType, visible);
  }

  /**
   * Get the dimensions of the renderer
   * 
   * @returns Width and height of the renderer
   */
  public getDimensions(): { width: number, height: number } {
    return {
      width: this._app.renderer.width,
      height: this._app.renderer.height
    };
  }

  /**
   * Set camera position and zoom
   * 
   * @param x X coordinate
   * @param y Y coordinate
   * @param zoom Zoom level
   * @param rotation Rotation in radians
   */
  public setCamera(x?: number, y?: number, zoom?: number, rotation?: number): void {
    let changed = false;

    if (x !== undefined && this._camera.x !== x) {
      this._camera.x = x;
      changed = true;
    }

    if (y !== undefined && this._camera.y !== y) {
      this._camera.y = y;
      changed = true;
    }

    if (zoom !== undefined && this._camera.zoom !== zoom) {
      this._camera.zoom = Math.max(0.1, zoom); // Prevent zoom from being too small
      changed = true;
    }

    if (rotation !== undefined && this._camera.rotation !== rotation) {
      this._camera.rotation = rotation;
      changed = true;
    }

    if (changed) {
      this._updateCameraTransform();
      eventEmitter.emit(RenderEventType.VIEWPORT_CHANGE, this, this._camera);
    }
  }

  /**
   * Update the camera transform
   */
  private _updateCameraTransform(): void {
    // Get dimensions
    const width = this._app.renderer.width;
    const height = this._app.renderer.height;

    // Skip if dimensions are invalid
    if (width === 0 || height === 0) return;

    // Get camera settings
    const { x, y, zoom, rotation } = this._camera;

    // Create transform for world container
    // Note: We need to access the stage or world container
    // Here, we assume the first layer is the world container
    const worldContainer = this._app.stage;

    if (!worldContainer) return;

    // Reset transform
    worldContainer.setTransform(width / 2, height / 2, zoom, zoom, rotation, 0, 0, 0, 0);

    // Apply camera position (inverted because we're moving the world, not the camera)
    worldContainer.position.x = width / 2 - x * zoom;
    worldContainer.position.y = height / 2 - y * zoom;
  }

  /**
   * Check if WebGL is supported
   * 
   * @returns Whether WebGL is supported
   */
  public isWebGLSupported(): boolean {
    return PIXI.utils.isWebGLSupported();
  }

  /**
   * Clear all display objects and layers
   */
  public clear(): void {
    this._layerManager.clear();
  }

  /**
   * Destroy the renderer and clean up resources
   */
  public destroy(): void {
    // Stop rendering first
    this.stopRendering();

    // Remove canvas from DOM
    if (this._container && this._app.view.parentNode === this._container) {
      this._container.removeChild(this._app.view as HTMLCanvasElement);
    }

    // Clear all layers
    this.clear();

    // Destroy PixiJS application
    this._app.destroy(true, { children: true, texture: true, baseTexture: true });

    // Mark as not initialized
    this._initialized = false;
    this._container = null;
  }
}

// Create a singleton instance
export const renderManager = new RenderManager();
