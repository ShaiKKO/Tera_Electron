/**
 * MinimapRenderer handles rendering the minimap display
 * 
 * Creates and updates a PIXI.Texture based on the world map and fog of war,
 * supporting multiple display modes and zoom levels.
 */

import * as PIXI from 'pixi.js';
import { BoundingBox, MinimapMode, Vector2, VisibilityState } from './types';
import { WorldMap } from '../WorldMap';
import { FogOfWarManager } from './FogOfWarManager';
import { BiomeType } from '../../rendering/tiles/types';

/**
 * Class responsible for rendering the minimap visualization
 */
export class MinimapRenderer {
    /**
     * Texture to render the minimap to
     * This can then be used by a sprite in the UI
     */
    private texture: PIXI.RenderTexture;
    
    /**
     * Graphics object for drawing the minimap
     */
    private graphics: PIXI.Graphics;
    
    /**
     * Renderer for creating the texture
     */
    private renderer: PIXI.Renderer;
    
    /**
     * Reference to the world map
     */
    private worldMap: WorldMap;
    
    /**
     * Reference to the fog of war manager
     */
    private fogOfWar: FogOfWarManager;
    
    /**
     * Current display mode
     */
    private mode: MinimapMode;
    
    /**
     * Current zoom level
     * Lower is more zoomed out (shows more of the map)
     * Higher is more zoomed in (shows less of the map but with more detail)
     */
    private zoomLevel: number;
    
    /**
     * Width of the minimap texture in pixels
     */
    private width: number;
    
    /**
     * Height of the minimap texture in pixels
     */
    private height: number;
    
    /**
     * Color mappings for different biome types
     */
    private biomeColors: Record<BiomeType, number>;
    
    /**
     * Creates a new MinimapRenderer
     * 
     * @param worldMap Reference to the world map
     * @param fogOfWar Reference to the fog of war manager
     * @param width Width of the minimap texture in pixels
     * @param height Height of the minimap texture in pixels
     */
    constructor(worldMap: WorldMap, fogOfWar: FogOfWarManager, width: number = 256, height: number = 256) {
        this.worldMap = worldMap;
        this.fogOfWar = fogOfWar;
        this.width = width;
        this.height = height;
        this.mode = MinimapMode.TERRAIN;
        this.zoomLevel = 1.0;
        
        // Create renderer and graphics objects
        this.renderer = new PIXI.Renderer({
            width: this.width,
            height: this.height,
            backgroundColor: 0x000000
        });
        
        this.graphics = new PIXI.Graphics();
        
        // Create a render texture
        this.texture = PIXI.RenderTexture.create({
            width: this.width,
            height: this.height
        });
        
        // Initialize biome colors
        this.biomeColors = {
            [BiomeType.PLAINS]: 0x91B336,
            [BiomeType.FOREST]: 0x228B22,
            [BiomeType.MOUNTAIN]: 0x808080,
            [BiomeType.DESERT]: 0xF4D03F,
            [BiomeType.WETLAND]: 0x6A5ACD,
            [BiomeType.SNOW]: 0xF0F0F0,
            [BiomeType.VOLCANIC]: 0xA52A2A,
            [BiomeType.CRYSTAL]: 0x48D1CC,
            [BiomeType.TUNDRA]: 0xE0E0E0,
            [BiomeType.RUINS]: 0x8B4513
        };
    }
    
    /**
     * Updates the minimap texture
     * 
     * @param focusOnArea Optional area to focus on in world coordinates
     * @returns The updated texture
     */
    public updateTexture(focusOnArea?: BoundingBox): PIXI.Texture {
        // Clear the graphics object
        this.graphics.clear();
        
        // Get world bounds (either the focus area or the full world)
        const worldBounds = focusOnArea || this.calculateWorldBounds();
        
        // Adjust for zoom level
        const zoomedWidth = worldBounds.width / this.zoomLevel;
        const zoomedHeight = worldBounds.height / this.zoomLevel;
        
        // Calculate center
        const centerX = worldBounds.x + worldBounds.width / 2;
        const centerY = worldBounds.y + worldBounds.height / 2;
        
        // Calculate adjusted bounds
        const adjustedBounds = {
            x: centerX - zoomedWidth / 2,
            y: centerY - zoomedHeight / 2,
            width: zoomedWidth,
            height: zoomedHeight
        };
        
        // Draw the minimap based on the current mode
        switch (this.mode) {
            case MinimapMode.TERRAIN:
                this.renderTerrainMode(adjustedBounds);
                break;
            case MinimapMode.RESOURCES:
                this.renderResourcesMode(adjustedBounds);
                break;
            case MinimapMode.ELEVATION:
                this.renderElevationMode(adjustedBounds);
                break;
            case MinimapMode.OWNERSHIP:
                this.renderOwnershipMode(adjustedBounds);
                break;
        }
        
        // Render the graphics to the texture
        this.renderer.render(this.graphics, { renderTexture: this.texture });
        
        return this.texture;
    }
    
