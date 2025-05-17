/**
 * ExplorationTracker manages tracking of world exploration and discoveries
 * 
 * Handles recording and querying information about player discoveries,
 * exploration progress, and points of interest in the game world.
 */

import { CoordinateSystem } from '../../core/utils/CoordinateSystem';
import { DiscoveryEvent, DiscoveryStatistics, DiscoveryType, Vector2 } from './types';
import { WorldMap } from '../WorldMap';
import { BiomeType } from '../../rendering/tiles/types';

/**
 * Manager class for tracking exploration progress and discoveries
 */
export class ExplorationTracker {
    /**
     * Array of discovery events that have occurred
     */
    private discoveries: DiscoveryEvent[];
    
    /**
     * Reference to the world map
     */
    private worldMap: WorldMap;
    
    /**
     * ID of the player or colony that owns this exploration tracker
     */
    private ownerId: string;
    
    /**
     * Creates a new ExplorationTracker
     * 
     * @param worldMap Reference to the world map
     * @param ownerId ID of the player or colony that owns this tracker
     */
    constructor(worldMap: WorldMap, ownerId: string) {
        this.worldMap = worldMap;
        this.ownerId = ownerId;
        this.discoveries = [];
    }
    
    /**
     * Records a new discovery event
     * 
     * @param type Type of discovery
     * @param location World position of the discovery
     * @param metadata Additional data about the discovery
     * @returns The created discovery event
     */
    public registerDiscovery(type: DiscoveryType, location: Vector2, metadata: any = {}): DiscoveryEvent {
        // Convert world position to hex coordinates for more accurate tracking
        const hexCoords = CoordinateSystem.worldToHex(location.x, location.y);
        
        // Get the tile at this location if it exists
        const tile = this.worldMap.getTile(hexCoords.q, hexCoords.r);
        
        // Update tile's discovered state if it exists
        if (tile) {
            tile.discovered = true;
            
            // For special locations, also mark as explored
            if (type === DiscoveryType.SPECIAL_LOCATION || 
                type === DiscoveryType.ANOMALY || 
                type === DiscoveryType.ARTIFACT) {
                tile.explored = true;
            }
            
            // Add biome information to metadata if not already present
            if (!metadata.biomeType && tile.biomeType) {
                metadata.biomeType = tile.biomeType;
            }
            
            // Add elevation information if available
            if (!metadata.elevation && tile.elevation !== undefined) {
                metadata.elevation = tile.elevation;
            }
        }
        
        // Create the discovery event
        const discovery: DiscoveryEvent = {
            type,
            location,
            discoveredBy: this.ownerId,
            timestamp: Date.now(),
            metadata
        };
        
        // Add to discoveries array
        this.discoveries.push(discovery);
        
        return discovery;
    }
    
    /**
     * Checks if a specific discovery type exists at a location
     * 
     * @param type Type of discovery
     * @param location World position to check
     * @returns True if the discovery exists
     */
    public hasDiscovered(type: DiscoveryType, location: Vector2): boolean {
        // Convert world position to hex coordinates
        const hexCoords = CoordinateSystem.worldToHex(location.x, location.y);
        
        // Convert back to ensure we're using the exact center of the hex
        const centerPos = CoordinateSystem.hexToWorld(hexCoords.q, hexCoords.r);
        
        // Find any discoveries at this position
        return this.discoveries.some(discovery => 
            discovery.type === type &&
            discovery.location.x === centerPos.x &&
            discovery.location.y === centerPos.y
        );
    }
    
    /**
     * Gets all discoveries within a specific area
     * 
     * @param center Center position of the area
     * @param radius Radius around the center in world units
     * @returns Array of discoveries in the area
     */
    public getDiscoveriesInArea(center: Vector2, radius: number): DiscoveryEvent[] {
        const radiusSquared = radius * radius;
        
        return this.discoveries.filter(discovery => {
            const dx = discovery.location.x - center.x;
            const dy = discovery.location.y - center.y;
            const distanceSquared = dx * dx + dy * dy;
            
            return distanceSquared <= radiusSquared;
        });
    }
    
    /**
     * Gets discoveries of a specific type
     * 
     * @param type Type of discovery to filter by
     * @returns Array of discoveries of the specified type
     */
    public getDiscoveriesByType(type: DiscoveryType): DiscoveryEvent[] {
        return this.discoveries.filter(discovery => discovery.type === type);
    }
    
