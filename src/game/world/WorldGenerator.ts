/**
 * TerraFlux - World Generator
 * 
 * Handles procedural generation of world maps using various algorithms
 * to create diverse and interesting worlds.
 */

import { v4 as uuidv4 } from 'uuid';
import { BiomeType, FeatureType, EXTENDED_FEATURE_TYPES } from '../rendering/tiles/types';
import { CoordinateSystem } from '../core/utils/CoordinateSystem';
import { 
  WorldMap,
  WorldTile,
  WorldFeature,
  WorldResource,
  EnhancedBiomeDefinition,
  WorldRegion,
  BiomeVariation
} from './types';
import { BiomeDefinitionManager } from './BiomeDefinitionManager';

/**
 * Options for world generation
 */
export interface WorldGenerationOptions {
  name: string;                      // Name of the world
  seed: number;                      // Seed for RNG
  size: number;                      // Size/radius of the world in tiles
  biomeDistribution?: Record<BiomeType, number>;  // Optional custom distribution
  smoothing: number;                 // Biome boundary smoothness (0-1)
  elevation: {
    scale: number;                   // Scale of elevation noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
  };
  moisture: {
    scale: number;                   // Scale of moisture noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
  };
  temperature: {
    scale: number;                   // Scale of temperature noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
  };
  features: {
    density: number;                 // Overall feature density (0-1)
    clumping: number;                // How much features clump together (0-1)
  };
  resources: {
    density: number;                 // Overall resource density (0-1)
    richness: number;                // Resource quality/quantity (0-1)
  };
  regions: {
    count: number;                   // Number of distinct regions to create
    size: number;                    // Average region size (radius in tiles)
    blending: number;                // How much regions blend together (0-1)
  };
}

/**
 * Default world generation options
 */
const DEFAULT_WORLD_GENERATION_OPTIONS: WorldGenerationOptions = {
  name: 'New TerraFlux World',
  seed: Math.floor(Math.random() * 1000000),
  size: 50,
  smoothing: 0.5,
  elevation: {
    scale: 0.1,
    octaves: 4,
    persistence: 0.5
  },
  moisture: {
    scale: 0.08,
    octaves: 3,
    persistence: 0.4
  },
  temperature: {
    scale: 0.12,
    octaves: 2,
    persistence: 0.6
  },
  features: {
    density: 0.3,
    clumping: 0.5
  },
  resources: {
    density: 0.4,
    richness: 0.5
  },
  regions: {
    count: 5,
    size: 10,
    blending: 0.3
  }
};

/**
 * Random number generator with seedable state
 */
class SeededRandom {
  private _state: number;
  
  constructor(seed: number) {
    this._state = seed;
  }
  
  /**
   * Generate a random number between 0 and 1
   * @returns Random number between 0 and 1
   */
  next(): number {
    this._state = (this._state * 16807) % 2147483647;
    return this._state / 2147483647;
  }
  
  /**
   * Generate a random integer between min and max (inclusive)
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer between min and max
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a random float between min and max
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Select a random element from an array
   * @param array - The array to select from
   * @returns A random element from the array
   */
  select<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Select a random element from an array with weighted probabilities
   * @param array - The array to select from
   * @param weights - The weights corresponding to each element
   * @returns A random element from the array based on weights
   */
  weightedSelect<T>(array: T[], weights: number[]): T {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = this.next() * totalWeight;
    
    let weightSum = 0;
    for (let i = 0; i < array.length; i++) {
      weightSum += weights[i];
      if (random < weightSum) {
        return array[i];
      }
    }
    
    // Fallback to last element
    return array[array.length - 1];
  }
}

/**
 * World generator class for procedurally generating game worlds
 */
export class WorldGenerator {
  // Options for world generation
  private _options: WorldGenerationOptions;
  
  // Random number generator
  private _random: SeededRandom;
  
  // Biome definition manager
  private _biomeDefinitions: BiomeDefinitionManager;
  
  // Maps of possible features and resources by biome
  private _possibleFeatures: Map<BiomeType, { type: FeatureType; subType: string; weight: number }[]>;
  private _possibleResources: Map<BiomeType, { type: string; quality: number; weight: number }[]>;
  
  // Regions of the world for biome placement
  private _regions: WorldRegion[];
  
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
    
