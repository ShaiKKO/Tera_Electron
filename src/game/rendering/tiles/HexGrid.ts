/**
 * TerraFlux - Hex Grid Manager
 * 
 * Manages the collection of hexagonal tiles, handling rendering, visibility,
 * chunk loading, and providing efficient operations for game mechanics.
 */

import * as PIXI from 'pixi.js';
import { HexTile } from './HexTile';
import { HexTileFactory } from './HexTileFactory';
import { BiomeType, VisibilityState, SelectionType, FeatureType, HexDirection } from './types';
import { CoordinateSystem } from '../../core/utils/CoordinateSystem';

/**
 * Represents a grid of hexagonal tiles
 */
export class HexGrid extends PIXI.Container {
  // Store all tiles indexed by their coordinates
  private _tiles: Map<string, HexTile>;
  
  // Factory for creating tiles
  private _tileFactory: HexTileFactory;
  
  // Track currently selected tile
  private _selectedTileKey: string | null;
  
  // Visibility radius around player/camera
  private _visibilityRadius: number;
  
  // Viewport boundaries for efficient rendering
  private _viewportBounds: {
    minQ: number;
    maxQ: number;
    minR: number;
    maxR: number;
  };
  
  /**
   * Constructor
   * 
   * @param tileFactory - Factory for creating hex tiles
   */
  constructor(tileFactory: HexTileFactory) {
    super();
    
    this._tiles = new Map<string, HexTile>();
    this._tileFactory = tileFactory;
    this._selectedTileKey = null;
    this._visibilityRadius = 10;  // Default visibility radius
    
    // Initialize viewport bounds
    this._viewportBounds = {
      minQ: -10,
      maxQ: 10,
      minR: -10,
      maxR: 10
    };
  }
  
  /**
   * Initialize the grid with specified tiles or a default grid
   * 
   * @param radius - Radius of the hex grid to create (in tiles)
   * @param centerQ - Q coordinate of the center tile
   * @param centerR - R coordinate of the center tile
   */
  public initialize(radius: number = 5, centerQ: number = 0, centerR: number = 0): void {
    // Clear any existing tiles
    this.clear();
    
    // Get all hex coordinates within the radius
    const hexCoords = CoordinateSystem.getHexesInRadius(centerQ, centerR, radius);
    
    // Create tiles for each coordinate
    for (const coord of hexCoords) {
      // Determine a biome type based on position - this is a placeholder algorithm
      // In a real implementation, this would come from a world generator or map data
      const biomeType = this._determineBiomeType(coord.q, coord.r);
      
      // Create and add the tile
      this.createTile(coord.q, coord.r, biomeType);
    }
    
    // Update tile visibility based on center position
    this.updateVisibility(centerQ, centerR);
    
    // Set some special feature tiles as an example
    this._addExampleFeatures(centerQ, centerR);
  }
  
  /**
   * Add some example special features to demonstrate the system
   * 
   * @param centerQ - Q coordinate of the center tile
   * @param centerR - R coordinate of the center tile
   */
  private _addExampleFeatures(centerQ: number, centerR: number): void {
    // Add a resource node near the center
    this.setTileFeature(centerQ + 2, centerR - 1, FeatureType.RESOURCE_NODE);
    
    // Add a landmark
    this.setTileFeature(centerQ - 3, centerR + 1, FeatureType.LANDMARK);
    
    // Add a structure
    this.setTileFeature(centerQ + 1, centerR + 3, FeatureType.STRUCTURE);
    
    // Add an energy source
    this.setTileFeature(centerQ - 2, centerR - 2, FeatureType.ENERGY_SOURCE);
    
    // Add ancient ruins
    this.setTileFeature(centerQ + 4, centerR - 3, FeatureType.ANCIENT_RUIN);
  }
  
