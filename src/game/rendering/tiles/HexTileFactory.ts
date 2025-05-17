/**
 * TerraFlux - Hex Tile Factory
 * 
 * Factory class for generating hex tile assets, including various biome types, 
 * decorative elements, and special features.
 */

import * as PIXI from 'pixi.js';
import { HexTile } from './HexTile';
import { BiomeType, FeatureType, BIOME_VISUALS } from './types';
import { TextureManager } from '../TextureManager';

/**
 * Factory class for creating and managing hex tiles
 */
export class HexTileFactory {
  // Managers for textures and other resources
  private _textureManager: TextureManager;
  
  // Cache to store generated textures for performance
  private _textureCache: Map<string, PIXI.Texture>;
  
  // Filter prototypes
  private _shaderPresets: Map<string, PIXI.Filter>;
  
  /**
   * Constructor
   * @param textureManager - Texture manager for loading tile textures
   */
  constructor(textureManager: TextureManager) {
    this._textureManager = textureManager;
    this._textureCache = new Map<string, PIXI.Texture>();
    this._shaderPresets = new Map<string, PIXI.Filter>();
    
    this._initializeShaderPresets();
  }
  
  /**
   * Initialize shader presets for different tile effects
   * These are simplified versions that will be replaced with more sophisticated shaders later
   */
  private _initializeShaderPresets(): void {
    // Crystalline shader (currently a basic color filter)
    const crystallineFilter = new PIXI.ColorMatrixFilter();
    crystallineFilter.brightness(1.1, false);
    crystallineFilter.contrast(1.2, false);
    this._shaderPresets.set('crystalline', crystallineFilter);
    
    // Energy flow shader (currently a basic displacement filter)
    const displacementSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    const energyFlowFilter = new PIXI.DisplacementFilter(displacementSprite);
    energyFlowFilter.scale.set(5, 5);
    this._shaderPresets.set('energyFlow', energyFlowFilter);
    
    // Fog of war shader (currently a basic color adjustment)
    const fogFilter = new PIXI.ColorMatrixFilter();
    fogFilter.brightness(0.7, false);
    fogFilter.saturate(-0.7, true);
    this._shaderPresets.set('fogOfWar', fogFilter);
  }
  
  /**
   * Creates a hex tile with the specified biome type
   * 
   * @param q - Q coordinate (axial)
   * @param r - R coordinate (axial)
   * @param biomeType - Type of biome for this tile
   * @returns A new HexTile instance
   */
  public createTile(q: number, r: number, biomeType: BiomeType): HexTile {
    // Create the base hex tile
    const tile = new HexTile(q, r, biomeType);
    
    // Get a procedural texture for this tile based on biome type
    const baseTexture = this._generateBaseTileTexture(biomeType);
    tile.setBaseTexture(baseTexture);
    
    // Add biome-specific decorative elements
    this._addBiomeDecorations(tile, biomeType);
    
    // Add hovering fragments appropriate for this biome
    this._addHoveringElements(tile, biomeType);
    
    // Ensure tile is visible (for testing)
    tile.setVisibility('visible' as any);
    
    return tile;
  }
  
  /**
   * Generate a procedural texture for the base tile
   * This is a placeholder implementation until we have actual texture assets
   * 
   * @param biomeType - Type of biome to generate texture for
   * @returns A texture for the base tile
   */
  private _generateBaseTileTexture(biomeType: BiomeType): PIXI.Texture {
    // Check if we already have this texture cached
    const cacheKey = `base_${biomeType}`;
    if (this._textureCache.has(cacheKey)) {
      return this._textureCache.get(cacheKey)!;
    }
    
    // If not cached, create a procedural texture
    const biomeVisuals = BIOME_VISUALS[biomeType];
    const baseColor = biomeVisuals.baseColor;
    
    // Create a hexagon graphics object
    const radius = 50; // Hex radius in pixels
    const graphics = new PIXI.Graphics();
    
    // Draw hexagon with biome-specific color
    graphics.beginFill(baseColor);
    graphics.lineStyle(2, 0x000000, 0.2);
    
    // Draw hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    
    graphics.closePath();
    graphics.endFill();
    
    // Add some noise/variation to make each tile look slightly different
    this._addProceduralVariation(graphics, biomeType);
    
    // Convert to texture
    const texture = PIXI.RenderTexture.create({
      width: radius * 2 + 4,
      height: radius * 2 + 4
    });
    
    // Center the hexagon in the texture
    graphics.position.set(radius + 2, radius + 2);
    
    // Render graphics to texture
    const renderer = PIXI.autoDetectRenderer() as PIXI.Renderer;
    renderer.render(graphics, { renderTexture: texture });
    
    // Cache the texture for reuse
    this._textureCache.set(cacheKey, texture);
    
    return texture;
  }
  
