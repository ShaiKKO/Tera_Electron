/**
 * TerraFlux - World Tile
 * 
 * Concrete implementation of the WorldTile interface with serialization
 * support for the world map structure.
 */

import { BiomeType } from '../rendering/tiles/types';
import { WorldTile as IWorldTile, WorldFeature, WorldResource } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Class representing a world tile in the game world
 * Implements the WorldTile interface with additional methods
 */
export class WorldTile implements IWorldTile {
  // Interface properties
  public q: number;
  public r: number;
  public biomeType: BiomeType;
  public variation: number;
  public elevation: number;
  public moisture: number;
  public temperature: number;
  public features: WorldFeature[];
  public resources: WorldResource[];
  public discovered: boolean;
  public explored: boolean;
  public visibility: number;
  
  // Additional properties
  private _id: string;
  private _lastUpdated: number;
  
  /**
   * Constructor
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param biomeType - Type of biome
   * @param variation - Variation index (0-4)
   * @param elevation - Elevation value (0-1)
   * @param moisture - Moisture value (0-1)
   * @param temperature - Temperature value (0-1)
   */
  constructor(
    q: number,
    r: number,
    biomeType: BiomeType,
    variation: number = 0,
    elevation: number = 0.5,
    moisture: number = 0.5,
    temperature: number = 0.5
  ) {
    this.q = q;
    this.r = r;
    this.biomeType = biomeType;
    this.variation = variation;
    this.elevation = elevation;
    this.moisture = moisture;
    this.temperature = temperature;
    
    this.features = [];
    this.resources = [];
    this.discovered = false;
    this.explored = false;
    this.visibility = 0;
    
    this._id = uuidv4();
    this._lastUpdated = Date.now();
  }
  
  /**
   * Get the unique ID for this tile
   * @returns The tile ID
   */
  public getId(): string {
    return this._id;
  }
  
  /**
   * Get the last updated timestamp
   * @returns The timestamp in milliseconds
   */
  public getLastUpdated(): number {
    return this._lastUpdated;
  }
  
  /**
   * Update the last updated timestamp
   */
  public touch(): void {
    this._lastUpdated = Date.now();
  }
  
  /**
   * Add a feature to the tile
   * @param feature - The feature to add
   */
  public addFeature(feature: WorldFeature): void {
    this.features.push(feature);
    this.touch();
  }
  
  /**
   * Add a resource to the tile
   * @param resource - The resource to add
   */
  public addResource(resource: WorldResource): void {
    this.resources.push(resource);
    this.touch();
  }
  
  /**
   * Remove a feature from the tile
   * @param featureType - The feature type to remove
   * @param subType - The feature subtype to remove
   * @returns Whether the feature was removed
   */
  public removeFeature(featureType: string, subType: string): boolean {
    const initialLength = this.features.length;
    this.features = this.features.filter(
      feature => !(feature.type === featureType && feature.subType === subType)
    );
    
    const wasRemoved = this.features.length < initialLength;
    if (wasRemoved) {
      this.touch();
    }
    
    return wasRemoved;
  }
  
  /**
   * Remove a resource from the tile
   * @param resourceType - The resource type to remove
   * @returns Whether the resource was removed
   */
  public removeResource(resourceType: string): boolean {
    const initialLength = this.resources.length;
    this.resources = this.resources.filter(
      resource => resource.type !== resourceType
    );
    
    const wasRemoved = this.resources.length < initialLength;
    if (wasRemoved) {
      this.touch();
    }
    
    return wasRemoved;
  }
  
  /**
   * Update a resource amount
   * @param resourceType - The resource type to update
   * @param amount - The new amount
   * @returns Whether the resource was updated
   */
  public updateResourceAmount(resourceType: string, amount: number): boolean {
    const resource = this.resources.find(r => r.type === resourceType);
    if (!resource) {
      return false;
    }
    
    resource.amount = amount;
    this.touch();
    return true;
  }
  
  /**
   * Mark the tile as discovered
   */
  public markDiscovered(): void {
    if (!this.discovered) {
      this.discovered = true;
      this.touch();
    }
  }
  
  /**
   * Mark the tile as explored
   */
  public markExplored(): void {
    if (!this.explored) {
      this.explored = true;
      this.discovered = true; // Explored tiles are always discovered
      this.touch();
    }
  }
  
  /**
   * Set the visibility level
   * @param visibility - Visibility level (0-1)
   */
  public setVisibility(visibility: number): void {
    if (this.visibility !== visibility) {
      this.visibility = Math.max(0, Math.min(1, visibility)); // Clamp to 0-1
      this.touch();
    }
  }
  
  /**
   * Discover a feature on the tile
   * @param featureType - The feature type to discover
   * @param subType - The feature subtype to discover
   * @returns Whether the feature was discovered
   */
  public discoverFeature(featureType: string, subType: string): boolean {
    const feature = this.features.find(
      f => f.type === featureType && f.subType === subType && !f.discovered
    );
    
    if (feature) {
      feature.discovered = true;
      this.touch();
      return true;
    }
    
    return false;
  }
  
  /**
   * Discover a resource on the tile
   * @param resourceType - The resource type to discover
   * @returns Whether the resource was discovered
   */
  public discoverResource(resourceType: string): boolean {
    const resource = this.resources.find(
      r => r.type === resourceType && !r.discovered
    );
    
    if (resource) {
      resource.discovered = true;
      this.touch();
      return true;
    }
    
    return false;
  }
  
  /**
   * Create a serializable representation of the tile
   * @returns Serializable object
   */
  public serialize(): any {
    return {
      id: this._id,
      q: this.q,
      r: this.r,
      biomeType: this.biomeType,
      variation: this.variation,
      elevation: this.elevation,
      moisture: this.moisture,
      temperature: this.temperature,
      features: this.features.map(feature => ({ ...feature })),
      resources: this.resources.map(resource => ({ ...resource })),
      discovered: this.discovered,
      explored: this.explored,
      visibility: this.visibility,
      lastUpdated: this._lastUpdated
    };
  }
  
  /**
   * Create a tile from serialized data
   * @param data - Serialized tile data
   * @returns A new WorldTile instance
   */
  public static deserialize(data: any): WorldTile {
    const tile = new WorldTile(
      data.q,
      data.r,
      data.biomeType,
      data.variation,
      data.elevation,
      data.moisture,
      data.temperature
    );
    
    tile._id = data.id || uuidv4();
    tile.features = [...data.features];
    tile.resources = [...data.resources];
    tile.discovered = data.discovered;
    tile.explored = data.explored;
    tile.visibility = data.visibility;
    tile._lastUpdated = data.lastUpdated || Date.now();
    
    return tile;
  }
  
  /**
   * Create a copy of this tile
   * @returns A new WorldTile instance with the same properties
   */
  public clone(): WorldTile {
    return WorldTile.deserialize(this.serialize());
  }
  
  /**
   * Get the coordinate string representation (q,r)
   * @returns Coordinate string
   */
  public getCoordString(): string {
    return `(${this.q},${this.r})`;
  }
  
  /**
   * Check if two tiles are at the same coordinates
   * @param other - The other tile to compare with
   * @returns Whether the tiles are at the same coordinates
   */
  public sameCoordinates(other: WorldTile): boolean {
    return this.q === other.q && this.r === other.r;
  }
}
