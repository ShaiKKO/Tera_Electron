/**
 * TerraFlux - World Map Manager
 * 
 * Manages the current world map, loading, saving, and interacting
 * with world data.
 */

import { WorldFeature, WorldResource } from './types';
import { WorldMap } from './WorldMap';
import { WorldTile } from './WorldTile';
import { WorldGenerator } from './WorldGenerator';
import { BiomeDefinitionManager } from './BiomeDefinitionManager';
import { v4 as uuidv4 } from 'uuid';
import { CoordinateSystem } from '../core/utils/CoordinateSystem';
import { EventEmitter } from '../core/ecs/EventEmitter';

/**
 * World manager events
 */
export enum WorldMapEvents {
  WORLD_LOADED = 'world_loaded',
  WORLD_SAVED = 'world_saved',
  TILE_EXPLORED = 'tile_explored',
  FEATURE_DISCOVERED = 'feature_discovered',
  RESOURCE_DISCOVERED = 'resource_discovered'
}

/**
 * World save format
 */
export interface WorldSaveData {
  id: string;
  name: string;
  timestamp: number;
  version: string;
  data: WorldMap;
}

/**
 * Class for managing the active world map
 */
export class WorldMapManager extends EventEmitter {
  private _currentWorld: WorldMap | null = null;
  private _generator: WorldGenerator;
  private _biomeManager: BiomeDefinitionManager;
  private _isGeneratingWorld: boolean = false;
  
  /**
   * Constructor
   * @param biomeManager - The biome definition manager
   */
  constructor(biomeManager: BiomeDefinitionManager) {
    super();
    this._biomeManager = biomeManager;
    this._generator = new WorldGenerator({}, biomeManager);
  }
  
  /**
   * Get the current world map
   * @returns The current world map
   */
  public getCurrentWorld(): WorldMap | null {
    return this._currentWorld;
  }
  
  /**
   * Generate a new world
   * @param options - World generation options
   * @returns The generated world
   */
  public generateNewWorld(options: any = {}): WorldMap {
    if (this._isGeneratingWorld) {
      throw new Error('World generation already in progress');
    }

    this._isGeneratingWorld = true;

    try {
      // Create a new generator with the provided options
      this._generator = new WorldGenerator(options, this._biomeManager);
      
      // Generate base world data
      const generatedData = this._generator.generateWorld();
      
      // Create new world map instance
      const worldMap = new WorldMap(
        generatedData.name,
        generatedData.seed,
        generatedData.size
      );
      
      // Convert generated tiles to WorldTile instances
      const worldTiles = generatedData.tiles.map(tileData => {
        return new WorldTile(
          tileData.q,
          tileData.r,
          tileData.biomeType,
          tileData.variation,
          tileData.elevation,
          tileData.moisture,
          tileData.temperature
        );
      });
      
      // Add features and resources to tiles
      for (let i = 0; i < generatedData.tiles.length; i++) {
        const tileData = generatedData.tiles[i];
        const worldTile = worldTiles[i];
        
        // Add features
        tileData.features.forEach((feature: WorldFeature) => {
          worldTile.addFeature(feature);
        });
        
        // Add resources
        tileData.resources.forEach((resource: WorldResource) => {
          worldTile.addResource(resource);
        });
        
        // Set discovered and explored flags
        if (tileData.discovered) {
          worldTile.markDiscovered();
        }
        if (tileData.explored) {
          worldTile.markExplored();
        }
        
        worldTile.setVisibility(tileData.visibility);
      }
      
      // Add all tiles to the world map
      worldMap.addTiles(worldTiles);
      
      // Set biome distribution
      worldMap.setBiomeDistribution(generatedData.biomeDistribution);
      
      // Set player position
      worldMap.updatePlayerPosition(generatedData.playerTileQ, generatedData.playerTileR);
      
      // Set explored tile count
      worldMap.exploredTileCount = generatedData.exploredTileCount;
      
      // Set as current world
      this._currentWorld = worldMap;
      
      // Emit event
      this.emit(WorldMapEvents.WORLD_LOADED, worldMap);
      
      return worldMap;
    } finally {
      this._isGeneratingWorld = false;
    }
  }
  
  /**
   * Load a world from save data
   * @param saveData - The save data to load
   * @returns The loaded world
   */
  public loadWorld(saveData: WorldSaveData): WorldMap {
    // Deserialize the world map
    const worldMap = WorldMap.deserialize(saveData.data);
    
    // Set as current world
    this._currentWorld = worldMap;
    
    // Set last saved timestamp
    this._currentWorld.setLastSaved(saveData.timestamp);
    
    // Emit event
    this.emit(WorldMapEvents.WORLD_LOADED, this._currentWorld);
    
    return this._currentWorld;
  }
  
  /**
   * Save the current world
   * @returns Save data for the current world
   */
  public saveWorld(): WorldSaveData | null {
    if (!this._currentWorld) {
      return null;
    }
    
    const timestamp = Date.now();
    
    // Serialize the world map
    const serializedData = this._currentWorld.serialize();
    
    // Update last saved timestamp
    this._currentWorld.setLastSaved(timestamp);
    
    const saveData: WorldSaveData = {
      id: this._currentWorld.id,
      name: this._currentWorld.name,
      timestamp: timestamp,
      version: this._currentWorld.version,
      data: serializedData
    };
    
    this.emit(WorldMapEvents.WORLD_SAVED, saveData);
    return saveData;
  }
  
