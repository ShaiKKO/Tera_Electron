/**
 * TerraFlux - Component Storage
 * 
 * Provides storage implementations for components in the ECS architecture.
 * Implements both Array of Structs (AoS) and Struct of Arrays (SoA) approaches.
 */

import { Component as ComponentClass } from './Component';
import { ComponentId, EntityId, ComponentStorageType } from './types';

/**
 * Interface for component storage strategies
 */
export interface ComponentStorage {
  /**
   * The type of storage strategy
   */
  readonly storageType: ComponentStorageType;
  
  /**
   * Add a component for an entity
   * 
   * @param entityId The entity ID
   * @param component The component to add
   * @returns True if the component was added, false if it already existed
   */
  add(entityId: EntityId, component: ComponentClass): boolean;
  
  /**
   * Get a component for an entity
   * 
   * @param entityId The entity ID
   * @returns The component, or undefined if not found
   */
  get(entityId: EntityId): ComponentClass | undefined;
  
  /**
   * Check if an entity has a component
   * 
   * @param entityId The entity ID
   * @returns True if the entity has the component
   */
  has(entityId: EntityId): boolean;
  
  /**
   * Remove a component from an entity
   * 
   * @param entityId The entity ID
   * @returns The removed component, or undefined if not found
   */
  remove(entityId: EntityId): ComponentClass | undefined;
  
  /**
   * Get all entities that have a component
   * 
   * @returns Array of entity IDs
   */
  getEntities(): EntityId[];
  
  /**
   * Get all components
   * 
   * @returns Array of components
   */
  getComponents(): ComponentClass[];
  
  /**
   * Get entity and component pairs
   * 
   * @returns Array of entity ID and component pairs
   */
  getEntityComponentPairs(): [EntityId, ComponentClass][];
  
  /**
   * Clear all components
   */
  clear(): void;
  
  /**
   * Get the number of components in the storage
   * 
   * @returns The number of components
   */
  count(): number;
  
  /**
   * Get the component type ID
   * 
   * @returns The component type ID
   */
  getComponentTypeId(): ComponentId;
}

/**
 * Array of Structs (AoS) implementation of component storage
 * Each entity's components are stored together in a map
 * Good for complex relational components or those accessed together
 */
export class ArrayComponentStorage implements ComponentStorage {
  /**
   * The type of storage strategy
   */
  public readonly storageType = ComponentStorageType.ARRAY_OF_STRUCTS;
  
  /**
   * Maps entity IDs to components
   */
  private entityComponentMap: Map<EntityId, ComponentClass> = new Map();
  
  /**
   * The component type ID
   */
  private readonly componentTypeId: ComponentId;
  
  /**
   * Constructor
   * 
   * @param componentTypeId The component type ID
   */
  constructor(componentTypeId: ComponentId) {
    this.componentTypeId = componentTypeId;
  }
  
  /**
   * Add a component for an entity
   * 
   * @param entityId The entity ID
   * @param component The component to add
   * @returns True if the component was added, false if it already existed
   */
  public add(entityId: EntityId, component: ComponentClass): boolean {
    // Check if this entity already has this component
    if (this.entityComponentMap.has(entityId)) {
      return false;
    }
    
    // Add the component
    this.entityComponentMap.set(entityId, component);
    return true;
  }
  
  /**
   * Get a component for an entity
   * 
   * @param entityId The entity ID
   * @returns The component, or undefined if not found
   */
  public get(entityId: EntityId): ComponentClass | undefined {
    return this.entityComponentMap.get(entityId);
  }
  
  /**
   * Check if an entity has a component
   * 
   * @param entityId The entity ID
   * @returns True if the entity has the component
   */
  public has(entityId: EntityId): boolean {
    return this.entityComponentMap.has(entityId);
  }
  
  /**
   * Remove a component from an entity
   * 
   * @param entityId The entity ID
   * @returns The removed component, or undefined if not found
   */
  public remove(entityId: EntityId): ComponentClass | undefined {
    const component = this.entityComponentMap.get(entityId);
    if (component) {
      this.entityComponentMap.delete(entityId);
    }
    return component;
  }
  
  /**
   * Get all entities that have a component
   * 
   * @returns Array of entity IDs
   */
  public getEntities(): EntityId[] {
    return Array.from(this.entityComponentMap.keys());
  }
  
  /**
   * Get all components
   * 
   * @returns Array of components
   */
  public getComponents(): ComponentClass[] {
    return Array.from(this.entityComponentMap.values());
  }
  
  /**
   * Get entity and component pairs
   * 
   * @returns Array of entity ID and component pairs
   */
  public getEntityComponentPairs(): [EntityId, ComponentClass][] {
    return Array.from(this.entityComponentMap.entries());
  }
  
  /**
   * Clear all components
   */
  public clear(): void {
    this.entityComponentMap.clear();
  }
  
  /**
   * Get the number of components in the storage
   * 
   * @returns The number of components
   */
  public count(): number {
    return this.entityComponentMap.size;
  }
  
  /**
   * Get the component type ID
   * 
   * @returns The component type ID
   */
  public getComponentTypeId(): ComponentId {
    return this.componentTypeId;
  }
}

/**
 * Struct of Arrays (SoA) implementation of component storage
 * Each component type has its own array, optimized for system iteration
 * Better for cache coherency and performance-critical components
 */
