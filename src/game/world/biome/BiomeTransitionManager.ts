/**
 * TerraFlux - Biome Transition Manager
 * 
 * Handles the multi-biome influence system, allowing tiles to blend between
 * multiple biomes with percentage-based influence and proper transitions.
 * This supports the detailed transition system specified in the TerraFlux design,
 * allowing up to 3 biomes to influence a single tile.
 */

import { BiomeType, BiomeTransitionType, getBiomeTransition } from './BiomeTypes';

/**
 * Direction enum for hex grid
 * These represent the six directions from a hex tile
 */
export enum HexDirection {
  NORTH = 0,
  NORTHEAST = 1,
  SOUTHEAST = 2,
  SOUTH = 3,
  SOUTHWEST = 4,
  NORTHWEST = 5
}

/**
 * A map of directional opposites
 */
const OPPOSITE_DIRECTION = {
  [HexDirection.NORTH]: HexDirection.SOUTH,
  [HexDirection.NORTHEAST]: HexDirection.SOUTHWEST,
  [HexDirection.SOUTHEAST]: HexDirection.NORTHWEST,
  [HexDirection.SOUTH]: HexDirection.NORTH,
  [HexDirection.SOUTHWEST]: HexDirection.NORTHEAST,
  [HexDirection.NORTHWEST]: HexDirection.SOUTHEAST
};

/**
 * Interface representing a biome influence on a tile
 */
export interface BiomeInfluence {
  biomeType: BiomeType;
  influence: number; // 0-1 value representing influence percentage
}

/**
 * Interface representing a transition to a neighboring tile
 */
export interface BiomeTransition {
  direction: HexDirection;
  transitionType: BiomeTransitionType;
  neighborBiome: BiomeType;
  blendFactor: number; // 0-1 value representing how much to blend at this edge
}

/**
 * Interface representing a tile's complete biome data
 */
export interface TileBiomeData {
  primaryBiome: BiomeType;
  secondaryBiome?: BiomeType;
  tertiaryBiome?: BiomeType;
  biomeInfluences: BiomeInfluence[];
  transitions: BiomeTransition[];
}

/**
 * Class to manage biome transitions and multi-biome influences
 */
export class BiomeTransitionManager {
  private static readonly MAX_BIOME_INFLUENCES = 3; // Maximum number of biomes that can influence a tile
  
  /**
   * Calculate biome influences for a tile based on surrounding biomes
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param getBiomeAt - Function to get biome at a specific coordinate
   * @returns Biome influences at this tile
   */
  public calculateBiomeInfluences(
    q: number, 
    r: number,
    getBiomeAt: (q: number, r: number) => BiomeType
  ): BiomeInfluence[] {
    // Get the biome of the current tile
    const centerBiome = getBiomeAt(q, r);
    
    // Get surrounding biomes
    const neighbors = this.getNeighborBiomes(q, r, getBiomeAt);
    
    // Count occurrences of each biome type
    const biomeCounts = new Map<BiomeType, number>();
    biomeCounts.set(centerBiome, 1); // Start with center biome
    
    // Add neighbor biomes
    for (const neighborBiome of Object.values(neighbors)) {
      const count = biomeCounts.get(neighborBiome) || 0;
      biomeCounts.set(neighborBiome, count + 1);
    }
    
    // Convert to influences
    let influences: BiomeInfluence[] = Array.from(biomeCounts.entries()).map(([biomeType, count]) => ({
      biomeType,
      influence: count / 7 // 7 = center + 6 neighbors
    }));
    
    // Sort by influence percentage
    influences.sort((a, b) => b.influence - a.influence);
    
    // Limit to MAX_BIOME_INFLUENCES
    influences = influences.slice(0, BiomeTransitionManager.MAX_BIOME_INFLUENCES);
    
    // Normalize influence values to sum to 1.0
    const totalInfluence = influences.reduce((sum, inf) => sum + inf.influence, 0);
    influences = influences.map(inf => ({
      biomeType: inf.biomeType,
      influence: inf.influence / totalInfluence
    }));
    
    return influences;
  }
  
