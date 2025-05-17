/**
 * TerraFlux - World Generator V1
 * 
 * Implements deterministic world generation with explicit version tagging
 * to ensure multiplayer compatibility. This generator creates interesting
 * and varied worlds with consistent results across all clients.
 */

import { v4 as uuidv4 } from 'uuid';
import { BiomeType, FeatureType } from '../../rendering/tiles/types';
import { CoordinateSystem } from '../../core/utils/CoordinateSystem';
import { 
  WorldMap as IWorldMap,
  WorldTile as IWorldTile,
  WorldFeature,
  WorldResource,
  WorldRegion
} from '../types';
import { BiomeDefinitionManager } from '../BiomeDefinitionManager';
import { NoiseGenerator } from './noise/NoiseGenerator';
import { WorldGeneratorInterface, WorldGenerationOptions, DEFAULT_WORLD_GENERATION_OPTIONS } from './WorldGeneratorInterface';
import { SeededRandom } from './SeededRandom';
import { WorldMap } from '../WorldMap';
import { WorldTile } from '../WorldTile';

/**
 * World generator class for procedurally generating game worlds
 * This implementation is explicitly versioned as V1.0 to ensure deterministic
 * generation across all clients.
 */
export class WorldGeneratorV1 implements WorldGeneratorInterface {
  // Generator version - increment this when generation algorithms change
  public readonly version: string = '1.0';
  
  // Generation options
  private _options: WorldGenerationOptions;
  
  // Noise generator
  private _noise: NoiseGenerator;
  
  // Random number generator
  private _random: SeededRandom;
  
  // Biome definition manager
  private _biomeDefinitions: BiomeDefinitionManager;
  
  // Regions of the world for biome placement
  private _regions: WorldRegion[] = [];
  
  // Maps of possible features and resources by biome
  private _possibleFeatures: Map<BiomeType, { type: FeatureType; subType: string; weight: number }[]>;
  private _possibleResources: Map<BiomeType, { type: string; quality: number; weight: number }[]>;
  
  // Elevation cache for performance
  private _elevationCache: Map<string, number> = new Map();
  private _moistureCache: Map<string, number> = new Map();
  private _temperatureCache: Map<string, number> = new Map();
  
  /**
   * Constructor
   * @param options - Options for world generation
   * @param biomeDefinitions - Optional biome definition manager
   */
  constructor(options?: Partial<WorldGenerationOptions>, biomeDefinitions?: BiomeDefinitionManager) {
    // Combine default options with provided options
    this._options = { 
      ...DEFAULT_WORLD_GENERATION_OPTIONS,
      ...options
    };
    
    // Initialize noise generator with the seed
    this._noise = new NoiseGenerator(this._options.seed);
    
    // Initialize random number generator
    this._random = new SeededRandom(this._options.seed);
    
    // Initialize or use provided biome definitions
    this._biomeDefinitions = biomeDefinitions || new BiomeDefinitionManager();
    
    // Initialize maps
    this._possibleFeatures = new Map();
    this._possibleResources = new Map();
    
    // Initialize feature and resource maps
    this._initializeFeatureMap();
    this._initializeResourceMap();
  }

  /**
   * Generate a new world map
   * @returns The generated world map
   */
  public generateWorld(): WorldMap {
    console.log(`Generating new world with seed: ${this._options.seed} (Version ${this.version})`);
    
    // Create regions for biome placement
    this._createRegions();
    
    // Create array to hold all tiles
    const tiles: IWorldTile[] = [];
    
    // Generate all tiles in the world
    this._generateTiles(tiles);
    
    // Apply smoothing to biome boundaries
    this._smoothBiomes(tiles);
    
    // Generate features and resources for each tile
    for (const tile of tiles) {
      this._generateTileFeatures(tile);
      this._generateTileResources(tile);
    }
    
    // Find a suitable starting location
    const startingTile = this._findSuitableStartingTile(tiles);
    
    // Mark starting tile and immediate neighbors as discovered
    this._discoverStartingArea(tiles, startingTile);
    
    // Create the world map object using the constructor from the class (not the interface)
    const worldMap = new WorldMap(
      this._options.name, 
      this._options.seed, 
      this._options.size
    );
    
    // Convert interface tiles to WorldTile instances
    const worldTiles: WorldTile[] = [];
    for (const tileData of tiles) {
      const worldTile = new WorldTile(
        tileData.q,
        tileData.r,
        tileData.biomeType,
        tileData.variation,
        tileData.elevation,
        tileData.moisture,
        tileData.temperature
      );
      
      // Add features
      for (const feature of tileData.features) {
        worldTile.addFeature(feature);
      }
      
      // Add resources
      for (const resource of tileData.resources) {
        worldTile.addResource(resource);
      }
      
      // Set discovered and explored flags
      if (tileData.discovered) {
        worldTile.markDiscovered();
      }
      if (tileData.explored) {
        worldTile.markExplored();
      }
      
      worldTile.setVisibility(tileData.visibility);
      worldTiles.push(worldTile);
    }
    
    // Add all generated tiles to the world map
    worldMap.addTiles(worldTiles);
    
    // Set biome distribution
    worldMap.setBiomeDistribution(this._calculateBiomeDistribution(tiles));
    
    // Set player position
    worldMap.updatePlayerPosition(startingTile.q, startingTile.r);
    
    console.log(`World generation complete. Created ${tiles.length} tiles.`);
    return worldMap;
  }