  /**
   * Add procedural variation to a tile to make each one look unique
   * This is a placeholder until we have actual texture assets
   * 
   * @param graphics - The graphics object to add variation to
   * @param biomeType - The biome type for biome-specific variations
   */
  private _addProceduralVariation(graphics: PIXI.Graphics, biomeType: BiomeType): void {
    const biomeVisuals = BIOME_VISUALS[biomeType];
    const highlightColor = biomeVisuals.highlightColor;
    const radius = 50;
    
    // Draw internal details based on biome type
    switch (biomeType) {
      case BiomeType.FOREST:
        // Forest has irregular patterns like growth rings
        for (let i = 0; i < 3; i++) {
          const innerRadius = radius * (0.4 + Math.random() * 0.3);
          graphics.beginFill(highlightColor, 0.1);
          graphics.drawCircle(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            innerRadius
          );
          graphics.endFill();
        }
        break;
        
      case BiomeType.MOUNTAIN:
        // Mountains have angular patterns
        graphics.lineStyle(1, highlightColor, 0.3);
        for (let i = 0; i < 4; i++) {
          const startAngle = Math.random() * Math.PI * 2;
          const endAngle = startAngle + Math.PI * (0.5 + Math.random() * 0.5);
          graphics.moveTo(0, 0);
          graphics.lineTo(
            radius * 0.8 * Math.cos(startAngle),
            radius * 0.8 * Math.sin(startAngle)
          );
          graphics.endFill();
        }
        break;
        
      case BiomeType.DESERT:
        // Desert has swirling patterns
        graphics.lineStyle(1, highlightColor, 0.3);
        let lastX = 0, lastY = 0;
        for (let i = 0; i < 5; i++) {
          const angle = i / 5 * Math.PI * 2;
          const dist = radius * (0.2 + i / 5 * 0.6);
          const x = dist * Math.cos(angle);
          const y = dist * Math.sin(angle);
          
          if (i === 0) {
            graphics.moveTo(x, y);
          } else {
            graphics.quadraticCurveTo(0, 0, x, y);
          }
          
          lastX = x;
          lastY = y;
        }
        graphics.quadraticCurveTo(0, 0, lastX, lastY);
        break;
        
      case BiomeType.TUNDRA:
        // Tundra has crystalline patterns
        graphics.lineStyle(1, highlightColor, 0.5);
        for (let i = 0; i < 6; i++) {
          const angle1 = i / 6 * Math.PI * 2;
          const angle2 = (i + 1) / 6 * Math.PI * 2;
          graphics.moveTo(0, 0);
          graphics.lineTo(
            radius * 0.7 * Math.cos(angle1),
            radius * 0.7 * Math.sin(angle1)
          );
          graphics.lineTo(
            radius * 0.5 * Math.cos((angle1 + angle2) / 2),
            radius * 0.5 * Math.sin((angle1 + angle2) / 2)
          );
          graphics.lineTo(0, 0);
          graphics.endFill();
        }
        break;
        
      case BiomeType.WETLAND:
        // Wetland has ripple patterns
        for (let i = 0; i < 3; i++) {
          const circleRadius = radius * (0.3 + i * 0.2);
          graphics.lineStyle(1, highlightColor, 0.2);
          graphics.drawCircle(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            circleRadius
          );
        }
        break;
        
      case BiomeType.VOLCANIC:
        // Volcanic has crack patterns
        graphics.lineStyle(2, highlightColor, 0.7);
        for (let i = 0; i < 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const length = radius * (0.3 + Math.random() * 0.5);
          const curve = (Math.random() - 0.5) * 20;
          
          graphics.moveTo(0, 0);
          graphics.quadraticCurveTo(
            curve * Math.cos(angle + Math.PI/2),
            curve * Math.sin(angle + Math.PI/2),
            length * Math.cos(angle),
            length * Math.sin(angle)
          );
        }
        break;
        
      case BiomeType.CRYSTAL:
        // Crystal has reflective facet patterns
        graphics.lineStyle(1, highlightColor, 0.7);
        for (let i = 0; i < 3; i++) {
          const angle1 = (i / 3) * Math.PI * 2;
          const angle2 = ((i + 1) / 3) * Math.PI * 2;
          
          graphics.beginFill(highlightColor, 0.2);
          graphics.moveTo(0, 0);
          graphics.lineTo(
            radius * 0.6 * Math.cos(angle1),
            radius * 0.6 * Math.sin(angle1)
          );
          graphics.lineTo(
            radius * 0.6 * Math.cos(angle2),
            radius * 0.6 * Math.sin(angle2)
          );
          graphics.closePath();
          graphics.endFill();
        }
        break;
    }
  }
  
