/**
 * TerraFlux - Entity Component System Core Types
 * 
 * This file defines the core types used throughout the ECS implementation.
 */

/** Entity identifier type - Unique ID for each entity */
export type EntityId = string;

/** Component identifier type - Unique ID for each component type */
export type ComponentId = string;

/** System identifier type - Unique ID for each system */
export type SystemId = string;

/** Component type identifier - Used for component registration and lookup */
export type ComponentType<T extends Component = Component> = {
  /** Unique identifier for the component type */
  id: ComponentId;
  /** Human-readable name for the component type */
  name: string;
  /** Create a new instance of the component type */
  create(): T;
};

/** Base interface for all components */
export interface Component {
  /** Type ID of this component */
  readonly typeId: ComponentId;
  /** Get the unique instance ID for this component */
  readonly instanceId: string;
  /** Clone the component to create a new instance with the same data */
  clone(): Component;
  /** Reset the component to its initial state for reuse from pool */
  reset(): void;
  /** Serialize the component to a JSON-compatible object */
  serialize(): Record<string, any>;
  /** Deserialize the component from a JSON-compatible object */
  deserialize(data: Record<string, any>): void;
}

/** Entity filter predicate type - Used for querying entities */
export type EntityFilterPredicate = (entity: any) => boolean;

/** Entity query options - Used for system entity queries */
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

/** Entity query result type - Used for system queries */
export type EntityQueryResult = {
  entity: any;
  components: Record<string, Component>;
}[];

/** Entity event types */
export enum EntityEventType {
  CREATED = 'entity_created',
  DESTROYED = 'entity_destroyed',
  COMPONENT_ADDED = 'component_added',
  COMPONENT_REMOVED = 'component_removed',
  TAG_ADDED = 'tag_added',
  TAG_REMOVED = 'tag_removed',
}

/** Component storage strategy types */
export enum ComponentStorageType {
  /** Array of Structs - Each entity's components are stored together */
  ARRAY_OF_STRUCTS = 'array_of_structs',
  /** Struct of Arrays - Each component type is stored in its own array */
  STRUCT_OF_ARRAYS = 'struct_of_arrays',
}

/** System update priority levels - Higher values run earlier */
export enum SystemPriority {
  HIGHEST = 1000,
  HIGH = 800,
  NORMAL = 500,
  LOW = 200,
  LOWEST = 0,
}

/** System event types */
export enum SystemEventType {
  INITIALIZED = 'system_initialized',
  UPDATED = 'system_updated',
  DESTROYED = 'system_destroyed',
}

/** System dependency definition */
export type SystemDependency = {
  /** The system that depends on another system */
  dependent: SystemId;
  /** The system that must run before the dependent system */
  dependsOn: SystemId;
};

/** Event callback type */
export type EventCallback = (...args: any[]) => void;

/** Event subscription token type */
export type SubscriptionToken = string;

/** Entity archetype - Combination of component types defining a type of entity */
export type EntityArchetype = ComponentId[];