  /**
   * Determine a biome type based on coordinates
   * This is a placeholder implementation for demonstration purposes
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns A biome type for the given coordinates
   */
  private _determineBiomeType(q: number, r: number): BiomeType {
    // Simple noise function based on coordinates
    const noise = Math.sin(q * 0.5) * Math.cos(r * 0.5) + Math.sin((q + r) * 0.7);
    
    // Distance from center
    const distance = Math.sqrt(q * q + r * r + q * r);
    
    // Weighted value combining noise and distance
    const value = (noise + 1) * 0.5 * 0.7 + (Math.min(distance / 15, 1)) * 0.3;
    
    // Map the value to a biome type
    if (value < 0.15) return BiomeType.CRYSTAL;
    if (value < 0.3) return BiomeType.VOLCANIC;
    if (value < 0.45) return BiomeType.DESERT;
    if (value < 0.55) return BiomeType.MOUNTAIN;
    if (value < 0.65) return BiomeType.TUNDRA;
    if (value < 0.8) return BiomeType.FOREST;
    return BiomeType.WETLAND;
  }
  
  /**
   * Create a tile key for indexing the tiles map
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns A unique string key for the tile
   */
  private _createTileKey(q: number, r: number): string {
    return `${q},${r}`;
  }
  
  /**
   * Create a new tile at the specified coordinates
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param biomeType - Type of biome for the tile
   * @returns The created tile
   */
  public createTile(q: number, r: number, biomeType: BiomeType): HexTile {
    const key = this._createTileKey(q, r);
    
    // Check if a tile already exists at these coordinates
    if (this._tiles.has(key)) {
      // Remove the existing tile
      this.removeTile(q, r);
    }
    
    // Create the new tile
    const tile = this._tileFactory.createTile(q, r, biomeType);
    
    // Set up interaction events
    this._setupTileInteraction(tile);
    
    // Add the tile to our collection
    this._tiles.set(key, tile);
    this.addChild(tile);
    
    return tile;
  }
  
  /**
   * Set up interaction events for a tile
   * 
   * @param tile - The tile to set up interactions for
   */
  private _setupTileInteraction(tile: HexTile): void {
    tile.interactive = true;
    
    // Mouse over effects
    tile.on('mouseover', () => {
      if (tile.selectionState === SelectionType.NONE) {
        tile.setSelection(SelectionType.HIGHLIGHTED);
      }
    });
    
    // Mouse out effects
    tile.on('mouseout', () => {
      if (tile.selectionState === SelectionType.HIGHLIGHTED) {
        tile.setSelection(SelectionType.NONE);
      }
    });
    
    // Click to select
    tile.on('click', () => {
      this.selectTile(tile.q, tile.r);
    });
  }
  
  /**
   * Get a tile at the specified coordinates
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The tile at the coordinates, or undefined if none exists
   */
  public getTile(q: number, r: number): HexTile | undefined {
    const key = this._createTileKey(q, r);
    return this._tiles.get(key);
  }
  
