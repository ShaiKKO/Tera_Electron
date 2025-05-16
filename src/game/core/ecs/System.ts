/**
 * TerraFlux - System Base Class
 * 
 * Provides the foundation for all systems in the ECS architecture.
 * Systems operate on entities with specific component combinations.
 */

import { UUID } from '../utils/UUID';
import { entityManager } from './EntityManager';
import { eventEmitter } from './EventEmitter';
import {
  EntityId,
  ComponentId,
  SystemId,
  EntityQueryOptions,
  SystemPriority,
  SystemEventType
} from './types';
import { Entity } from './Entity';

/**
 * System configuration options
 */
export interface SystemConfig {
  /** Human-readable name for the system */
  name: string;
  /** Priority level for execution order (higher runs earlier) */
  priority?: SystemPriority;
  /** Component query configuration for entities this system processes */
  query?: EntityQueryOptions;
  /** Whether the system is enabled by default */
  enabled?: boolean;
}

/**
 * Abstract base class for all systems
 */
export abstract class System {
  /**
   * Unique identifier for this system
   */
  private readonly _id: SystemId;
  
  /**
   * Human-readable name for this system
   */
  private readonly _name: string;
  
  /**
   * Priority level for execution order (higher runs earlier)
   */
  private _priority: SystemPriority;
  
  /**
   * Query options for selecting entities
   */
  private _query: EntityQueryOptions;
  
  /**
   * Whether this system is currently enabled
   */
  private _enabled: boolean;
  
  /**
   * Constructor for System
   * 
   * @param config System configuration options
   */
  constructor(config: SystemConfig) {
    this._id = UUID.generateSystemId(config.name);
    this._name = config.name;
    this._priority = config.priority ?? SystemPriority.NORMAL;
    this._query = config.query ?? {};
    this._enabled = config.enabled ?? true;
  }
  
  /**
   * Get the unique identifier for this system
   */
  public get id(): SystemId {
    return this._id;
  }
  
  /**
   * Get the human-readable name for this system
   */
  public get name(): string {
    return this._name;
  }
  
  /**
   * Get the priority level for this system
   */
  public get priority(): SystemPriority {
    return this._priority;
  }
  
  /**
   * Set the priority level for this system
   */
  public set priority(value: SystemPriority) {
    this._priority = value;
  }
  
  /**
   * Get whether this system is currently enabled
   */
  public get enabled(): boolean {
    return this._enabled;
  }
  
  /**
   * Set whether this system is currently enabled
   */
  public set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value;
      if (value) {
        this.onEnable();
      } else {
        this.onDisable();
      }
    }
  }
  
  /**
   * Get the query options for selecting entities
   */
  public get query(): EntityQueryOptions {
    return this._query;
  }
  
  /**
   * Set the query options for selecting entities
   */
  public set query(value: EntityQueryOptions) {
    this._query = value;
  }
  
  /**
   * Initialize this system
   * 
   * @returns True if the system was successfully initialized
   */
  public initialize(): boolean {
    const result = this.onInitialize();
    
    // Notify that the system has been initialized
    eventEmitter.emit(SystemEventType.INITIALIZED, this);
    
    return result;
  }
  
  /**
   * Called when the system is initialized
   * Override this to perform custom initialization
   * 
   * @returns True if the system was successfully initialized
   */
  protected onInitialize(): boolean {
    return true;
  }
  
  /**
   * Called when the system is enabled
   * Override this to perform custom enable logic
   */
  protected onEnable(): void {
    // Default implementation does nothing
  }
  
  /**
   * Called when the system is disabled
   * Override this to perform custom disable logic
   */
  protected onDisable(): void {
    // Default implementation does nothing
  }
  
  /**
   * Update this system
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   */
  public update(deltaTime: number): void {
    if (!this._enabled) {
      return;
    }
    
    // Query entities that match this system's requirements
    const entities = entityManager.queryEntities(this._query);
    
    // Process entities
    this.onUpdate(deltaTime, entities);
    
    // Notify that the system has been updated
    eventEmitter.emit(SystemEventType.UPDATED, this, deltaTime);
  }
  
  /**
   * Called when the system is updated
   * Override this to perform per-frame system logic
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   * @param entities Array of entities that match this system's query
   */
  protected abstract onUpdate(deltaTime: number, entities: Entity[]): void;
  
  /**
   * Destroy this system
   */
  public destroy(): void {
    this.onDestroy();
    
    // Notify that the system has been destroyed
    eventEmitter.emit(SystemEventType.DESTROYED, this);
  }
  
  /**
   * Called when the system is destroyed
   * Override this to perform custom cleanup
   */
  protected onDestroy(): void {
    // Default implementation does nothing
  }
  
  /**
   * Register a callback to be executed when the system is destroyed
   * Used by other systems like the EventEmitter for cleanup
   * 
   * @param callback Function to call when the system is destroyed
   */
  public addDestroyCallback(callback: () => void): void {
    const originalOnDestroy = this.onDestroy.bind(this);
    this.onDestroy = () => {
      originalOnDestroy();
      callback();
    };
  }
}