    // Initialize random number generator
    this._random = new SeededRandom(this._options.seed);
    
    // Initialize or use provided biome definitions
    this._biomeDefinitions = biomeDefinitions || new BiomeDefinitionManager();
    
    // Initialize maps
    this._possibleFeatures = new Map();
    this._possibleResources = new Map();
    this._regions = [];
    
    // Initialize feature and resource maps
    this._initializeFeatureMap();
    this._initializeResourceMap();
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
  }

  /**
   * Generate a new world map
   * @returns The generated world map
   */
  public generateWorld(): WorldMap {
    console.log(`Generating new world with seed: ${this._options.seed}`);
    
    // Create regions for biome placement
    this._createRegions();
    
    // Create array to hold all tiles
    const tiles: WorldTile[] = [];
    
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
    
    // Create the world map object
    const worldMap: WorldMap = {
      id: uuidv4(),
      name: this._options.name,
      seed: this._options.seed,
      timestamp: Date.now(),
      version: '1.0',
      size: this._options.size,
      biomeDistribution: this._calculateBiomeDistribution(tiles),
      tiles,
      playerTileQ: startingTile.q,
      playerTileR: startingTile.r,
      exploredTileCount: 0
    };
    
    console.log(`World generation complete. Created ${tiles.length} tiles.`);
    return worldMap;
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
    // Use some coordinate-based logic to determine biome types
    // This helps create logical biome layouts (e.g. deserts in hot areas)
    const distanceFromCenter = Math.sqrt(q * q + r * r);
    const normalizedDistance = distanceFromCenter / this._options.size;
    const angle = Math.atan2(r, q);
    const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
    
    // Use these values to influence selection, but with randomness
    
    // Custom distribution if specified
    if (this._options.biomeDistribution) {
      // Use weighted distribution based on config
      const biomeTypes = Object.keys(this._options.biomeDistribution) as BiomeType[];
      const weights = biomeTypes.map(type => this._options.biomeDistribution![type]);
      
      return this._random.weightedSelect(biomeTypes, weights);
    }
    
    // Default distribution
    // Volcanic tends toward center, desert toward one side, etc.
    if (normalizedDistance < 0.3) {
      // Central region - higher chance of volcanic/crystal
      const centralBiomes = [
        BiomeType.VOLCANIC,
        BiomeType.CRYSTAL,
        BiomeType.MOUNTAIN
      ];
      return this._random.select(centralBiomes);
    } else if (normalizedDistance > 0.7) {
      // Outer region - higher chance of extreme biomes
      const outerBiomes = [
        BiomeType.DESERT,
        BiomeType.TUNDRA
      ];
      return this._random.select(outerBiomes);
    } else if (normalizedAngle < 0.3) {
      // North/northwest - higher chance of forests/wetlands
      const northBiomes = [
        BiomeType.FOREST,
        BiomeType.WETLAND
      ];
      return this._random.select(northBiomes);
    } else {
      // Anywhere else - all biomes possible
      const allBiomes = Object.values(BiomeType);
      return this._random.select(allBiomes);
    }
  }
  
  /**
   * Generate all tiles in the world
   * @param tiles - Array to populate with tiles
   * @private
   */
  private _generateTiles(tiles: WorldTile[]): void {
    const size = this._options.size;
    
    // Generate tiles in a hexagonal pattern
    for (let q = -size; q <= size; q++) {
      const r1 = Math.max(-size, -q - size);
      const r2 = Math.min(size, -q + size);
      
      for (let r = r1; r <= r2; r++) {
        const tile: WorldTile = {
          q,
          r,
          biomeType: this._determineBiomeType(q, r),
          variation: this._random.nextInt(0, 4),
          elevation: this._generateElevation(q, r),
          moisture: this._generateMoisture(q, r),
          temperature: this._generateTemperature(q, r),
          features: [],
          resources: [],
          discovered: false,
          explored: false,
          visibility: 0
        };
        
        tiles.push(tile);
      }
    }
  }
  
  /**
   * Determine the biome type for a tile based on its position and regions
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns The determined biome type
   * @private
   */
  private _determineBiomeType(q: number, r: number): BiomeType {
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
    
    // If no region influences this tile, determine based on noise
    if (influences.length === 0) {
      return this._determineBiomeFromNoise(q, r);
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
    
    // Close influences, add some randomness
    const roll = this._random.next();
    return roll < 0.7 ? influences[0].biome : influences[1].biome;
  }
  
  /**
   * Determine biome type based on noise values (for areas outside regions)
   * @param q - Q coordinate 
   * @param r - R coordinate
   * @returns The determined biome type
   * @private
   */
  private _determineBiomeFromNoise(q: number, r: number): BiomeType {
    // Use elevation, moisture and temperature to determine biome
    const elevation = this._generateElevation(q, r);
    const moisture = this._generateMoisture(q, r);
    const temperature = this._generateTemperature(q, r);
    
    // Simple biome determination based on these 3 values
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
    
    // Special biomes in rare cases
    const special = this._random.next();
    if (special > 0.95) {
      return BiomeType.CRYSTAL;
    }
    if (special > 0.9) {
      return BiomeType.VOLCANIC;
    }
    
    // Default to forest
    return BiomeType.FOREST;
  }
  
  /**
   * Generate elevation value for a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Elevation value (0-1)
   * @private
   */
  private _generateElevation(q: number, r: number): number {
    return this._simplex2D(
      q, 
      r, 
      this._options.elevation.scale,
      this._options.elevation.octaves,
      this._options.elevation.persistence
    );
  }
  
  /**
   * Generate moisture value for a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Moisture value (0-1)
   * @private
   */
  private _generateMoisture(q: number, r: number): number {
    return this._simplex2D(
      q + 500, // Offset to create different pattern from elevation
      r + 500,
      this._options.moisture.scale,
      this._options.moisture.octaves,
      this._options.moisture.persistence
    );
  }
  
  /**
   * Generate temperature value for a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Temperature value (0-1)
   * @private
   */
  private _generateTemperature(q: number, r: number): number {
    return this._simplex2D(
      q + 1000, // Offset to create different pattern
      r + 1000,
      this._options.temperature.scale,
      this._options.temperature.octaves,
      this._options.temperature.persistence
    );
  }
  
  /**
   * Generate 2D simplex noise
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param scale - Scale factor for the noise
   * @param octaves - Number of octaves to use
   * @param persistence - Persistence value for octaves
   * @returns Noise value (0-1)
   * @private
   */
  private _simplex2D(x: number, y: number, scale: number, octaves: number, persistence: number): number {
    // NOTE: This is a basic implementation. A real implementation would use a proper
    // noise library like simplex-noise
    
    // Instead, use seeded random to create a deterministic but noisy result
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      // Hash the coordinates with the seed and current octave
      const nx = x * scale * frequency;
      const ny = y * scale * frequency;
      const seedOffset = i * 1000;
      
      const hash = Math.sin(nx * 12.9898 + ny * 78.233 + this._options.seed + seedOffset) * 43758.5453;
      const noise = (hash - Math.floor(hash)) * 2 - 1; // Range -1 to 1
      
      value += (noise + 1) / 2 * amplitude; // Range 0 to 1
      maxValue += amplitude;
      
      amplitude *= persistence;
      frequency *= 2;
    }
    
    // Normalize to 0-1
    return value / maxValue;
  }
  
  /**
   * Apply smoothing to biome boundaries
   * @param tiles - All tiles in the world
   * @private
   */
  private _smoothBiomes(tiles: WorldTile[]): void {
    // Only apply smoothing if set above 0
    if (this._options.smoothing <= 0) return;
    
    // Create a copy of the original biome assignments
    const originalBiomes = new Map<string, BiomeType>();
    for (const tile of tiles) {
      originalBiomes.set(`${tile.q},${tile.r}`, tile.biomeType);
    }
    
    // Create a tile lookup for efficient neighbor finding
    const tileLookup = new Map<string, WorldTile>();
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
      const neighbors: WorldTile[] = [];
      
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
      
      // Apply smoothing with a chance based on the smoothing value
      if (maxBiome !== currentBiome && this._random.nextFloat(0, 1) < this._options.smoothing) {
        tile.biomeType = maxBiome;
      }
    }
  }

  /**
   * Generate features for a tile
   * @param tile - The tile to generate features for
   * @private
   */
  private _generateTileFeatures(tile: WorldTile): void {
    // Chance to generate a feature
    const featureChance = this._options.features.density;
    
    // Add a bit of variety based on biome type
    let adjustedChance = featureChance;
    
    switch (tile.biomeType) {
      case BiomeType.FOREST:
        adjustedChance *= 1.3; // More likely to have features in forests
        break;
      case BiomeType.DESERT:
        adjustedChance *= 0.7; // Less likely in deserts
        break;
      case BiomeType.MOUNTAIN:
        adjustedChance *= 1.2; // More features in mountains
        break;
      case BiomeType.VOLCANIC:
        adjustedChance *= 1.4; // More features in volcanic areas
        break;
    }
    
    // Generate random features based on chance
    if (this._random.nextFloat(0, 1) < adjustedChance) {
      const biomeFeatures = this._possibleFeatures.get(tile.biomeType);
      if (!biomeFeatures || biomeFeatures.length === 0) return;
      
      // Determine how many features to add (1-3)
      const featureCount = this._options.features.clumping > 0.7 ? 
        this._random.nextInt(1, 3) : 
        1;
      
      // Add the features
      for (let i = 0; i < featureCount; i++) {
        // Select a feature type based on weights
        const feature = this._random.weightedSelect(
          biomeFeatures,
          biomeFeatures.map(f => f.weight)
        );
        
        // Add the feature to the tile
        tile.features.push({
          type: feature.type,
          subType: feature.subType,
          name: `${feature.subType.charAt(0).toUpperCase() + feature.subType.slice(1).replace('_', ' ')}`,
          description: `A ${feature.subType.replace('_', ' ')} found in this ${tile.biomeType.toLowerCase()} area.`,
          discovered: false,
          interactable: true // Default to interactable
        });
      }
    }
  }
  
  /**
   * Generate resources for a tile
   * @param tile - The tile to generate resources for
   * @private
   */
  private _generateTileResources(tile: WorldTile): void {
    // Chance to generate resources
    const resourceChance = this._options.resources.density;
    
    // Adjust chance based on biome type
    let adjustedChance = resourceChance;
    
    switch (tile.biomeType) {
      case BiomeType.MOUNTAIN:
        adjustedChance *= 1.4; // More resources in mountains
        break;
      case BiomeType.FOREST:
        adjustedChance *= 1.2; // More resources in forests
        break;
      case BiomeType.DESERT:
        adjustedChance *= 0.8; // Fewer resources in deserts
        break;
      case BiomeType.CRYSTAL:
        adjustedChance *= 1.5; // More resources in crystal biomes
        break;
    }
    
    // Generate random resources based on chance
    if (this._random.nextFloat(0, 1) < adjustedChance) {
      const biomeResources = this._possibleResources.get(tile.biomeType);
      if (!biomeResources || biomeResources.length === 0) return;
      
      // Determine how many resources to add (usually 1, but can be more if richness is high)
      const resourceCount = this._options.resources.richness > 0.7 ?
        this._random.nextInt(1, 2) :
        1;
      
      // Add the resources
      for (let i = 0; i < resourceCount; i++) {
        // Select a resource type based on weights
        const resource = this._random.weightedSelect(
          biomeResources,
          biomeResources.map(r => r.weight)
        );
        
        // Calculate amount based on richness
        const baseAmount = this._random.nextInt(5, 20);
        const amountMultiplier = 1 + (resource.quality * 0.5) + (this._options.resources.richness * 0.5);
        const amount = Math.round(baseAmount * amountMultiplier);
        
        // Add the resource to the tile
        tile.resources.push({
          type: resource.type,
          quality: resource.quality,
          amount,
          discovered: false,
          extractable: true // Default to extractable
        });
      }
    }
  }

  /**
   * Find a suitable starting tile for the player
   * @param tiles - All tiles in the world
   * @returns The starting tile
   * @private
   */
  private _findSuitableStartingTile(tiles: WorldTile[]): WorldTile {
    // Criteria for a good starting tile:
    // 1. Ideally not too close to the edge
    // 2. Not in extreme biomes (volcanic, tundra)
    // 3. Reasonable resources nearby
    // 4. Not too high elevation (mountains)
    
    // First, get tiles within a reasonable distance from center
    const centerRadius = Math.floor(this._options.size * 0.4); // 40% of world radius
    const centralTiles = tiles.filter(tile => 
      CoordinateSystem.hexDistance(0, 0, tile.q, tile.r) <= centerRadius
    );
    
    // Filter out extreme/harsh biomes
    const suitableBiomes = [BiomeType.FOREST, BiomeType.WETLAND];
    let candidateTiles = centralTiles.filter(tile => 
      suitableBiomes.includes(tile.biomeType)
    );
    
    // If we don't have any suitable tiles, fall back to all central tiles
    if (candidateTiles.length === 0) {
      candidateTiles = centralTiles;
    }
    
    // Score each tile based on desirability
    const scoredTiles = candidateTiles.map(tile => {
      let score = 0;
      
      // Prefer moderate elevation
      const elevationScore = 1 - Math.abs(tile.elevation - 0.5) * 2;
      score += elevationScore * 2;
      
      // Prefer moderate moisture
      const moistureScore = 1 - Math.abs(tile.moisture - 0.6) * 2;
      score += moistureScore;
      
      // Prefer moderate temperature
      const temperatureScore = 1 - Math.abs(tile.temperature - 0.5) * 2;
      score += temperatureScore;
      
      // Bonus for forest biome
      if (tile.biomeType === BiomeType.FOREST) {
        score += 1;
      }
      
      // Check for nearby resources (within 2 tiles)
      const nearbyTiles = tiles.filter(t => 
        CoordinateSystem.hexDistance(tile.q, tile.r, t.q, t.r) <= 2
      );
      
      // Count resources in nearby tiles
      const nearbyResourceCount = nearbyTiles.reduce(
        (count, t) => count + t.resources.length, 0
      );
      
      score += Math.min(2, nearbyResourceCount * 0.5);
      
      return { tile, score };
    });
    
    // Sort by score (descending)
    scoredTiles.sort((a, b) => b.score - a.score);
    
    // Take the top 3 tiles and randomly select one (for variety)
    const topTiles = scoredTiles.slice(0, Math.min(3, scoredTiles.length));
    const selectedIndex = this._random.nextInt(0, topTiles.length - 1);
    
    return topTiles[selectedIndex].tile;
  }
  
  /**
   * Mark the starting area as discovered
   * @param tiles - All tiles in the world
   * @param startingTile - The starting tile
   * @private
   */
  private _discoverStartingArea(tiles: WorldTile[], startingTile: WorldTile): void {
    // Create a tile lookup for efficient neighbor finding
    const tileLookup = new Map<string, WorldTile>();
    for (const tile of tiles) {
      tileLookup.set(`${tile.q},${tile.r}`, tile);
    }
    
    // Discover the starting tile
    startingTile.discovered = true;
    startingTile.explored = true;
    startingTile.visibility = 1;
    
    // Discover immediate neighbors
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1]
    ];
    
    for (const [dq, dr] of directions) {
      const nq = startingTile.q + dq;
      const nr = startingTile.r + dr;
      const neighborTile = tileLookup.get(`${nq},${nr}`);
      
      if (neighborTile) {
        neighborTile.discovered = true;
        neighborTile.visibility = 0.7;
      }
    }
    
    // Second ring has lower visibility
    for (const tile of tiles) {
      const distance = CoordinateSystem.hexDistance(startingTile.q, startingTile.r, tile.q, tile.r);
      if (distance === 2) {
        tile.discovered = true;
        tile.visibility = 0.3;
      }
    }
  }
  
  /**
   * Calculate the distribution of biomes in the world
   * @param tiles - All tiles in the world
   * @returns Record of biome types to their percentage
   */
  private _calculateBiomeDistribution(tiles: WorldTile[]): Record<BiomeType, number> {
    const counts = new Map<BiomeType, number>();
    const total = tiles.length;
    
    // Count occurrences of each biome
    for (const tile of tiles) {
      counts.set(tile.biomeType, (counts.get(tile.biomeType) || 0) + 1);
    }
    
    // Convert to percentages
    const result: Partial<Record<BiomeType, number>> = {};
    
    for (const biomeType of Object.values(BiomeType)) {
      const count = counts.get(biomeType) || 0;
      result[biomeType] = count / total;
    }
    
    return result as Record<BiomeType, number>;
  }
}