  /**
   * Generate a specific chunk of the world
   * This is used for progressive loading in multiplayer
   * @param chunkX - X coordinate of the chunk
   * @param chunkY - Y coordinate of the chunk
   * @param chunkSize - Size of the chunk
   * @returns Array of generated tiles in this chunk
   */
  public generateChunk(chunkX: number, chunkY: number, chunkSize: number): IWorldTile[] {
    // Make sure regions are created before generating any chunks
    if (this._regions.length === 0) {
      this._createRegions();
    }
    
    const tiles: IWorldTile[] = [];
    
    // Calculate the start coordinates of this chunk in q,r space
    const startQ = chunkX * chunkSize;
    const startR = chunkY * chunkSize;
    
    // Generate tiles for this chunk
    for (let q = startQ; q < startQ + chunkSize; q++) {
      for (let r = startR; r < startR + chunkSize; r++) {
        // Skip coordinates outside the world radius
        if (Math.abs(q) > this._options.size || Math.abs(r) > this._options.size) {
          continue;
        }
        
        // Skip coordinates that don't form a valid hex
        const s = -q - r;
        if (Math.abs(s) > this._options.size) {
          continue;
        }
        
        const tile = this._generateTile(q, r);
        
        // Add features and resources
        this._generateTileFeatures(tile);
        this._generateTileResources(tile);
        
        tiles.push(tile);
      }
    }
    
    return tiles;
  }
  
  /**
   * Initialize the map of possible features for each biome
   * @private
   */
  private _initializeFeatureMap(): void {
    // Forest biome features
    this._possibleFeatures.set(BiomeType.FOREST, [
      { type: FeatureType.RESOURCE, subType: 'ancient_oak', weight: 5 },
      { type: FeatureType.RESOURCE, subType: 'pine', weight: 8 },
      { type: FeatureType.LANDMARK, subType: 'stone_circle', weight: 1 },
      { type: FeatureType.STRUCTURE, subType: 'abandoned_camp', weight: 2 },
      { type: FeatureType.RESOURCE, subType: 'mushroom_cluster', weight: 4 }
    ]);

    // Desert biome features
    this._possibleFeatures.set(BiomeType.DESERT, [
      { type: FeatureType.RESOURCE, subType: 'cactus', weight: 6 },
      { type: FeatureType.LANDMARK, subType: 'ancient_ruins', weight: 2 },
      { type: FeatureType.STRUCTURE, subType: 'oasis', weight: 1 },
      { type: FeatureType.SPECIAL, subType: 'sand_dune', weight: 7 }
    ]);

    // Mountain biome features
    this._possibleFeatures.set(BiomeType.MOUNTAIN, [
      { type: FeatureType.HAZARD, subType: 'steep_cliff', weight: 5 },
      { type: FeatureType.STRUCTURE, subType: 'cave_entrance', weight: 3 },
      { type: FeatureType.LANDMARK, subType: 'peak', weight: 2 },
      { type: FeatureType.RESOURCE, subType: 'alpine_flowers', weight: 4 }
    ]);

    // Wetland biome features
    this._possibleFeatures.set(BiomeType.WETLAND, [
      { type: FeatureType.RESOURCE, subType: 'lily_pad', weight: 6 },
      { type: FeatureType.RESOURCE, subType: 'willow', weight: 5 },
      { type: FeatureType.HAZARD, subType: 'muddy_pit', weight: 3 },
      { type: FeatureType.STRUCTURE, subType: 'reed_hut', weight: 2 }
    ]);

    // Crystal biome features
    this._possibleFeatures.set(BiomeType.CRYSTAL, [
      { type: FeatureType.RESOURCE, subType: 'energy_crystal', weight: 7 },
      { type: FeatureType.LANDMARK, subType: 'crystal_formation', weight: 4 },
      { type: FeatureType.SPECIAL, subType: 'reflective_pool', weight: 3 },
      { type: FeatureType.STRUCTURE, subType: 'resonance_arch', weight: 2 }
    ]);

    // Volcanic biome features
    this._possibleFeatures.set(BiomeType.VOLCANIC, [
      { type: FeatureType.HAZARD, subType: 'lava_pool', weight: 5 },
      { type: FeatureType.LANDMARK, subType: 'volcanic_vent', weight: 4 },
      { type: FeatureType.RESOURCE, subType: 'heat_resistant_plant', weight: 2 },
      { type: FeatureType.STRUCTURE, subType: 'obsidian_formation', weight: 3 }
    ]);
    
    // Tundra biome features
    this._possibleFeatures.set(BiomeType.TUNDRA, [
      { type: FeatureType.RESOURCE, subType: 'evergreen', weight: 5 },
      { type: FeatureType.LANDMARK, subType: 'ice_formation', weight: 4 },
      { type: FeatureType.HAZARD, subType: 'thin_ice', weight: 3 },
      { type: FeatureType.RESOURCE, subType: 'winter_berries', weight: 2 }
    ]);
  }