    /**
     * Sets the display mode for the minimap
     * 
     * @param mode The new display mode
     */
    public setMode(mode: MinimapMode): void {
        this.mode = mode;
    }
    
    /**
     * Gets the current display mode
     * 
     * @returns The current display mode
     */
    public getMode(): MinimapMode {
        return this.mode;
    }
    
    /**
     * Sets the zoom level for the minimap
     * 
     * @param level The new zoom level (typically between 0.5 and 2.0)
     */
    public setZoomLevel(level: number): void {
        // Ensure zoom level is within reasonable bounds
        this.zoomLevel = Math.max(0.25, Math.min(4.0, level));
    }
    
    /**
     * Gets the current zoom level
     * 
     * @returns The current zoom level
     */
    public getZoomLevel(): number {
        return this.zoomLevel;
    }
    
    /**
     * Renders the minimap in terrain mode
     * Shows different colors for different biome types
     * 
     * @param bounds The world bounds to render
     */
    private renderTerrainMode(bounds: BoundingBox): void {
        this.renderTiles(bounds, (tile, alpha) => {
            // Get color based on biome type
            const color = this.biomeColors[tile.biomeType] || 0x888888;
            
            // Apply elevation shading (darker at lower elevations, lighter at higher)
            const elevationFactor = (tile.elevation || 0) * 0.05; // Subtle effect
            
            // Adjust color based on elevation
            const adjustedColor = this.adjustColorBrightness(color, elevationFactor);
            
            return adjustedColor;
        });
    }
    
    /**
     * Renders the minimap in resources mode
     * Highlights areas with resources
     * 
     * @param bounds The world bounds to render
     */
    private renderResourcesMode(bounds: BoundingBox): void {
        // First render terrain as background
        this.renderTiles(bounds, (tile, alpha) => {
            // Use a desaturated version of the terrain color
            const color = this.biomeColors[tile.biomeType] || 0x888888;
            return this.desaturateColor(color, 0.7); // 70% desaturated
        }, 0.7); // Slightly transparent
        
        // Then highlight resources
        const resourceColors = {
            wood: 0x8B4513,     // Brown
            stone: 0x808080,    // Gray
            metal: 0xB87333,    // Copper
            crystal: 0x48D1CC,  // Turquoise
            water: 0x1E90FF,    // Blue
            food: 0xFFFF00      // Yellow
        };
        
        // Draw resource indicators
        for (const tile of this.worldMap.tiles) {
            // Skip tiles outside the bounds or not visible
            const worldPos = { x: tile.worldX, y: tile.worldY };
            if (!this.isInBounds(worldPos, bounds)) continue;
            
            const visibility = this.fogOfWar.getTileVisibility(tile.q, tile.r);
            if (visibility === VisibilityState.UNEXPLORED) continue;
            
            // If the tile has resources, draw an indicator
            if (tile.resources && Object.keys(tile.resources).length > 0) {
                // Determine the most abundant resource
                let maxResource: string | null = null;
                let maxAmount = 0;
                
                for (const [resource, amount] of Object.entries(tile.resources)) {
                    if (amount > maxAmount) {
                        maxResource = resource;
                        maxAmount = amount;
                    }
                }
                
                if (maxResource && maxAmount > 0) {
                    // Get the screen position
                    const screenPos = this.worldToScreen(worldPos, bounds);
                    
                    // Draw a small circle for the resource
                    const color = resourceColors[maxResource as keyof typeof resourceColors] || 0xFFFFFF;
                    const size = Math.min(5, Math.max(2, Math.log2(maxAmount)));
                    
                    this.graphics.beginFill(color, visibility === VisibilityState.FULLY_EXPLORED ? 1.0 : 0.5);
                    this.graphics.drawCircle(screenPos.x, screenPos.y, size);
                    this.graphics.endFill();
                }
            }
        }
    }
    
