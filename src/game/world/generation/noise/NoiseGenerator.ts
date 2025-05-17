/**
 * TerraFlux - Noise Generator
 * 
 * Provides deterministic noise generation functions for procedural
 * world generation with a focus on creating crystalline, faceted terrain
 * appropriate for TerraFlux's distinctive aesthetic.
 * 
 * This enhanced version uses proper Simplex noise with additional
 * crystalline pattern generators.
 */

import { SeededRandom } from '../SeededRandom';
import { SimplexNoise } from './SimplexNoise';

/**
 * Options for noise generation
 */
export interface NoiseOptions {
  scale: number;           // Scale of the noise (lower = larger features)
  octaves: number;         // Number of noise layers (more = more detail)
  persistence: number;     // How much each octave contributes (0-1)
  lacunarity?: number;     // How frequency increases with octaves (default 2.0)
  crystalline?: number;    // How much crystalline pattern to use (0-1)
}

/**
 * Options specific to elevation noise
 */
export interface ElevationNoiseOptions extends NoiseOptions {
  mountainBias?: number;   // Bias towards creating mountain ranges (0-1)
  ridgeFactor?: number;    // How much ridge-like features to create (0-1)
  plateauFactor?: number;  // Creates flat areas at certain heights (0-1)
}

/**
 * Options specific to moisture noise
 */
export interface MoistureNoiseOptions extends NoiseOptions {
  riverInfluence?: number; // How much rivers affect moisture levels (0-1)
  flowDirection?: number;  // Direction bias for river flow (0-360)
}

/**
 * Options specific to temperature noise
 */
export interface TemperatureNoiseOptions extends NoiseOptions {
  latitudeFactor?: number; // How latitude affects temperature (0-1)
  elevationFactor?: number;// How elevation affects temperature (0-1)
  elevationData?: (q: number, r: number) => number; // Function to get elevation
}

/**
 * Options for energy flow (river) generation
 */
export interface EnergyFlowOptions {
  scale: number;           // Scale of flow features
  intensity: number;       // Flow strength (0-1)
  branchProbability: number;// Chance of creating branches (0-1)
  crystalline: number;     // How crystalline flows appear (0-1) 
}

/**
 * Class providing deterministic noise generation functions
 */
export class NoiseGenerator {
  private _random: SeededRandom;
  private _simplexNoise: SimplexNoise;
  
  // Cache for noise values to improve performance
  private _elevationCache: Map<string, number> = new Map();
  private _moistureCache: Map<string, number> = new Map();
  private _temperatureCache: Map<string, number> = new Map();
  
  /**
   * Constructor
   * @param seed - Seed for noise generation
   */
  constructor(seed: number) {
    // Initialize both our random generators
    this._random = new SeededRandom(seed);
    this._simplexNoise = new SimplexNoise(seed);
  }
  
  /**
   * Get a derived noise generator using a salt value
   * @param salt - Salt value to create a derived but deterministic generator
   * @returns A new noise generator with a derived seed
   */
  public derive(salt: number | string): NoiseGenerator {
    return new NoiseGenerator(
      typeof salt === 'string'
        ? this._hashString(salt)
        : (this._random['_state'] * 31 + salt) % 2147483647
    );
  }
  
