/**
 * TerraFlux - Biome Types
 * 
 * Defines all biome types and their transition relationships
 * for the procedural world generation system.
 */

/**
 * Enum of all possible biome types in TerraFlux
 */
export enum BiomeType {
  // Primary biomes
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  WETLAND = 'wetland',
  VOLCANIC = 'volcanic',
  CRYSTAL_FORMATION = 'crystal_formation',
  
  // Special biomes
  ORIGIN_SITE = 'origin_site',     // Player's starting location
  ENERGY_NEXUS = 'energy_nexus',   // High energy concentration areas
  PRIMAL_SHARD = 'primal_shard',   // Ancient crystal structures
  RUIN = 'ruin',                   // Abandoned structures
  
  // Rare special biomes that only appear under specific conditions
  RESONANCE_FIELD = 'resonance_field', // Appears when multiple energy types converge
  VOID_BREACH = 'void_breach',      // Unstable areas with unique resources
  HARMONIC_SPIRE = 'harmonic_spire', // Natural crystal formations that emit energy
  CONFLUENCE = 'confluence'         // Where multiple biome types meet
}

/**
 * Transition type between biomes
 * These define the visual appearance of transitions between different biomes
 */
export enum BiomeTransitionType {
  NONE = 'none',           // No visible transition
  GRADUAL = 'gradual',     // Smooth, gradual blending
  SHARP = 'sharp',         // Clear, defined boundary
  RIVERINE = 'riverine',   // Separated by a river or energy flow
  RIDGE = 'ridge',         // Mountain-like ridge boundary
  FRACTURE = 'fracture',   // Sharp crystalline boundary
  FADE = 'fade',           // One biome fades into another
  SCATTERED = 'scattered', // Elements of one biome scatter into the other
  PLATEAU = 'plateau',     // Sharp elevation change
  CORRUPTION = 'corruption', // One biome "corrupts" the other
  MELD = 'meld',           // Perfect fusion of both biomes
  DIFFUSE = 'diffuse',     // Patchy, spotty transition
  CRYSTALLINE = 'crystalline', // Crystal formations along boundary
  ENERGY = 'energy',       // Energy flows mark the boundary
  VORTEX = 'vortex'        // Swirling pattern of both biomes
}

/**
 * Defines compatibility and preferred transition types between biomes
 */
export interface BiomeTransitionDefinition {
  sourceType: BiomeType;         // First biome type
  targetType: BiomeType;         // Second biome type
  preferredTransition: BiomeTransitionType; // Default transition type
  compatibilityScore: number;    // How well biomes blend (0-1)
  alternativeTransitions?: BiomeTransitionType[]; // Other possible transitions
}

/**
 * Predefined biome transitions
 * This defines how biomes naturally transition between each other
 */
