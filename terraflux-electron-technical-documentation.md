# TerraFlux Technical Documentation

## Project Overview

TerraFlux is a colony simulation and exploration game inspired by RimWorld's design and camera system. Players manage a colony of explorers on a hexagonal world map, build structures on a grid-based system, gather resources, and interact with other players through contained multiplayer elements. This document outlines the technical specifications for implementing TerraFlux as a desktop application using Electron.

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Application Architecture](#application-architecture)
3. [Core Game Systems](#core-game-systems)
4. [World Generation System](#world-generation-system)
5. [Colony Management System](#colony-management-system)
6. [Character System](#character-system)
7. [Building System](#building-system)
8. [Resource System](#resource-system)
9. [Expedition System](#expedition-system)
10. [Rendering System](#rendering-system) (COMPLETED - Phase 3)
11. [User Interface](#user-interface)
12. [Multiplayer Implementation](#multiplayer-implementation)
13. [Data Persistence](#data-persistence)
14. [Modding Support](#modding-support)
15. [Development Workflow](#development-workflow)
16. [Build and Deployment](#build-and-deployment)
17. [Performance Optimization](#performance-optimization)
18. [Testing Strategy](#testing-strategy)

---

## Technology Stack

### Core Technologies

- **Application Framework**: Electron 28.0+
- **Frontend Framework**: React 18.0+
- **State Management**: Redux + Redux Toolkit
- **Rendering Engine**: PixiJS 7.0+ (WebGL-based 2D renderer)
- **Backend (for multiplayer)**: SpacetimeDB
- **Database**: SQLite (local storage) + SpacetimeDB (multiplayer)
- **Build Tools**: Webpack, Babel, TypeScript
- **Testing**: Jest, React Testing Library
- **Package Management**: npm or yarn

### Development Environment

- **IDE**: Visual Studio Code
- **Version Control**: Git
- **AI Assistance**: Claude 3.7 Sonnet integrated in VS Code
- **Project Management**: GitHub Projects or Trello

### Key Libraries and Utilities

- **Multiplayer**: SpacetimeDB SDK for real-time synchronization
- **Pathfinding**: PathFinding.js or custom A* implementation
- **UI Components**: Ant Design or custom components
- **Animation**: GSAP for UI animations
- **Sound**: Howler.js for audio management
- **Localization**: i18next for translations
- **Analytics**: Simple analytics for game metrics
- **Serialization**: JSON with compression for save files

---

## Application Architecture

### Electron Application Structure

```
TerraFlux/
├── package.json
├── electron/
│   ├── main.js          # Main Electron process
│   ├── preload.js       # Preload script
│   └── ipc/             # IPC handlers
├── src/
│   ├── index.html       # Main HTML entry
│   ├── renderer.js      # Renderer process entry
│   ├── app/             # React application
│   ├── game/            # Game core systems
│   ├── assets/          # Game assets
│   └── utils/           # Utilities
├── build/               # Build scripts
└── dist/                # Distributable output
```

### Process Communication

TerraFlux leverages Electron's two-process architecture:

1. **Main Process**:
   - Handles window management
   - Manages file system operations (saves, mods)
   - Controls application lifecycle
   - Interfaces with OS (notifications, dialogs)
   - Implements structured error handling and logging

2. **Renderer Process**:
   - Contains the React application and game logic
   - Renders the game using PixiJS
   - Processes user input
   - Manages game state

3. **IPC Communication**:
   - Formal IPC protocol with defined message structure
   - Type-safe bidirectional communication between processes
   - Secure preload script pattern for exposing main process functionality
   - Handles save/load operations
   - Manages mod loading
   - Controls application settings

#### IPC Protocol Structure

```typescript
// Message type definitions
interface IPCMessage<T = any> {
  type: string;       // Message identifier
  payload?: T;        // Optional payload data
  correlationId?: string;  // For request/response correlation
  timestamp: number;  // Message creation time
}

// Request/response pattern
interface IPCRequest<T = any> extends IPCMessage<T> {
  responseRequired: boolean;
}

interface IPCResponse<T = any> extends IPCMessage<T> {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

// Example request handler in main process
ipcMain.handle('game:save', async (event, request: IPCRequest<SaveGameData>) => {
  try {
    const result = await saveGameToFile(request.payload);
    return {
      type: 'game:save:response',
      correlationId: request.correlationId,
      timestamp: Date.now(),
      success: true,
      payload: { savedFilePath: result.path }
    } as IPCResponse;
  } catch (error) {
    return {
      type: 'game:save:response',
      correlationId: request.correlationId,
      timestamp: Date.now(),
      success: false,
      error: { 
        code: 'SAVE_FAILED', 
        message: error.message 
      }
    } as IPCResponse;
  }
});

// Example request from renderer
const saveGame = async (data: SaveGameData): Promise<SaveResult> => {
  const request: IPCRequest<SaveGameData> = {
    type: 'game:save',
    payload: data,
    correlationId: generateUUID(),
    timestamp: Date.now(),
    responseRequired: true
  };
  
  const response = await ipcRenderer.invoke('game:save', request);
  
  if (!response.success) {
    throw new Error(`Save failed: ${response.error.message}`);
  }
  
  return response.payload;
};
```

#### Error Handling Framework

```typescript
// Structured error types
enum ErrorSeverity {
  INFO,
  WARNING,
  ERROR,
  CRITICAL
}

interface ApplicationError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  details?: any;
  timestamp: number;
  stackTrace?: string;
}

// Centralized error handling in both processes
class ErrorHandler {
  public static handleError(error: ApplicationError): void {
    // Log the error
    this.logError(error);
    
    // For critical errors, show dialog to user
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.showErrorDialog(error);
    }
    
    // Optionally report to analytics
    if (error.severity >= ErrorSeverity.ERROR) {
      this.reportToAnalytics(error);
    }
  }
  
  private static logError(error: ApplicationError): void {
    console.error(`[${error.code}] ${error.message}`, error.details);
    
    // Also log to file in main process
    if (isMainProcess()) {
      logToFile(error);
    }
  }
  
  private static showErrorDialog(error: ApplicationError): void {
    // Show appropriate error dialog
  }
  
  private static reportToAnalytics(error: ApplicationError): void {
    // Send error data to analytics service
  }
}
```

### Core Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                                             │
│               MAIN PROCESS                  │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Window  │  │ File     │  │ App        │  │
│  │ Manager │  │ System   │  │ Lifecycle  │  │
│  └─────────┘  └──────────┘  └────────────┘  │
│        │            │             │         │
└────────┼────────────┼─────────────┼─────────┘
         │            │             │          
         └────────────┼─────────────┘          
                      │                        
                     IPC                       
                      │                        
┌─────────────────────┼─────────────────────┐
│                     │                     │
│              RENDERER PROCESS             │
│                                           │
│  ┌─────────┐    ┌───────────────────────┐ │
│  │ React   │◄──►│      Game Core        │ │
│  │ UI      │    │                       │ │
│  └─────────┘    │  ┌─────┐  ┌────────┐  │ │
│                 │  │ECS  │  │Systems │  │ │
│  ┌─────────┐    │  └─────┘  └────────┘  │ │
│  │ Redux   │◄──►│                       │ │
│  │ Store   │    └───────────────────────┘ │
│  └─────────┘             ▲                │
│                          │                │
│                          ▼                │
│              ┌────────────────────┐       │
│              │    PixiJS Renderer │       │
│              └────────────────────┘       │
│                                           │
└───────────────────────────────────────────┘
```

### Game Core Architecture

TerraFlux uses an Entity-Component-System (ECS) architecture for game logic:

1. **Entities**: Game objects (colonists, buildings, resources)
2. **Components**: Data attached to entities (position, health, inventory)
3. **Systems**: Logic that operates on entities with specific components

This architecture provides:
- Clean separation of data and logic
- Improved performance through data-oriented design
- Enhanced testability and modularity

### State Management

The game state is managed through a combination of:

1. **Redux**: For UI state and global game state
2. **ECS**: For game entity state
3. **Local Storage**: For persistence of game settings
4. **File System**: For save games and mod data

---

## Core Game Systems

### Game Loop System

The game loop manages the update cycle for all game systems. It supports variable time steps and pause/resume functionality, similar to RimWorld's time controls.

```typescript
class GameLoop {
    private systems: System[];
    private lastTimestamp: number = 0;
    private timeScale: number = 1.0; // 0 = paused, 1 = normal, 2 = fast, 3 = ultra
    private isRunning: boolean = false;
    
    constructor(systems: System[]) {
        this.systems = systems;
    }
    
    public start(): void {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTimestamp = performance.now();
            requestAnimationFrame(this.update.bind(this));
        }
    }
    
    private update(timestamp: number): void {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const deltaTime = (now - this.lastTimestamp) / 1000 * this.timeScale;
        this.lastTimestamp = now;
        
        // Skip update if game is paused
        if (this.timeScale > 0) {
            // Update all systems
            for (const system of this.systems) {
                system.update(deltaTime);
            }
        }
        
        // Always render, even when paused
        this.systems.find(s => s instanceof RenderSystem)?.update(0);
        
        // Continue the loop
        requestAnimationFrame(this.update.bind(this));
    }
    
    public setTimeScale(scale: number): void {
        this.timeScale = Math.max(0, Math.min(3, scale));
    }
    
    public pause(): void {
        this.timeScale = 0;
    }
    
    public resume(speed: number = 1): void {
        this.timeScale = speed;
    }
    
    public stop(): void {
        this.isRunning = false;
    }
}
```

### Entity-Component-System Implementation

#### Component Storage Strategy

TerraFlux uses two approaches for component storage, optimizing for different use cases:

1. **Array of Structs (AoS)**:
   - Used for components with variable data or components that are rarely iterated through
   - Better encapsulation and more object-oriented
   - Easier to manage for components with complex behavior

2. **Struct of Arrays (SoA)**:
   - Used for components that are frequently processed in systems
   - Better cache locality during system updates
   - More efficient for position, velocity, and other commonly accessed components
   - Enables SIMD optimizations

```typescript
// Component storage manager with SoA approach for common components
class ComponentStorage<T> {
    private data: Record<string, any[]> = {};
    private entityIndices: Map<string, number> = new Map();
    private freeIndices: number[] = [];
    private count: number = 0;
    
    constructor(private schema: Record<string, string>) {
        // Initialize arrays for each property in schema
        for (const prop of Object.keys(schema)) {
            this.data[prop] = [];
        }
    }
    
    public add(entityId: string, component: T): number {
        let index: number;
        
        // Reuse a free slot if available
        if (this.freeIndices.length > 0) {
            index = this.freeIndices.pop()!;
        } else {
            index = this.count++;
        }
        
        // Store component data
        for (const prop of Object.keys(this.schema)) {
            this.data[prop][index] = (component as any)[prop];
        }
        
        // Map entity ID to component index
        this.entityIndices.set(entityId, index);
        return index;
    }
    
    public remove(entityId: string): boolean {
        const index = this.entityIndices.get(entityId);
        if (index === undefined) return false;
        
        // Add index to free list
        this.freeIndices.push(index);
        
        // Remove entity mapping
        this.entityIndices.delete(entityId);
        return true;
    }
    
    public get(entityId: string): T | undefined {
        const index = this.entityIndices.get(entityId);
        if (index === undefined) return undefined;
        
        // Create object from arrays
        const result = {} as any;
        for (const prop of Object.keys(this.schema)) {
            result[prop] = this.data[prop][index];
        }
        
        return result as T;
    }
    
    public update(entityId: string, updater: (component: T) => void): boolean {
        const component = this.get(entityId);
        if (!component) return false;
        
        // Update component
        updater(component);
        
        // Store updated values
        const index = this.entityIndices.get(entityId)!;
        for (const prop of Object.keys(this.schema)) {
            this.data[prop][index] = (component as any)[prop];
        }
        
        return true;
    }
    
    // Process all components with a callback
    public each(callback: (entityId: string, component: T) => void): void {
        for (const [entityId, index] of this.entityIndices.entries()) {
            const component = {} as any;
            for (const prop of Object.keys(this.schema)) {
                component[prop] = this.data[prop][index];
            }
            callback(entityId, component as T);
        }
    }
    
    // Direct access to raw arrays for systems that need maximum performance
    public getRawData(): Record<string, any[]> {
        return this.data;
    }
}

// Usage example:
// For components like Position, Velocity that are accessed often
const positionComponents = new ComponentStorage<PositionComponent>({
    x: 'number',
    y: 'number'
});

// Entity
class Entity {
    public id: string = uuidv4();
    public components: Map<string, Component> = new Map();
    
    public addComponent(component: Component): this {
        this.components.set(component.type, component);
        component.entity = this;
        return this;
    }
    
    public getComponent<T extends Component>(type: string): T | undefined {
        return this.components.get(type) as T;
    }
    
    public hasComponent(type: string): boolean {
        return this.components.has(type);
    }
    
    public removeComponent(type: string): boolean {
        return this.components.delete(type);
    }
}

// Component base class
abstract class Component {
    public entity: Entity | null = null;
    abstract get type(): string;
}

// Example component
class PositionComponent extends Component {
    public get type(): string { return 'Position'; }
    
    constructor(public x: number, public y: number) {
        super();
    }
}

// System base class
abstract class System {
    protected entities: Entity[] = [];
    
    constructor(protected entityManager: EntityManager) {
        this.entities = this.filterEntities();
        
        // Subscribe to entity events to update filtered entities
        entityManager.onEntityAdded.subscribe(entity => {
            if (this.isEntityRelevant(entity)) {
                this.entities.push(entity);
            }
        });
        
        entityManager.onEntityRemoved.subscribe(entity => {
            const index = this.entities.indexOf(entity);
            if (index !== -1) {
                this.entities.splice(index, 1);
            }
        });
    }
    
    protected abstract isEntityRelevant(entity: Entity): boolean;
    
    protected filterEntities(): Entity[] {
        return this.entityManager.getAllEntities().filter(this.isEntityRelevant.bind(this));
    }
    
    public abstract update(deltaTime: number): void;
}

// Entity Manager
class EntityManager {
    private entities: Map<string, Entity> = new Map();
    public onEntityAdded = new EventEmitter<Entity>();
    public onEntityRemoved = new EventEmitter<Entity>();
    
    public createEntity(): Entity {
        const entity = new Entity();
        this.entities.set(entity.id, entity);
        this.onEntityAdded.emit(entity);
        return entity;
    }
    
    public removeEntity(entityId: string): boolean {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.entities.delete(entityId);
            this.onEntityRemoved.emit(entity);
            return true;
        }
        return false;
    }
    
    public getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }
    
    public getAllEntities(): Entity[] {
        return Array.from(this.entities.values());
    }
}
```

### Coordinate Systems

TerraFlux uses two coordinate systems that need to be converted between:

1. **World Coordinates**: Hex-based for the world map
2. **Grid Coordinates**: Square-based for the colony view

```typescript
class CoordinateSystem {
    // Constants
    private static readonly HEX_SIZE: number = 64;
    private static readonly GRID_SIZE: number = 32;
    
    // Convert hex coordinates to world position
    public static hexToWorld(q: number, r: number): { x: number, y: number } {
        const x = this.HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = this.HEX_SIZE * (3/2 * r);
        return { x, y };
    }
    
    // Convert world position to hex coordinates
    public static worldToHex(x: number, y: number): { q: number, r: number } {
        const r = y * 2/3 / this.HEX_SIZE;
        const q = (x - Math.sqrt(3)/2 * r * this.HEX_SIZE) / (Math.sqrt(3) * this.HEX_SIZE);
        
        // Round to nearest hex
        const [q_rounded, r_rounded] = this.cubeRound(q, r, -q-r);
        
        return { q: q_rounded, r: r_rounded };
    }
    
    // Convert cube coordinates to axial coordinates
    private static cubeRound(q: number, r: number, s: number): [number, number] {
        let rx = Math.round(q);
        let ry = Math.round(r);
        let rz = Math.round(s);
        
        const x_diff = Math.abs(rx - q);
        const y_diff = Math.abs(ry - r);
        const z_diff = Math.abs(rz - s);
        
        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        } else if (y_diff > z_diff) {
            ry = -rx - rz;
        } else {
            rz = -rx - ry;
        }
        
        return [rx, ry];
    }
    
    // Convert grid coordinates to world position
    public static gridToWorld(x: number, y: number): { x: number, y: number } {
        return {
            x: x * this.GRID_SIZE,
            y: y * this.GRID_SIZE
        };
    }
    
    // Convert world position to grid coordinates
    public static worldToGrid(x: number, y: number): { x: number, y: number } {
        return {
            x: Math.floor(x / this.GRID_SIZE),
            y: Math.floor(y / this.GRID_SIZE)
        };
    }
}
```

---

## World Generation System

The World Generation System creates the hex-based world map with diverse biomes and resources.

### World Map Structure

```typescript
class WorldMap {
    private hexTiles: Map<string, HexTile> = new Map();
    private width: number;
    private height: number;
    private seed: number;
    
    constructor(width: number, height: number, seed?: number) {
        this.width = width;
        this.height = height;
        this.seed = seed || Math.random() * 1000000;
    }
    
    public generate(): void {
        const random = new Random(this.seed);
        
        // Generate elevation using perlin noise
        const elevationNoise = new PerlinNoise(random.nextInt(), 8, 0.5);
        const moistureNoise = new PerlinNoise(random.nextInt(), 6, 0.4);
        const temperatureNoise = new PerlinNoise(random.nextInt(), 7, 0.6);
        
        // Create hex grid
        for (let q = -this.width/2; q < this.width/2; q++) {
            for (let r = -this.height/2; r < this.height/2; r++) {
                // Skip if outside circular radius
                if (Math.sqrt(q*q + r*r) > Math.min(this.width, this.height) / 2) {
                    continue;
                }
                
                const worldPos = CoordinateSystem.hexToWorld(q, r);
                const noiseX = worldPos.x * 0.01;
                const noiseY = worldPos.y * 0.01;
                
                // Generate terrain properties
                const elevation = elevationNoise.get(noiseX, noiseY);
                const moisture = moistureNoise.get(noiseX, noiseY);
                const temperature = temperatureNoise.get(noiseX + 100, noiseY + 100);
                
                // Determine biome type based on properties
                const biomeType = this.determineBiomeType(elevation, moisture, temperature);
                
                // Create hex tile
                const hexTile = new HexTile(q, r, biomeType, elevation);
                
                // Add resources based on biome
                this.addResourcesToBiome(hexTile, random);
                
                // Store tile
                this.hexTiles.set(`${q},${r}`, hexTile);
            }
        }
        
        // Generate rivers, mountains, special features, etc.
        this.generateRivers(random);
        this.generateSpecialFeatures(random);
    }
    
    private determineBiomeType(elevation: number, moisture: number, temperature: number): BiomeType {
        // Convert normalized values to appropriate ranges
        const scaledElevation = elevation * 2 - 1;  // -1 to 1
        const scaledMoisture = moisture;            // 0 to 1
        const scaledTemperature = temperature * 2;  // 0 to 2
        
        // Oceans and lakes
        if (scaledElevation < -0.3) {
            return BiomeType.OCEAN;
        }
        
        // Mountain ranges
        if (scaledElevation > 0.6) {
            if (scaledTemperature < 0.8) return BiomeType.SNOW_MOUNTAINS;
            return BiomeType.MOUNTAINS;
        }
        
        // Desert conditions
        if (scaledMoisture < 0.3 && scaledTemperature > 1.2) {
            return BiomeType.DESERT;
        }
        
        // Forest variations
        if (scaledMoisture > 0.6) {
            if (scaledTemperature < 0.8) return BiomeType.PINE_FOREST;
            if (scaledTemperature < 1.3) return BiomeType.FOREST;
            return BiomeType.JUNGLE;
        }
        
        // Plains and grasslands
        if (scaledMoisture > 0.3) {
            if (scaledTemperature < 0.8) return BiomeType.TUNDRA;
            return BiomeType.PLAINS;
        }
        
        // Fallback
        return BiomeType.PLAINS;
    }
    
    private addResourcesToBiome(hexTile: HexTile, random: Random): void {
        // Logic to add appropriate resources based on biome type
        switch (hexTile.biomeType) {
            case BiomeType.FOREST:
                if (random.nextFloat() < 0.8) hexTile.addResource(ResourceType.WOOD, 800 + random.nextInt(400));
                if (random.nextFloat() < 0.5) hexTile.addResource(ResourceType.BERRIES, 200 + random.nextInt(200));
                break;
            case BiomeType.MOUNTAINS:
                if (random.nextFloat() < 0.9) hexTile.addResource(ResourceType.STONE, 1000 + random.nextInt(500));
                if (random.nextFloat() < 0.6) hexTile.addResource(ResourceType.IRON_ORE, 300 + random.nextInt(300));
                if (random.nextFloat() < 0.2) hexTile.addResource(ResourceType.GEMS, 50 + random.nextInt(100));
                break;
            // Similar patterns for other biomes
        }
    }
    
    private generateRivers(random: Random): void {
        // River generation logic
        // ...
    }
    
    private generateSpecialFeatures(random: Random): void {
        // Special features like ruins, unique resources, etc.
        // ...
    }
    
    public getTile(q: number, r: number): HexTile | undefined {
        return this.hexTiles.get(`${q},${r}`);
    }
    
    public getNeighbors(q: number, r: number): HexTile[] {
        const directions = [
            [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]
        ];
        
        return directions
            .map(([dq, dr]) => this.getTile(q + dq, r + dr))
            .filter((tile): tile is HexTile => tile !== undefined);
    }
    
    public serialize(): any {
        // Convert to serializable format
        const serializedTiles: any[] = [];
        for (const [key, tile] of this.hexTiles.entries()) {
            serializedTiles.push(tile.serialize());
        }
        
        return {
            width: this.width,
            height: this.height,
            seed: this.seed,
            tiles: serializedTiles
        };
    }
    
    public static deserialize(data: any): WorldMap {
        const worldMap = new WorldMap(data.width, data.height, data.seed);
        
        // Skip generation as we're loading existing data
        for (const tileData of data.tiles) {
            const tile = HexTile.deserialize(tileData);
            worldMap.hexTiles.set(`${tile.q},${tile.r}`, tile);
        }
        
        return worldMap;
    }
}

class HexTile {
    public q: number;
    public r: number;
    public biomeType: BiomeType;
    public elevation: number;
    public resources: Map<ResourceType, number> = new Map();
    public features: Feature[] = [];
    public explored: boolean = false;
    
    constructor(q: number, r: number, biomeType: BiomeType, elevation: number) {
        this.q = q;
        this.r = r;
        this.biomeType = biomeType;
        this.elevation = elevation;
    }
    
    public addResource(type: ResourceType, amount: number): void {
        const current = this.resources.get(type) || 0;
        this.resources.set(type, current + amount);
    }
    
    public getResource(type: ResourceType): number {
        return this.resources.get(type) || 0;
    }
    
    public harvestResource(type: ResourceType, amount: number): number {
        const available = this.getResource(type);
        const harvested = Math.min(available, amount);
        this.resources.set(type, available - harvested);
        return harvested;
    }
    
    public addFeature(feature: Feature): void {
        this.features.push(feature);
    }
    
    public serialize(): any {
        return {
            q: this.q,
            r: this.r,
            biomeType: this.biomeType,
            elevation: this.elevation,
            resources: Array.from(this.resources.entries()),
            features: this.features.map(f => f.serialize()),
            explored: this.explored
        };
    }
    
    public static deserialize(data: any): HexTile {
        const tile = new HexTile(data.q, data.r, data.biomeType, data.elevation);
        
        for (const [type, amount] of data.resources) {
            tile.resources.set(type, amount);
        }
        
        for (const featureData of data.features) {
            tile.features.push(Feature.deserialize(featureData));
        }
        
        tile.explored = data.explored;
        
        return tile;
    }
}

enum BiomeType {
    OCEAN,
    PLAINS,
    DESERT,
    FOREST,
    PINE_FOREST,
    JUNGLE,
    MOUNTAINS,
    SNOW_MOUNTAINS,
    TUNDRA,
    VOLCANIC,
    CRYSTAL_FORMATION
}

enum ResourceType {
    WOOD,
    STONE,
    IRON_ORE,
    COPPER_ORE,
    GOLD_ORE,
    GEMS,
    BERRIES,
    HERBS,
    GAME,
    FISH,
    CRYSTAL_ESSENCE,
    VOLCANIC_GLASS
}

class Feature {
    public type: FeatureType;
    public data: any;
    
    constructor(type: FeatureType, data: any = {}) {
        this.type = type;
        this.data = data;
    }
    
    public serialize(): any {
        return {
            type: this.type,
            data: this.data
        };
    }
    
    public static deserialize(data: any): Feature {
        return new Feature(data.type, data.data);
    }
}

enum FeatureType {
    RIVER,
    MOUNTAIN,
    FOREST,
    RUINS,
    ANCIENT_ARTIFACT,
    CAVE_ENTRANCE
}
```

### Noise Generation for Terrain

```typescript
class PerlinNoise {
    private perm: number[] = [];
    private octaves: number;
    private persistence: number;
    
    constructor(seed: number, octaves: number, persistence: number) {
        this.octaves = octaves;
        this.persistence = persistence;
        
        // Initialize permutation table
        const random = new Random(seed);
        for (let i = 0; i < 256; i++) {
            this.perm.push(i);
        }
        
        // Shuffle permutation table
        for (let i = 0; i < 256; i++) {
            const j = random.nextInt() % 256;
            [this.perm[i], this.perm[j]] = [this.perm[j], this.perm[i]];
        }
        
        // Extend permutation table
        for (let i = 0; i < 256; i++) {
            this.perm.push(this.perm[i]);
        }
    }
    
    public get(x: number, y: number): number {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < this.octaves; i++) {
            total += this.noise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= this.persistence;
            frequency *= 2;
        }
        
        // Normalize to 0-1
        return total / maxValue;
    }
    
    private noise(x: number, y: number): number {
        // Standard Perlin noise implementation
        // ...
    }
}

class Random {
    private state: number;
    
    constructor(seed: number) {
        this.state = seed;
    }
    
    public nextInt(): number {
        // LCG algorithm
        this.state = (this.state * 1664525 + 1013904223) % 4294967296;
        return this.state;
    }
    
    public nextFloat(): number {
        return this.nextInt() / 4294967296;
    }
}
```

---

## Colony Management System

The Colony Management System handles the player's base, including building placement, resource management, and colonist assignment.

### Colony Class Structure

```typescript
class Colony {
    public id: string;
    public name: string;
    public location: { q: number, r: number }; // Hex coordinates
    public buildings: Building[] = [];
    public colonists: Colonist[] = [];
    public resources: ResourceManager;
    public research: ResearchManager;
    public grid: GridCell[][];
    
    constructor(id: string, name: string, location: { q: number, r: number }, gridSize: number = 50) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.resources = new ResourceManager();
        this.research = new ResearchManager();
        
        // Initialize grid
        this.grid = [];
        for (let x = 0; x < gridSize; x++) {
            this.grid[x] = [];
            for (let y = 0; y < gridSize; y++) {
                this.grid[x][y] = new GridCell(x, y);
            }
        }
    }
    
    public addBuilding(building: Building): boolean {
        // Check if building can be placed
        if (!this.canPlaceBuilding(building)) {
            return false;
        }
        
        // Place building on grid
        for (let x = building.position.x; x < building.position.x + building.size.width; x++) {
            for (let y = building.position.y; y < building.position.y + building.size.height; y++) {
                this.grid[x][y].building = building;
            }
        }
        
        // Add to buildings list
        this.buildings.push(building);
        
        // Apply building effects (increase resource storage, etc.)
        building.onPlaced(this);
        
        return true;
    }
    
    public removeBuilding(buildingId: string): boolean {
        const building = this.buildings.find(b => b.id === buildingId);
        if (!building) {
            return false;
        }
        
        // Clear grid cells
        for (let x = building.position.x; x < building.position.x + building.size.width; x++) {
            for (let y = building.position.y; y < building.position.y + building.size.height; y++) {
                this.grid[x][y].building = null;
            }
        }
        
        // Remove from buildings list
        const index = this.buildings.indexOf(building);
        this.buildings.splice(index, 1);
        
        // Remove building effects
        building.onRemoved(this);
        
        return true;
    }
    
    public addColonist(colonist: Colonist): void {
        this.colonists.push(colonist);
        colonist.setColony(this);
    }
    
    public removeColonist(colonistId: string): boolean {
        const index = this.colonists.findIndex(c => c.id === colonistId);
        if (index === -1) {
            return false;
        }
        
        const colonist = this.colonists[index];
        colonist.setColony(null);
        this.colonists.splice(index, 1);
        
        return true;
    }
    
    public getAvailableJobs(): Job[] {
        // Collect all job providers (buildings, etc.)
        const jobs: Job[] = [];
        
        for (const building of this.buildings) {
            if (building instanceof JobProvider) {
                jobs.push(...building.getAvailableJobs());
            }
        }
        
        return jobs;
    }
    
    public assignColonistToJob(colonistId: string, jobId: string): boolean {
        const colonist = this.colonists.find(c => c.id === colonistId);
        if (!colonist) {
            return false;
        }
        
        const jobs = this.getAvailableJobs();
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            return false;
        }
        
        // Remove colonist from current job if assigned
        if (colonist.currentJob) {
            colonist.currentJob.worker = null;
        }
        
        // Assign to new job
        colonist.currentJob = job;
        job.worker = colonist;
        
        return true;
    }
    
    private canPlaceBuilding(building: Building): boolean {
        // Check if building is within colony bounds
        if (building.position.x < 0 || building.position.y < 0 ||
            building.position.x + building.size.width > this.grid.length ||
            building.position.y + building.size.height > this.grid[0].length) {
            return false;
        }
        
        // Check if all cells are empty
        for (let x = building.position.x; x < building.position.x + building.size.width; x++) {
            for (let y = building.position.y; y < building.position.y + building.size.height; y++) {
                if (this.grid[x][y].building !== null) {
                    return false;
                }
                
                if (!this.grid[x][y].isBuildable) {
                    return false;
                }
            }
        }
        
        // Check if player has resources
        for (const [resourceType, amount] of building.buildCost) {
            if (this.resources.getAmount(resourceType) < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    public update(deltaTime: number): void {
        // Update all buildings
        for (const building of this.buildings) {
            building.update(deltaTime);
        }
        
        // Update all colonists
        for (const colonist of this.colonists) {
            colonist.update(deltaTime);
        }
        
        // Update resource regeneration, etc.
        this.resources.update(deltaTime);
    }
    
    public serialize(): any {
        return {
            id: this.id,
            name: this.name,
            location: this.location,
            buildings: this.buildings.map(b => b.serialize()),
            colonists: this.colonists.map(c => c.serialize()),
            resources: this.resources.serialize(),
            research: this.research.serialize(),
            grid: this.serializeGrid()
        };
    }
    
    private serializeGrid(): any[] {
        const serializedGrid: any[] = [];
        for (let x = 0; x < this.grid.length; x++) {
            for (let y = 0; y < this.grid[x].length; y++) {
                if (!this.grid[x][y].isBuildable || this.grid[x][y].terrain !== TerrainType.NORMAL) {
                    serializedGrid.push({
                        x,
                        y,
                        isBuildable: this.grid[x][y].isBuildable,
                        terrain: this.grid[x][y].terrain
                    });
                }
            }
        }
        return serializedGrid;
    }
    
    public static deserialize(data: any): Colony {
        const colony = new Colony(data.id, data.name, data.location);
        
        // Deserialize grid
        for (const cell of data.grid) {
            colony.grid[cell.x][cell.y].isBuildable = cell.isBuildable;
            colony.grid[cell.x][cell.y].terrain = cell.terrain;
        }
        
        // Deserialize resources and research
        colony.resources = ResourceManager.deserialize(data.resources);
        colony.research = ResearchManager.deserialize(data.research);
        
        // Deserialize buildings
        for (const buildingData of data.buildings) {
            const building = Building.deserialize(buildingData);
            colony.buildings.push(building);
            
            // Update grid references
            for (let x = building.position.x; x < building.position.x + building.size.width; x++) {
                for (let y = building.position.y; y < building.position.y + building.size.height; y++) {
                    colony.grid[x][y].building = building;
                }
            }
        }
        
        // Deserialize colonists
        for (const colonistData of data.colonists) {
            const colonist = Colonist.deserialize(colonistData);
            colony.colonists.push(colonist);
            colonist.setColony(colony);
        }
        
        return colony;
    }
}

class GridCell {
    public x: number;
    public y: number;
    public building: Building | null = null;
    public isBuildable: boolean = true;
    public terrain: TerrainType = TerrainType.NORMAL;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

enum TerrainType {
    NORMAL,
    WATER,
    ROCK,
    MARSH
}
```

### Resource Management

```typescript
class ResourceManager {
    private resources: Map<ResourceType, number> = new Map();
    private maxStorage: Map<ResourceType, number> = new Map();
    
    constructor() {
        // Initialize with default storage capacities
        for (const type of Object.values(ResourceType)) {
            if (typeof type === 'number') {
                this.resources.set(type as ResourceType, 0);
                this.maxStorage.set(type as ResourceType, 1000); // Default storage
            }
        }
    }
    
    public getAmount(type: ResourceType): number {
        return this.resources.get(type) || 0;
    }
    
    public getMaxStorage(type: ResourceType): number {
        return this.maxStorage.get(type) || 0;
    }
    
    public addResource(type: ResourceType, amount: number): number {
        const current = this.getAmount(type);
        const max = this.getMaxStorage(type);
        
        const newAmount = Math.min(current + amount, max);
        const added = newAmount - current;
        
        this.resources.set(type, newAmount);
        return added;
    }
    
    public removeResource(type: ResourceType, amount: number): number {
        const current = this.getAmount(type);
        const removed = Math.min(current, amount);
        
        this.resources.set(type, current - removed);
        return removed;
    }
    
    public hasResources(requirements: Map<ResourceType, number>): boolean {
        for (const [type, amount] of requirements.entries()) {
            if (this.getAmount(type) < amount) {
                return false;
            }
        }
        return true;
    }
    
    public consumeResources(requirements: Map<ResourceType, number>): boolean {
        if (!this.hasResources(requirements)) {
            return false;
        }
        
        for (const [type, amount] of requirements.entries()) {
            this.removeResource(type, amount);
        }
        
        return true;
    }
    
    public increaseMaxStorage(type: ResourceType, amount: number): void {
        const current = this.getMaxStorage(type);
        this.maxStorage.set(type, current + amount);
    }
    
    public update(deltaTime: number): void {
        // Handle any time-based resource changes (decay, regeneration, etc.)
    }
    
    public serialize(): any {
        return {
            resources: Array.from(this.resources.entries()),
            maxStorage: Array.from(this.maxStorage.entries())
        };
    }
    
    public static deserialize(data: any): ResourceManager {
        const manager = new ResourceManager();
        
        for (const [type, amount] of data.resources) {
            manager.resources.set(parseInt(type), amount);
        }
        
        for (const [type, amount] of data.maxStorage) {
            manager.maxStorage.set(parseInt(type), amount);
        }
        
        return manager;
    }
}
```

---

## Character System

The Character System manages colonists, their needs, skills, and behaviors.

### Colonist Implementation

```typescript
class Colonist {
    public id: string;
    public name: string;
    public gender: Gender;
    public age: number;
    
    public attributes: Map<AttributeType, number> = new Map();
    public skills: Map<SkillType, Skill> = new Map();
    public needs: Map<NeedType, Need> = new Map();
    
    public inventory: Inventory;
    public equipment: Equipment;
    
    public currentJob: Job | null = null;
    private colony: Colony | null = null;
    
    private position: Position;
    private destination: Position | null = null;
    private path: Position[] = [];
    private state: ColonistState = ColonistState.IDLE;
    
    constructor(id: string, name: string, gender: Gender, age: number) {
        this.id = id;
        this.name = name;
        this.gender = gender;
        this.age = age;
        
        this.inventory = new Inventory(10); // 10 slots
        this.equipment = new Equipment();
        this.position = new Position(0, 0); // Default position
        
        // Initialize attributes
        for (const type of Object.values(AttributeType)) {
            if (typeof type === 'number') {
                // Generate random attributes between 5-15
                this.attributes.set(type as AttributeType, 5 + Math.floor(Math.random() * 11));
            }
        }
        
        // Initialize skills
        for (const type of Object.values(SkillType)) {
            if (typeof type === 'number') {
                this.skills.set(type as SkillType, new Skill(type as SkillType, 0));
            }
        }
        
        // Initialize needs
        for (const type of Object.values(NeedType)) {
            if (typeof type === 'number') {
                this.needs.set(type as NeedType, new Need(type as NeedType));
            }
        }
    }
    
    public setColony(colony: Colony | null): void {
        this.colony = colony;
    }
    
    public getPosition(): Position {
        return this.position.clone();
    }
    
    public setPosition(x: number, y: number): void {
        this.position.x = x;
        this.position.y = y;
    }
    
    public moveTo(x: number, y: number): void {
        if (!this.colony) return;
        
        this.destination = new Position(x, y);
        
        // Calculate path using A* pathfinding
        // This is a simplified example - would need a more robust implementation
        this.path = this.calculatePath(this.position, this.destination);
        
        if (this.path.length > 0) {
            this.state = ColonistState.MOVING;
        }
    }
    
    private calculatePath(start: Position, end: Position): Position[] {
        // Using WebWorker for pathfinding to avoid blocking main thread
        if (!this.colony) return [];
        
        // Send pathfinding calculation to worker thread
        return this.colony.pathfindingSystem.calculatePath(start, end, this.colony.grid);
    }
}

/**
 * Pathfinding system that uses WebWorkers to offload expensive calculations
 */
class PathfindingSystem {
    private workers: Worker[] = [];
    private pendingRequests: Map<string, {
        resolve: (path: Position[]) => void,
        reject: (error: any) => void
    }> = new Map();
    
    constructor(workerCount: number = 2) {
        // Initialize multiple workers for parallel pathfinding
        for (let i = 0; i < workerCount; i++) {
            const worker = new Worker('./pathfinding-worker.js');
            
            worker.onmessage = (e: MessageEvent) => {
                const { requestId, path, error } = e.data;
                const request = this.pendingRequests.get(requestId);
                
                if (request) {
                    if (error) {
                        request.reject(error);
                    } else {
                        // Convert raw path data back to Position objects
                        const positions = path.map((p: [number, number]) => new Position(p[0], p[1]));
                        request.resolve(positions);
                    }
                    this.pendingRequests.delete(requestId);
                }
            };
            
            this.workers.push(worker);
        }
    }
    
    public calculatePath(start: Position, end: Position, grid: GridCell[][]): Promise<Position[]> {
        return new Promise((resolve, reject) => {
            // Generate unique request ID
            const requestId = crypto.randomUUID();
            
            // Store promise callbacks
            this.pendingRequests.set(requestId, { resolve, reject });
            
            // Find least busy worker
            const worker = this.getLeastBusyWorker();
            
            // Prepare grid data (only send what's needed)
            const gridData = this.serializeGridForPathfinding(grid, start, end);
            
            // Send task to worker
            worker.postMessage({
                requestId,
                start: [start.x, start.y],
                end: [end.x, end.y],
                grid: gridData
            });
        });
    }
    
    private getLeastBusyWorker(): Worker {
        // Simple round-robin for now
        const worker = this.workers[0];
        this.workers.push(this.workers.shift()!);
        return worker;
    }
    
    private serializeGridForPathfinding(grid: GridCell[][], start: Position, end: Position): number[][] {
        // Create simplified grid representation (0 = walkable, 1 = obstacle)
        // Only include the relevant portion of the grid
        
        // Define boundaries with padding
        const padding = 10;
        const minX = Math.max(0, Math.min(start.x, end.x) - padding);
        const minY = Math.max(0, Math.min(start.y, end.y) - padding);
        const maxX = Math.min(grid.length - 1, Math.max(start.x, end.x) + padding);
        const maxY = Math.min(grid[0].length - 1, Math.max(start.y, end.y) + padding);
        
        // Create 2D array for pathfinding
        const gridData: number[][] = [];
        for (let y = minY; y <= maxY; y++) {
            const row: number[] = [];
            for (let x = minX; x <= maxX; x++) {
                // Mark cell as obstacle if not buildable or has building
                const cell = grid[x][y];
                row.push((!cell.isBuildable || cell.building !== null) ? 1 : 0);
            }
            gridData.push(row);
        }
        
        return gridData;
    }
    
    // Clean up workers when done
    public dispose(): void {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
    }
    
    public update(deltaTime: number): void {
        // Update needs
        for (const need of this.needs.values()) {
            need.update(deltaTime);
        }
        
        // Handle current state
        switch (this.state) {
            case ColonistState.IDLE:
                this.updateIdle(deltaTime);
                break;
            case ColonistState.MOVING:
                this.updateMoving(deltaTime);
                break;
            case ColonistState.WORKING:
                this.updateWorking(deltaTime);
                break;
            case ColonistState.FULFILLING_NEED:
                this.updateFulfillingNeed(deltaTime);
                break;
        }
    }
    
    private updateIdle(deltaTime: number): void {
        // Check for critical needs
        const criticalNeed = this.getMostUrgentNeed();
        if (criticalNeed) {
            this.state = ColonistState.FULFILLING_NEED;
            return;
        }
        
        // Check for available jobs
        if (this.currentJob) {
            this.state = ColonistState.WORKING;
            return;
        }
        
        // If no job, find one
        this.findNewJob();
    }
    
    private updateMoving(deltaTime: number): void {
        if (this.path.length === 0) {
            this.state = ColonistState.IDLE;
            return;
        }
        
        // Get next waypoint
        const nextWaypoint = this.path[0];
        
        // Calculate movement
        const speed = 2.0; // Units per second
        const maxDistance = speed * deltaTime;
        
        const dx = nextWaypoint.x - this.position.x;
        const dy = nextWaypoint.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= maxDistance) {
            // Reached waypoint
            this.position = nextWaypoint.clone();
            this.path.shift();
            
            // Check if destination reached
            if (this.path.length === 0) {
                this.destination = null;
                this.state = ColonistState.IDLE;
            }
        } else {
            // Move towards waypoint
            const moveRatio = maxDistance / distance;
            this.position.x += dx * moveRatio;
            this.position.y += dy * moveRatio;
        }
    }
    
    private updateWorking(deltaTime: number): void {
        if (!this.currentJob) {
            this.state = ColonistState.IDLE;
            return;
        }
        
        // Check if at work location
        const jobPosition = this.currentJob.getPosition();
        const distance = this.position.distanceTo(jobPosition);
        
        if (distance > 1.0) {
            // Move to job location
            this.moveTo(jobPosition.x, jobPosition.y);
            return;
        }
        
        // Perform job
        this.currentJob.performWork(this, deltaTime);
        
        // Check if job is complete
        if (this.currentJob.isComplete()) {
            this.currentJob.complete(this);
            this.currentJob = null;
            this.state = ColonistState.IDLE;
        }
    }
    
    private updateFulfillingNeed(deltaTime: number): void {
        // Find appropriate facility for the most urgent need
        const urgentNeed = this.getMostUrgentNeed();
        if (!urgentNeed) {
            this.state = ColonistState.IDLE;
            return;
        }
        
        // Find facility for this need
        const facility = this.findFacilityForNeed(urgentNeed.type);
        if (!facility) {
            // No facility available
            this.state = ColonistState.IDLE;
            return;
        }
        
        // Move to facility if not already there
        const facilityPosition = facility.getPosition();
        const distance = this.position.distanceTo(facilityPosition);
        
        if (distance > 1.0) {
            this.moveTo(facilityPosition.x, facilityPosition.y);
            return;
        }
        
        // Use facility to fulfill need
        const fulfilled = facility.fulfillNeed(urgentNeed);
        if (fulfilled) {
            this.state = ColonistState.IDLE;
        }
    }
    
    private getMostUrgentNeed(): Need | null {
        let mostUrgent: Need | null = null;
        let lowestValue = 1.0;
        
        for (const need of this.needs.values()) {
            if (need.value < lowestValue && need.value < need.criticalThreshold) {
                lowestValue = need.value;
                mostUrgent = need;
            }
        }
        
        return mostUrgent;
    }
    
    private findFacilityForNeed(needType: NeedType): Building | null {
        if (!this.colony) return null;
        
        // Find appropriate building for this need
        for (const building of this.colony.buildings) {
            if (building instanceof NeedFulfiller && building.canFulfillNeed(needType)) {
                return building;
            }
        }
        
        return null;
    }
    
    private findNewJob(): void {
        if (!this.colony) return;
        
        const availableJobs = this.colony.getAvailableJobs();
        if (availableJobs.length === 0) return;
        
        // Find best job based on skills, preferences, etc.
        let bestJob = availableJobs[0];
        let bestScore = this.calculateJobScore(bestJob);
        
        for (let i = 1; i < availableJobs.length; i++) {
            const job = availableJobs[i];
            const score = this.calculateJobScore(job);
            if (score > bestScore) {
                bestJob = job;
                bestScore = score;
            }
        }
        
        // Assign to best job
        this.colony.assignColonistToJob(this.id, bestJob.id);
    }
    
    private calculateJobScore(job: Job): number {
        let score = 0;
        
        // Consider skill level
        const skillLevel = this.skills.get(job.requiredSkill)?.level || 0;
        score += skillLevel * 10;
        
        // Consider distance
        const distance = this.position.distanceTo(job.getPosition());
        score -= distance;
        
        // Consider job priority
        score += job.priority * 5;
        
        return score;
    }
    
    public gainSkillExperience(skillType: SkillType, amount: number): void {
        const skill = this.skills.get(skillType);
        if (skill) {
            skill.addExperience(amount);
        }
    }
    
    public getAttribute(type: AttributeType): number {
        return this.attributes.get(type) || 0;
    }
    
    public getSkillLevel(type: SkillType): number {
        return this.skills.get(type)?.level || 0;
    }
    
    public serialize(): any {
        return {
            id: this.id,
            name: this.name,
            gender: this.gender,
            age: this.age,
            position: { x: this.position.x, y: this.position.y },
            attributes: Array.from(this.attributes.entries()),
            skills: Array.from(this.skills.entries()).map(([type, skill]) => skill.serialize()),
            needs: Array.from(this.needs.entries()).map(([type, need]) => need.serialize()),
            inventory: this.inventory.serialize(),
            equipment: this.equipment.serialize(),
            currentJobId: this.currentJob?.id
        };
    }
    
    public static deserialize(data: any): Colonist {
        const colonist = new Colonist(data.id, data.name, data.gender, data.age);
        
        // Set position
        colonist.position = new Position(data.position.x, data.position.y);
        
        // Deserialize attributes
        for (const [type, value] of data.attributes) {
            colonist.attributes.set(parseInt(type), value);
        }
        
        // Deserialize skills
        for (const skillData of data.skills) {
            const skill = Skill.deserialize(skillData);
            colonist.skills.set(skill.type, skill);
        }
        
        // Deserialize needs
        for (const needData of data.needs) {
            const need = Need.deserialize(needData);
            colonist.needs.set(need.type, need);
        }
        
        // Deserialize inventory and equipment
        colonist.inventory = Inventory.deserialize(data.inventory);
        colonist.equipment = Equipment.deserialize(data.equipment);
        
        // Note: currentJob will be reconnected after all jobs are deserialized
        
        return colonist;
    }
}

enum ColonistState {
    IDLE,
    MOVING,
    WORKING,
    FULFILLING_NEED
}

enum Gender {
    MALE,
    FEMALE,
    OTHER
}

enum AttributeType {
    STRENGTH,
    DEXTERITY,
    INTELLIGENCE,
    ENDURANCE,
    SOCIAL
}

enum SkillType {
    CONSTRUCTION,
    MINING,
    COOKING,
    CRAFTING,
    RESEARCH,
    MEDICINE,
    COMBAT,
    GARDENING,
    ANIMALS
}

enum NeedType {
    HUNGER,
    THIRST,
    REST,
    JOY,
    COMFORT,
    SOCIAL
}

class Position {
    constructor(public x: number, public y: number) {}
    
    public distanceTo(other: Position): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    public clone(): Position {
        return new Position(this.x, this.y);
    }
}

class Skill {
    public level: number;
    public experience: number = 0;
    
    constructor(public type: SkillType, initialLevel: number = 0) {
        this.level = initialLevel;
    }
    
    public addExperience(amount: number): void {
        this.experience += amount;
        
        // Check for level up
        const expForNextLevel = this.getExperienceForLevel(this.level + 1);
        if (this.experience >= expForNextLevel) {
            this.level++;
        }
    }
    
    private getExperienceForLevel(level: number): number {
        // Experience curve: 100 * level^1.5
        return Math.floor(100 * Math.pow(level, 1.5));
    }
    
    public serialize(): any {
        return {
            type: this.type,
            level: this.level,
            experience: this.experience
        };
    }
    
    public static deserialize(data: any): Skill {
        const skill = new Skill(data.type, data.level);
        skill.experience = data.experience;
        return skill;
    }
}

class Need {
    public value: number = 1.0; // 0-1 scale, 1 is fully satisfied
    public criticalThreshold: number = 0.25; // Below this is critical
    public decayRate: number = 0.1; // Units per hour
    
    constructor(public type: NeedType) {
        // Adjust decay rate based on need type
        switch (type) {
            case NeedType.HUNGER:
                this.decayRate = 0.1;
                break;
            case NeedType.THIRST:
                this.decayRate = 0.15;
                break;
            case NeedType.REST:
                this.decayRate = 0.08;
                break;
            case NeedType.JOY:
                this.decayRate = 0.05;
                break;
            case NeedType.COMFORT:
                this.decayRate = 0.03;
                break;
            case NeedType.SOCIAL:
                this.decayRate = 0.04;
                break;
        }
    }
    
    public update(deltaTime: number): void {
        // Convert deltaTime from seconds to hours
        const hoursDelta = deltaTime / 3600;
        
        // Decay need
        this.value = Math.max(0, this.value - this.decayRate * hoursDelta);
    }
    
    public fulfill(amount: number): void {
        this.value = Math.min(1.0, this.value + amount);
    }
    
    public serialize(): any {
        return {
            type: this.type,
            value: this.value
        };
    }
    
    public static deserialize(data: any): Need {
        const need = new Need(data.type);
        need.value = data.value;
        return need;
    }
}

class Inventory {
    private items: (Item | null)[] = [];
    
    constructor(capacity: number) {
        // Initialize with null slots
        for (let i = 0; i < capacity; i++) {
            this.items.push(null);
        }
    }
    
    public addItem(item: Item): boolean {
        // Find empty slot
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === null) {
                this.items[i] = item;
                return true;
            }
        }
        
        return false; // No space
    }
    
    public removeItem(index: number): Item | null {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        
        const item = this.items[index];
        this.items[index] = null;
        return item;
    }
    
    public getItem(index: number): Item | null {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        
        return this.items[index];
    }
    
    public getItems(): (Item | null)[] {
        return [...this.items];
    }
    
    public getCapacity(): number {
        return this.items.length;
    }
    
    public isFull(): boolean {
        return !this.items.some(item => item === null);
    }
    
    public serialize(): any {
        return {
            items: this.items.map(item => item ? item.serialize() : null)
        };
    }
    
    public static deserialize(data: any): Inventory {
        const inventory = new Inventory(data.items.length);
        
        for (let i = 0; i < data.items.length; i++) {
            const itemData = data.items[i];
            if (itemData) {
                inventory.items[i] = Item.deserialize(itemData);
            }
        }
        
        return inventory;
    }
}

class Equipment {
    private slots: Map<EquipmentSlot, Item | null> = new Map();
    
    constructor() {
        // Initialize all slots as empty
        for (const slot of Object.values(EquipmentSlot)) {
            if (typeof slot === 'number') {
                this.slots.set(slot as EquipmentSlot, null);
            }
        }
    }
    
    public equipItem(item: Item, slot: EquipmentSlot): Item | null {
        if (!item.canEquip(slot)) {
            return null;
        }
        
        const currentItem = this.slots.get(slot);
        this.slots.set(slot, item);
        return currentItem;
    }
    
    public unequipItem(slot: EquipmentSlot): Item | null {
        const item = this.slots.get(slot);
        this.slots.set(slot, null);
        return item;
    }
    
    public getEquippedItem(slot: EquipmentSlot): Item | null {
        return this.slots.get(slot) || null;
    }
    
    public serialize(): any {
        const serializedSlots: [number, any][] = [];
        
        for (const [slot, item] of this.slots.entries()) {
            serializedSlots.push([slot, item ? item.serialize() : null]);
        }
        
        return {
            slots: serializedSlots
        };
    }
    
    public static deserialize(data: any): Equipment {
        const equipment = new Equipment();
        
        for (const [slot, itemData] of data.slots) {
            if (itemData) {
                equipment.slots.set(parseInt(slot), Item.deserialize(itemData));
            }
        }
        
        return equipment;
    }
}

enum EquipmentSlot {
    HEAD,
    BODY,
    WEAPON,
    OFFHAND,
    ACCESSORY
}
```

---

## Data Persistence

TerraFlux requires a robust save/load system to store game state reliably. It uses a delta-based save system with versioned schemas to optimize performance and ensure forward compatibility.

### Delta-Based Save System

```typescript
/**
 * SaveManager handles game state persistence using delta-based saves
 * to minimize file size and improve save/load performance
 */
class SaveManager {
    private baseSaveData: GameState | null = null;
    private currentState: GameState;
    private lastSaveTime: number = 0;
    private saveVersion: number = 1;
    private saveHistory: SaveHistoryItem[] = [];
    
    constructor(private filePath: string) {
        this.currentState = new GameState();
    }
    
    /**
     * Create a full save of the current game state
     */
    public async saveGame(gameState: GameState): Promise<boolean> {
        try {
            // Store as base save
            this.baseSaveData = this.deepClone(gameState);
            this.currentState = this.deepClone(gameState);
            this.lastSaveTime = Date.now();
            
            // Reset save history
            this.saveHistory = [];
            
            // Create save data
            const saveData: FullSaveData = {
                version: this.saveVersion,
                timestamp: this.lastSaveTime,
                type: 'full',
                state: this.baseSaveData,
                metadata: {
                    gameVersion: APP_VERSION,
                    saveDate: new Date().toISOString(),
                    playTime: gameState.playTime
                }
            };
            
            // Write to file
            return await this.writeSaveFile(saveData);
        } catch (error) {
            console.error("Error saving game:", error);
            return false;
        }
    }
    
    /**
     * Create a delta save containing only changed data since last save
     */
    public async saveDelta(gameState: GameState): Promise<boolean> {
        try {
            if (!this.baseSaveData) {
                // No base save exists, create full save instead
                return await this.saveGame(gameState);
            }
            
            // Calculate delta between current state and new state
            const delta = this.calculateDelta(this.currentState, gameState);
            
            // If delta is too large (>40% of full state), create full save instead
            if (this.getDeltaSize(delta) > this.getStateSize(gameState) * 0.4) {
                return await this.saveGame(gameState);
            }
            
            // Update current state
            this.currentState = this.deepClone(gameState);
            const timestamp = Date.now();
            
            // Create delta save data
            const deltaData: DeltaSaveData = {
                version: this.saveVersion,
                timestamp: timestamp,
                type: 'delta',
                baseSaveTimestamp: this.lastSaveTime,
                delta: delta,
                metadata: {
                    gameVersion: APP_VERSION,
                    saveDate: new Date().toISOString(),
                    playTime: gameState.playTime
                }
            };
            
            // Add to save history
            this.saveHistory.push({
                timestamp,
                delta
            });
            
            // Keep only the last 5 delta saves in memory
            if (this.saveHistory.length > 5) {
                this.saveHistory.shift();
            }
            
            // Write to delta file
            const deltaPath = this.filePath.replace('.save', `.delta-${timestamp}.save`);
            return await this.writeSaveFile(deltaData, deltaPath);
        } catch (error) {
            console.error("Error creating delta save:", error);
            return false;
        }
    }
    
    /**
     * Load a game from save file (handles both full and delta saves)
     */
    public async loadGame(): Promise<GameState | null> {
        try {
            // Check if file exists
            if (!await this.fileExists(this.filePath)) {
                return null;
            }
            
            // Read save file
            const saveData = await this.readSaveFile();
            
            // Handle based on save type
            if (!saveData) {
                return null;
            }
            
            // Version migration if needed
            if (saveData.version !== this.saveVersion) {
                return this.migrateSaveData(saveData);
            }
            
            if (saveData.type === 'full') {
                // Full save - just return the state
                this.baseSaveData = saveData.state;
                this.currentState = this.deepClone(saveData.state);
                this.lastSaveTime = saveData.timestamp;
                return saveData.state;
            } else if (saveData.type === 'delta') {
                // Delta save - need to load base save first
                const baseSave = await this.loadBaseSave(saveData.baseSaveTimestamp);
                if (!baseSave) {
                    console.error("Could not find base save for delta");
                    return null;
                }
                
                // Apply delta to base save
                const reconstructedState = this.applyDelta(baseSave, saveData.delta);
                this.baseSaveData = baseSave;
                this.currentState = this.deepClone(reconstructedState);
                this.lastSaveTime = saveData.baseSaveTimestamp;
                return reconstructedState;
            } else {
                console.error("Unknown save type");
                return null;
            }
        } catch (error) {
            console.error("Error loading game:", error);
            return null;
        }
    }
    
    /**
     * Migrate save data from an older version to current version
     */
    private migrateSaveData(saveData: SaveData): GameState | null {
        let state: GameState;
        
        // Extract state based on save type
        if (saveData.type === 'full') {
            state = saveData.state;
        } else {
            // Delta save migrations are more complex - not handling here
            console.error("Cannot migrate delta saves from older versions");
            return null;
        }
        
        // Apply migrations based on version
        if (saveData.version === 0) {
            // Migrate from version 0 to 1
            state = this.migrateV0ToV1(state);
            
            // If we had more versions, we'd chain migrations:
            // if (saveData.version <= 1) state = this.migrateV1ToV2(state);
            // if (saveData.version <= 2) state = this.migrateV2ToV3(state);
            // etc.
        }
        
        return state;
    }
    
    private migrateV0ToV1(oldState: any): GameState {
        // Example migration from v0 to v1 format
        const newState = new GameState();
        
        // Copy compatible properties
        newState.worldMap = oldState.worldMap;
        newState.colonies = oldState.colonies;
        newState.playTime = oldState.playTime || 0;
        
        // Example migration: v1 added a research system not present in v0
        newState.research = {
            completedTechnologies: [],
            currentResearch: null,
            researchPoints: 0
        };
        
        return newState;
    }
    
    /**
     * Calculate delta between two state objects
     */
    private calculateDelta(oldState: any, newState: any): GameStateDelta {
        // Deep comparison to find changes
        const delta: GameStateDelta = {};
        
        for (const key of Object.keys(newState)) {
            if (key in oldState) {
                if (typeof newState[key] === 'object' && newState[key] !== null) {
                    // Handle arrays
                    if (Array.isArray(newState[key])) {
                        if (!this.arraysEqual(oldState[key], newState[key])) {
                            delta[key] = newState[key]; // Store whole array if changed
                        }
                    } 
                    // Handle objects - recursive comparison
                    else {
                        const nestedDelta = this.calculateDelta(oldState[key], newState[key]);
                        if (Object.keys(nestedDelta).length > 0) {
                            delta[key] = nestedDelta;
                        }
                    }
                } else if (oldState[key] !== newState[key]) {
                    // Value has changed
                    delta[key] = newState[key];
                }
            } else {
                // New property
                delta[key] = newState[key];
            }
        }
        
        // Check for deleted properties
        for (const key of Object.keys(oldState)) {
            if (!(key in newState)) {
                delta[key] = null; // Mark as deleted
            }
        }
        
        return delta;
    }
    
    /**
     * Apply delta to a state object
     */
    private applyDelta(baseState: any, delta: GameStateDelta): any {
        const result = this.deepClone(baseState);
        
        // Apply changes from delta
        for (const key of Object.keys(delta)) {
            const value = delta[key];
            
            if (value === null) {
                // Property was deleted
                delete result[key];
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Nested object delta
                if (result[key] && typeof result[key] === 'object') {
                    result[key] = this.applyDelta(result[key], value);
                } else {
                    result[key] = value; // Replace if base property isn't an object
                }
            } else {
                // Direct value replacement (including arrays)
                result[key] = value;
            }
        }
        
        return result;
    }
    
    // Helper methods omitted for brevity
    private deepClone(obj: any): any { /* ... */ }
    private arraysEqual(a: any[], b: any[]): boolean { /* ... */ }
    private getDeltaSize(delta: any): number { /* ... */ }
    private getStateSize(state: any): number { /* ... */ }
    private async writeSaveFile(data: any, path?: string): Promise<boolean> { /* ... */ }
    private async readSaveFile(): Promise<SaveData | null> { /* ... */ }
    private async loadBaseSave(timestamp: number): Promise<GameState | null> { /* ... */ }
    private async fileExists(path: string): Promise<boolean> { /* ... */ }
}

interface SaveData {
    version: number;
    timestamp: number;
    type: 'full' | 'delta';
    metadata: {
        gameVersion: string;
        saveDate: string;
        playTime: number;
    };
}

interface FullSaveData extends SaveData {
    type: 'full';
    state: GameState;
}

interface DeltaSaveData extends SaveData {
    type: 'delta';
    baseSaveTimestamp: number;
    delta: GameStateDelta;
}

interface SaveHistoryItem {
    timestamp: number;
    delta: GameStateDelta;
}

// Type definition for delta changes
type GameStateDelta = {
    [key: string]: any;
};

// Main game state class
class GameState {
    public worldMap: any; // WorldMap instance
    public colonies: any[]; // Array of Colony instances
    public characters: any[]; // Array of Character instances
    public playTime: number = 0; // Total play time in seconds
    public research: {
        completedTechnologies: string[];
        currentResearch: string | null;
        researchPoints: number;
    };
    
    constructor() {
        this.worldMap = null;
        this.colonies = [];
        this.characters = [];
        this.research = {
            completedTechnologies: [],
            currentResearch: null,
            researchPoints: 0
        };
    }
}
```

### Save File Versioning

The versioning system ensures that saves can be migrated between game versions:

1. Each save file contains a version number
2. When loading a save from a previous version, migration functions convert the data
3. The migration system applies upgrades sequentially if multiple versions behind

### Save Data Compression

Save files are compressed to reduce disk usage:

```typescript
class SaveCompression {
    /**
     * Compress save data before writing to disk
     */
    public static async compress(data: any): Promise<Buffer> {
        // Convert to string
        const jsonString = JSON.stringify(data);
        
        // Use zlib for compression
        return new Promise((resolve, reject) => {
            zlib.deflate(jsonString, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    }
    
    /**
     * Decompress save data after reading from disk
     */
    public static async decompress(buffer: Buffer): Promise<any> {
        // Decompress buffer
        const jsonString = await new Promise<string>((resolve, reject) => {
            zlib.inflate(buffer, (err, result) => {
                if (err) reject(err);
                else resolve(result.toString());
            });
        });
        
        // Parse JSON
        return JSON.parse(jsonString);
    }
}
```

### Autosave System

The game implements autosaves at regular intervals:

```typescript
class AutosaveSystem {
    private saveManager: SaveManager;
    private gameState: GameState;
    private timer: NodeJS.Timeout | null = null;
    private interval: number = 5 * 60 * 1000; // 5 minutes
    private lastAutosaveTime: number = 0;
    
    constructor(saveManager: SaveManager, gameState: GameState) {
        this.saveManager = saveManager;
        this.gameState = gameState;
    }
    
    public start(): void {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => this.performAutosave(), this.interval);
    }
    
    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    public setInterval(minutes: number): void {
        this.interval = minutes * 60 * 1000;
        
        // Restart timer with new interval
        if (this.timer) {
            this.start();
        }
    }
    
    private async performAutosave(): Promise<void> {
        try {
            // Use delta saves for autosaves to minimize disk I/O and improve performance
            await this.saveManager.saveDelta(this.gameState);
            this.lastAutosaveTime = Date.now();
            console.log("Autosave completed");
        } catch (error) {
            console.error("Autosave failed:", error);
        }
    }
}
```

---

## Building System

The Building System manages structures that can be placed in the colony.

```typescript
abstract class Building {
    public id: string;
    public type: BuildingType;
    public name: string;
    public position: { x: number, y: number };
    public size: { width: number, height: number };
    public health: number;
    public maxHealth: number;
    public buildCost: Map<ResourceType, number>;
    public level: number = 1;
    
    constructor(id: string, type: BuildingType, name: string, position: { x: number, y: number }, size: { width: number, height: number }, maxHealth: number, buildCost: Map<ResourceType, number>) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.position = position;
        this.size = size;
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.buildCost = buildCost;
    }
    
    public abstract update(deltaTime: number): void;
    
    public abstract onPlaced(colony: Colony): void;
    
    public abstract onRemoved(colony: Colony): void;
    
    public damage(amount: number): void {
        this.health = Math.max(0, this.health - amount);
    }
    
    public repair(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    public isDestroyed(): boolean {
        return this.health <= 0;
    }
    
    public getPosition(): Position {
        return new Position(
            this.position.x + this.size.width / 2,
            this.position.y + this.size.height / 2
        );
    }
    
    public canUpgrade(): boolean {
        return this.level < this.getMaxLevel();
    }
    
    public getUpgradeCost(): Map<ResourceType, number> {
        // Default implementation - override in subclasses
        const cost = new Map<ResourceType, number>();
        for (const [type, amount] of this.buildCost.entries()) {
            cost.set(type, Math.floor(amount * 0.75 * this.level));
        }
        return cost;
    }
    
    public upgrade(): boolean {
        if (!this.canUpgrade()) {
            return false;
        }
        
        this.level++;
        this.maxHealth = Math.floor(this.maxHealth * 1.25);
        this.health = this.maxHealth;
        
        return true;
    }
    
    protected getMaxLevel(): number {
        return 3; // Default max level
    }
    
    public serialize(): any {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: this.position,
            size: this.size,
            health: this.health,
            maxHealth: this.maxHealth,
            buildCost: Array.from(this.buildCost.entries()),
            level: this.level
        };
    }
    
    public static deserialize(data: any): Building {
        // Convert buildCost back to Map
        const buildCost = new Map<ResourceType, number>();
        for (const [type, amount] of data.buildCost) {
            buildCost.set(parseInt(type), amount);
        }
        
        // Create specific building type based on the type field
        let building: Building;
        
        switch (data.type) {
            case BuildingType.STORAGE:
                building = new StorageBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            case BuildingType.WORKSHOP:
                building = new WorkshopBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            case BuildingType.DORMITORY:
                building = new DormitoryBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            case BuildingType.KITCHEN:
                building = new KitchenBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            case BuildingType.RESEARCH:
                building = new ResearchBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            case BuildingType.POWER:
                building = new PowerBuilding(data.id, data.name, data.position, data.size, data.maxHealth, buildCost);
                break;
            default:
                throw new Error(`Unknown building type: ${data.type}`);
        }
        
        // Set common properties
        building.health = data.health;
        building.level = data.level || 1;
        
        return building;
    }
}

enum BuildingType {
    STORAGE,
    WORKSHOP,
    DORMITORY,
    KITCHEN,
    RESEARCH,
    POWER
}

interface JobProvider {
    getAvailableJobs(): Job[];
}

interface NeedFulfiller {
    canFulfillNeed(needType: NeedType): boolean;
    fulfillNeed(need: Need): boolean;
}

class StorageBuilding extends Building {
    private storageCapacity: number;
    
    constructor(id: string, name: string, position: { x: number, y: number }, size: { width: number, height: number }, maxHealth: number, buildCost: Map<ResourceType, number>) {
        super(id, BuildingType.STORAGE, name, position, size, maxHealth, buildCost);
        
        // Base storage capacity scales with building size
        this.storageCapacity = 1000 * size.width * size.height;
    }
    
    public update(deltaTime: number): void {
        // Storage buildings don't need regular updates
    }
    
    public onPlaced(colony: Colony): void {
        // Increase colony storage capacity
        for (const type of Object.values(ResourceType)) {
            if (typeof type === 'number') {
                colony.resources.increaseMaxStorage(type as ResourceType, this.storageCapacity);
            }
        }
    }
    
    public onRemoved(colony: Colony): void {
        // Decrease colony storage capacity
        for (const type of Object.values(ResourceType)) {
            if (typeof type === 'number') {
                colony.resources.increaseMaxStorage(type as ResourceType, -this.storageCapacity);
            }
        }
    }
    
    public override upgrade(): boolean {
        const beforeCapacity = this.storageCapacity;
        
        if (super.upgrade()) {
            // Increase storage capacity by 50% per level
            this.storageCapacity = Math.floor(this.storageCapacity * 1.5);
            
            // Update colony storage if placed
            const increaseAmount = this.storageCapacity - beforeCapacity;
            
            // Colony reference isn't stored directly, so this would need to be handled elsewhere
            return true;
        }
        
        return false;
    }
    
    public override serialize(): any {
        const data = super.serialize();
        data.storageCapacity = this.storageCapacity;
        return data;
    }
    
    public static override deserialize(data: any): StorageBuilding {
        const building = super.deserialize(data) as StorageBuilding;
        building.storageCapacity = data.storageCapacity;
        return building;
    }
}

class WorkshopBuilding extends Building implements JobProvider {
    private productionSpeed: number;
    private currentRecipe: Recipe | null = null;
    private productionProgress: number = 0;
    private jobs: Job[] = [];
    
    constructor(id: string, name: string, position: { x: number, y: number }, size: { width: number, height: number }, maxHealth: number, buildCost: Map<ResourceType, number>) {
        super(id, BuildingType.WORKSHOP, name, position, size, maxHealth, buildCost);
        
        // Base production speed
        this.productionSpeed = 1.0;
        
        // Create jobs
        this.jobs = [
            new Job(`${id}_worker`, "Workshop Worker", SkillType.CRAFTING, 1, this.getPosition())
        ];
    }
    
    public update(deltaTime: number): void {
        if (!this.currentRecipe || this.productionProgress >= 1.0) {
            return;
        }
        
        // Only progress if worker assigned
        const worker = this.jobs[0].worker;
        if (!worker) {
            return;
        }
        
        // Progress production based on worker skill and building level
        const baseSpeed = this.productionSpeed * deltaTime;
        const skillFactor = 1.0 + (worker.getSkillLevel(SkillType.CRAFTING) * 0.05);
        const progress = baseSpeed * skillFactor * this.level;
        
        this.productionProgress += progress;
        
        // Check if production complete
        if (this.productionProgress >= 1.0) {
            this.completeProduction();
        }
    }
    
    public setRecipe(recipe: Recipe, colony: Colony): boolean {
        // Check if recipe is valid
        if (!this.canCraftRecipe(recipe, colony)) {
            return false;
        }
        
        // Consume resources
        for (const [type, amount] of recipe.ingredients.entries()) {
            colony.resources.removeResource(type, amount);
        }
        
        // Set recipe and reset progress
        this.currentRecipe = recipe;
        this.productionProgress = 0;
        
        return true;
    }
    
    private canCraftRecipe(recipe: Recipe, colony: Colony): boolean {
        // Check if colony has required resources
        for (const [type, amount] of recipe.ingredients.entries()) {
            if (colony.resources.getAmount(type) < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    private completeProduction(): void {
        if (!this.currentRecipe) {
            return;
        }
        
        // Production complete, item ready for collection
        // In a real implementation, you'd add the product to the colony inventory or create an item
        
        // Reset production
        this.currentRecipe = null;
        this.productionProgress = 0;
    }
    
    public onPlaced(colony: Colony): void {
        // Nothing special when placed
    }
    
    public onRemoved(colony: Colony): void {
        // Release any assigned workers
        for (const job of this.jobs) {
            if (job.worker) {
                job.worker.currentJob = null;
                job.worker = null;
            }
        }
    }
    
    public getAvailableJobs(): Job[] {
        return this.jobs.filter(job => !job.worker);
    }
    
    public override upgrade(): boolean {
        if (super.upgrade()) {
            // Increase production speed by 25% per level
            this.productionSpeed *= 1.25;
            return true;
        }
        
        return false;
    }
    
    public override serialize(): any {
        const data = super.serialize();
        data.productionSpeed = this.productionSpeed;
        data.currentRecipe = this.currentRecipe?.serialize();
        data.productionProgress = this.productionProgress;
        data.jobs = this.jobs.map(job => job.serialize());
        return data;
    }
    
    public static override deserialize(data: any): WorkshopBuilding {
        const building = super.deserialize(data) as WorkshopBuilding;
        building.productionSpeed = data.productionSpeed;
        building.productionProgress = data.productionProgress;
        
        if (data.currentRecipe) {
            building.currentRecipe = Recipe.deserialize(data.currentRecipe);
        }
        
        building.jobs = data.jobs.map(Job.deserialize);
        
        return building;
    }
}

class DormitoryBuilding extends Building implements NeedFulfiller {
    private bedCount: number;
    private comfortLevel: number;
    
    constructor(id: string, name: string, position: { x: number, y: number }, size: { width: number, height: number }, maxHealth: number, buildCost: Map<ResourceType, number>) {
        super(id, BuildingType.DORMITORY, name, position, size, maxHealth, buildCost);
        
        // Calculate bed count based on size (2 beds per 3 tiles)
        this.bedCount = Math.floor((size.width * size.height) / 3) * 2;
        this.comfortLevel = 0.6; // Base comfort level
    }
    
    public update(deltaTime: number): void {
        // Dormitories don't need regular updates
    }
    
    public onPlaced(colony: Colony): void {
        // Nothing special when placed
    }
    
    public onRemoved(colony: Colony): void {
        // Nothing special when removed
    }
    
    public canFulfillNeed(needType: NeedType): boolean {
        return needType === NeedType.REST || needType === NeedType.COMFORT;
    }
    
    public fulfillNeed(need: Need): boolean {
        if (!this.canFulfillNeed(need.type)) {
            return false;
        }
        
        switch (need.type) {
            case NeedType.REST:
                // Rest is fulfilled more quickly
                need.fulfill(0.3);
                return need.value >= 1.0;
                
            case NeedType.COMFORT:
                // Comfort is fulfilled based on comfort level
                need.fulfill(this.comfortLevel * 0.2);
                return need.value >= 1.0;
                
            default:
                return false;
        }
    }
    
    public getBedCount(): number {
        return this.bedCount;
    }
    
    public override upgrade(): boolean {
        if (super.upgrade()) {
            // Increase comfort level by 0.1 per level (up to 0.9 max)
            this.comfortLevel = Math.min(0.9, this.comfortLevel + 0.1);
            return true;
        }
        
        return false;
    }
    
    public override serialize(): any {
        const data = super.serialize();
        data.bedCount = this.bedCount;
        data.comfortLevel = this.comfortLevel;
        return data;
    }
    
    public static override deserialize(data: any): DormitoryBuilding {
        const building = super.deserialize(data) as DormitoryBuilding;
        building.bedCount = data.bedCount;
        building.comfortLevel = data.comfortLevel;
        return building;
    }
}

class Job {
    public id: string;
    public name: string;
    public requiredSkill: SkillType;
    public priority: number;
    public worker: Colonist | null = null;
    private position: Position;
    private workAmount: number = 1.0;
    private workProgress: number = 0;
    
    constructor(id: string, name: string, requiredSkill: SkillType, priority: number, position: Position) {
        this.id = id;
        this.name = name;
        this.requiredSkill = requiredSkill;
        this.priority = priority;
        this.position = position;
    }
    
    public getPosition(): Position {
        return this.position.clone();
    }
    
    public performWork(colonist: Colonist, deltaTime: number): void {
        if (this.isComplete()) {
            return;
        }
        
        // Calculate work efficiency based on skill
        const skillLevel = colonist.getSkillLevel(this.requiredSkill);
        const efficiency = 1.0 + (skillLevel * 0.05);
        
        // Progress work
        this.workProgress += deltaTime * efficiency;
        
        // Grant skill experience
        colonist.gainSkillExperience(this.requiredSkill, deltaTime * 0.1);
    }
    
    public isComplete(): boolean {
        return this.workProgress >= this.workAmount;
    }
    
    public complete(colonist: Colonist): void {
        // Job completed, reset progress
        this.workProgress = 0;
    }
    
    public reset(): void {
        this.workProgress = 0;
        this.worker = null;
    }
    
    public serialize(): any {
        return {
            id: this.id,
            name: this.name,
            requiredSkill: this.requiredSkill,
            priority: this.priority,
            position: { x: this.position.x, y: this.position.y },
            workAmount: this.workAmount,
            workProgress: this.workProgress,
            workerId: this.worker?.id
        };
    }
    
    public static deserialize(data: any): Job {
        const job = new Job(
            data.id,
            data.name,
            data.requiredSkill,
            data.priority,
            new Position(data.position.x, data.position.y)
        );
        
        job.workAmount = data.workAmount;
        job.workProgress = data.workProgress;
        
        // Note: worker reference will be reconnected after colonists are loaded
        
        return job;
    }
}

class Recipe {
    public id: string;
    public name: string;
    public ingredients: Map<ResourceType, number>;
    public products: Map<string, number>; // Item ID to count
    public workAmount: number;
    public requiredSkill: SkillType;
    public requiredSkillLevel: number;
    
    constructor(id: string, name: string, ingredients: Map<ResourceType, number>, products: Map<string, number>, workAmount: number, requiredSkill: SkillType, requiredSkillLevel: number) {
        this.id = id;
        this.name = name;
        this.ingredients = ingredients;
        this.products = products;
        this.workAmount = workAmount;
        this.requiredSkill = requiredSkill;
        this.requiredSkillLevel = requiredSkillLevel;
    }
    
    public serialize(): any {
        return {
            id: this.id,
            name: this.name,
            ingredients: Array.from(this.ingredients.entries()),
            products: Array.from(this.products.entries()),
            workAmount: this.workAmount,
            requiredSkill: this.requiredSkill,
            requiredSkillLevel: this.requiredSkillLevel
        };
    }
    
    public static deserialize(data: any): Recipe {
        const ingredients = new Map<ResourceType, number>();
        for (const [type, amount] of data.ingredients) {
            ingredients.set(parseInt(type), amount);
        }
        
        const products = new Map<string, number>();
        for (const [id, amount] of data.products) {
            products.set(id, amount);
        }
        
        return new Recipe(
            data.id,
            data.name,
            ingredients,
            products,
            data.workAmount,
            data.requiredSkill,
            data.requiredSkillLevel
        );
    }
}
