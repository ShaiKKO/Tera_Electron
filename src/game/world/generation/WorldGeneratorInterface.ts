/**
 * TerraFlux - World Generator Interface
 * 
 * Defines the interface for world generator implementations.
 * This allows for different generation algorithms with the same API.
 */

import { WorldMap } from '../WorldMap';

/**
 * Options for world generation
 */
export interface WorldGenerationOptions {
  name: string;                      // Name of the world
  seed: number;                      // Seed for RNG
  size: number;                      // Size/radius of the world in tiles
  smoothing: number;                 // Biome boundary smoothness (0-1)
  elevation: {
    scale: number;                   // Scale of elevation noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
    mountainBias?: number;           // Bias towards creating mountain ranges
  };
  moisture: {
    scale: number;                   // Scale of moisture noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
    riverInfluence?: number;         // Influence of rivers on moisture
  };
  temperature: {
    scale: number;                   // Scale of temperature noise
    octaves: number;                 // Number of noise octaves
    persistence: number;             // Persistence value for octaves
    latitudeFactor?: number;         // How much latitude affects temperature
    elevationFactor?: number;        // How much elevation affects temperature
  };
  features: {
    density: number;                 // Overall feature density (0-1)
    clumping: number;                // How much features clump together (0-1)
  };
  resources: {
    density: number;                 // Overall resource density (0-1)
    richness: number;                // Resource quality/quantity (0-1)
    clusterFactor?: number;          // How much resources cluster together
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
export const DEFAULT_WORLD_GENERATION_OPTIONS: WorldGenerationOptions = {
  name: 'New TerraFlux World',
  seed: Math.floor(Math.random() * 1000000),
  size: 50,
  smoothing: 0.5,
  elevation: {
    scale: 0.1,
    octaves: 4,
    persistence: 0.5,
    mountainBias: 0.3
  },
  moisture: {
    scale: 0.08,
    octaves: 3,
    persistence: 0.4,
    riverInfluence: 0.5
  },
  temperature: {
    scale: 0.12,
    octaves: 2,
    persistence: 0.6,
    latitudeFactor: 0.6,
    elevationFactor: 0.3
  },
  features: {
    density: 0.3,
    clumping: 0.5
  },
  resources: {
    density: 0.4,
    richness: 0.5,
    clusterFactor: 0.6
  },
  regions: {
    count: 5,
    size: 10,
    blending: 0.3
  }
};

/**
 * Interface for world generators
 */
export interface WorldGeneratorInterface {
  /**
   * Get the version of this generator
   */
  readonly version: string;
  
  /**
   * Generate a new world map
   * @returns The generated world map
   */
  generateWorld(): WorldMap;
  
  /**
   * Generate a specific chunk of the world
   * @param chunkX - X coordinate of the chunk
   * @param chunkY - Y coordinate of the chunk
   * @param chunkSize - Size of the chunk
   * @returns Tiles in this chunk
   */
  generateChunk(chunkX: number, chunkY: number, chunkSize: number): any[];
}