  /**
   * Hash a string to a number
   * @param str - String to hash
   * @returns Hash value
   */
  private _hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Generate elevation noise
   * @param q - Q coordinate in hex grid
   * @param r - R coordinate in hex grid
   * @param options - Noise generation options
   * @returns Elevation value (0-1)
   */
  public elevation(q: number, r: number, options: ElevationNoiseOptions): number {
    // Check cache first for performance
    const key = `${q},${r}`;
    if (this._elevationCache.has(key)) {
      return this._elevationCache.get(key)!;
    }
    
    const { 
      scale, 
      octaves, 
      persistence, 
      lacunarity = 2.0,
      mountainBias = 0,
      ridgeFactor = 0,
      plateauFactor = 0,
      crystalline = 0.3 // Default to slight crystalline appearance
    } = options;
    
    // Generate base noise using FBM with possible crystalline influence
    let value = this._simplexNoise.fbm2D(
      q, r, octaves, persistence, lacunarity, crystalline
    );
    
    // Normalize from -1,1 to 0,1 range
    value = (value + 1) * 0.5;
    
    // Apply mountain bias if specified
    if (mountainBias > 0) {
      // Create areas of higher elevation for mountain ranges
      const mountainNoise = this._simplexNoise.fbm2D(
        q + 500, r + 500, Math.max(1, octaves - 1), 
        persistence, lacunarity, crystalline * 1.5
      );
      
      const mountainValue = (mountainNoise + 1) * 0.5;
      
      // Apply mountain bias where mountain noise is high
      if (mountainValue > 0.65) {
        value = value * (1 - mountainBias) + mountainValue * mountainBias;
      }
    }
    
    // Apply ridge effect for crystalline mountain ranges if specified
    if (ridgeFactor > 0) {
      const ridgeNoise = this._simplexNoise.ridgeNoise2D(q + 1000, r + 1000, 0.5);
      
      // Only apply ridge effect to already high areas
      if (value > 0.6) {
        const ridgeInfluence = ridgeFactor * (value - 0.6) / 0.4; // Scale by height
        value = value * (1 - ridgeInfluence) + ridgeNoise * ridgeInfluence;
      }
    }
    
    // Create plateau effect for crystalline areas
    if (plateauFactor > 0) {
      // Round values to create steps/plateaus
      const steps = 10;
      const steppedValue = Math.round(value * steps) / steps;
      
      // Apply plateau factor
      value = value * (1 - plateauFactor) + steppedValue * plateauFactor;
    }
    
    // Clamp result to 0-1 range
    value = Math.min(1, Math.max(0, value));
    
    // Cache the result
    this._elevationCache.set(key, value);
    
    return value;
  }
  
  /**
   * Generate moisture noise
   * @param q - Q coordinate in hex grid
   * @param r - R coordinate in hex grid
   * @param options - Noise generation options
   * @returns Moisture value (0-1)
   */
  public moisture(q: number, r: number, options: MoistureNoiseOptions): number {
    // Check cache first for performance
    const key = `${q},${r}`;
    if (this._moistureCache.has(key)) {
      return this._moistureCache.get(key)!;
    }
    
    const { 
      scale, 
      octaves, 
      persistence, 
      lacunarity = 2.0,
      riverInfluence = 0.5,
      flowDirection = 0,
      crystalline = 0.2 // Slight crystalline appearance for moisture
    } = options;
    
    // Generate base noise with a different offset to make it independent from elevation
    // Use lower crystalline value for moisture as it should be more smooth/natural
    let value = this._simplexNoise.fbm2D(
      q + 1000, r + 1000, octaves, persistence, lacunarity, crystalline
    );
    
    // Normalize to 0-1 range
    value = (value + 1) * 0.5;
    
    // Apply river influence if specified
    if (riverInfluence > 0) {
      // Calculate flow angle based on direction
      const flowRad = (flowDirection * Math.PI) / 180;
      const qOffset = Math.cos(flowRad) * 1500;
      const rOffset = Math.sin(flowRad) * 1500;
      
      const riverNoise = this._simplexNoise.fbm2D(
        q + qOffset, r + rOffset,
        Math.max(1, octaves - 1), persistence, lacunarity, crystalline * 0.5
      );
      
      // Normalize to 0-1
      const riverValue = (riverNoise + 1) * 0.5;
      
      // Create energy flow channels - in TerraFlux these are crystalline energy flows rather than water
      if (riverValue < 0.3) {
        // Increase moisture near energy flows
        // Use 1-riverValue to make lower values higher moisture
        const flowIntensity = 1 - (riverValue / 0.3);
        value = value * (1 - riverInfluence) + flowIntensity * riverInfluence;
      }
    }
    
    // Clamp result
    value = Math.min(1, Math.max(0, value));
    
    // Cache the result
    this._moistureCache.set(key, value);
    
    return value;
  }
  
