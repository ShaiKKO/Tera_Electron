/**
 * TerraFlux - Entity Manager
 * 
 * Manages entity lifecycle, component attachment, and entity querying.
 * Provides efficient way to query entities based on components and tags.
 */

import { UUID } from '../utils/UUID';
import { Entity } from './Entity';
import { Component as ComponentClass } from './Component';
import { ComponentStorage, createComponentStorage } from './ComponentStorage';
import { eventEmitter } from './EventEmitter';
import { 
  EntityId, 
  ComponentId, 
  EntityFilterPredicate,
  EntityQueryResult,
  EntityEventType,
  ComponentStorageType,
  Component as ComponentInterface
} from './types';
import { componentRegistry } from '../utils/TypeRegistry';

/**
 * Entity archetype key to speedup entity queries
 * Used for identifying unique combinations of components
 */
export type ArchetypeKey = string;

/**
 * Creates an ArchetypeKey from a list of component IDs
 */
function createArchetypeKey(componentIds: ComponentId[]): ArchetypeKey {
  return [...componentIds].sort().join('|');
}

/**
 * Options for entity creation
 */
export interface EntityCreateOptions {
  /** Optional entity ID. If not provided, one will be generated */
  id?: EntityId;
  /** Optional human-readable name for debugging */
  name?: string;
  /** Optional array of initial tags */
  tags?: string[];
}

/**
 * Options for entity queries
 */
export interface EntityQueryOptions {
  /** Array of component IDs that must be present */
  withComponents?: ComponentId[];
  /** Array of component IDs that must not be present */
  withoutComponents?: ComponentId[];
  /** Array of tags that must be present */
  withTags?: string[];
  /** Array of tags that must not be present */
  withoutTags?: string[];
  /** Custom filter function for additional filtering */
  filter?: EntityFilterPredicate;
}

/**
 * EntityManager class responsible for managing entity lifecycle
 * and component attachment/detachment
 */
export class EntityManager {
  /**
   * Map of entity IDs to entities
   */
  private entities: Map<EntityId, Entity> = new Map();
  
  /**
   * Map of component type IDs to their storage
   */
  private componentStorages: Map<ComponentId, ComponentStorage> = new Map();
  
  /**
   * Map of entity archetypes to sets of entity IDs
   * Used for efficient querying of entities with specific component combinations
   */
  private entityArchetypes: Map<ArchetypeKey, Set<EntityId>> = new Map();
  
  /**
   * Map of tags to sets of entity IDs
   * Used for efficient querying of entities with specific tags
   */
  private entityTags: Map<string, Set<EntityId>> = new Map();
  
  /**
   * Default component storage type for new component types
   */
  private defaultStorageType: ComponentStorageType = ComponentStorageType.STRUCT_OF_ARRAYS;
  
  /**
   * Create a new EntityManager
   */
  constructor(defaultStorageType?: ComponentStorageType) {
    if (defaultStorageType !== undefined) {
      this.defaultStorageType = defaultStorageType;
    }
    
    // Subscribe to entity tag events to update the entity tags mapping
    eventEmitter.subscribe(EntityEventType.TAG_ADDED, this.handleTagAdded.bind(this));
    eventEmitter.subscribe(EntityEventType.TAG_REMOVED, this.handleTagRemoved.bind(this));
  }
  
  /**
   * Handler for tag added event
   */
  private handleTagAdded(entity: Entity, tag: string): void {
    // Ensure the tag set exists
    if (!this.entityTags.has(tag)) {
      this.entityTags.set(tag, new Set());
    }
    
    // Add the entity to the tag set
    this.entityTags.get(tag)!.add(entity.id);
  }
  
  /**
   * Handler for tag removed event
   */
  private handleTagRemoved(entity: Entity, tag: string): void {
    // Remove the entity from the tag set
    const tagSet = this.entityTags.get(tag);
    if (tagSet) {
      tagSet.delete(entity.id);
      
      // Clean up empty tag sets
      if (tagSet.size === 0) {
        this.entityTags.delete(tag);
      }
    }
  }
  
  /**
   * Create a new entity
   */
  public createEntity(options: EntityCreateOptions = {}): Entity {
    // Create the entity
    const entity = new Entity(options.id, options.name);
    
    // Register the entity
    this.entities.set(entity.id, entity);
    
    // Add initial tags if provided
    if (options.tags) {
      options.tags.forEach(tag => entity.addTag(tag));
    }
    
    // Emit entity created event
    eventEmitter.emit(EntityEventType.CREATED, entity);
    
    return entity;
  }
  