    /**
     * Calculate statistics about discoveries
     * 
     * @returns Statistics object with discovery information
     */
    public getDiscoveryStatistics(): DiscoveryStatistics {
        if (this.discoveries.length === 0) {
            return {
                total: 0,
                byType: {} as Record<DiscoveryType, number>,
                firstDiscovery: 0,
                latestDiscovery: 0
            };
        }
        
        // Calculate counts by type
        const byType: Record<DiscoveryType, number> = {} as Record<DiscoveryType, number>;
        
        // Initialize all types to zero
        Object.values(DiscoveryType).forEach(type => {
            byType[type] = 0;
        });
        
        // Count discoveries by type
        for (const discovery of this.discoveries) {
            byType[discovery.type] = (byType[discovery.type] || 0) + 1;
        }
        
        // Find first and latest discovery timestamps
        let firstDiscovery = this.discoveries[0].timestamp;
        let latestDiscovery = this.discoveries[0].timestamp;
        
        for (const discovery of this.discoveries) {
            if (discovery.timestamp < firstDiscovery) {
                firstDiscovery = discovery.timestamp;
            }
            if (discovery.timestamp > latestDiscovery) {
                latestDiscovery = discovery.timestamp;
            }
        }
        
        return {
            total: this.discoveries.length,
            byType,
            firstDiscovery,
            latestDiscovery
        };
    }
    
    /**
     * Gets the percentage of the world that has been discovered
     * 
     * @returns Percentage as a value between 0 and 1
     */
    public getExplorationPercentage(): number {
        const totalTiles = this.worldMap.tiles.length;
        if (totalTiles === 0) return 0;
        
        const discoveredTiles = this.worldMap.getDiscoveredTiles().length;
        return discoveredTiles / totalTiles;
    }
    
    /**
     * Gets the most common biome type discovered
     * 
     * @returns The most common biome type, or null if none discovered
     */
    public getMostCommonBiome(): BiomeType | null {
        // Get all resource discoveries with biome information
        const biomesDiscovered = this.discoveries
            .filter(d => d.type === DiscoveryType.RESOURCE && d.metadata?.biomeType)
            .map(d => d.metadata.biomeType as BiomeType);
        
        if (biomesDiscovered.length === 0) return null;
        
        // Count occurrences of each biome
        const biomeCounts = biomesDiscovered.reduce((counts, biome) => {
            counts[biome] = (counts[biome] || 0) + 1;
            return counts;
        }, {} as Record<BiomeType, number>);
        
        // Find the most common biome
        let maxCount = 0;
        let mostCommonBiome: BiomeType | null = null;
        
        for (const [biome, count] of Object.entries(biomeCounts)) {
            if (count > maxCount) {
                maxCount = count;
                mostCommonBiome = biome as BiomeType;
            }
        }
        
        return mostCommonBiome;
    }
    
    /**
     * Mark a specific area as explored or discovered
     * 
     * @param center Center position of the area
     * @param radius Radius in world units
     * @param fullyExplored Whether to mark as fully explored (true) or just discovered (false)
     */
    public markAreaExplored(center: Vector2, radius: number, fullyExplored: boolean = true): void {
        // Convert center to hex coordinates
        const hexCenter = CoordinateSystem.worldToHex(center.x, center.y);
        
        // Convert radius from world units to hex distance
        // This is an approximation based on the hex size
        const hexSize = CoordinateSystem.getHexSize();
        const hexRadius = Math.ceil(radius / hexSize);
        
        // Get all hexes within radius
        const hexes = CoordinateSystem.getHexesInRadius(hexCenter.q, hexCenter.r, hexRadius);
        
        // Mark each tile as discovered/explored
        for (const hex of hexes) {
            const tile = this.worldMap.getTile(hex.q, hex.r);
            if (tile) {
                tile.discovered = true;
                
                if (fullyExplored) {
                    tile.explored = true;
                }
            }
        }
    }
    
    /**
     * Serializes the exploration tracker data for saving
     * 
     * @returns Serialized data
     */
    public serialize(): any {
        return {
            ownerId: this.ownerId,
            discoveries: this.discoveries
        };
    }
    
    /**
     * Deserializes exploration tracker data from saved state
     * 
     * @param data Serialized data
     */
    public deserialize(data: any): void {
        this.ownerId = data.ownerId || this.ownerId;
        this.discoveries = data.discoveries || [];
    }
}
