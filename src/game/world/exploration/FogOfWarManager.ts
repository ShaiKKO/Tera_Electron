/**
 * FogOfWarManager manages the visibility state of the world map
 * 
 * Handles the storage, calculation, and updating of fog of war,
 * using a chunked storage system for efficient memory usage and updates.
 */

import { CoordinateSystem } from '../../core/utils/CoordinateSystem';
import { BoundingBox, FogOfWarChunk, Vector2, VisibilityConfig, VisibilityState } from './types';
import { WorldMap } from '../WorldMap';

/**
 * Manager class for the fog of war system
 */
export class FogOfWarManager {
    /**
     * Size of each fog of war chunk in tile units
     * This affects memory usage and performance
     */
    private static readonly CHUNK_SIZE: number = 16;
    
    /**
     * Stores all fog of war chunks
     * Key is in the format "chunkX,chunkY"
     */
    private chunks: Map<string, FogOfWarChunk>;
    
    /**
     * Reference to the world map for accessing terrain information
     */
    private worldMap: WorldMap;
    
    /**
     * Configuration for visibility calculations
     */
    private visibilityConfig: VisibilityConfig;
    
    /**
     * Creates a new FogOfWarManager
     * 
     * @param worldMap Reference to the world map
     * @param config Optional configuration parameters
     */
    constructor(worldMap: WorldMap, config?: Partial<VisibilityConfig>) {
        this.worldMap = worldMap;
        this.chunks = new Map<string, FogOfWarChunk>();
        
        // Default configuration values
        this.visibilityConfig = {
            baseViewRange: 6,
            maxViewRange: 12,
            elevationViewBonus: 0.5,
            weatherFactor: 1.0,
            enablePartialVisibility: true,
            ...config
        };
    }
    
    /**
     * Gets the key for a chunk based on hex coordinates
     * 
     * @param q Hex q coordinate
     * @param r Hex r coordinate
     * @returns Chunk key string
     */
    private getChunkKey(q: number, r: number): string {
        const chunkX = Math.floor(q / FogOfWarManager.CHUNK_SIZE);
        const chunkY = Math.floor(r / FogOfWarManager.CHUNK_SIZE);
        return `${chunkX},${chunkY}`;
    }
    
    /**
     * Gets a visibility chunk, creating it if it doesn't exist
     * 
     * @param q Hex q coordinate
     * @param r Hex r coordinate
     * @returns FogOfWarChunk for the specified coordinates
     */
    private getChunk(q: number, r: number): FogOfWarChunk {
        const chunkX = Math.floor(q / FogOfWarManager.CHUNK_SIZE);
        const chunkY = Math.floor(r / FogOfWarManager.CHUNK_SIZE);
        const key = `${chunkX},${chunkY}`;
        
        if (!this.chunks.has(key)) {
            this.chunks.set(key, {
                tileStates: new Map<string, VisibilityState>(),
                lastUpdated: Date.now(),
                chunkX,
                chunkY
            });
        }
        
        return this.chunks.get(key)!;
    }
    
    /**
     * Gets the tile key within a chunk
     * 
     * @param q Hex q coordinate
     * @param r Hex r coordinate
     * @returns Tile key string
     */
    private getTileKey(q: number, r: number): string {
        return `${q},${r}`;
    }
    
    /**
     * Gets the visibility state of a tile
     * 
     * @param q Hex q coordinate
     * @param r Hex r coordinate
     * @returns Visibility state of the tile
     */
    public getTileVisibility(q: number, r: number): VisibilityState {
        const chunk = this.getChunk(q, r);
        const tileKey = this.getTileKey(q, r);
        
        if (chunk.tileStates.has(tileKey)) {
            return chunk.tileStates.get(tileKey)!;
        }
        
        return VisibilityState.UNEXPLORED;
    }
    