    /**
     * Renders the minimap in elevation mode
     * Shows different colors based on elevation
     * 
     * @param bounds The world bounds to render
     */
    private renderElevationMode(bounds: BoundingBox): void {
        // Find min/max elevation for normalization
        let minElevation = Number.MAX_VALUE;
        let maxElevation = Number.MIN_VALUE;
        
        for (const tile of this.worldMap.tiles) {
            const elevation = tile.elevation || 0;
            minElevation = Math.min(minElevation, elevation);
            maxElevation = Math.max(maxElevation, elevation);
        }
        
        // Ensure we don't divide by zero
        const elevationRange = Math.max(0.01, maxElevation - minElevation);
        
        this.renderTiles(bounds, (tile, alpha) => {
            // Normalize elevation to 0-1 range
            const normalizedElevation = (tile.elevation || 0 - minElevation) / elevationRange;
            
            // Create a color gradient from deep blue (low) to white (high)
            const r = Math.floor(normalizedElevation * 255);
            const g = Math.floor(normalizedElevation * 255);
            const b = Math.floor(128 + normalizedElevation * 127);
            
            return (r << 16) + (g << 8) + b;
        });
    }
    
    /**
     * Renders the minimap in ownership mode
     * Shows different colors based on territory control
     * 
     * @param bounds The world bounds to render
     */
    private renderOwnershipMode(bounds: BoundingBox): void {
        // For now, this is a placeholder as we don't have ownership data yet
        // We'll show a subtle terrain map with no ownership indicators
        this.renderTiles(bounds, (tile, alpha) => {
            const color = this.biomeColors[tile.biomeType] || 0x888888;
            return this.desaturateColor(color, 0.9); // 90% desaturated
        });
    }
    
    /**
     * Common tile rendering function used by all modes
     * 
     * @param bounds World bounds to render
     * @param colorFn Function that returns a color for each tile
     * @param baseAlpha Base alpha value for all tiles
     */
    private renderTiles(
        bounds: BoundingBox, 
        colorFn: (tile: any, alpha: number) => number,
        baseAlpha: number = 1.0
    ): void {
        // Calculate the size of each tile on the minimap
        const tileWidth = this.width / (bounds.width || 1);
        const tileHeight = this.height / (bounds.height || 1);
        const tileSize = Math.max(1, Math.min(tileWidth, tileHeight));
        
        // Draw fog of war background
        this.graphics.beginFill(0x000000, 1.0);
        this.graphics.drawRect(0, 0, this.width, this.height);
        this.graphics.endFill();
        
        // Draw each tile
        for (const tile of this.worldMap.tiles) {
            const worldPos = { x: tile.worldX, y: tile.worldY };
            
            // Skip tiles outside the bounds
            if (!this.isInBounds(worldPos, bounds)) continue;
            
            // Get the tile's fog of war state
            const visibility = this.fogOfWar.getTileVisibility(tile.q, tile.r);
            
            // Skip completely unexplored tiles
            if (visibility === VisibilityState.UNEXPLORED) continue;
            
            // Determine alpha based on visibility
            let alpha = baseAlpha;
            if (visibility === VisibilityState.PARTIALLY_EXPLORED) {
                alpha *= 0.5; // 50% opacity for partially explored
            }
            
            // Get the color for this tile based on the provided function
            const color = colorFn(tile, alpha);
            
            // Calculate screen position
            const screenPos = this.worldToScreen(worldPos, bounds);
            
            // Draw the tile
            this.graphics.beginFill(color, alpha);
            this.graphics.drawRect(
                screenPos.x - tileSize / 2, 
                screenPos.y - tileSize / 2, 
                tileSize, 
                tileSize
            );
            this.graphics.endFill();
        }
    }
    
    /**
     * Converts a world position to screen coordinates
     * 
     * @param worldPos World position to convert
     * @param bounds World bounds being rendered
     * @returns Screen position in pixels
     */
    private worldToScreen(worldPos: Vector2, bounds: BoundingBox): Vector2 {
        // Calculate normalized position within bounds (0 to 1)
        const normalizedX = (worldPos.x - bounds.x) / bounds.width;
        const normalizedY = (worldPos.y - bounds.y) / bounds.height;
        
        // Convert to screen coordinates
        return {
            x: normalizedX * this.width,
            y: normalizedY * this.height
        };
    }
    
