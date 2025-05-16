/**
 * TerraFlux - Type Registry
 * 
 * A type-safe registry for component types and other game object types.
 * Allows for registration, lookup, and validation of types by ID or name.
 */

import { UUID } from './UUID';
import { ComponentId, ComponentType, Component } from '../ecs/types';

/**
 * Generic type registry for managing registrations of any type
 */
export class TypeRegistry<T extends { id: string; name: string }> {
  /**
   * Maps type IDs to their registration details
   */
  private registry: Map<string, T> = new Map();
  
  /**
   * Maps type names to their IDs for name-based lookups
   */
  private nameIndex: Map<string, string> = new Map();
  
  /**
   * Register a new type
   * 
   * @param type The type to register
   * @returns The same type (for chaining)
   * @throws Error if a type with the same ID is already registered
   */
  public register(type: T): T {
    // Check if already registered
    if (this.registry.has(type.id)) {
      throw new Error(`Type with ID '${type.id}' is already registered.`);
    }
    
    // Check for conflicting name
    if (this.nameIndex.has(type.name)) {
      throw new Error(`Type with name '${type.name}' is already registered with ID '${this.nameIndex.get(type.name)}'.`);
    }
    
    // Add to registry and index by name
    this.registry.set(type.id, type);
    this.nameIndex.set(type.name, type.id);
    
    return type;
  }
  
  /**
   * Get a type by its ID
   * 
   * @param id The ID of the type to retrieve
   * @returns The registered type or undefined if not found
   */
  public getById(id: string): T | undefined {
    return this.registry.get(id);
  }
  
  /**
   * Get a type by its name
   * 
   * @param name The name of the type to retrieve
   * @returns The registered type or undefined if not found
   */
  public getByName(name: string): T | undefined {
    const id = this.nameIndex.get(name);
    return id ? this.registry.get(id) : undefined;
  }
  
  /**
   * Check if a type with the given ID is registered
   * 
   * @param id The ID to check
   * @returns True if a type with the given ID is registered
   */
  public hasId(id: string): boolean {
    return this.registry.has(id);
  }
  
  /**
   * Check if a type with the given name is registered
   * 
   * @param name The name to check
   * @returns True if a type with the given name is registered
   */
  public hasName(name: string): boolean {
    return this.nameIndex.has(name);
  }
  
  /**
   * Unregister a type by ID
   * 
   * @param id The ID of the type to unregister
   * @returns True if the type was successfully unregistered
   */
  public unregister(id: string): boolean {
    const type = this.registry.get(id);
    if (!type) {
      return false;
    }
    
    // Remove from name index
    this.nameIndex.delete(type.name);
    
    // Remove from registry
    return this.registry.delete(id);
  }
  
  /**
   * Get all registered types
   * 
   * @returns Array of all registered types
   */
  public getAll(): T[] {
    return Array.from(this.registry.values());
  }
  
  /**
   * Get the number of registered types
   * 
   * @returns The number of registered types
   */
  public get count(): number {
    return this.registry.size;
  }
  
  /**
   * Clear all registered types
   */
  public clear(): void {
    this.registry.clear();
    this.nameIndex.clear();
  }
}

/**
 * Registry specifically for component types
 */
export class ComponentRegistry extends TypeRegistry<ComponentType> {  
  /**
   * Register a new component type with automatic ID generation
   * 
   * @param name Human-readable component name
   * @param createFn Factory function to create new instances
   * @returns The registered component type
   */
  public registerComponentType<T extends Component>(
    name: string,
    createFn: () => T
  ): ComponentType<T> {
    // Generate a stable ID based on the component name
    const id: ComponentId = UUID.generateComponentId(name);
    
    // Create the component type descriptor
    const componentType: ComponentType<T> = {
      id,
      name,
      create: createFn
    };
    
    // Register it in the base registry
    return this.register(componentType) as ComponentType<T>;
  }
  
  /**
   * Create a new instance of a component by type name
   * 
   * @param name The name of the component type
   * @returns A new component instance or undefined if type not found
   */
  public createByName(name: string): Component | undefined {
    const componentType = this.getByName(name);
    return componentType ? componentType.create() : undefined;
  }
  
  /**
   * Create a new instance of a component by type ID
   * 
   * @param id The ID of the component type
   * @returns A new component instance or undefined if type not found
   */
  public createById(id: ComponentId): Component | undefined {
    const componentType = this.getById(id);
    return componentType ? componentType.create() : undefined;
  }
}

// Create a global instance of the component registry
export const componentRegistry = new ComponentRegistry();