  /**
   * Get an entity by ID
   */
  public getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  /**
   * Check if an entity exists
   */
  public hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }
  
  /**
   * Destroy an entity and remove all its components
   */
  public destroyEntity(entityId: EntityId): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return false;
    }
    
    // Remove all components
    for (const componentStorage of this.componentStorages.values()) {
      if (componentStorage.has(entityId)) {
        // This will update archetypes internally
        this.removeComponent(entityId, componentStorage.getComponentTypeId());
      }
    }
    
    // Clear entity tags
    entity.clearTags();
    
    // Remove from entities map
    this.entities.delete(entityId);
    
    // Emit entity destroyed event
    eventEmitter.emit(EntityEventType.DESTROYED, entity);
    
    return true;
  }
  
  /**
   * Get all entities
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get the number of entities
   */
  public getEntityCount(): number {
    return this.entities.size;
  }
  
  /**
   * Get or create a component storage
   */
  private getOrCreateComponentStorage(
    componentTypeId: ComponentId,
    storageType?: ComponentStorageType
  ): ComponentStorage {
    // Check if storage already exists
    let storage = this.componentStorages.get(componentTypeId);
    if (!storage) {
      // Create new storage
      storage = createComponentStorage(
        componentTypeId,
        storageType || this.defaultStorageType
      );
      this.componentStorages.set(componentTypeId, storage);
    }
    return storage;
  }
  
  /**
   * Update entity archetypes when components are added or removed
   */
  private updateEntityArchetypes(
    entityId: EntityId,
    oldComponentTypes: ComponentId[],
    newComponentTypes: ComponentId[]
  ): void {
    // Remove from old archetype
    const oldArchetypeKey = createArchetypeKey(oldComponentTypes);
    const oldArchetype = this.entityArchetypes.get(oldArchetypeKey);
    if (oldArchetype) {
      oldArchetype.delete(entityId);
      
      // Clean up empty archetypes
      if (oldArchetype.size === 0) {
        this.entityArchetypes.delete(oldArchetypeKey);
      }
    }
    
    // Add to new archetype
    const newArchetypeKey = createArchetypeKey(newComponentTypes);
    if (!this.entityArchetypes.has(newArchetypeKey)) {
      this.entityArchetypes.set(newArchetypeKey, new Set());
    }
    this.entityArchetypes.get(newArchetypeKey)!.add(entityId);
  }
  
  /**
   * Get all component types for an entity
   */
  public getEntityComponentTypes(entityId: EntityId): ComponentId[] {
    const componentTypes: ComponentId[] = [];
    
    for (const [componentTypeId, storage] of this.componentStorages.entries()) {
      if (storage.has(entityId)) {
        componentTypes.push(componentTypeId);
      }
    }
    
    return componentTypes;
  }
  
  /**
   * Add a component to an entity
   */
  public addComponent(entityId: EntityId, component: ComponentClass): boolean {
    // Check if entity exists
    if (!this.hasEntity(entityId)) {
      return false;
    }
    
    // Get the component storage
    const componentTypeId = component.typeId;
    const storage = this.getOrCreateComponentStorage(componentTypeId);
    
    // Check if already has this component
    if (storage.has(entityId)) {
      return false;
    }
    
    // Get current component types before adding
    const oldComponentTypes = this.getEntityComponentTypes(entityId);
    
    // Add component to storage
    storage.add(entityId, component);
    
    // Update archetypes
    const newComponentTypes = [...oldComponentTypes, componentTypeId];
    this.updateEntityArchetypes(entityId, oldComponentTypes, newComponentTypes);
    
    // Emit component added event
    const entity = this.entities.get(entityId)!;
    eventEmitter.emit(EntityEventType.COMPONENT_ADDED, entity, component);
    
    return true;
  }
  
  /**
   * Get a component from an entity
   */
  public getComponent<T extends ComponentClass>(
    entityId: EntityId, 
    componentTypeId: ComponentId
  ): T | undefined {
    // Check if entity exists
    if (!this.hasEntity(entityId)) {
      return undefined;
    }
    
    // Get the component storage
    const storage = this.componentStorages.get(componentTypeId);
    if (!storage) {
      return undefined;
    }
    
    // Get the component
    return storage.get(entityId) as T | undefined;
  }
  
  /**
   * Check if an entity has a component
   */
  public hasComponent(entityId: EntityId, componentTypeId: ComponentId): boolean {
    // Check if entity exists
    if (!this.hasEntity(entityId)) {
      return false;
    }
    
    // Get the component storage
    const storage = this.componentStorages.get(componentTypeId);
    if (!storage) {
      return false;
    }
    
    // Check if the entity has the component
    return storage.has(entityId);
  }
  
  /**
   * Remove a component from an entity
   */
  public removeComponent(entityId: EntityId, componentTypeId: ComponentId): ComponentClass | undefined {
    // Check if entity exists
    if (!this.hasEntity(entityId)) {
      return undefined;
    }
    
    // Get the component storage
    const storage = this.componentStorages.get(componentTypeId);
    if (!storage) {
      return undefined;
    }
    
    // Check if has component
    if (!storage.has(entityId)) {
      return undefined;
    }
    
    // Get current component types before removal
    const oldComponentTypes = this.getEntityComponentTypes(entityId);
    
    // Remove the component
    const component = storage.remove(entityId);
    
    // Update archetypes
    const newComponentTypes = oldComponentTypes.filter(id => id !== componentTypeId);
    this.updateEntityArchetypes(entityId, oldComponentTypes, newComponentTypes);
    
    // Emit component removed event
    const entity = this.entities.get(entityId)!;
    eventEmitter.emit(EntityEventType.COMPONENT_REMOVED, entity, component);
    
    return component;
  }
  
  /**
   * Query entities based on components, tags, and filters
   */
  public queryEntities(options: EntityQueryOptions = {}): Entity[] {
    // Start with all entities
    let result: Set<EntityId> = new Set(this.entities.keys());
    
    // Filter by required components
    if (options.withComponents && options.withComponents.length > 0) {
      for (const componentId of options.withComponents) {
        const storage = this.componentStorages.get(componentId);
        if (!storage || storage.count() === 0) {
          // No entities have this component
          return [];
        }
        
        const entitiesWithComponent = storage.getEntities();
        result = new Set([...result].filter(id => entitiesWithComponent.includes(id)));
        
        if (result.size === 0) {
          // No entities left after filtering
          return [];
        }
      }
    }
    
    // Filter by excluded components
    if (options.withoutComponents && options.withoutComponents.length > 0) {
      for (const componentId of options.withoutComponents) {
        const storage = this.componentStorages.get(componentId);
        if (storage) {
          const entitiesWithComponent = storage.getEntities();
          entitiesWithComponent.forEach(id => result.delete(id));
        }
      }
    }
    
    // Filter by required tags
    if (options.withTags && options.withTags.length > 0) {
      for (const tag of options.withTags) {
        const entitiesWithTag = this.entityTags.get(tag);
        if (!entitiesWithTag || entitiesWithTag.size === 0) {
          // No entities have this tag
          return [];
        }
        
        result = new Set([...result].filter(id => entitiesWithTag.has(id)));
        
        if (result.size === 0) {
          // No entities left after filtering
          return [];
        }
      }
    }
    
    // Filter by excluded tags
    if (options.withoutTags && options.withoutTags.length > 0) {
      for (const tag of options.withoutTags) {
        const entitiesWithTag = this.entityTags.get(tag);
        if (entitiesWithTag) {
          entitiesWithTag.forEach(id => result.delete(id));
        }
      }
    }
    
    // Apply custom filter if provided
    if (options.filter) {
      const entities = [...result].map(id => this.entities.get(id)!);
      const filteredEntities = entities.filter(entity => options.filter!(entity));
      return filteredEntities;
    }
    
    // Convert result set to array of entities
    return [...result].map(id => this.entities.get(id)!);
  }
  
  /**
   * Get all entities with a specific component
   */
  public getEntitiesWithComponent(componentTypeId: ComponentId): Entity[] {
    const storage = this.componentStorages.get(componentTypeId);
    if (!storage) {
      return [];
    }
    
    return storage.getEntities().map(id => this.entities.get(id)!);
  }
  
  /**
   * Get all entities with a specific tag
   */
  public getEntitiesWithTag(tag: string): Entity[] {
    const entityIds = this.entityTags.get(tag);
    if (!entityIds) {
      return [];
    }
    
    return [...entityIds].map(id => this.entities.get(id)!);
  }
  
  /**
   * Clear all entities and components
   */
  public clear(): void {
    // Clear all entities
    for (const entityId of this.entities.keys()) {
      this.destroyEntity(entityId);
    }
    
    // Clear all component storages
    this.componentStorages.clear();
    
    // Clear all entity archetypes
    this.entityArchetypes.clear();
    
    // Clear all entity tags
    this.entityTags.clear();
  }
  
  /**
   * Serialize all entities
   */
  public serialize(): Record<string, any> {
    const entities: Record<string, any>[] = [];
    
    for (const entity of this.entities.values()) {
      const serializedEntity = entity.serialize();
      
      // Add components
      const components: Record<string, any> = {};
      for (const [componentTypeId, storage] of this.componentStorages.entries()) {
        const component = storage.get(entity.id);
        if (component) {
          components[componentTypeId] = component.serialize();
        }
      }
      
      serializedEntity.components = components;
      entities.push(serializedEntity);
    }
    
    return { entities };
  }
  
  /**
   * Deserialize entities
   */
  public deserialize(data: Record<string, any>): void {
    // Clear existing entities
    this.clear();
    
    // Deserialize entities
    if (Array.isArray(data.entities)) {
      for (const entityData of data.entities) {
        // Create entity
        const entity = this.createEntity({
          id: entityData.id,
          name: entityData.name,
          tags: entityData.tags
        });
        
        // Add components
        if (entityData.components) {
          for (const [componentTypeId, componentData] of Object.entries(entityData.components)) {
            // Create component
            const componentType = componentRegistry.getById(componentTypeId);
            if (componentType) {
              const component = componentType.create();
              component.deserialize(componentData as Record<string, any>);
              this.addComponent(entity.id, component as ComponentClass);
            }
          }
        }
      }
    }
  }
}

// Create a global entity manager instance
export const entityManager = new EntityManager();