    /**
     * Converts a screen position to world coordinates
     * 
     * @param screenPos Screen position in pixels
     * @param bounds World bounds being rendered
     * @returns World position
     */
    public screenToWorld(screenPos: Vector2, bounds: BoundingBox): Vector2 {
        // Calculate normalized position (0 to 1)
        const normalizedX = screenPos.x / this.width;
        const normalizedY = screenPos.y / this.height;
        
        // Convert to world coordinates
        return {
            x: bounds.x + normalizedX * bounds.width,
            y: bounds.y + normalizedY * bounds.height
        };
    }
    
    /**
     * Checks if a position is within the specified bounds
     * 
     * @param pos Position to check
     * @param bounds Bounds to check against
     * @returns True if the position is within bounds
     */
    private isInBounds(pos: Vector2, bounds: BoundingBox): boolean {
        return pos.x >= bounds.x && 
               pos.x <= bounds.x + bounds.width &&
               pos.y >= bounds.y &&
               pos.y <= bounds.y + bounds.height;
    }
    
    /**
     * Calculates the bounding box for the entire world
     * 
     * @returns Bounding box containing all tiles
     */
    private calculateWorldBounds(): BoundingBox {
        const tiles = this.worldMap.tiles;
        if (tiles.length === 0) {
            return { x: 0, y: 0, width: 1, height: 1 };
        }
        
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        
        for (const tile of tiles) {
            minX = Math.min(minX, tile.worldX);
            minY = Math.min(minY, tile.worldY);
            maxX = Math.max(maxX, tile.worldX);
            maxY = Math.max(maxY, tile.worldY);
        }
        
        // Add some padding
        const paddingX = (maxX - minX) * 0.05;
        const paddingY = (maxY - minY) * 0.05;
        
        return {
            x: minX - paddingX,
            y: minY - paddingY,
            width: (maxX - minX) + paddingX * 2,
            height: (maxY - minY) + paddingY * 2
        };
    }
    
    /**
     * Adjusts the brightness of a color
     * 
     * @param color Color in hex format (0xRRGGBB)
     * @param factor Brightness adjustment (-1 to 1, negative darkens, positive brightens)
     * @returns Adjusted color
     */
    private adjustColorBrightness(color: number, factor: number): number {
        // Extract RGB components
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        // Adjust brightness
        const adjustR = Math.max(0, Math.min(255, r + factor * 255));
        const adjustG = Math.max(0, Math.min(255, g + factor * 255));
        const adjustB = Math.max(0, Math.min(255, b + factor * 255));
        
        // Recombine into color
        return (Math.floor(adjustR) << 16) + (Math.floor(adjustG) << 8) + Math.floor(adjustB);
    }
    
    /**
     * Desaturates a color
     * 
     * @param color Color in hex format (0xRRGGBB)
     * @param amount Amount to desaturate (0 to 1, where 1 is fully desaturated/grayscale)
     * @returns Desaturated color
     */
    private desaturateColor(color: number, amount: number): number {
        // Extract RGB components
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        // Calculate luminance (perceived brightness)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Interpolate between original color and grayscale
        const newR = r * (1 - amount) + luminance * amount;
        const newG = g * (1 - amount) + luminance * amount;
        const newB = b * (1 - amount) + luminance * amount;
        
        // Recombine into color
        return (Math.floor(newR) << 16) + (Math.floor(newG) << 8) + Math.floor(newB);
    }
    
    /**
     * Disposes of resources used by the minimap renderer
     */
    public dispose(): void {
        this.texture.destroy(true);
        this.graphics.destroy();
        this.renderer.destroy();
    }
    
    /**
     * Gets the width of the minimap texture
     * 
     * @returns Width in pixels
     */
    public getWidth(): number {
        return this.width;
    }
    
    /**
     * Gets the height of the minimap texture
     * 
     * @returns Height in pixels
     */
    public getHeight(): number {
        return this.height;
    }
    
    /**
     * Gets the minimap texture
     * 
     * @returns The texture containing the rendered minimap
     */
    public getTexture(): PIXI.Texture {
        return this.texture;
    }
}