  /**
   * Add biome-specific decorative elements to a tile
   * 
   * @param tile - The tile to add decorations to
   * @param biomeType - The biome type determining decoration style
   */
  private _addBiomeDecorations(tile: HexTile, biomeType: BiomeType): void {
    // This is a placeholder implementation
    // In a full implementation, we would add detailed decorative elements and environment objects
    
    // Add a simple decorative element for demonstration
    const decoration = new PIXI.Graphics();
    const biomeVisuals = BIOME_VISUALS[biomeType];
    
    // Different decoration patterns per biome
    switch(biomeType) {
      case BiomeType.FOREST:
        // Simple tree-like shapes
        decoration.beginFill(0x2d6a33);
        decoration.drawCircle(-15, -5, 8);
        decoration.drawCircle(0, -12, 10);
        decoration.drawCircle(15, -3, 7);
        decoration.endFill();
        break;
        
      case BiomeType.MOUNTAIN:
        // Simple mountain peak
        decoration.beginFill(0x6d7e93);
        decoration.moveTo(-15, 0);
        decoration.lineTo(0, -20);
        decoration.lineTo(15, 0);
        decoration.closePath();
        decoration.endFill();
        break;
        
      case BiomeType.DESERT:
        // Simple cactus-like shape
        decoration.beginFill(0xb39f78);
        decoration.drawRect(-2, -15, 4, 15);
        decoration.drawRect(-8, -10, 16, 4);
        decoration.endFill();
        break;
        
      case BiomeType.TUNDRA:
        // Simple snow mound
        decoration.beginFill(0xd8e7f0);
        decoration.drawEllipse(0, -3, 20, 8);
        decoration.endFill();
        break;
        
      case BiomeType.WETLAND:
        // Simple water lilies
        decoration.beginFill(0x3d7e71);
        decoration.drawCircle(-10, -5, 5);
        decoration.drawCircle(10, -5, 5);
        decoration.drawCircle(0, 5, 5);
        decoration.endFill();
        break;
        
      case BiomeType.VOLCANIC:
        // Simple volcano
        decoration.beginFill(0x8a3324);
        decoration.moveTo(-15, 0);
        decoration.lineTo(0, -15);
        decoration.lineTo(15, 0);
        decoration.closePath();
        decoration.endFill();
        
        decoration.beginFill(0xe25822);
        decoration.moveTo(-5, -5);
        decoration.lineTo(0, -10);
        decoration.lineTo(5, -5);
        decoration.closePath();
        decoration.endFill();
        break;
        
      case BiomeType.CRYSTAL:
        // Simple crystal clusters
        decoration.beginFill(0x9966cc);
        decoration.moveTo(0, -15);
        decoration.lineTo(5, -5);
        decoration.lineTo(-5, -5);
        decoration.closePath();
        decoration.endFill();
        
        decoration.beginFill(0xd0a5ff);
        decoration.moveTo(-10, -10);
        decoration.lineTo(-5, -2);
        decoration.lineTo(-15, -2);
        decoration.closePath();
        decoration.endFill();
        
        decoration.beginFill(0xc08fef);
        decoration.moveTo(10, -10);
        decoration.lineTo(15, -2);
        decoration.lineTo(5, -2);
        decoration.closePath();
        decoration.endFill();
        break;
    }
    
    // Add the decoration to the tile
    tile.addDecoration(decoration);
  }
  
