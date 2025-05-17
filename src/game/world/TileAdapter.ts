/**
 * TerraFlux - Tile Adapter
 * 
 * Bridges the game state (WorldTile) with the rendering system (HexTile).
 * This adapter converts between the data model and visual representation.
 */

import { WorldTile } from './WorldTile';
import { HexTile } from '../rendering/tiles/HexTile';
import { BiomeType, VisibilityState, SelectionType, ResourceNode } from '../rendering/tiles/types';
import * as PIXI from 'pixi.js';
import { TextureManager } from '../rendering/TextureManager';

/**
 * Class for adapting between WorldTile game state and HexTile rendering
 */
export class TileAdapter {
  // Mapping from tiles to renderable entities
  private static _tileRenderMap = new Map<string, HexTile>();
  
  /**
   * Create a renderable HexTile from a WorldTile
   * @param worldTile - The world tile data
   * @param textureManager - The texture manager for loading textures
   * @returns The created HexTile instance
   */
  public static createRenderableTile(worldTile: WorldTile, textureManager: TextureManager): HexTile {
    // Check if we already have a renderable for this tile
    const key = this._getTileKey(worldTile);
    if (this._tileRenderMap.has(key)) {
      return this._tileRenderMap.get(key)!;
    }
    
    // Create a new HexTile with the world tile's properties
    const hexTile = new HexTile(
      worldTile.q,
      worldTile.r,
      worldTile.biomeType
    );
    
    // Apply textures based on biome type and variation
    this._applyBiomeTextures(hexTile, worldTile, textureManager);
    
    // Add features and decorations
    this._addFeatureDecorations(hexTile, worldTile, textureManager);
    
    // Add resource visualizations
    this._addResourceVisualizations(hexTile, worldTile, textureManager);
    
    // Set visibility state
    this._updateVisibilityState(hexTile, worldTile);
    
    // Store in the map for future reference
    this._tileRenderMap.set(key, hexTile);
    
    return hexTile;
  }
  
  /**
   * Update a renderable HexTile from a WorldTile
   * @param worldTile - The world tile data
   * @param textureManager - The texture manager for loading textures
   * @returns The updated HexTile instance, or null if not found
   */
  public static updateRenderableTile(worldTile: WorldTile, textureManager: TextureManager): HexTile | null {
    // Get the existing renderable tile
    const key = this._getTileKey(worldTile);
    const hexTile = this._tileRenderMap.get(key);
    
    if (!hexTile) {
      return null;
    }
    
    // Update visibility state
    this._updateVisibilityState(hexTile, worldTile);
    
    // We might need to update features or resources if they've changed
    // For now, we'll just update visibility as that's the most common change
    
    return hexTile;
  }
  
  /**
   * Set the selection state of a renderable tile
   * @param worldTile - The world tile
   * @param selectionType - The selection type to set
   * @returns Whether the selection state was set
   */
  public static setTileSelection(worldTile: WorldTile, selectionType: SelectionType): boolean {
    const key = this._getTileKey(worldTile);
    const hexTile = this._tileRenderMap.get(key);
    
    if (!hexTile) {
      return false;
    }
    
    hexTile.setSelection(selectionType);
    return true;
  }
  
  /**
   * Create a pulse effect on a renderable tile
   * @param worldTile - The world tile
   * @param color - Color of the pulse
   * @param duration - Duration of the pulse in seconds
   * @returns Whether the pulse was created
   */
  public static pulseTile(worldTile: WorldTile, color: number, duration: number): boolean {
    const key = this._getTileKey(worldTile);
    const hexTile = this._tileRenderMap.get(key);
    
    if (!hexTile) {
      return false;
    }
    
    hexTile.pulse(color, duration);
    return true;
  }
  
  /**
   * Remove a renderable tile
   * @param worldTile - The world tile to remove
   * @returns Whether the tile was removed
   */
  public static removeRenderableTile(worldTile: WorldTile): boolean {
    const key = this._getTileKey(worldTile);
    const hexTile = this._tileRenderMap.get(key);
    
    if (!hexTile) {
      return false;
    }
    
    // Remove from the map
    this._tileRenderMap.delete(key);
    
    // Remove from parent if it has one
    if (hexTile.parent) {
      hexTile.parent.removeChild(hexTile);
    }
    
    return true;
  }
  
  /**
   * Clear all renderable tiles
   */
  public static clearAllRenderableTiles(): void {
    for (const [key, hexTile] of this._tileRenderMap.entries()) {
      if (hexTile.parent) {
        hexTile.parent.removeChild(hexTile);
      }
    }
    
    this._tileRenderMap.clear();
  }
  
  /**
   * Get all renderable tiles
   * @returns An array of all HexTile instances
   */
  public static getAllRenderableTiles(): HexTile[] {
    return Array.from(this._tileRenderMap.values());
  }
  
  /**
   * Get a unique key for a tile
   * @param worldTile - The world tile
   * @returns A unique key for the tile
   */
  private static _getTileKey(worldTile: WorldTile): string {
    return `${worldTile.q},${worldTile.r}`;
  }
  