  /**
   * Initialize the map of possible resources for each biome
   * @private
   */
  private _initializeResourceMap(): void {
    // Forest biome resources
    this._possibleResources.set(BiomeType.FOREST, [
      { type: 'wood', quality: 1, weight: 10 },
      { type: 'herbs', quality: 1, weight: 6 },
      { type: 'berries', quality: 0, weight: 8 },
      { type: 'rare_mushrooms', quality: 2, weight: 2 }
    ]);

    // Desert biome resources
    this._possibleResources.set(BiomeType.DESERT, [
      { type: 'sand', quality: 0, weight: 10 },
      { type: 'cactus_fluid', quality: 1, weight: 6 },
      { type: 'desert_gems', quality: 2, weight: 2 },
      { type: 'ancient_artifacts', quality: 2, weight: 1 }
    ]);

    // Mountain biome resources
    this._possibleResources.set(BiomeType.MOUNTAIN, [
      { type: 'stone', quality: 0, weight: 10 },
      { type: 'iron_ore', quality: 1, weight: 6 },
      { type: 'gold_ore', quality: 2, weight: 3 },
      { type: 'crystal_shards', quality: 2, weight: 2 }
    ]);

    // Wetland biome resources
    this._possibleResources.set(BiomeType.WETLAND, [
      { type: 'clay', quality: 0, weight: 10 },
      { type: 'reeds', quality: 0, weight: 8 },
      { type: 'medicinal_plants', quality: 1, weight: 5 },
      { type: 'exotic_flowers', quality: 2, weight: 2 }
    ]);

    // Crystal biome resources
    this._possibleResources.set(BiomeType.CRYSTAL, [
      { type: 'crystal_fragments', quality: 1, weight: 8 },
      { type: 'energy_essence', quality: 2, weight: 5 },
      { type: 'resonant_dust', quality: 1, weight: 6 },
      { type: 'pure_crystal', quality: 2, weight: 2 }
    ]);

    // Volcanic biome resources
    this._possibleResources.set(BiomeType.VOLCANIC, [
      { type: 'obsidian', quality: 1, weight: 7 },
      { type: 'sulfur', quality: 0, weight: 8 },
      { type: 'fire_essence', quality: 2, weight: 4 },
      { type: 'heat_stone', quality: 1, weight: 5 }
    ]);
    
    // Tundra biome resources
    this._possibleResources.set(BiomeType.TUNDRA, [
      { type: 'ice', quality: 0, weight: 10 },
      { type: 'frost_crystals', quality: 1, weight: 6 },
      { type: 'cold_resistant_herbs', quality: 1, weight: 5 },
      { type: 'ancient_ice_core', quality: 2, weight: 2 }
    ]);
  }
  
  /**
   * Create regions for biome placement
   * @private
   */
  private _createRegions(): void {
    this._regions = [];
    
    // Create the number of regions specified in options
    for (let i = 0; i < this._options.regions.count; i++) {
      // Place region centers within 70% of the world radius to avoid edge regions
      const maxRadius = this._options.size * 0.7;
      const angle = this._random.nextFloat(0, Math.PI * 2);
      const distance = this._random.nextFloat(0, maxRadius);
      
      // Convert polar to axial coordinates
      const centerQ = Math.round(distance * Math.cos(angle));
      const centerR = Math.round(distance * Math.sin(angle));
      
      // Determine region size - vary a bit for natural feeling
      const sizeVariance = this._random.nextFloat(0.7, 1.3);
      const radius = Math.round(this._options.regions.size * sizeVariance);
      
      // Select a biome type for this region
      const biasType = this._selectBiomeTypeForRegion(centerQ, centerR);
      
      // Add region
      this._regions.push({
        centerQ,
        centerR,
        radius,
        biasType
      });
    }
  }
  
