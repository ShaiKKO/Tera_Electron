/**
 * TerraFlux - Game Core
 * 
 * Central game engine class that ties together the ECS framework.
 * Manages the game loop, timing, and provides access to global managers.
 */

import { entityManager } from './ecs/EntityManager';
import { systemManager } from './ecs/SystemManager';
import { eventEmitter } from './ecs/EventEmitter';
import { componentRegistry } from './utils/TypeRegistry';

/**
 * Game configuration options
 */
export interface GameConfig {
  /** Target updates per second */
  targetFPS?: number;
  /** Maximum delta time to prevent spiral of death */
  maxDeltaTime?: number;
  /** Whether to start the game loop automatically after initialization */
  autoStart?: boolean;
  /** Debug mode flag */
  debug?: boolean;
  /** Whether to use fixed timestep (true) or variable (false, default) */
  useFixedTimestep?: boolean;
  /** Fixed timestep value in seconds (default 1/60) */
  fixedTimestepValue?: number;
  /** Initial time scale (default 1.0) */
  timeScale?: number;
}

/**
 * Game state enumeration
 */
export enum GameState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  STOPPED = 'stopped'
}

/**
 * Game event types
 */
export enum GameEventType {
  INITIALIZED = 'game_initialized',
  STARTED = 'game_started',
  PAUSED = 'game_paused',
  RESUMED = 'game_resumed',
  STOPPED = 'game_stopped',
  UPDATE = 'game_update',
  ERROR = 'game_error',
  TIME_SCALE_CHANGED = 'game_time_scale_changed',
  TIMESTEP_MODE_CHANGED = 'game_timestep_mode_changed',
  PERFORMANCE_SNAPSHOT = 'game_performance_snapshot'
}

/**
 * Central game engine class
 */
export class Game {
  /**
   * Current game state
   */
  private _state: GameState = GameState.UNINITIALIZED;
  
  /**
   * Target updates per second
   */
  private _targetFPS: number;
  
  /**
   * Maximum delta time to prevent spiral of death
   */
  private _maxDeltaTime: number;
  
  /**
   * Request animation frame ID for cancellation
   */
  private _rafId?: number;
  
  /**
   * Time of the last frame
   */
  private _lastFrameTime: number = 0;
  
  /**
   * Whether the game is currently in debug mode
   */
  private _debug: boolean;
  
  /**
   * Whether to use fixed timestep
   */
  private _useFixedTimestep: boolean;
  
  /**
   * Fixed timestep value in seconds
   */
  private _fixedTimestepValue: number;
  
  /**
   * Time accumulator for fixed timestep
   */
  private _accumulator: number = 0;
  
  /**
   * Time scale factor
   */
  private _timeScale: number;
  