  /**
   * Remove a tile at the specified coordinates
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns True if a tile was removed, false otherwise
   */
  public removeTile(q: number, r: number): boolean {
    const key = this._createTileKey(q, r);
    const tile = this._tiles.get(key);
    
    if (tile) {
      // If this was the selected tile, clear selection
      if (key === this._selectedTileKey) {
        this._selectedTileKey = null;
      }
      
      // Remove from the scene
      this.removeChild(tile);
      
      // Remove from our collection
      this._tiles.delete(key);
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all tiles from the grid
   */
  public clear(): void {
    // Remove all tiles from the scene
    for (const tile of this._tiles.values()) {
      this.removeChild(tile);
    }
    
    // Clear the collection
    this._tiles.clear();
    this._selectedTileKey = null;
  }
  
  /**
   * Select a tile at the specified coordinates
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The selected tile, or undefined if no tile exists at the coordinates
   */
  public selectTile(q: number, r: number): HexTile | undefined {
    const key = this._createTileKey(q, r);
    const tile = this._tiles.get(key);
    
    if (tile) {
      // Clear previous selection if any
      if (this._selectedTileKey && this._selectedTileKey !== key) {
        const prevTile = this._tiles.get(this._selectedTileKey);
        if (prevTile) {
          prevTile.setSelection(SelectionType.NONE);
        }
      }
      
      // Set new selection
      this._selectedTileKey = key;
      tile.setSelection(SelectionType.SELECTED);
      
      // Trigger a pulse animation
      tile.pulse(0xffffff, 0.5);
      
      return tile;
    }
    
    return undefined;
  }
  
  /**
   * Update visibility of tiles based on a center point
   * 
   * @param centerQ - Q coordinate of the center point
   * @param centerR - R coordinate of the center point
   */
  public updateVisibility(centerQ: number, centerR: number): void {
    // Find all tiles within visibility radius
    const visibleCoords = CoordinateSystem.getHexesInRadius(centerQ, centerR, this._visibilityRadius);
    const visibleKeys = new Set<string>();
    
    // Mark tiles within direct visibility as visible
    for (const coord of visibleCoords) {
      const key = this._createTileKey(coord.q, coord.r);
      visibleKeys.add(key);
      
      const tile = this._tiles.get(key);
      if (tile) {
        tile.setVisibility(VisibilityState.VISIBLE);
      }
    }
    
    // Find tiles for the foggy perimeter (one ring outside visibility)
    const fogRadius = this._visibilityRadius + 1;
    const fogCoords = CoordinateSystem.getHexRing(centerQ, centerR, fogRadius);
    
    // Mark perimeter tiles as foggy
    for (const coord of fogCoords) {
      const key = this._createTileKey(coord.q, coord.r);
      
      const tile = this._tiles.get(key);
      if (tile) {
        tile.setVisibility(VisibilityState.FOGGY);
      }
    }
    
    // Set all other tiles as unexplored
    for (const [key, tile] of this._tiles) {
      if (!visibleKeys.has(key) && !fogCoords.some(c => this._createTileKey(c.q, c.r) === key)) {
        tile.setVisibility(VisibilityState.UNEXPLORED);
      }
    }
  }
  
  /**
   * Update the grid based on camera position and bounds
   * 
   * @param centerQ - Q coordinate of the camera center
   * @param centerR - R coordinate of the camera center
   * @param viewportWidth - Width of the viewport in pixels
   * @param viewportHeight - Height of the viewport in pixels
   * @param zoom - Current zoom level
   */
  public updateViewport(
    centerQ: number, 
    centerR: number, 
    viewportWidth: number, 
    viewportHeight: number,
    zoom: number
  ): void {
    // Calculate the viewport bounds in hex coordinates
    const hexSize = CoordinateSystem.getHexSize() * zoom;
    const tilesX = Math.ceil(viewportWidth / (hexSize * Math.sqrt(3))) + 2;
    const tilesY = Math.ceil(viewportHeight / (hexSize * 1.5)) + 2;
    
    this._viewportBounds = {
      minQ: Math.floor(centerQ - tilesX),
      maxQ: Math.ceil(centerQ + tilesX),
      minR: Math.floor(centerR - tilesY),
      maxR: Math.ceil(centerR + tilesY)
    };
    
    // Update tile visibility
    this.updateVisibility(centerQ, centerR);
  }
  
  /**
   * Set the visibility radius
   * 
   * @param radius - New visibility radius in tiles
   */
  public setVisibilityRadius(radius: number): void {
    this._visibilityRadius = radius;
  }
  
  /**
   * Get neighbor tiles of a specific tile
   * 
   * @param q - Q coordinate of the tile
   * @param r - R coordinate of the tile
   * @returns Array of neighboring tiles that exist in the grid
   */
  public getNeighbors(q: number, r: number): HexTile[] {
    const neighbors: HexTile[] = [];
    const neighborCoords = CoordinateSystem.getHexNeighbors(q, r);
    
    for (const coord of neighborCoords) {
      const tile = this.getTile(coord.q, coord.r);
      if (tile) {
        neighbors.push(tile);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Set a special feature on a tile
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param featureType - Type of feature to add
   * @returns The modified tile or undefined if tile not found
   */
  public setTileFeature(q: number, r: number, featureType: FeatureType): HexTile | undefined {
    // Get the existing tile
    const tile = this.getTile(q, r);
    if (!tile) return undefined;
    
    // Remember the biome type and visibility
    const biomeType = tile.biomeType;
    const visibility = tile.visibilityState;
    
    // Create a new feature tile to replace it
    const featureTile = this._tileFactory.createFeatureTile(q, r, biomeType, featureType);
    
    // Set up interaction events
    this._setupTileInteraction(featureTile);
    
    // Maintain visibility state
    featureTile.setVisibility(visibility);
    
    // Replace the tile in our collection
    const key = this._createTileKey(q, r);
    this.removeChild(tile);
    this._tiles.set(key, featureTile);
    this.addChild(featureTile);
    
    return featureTile;
  }
  
  /**
   * Create a transition between two biomes
   * 
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param direction - Direction of the transition
   * @param targetBiome - Biome to transition to
   * @returns The modified tile or undefined if tile not found
   */
  public createBiomeTransition(
    q: number, 
    r: number, 
    direction: HexDirection, 
    targetBiome: BiomeType
  ): HexTile | undefined {
    // Get the existing tile
    const tile = this.getTile(q, r);
    if (!tile) return undefined;
    
    // Remember the current biome and visibility
    const sourceBiome = tile.biomeType;
    const visibility = tile.visibilityState;
    
    // Create a new transition tile
    const transitionTile = this._tileFactory.createTransitionTile(
      q, r, sourceBiome, targetBiome, direction
    );
    
    // Set up interaction events
    this._setupTileInteraction(transitionTile);
    
    // Maintain visibility state
    transitionTile.setVisibility(visibility);
    
    // Replace the tile in our collection
    const key = this._createTileKey(q, r);
    this.removeChild(tile);
    this._tiles.set(key, transitionTile);
    this.addChild(transitionTile);
    
    return transitionTile;
  }
  
  /**
   * Update all tiles' animations
   * @param deltaTime - Time elapsed since last update in seconds
   */
  public update(deltaTime: number): void {
    // Skip dynamic updates - only render when explicitly requested
    // We'll only update visible tiles when rendering is explicitly requested by the parent component
  }
  
  /**
   * Get the currently selected tile if any
   * 
   * @returns The currently selected tile or undefined if none is selected
   */
  public getSelectedTile(): HexTile | undefined {
    if (this._selectedTileKey) {
      return this._tiles.get(this._selectedTileKey);
    }
    return undefined;
  }
  
  /**
   * Clear the current tile selection if any exists
   */
  public clearSelection(): void {
    if (this._selectedTileKey) {
      const tile = this._tiles.get(this._selectedTileKey);
      if (tile) {
        tile.setSelection(SelectionType.NONE);
      }
      this._selectedTileKey = null;
    }
  }
  
  /**
   * Get all tiles as an array
   * 
   * @returns Array of all tiles in the grid
   */
  public getAllTiles(): HexTile[] {
    return Array.from(this._tiles.values());
  }
  
  /**
   * Convert screen coordinates to the tile at that position
   * 
   * @param screenX - X coordinate in screen space
   * @param screenY - Y coordinate in screen space
   * @returns The tile at the screen position or undefined if none exists
   */
  public getTileAtScreen(screenX: number, screenY: number): HexTile | undefined {
    // Convert screen coordinates to world coordinates
    const worldX = screenX - this.position.x;
    const worldY = screenY - this.position.y;
    
    // Convert world coordinates to hex coordinates
    const hexCoord = CoordinateSystem.worldToHex(worldX, worldY);
    
    // Get the tile at the hex coordinates
    return this.getTile(Math.round(hexCoord.q), Math.round(hexCoord.r));
  }
}