  /**
   * Select a biome type for a region based on its position
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The selected biome type
   * @private
   */
  private _selectBiomeTypeForRegion(q: number, r: number): BiomeType {
    // Use elevation and temperature to determine biome type
    const elevation = this._getElevation(q, r);
    const temperature = this._getTemperature(q, r, elevation);
    
    // Saltier seed for region biome selection
    const regionSeed = this._random.deriveNew(`region_${q}_${r}`);
    
    // Let the temperature mainly drive the biome type with some randomness
    if (temperature > 0.8) {
      // Very hot regions - volcanic, desert
      return regionSeed.nextFloat(0, 1) > 0.3 ? BiomeType.DESERT : BiomeType.VOLCANIC;
    } else if (temperature > 0.6) {
      // Hot regions - desert, forest
      return regionSeed.nextFloat(0, 1) > 0.4 ? BiomeType.FOREST : BiomeType.DESERT;
    } else if (temperature > 0.4) {
      // Temperate regions - forest, wetland
      return regionSeed.nextFloat(0, 1) > 0.5 ? BiomeType.FOREST : BiomeType.WETLAND;
    } else if (temperature > 0.2) {
      // Cool regions - wetland, tundra, crystal
      const roll = regionSeed.nextFloat(0, 1);
      if (roll > 0.6) return BiomeType.WETLAND;
      else if (roll > 0.3) return BiomeType.TUNDRA;
      else return BiomeType.CRYSTAL;
    } else {
      // Cold regions - tundra, crystal
      return regionSeed.nextFloat(0, 1) > 0.25 ? BiomeType.TUNDRA : BiomeType.CRYSTAL;
    }
  }
  
  /**
   * Generate all tiles in the world
   * @param tiles - Array to populate with tiles
   * @private
   */
  private _generateTiles(tiles: IWorldTile[]): void {
    const size = this._options.size;
    
    // Generate tiles in a hexagonal pattern
    for (let q = -size; q <= size; q++) {
      const r1 = Math.max(-size, -q - size);
      const r2 = Math.min(size, -q + size);
      
      for (let r = r1; r <= r2; r++) {
        const tile = this._generateTile(q, r);
        tiles.push(tile);
      }
    }
  }
  
  /**
   * Generate a single tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The generated tile
   * @private
   */
  private _generateTile(q: number, r: number): IWorldTile {
    // Generate base properties
    const elevation = this._getElevation(q, r);
    const moisture = this._getMoisture(q, r);
    const temperature = this._getTemperature(q, r, elevation);
    
    // Determine biome type
    const biomeType = this._determineBiomeType(q, r, elevation, moisture, temperature);
    
    // Create variation value based on coordinates
    const variationSeed = Math.abs(q * 31 + r * 17 + this._options.seed) % 1000;
    const variationRng = new SeededRandom(variationSeed);
    const variation = Math.floor(variationRng.next() * 5); // 0-4
    
    // Create the tile
    return {
      q,
      r,
      biomeType,
      variation,
      elevation,
      moisture,
      temperature,
      features: [],
      resources: [],
      discovered: false,
      explored: false,
      visibility: 0
    };
  }
  
  /**
   * Get elevation for a coordinate
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Elevation value (0-1)
   * @private
   */
  private _getElevation(q: number, r: number): number {
    // Check cache first
    const key = `${q},${r}`;
    if (this._elevationCache.has(key)) {
      return this._elevationCache.get(key)!;
    }
    
    // Generate elevation using our noise generator
    const elevation = this._noise.elevation(q, r, {
      scale: this._options.elevation.scale,
      octaves: this._options.elevation.octaves,
      persistence: this._options.elevation.persistence,
      mountainBias: this._options.elevation.mountainBias
    });
    
    // Cache the result
    this._elevationCache.set(key, elevation);
    
    return elevation;
  }
  
  /**
   * Get moisture for a coordinate
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Moisture value (0-1)
   * @private
   */
  private _getMoisture(q: number, r: number): number {
    // Check cache first
    const key = `${q},${r}`;
    if (this._moistureCache.has(key)) {
      return this._moistureCache.get(key)!;
    }
    
    // Generate moisture using our noise generator
    const moisture = this._noise.moisture(q, r, {
      scale: this._options.moisture.scale,
      octaves: this._options.moisture.octaves,
      persistence: this._options.moisture.persistence,
      riverInfluence: this._options.moisture.riverInfluence
    });
    
    // Cache the result
    this._moistureCache.set(key, moisture);
    
    return moisture;
  }
  