  /**
   * Get a tile by its coordinates
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The tile at the coordinates, or null if not found
   */
  public getTile(q: number, r: number): WorldTile | null {
    if (!this._currentWorld) {
      return null;
    }
    
    return this._currentWorld.getTile(q, r);
  }
  
  /**
   * Get tiles within a radius of a center tile
   * @param centerQ - Center Q coordinate
   * @param centerR - Center R coordinate
   * @param radius - Radius to include
   * @returns Array of tiles within the radius
   */
  public getTilesInRadius(centerQ: number, centerR: number, radius: number): WorldTile[] {
    if (!this._currentWorld) {
      return [];
    }
    
    return this._currentWorld.getTilesInRadius(centerQ, centerR, radius);
  }
  
  /**
   * Explore a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Whether the tile was explored
   */
  public exploreTile(q: number, r: number): boolean {
    const tile = this.getTile(q, r);
    if (!tile || !this._currentWorld) {
      return false;
    }
    
    // If already explored, no change
    if (tile.explored) {
      return false;
    }
    
    // Mark as explored and discovered
    tile.markExplored();
    
    // Update counter
    this._currentWorld.exploredTileCount++;
    
    // Emit event
    this.emit(WorldMapEvents.TILE_EXPLORED, tile);
    
    return true;
  }
  
  /**
   * Discover features on a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Array of newly discovered features
   */
  public discoverFeatures(q: number, r: number): WorldFeature[] {
    const tile = this.getTile(q, r);
    if (!tile) {
      return [];
    }
    
    const newlyDiscovered: WorldFeature[] = [];
    
    for (const feature of tile.features) {
      if (!feature.discovered) {
        const wasDiscovered = tile.discoverFeature(feature.type, feature.subType);
        
        if (wasDiscovered) {
          newlyDiscovered.push(feature);
          
          // Emit event for each discovered feature
          this.emit(WorldMapEvents.FEATURE_DISCOVERED, {
            tile,
            feature
          });
        }
      }
    }
    
    return newlyDiscovered;
  }
  
  /**
   * Discover resources on a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Array of newly discovered resources
   */
  public discoverResources(q: number, r: number): WorldResource[] {
    const tile = this.getTile(q, r);
    if (!tile) {
      return [];
    }
    
    const newlyDiscovered: WorldResource[] = [];
    
    for (const resource of tile.resources) {
      if (!resource.discovered) {
        const wasDiscovered = tile.discoverResource(resource.type);
        
        if (wasDiscovered) {
          newlyDiscovered.push(resource);
          
          // Emit event for each discovered resource
          this.emit(WorldMapEvents.RESOURCE_DISCOVERED, {
            tile,
            resource
          });
        }
      }
    }
    
    return newlyDiscovered;
  }
  
  /**
   * Update player position
   * @param q - New Q coordinate
   * @param r - New R coordinate
   */
  public updatePlayerPosition(q: number, r: number): void {
    if (!this._currentWorld) {
      return;
    }
    
    this._currentWorld.playerTileQ = q;
    this._currentWorld.playerTileR = r;
    
    // Explore this tile and discover its features and resources
    this.exploreTile(q, r);
    this.discoverFeatures(q, r);
    this.discoverResources(q, r);
    
    // Also discover adjacent tiles
    const neighbors = CoordinateSystem.getHexNeighbors(q, r);
    for (const neighbor of neighbors) {
      const tile = this.getTile(neighbor.q, neighbor.r);
      if (tile) {
        tile.discovered = true;
      }
    }
  }
  
  /**
   * Get tiles by biome type
   * @param biomeType - The biome type to filter by
   * @returns Array of tiles with the specified biome type
   */
  public getTilesByBiome(biomeType: string): WorldTile[] {
    if (!this._currentWorld) {
      return [];
    }
    
    return this._currentWorld.getTilesByBiome(biomeType as any);
  }
  
  /**
   * Get discovered tiles
   * @returns Array of discovered tiles
   */
  public getDiscoveredTiles(): WorldTile[] {
    if (!this._currentWorld) {
      return [];
    }
    
    return this._currentWorld.getDiscoveredTiles();
  }
  
  /**
   * Get explored tiles
   * @returns Array of explored tiles
   */
  public getExploredTiles(): WorldTile[] {
    if (!this._currentWorld) {
      return [];
    }
    
    return this._currentWorld.getExploredTiles();
  }
  
  /**
   * Get world statistics
   * @returns Object with world statistics, or null if no world is loaded
   */
  public getWorldStatistics(): {
    totalTiles: number;
    discoveredPercent: number;
    exploredPercent: number;
    biomePercentages: Record<string, number>;
  } | null {
    if (!this._currentWorld) {
      return null;
    }
    
    return this._currentWorld.calculateStatistics();
  }
}