  /**
   * Stats about the game loop
   */
  private _stats = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    idleTime: 0,
    totalFrames: 0,
    droppedFrames: 0,
    timeScale: 1.0,
    entityCount: 0,
    systemCount: 0
  };
  
  /**
   * Constructor for Game
   * 
   * @param config Game configuration options
   */
  constructor(config: GameConfig = {}) {
    this._targetFPS = config.targetFPS ?? 60;
    this._maxDeltaTime = config.maxDeltaTime ?? 0.25; // 250ms
    this._debug = config.debug ?? false;
    this._useFixedTimestep = config.useFixedTimestep ?? false;
    this._fixedTimestepValue = config.fixedTimestepValue ?? 1/60;
    this._timeScale = config.timeScale ?? 1.0;
    
    // Auto-start if specified
    if (config.autoStart) {
      this.initialize().then(() => this.start());
    }
  }
  
  /**
   * Get the current game state
   */
  public get state(): GameState {
    return this._state;
  }
  
  /**
   * Get the target updates per second
   */
  public get targetFPS(): number {
    return this._targetFPS;
  }
  
  /**
   * Set the target updates per second
   */
  public set targetFPS(value: number) {
    this._targetFPS = value;
  }
  
  /**
   * Get whether fixed timestep is being used
   */
  public get useFixedTimestep(): boolean {
    return this._useFixedTimestep;
  }
  
  /**
   * Set whether fixed timestep should be used
   */
  public set useFixedTimestep(value: boolean) {
    const oldValue = this._useFixedTimestep;
    this._useFixedTimestep = value;
    
    if (oldValue !== this._useFixedTimestep) {
      eventEmitter.emit(GameEventType.TIMESTEP_MODE_CHANGED, this, this._useFixedTimestep);
    }
  }
  
  /**
   * Get the fixed timestep value in seconds
   */
  public get fixedTimestepValue(): number {
    return this._fixedTimestepValue;
  }
  
  /**
   * Set the fixed timestep value in seconds
   */
  public set fixedTimestepValue(value: number) {
    this._fixedTimestepValue = Math.max(0.001, Math.min(0.1, value));
  }
  
  /**
   * Get the time scale factor
   */
  public get timeScale(): number {
    return this._timeScale;
  }
  
  /**
   * Set the time scale factor
   */
  public set timeScale(value: number) {
    const oldValue = this._timeScale;
    this._timeScale = Math.max(0.1, Math.min(10, value));
    
    if (oldValue !== this._timeScale) {
      eventEmitter.emit(GameEventType.TIME_SCALE_CHANGED, this, this._timeScale);
    }
  }
  
  /**
   * Get the maximum delta time
   */
  public get maxDeltaTime(): number {
    return this._maxDeltaTime;
  }
  
  /**
   * Set the maximum delta time
   */
  public set maxDeltaTime(value: number) {
    this._maxDeltaTime = value;
  }
  
  /**
   * Get whether the game is currently in debug mode
   */
  public get debug(): boolean {
    return this._debug;
  }
  
  /**
   * Set whether the game is currently in debug mode
   */
  public set debug(value: boolean) {
    this._debug = value;
  }
  
  /**
   * Get the current game stats
   */
  public get stats(): Readonly<typeof this._stats> {
    return this._stats;
  }
  
  /**
   * Initialize the game
   * 
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<boolean> {
    // Check if we're already initialized
    if (this._state !== GameState.UNINITIALIZED) {
      return true;
    }
    
    // Set state to initializing
    this._state = GameState.INITIALIZING;
    
    try {
      // Initialize core systems
      // If needed, this is where we would load configuration, 
      // assets, or set up any other required infrastructure
      
      // Set state to ready
      this._state = GameState.READY;
      
      // Emit initialized event
      eventEmitter.emit(GameEventType.INITIALIZED, this);
      
      return true;
    } catch (error) {
      // Set state back to uninitialized
      this._state = GameState.UNINITIALIZED;
      
      // Emit error event
      eventEmitter.emit(GameEventType.ERROR, this, error);
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Start the game loop
   * 
   * @returns True if the game was started successfully
   */
  public start(): boolean {
    // Check if we're in a valid state to start
    if (this._state !== GameState.READY && this._state !== GameState.PAUSED && this._state !== GameState.STOPPED) {
      return false;
    }
    
    // Set state to running
    this._state = GameState.RUNNING;
    
    // Reset frame time
    this._lastFrameTime = performance.now();
    
    // Start the game loop
    this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
    
    // Emit started event
    eventEmitter.emit(GameEventType.STARTED, this);
    
    return true;
  }
  
  /**
   * Pause the game loop
   * 
   * @returns True if the game was paused successfully
   */
  public pause(): boolean {
    // Check if we're in a valid state to pause
    if (this._state !== GameState.RUNNING) {
      return false;
    }
    
    // Set state to paused
    this._state = GameState.PAUSED;
    
    // Stop the game loop
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
    
    // Emit paused event
    eventEmitter.emit(GameEventType.PAUSED, this);
    
    return true;
  }
  
  /**
   * Resume the game loop
   * 
   * @returns True if the game was resumed successfully
   */
  public resume(): boolean {
    // Check if we're in a valid state to resume
    if (this._state !== GameState.PAUSED) {
      return false;
    }
    
    // Set state to running
    this._state = GameState.RUNNING;
    
    // Reset frame time
    this._lastFrameTime = performance.now();
    
    // Start the game loop
    this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
    
    // Emit resumed event
    eventEmitter.emit(GameEventType.RESUMED, this);
    
    return true;
  }
  
  /**
   * Stop the game loop
   * 
   * @returns True if the game was stopped successfully
   */
  public stop(): boolean {
    // Check if we're in a valid state to stop
    if (this._state !== GameState.RUNNING && this._state !== GameState.PAUSED) {
      return false;
    }
    
    // Set state to stopping
    this._state = GameState.STOPPING;
    
    // Stop the game loop
    if (this._rafId !== undefined) {
      cancelAnimationFrame(this._rafId);
      this._rafId = undefined;
    }
    
    // Reset stats
    this._stats = {
      fps: 0,
      frameTime: 0,
      updateTime: 0,
      renderTime: 0,
      idleTime: 0,
      totalFrames: 0,
      droppedFrames: 0,
      timeScale: this._timeScale,
      entityCount: 0,
      systemCount: 0
    };
    
    // Set state to stopped
    this._state = GameState.STOPPED;
    
    // Emit stopped event
    eventEmitter.emit(GameEventType.STOPPED, this);
    
    return true;
  }
  
  /**
   * Reset the game to its initial state
   * 
   * @returns True if the game was reset successfully
   */
  public reset(): boolean {
    // Stop the game first
    this.stop();
    
    // Clear all entities
    entityManager.clear();
    
    // Clear all systems
    systemManager.clear();
    
    // Set state to ready
    this._state = GameState.READY;
    
    return true;
  }
  
  /**
   * Main game loop
   * 
   * @param timestamp Current timestamp from requestAnimationFrame
   */
  private _gameLoop(timestamp: number): void {
    // Calculate delta time with time scaling
    const rawDeltaTime = Math.min((timestamp - this._lastFrameTime) / 1000, this._maxDeltaTime);
    const scaledDeltaTime = rawDeltaTime * this._timeScale;
    this._lastFrameTime = timestamp;
    
    // Start update timing
    const updateStartTime = performance.now();
    
    if (this._useFixedTimestep) {
      // Fixed timestep implementation
      this._accumulator += scaledDeltaTime;
      
      // Run as many fixed updates as needed
      let updatesThisFrame = 0;
      while (this._accumulator >= this._fixedTimestepValue && updatesThisFrame < 10) {
        // Update systems with fixed timestep
        systemManager.update(this._fixedTimestepValue);
        this._accumulator -= this._fixedTimestepValue;
        updatesThisFrame++;
      }
      
      // If we've hit max updates but still have accumulator time, we're falling behind
      if (this._accumulator >= this._fixedTimestepValue && this._debug) {
        console.warn(`Game loop falling behind! Accumulator: ${this._accumulator.toFixed(3)}s`);
      }
    } else {
      // Standard variable timestep
      systemManager.update(scaledDeltaTime);
    }
    
    // End update timing
    const updateEndTime = performance.now();
    
    // Start render timing (placeholder for future rendering system)
    const renderStartTime = performance.now();
    const renderEndTime = renderStartTime; // No rendering yet
    
    // Update stats
    this._updateStats(
      rawDeltaTime,
      updateEndTime - updateStartTime,
      renderEndTime - renderStartTime
    );
    
    // Emit update event
    eventEmitter.emit(GameEventType.UPDATE, this, scaledDeltaTime);
    
    // Continue the loop if still running
    if (this._state === GameState.RUNNING) {
      this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
    }
  }
  
  /**
   * Update game stats
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   * @param updateTime Time taken for the update in milliseconds
   * @param renderTime Time taken for rendering in milliseconds
   */
  private _updateStats(deltaTime: number, updateTime: number, renderTime: number = 0): void {
    // Calculate frame time and determine if frame was dropped
    const frameTime = updateTime + renderTime;
    const targetFrameTime = 1000 / this._targetFPS;
    const droppedFrame = frameTime > targetFrameTime * 1.2; // 20% margin
    
    // Calculate idle time (time spent not updating or rendering)
    const idleTime = Math.max(0, targetFrameTime - frameTime);
    
    // Increment total frames
    this._stats.totalFrames++;
    if (droppedFrame) this._stats.droppedFrames++;
    
    // Calculate exponential moving averages
    const alpha = 0.1; // Smoothing factor
    this._stats.fps = (1 / deltaTime) * alpha + this._stats.fps * (1 - alpha);
    this._stats.frameTime = frameTime * alpha + this._stats.frameTime * (1 - alpha);
    this._stats.updateTime = updateTime * alpha + this._stats.updateTime * (1 - alpha);
    this._stats.renderTime = renderTime * alpha + this._stats.renderTime * (1 - alpha);
    this._stats.idleTime = idleTime * alpha + this._stats.idleTime * (1 - alpha);
    
    // Update entity and system counts
    this._stats.entityCount = entityManager.getEntityCount();
    this._stats.systemCount = systemManager.getSystemCount();
    this._stats.timeScale = this._timeScale;
    
    // Log stats in debug mode
    if (this._debug && this._stats.totalFrames % 60 === 0) {
      console.log(`FPS: ${this._stats.fps.toFixed(2)}, ` +
                  `Frame: ${this._stats.frameTime.toFixed(2)}ms, ` +
                  `Update: ${this._stats.updateTime.toFixed(2)}ms, ` +
                  `Render: ${this._stats.renderTime.toFixed(2)}ms, ` + 
                  `Entities: ${this._stats.entityCount}, ` +
                  `Speed: ${this._stats.timeScale.toFixed(1)}x`);
    }
  }
  
  /**
   * Get the entity manager
   */
  public get entityManager() {
    return entityManager;
  }
  
  /**
   * Get the system manager
   */
  public get systemManager() {
    return systemManager;
  }
  
  /**
   * Get the event emitter
   */
  public get eventEmitter() {
    return eventEmitter;
  }
  
  /**
   * Get the component registry
   */
  public get componentRegistry() {
    return componentRegistry;
  }
  /**
   * Toggle between fixed and variable timestep
   * @returns New timestep mode (true = fixed, false = variable)
   */
  public toggleTimestepMode(): boolean {
    this.useFixedTimestep = !this._useFixedTimestep;
    
    if (this._debug) {
      console.log(`Switched to ${this._useFixedTimestep ? 'fixed' : 'variable'} timestep mode`);
    }
    
    return this._useFixedTimestep;
  }

  /**
   * Cycle through game speeds (normal -> fast -> ultra-fast -> normal)
   * @returns New time scale value
   */
  public cycleGameSpeed(): number {
    if (this._timeScale <= 1.0) {
      this.setFastSpeed();
    } else if (this._timeScale <= 2.0) {
      this.setUltraFastSpeed();
    } else {
      this.setNormalSpeed();
    }
    
    if (this._debug) {
      console.log(`Game speed set to ${this._timeScale}x`);
    }
    
    return this._timeScale;
  }

  /**
   * Set normal game speed (1x)
   */
  public setNormalSpeed(): void {
    this.timeScale = 1.0;
  }

  /**
   * Set fast game speed (2x)
   */
  public setFastSpeed(): void {
    this.timeScale = 2.0;
  }

  /**
   * Set ultra-fast game speed (5x)
   */
  public setUltraFastSpeed(): void {
    this.timeScale = 5.0;
  }

  /**
   * Take a performance snapshot
   * @returns Object with detailed performance metrics
   */
  public takePerformanceSnapshot(): Readonly<typeof this._stats> & { 
    timestamp: number,
    memory: any
  } {
    const snapshot = {
      ...this._stats,
      timestamp: Date.now(),
      memory: typeof performance !== 'undefined' && 'memory' in performance ? {
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize
      } : undefined
    };
    
    if (this._debug) {
      console.table(snapshot);
    }
    
    // Emit performance snapshot event
    eventEmitter.emit(GameEventType.PERFORMANCE_SNAPSHOT, this, snapshot);
    
    return snapshot;
  }
}

// Create a global game instance
export const game = new Game();