  /**
   * Add hovering elements to a tile appropriate for its biome type
   * 
   * @param tile - The tile to add hovering elements to
   * @param biomeType - The biome type determining element style
   */
  private _addHoveringElements(tile: HexTile, biomeType: BiomeType): void {
    // This is a placeholder implementation
    // In a full implementation, we would use proper sprite sheets and animations
    
    const biomeVisuals = BIOME_VISUALS[biomeType];
    const hoverColor = biomeVisuals.hoverColor;
    
    // Add 2-3 hovering elements per tile
    const count = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < count; i++) {
      // Create a hovering element specific to the biome type
      const element = new PIXI.Graphics();
      
      // Different hovering element shapes per biome
      switch(biomeType) {
        case BiomeType.FOREST:
          // Leaf-like shapes
          element.beginFill(hoverColor);
          element.moveTo(0, -5);
          element.quadraticCurveTo(5, 0, 0, 5);
          element.quadraticCurveTo(-5, 0, 0, -5);
          element.endFill();
          break;
          
        case BiomeType.MOUNTAIN:
          // Stone fragments
          element.beginFill(hoverColor);
          element.drawPolygon([0, -4, 4, 0, 0, 4, -4, 0]);
          element.endFill();
          break;
          
        case BiomeType.DESERT:
          // Sand particles
          element.beginFill(hoverColor);
          element.drawCircle(0, 0, 3);
          element.endFill();
          element.lineStyle(1, 0x000000, 0.2);
          element.drawCircle(0, 0, 3);
          break;
          
        case BiomeType.TUNDRA:
          // Ice crystals - draw a simple snowflake using lines and circles
          element.beginFill(hoverColor);
          element.drawCircle(0, 0, 2);
          element.endFill();
          
          // Draw 6 lines radiating out for the snowflake arms
          element.lineStyle(1, hoverColor);
          for (let j = 0; j < 6; j++) {
            const angle = (Math.PI / 3) * j;
            element.moveTo(0, 0);
            element.lineTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
          }
          break;
          
        case BiomeType.WETLAND:
          // Water droplets
          element.beginFill(hoverColor);
          element.moveTo(0, -4);
          element.quadraticCurveTo(4, 0, 0, 4);
          element.quadraticCurveTo(-4, 0, 0, -4);
          element.endFill();
          break;
          
        case BiomeType.VOLCANIC:
          // Ember particles
          element.beginFill(hoverColor);
          element.drawCircle(0, 0, 2 + Math.random() * 2);
          element.endFill();
          break;
          
        case BiomeType.CRYSTAL:
          // Crystal shards
          element.beginFill(hoverColor);
          element.drawPolygon([0, -5, 3, 0, 0, 5, -3, 0]);
          element.endFill();
          break;
      }
      
      // Position the element randomly within the tile bounds
      element.position.set(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );
      
      // Scale the element randomly
      const scale = 0.8 + Math.random() * 0.4;
      element.scale.set(scale, scale);
      
      // Add the element to the tile
      tile.addHoveringElement(element);
    }
  }
  
  /**
   * Create a hex tile with a transition between two biome types
   * 
   * @param q - Q coordinate (axial)
   * @param r - R coordinate (axial)
   * @param primaryBiome - Primary biome type for this tile
   * @param secondaryBiome - Secondary biome to transition to
   * @param direction - Direction of the transition edge
   * @returns A new HexTile instance with transition effects
   */
  public createTransitionTile(
    q: number, 
    r: number, 
    primaryBiome: BiomeType, 
    secondaryBiome: BiomeType,
    direction: number
  ): HexTile {
    // Create a base tile of the primary biome
    const tile = this.createTile(q, r, primaryBiome);
    
    // Add transition effect
    // For now we just register the transition; visual implementation will come later
    tile.setTransitionEdge(direction, secondaryBiome);
    
    return tile;
  }
  
  /**
   * Create a special feature tile (resource node, landmark, etc.)
   * 
   * @param q - Q coordinate (axial)
   * @param r - R coordinate (axial)
   * @param biomeType - Base biome type for this tile
   * @param featureType - Type of special feature to add
   * @returns A new HexTile instance with the special feature
   */
  public createFeatureTile(
    q: number, 
    r: number, 
    biomeType: BiomeType, 
    featureType: FeatureType
  ): HexTile {
    // Create a base tile
    const tile = this.createTile(q, r, biomeType);
    
    // Add the special feature
    this._addSpecialFeature(tile, featureType);
    
    return tile;
  }
  
  /**
   * Add a special feature to a tile
   * 
   * @param tile - The tile to add the feature to
   * @param featureType - Type of feature to add
   */
  private _addSpecialFeature(tile: HexTile, featureType: FeatureType): void {
    // This is a placeholder implementation
    
    const feature = new PIXI.Container();
    const baseGraphic = new PIXI.Graphics();
    
    // Different feature types
    switch(featureType) {
      case FeatureType.RESOURCE_NODE:
        // Draw a simple resource node
        baseGraphic.beginFill(0xf7cf52);
        baseGraphic.drawCircle(0, 0, 10);
        baseGraphic.endFill();
        
        baseGraphic.lineStyle(2, 0x000000, 0.3);
        baseGraphic.drawCircle(0, 0, 10);
        
        // Add a resource to the tile data
        tile.addResource({
          type: 'generic',
          quality: 1,
          amount: 100,
          harvestable: true
        });
        break;
        
      case FeatureType.LANDMARK:
        // Draw a simple landmark
        baseGraphic.beginFill(0x6a7d99);
        baseGraphic.drawRect(-10, -20, 20, 20);
        baseGraphic.endFill();
        
        baseGraphic.beginFill(0x8394b1);
        baseGraphic.moveTo(-15, 0);
        baseGraphic.lineTo(15, 0);
        baseGraphic.lineTo(0, -15);
        baseGraphic.closePath();
        baseGraphic.endFill();
        break;
        
      case FeatureType.STRUCTURE:
        // Draw a simple building
        baseGraphic.beginFill(0xa67c5b);
        baseGraphic.drawRect(-15, -10, 30, 20);
        baseGraphic.endFill();
        
        baseGraphic.beginFill(0x8a6b52);
        baseGraphic.moveTo(-15, -10);
        baseGraphic.lineTo(15, -10);
        baseGraphic.lineTo(0, -25);
        baseGraphic.closePath();
        baseGraphic.endFill();
        break;
        
      case FeatureType.ENERGY_SOURCE:
        // Draw a simple energy source
        baseGraphic.beginFill(0x66ccff);
        baseGraphic.drawCircle(0, 0, 10);
        baseGraphic.endFill();
        
        // Add pulsing inner circle
        const pulseGraphic = new PIXI.Graphics();
        pulseGraphic.beginFill(0xaae6ff);
        pulseGraphic.drawCircle(0, 0, 5);
        pulseGraphic.endFill();
        
        feature.addChild(pulseGraphic);
        
        // Create a simple pulse animation
        const startTime = Date.now();
        feature.on('added', function() {
          const animate = function() {
            const elapsed = Date.now() - startTime;
            const scale = 0.8 + Math.sin(elapsed / 300) * 0.4;
            pulseGraphic.scale.set(scale);
            requestAnimationFrame(animate);
          };
          animate();
        });
        break;
        
      case FeatureType.ANCIENT_RUIN:
        // Draw a simple ruin
        baseGraphic.beginFill(0xcaad9a);
        
        // Broken columns
        baseGraphic.drawRect(-15, -5, 5, 15);
        baseGraphic.drawRect(-5, -15, 5, 25);
        baseGraphic.drawRect(5, -10, 5, 20);
        baseGraphic.drawRect(15, -3, 5, 13);
        
        // Base platform
        baseGraphic.drawRect(-20, 10, 40, 5);
        baseGraphic.endFill();
        break;
    }
    
    feature.addChild(baseGraphic);
    tile.addDecoration(feature);
  }
  
  /**
   * Get a shader filter from the presets
   * 
   * @param type - Type of shader to get
   * @returns A PIXI filter instance
   */
  public getShader(type: string): PIXI.Filter {
    if (!this._shaderPresets.has(type)) {
      throw new Error(`Shader preset '${type}' not found`);
    }
    
    return this._shaderPresets.get(type)!;
  }
  
  /**
   * Clear the texture cache to free memory
   */
  public clearCache(): void {
    this._textureCache.clear();
  }
}
