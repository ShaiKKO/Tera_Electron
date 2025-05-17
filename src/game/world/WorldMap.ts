/**
 * TerraFlux - World Map
 * 
 * Concrete implementation of the WorldMap interface with serialization
 * support for the world map structure.
 */

import { BiomeType } from '../rendering/tiles/types';
import { WorldMap as IWorldMap } from './types';
import { WorldTile } from './WorldTile';
import { CoordinateSystem } from '../core/utils/CoordinateSystem';
import { v4 as uuidv4 } from 'uuid';

/**
 * Class representing a world map in the game
 * Implements the WorldMap interface with additional methods
 */
export class WorldMap implements IWorldMap {
  // Interface properties
  public id: string;
  public name: string;
  public seed: number;
  public timestamp: number;
  public version: string;
  public size: number;
  public biomeDistribution: Record<BiomeType, number>;
  public tiles: WorldTile[];
  public playerTileQ: number;
  public playerTileR: number;
  public exploredTileCount: number;
  
  // Additional properties
  private _tileMap: Map<string, WorldTile>;
  private _lastSaved: number;
  
  /**
   * Constructor
   * @param name - Name of the world
   * @param seed - Seed for RNG
   * @param size - Size/radius of the world in tiles
   */
  constructor(name: string, seed: number, size: number) {
    this.id = uuidv4();
    this.name = name;
    this.seed = seed;
    this.timestamp = Date.now();
    this.version = '1.0';
    this.size = size;
    this.biomeDistribution = {} as Record<BiomeType, number>;
    this.tiles = [];
    this.playerTileQ = 0;
    this.playerTileR = 0;
    this.exploredTileCount = 0;
    
    this._tileMap = new Map<string, WorldTile>();
    this._lastSaved = 0;
  }
  
  /**
   * Get a key for the tile map
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns String key for the tile map
   */
  private _getTileKey(q: number, r: number): string {
    return `${q},${r}`;
  }
  
  /**
   * Add a tile to the map
   * @param tile - The tile to add
   */
  public addTile(tile: WorldTile): void {
    // Add to array
    this.tiles.push(tile);
    
    // Add to map for quick lookup
    const key = this._getTileKey(tile.q, tile.r);
    this._tileMap.set(key, tile);
  }
  
  /**
   * Add multiple tiles to the map
   * @param tiles - The tiles to add
   */
  public addTiles(tiles: WorldTile[]): void {
    for (const tile of tiles) {
      this.addTile(tile);
    }
  }
  
  /**
   * Get a tile by coordinates
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The tile at the coordinates, or null if not found
   */
  public getTile(q: number, r: number): WorldTile | null {
    const key = this._getTileKey(q, r);
    return this._tileMap.get(key) || null;
  }
  
  /**
   * Set the biome distribution
   * @param distribution - Record of biome types to their percentage
   */
  public setBiomeDistribution(distribution: Record<BiomeType, number>): void {
    this.biomeDistribution = { ...distribution };
  }
  
  /**
   * Get tiles within a radius of a center tile
   * @param centerQ - Center Q coordinate
   * @param centerR - Center R coordinate
   * @param radius - Radius to include
   * @returns Array of tiles within the radius
   */
  public getTilesInRadius(centerQ: number, centerR: number, radius: number): WorldTile[] {
    const coords = CoordinateSystem.getHexesInRadius(centerQ, centerR, radius);
    const tiles: WorldTile[] = [];
    
    for (const coord of coords) {
      const tile = this.getTile(coord.q, coord.r);
      if (tile) {
        tiles.push(tile);
      }
    }
    
    return tiles;
  }
  
  /**
   * Get all tiles of a specific biome type
   * @param biomeType - The biome type to filter by
   * @returns Array of tiles of the specified biome type
   */
  public getTilesByBiome(biomeType: BiomeType): WorldTile[] {
    return this.tiles.filter(tile => tile.biomeType === biomeType);
  }
  
  /**
   * Get all discovered tiles
   * @returns Array of discovered tiles
   */
  public getDiscoveredTiles(): WorldTile[] {
    return this.tiles.filter(tile => tile.discovered);
  }
  
  /**
   * Get all explored tiles
   * @returns Array of explored tiles
   */
  public getExploredTiles(): WorldTile[] {
    return this.tiles.filter(tile => tile.explored);
  }
  