  /**
   * Calculate transitions for each direction from this tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param biomeInfluences - The biome influences for this tile
   * @param getBiomeAt - Function to get biome at a specific coordinate
   * @returns Array of transitions for this tile
   */
  public calculateTransitions(
    q: number, 
    r: number,
    biomeInfluences: BiomeInfluence[],
    getBiomeAt: (q: number, r: number) => BiomeType
  ): BiomeTransition[] {
    const transitions: BiomeTransition[] = [];
    
    // No transitions if only one biome
    if (biomeInfluences.length <= 1) {
      return [];
    }
    
    // Primary biome is the one with highest influence
    const primaryBiome = biomeInfluences[0].biomeType;
    
    // Get neighbor coordinates and biomes
    const neighbors = this.getNeighborBiomes(q, r, getBiomeAt);
    const neighborCoords = this.getNeighborCoordinates(q, r);
    
    // For each direction
    for (let dir = 0; dir < 6; dir++) {
      const direction = dir as HexDirection;
      const neighborBiome = neighbors[direction];
      
      // Get neighbor's biome influences
      const neighborQ = neighborCoords[direction][0];
      const neighborR = neighborCoords[direction][1];
      const neighborInfluences = this.calculateBiomeInfluences(neighborQ, neighborR, getBiomeAt);
      
      // If neighbor has a different primary biome, calculate transition
      if (neighborInfluences.length > 0 && neighborInfluences[0].biomeType !== primaryBiome) {
        // Get transition definition for these two biomes
        const transition = getBiomeTransition(primaryBiome, neighborInfluences[0].biomeType);
        
        // Calculate blend factor based on compatibility and influence percentages
        const myInfluenceAtBoundary = biomeInfluences[0].influence * 0.7 + 
                                     (biomeInfluences[1]?.influence || 0) * 0.3;
        const neighborInfluenceAtBoundary = neighborInfluences[0].influence * 0.7 +
                                           (neighborInfluences[1]?.influence || 0) * 0.3;
        
        // Higher blend factor = more smooth transition
        let blendFactor = (transition?.compatibilityScore || 0.3) * 
                          (1 - Math.abs(myInfluenceAtBoundary - neighborInfluenceAtBoundary));
        
        // Special case: if multiple biomes meet at this point, potential for confluence
        const isConfluence = biomeInfluences.length >= 3 && 
                             neighborInfluences.length >= 2 && 
                             biomeInfluences[2].influence > 0.15;
                             
        if (isConfluence) {
          // Create a more complex transition for areas where multiple biomes meet
          transitions.push({
            direction,
            transitionType: BiomeTransitionType.VORTEX,
            neighborBiome: neighborBiome,
            blendFactor: Math.min(1.0, blendFactor * 1.5)
          });
        } else {
          // Create standard transition
          transitions.push({
            direction,
            transitionType: transition?.preferredTransition || BiomeTransitionType.SHARP,
            neighborBiome: neighborBiome,
            blendFactor
          });
        }
      }
    }
    
    return transitions;
  }
  
  /**
   * Get complete biome data for a tile
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param getBiomeAt - Function to get biome at a specific coordinate
   * @returns Complete biome data for this tile
   */
  public getTileBiomeData(
    q: number, 
    r: number,
    getBiomeAt: (q: number, r: number) => BiomeType
  ): TileBiomeData {
    // Calculate biome influences
    const influences = this.calculateBiomeInfluences(q, r, getBiomeAt);
    
    // Calculate transitions to neighboring tiles
    const transitions = this.calculateTransitions(q, r, influences, getBiomeAt);
    
    // Create result object
    return {
      primaryBiome: influences[0].biomeType,
      secondaryBiome: influences.length > 1 ? influences[1].biomeType : undefined,
      tertiaryBiome: influences.length > 2 ? influences[2].biomeType : undefined,
      biomeInfluences: influences,
      transitions
    };
  }
  
