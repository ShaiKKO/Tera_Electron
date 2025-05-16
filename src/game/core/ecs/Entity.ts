/**
 * TerraFlux - Entity
 * 
 * The core entity class for the ECS architecture.
 * Entities are essentially just IDs with collections of components and tags.
 */

import { UUID } from '../utils/UUID';
import { ComponentId, EntityId, Component, EntityEventType } from './types';
import { eventEmitter } from './EventEmitter';

/**
 * Entity class representing a game object in the ECS architecture
 */
export class Entity {
  /**
   * Unique identifier for this entity
   */
  private readonly _id: EntityId;
  
  /**
   * Tags associated with this entity for filtering
   */
  private _tags: Set<string> = new Set();
  
  /**
   * Human-readable name for debugging
   */
  private _name: string;
  
  /**
   * Create a new entity
   * 
   * @param id Optional unique identifier. If not provided, a new one will be generated.
   * @param name Optional human-readable name for debugging
   */
  constructor(id?: EntityId, name?: string) {
    this._id = id || UUID.generateEntityId();
    this._name = name || `Entity_${this._id.substr(-6)}`;
  }
  
  /**
   * Get the entity's unique identifier
   */
  public get id(): EntityId {
    return this._id;
  }
  
  /**
   * Get the entity's name
   */
  public get name(): string {
    return this._name;
  }
  
  /**
   * Set the entity's name
   */
  public set name(value: string) {
    this._name = value;
  }
  
  /**
   * Add a tag to the entity
   * 
   * @param tag The tag to add
   * @returns This entity for method chaining
   */
  public addTag(tag: string): Entity {
    if (!this._tags.has(tag)) {
      this._tags.add(tag);
      eventEmitter.emit(EntityEventType.TAG_ADDED, this, tag);
    }
    return this;
  }
  
  /**
   * Remove a tag from the entity
   * 
   * @param tag The tag to remove
   * @returns True if the tag was removed, false if it wasn't present
   */
  public removeTag(tag: string): boolean {
    if (this._tags.has(tag)) {
      this._tags.delete(tag);
      eventEmitter.emit(EntityEventType.TAG_REMOVED, this, tag);
      return true;
    }
    return false;
  }
  
  /**
   * Check if the entity has a specific tag
   * 
   * @param tag The tag to check for
   * @returns True if the entity has the tag
   */
  public hasTag(tag: string): boolean {
    return this._tags.has(tag);
  }
  
  /**
   * Get all tags for this entity
   * 
   * @returns Array of tags for this entity
   */
  public getTags(): string[] {
    return [...this._tags];
  }
  
  /**
   * Get a component from this entity
   * 
   * @param componentId The component type ID to get
   * @returns The component, or undefined if not found
   */
  public getComponent<T>(componentId: string): T | undefined {
    // Components are stored in the EntityManager, so we need to use it here
    // This is a convenience method that delegates to the EntityManager
    // Dynamically import to avoid circular dependencies
    const { entityManager } = require('./EntityManager');
    return entityManager.getComponent(this.id, componentId) as T | undefined;
  }
  
  /**
   * Clear all tags from the entity
   * 
   * @returns This entity for method chaining
   */
  public clearTags(): Entity {
    const tags = this.getTags();
    this._tags.clear();
    tags.forEach(tag => {
      eventEmitter.emit(EntityEventType.TAG_REMOVED, this, tag);
    });
    return this;
  }
  
  /**
   * Serialize this entity to a JSON-compatible object
   * Note: Component attachment/detachment is handled by EntityManager
   * 
   * @returns A JSON-compatible object
   */
  public serialize(): Record<string, any> {
    return {
      id: this._id,
      name: this._name,
      tags: this.getTags()
    };
  }
  
  /**
   * Deserialize this entity from a JSON-compatible object
   * Note: Component attachment/detachment is handled by EntityManager
   * 
   * @param data A JSON-compatible object
   */
  public deserialize(data: Record<string, any>): void {
    // ID is immutable, so we don't set it
    
    // Set name
    if (data.name) {
      this._name = data.name;
    }
    
    // Clear and re-add tags
    this.clearTags();
    if (Array.isArray(data.tags)) {
      data.tags.forEach((tag: string) => {
        this.addTag(tag);
      });
    }
  }
  
  /**
   * Check if this entity equals another entity
   * Entities are equal if they have the same ID
   * 
   * @param other The other entity to compare with
   * @returns True if the entities are equal
   */
  public equals(other: Entity): boolean {
    return this._id === other._id;
  }
  
  /**
   * Convert the entity to a string
   * 
   * @returns A string representation of the entity
   */
  public toString(): string {
    return `Entity(id=${this._id}, name=${this._name}, tags=[${this.getTags().join(', ')}])`;
  }
}