  /**
   * Update the player position
   * @param q - New Q coordinate
   * @param r - New R coordinate
   * @returns Whether the position was updated
   */
  public updatePlayerPosition(q: number, r: number): boolean {
    const tile = this.getTile(q, r);
    if (!tile) {
      return false;
    }
    
    this.playerTileQ = q;
    this.playerTileR = r;
    return true;
  }
  
  /**
   * Set the last saved timestamp
   * @param timestamp - The timestamp to set
   */
  public setLastSaved(timestamp: number): void {
    this._lastSaved = timestamp;
  }
  
  /**
   * Get the last saved timestamp
   * @returns The last saved timestamp
   */
  public getLastSaved(): number {
    return this._lastSaved;
  }
  
  /**
   * Create a serializable representation of the world map
   * @returns Serializable object
   */
  public serialize(): any {
    return {
      id: this.id,
      name: this.name,
      seed: this.seed,
      timestamp: this.timestamp,
      version: this.version,
      size: this.size,
      biomeDistribution: { ...this.biomeDistribution },
      tiles: this.tiles.map(tile => tile.serialize()),
      playerTileQ: this.playerTileQ,
      playerTileR: this.playerTileR,
      exploredTileCount: this.exploredTileCount,
      lastSaved: this._lastSaved
    };
  }
  
  /**
   * Create a world map from serialized data
   * @param data - Serialized world map data
   * @returns A new WorldMap instance
   */
  public static deserialize(data: any): WorldMap {
    const worldMap = new WorldMap(data.name, data.seed, data.size);
    
    worldMap.id = data.id || uuidv4();
    worldMap.timestamp = data.timestamp || Date.now();
    worldMap.version = data.version || '1.0';
    worldMap.biomeDistribution = { ...data.biomeDistribution };
    worldMap.playerTileQ = data.playerTileQ || 0;
    worldMap.playerTileR = data.playerTileR || 0;
    worldMap.exploredTileCount = data.exploredTileCount || 0;
    worldMap._lastSaved = data.lastSaved || 0;
    
    // Deserialize tiles
    const tiles = data.tiles.map((tileData: any) => WorldTile.deserialize(tileData));
    worldMap.addTiles(tiles);
    
    return worldMap;
  }
  
  /**
   * Find a suitable starting tile
   * @returns A suitable starting tile
   */
  public findSuitableStartingTile(): WorldTile | null {
    // Prioritize temperate biomes near the center
    const centerTiles = this.getTilesInRadius(0, 0, Math.floor(this.size * 0.3));
    
    // First look for forest or wetlands (most hospitable)
    const hospitable = centerTiles.filter(
      tile => tile.biomeType === BiomeType.FOREST || 
              tile.biomeType === BiomeType.WETLAND
    );
    
    if (hospitable.length > 0) {
      return hospitable[0];
    }
    
    // Fall back to any tile not too extreme
    const fallback = centerTiles.filter(
      tile => tile.biomeType !== BiomeType.VOLCANIC && 
              tile.biomeType !== BiomeType.CRYSTAL
    );
    
    if (fallback.length > 0) {
      return fallback[0];
    }
    
    // Last resort - any center tile
    return centerTiles.length > 0 ? centerTiles[0] : null;
  }
  
  /**
   * Calculate the overall world statistics
   * @returns Object with world statistics
   */
  public calculateStatistics(): {
    totalTiles: number;
    discoveredPercent: number;
    exploredPercent: number;
    biomePercentages: Record<BiomeType, number>;
  } {
    const totalTiles = this.tiles.length;
    const discovered = this.getDiscoveredTiles().length;
    const explored = this.getExploredTiles().length;
    
    // Calculate biome percentages
    const biomeCounts: Record<string, number> = {};
    for (const tile of this.tiles) {
      biomeCounts[tile.biomeType] = (biomeCounts[tile.biomeType] || 0) + 1;
    }
    
    const biomePercentages: Record<BiomeType, number> = {} as Record<BiomeType, number>;
    for (const biomeType of Object.values(BiomeType)) {
      biomePercentages[biomeType] = (biomeCounts[biomeType] || 0) / totalTiles;
    }
    
    return {
      totalTiles,
      discoveredPercent: discovered / totalTiles,
      exploredPercent: explored / totalTiles,
      biomePercentages
    };
  }
}