    /**
     * Sets the visibility state of a tile
     * 
     * @param q Hex q coordinate
     * @param r Hex r coordinate
     * @param state New visibility state
     */
    public setTileVisibility(q: number, r: number, state: VisibilityState): void {
        const chunk = this.getChunk(q, r);
        const tileKey = this.getTileKey(q, r);
        
        // Don't downgrade visibility
        if (state === VisibilityState.UNEXPLORED) {
            return;
        }
        
        const currentState = chunk.tileStates.get(tileKey);
        
        // Only update if new state is better than current
        if (currentState === VisibilityState.FULLY_EXPLORED && state !== VisibilityState.FULLY_EXPLORED) {
            return;
        }
        
        chunk.tileStates.set(tileKey, state);
        chunk.lastUpdated = Date.now();
    }
    
    /**
     * Updates visibility based on a viewer's position and range
     * 
     * @param viewerPosition Position of the visibility source
     * @param viewRange Optional custom view range
     */
    public updateVisibility(viewerPosition: Vector2, viewRange?: number): void {
        // Convert world position to hex coordinates
        const hexCoords = CoordinateSystem.worldToHex(viewerPosition.x, viewerPosition.y);
        
        // Get the actual view range, considering elevation bonuses
        const finalViewRange = this.calculateEffectiveViewRange(hexCoords.q, hexCoords.r, viewRange);
        
        // Get all hexes within the view range
        const visibleHexes = CoordinateSystem.getHexesInRadius(hexCoords.q, hexCoords.r, finalViewRange);
        
        // First pass: detect fully visible tiles
        for (const hex of visibleHexes) {
            // Check if the tile is in direct line of sight
            if (this.hasLineOfSight(hexCoords.q, hexCoords.r, hex.q, hex.r)) {
                this.setTileVisibility(hex.q, hex.r, VisibilityState.FULLY_EXPLORED);
            } else if (this.visibilityConfig.enablePartialVisibility) {
                // Second pass: for tiles that aren't in direct line of sight,
                // possibly mark them as partially visible if they were seen before
                const currentVisibility = this.getTileVisibility(hex.q, hex.r);
                if (currentVisibility === VisibilityState.FULLY_EXPLORED) {
                    this.setTileVisibility(hex.q, hex.r, VisibilityState.PARTIALLY_EXPLORED);
                }
            }
        }
    }
    
    /**
     * Calculates the effective view range based on elevation and other factors
     * 
     * @param q Source hex q coordinate
     * @param r Source hex r coordinate
     * @param baseRange Optional base view range override
     * @returns Final calculated view range
     */
    private calculateEffectiveViewRange(q: number, r: number, baseRange?: number): number {
        let range = baseRange || this.visibilityConfig.baseViewRange;
        
        // Apply elevation bonus if available
        const tile = this.worldMap.getTile(q, r);
        if (tile) {
            const elevation = tile.elevation || 0;
            range += elevation * this.visibilityConfig.elevationViewBonus;
        }
        
        // Apply weather factor
        range *= this.visibilityConfig.weatherFactor;
        
        // Ensure we don't exceed maximum range
        return Math.min(range, this.visibilityConfig.maxViewRange);
    }
    