  /**
   * Get temperature for a coordinate
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param elevation - Pre-computed elevation value
   * @returns Temperature value (0-1)
   * @private
   */
  private _getTemperature(q: number, r: number, elevation: number): number {
    // Check cache first
    const key = `${q},${r}`;
    if (this._temperatureCache.has(key)) {
      return this._temperatureCache.get(key)!;
    }
    
    // Use the provided elevation for elevation-based temperature adjustments
    const getElevationFn = (qCoord: number, rCoord: number) => {
      if (qCoord === q && rCoord === r) return elevation;
      return this._getElevation(qCoord, rCoord);
    };
    
    // Generate temperature using our noise generator
    const temperature = this._noise.temperature(q, r, {
      scale: this._options.temperature.scale,
      octaves: this._options.temperature.octaves,
      persistence: this._options.temperature.persistence,
      latitudeFactor: this._options.temperature.latitudeFactor,
      elevationFactor: this._options.temperature.elevationFactor,
      elevationData: getElevationFn
    });
    
    // Cache the result
    this._temperatureCache.set(key, temperature);
    
    return temperature;
  }
  
  /**
   * Determine the biome type for a tile based on its position and regions
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param elevation - Pre-computed elevation
   * @param moisture - Pre-computed moisture
   * @param temperature - Pre-computed temperature 
   * @returns The determined biome type
   * @private
   */
  private _determineBiomeType(
    q: number, 
    r: number, 
    elevation: number, 
    moisture: number, 
    temperature: number
  ): BiomeType {
    // First, check if the tile is influenced by any regions
    const influences: { biome: BiomeType; strength: number }[] = [];
    
    // Calculate influence from each region
    for (const region of this._regions) {
      const distance = CoordinateSystem.hexDistance(q, r, region.centerQ, region.centerR);
      
      // If within region radius + blending factor
      if (distance <= region.radius + this._options.regions.blending * region.radius) {
        // Calculate influence strength (1.0 at center, dropping to 0 at the edge)
        const normalizedDistance = distance / (region.radius + this._options.regions.blending * region.radius);
        const strength = 1 - normalizedDistance;
        
        influences.push({
          biome: region.biasType,
          strength
        });
      }
    }
    
    // If no region influences this tile, determine based on properties
    if (influences.length === 0) {
      return this._determineBiomeFromProperties(elevation, moisture, temperature);
    }
    
    // If exactly one region influences this tile
    if (influences.length === 1) {
      return influences[0].biome;
    }
    
    // Multiple influences - find the strongest
    influences.sort((a, b) => b.strength - a.strength);
    
    // If one is significantly stronger than others, use it
    if (influences[0].strength > influences[1].strength * 1.5) {
      return influences[0].biome;
    }
    
    // Close influences, resolve with some deterministic randomness
    const hash = this._hash(q, r, this._options.seed);
    const resolvedRng = new SeededRandom(hash);
    return resolvedRng.next() < 0.7 ? influences[0].biome : influences[1].biome;
  }
  
  /**
   * Deterministic hash function for biome resolution
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param seed - World seed
   */
  private _hash(q: number, r: number, seed: number): number {
    return (q * 73856093) ^ (r * 19349663) ^ (seed * 83492791);
  }
  
  /**
   * Determine biome type based on properties
   * @param elevation - Elevation value (0-1)
   * @param moisture - Moisture value (0-1)
   * @param temperature - Temperature value (0-1) 
   * @returns The determined biome type
   * @private
   */
  private _determineBiomeFromProperties(
    elevation: number, 
    moisture: number, 
    temperature: number
  ): BiomeType {
    // Very high elevation is always mountains regardless of other factors
    if (elevation > 0.8) {
      return BiomeType.MOUNTAIN;
    }
    
    if (temperature > 0.7) {
      if (moisture < 0.3) {
        return BiomeType.DESERT;
      }
      if (moisture > 0.7) {
        return BiomeType.WETLAND;
      }
      return BiomeType.FOREST;
    }
    
    if (temperature < 0.3) {
      return BiomeType.TUNDRA;
    }
    
    if (moisture > 0.6) {
      return BiomeType.WETLAND;
    }
    
    if (moisture < 0.3) {
      return BiomeType.DESERT;
    }
    
    // Special biomes based on deterministic hash
    const determiner = temperature * 0.6 + moisture * 0.3 + elevation * 0.1;
    if (determiner > 0.95) {
      return BiomeType.CRYSTAL;
    }
    if (determiner > 0.9 && temperature > 0.5) {
      return BiomeType.VOLCANIC;
    }
    
    // Default to forest
    return BiomeType.FOREST;
  }
  