export class SparseSetComponentStorage implements ComponentStorage {
  /**
   * The type of storage strategy
   */
  public readonly storageType = ComponentStorageType.STRUCT_OF_ARRAYS;
  
  /**
   * Maps entity IDs to indices in the dense array
   */
  private sparse: Map<EntityId, number> = new Map();
  
  /**
   * Dense array of entity IDs
   */
  private denseEntities: EntityId[] = [];
  
  /**
   * Dense array of components, parallel to denseEntities
   */
  private denseComponents: ComponentClass[] = [];
  
  /**
   * The component type ID
   */
  private readonly componentTypeId: ComponentId;
  
  /**
   * Constructor
   * 
   * @param componentTypeId The component type ID
   */
  constructor(componentTypeId: ComponentId) {
    this.componentTypeId = componentTypeId;
  }
  
  /**
   * Add a component for an entity
   * 
   * @param entityId The entity ID
   * @param component The component to add
   * @returns True if the component was added, false if it already existed
   */
  public add(entityId: EntityId, component: ComponentClass): boolean {
    // Check if this entity already has this component
    if (this.sparse.has(entityId)) {
      return false;
    }
    
    // Add to dense arrays
    const index = this.denseEntities.length;
    this.denseEntities.push(entityId);
    this.denseComponents.push(component);
    
    // Map entity ID to index
    this.sparse.set(entityId, index);
    
    return true;
  }
  
  /**
   * Get a component for an entity
   * 
   * @param entityId The entity ID
   * @returns The component, or undefined if not found
   */
  public get(entityId: EntityId): ComponentClass | undefined {
    const index = this.sparse.get(entityId);
    if (index === undefined) {
      return undefined;
    }
    
    return this.denseComponents[index];
  }
  
  /**
   * Check if an entity has a component
   * 
   * @param entityId The entity ID
   * @returns True if the entity has the component
   */
  public has(entityId: EntityId): boolean {
    return this.sparse.has(entityId);
  }
  
  /**
   * Remove a component from an entity
   * 
   * @param entityId The entity ID
   * @returns The removed component, or undefined if not found
   */
  public remove(entityId: EntityId): ComponentClass | undefined {
    const index = this.sparse.get(entityId);
    if (index === undefined) {
      return undefined;
    }
    
    // Get the component that will be removed
    const component = this.denseComponents[index];
    
    // If this is not the last element, move the last element to this position
    const lastIndex = this.denseEntities.length - 1;
    if (index !== lastIndex) {
      // Move the last entity/component to this position
      const lastEntityId = this.denseEntities[lastIndex];
      this.denseEntities[index] = lastEntityId;
      this.denseComponents[index] = this.denseComponents[lastIndex];
      
      // Update the sparse map for the moved entity
      this.sparse.set(lastEntityId, index);
    }
    
    // Remove the last entity/component (now duplicated or the one we want to remove)
    this.denseEntities.pop();
    this.denseComponents.pop();
    
    // Remove from sparse map
    this.sparse.delete(entityId);
    
    return component;
  }
  
  /**
   * Get all entities that have a component
   * 
   * @returns Array of entity IDs
   */
  public getEntities(): EntityId[] {
    return [...this.denseEntities];
  }
  
  /**
   * Get all components
   * 
   * @returns Array of components
   */
  public getComponents(): ComponentClass[] {
    return [...this.denseComponents];
  }
  
  /**
   * Get entity and component pairs
   * 
   * @returns Array of entity ID and component pairs
   */
  public getEntityComponentPairs(): [EntityId, ComponentClass][] {
    return this.denseEntities.map((entityId, index) => 
      [entityId, this.denseComponents[index]]
    );
  }
  
  /**
   * Clear all components
   */
  public clear(): void {
    this.sparse.clear();
    this.denseEntities = [];
    this.denseComponents = [];
  }
  
  /**
   * Get the number of components in the storage
   * 
   * @returns The number of components
   */
  public count(): number {
    return this.denseEntities.length;
  }
  
  /**
   * Get the component type ID
   * 
   * @returns The component type ID
   */
  public getComponentTypeId(): ComponentId {
    return this.componentTypeId;
  }
  
  /**
   * Get direct access to the dense arrays for optimized iteration
   * WARNING: Do not modify these arrays directly unless you know what you're doing
   * 
   * @returns Object containing dense entity and component arrays
   */
  public getDenseArrays(): { entities: EntityId[], components: ComponentClass[] } {
    return {
      entities: this.denseEntities,
      components: this.denseComponents
    };
  }
}

/**
 * Factory function to create a component storage based on the specified strategy
 * 
 * @param componentTypeId The component type ID
 * @param storageType The storage strategy to use
 * @returns A component storage instance
 */
export function createComponentStorage(
  componentTypeId: ComponentId,
  storageType: ComponentStorageType = ComponentStorageType.STRUCT_OF_ARRAYS
): ComponentStorage {
  switch (storageType) {
    case ComponentStorageType.ARRAY_OF_STRUCTS:
      return new ArrayComponentStorage(componentTypeId);
    case ComponentStorageType.STRUCT_OF_ARRAYS:
      return new SparseSetComponentStorage(componentTypeId);
    default:
      throw new Error(`Unknown component storage type: ${storageType}`);
  }
}