  /**
   * Generate temperature noise
   * @param q - Q coordinate in hex grid
   * @param r - R coordinate in hex grid
   * @param options - Noise generation options
   * @returns Temperature value (0-1)
   */
  public temperature(q: number, r: number, options: TemperatureNoiseOptions): number {
    // Check cache first for performance
    const key = `${q},${r}`;
    if (this._temperatureCache.has(key)) {
      return this._temperatureCache.get(key)!;
    }
    
    const { 
      scale, 
      octaves, 
      persistence, 
      lacunarity = 2.0,
      latitudeFactor = 0.5,
      elevationFactor = 0.3,
      elevationData,
      crystalline = 0.1 // Minimal crystalline appearance for temperature
    } = options;
    
    // Generate base temperature noise
    let baseTemp = this._simplexNoise.fbm2D(
      q + 2000, r + 2000, octaves, persistence, lacunarity, crystalline
    );
    
    // Normalize to 0-1 range
    baseTemp = (baseTemp + 1) * 0.5;
    
    // Apply latitude factor (decreasing temperature as you move north or south)
    if (latitudeFactor > 0) {
      // Using r coordinate as latitude
      // Normalize to range -1 to 1 based on world size (assumed to be ~50)
      const normalizedLatitude = r / 50;
      const latitudeTemp = 1 - Math.abs(normalizedLatitude);
      
      // Blend base temperature with latitude-based temperature
      baseTemp = baseTemp * (1 - latitudeFactor) + latitudeTemp * latitudeFactor;
    }
    
    // Apply elevation factor if elevation data is provided
    if (elevationFactor > 0 && elevationData) {
      const elevation = elevationData(q, r);
      
      // Lower temperature at higher elevations
      const elevationTemp = 1 - elevation;
      
      // Blend with elevation influence
      baseTemp = baseTemp * (1 - elevationFactor) + elevationTemp * elevationFactor;
    }
    
    // Clamp result
    baseTemp = Math.min(1, Math.max(0, baseTemp));
    
    // Cache the result
    this._temperatureCache.set(key, baseTemp);
    
    return baseTemp;
  }
  
  /**
   * Generate resource distribution noise
   * @param q - Q coordinate in hex grid
   * @param r - R coordinate in hex grid
   * @param resourceType - Type of resource
   * @param options - Noise generation options
   * @returns Resource density value (0-1)
   */
  public resourceDensity(
    q: number, 
    r: number, 
    resourceType: string,
    options: NoiseOptions & { clusterFactor?: number }
  ): number {
    const { 
      scale, 
      octaves, 
      persistence, 
      lacunarity = 2.0,
      clusterFactor = 0.5,
      crystalline = 0.4 // More crystalline appearance for resources
    } = options;
    
    // Use resource type as salt to get unique but deterministic distribution for each type
    const resourceSeed = this._hashString(resourceType) + this._random['_state'];
    const resourceNoise = new SimplexNoise(resourceSeed);
    
    // Generate base noise using appropriate noise function based on resource type
    // Crystal-like resources should use more crystalline patterns
    const isCrystalType = resourceType.includes('crystal') || 
                          resourceType.includes('gem') ||
                          resourceType.includes('energy');
    
    // Enhance crystalline factor for crystal-type resources
    const resourceCrystalline = isCrystalType ? Math.min(1.0, crystalline * 2) : crystalline;
    
    // Generate base noise
    let value = resourceNoise.fbm2D(
      q + 3000, r + 3000, octaves, persistence, lacunarity, resourceCrystalline
    );
    
    // Normalize to 0-1 range
    value = (value + 1) * 0.5;
    
    // Apply clustering if specified
    if (clusterFactor > 0) {
      const clusterNoise = resourceNoise.fbm2D(
        q + 3500, r + 3500, 
        Math.max(1, octaves - 1), 
        persistence, 
        lacunarity,
        resourceCrystalline
      );
      
      const clusterValue = (clusterNoise + 1) * 0.5;
      
      // If this is a potential cluster center (high values)
      if (clusterValue > 0.7) {
        // Increase resource density in clusters
        value = value * (1 - clusterFactor) + clusterValue * clusterFactor;
      }
    }
    
    // For crystal resources, add additional patterning
    if (isCrystalType) {
      const crystalPattern = this.generateCrystallinePattern(q, r, {
        scale: scale * 2,
        facets: 6 + Math.floor(this._random.next() * 4),
        angularity: 0.7
      });
      
      // Blend with crystal pattern for crystal resources
      value = value * 0.7 + crystalPattern * 0.3;
    }
    
    return Math.min(1, Math.max(0, value));
  }
  