  /**
   * Apply smoothing to biome boundaries
   * @param tiles - All tiles in the world
   * @private
   */
  private _smoothBiomes(tiles: IWorldTile[]): void {
    // Only apply smoothing if set above 0
    if (this._options.smoothing <= 0) return;
    
    // Create a copy of the original biome assignments
    const originalBiomes = new Map<string, BiomeType>();
    for (const tile of tiles) {
      originalBiomes.set(`${tile.q},${tile.r}`, tile.biomeType);
    }
    
    // Create a tile lookup for efficient neighbor finding
    const tileLookup = new Map<string, IWorldTile>();
    for (const tile of tiles) {
      tileLookup.set(`${tile.q},${tile.r}`, tile);
    }
    
    // Apply smoothing based on neighbors
    for (const tile of tiles) {
      // Skip smoothing if we're in core regions
      let skipSmoothing = false;
      for (const region of this._regions) {
        const distance = CoordinateSystem.hexDistance(tile.q, tile.r, region.centerQ, region.centerR);
        if (distance < region.radius * 0.5) { // Don't smooth core region areas
          skipSmoothing = true;
          break;
        }
      }
      
      if (skipSmoothing) continue;
      
      // Get neighbors
      const neighbors: IWorldTile[] = [];
      
      // Hex directions for getting neighbors
      const directions = [
        [1, 0], [1, -1], [0, -1],
        [-1, 0], [-1, 1], [0, 1]
      ];
      
      // Collect valid neighbors
      for (const [dq, dr] of directions) {
        const nq = tile.q + dq;
        const nr = tile.r + dr;
        const neighborTile = tileLookup.get(`${nq},${nr}`);
        if (neighborTile) {
          neighbors.push(neighborTile);
        }
      }
      
      // Count biome occurrences
      const biomeCounts = new Map<BiomeType, number>();
      for (const neighbor of neighbors) {
        const biome = originalBiomes.get(`${neighbor.q},${neighbor.r}`)!;
        biomeCounts.set(biome, (biomeCounts.get(biome) || 0) + 1);
      }
      
      // Current biome count
      const currentBiome = originalBiomes.get(`${tile.q},${tile.r}`)!;
      const currentCount = biomeCounts.get(currentBiome) || 0;
      
      // Find most common biome
      let maxCount = currentCount;
      let maxBiome = currentBiome;
      
      for (const [biome, count] of biomeCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          maxBiome = biome;
        }
      }
      
      // Apply smoothing deterministically based on hash
      const hash = (tile.q * 73856093) ^ (tile.r * 19349663) ^ (this._options.seed * 83492791);
      const normalizedHash = (hash % 1000) / 1000; // 0-1 value
      
      if (maxBiome !== currentBiome && normalizedHash < this._options.smoothing) {
        tile.biomeType = maxBiome;
      }
    }
  }
  
  /**
   * Generate features for a tile based on its biome type
   * @param tile - The tile to generate features for
   * @private
   */
  private _generateTileFeatures(tile: IWorldTile): void {
    // Use deterministic hash for feature generation
    const featureSeed = (tile.q * 73856093) ^ (tile.r * 19349663) ^ (this._options.seed * 83492791);
    const featureRng = new SeededRandom(featureSeed);
    
    // Chance to generate a feature
    const featureChance = this._options.features.density;
    
    // Add a bit of variety based on biome type
    let adjustedChance = featureChance;
    
    // Mountains and forests have more features than other biomes
    if (tile.biomeType === BiomeType.MOUNTAIN || tile.biomeType === BiomeType.FOREST) {
      adjustedChance *= 1.3;
    }
    
    // Deserts have fewer features
    if (tile.biomeType === BiomeType.DESERT) {
      adjustedChance *= 0.7;
    }
    
    // Decide if we should add a feature
    if (featureRng.next() > adjustedChance) {
      return; // Skip feature generation for this tile
    }
    
    // Get possible features for this biome type
    const possibleFeatures = this._possibleFeatures.get(tile.biomeType);
    if (!possibleFeatures || possibleFeatures.length === 0) {
      return;
    }
    
    // Calculate total weight
    let totalWeight = 0;
    for (const feature of possibleFeatures) {
      totalWeight += feature.weight;
    }
    
    // Pick a feature based on weights
    let selection = featureRng.next() * totalWeight;
    let selectedFeature: { type: FeatureType; subType: string } | null = null;
    
    for (const feature of possibleFeatures) {
      selection -= feature.weight;
      if (selection <= 0) {
        selectedFeature = {
          type: feature.type,
          subType: feature.subType
        };
        break;
      }
    }
    
    if (selectedFeature) {
      // Create a unique ID for the feature
      const featureId = `${selectedFeature.type}_${selectedFeature.subType}_${uuidv4().slice(0, 8)}`;
      
      // Create the feature
      const feature: WorldFeature = {
        type: selectedFeature.type,
        subType: selectedFeature.subType,
        name: `${selectedFeature.subType.replace('_', ' ')}`,
        description: `A ${selectedFeature.subType.replace('_', ' ')}`,
        discovered: false,
        interactable: selectedFeature.type !== FeatureType.HAZARD
      };
      
      // Add feature to tile
      tile.features.push(feature);
    }
  }

  /**
   * Generate resources for a tile based on its biome type
   * @param tile - The tile to generate resources for
   * @private
   */
  private _generateTileResources(tile: IWorldTile): void {
    // Use deterministic hash for resource generation
    const resourceSeed = (tile.q * 13856093) ^ (tile.r * 29349663) ^ (this._options.seed * 73492791);
    const resourceRng = new SeededRandom(resourceSeed);
    
    // Chance to generate resources - slightly higher than features
    const resourceChance = this._options.resources.density;
    
    // Add a bit of variety based on biome type
    let adjustedChance = resourceChance;
    
    // Forests and mountains have more resources
    if (tile.biomeType === BiomeType.MOUNTAIN || tile.biomeType === BiomeType.FOREST) {
      adjustedChance *= 1.2;
    }
    
    // Crystal biome has rich resources
    if (tile.biomeType === BiomeType.CRYSTAL) {
      adjustedChance *= 1.4;
    }
    
    // Number of resources to generate (0-3)
    const resourceCount = resourceRng.next() < adjustedChance ? 
      Math.floor(resourceRng.next() * 3) + 1 : 0;
    
    if (resourceCount === 0) {
      return; // Skip resource generation for this tile
    }
    
    // Get possible resources for this biome type
    const possibleResources = this._possibleResources.get(tile.biomeType);
    if (!possibleResources || possibleResources.length === 0) {
      return;
    }
    
    // Generate the determined number of resources
    for (let i = 0; i < resourceCount; i++) {
      // Calculate total weight
      let totalWeight = 0;
      for (const resource of possibleResources) {
        totalWeight += resource.weight;
      }
      
      // Pick a resource based on weights
      let selection = resourceRng.next() * totalWeight;
      let selectedResource: { type: string; quality: number } | null = null;
      
      for (const resource of possibleResources) {
        selection -= resource.weight;
        if (selection <= 0) {
          selectedResource = {
            type: resource.type,
            quality: resource.quality
          };
          break;
        }
      }
      
      if (selectedResource) {
        // Randomize amount slightly based on resource richness
        const baseAmount = 10 + Math.round(this._options.resources.richness * 20);
        const amount = Math.round(resourceRng.nextFloat(0.5, 1.5) * baseAmount);
        
        // Create the resource
        const resource: WorldResource = {
          type: selectedResource.type,
          quality: selectedResource.quality,
          amount,
          discovered: false,
          extractable: true
        };
        
        // Add resource to tile
        tile.resources.push(resource);
      }
    }
  }
  
  /**
   * Find a suitable starting tile for the player
   * @param tiles - All tiles in the world
   * @returns The selected starting tile
   * @private
   */
  private _findSuitableStartingTile(tiles: IWorldTile[]): IWorldTile {
    // Filter tiles that match our criteria for a starting location
    const candidateTiles = tiles.filter(tile => {
      // Should be a forest or wetland biome
      if (tile.biomeType !== BiomeType.FOREST && tile.biomeType !== BiomeType.WETLAND) {
        return false;
      }
      
      // Should have moderate elevation (not too high, not too low)
      if (tile.elevation < 0.3 || tile.elevation > 0.7) {
        return false;
      }
      
      // Should have at least moderate moisture
      if (tile.moisture < 0.4) {
        return false;
      }
      
      // Should have moderate temperature (not too hot, not too cold)
      if (tile.temperature < 0.4 || tile.temperature > 0.7) {
        return false;
      }
      
      // Check if the tile is somewhat central (within 70% of the map radius)
      const distanceFromCenter = Math.sqrt(tile.q * tile.q + tile.r * tile.r);
      if (distanceFromCenter > this._options.size * 0.7) {
        return false;
      }
      
      return true;
    });
    
    // If we have candidate tiles, choose one randomly
    if (candidateTiles.length > 0) {
      const startingSeed = this._random.deriveNew('starting_tile');
      const index = Math.floor(startingSeed.next() * candidateTiles.length);
      return candidateTiles[index];
    }
    
    // Fallback: If no suitable tile found, pick a forest or wetland tile near the center
    const centralTiles = tiles.filter(tile => 
      (tile.biomeType === BiomeType.FOREST || tile.biomeType === BiomeType.WETLAND) &&
      Math.sqrt(tile.q * tile.q + tile.r * tile.r) < this._options.size * 0.5
    );
    
    if (centralTiles.length > 0) {
      const startingSeed = this._random.deriveNew('starting_tile_fallback');
      const index = Math.floor(startingSeed.next() * centralTiles.length);
      return centralTiles[index];
    }
    
    // Ultimate fallback: Just pick a tile close to the center
    const sortedByDistanceFromCenter = [...tiles].sort((a, b) => {
      const distA = Math.sqrt(a.q * a.q + a.r * a.r);
      const distB = Math.sqrt(b.q * b.q + b.r * b.r);
      return distA - distB;
    });
    
    return sortedByDistanceFromCenter[0];
  }

  /**
   * Mark starting area tiles as discovered
   * @param tiles - All tiles in the world
   * @param startingTile - The selected starting tile
   * @private
   */
  private _discoverStartingArea(tiles: IWorldTile[], startingTile: IWorldTile): void {
    // Mark the starting tile as discovered and explored
    startingTile.discovered = true;
    startingTile.explored = true;
    startingTile.visibility = 1.0;
    
    // Create a lookup for efficient neighbor finding
    const tileLookup = new Map<string, IWorldTile>();
    for (const tile of tiles) {
      tileLookup.set(`${tile.q},${tile.r}`, tile);
    }
    
    // Define visibility levels by distance (0 = starting tile)
    const visibilityLevels = [1.0, 0.8, 0.5, 0.3];
    
    // Mark tiles in discovery radius
    for (let distance = 0; distance < visibilityLevels.length; distance++) {
      // Get all tiles at this distance using cube coordinates
      const ring = this._getHexRing(startingTile.q, startingTile.r, distance);
      
      for (const [q, r] of ring) {
        const tile = tileLookup.get(`${q},${r}`);
        if (tile) {
          tile.discovered = true;
          if (distance === 0) {
            tile.explored = true;
          }
          tile.visibility = visibilityLevels[distance];
        }
      }
    }
  }
  
  /**
   * Get all hex coordinates in a ring at a specified distance from a center
   * @param centerQ - Center Q coordinate
   * @param centerR - Center R coordinate
   * @param radius - Distance of the ring
   * @returns Array of [q, r] coordinate pairs
   * @private
   */
  private _getHexRing(centerQ: number, centerR: number, radius: number): [number, number][] {
    if (radius === 0) {
      return [[centerQ, centerR]];
    }
    
    const results: [number, number][] = [];
    
    // Start at the top-right and move in a ring
    let q = centerQ + radius;
    let r = centerR - radius;
    
    // Directions to move for each of the 6 sides
    const directions = [
      [0, 1],   // East
      [-1, 1],  // Southeast
      [-1, 0],  // Southwest
      [0, -1],  // West
      [1, -1],  // Northwest
      [1, 0]    // Northeast
    ];
    
    // Generate the ring
    for (let side = 0; side < 6; side++) {
      for (let step = 0; step < radius; step++) {
        results.push([q, r]);
        q += directions[side][0];
        r += directions[side][1];
      }
    }
    
    return results;
  }
  
  /**
   * Calculate the distribution of biomes in the world
   * @param tiles - All tiles in the world
   * @returns Map of biome types to their percentage in the world
   * @private
   */
  private _calculateBiomeDistribution(tiles: IWorldTile[]): Record<BiomeType, number> {
    const distribution: Record<BiomeType, number> = {} as Record<BiomeType, number>;
    const totalTiles = tiles.length;
    
    // Initialize all biome types to 0
    Object.values(BiomeType).forEach(biomeType => {
      distribution[biomeType] = 0;
    });
    
    // Count occurrences of each biome type
    for (const tile of tiles) {
      distribution[tile.biomeType] = (distribution[tile.biomeType] || 0) + 1;
    }
    
    // Convert counts to percentages
    Object.keys(distribution).forEach(biome => {
      distribution[biome as BiomeType] = distribution[biome as BiomeType] / totalTiles;
    });
    
    return distribution;
  }
}
