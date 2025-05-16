/**
 * TerraFlux - Component Base Class
 * 
 * Provides the foundation for all components in the ECS architecture.
 * Components are pure data containers with minimal logic.
 */

import { Component as ComponentInterface, ComponentId } from './types';
import { UUID } from '../utils/UUID';

/**
 * Abstract base class for all components
 */
export abstract class Component implements ComponentInterface {
  /**
   * Unique instance ID for this component
   */
  private readonly _instanceId: string;
  
  /**
   * Type ID of this component - must be set by derived classes
   */
  public abstract readonly typeId: ComponentId;
  
  /**
   * Constructor for Component
   */
  constructor() {
    this._instanceId = UUID.generateWithPrefix('comp-inst');
  }
  
  /**
   * Get the unique instance ID for this component
   */
  public get instanceId(): string {
    return this._instanceId;
  }
  
  /**
   * Clone this component to create a new instance with the same data
   * Derived classes should override this to properly copy their data
   */
  public clone(): Component {
    // This is a basic implementation that should be overridden
    // by derived classes to properly copy their data
    const clone = Object.create(Object.getPrototypeOf(this));
    return Object.assign(clone, this);
  }
  
  /**
   * Reset the component to its initial state for reuse from pool
   * Derived classes should override this to properly reset their data
   */
  public reset(): void {
    // This is a basic implementation that should be overridden
    // by derived classes to properly reset their data
  }
  
  /**
   * Serialize the component to a JSON-compatible object
   * Derived classes should override this to properly serialize their data
   * 
   * @returns A JSON-compatible object representing this component's data
   */
  public serialize(): Record<string, any> {
    // Default implementation - derived classes should override
    return {
      typeId: this.typeId,
      instanceId: this.instanceId
    };
  }
  
  /**
   * Deserialize the component from a JSON-compatible object
   * Derived classes should override this to properly deserialize their data
   * 
   * @param data A JSON-compatible object to deserialize from
   */
  public deserialize(data: Record<string, any>): void {
    // Default implementation - derived classes should override
    // Most implementations will do nothing with typeId and instanceId
    // as these are typically immutable, but may be used for validation
  }
  
  /**
   * Creates an object pool factory for this component type
   * This can be used to efficiently reuse component instances
   * 
   * @param ComponentClass The component class to create a pool for
   * @param initialSize The initial size of the pool
   * @param growthFactor How much to grow the pool by when more instances are needed
   * @returns A factory function that creates/reuses component instances
   */
  public static createPool<T extends Component>(
    ComponentClass: new () => T,
    initialSize: number = 10,
    growthFactor: number = 5
  ): () => T {
    // Create the initial pool of components
    const pool: T[] = Array(initialSize)
      .fill(null)
      .map(() => new ComponentClass());
    
    // Return a factory function that gets from the pool or creates new instances
    return () => {
      // If there are no components left in the pool, add more
      if (pool.length === 0) {
        for (let i = 0; i < growthFactor; i++) {
          pool.push(new ComponentClass());
        }
      }
      
      // Return a component from the pool
      const component = pool.pop()!;
      component.reset(); // Ensure the component is reset to initial state
      return component;
    };
  }
}
