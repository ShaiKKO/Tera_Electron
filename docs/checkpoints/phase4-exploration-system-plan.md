# TerraFlux Phase 4.3: World Exploration System Plan

This document outlines the design and implementation plan for the World Exploration System in TerraFlux, which represents the next stage of development after completing the Procedural Generation system.

## System Requirements

### 1. Fog of War System
- Implement a fog system that obscures unexplored areas of the world
- Create different visibility states (unexplored, partially explored, fully explored)
- Ensure efficient storage of visibility state data for large worlds
- Implement serialization/deserialization of fog of war state

### 2. Exploration Tracking
- Track explored areas per player/colony
- Record discovery timestamps and statistics
- Implement different levels of exploration detail
- Create a system for marking points of interest upon discovery

### 3. Visibility Calculations
- Implement line-of-sight algorithms for hex grid
- Create visibility range modifiers based on terrain, elevation, and other factors
- Optimize visibility calculations to efficiently handle large areas
- Support dynamic updates when terrain or other factors change

### 4. Discovery System
- Create a system for special feature discovery (resources, anomalies, etc.)
- Implement "partially revealed" state for distant but visible features
- Add discovery notifications and logging
- Support different discovery methods (direct sight, scanning, etc.)

### 5. Minimap Visualization
- Implement a minimap system that displays the world at various zoom levels
- Create fog of war visualization for the minimap
- Add support for different map modes (terrain, resources, etc.)
- Implement minimap navigation controls

## Implementation Approach

### Structure Overview

We'll create several key classes to handle the exploration system:

1. **FogOfWarManager**: Central manager for fog of war state
2. **ExplorationTracker**: Tracking exploration progress and discoveries
3. **VisibilityCalculator**: Handling line-of-sight and visibility calculations
4. **MinimapRenderer**: Specialized renderer for the minimap visualization

### Fog of War Data Structure

The fog of war system will use a chunked data structure:

```typescript
enum VisibilityState {
    UNEXPLORED,          // Never seen
    PARTIALLY_EXPLORED,  // Seen but not in direct vision
    FULLY_EXPLORED       // Currently in direct vision
}

class FogOfWarChunk {
    tileStates: Map<string, VisibilityState>; // Mapping of tile coordinates to states
    lastUpdated: number; // Timestamp for optimization
}

class FogOfWarManager {
    chunks: Map<string, FogOfWarChunk>;
    
    // Core methods
    getTileVisibility(x: number, y: number): VisibilityState;
    setTileVisibility(x: number, y: number, state: VisibilityState): void;
    updateVisibility(viewerPosition: Vector2, viewRange: number): void;
    
    // Advanced methods
    revealArea(center: Vector2, radius: number): void;
    isAreaExplored(area: BoundingBox): boolean;
    
    // Serialization
    serialize(): any;
    deserialize(data: any): void;
}
```

### Visibility Calculation Algorithm

The visibility calculation will use a modified hex-grid ray-casting algorithm:

1. From the viewer position, cast rays to all tiles within view range
2. For each ray:
   - Step along the ray in hex grid space
   - Check for visibility blockers (tall terrain, buildings, etc.)
   - Mark tiles as visible until a blocker is encountered
   - Apply partial visibility to some tiles beyond blockers based on height differences
3. Update the fog of war map with new visibility information

### Discovery System Events

The discovery system will use an event-driven approach:

```typescript
interface DiscoveryEvent {
    type: DiscoveryType;       // Resource, special feature, etc.
    location: Vector2;         // World position of discovery
    discoveredBy: string;      // Player/colony identifier
    timestamp: number;         // When it was discovered
    metadata: any;             // Additional discovery data
}

class DiscoveryManager {
    discoveries: DiscoveryEvent[];
    
    registerDiscovery(event: DiscoveryEvent): void;
    hasDiscovered(type: DiscoveryType, location: Vector2): boolean;
    getDiscoveriesInArea(area: BoundingBox): DiscoveryEvent[];
    getDiscoveryStatistics(): DiscoveryStatistics;
}
```

### Minimap Implementation

The minimap will support multiple zoom levels and rendering modes:

```typescript
enum MinimapMode {
    TERRAIN,
    RESOURCES,
    ELEVATION,
    OWNERSHIP
}

class MinimapRenderer {
    mode: MinimapMode;
    zoomLevel: number;
    
    renderToTexture(worldBounds: BoundingBox): PIXI.Texture;
    updateTexture(changedArea: BoundingBox): void;
    setMode(mode: MinimapMode): void;
    setZoomLevel(level: number): void;
}
```

## Integration Points

The exploration system will integrate with several existing systems:

1. **Rendering System**: For fog of war and minimap visualization
2. **World System**: To access terrain and feature data for visibility calculations
3. **Input System**: For minimap interaction
4. **UI System**: To display discovery notifications and minimap
5. **Save System**: For serialization/deserialization of exploration state

## Testing Strategy

We will create dedicated test scenarios to verify:

1. **Fog of War Accuracy**: Verify visibility calculations across various terrains
2. **Performance**: Test with large worlds to ensure efficiency
3. **Discovery System**: Verify correct triggering of discoveries and notifications
4. **Minimap Rendering**: Test different modes and zoom levels

## Development Sequence

1. Implement basic FogOfWarManager with data structures
2. Add visibility calculation algorithm
3. Create exploration tracking and discovery system
4. Implement minimap visualization
5. Add serialization/deserialization support
6. Integrate with existing systems
7. Optimize performance for large worlds

## Success Criteria

The World Exploration System implementation will be considered complete when:

1. Players can explore an initially fogged world with proper visibility calculations
2. Discoveries are correctly tracked and displayed
3. The minimap provides an effective overview of explored areas
4. The system performs efficiently under various world sizes
5. All state can be properly saved and loaded

This phase represents a critical foundation for the player's interaction with the procedurally generated world and will set the stage for the subsequent World Interaction System implementation.