export const BIOME_TRANSITIONS: BiomeTransitionDefinition[] = [
  // Forest transitions
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.MOUNTAIN,
    preferredTransition: BiomeTransitionType.GRADUAL,
    compatibilityScore: 0.8,
    alternativeTransitions: [BiomeTransitionType.RIDGE, BiomeTransitionType.PLATEAU]
  },
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.DESERT,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.3,
    alternativeTransitions: [BiomeTransitionType.FADE, BiomeTransitionType.SCATTERED]
  },
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.TUNDRA,
    preferredTransition: BiomeTransitionType.GRADUAL,
    compatibilityScore: 0.6,
    alternativeTransitions: [BiomeTransitionType.FADE]
  },
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.WETLAND,
    preferredTransition: BiomeTransitionType.RIVERINE,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.GRADUAL, BiomeTransitionType.DIFFUSE]
  },
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.VOLCANIC,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.2,
    alternativeTransitions: [BiomeTransitionType.CORRUPTION]
  },
  {
    sourceType: BiomeType.FOREST,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.5,
    alternativeTransitions: [BiomeTransitionType.FRACTURE]
  },
  
  // Mountain transitions
  {
    sourceType: BiomeType.MOUNTAIN,
    targetType: BiomeType.DESERT,
    preferredTransition: BiomeTransitionType.PLATEAU,
    compatibilityScore: 0.4,
    alternativeTransitions: [BiomeTransitionType.RIDGE, BiomeTransitionType.SHARP]
  },
  {
    sourceType: BiomeType.MOUNTAIN,
    targetType: BiomeType.TUNDRA,
    preferredTransition: BiomeTransitionType.RIDGE,
    compatibilityScore: 0.8,
    alternativeTransitions: [BiomeTransitionType.PLATEAU]
  },
  {
    sourceType: BiomeType.MOUNTAIN,
    targetType: BiomeType.WETLAND,
    preferredTransition: BiomeTransitionType.PLATEAU,
    compatibilityScore: 0.3,
    alternativeTransitions: [BiomeTransitionType.RIVERINE]
  },
  {
    sourceType: BiomeType.MOUNTAIN,
    targetType: BiomeType.VOLCANIC,
    preferredTransition: BiomeTransitionType.MELD,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.RIDGE, BiomeTransitionType.FRACTURE]
  },
  {
    sourceType: BiomeType.MOUNTAIN,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.9,
    alternativeTransitions: [BiomeTransitionType.FRACTURE, BiomeTransitionType.ENERGY]
  },
  
  // Desert transitions
  {
    sourceType: BiomeType.DESERT,
    targetType: BiomeType.TUNDRA,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.1,
    alternativeTransitions: [BiomeTransitionType.RIDGE]
  },
  {
    sourceType: BiomeType.DESERT,
    targetType: BiomeType.WETLAND,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.2,
    alternativeTransitions: [BiomeTransitionType.RIVERINE]
  },
  {
    sourceType: BiomeType.DESERT,
    targetType: BiomeType.VOLCANIC,
    preferredTransition: BiomeTransitionType.MELD,
    compatibilityScore: 0.6,
    alternativeTransitions: [BiomeTransitionType.GRADUAL]
  },
  {
    sourceType: BiomeType.DESERT,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.ENERGY, BiomeTransitionType.SHARP]
  },
  
  // Tundra transitions
  {
    sourceType: BiomeType.TUNDRA,
    targetType: BiomeType.WETLAND,
    preferredTransition: BiomeTransitionType.RIVERINE,
    compatibilityScore: 0.3,
    alternativeTransitions: [BiomeTransitionType.SHARP]
  },
  {
    sourceType: BiomeType.TUNDRA,
    targetType: BiomeType.VOLCANIC,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.1,
    alternativeTransitions: [BiomeTransitionType.CORRUPTION]
  },
  {
    sourceType: BiomeType.TUNDRA,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.8,
    alternativeTransitions: [BiomeTransitionType.MELD, BiomeTransitionType.FRACTURE]
  },
  
  // Wetland transitions
  {
    sourceType: BiomeType.WETLAND,
    targetType: BiomeType.VOLCANIC,
    preferredTransition: BiomeTransitionType.RIVERINE,
    compatibilityScore: 0.2,
    alternativeTransitions: [BiomeTransitionType.SHARP]
  },
  {
    sourceType: BiomeType.WETLAND,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.ENERGY,
    compatibilityScore: 0.5,
    alternativeTransitions: [BiomeTransitionType.CRYSTALLINE, BiomeTransitionType.RIVERINE]
  },
  
  // Volcanic transitions
  {
    sourceType: BiomeType.VOLCANIC,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.FRACTURE,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.CRYSTALLINE, BiomeTransitionType.ENERGY]
  },
  
  // Special biome transitions
  {
    sourceType: BiomeType.ORIGIN_SITE,
    targetType: BiomeType.FOREST,
    preferredTransition: BiomeTransitionType.GRADUAL,
    compatibilityScore: 0.8,
    alternativeTransitions: [BiomeTransitionType.ENERGY]
  },
  {
    sourceType: BiomeType.ORIGIN_SITE,
    targetType: BiomeType.MOUNTAIN,
    preferredTransition: BiomeTransitionType.RIDGE,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.PLATEAU]
  },
  {
    sourceType: BiomeType.ORIGIN_SITE,
    targetType: BiomeType.DESERT,
    preferredTransition: BiomeTransitionType.GRADUAL,
    compatibilityScore: 0.5,
    alternativeTransitions: [BiomeTransitionType.SHARP]
  },
  {
    sourceType: BiomeType.ENERGY_NEXUS,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.ENERGY,
    compatibilityScore: 0.9,
    alternativeTransitions: [BiomeTransitionType.MELD, BiomeTransitionType.CRYSTALLINE]
  },
  {
    sourceType: BiomeType.PRIMAL_SHARD,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.9,
    alternativeTransitions: [BiomeTransitionType.ENERGY]
  },
  {
    sourceType: BiomeType.RUIN,
    targetType: BiomeType.DESERT,
    preferredTransition: BiomeTransitionType.SCATTERED,
    compatibilityScore: 0.8,
    alternativeTransitions: [BiomeTransitionType.FADE]
  },
  
  // Rare biome transitions
  {
    sourceType: BiomeType.RESONANCE_FIELD,
    targetType: BiomeType.ENERGY_NEXUS,
    preferredTransition: BiomeTransitionType.ENERGY,
    compatibilityScore: 0.9,
    alternativeTransitions: [BiomeTransitionType.VORTEX]
  },
  {
    sourceType: BiomeType.VOID_BREACH,
    targetType: BiomeType.CRYSTAL_FORMATION,
    preferredTransition: BiomeTransitionType.FRACTURE,
    compatibilityScore: 0.4,
    alternativeTransitions: [BiomeTransitionType.CORRUPTION]
  },
  {
    sourceType: BiomeType.HARMONIC_SPIRE,
    targetType: BiomeType.MOUNTAIN,
    preferredTransition: BiomeTransitionType.CRYSTALLINE,
    compatibilityScore: 0.7,
    alternativeTransitions: [BiomeTransitionType.RIDGE]
  },
  {
    sourceType: BiomeType.CONFLUENCE,
    targetType: BiomeType.WETLAND,
    preferredTransition: BiomeTransitionType.RIVERINE,
    compatibilityScore: 0.6,
    alternativeTransitions: [BiomeTransitionType.VORTEX, BiomeTransitionType.DIFFUSE]
  }
];

/**
 * Get the transition definition between two biome types
 * @param source - Source biome type
 * @param target - Target biome type
 * @returns The transition definition or undefined if not found
 */
export function getBiomeTransition(source: BiomeType, target: BiomeType): BiomeTransitionDefinition | undefined {
  // Try to find direct transition
  const transition = BIOME_TRANSITIONS.find(t => 
    (t.sourceType === source && t.targetType === target) ||
    (t.sourceType === target && t.targetType === source)
  );
  
  if (transition) {
    // If found but reversed, swap source and target for correct direction
    if (transition.sourceType === target && transition.targetType === source) {
      return {
        sourceType: source,
        targetType: target,
        preferredTransition: transition.preferredTransition,
        compatibilityScore: transition.compatibilityScore,
        alternativeTransitions: transition.alternativeTransitions
      };
    }
    return transition;
  }
  
  // Default fallback if no specific transition is defined
  return {
    sourceType: source,
    targetType: target,
    preferredTransition: BiomeTransitionType.SHARP,
    compatibilityScore: 0.3,
    alternativeTransitions: [BiomeTransitionType.GRADUAL]
  };
}