  /**
   * Apply textures based on biome type and variation
   * @param hexTile - The hex tile to update
   * @param worldTile - The world tile data
   * @param textureManager - The texture manager
   */
  private static _applyBiomeTextures(
    hexTile: HexTile,
    worldTile: WorldTile,
    textureManager: TextureManager
  ): void {
    // In a real implementation, we would load proper textures from the texture manager
    // For now, we'll use the placeholder hexagon that's already created in the HexTile constructor
    
    // Example of how we would set an actual texture:
    // const texturePath = `biomes/${worldTile.biomeType}_${worldTile.variation}`;
    // const texture = textureManager.getTexture(texturePath);
    // if (texture) {
    //   hexTile.setBaseTexture(texture);
    // }
    
    // Create tinted overlays based on biome type
    // This would be replaced with actual textures in production
    let biomeColor: number;
    
    switch (worldTile.biomeType) {
      case BiomeType.FOREST:
        biomeColor = 0x2b803e;
        break;
      case BiomeType.MOUNTAIN:
        biomeColor = 0x7a7a7a;
        break;
      case BiomeType.DESERT:
        biomeColor = 0xe5c271;
        break;
      case BiomeType.TUNDRA:
        biomeColor = 0xd0e5f2;
        break;
      case BiomeType.WETLAND:
        biomeColor = 0x42734a;
        break;
      case BiomeType.VOLCANIC:
        biomeColor = 0x813129;
        break;
      case BiomeType.CRYSTAL:
        biomeColor = 0x9c59b3;
        break;
      default:
        biomeColor = 0xcccccc;
        break;
    }
    
    // Create a biome-colored overlay
    const biomeOverlay = new PIXI.Sprite(PIXI.Texture.WHITE);
    biomeOverlay.tint = biomeColor;
    biomeOverlay.alpha = 0.8;
    biomeOverlay.width = 100; // Match the hexagon size
    biomeOverlay.height = 100;
    biomeOverlay.anchor.set(0.5);
    biomeOverlay.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    hexTile.addChild(biomeOverlay);
  }
  
  /**
   * Add feature decorations to the tile
   * @param hexTile - The hex tile to update
   * @param worldTile - The world tile data
   * @param textureManager - The texture manager
   */
  private static _addFeatureDecorations(
    hexTile: HexTile,
    worldTile: WorldTile,
    textureManager: TextureManager
  ): void {
    // Only add decorations for discovered features or explored tiles
    const features = worldTile.features.filter(f => f.discovered || worldTile.explored);
    
    for (const feature of features) {
      // In a real implementation, we would create sprite decorations
      // For now, we'll create simple visual indicators
      
      // Create a simple circle as a placeholder for the feature
      const decoration = new PIXI.Graphics();
      decoration.beginFill(0xffffff, 0.7);
      decoration.drawCircle(0, 0, 5);
      decoration.endFill();
      
      // Position randomly within the tile
      decoration.position.set(
        Math.random() * 30 - 15,
        Math.random() * 30 - 15
      );
      
      hexTile.addDecoration(decoration);
    }
  }
  
  /**
   * Add resource visualizations to the tile
   * @param hexTile - The hex tile to update
   * @param worldTile - The world tile data
   * @param textureManager - The texture manager
   */
  private static _addResourceVisualizations(
    hexTile: HexTile,
    worldTile: WorldTile,
    textureManager: TextureManager
  ): void {
    // Only add visualizations for discovered resources or explored tiles
    const resources = worldTile.resources.filter(r => r.discovered || worldTile.explored);
    
    for (const resource of resources) {
      // Create resource node info
      const resourceNode: ResourceNode = {
        type: resource.type,
        amount: resource.amount,
        quality: resource.quality,
        visible: resource.discovered || worldTile.explored,
        position: {
          x: Math.random() * 30 - 15,
          y: Math.random() * 30 - 15
        },
        harvestable: resource.extractable
      };
      
      // Add to the hex tile
      hexTile.addResource(resourceNode);
      
      // In a real implementation, we would create resource visualizations
      // For now, we'll create simple visual indicators
      
      // Create a simple diamond as a placeholder for the resource
      const visualization = new PIXI.Graphics();
      visualization.beginFill(this._getResourceQualityColor(resource.quality), 0.7);
      visualization.drawRect(-4, -4, 8, 8);
      visualization.endFill();
      
      // Position at the resource node's position
      visualization.position.set(resourceNode.position.x, resourceNode.position.y);
      
      // Rotate to make it diamond-shaped
      visualization.rotation = Math.PI / 4;
      
      hexTile.addDecoration(visualization);
    }
  }
  
  /**
   * Get a color based on resource quality
   * @param quality - The resource quality (0-2)
   * @returns Color in hex format
   */
  private static _getResourceQualityColor(quality: number): number {
    switch (quality) {
      case 0: return 0xcccccc; // Common (white/silver)
      case 1: return 0x5eb2f2; // Uncommon (blue)
      case 2: return 0xf2a93b; // Rare (gold/orange)
      default: return 0xffffff;
    }
  }
  
  /**
   * Update the visibility state of a tile
   * @param hexTile - The hex tile to update
   * @param worldTile - The world tile data
   */
  private static _updateVisibilityState(hexTile: HexTile, worldTile: WorldTile): void {
    let visibilityState: VisibilityState;
    
    if (!worldTile.discovered) {
      visibilityState = VisibilityState.HIDDEN;
    } else if (worldTile.explored) {
      if (worldTile.visibility > 0.7) {
        visibilityState = VisibilityState.VISIBLE;
      } else {
        visibilityState = VisibilityState.EXPLORED;
      }
    } else {
      if (worldTile.visibility > 0.5) {
        visibilityState = VisibilityState.DISCOVERED;
      } else {
        visibilityState = VisibilityState.FOGGY;
      }
    }
    
    hexTile.setVisibility(visibilityState);
  }
}
