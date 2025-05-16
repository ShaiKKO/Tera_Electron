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
  ERROR = 'game_error'
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
   * Stats about the game loop
   */
  private _stats = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    totalFrames: 0
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
      totalFrames: 0
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
    // Calculate delta time
    const deltaTime = Math.min((timestamp - this._lastFrameTime) / 1000, this._maxDeltaTime);
    this._lastFrameTime = timestamp;
    
    // Start update timing
    const updateStartTime = performance.now();
    
    // Update all systems
    systemManager.update(deltaTime);
    
    // End update timing
    const updateEndTime = performance.now();
    
    // Update stats
    this._updateStats(
      deltaTime,
      updateEndTime - updateStartTime
    );
    
    // Emit update event
    eventEmitter.emit(GameEventType.UPDATE, this, deltaTime);
    
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
   */
  private _updateStats(deltaTime: number, updateTime: number): void {
    // Increment total frames
    this._stats.totalFrames++;
    
    // Calculate exponential moving averages
    const alpha = 0.1; // Smoothing factor
    this._stats.fps = (1 / deltaTime) * alpha + this._stats.fps * (1 - alpha);
    this._stats.frameTime = deltaTime * 1000 * alpha + this._stats.frameTime * (1 - alpha);
    this._stats.updateTime = updateTime * alpha + this._stats.updateTime * (1 - alpha);
    
    // Log stats in debug mode
    if (this._debug && this._stats.totalFrames % 60 === 0) {
      console.log(`FPS: ${this._stats.fps.toFixed(2)}, Frame: ${this._stats.frameTime.toFixed(2)}ms, Update: ${this._stats.updateTime.toFixed(2)}ms`);
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
}

// Create a global game instance
export const game = new Game();