    /**
     * Checks if there's a clear line of sight between two hex tiles
     * 
     * @param fromQ Source hex q coordinate
     * @param fromR Source hex r coordinate
     * @param toQ Target hex q coordinate
     * @param toR Target hex r coordinate
     * @returns True if there's a clear line of sight
     */
    public hasLineOfSight(fromQ: number, fromR: number, toQ: number, toR: number): boolean {
        // If it's the same tile, always visible
        if (fromQ === toQ && fromR === toR) {
            return true;
        }
        
        const distance = CoordinateSystem.hexDistance(fromQ, fromR, toQ, toR);
        
        // Skip LOS check for adjacent tiles (always visible)
        if (distance <= 1) {
            return true;
        }
        
        // Get source elevation
        const sourceTile = this.worldMap.getTile(fromQ, fromR);
        const sourceElevation = sourceTile ? sourceTile.elevation || 0 : 0;
        
        // Get destination elevation
        const destTile = this.worldMap.getTile(toQ, toR);
        const destElevation = destTile ? destTile.elevation || 0 : 0;
        
        // Use Bresenham's line algorithm adapted for hex grid to check line of sight
        const line = this.getHexLine(fromQ, fromR, toQ, toR);
        
        // Skip first and last points (they are the source and destination)
        for (let i = 1; i < line.length - 1; i++) {
            const point = line[i];
            const tile = this.worldMap.getTile(point.q, point.r);
            
            // If no tile data, assume blocking
            if (!tile) {
                return false;
            }
            
            // Check if this tile blocks line of sight
            const pointElevation = tile.elevation || 0;
            
            // How far along the line are we?
            const ratio = i / (line.length - 1);
            
            // Expected elevation at this point if there was a clear line of sight
            const expectedElevation = sourceElevation + (destElevation - sourceElevation) * ratio;
            
            // If the point's elevation is significantly higher than the expected elevation,
            // it blocks the line of sight
            if (pointElevation > expectedElevation + 1) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Gets a line of hex coordinates between two points
     * 
     * @param fromQ Source hex q coordinate
     * @param fromR Source hex r coordinate
     * @param toQ Target hex q coordinate
     * @param toR Target hex r coordinate
     * @returns Array of hex coordinates forming a line
     */
    private getHexLine(fromQ: number, fromR: number, toQ: number, toR: number): { q: number, r: number }[] {
        const results: { q: number, r: number }[] = [];
        
        // Convert to cube coordinates
        const fromS = -fromQ - fromR;
        const toS = -toQ - toR;
        
        // Calculate the number of steps
        const distance = CoordinateSystem.hexDistance(fromQ, fromR, toQ, toR);
        const steps = Math.max(distance, 1);
        
        // Interpolate points along the line
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            
            // Linear interpolation in cube coordinates
            let q = fromQ + (toQ - fromQ) * ratio;
            let r = fromR + (toR - fromR) * ratio;
            let s = fromS + (toS - fromS) * ratio;
            
            // Round to nearest hex
            const [roundedQ, roundedR] = CoordinateSystem.cubeRound(q, r, s);
            
            results.push({ q: roundedQ, r: roundedR });
        }
        
        return results;
    }
    
    /**
     * Reveals an area around a center point
     * 
     * @param center Center position in world coordinates
     * @param radius Radius in hex units
     * @param state Visibility state to apply (defaults to FULLY_EXPLORED)
     */
    public revealArea(center: Vector2, radius: number, state: VisibilityState = VisibilityState.FULLY_EXPLORED): void {
        const hexCoords = CoordinateSystem.worldToHex(center.x, center.y);
        const hexes = CoordinateSystem.getHexesInRadius(hexCoords.q, hexCoords.r, radius);
        
        for (const hex of hexes) {
            this.setTileVisibility(hex.q, hex.r, state);
        }
    }
    
    /**
     * Checks if an entire area is explored
     * 
     * @param area Bounding box of the area in world coordinates
     * @returns True if all tiles in the area are at least partially explored
     */
    public isAreaExplored(area: BoundingBox): boolean {
        // Convert world coordinates to hex coordinates
        const topLeft = CoordinateSystem.worldToHex(area.x, area.y);
        const bottomRight = CoordinateSystem.worldToHex(area.x + area.width, area.y + area.height);
        
        // Determine the range of hex coordinates to check
        const minQ = Math.min(topLeft.q, bottomRight.q);
        const maxQ = Math.max(topLeft.q, bottomRight.q);
        const minR = Math.min(topLeft.r, bottomRight.r);
        const maxR = Math.max(topLeft.r, bottomRight.r);
        
        // Check each tile in the area
        for (let q = minQ; q <= maxQ; q++) {
            for (let r = minR; r <= maxR; r++) {
                const visibility = this.getTileVisibility(q, r);
                
                // If any tile is unexplored, the area is not fully explored
                if (visibility === VisibilityState.UNEXPLORED) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Clears all fog of war data
     */
    public clear(): void {
        this.chunks.clear();
    }
    
    /**
     * Sets all tiles to a specific visibility state
     * 
     * @param state Visibility state to apply
     */
    public setAllTiles(state: VisibilityState): void {
        // Clear all chunks first
        this.chunks.clear();
        
        // If the state is unexplored, we don't need to do anything else
        if (state === VisibilityState.UNEXPLORED) {
            return;
        }
        
        // Otherwise, we need to set each tile's state
        // Since WorldMap doesn't have getBounds, calculate bounds from all tiles
        const tiles = this.worldMap.tiles;
        if (tiles.length === 0) return;
        
        // Find min/max coordinates
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;
        
        for (const tile of tiles) {
            const worldPos = CoordinateSystem.hexToWorld(tile.q, tile.r);
            minX = Math.min(minX, worldPos.x);
            minY = Math.min(minY, worldPos.y);
            maxX = Math.max(maxX, worldPos.x);
            maxY = Math.max(maxY, worldPos.y);
        }
        
        const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
        
        // Convert world coordinates to hex coordinates
        const topLeft = CoordinateSystem.worldToHex(bounds.x, bounds.y);
        const bottomRight = CoordinateSystem.worldToHex(
            bounds.x + bounds.width,
            bounds.y + bounds.height
        );
        
        // Set visibility for each tile
        for (let q = topLeft.q; q <= bottomRight.q; q++) {
            for (let r = topLeft.r; r <= bottomRight.r; r++) {
                // Only set tiles that exist in the world map
                if (this.worldMap.getTile(q, r)) {
                    this.setTileVisibility(q, r, state);
                }
            }
        }
    }
    
    /**
     * Serializes the fog of war data for saving
     * 
     * @returns Serialized data
     */
    public serialize(): any {
        const serializedChunks: Record<string, any> = {};
        
        for (const [key, chunk] of this.chunks.entries()) {
            const serializedTiles: Record<string, string> = {};
            
            for (const [tileKey, state] of chunk.tileStates.entries()) {
                serializedTiles[tileKey] = state;
            }
            
            serializedChunks[key] = {
                lastUpdated: chunk.lastUpdated,
                chunkX: chunk.chunkX,
                chunkY: chunk.chunkY,
                tiles: serializedTiles
            };
        }
        
        return {
            chunks: serializedChunks,
            config: this.visibilityConfig
        };
    }
    
    /**
     * Deserializes fog of war data from saved state
     * 
     * @param data Serialized data
     */
    public deserialize(data: any): void {
        this.chunks.clear();
        
        if (data.config) {
            this.visibilityConfig = {
                ...this.visibilityConfig,
                ...data.config
            };
        }
        
        if (data.chunks) {
            for (const [key, rawChunkData] of Object.entries(data.chunks)) {
                // Type assertion for the chunk data
                const chunkData = rawChunkData as {
                    lastUpdated: number,
                    chunkX: number,
                    chunkY: number,
                    tiles: Record<string, string>
                };
                
                const chunk = {
                    tileStates: new Map<string, VisibilityState>(),
                    lastUpdated: chunkData.lastUpdated || Date.now(),
                    chunkX: chunkData.chunkX,
                    chunkY: chunkData.chunkY
                };
                
                // Restore tile states
                if (chunkData.tiles) {
                    for (const [tileKey, state] of Object.entries(chunkData.tiles)) {
                        chunk.tileStates.set(tileKey, state as VisibilityState);
                    }
                }
                
                this.chunks.set(key, chunk);
            }
        }
    }
    
    /**
     * Updates configuration parameters
     * 
     * @param config New configuration parameters
     */
    public updateConfig(config: Partial<VisibilityConfig>): void {
        this.visibilityConfig = {
            ...this.visibilityConfig,
            ...config
        };
    }
}
