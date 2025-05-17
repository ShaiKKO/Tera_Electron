/**
 * Types for the World Exploration System
 */

// Define Vector2 interface for position coordinates
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Represents the visibility state of a tile in the game world.
 */
export enum VisibilityState {
    /**
     * The tile has never been seen by the player.
     */
    UNEXPLORED = 'unexplored',
    
    /**
     * The tile has been seen before but is not currently in direct vision.
     * It may be outdated or partially remembered.
     */
    PARTIALLY_EXPLORED = 'partially_explored',
    
    /**
     * The tile is currently in direct vision and fully visible.
     */
    FULLY_EXPLORED = 'fully_explored'
}

/**
 * Types of discoveries that can be made in the game world.
 */
export enum DiscoveryType {
    /**
     * Basic resource discovery (wood, metal, crystal, etc.)
     */
    RESOURCE = 'resource',
    
    /**
     * Special geographical feature (mountain peak, valley, etc.)
     */
    GEOGRAPHICAL = 'geographical',
    
    /**
     * Rare or unique location with special properties
     */
    SPECIAL_LOCATION = 'special_location',
    
    /**
     * Unusual anomaly with potentially unknown effects
     */
    ANOMALY = 'anomaly',
    
    /**
     * Remnants of ancient civilizations or technology
     */
    ARTIFACT = 'artifact'
}

/**
 * Represents a rectangular area in the world.
 */
export interface BoundingBox {
    /**
     * X coordinate of the top-left corner
     */
    x: number;
    
    /**
     * Y coordinate of the top-left corner
     */
    y: number;
    
    /**
     * Width of the bounding box
     */
    width: number;
    
    /**
     * Height of the bounding box
     */
    height: number;
}

/**
 * Represents a discovery event in the game world.
 */
export interface DiscoveryEvent {
    /**
     * Type of discovery
     */
    type: DiscoveryType;
    
    /**
     * World position of the discovery
     */
    location: Vector2;
    
    /**
     * Identifier of the player or colony that made the discovery
     */
    discoveredBy: string;
    
    /**
     * Unix timestamp when the discovery was made
     */
    timestamp: number;
    
    /**
     * Additional data related to the discovery
     */
    metadata: any;
}

/**
 * Statistics about discoveries made by a player or colony.
 */
export interface DiscoveryStatistics {
    /**
     * Total number of discoveries made
     */
    total: number;
    
    /**
     * Number of discoveries by type
     */
    byType: Record<DiscoveryType, number>;
    
    /**
     * First discovery timestamp
     */
    firstDiscovery: number;
    
    /**
     * Latest discovery timestamp
     */
    latestDiscovery: number;
}

/**
 * Represents a fog of war chunk that stores visibility state for a section of the world.
 */
export interface FogOfWarChunk {
    /**
     * Mapping of tile coordinates to their visibility states
     * The key format is "q,r" for hex coordinates
     */
    tileStates: Map<string, VisibilityState>;
    
    /**
     * Timestamp when this chunk was last updated
     */
    lastUpdated: number;
    
    /**
     * Chunk coordinates in the chunk grid
     */
    chunkX: number;
    
    /**
     * Chunk coordinates in the chunk grid
     */
    chunkY: number;
}

/**
 * Configuration for visibility calculation parameters.
 */
export interface VisibilityConfig {
    /**
     * Base view range in tile units
     */
    baseViewRange: number;
    
    /**
     * Maximum view range in tile units
     */
    maxViewRange: number;
    
    /**
     * How much elevation increases view range
     */
    elevationViewBonus: number;
    
    /**
     * How weather affects view range (as a multiplier)
     */
    weatherFactor: number;
    
    /**
     * Whether partial visibility beyond obstacles is enabled
     */
    enablePartialVisibility: boolean;
}

/**
 * Different modes for minimap display.
 */
export enum MinimapMode {
    /**
     * Show terrain types (default)
     */
    TERRAIN = 'terrain',
    
    /**
     * Show resource locations and types
     */
    RESOURCES = 'resources',
    
    /**
     * Show elevation levels
     */
    ELEVATION = 'elevation',
    
    /**
     * Show ownership and territories
     */
    OWNERSHIP = 'ownership'
}