  /**
   * Generate a special biome based on surrounding conditions
   * This function handles the emergence of special biomes when conditions are right
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param getBiomeAt - Function to get biome at a specific coordinate
   * @param elevation - Elevation value at this coordinate (0-1)
   * @param moisture - Moisture value at this coordinate (0-1)
   * @param temperature - Temperature value at this coordinate (0-1)
   * @returns The possibly emergent special biome, or undefined if none
   */
  public determineSpecialBiome(
    q: number,
    r: number,
    getBiomeAt: (q: number, r: number) => BiomeType,
    elevation: number,
    moisture: number,
    temperature: number
  ): BiomeType | undefined {
    // Get surrounding biomes
    const neighbors = this.getNeighborBiomes(q, r, getBiomeAt);
    
    // Count distinct biomes
    const distinctBiomes = new Set<BiomeType>(Object.values(neighbors));
    distinctBiomes.add(getBiomeAt(q, r));
    
    // Check for CONFLUENCE - multiple biomes meeting
    if (distinctBiomes.size >= 4) {
      return BiomeType.CONFLUENCE;
    }
    
    // Check for ENERGY_NEXUS - high elevation, low moisture
    if (elevation > 0.8 && moisture < 0.3 && temperature > 0.6) {
      return BiomeType.ENERGY_NEXUS;
    }
    
    // Check for HARMONIC_SPIRE - very high elevation crystal formations
    if (elevation > 0.9 && distinctBiomes.has(BiomeType.CRYSTAL_FORMATION)) {
      return BiomeType.HARMONIC_SPIRE;
    }
    
    // Check for RESONANCE_FIELD - crystal formation near energy nexus
    const hasCrystal = distinctBiomes.has(BiomeType.CRYSTAL_FORMATION);
    const hasEnergyNexus = distinctBiomes.has(BiomeType.ENERGY_NEXUS);
    
    if (hasCrystal && hasEnergyNexus) {
      return BiomeType.RESONANCE_FIELD;
    }
    
    // Check for VOID_BREACH - rare, extreme conditions
    if (elevation < 0.2 && temperature > 0.9 && moisture < 0.1) {
      // Very rare occurrence
      const randomFactor = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
      const rareChance = (randomFactor - Math.floor(randomFactor));
      
      if (rareChance > 0.99) { // 1% chance
        return BiomeType.VOID_BREACH;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get the biomes of neighboring tiles
   * @param q - Q coordinate
   * @param r - R coordinate
   * @param getBiomeAt - Function to get biome at a specific coordinate
   * @returns Object with biomes in each direction
   */
  private getNeighborBiomes(
    q: number, 
    r: number,
    getBiomeAt: (q: number, r: number) => BiomeType
  ): Record<HexDirection, BiomeType> {
    const neighborCoords = this.getNeighborCoordinates(q, r);
    const result: Partial<Record<HexDirection, BiomeType>> = {};
    
    for (let dir = 0; dir < 6; dir++) {
      const [nq, nr] = neighborCoords[dir as HexDirection];
      result[dir as HexDirection] = getBiomeAt(nq, nr);
    }
    
    return result as Record<HexDirection, BiomeType>;
  }
  
  /**
   * Get the coordinates of neighboring tiles
   * @param q - Q coordinate
   * @param r - R coordinate
   * @returns Object with coordinates in each direction
   */
  private getNeighborCoordinates(q: number, r: number): Record<HexDirection, [number, number]> {
    // Axial coordinate directions for a hex grid
    return {
      [HexDirection.NORTH]: [q, r - 1],
      [HexDirection.NORTHEAST]: [q + 1, r - 1],
      [HexDirection.SOUTHEAST]: [q + 1, r],
      [HexDirection.SOUTH]: [q, r + 1],
      [HexDirection.SOUTHWEST]: [q - 1, r + 1],
      [HexDirection.NORTHWEST]: [q - 1, r]
    };
  }
}