  /**
   * Generate energy flow paths
   * @param startQ - Starting Q coordinate
   * @param startR - Starting R coordinate
   * @param elevationData - Function to get elevation data
   * @param options - Energy flow options
   * @returns Array of coordinate pairs forming the energy flow
   */
  public generateEnergyFlow(
    startQ: number, 
    startR: number,
    elevationData: (q: number, r: number) => number,
    options: EnergyFlowOptions
  ): [number, number][] {
    const { scale, intensity, branchProbability, crystalline } = options;
    const path: [number, number][] = [[startQ, startR]];
    
    // Directions for hex grid (6 directions)
    const directions = [
      [1, 0], [0, 1], [-1, 1],
      [-1, 0], [0, -1], [1, -1]
    ];
    
    // Length of the flow
    const maxLength = Math.floor(10 + intensity * 20);
    
    let currentQ = startQ;
    let currentR = startR;
    let lastDir = -1;
    
    for (let i = 0; i < maxLength; i++) {
      // Determine next direction
      let bestDir = -1;
      let bestScore = -Infinity;
      
      // Check each possible direction
      for (let d = 0; d < directions.length; d++) {
        // Skip reverse direction
        if (lastDir >= 0 && (d === (lastDir + 3) % 6)) continue;
        
        const nextQ = currentQ + directions[d][0];
        const nextR = currentR + directions[d][1];
        
        // Skip if already in path
        if (path.some(p => p[0] === nextQ && p[1] === nextR)) continue;
        
        // Score based on elevation (flows prefer going downhill)
        const currentElevation = elevationData(currentQ, currentR);
        const nextElevation = elevationData(nextQ, nextR);
        
        // Base score - prefer downhill
        let score = currentElevation - nextElevation;
        
        // For crystalline flows, we prefer straight lines with occasional, sharp turns
        if (crystalline > 0) {
          // Prefer continuing in same direction
          if (lastDir >= 0 && d === lastDir) {
            score += crystalline * 0.3;
          }
          
          // Or 60 degree turns (crystalline patterns)
          if (lastDir >= 0 && (d === (lastDir + 1) % 6 || d === (lastDir + 5) % 6)) {
            score += crystalline * 0.15;
          }
        } else {
          // For natural flows, small random variations
          score += this._random.next() * 0.1;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestDir = d;
        }
      }
      
      // If no valid direction, end the flow
      if (bestDir === -1) break;
      
      // Add next point to path
      currentQ += directions[bestDir][0];
      currentR += directions[bestDir][1];
      path.push([currentQ, currentR]);
      lastDir = bestDir;
      
      // Potentially create a branch
      if (this._random.next() < branchProbability && path.length > 3) {
        const branchOptions = {
          ...options,
          intensity: options.intensity * 0.7,
          branchProbability: options.branchProbability * 0.5
        };
        
        // Generate a branch (recursive call)
        const branch = this.generateEnergyFlow(
          currentQ, currentR, elevationData, branchOptions
        );
        
        // Add branch to path, skipping the first point which is duplicate
        path.push(...branch.slice(1));
      }
    }
    
    return path;
  }
  
  /**
   * Generate a crystalline pattern at the specified coordinates
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param options - Pattern generation options
   * @returns Pattern value (0-1)
   */
  public generateCrystallinePattern(q: number, r: number, options: {
    scale: number;
    facets: number;
    angularity: number;
  }): number {
    const { scale, facets, angularity } = options;
    
    // Convert hex coordinates to Cartesian for pattern generation
    const x = q * Math.sqrt(3) * scale;
    const y = (r + q/2) * 1.5 * scale;
    
    // Generate crystalline pattern
    return (this._simplexNoise.crystalNoise2D(x, y, angularity, facets) + 1) * 0.5;
  }
}
