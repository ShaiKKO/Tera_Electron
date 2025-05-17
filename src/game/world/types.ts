/**
 * TerraFlux - World Types
 * 
 * Type definitions for the world system, including maps, tiles,
 * biomes, features, etc.
 */

import { BiomeType, FeatureType } from '../rendering/tiles/types';

/**
 * Interface for a world map
 */
export interface WorldMap {
  id: string;              // Unique ID for the world
  name: string;            // Name of the world
  seed: number;            // Seed used to generate the world
  timestamp: number;       // When the world was created
  version: string;         // Version of the world generation used
  size: number;            // Radius of the world in tiles
  biomeDistribution: Record<BiomeType, number>;  // Distribution of biomes
  tiles: WorldTile[];      // All tiles in the world
  playerTileQ: number;     // Player's current Q coordinate
  playerTileR: number;     // Player's current R coordinate
  exploredTileCount: number; // Number of explored tiles
}

/**
 * Interface for a world tile
 */
export interface WorldTile {
  q: number;               // Q coordinate in axial system
  r: number;               // R coordinate in axial system
  biomeType: BiomeType;    // Type of biome
  variation: number;       // Variation index (0-4) of the biome
  elevation: number;       // Elevation value (0-1)
  moisture: number;        // Moisture value (0-1)
  temperature: number;     // Temperature value (0-1)
  features: WorldFeature[]; // Features on this tile
  resources: WorldResource[]; // Resources on this tile
  discovered: boolean;     // Whether this tile has been discovered
  explored: boolean;       // Whether this tile has been explored
  visibility: number;      // Visibility level (0-1)
}

/**
 * Interface for a world feature
 */
export interface WorldFeature {
  type: FeatureType;       // Type of feature
  subType: string;         // Specific subtype
  name: string;            // Name of the feature
  description: string;     // Description of the feature
  discovered: boolean;     // Whether this feature has been discovered
  interactable: boolean;   // Whether this feature can be interacted with
  data?: any;              // Additional data for the feature
}

/**
 * Interface for a world resource
 */
export interface WorldResource {
  type: string;            // Type of resource
  amount: number;          // Amount of resource available
  quality: number;         // Quality of the resource (0-2, where 2 is highest)
  discovered: boolean;     // Whether this resource has been discovered
  extractable: boolean;    // Whether this resource can be extracted
  data?: any;              // Additional data for the resource
}

/**
 * Interface for a world region
 */
export interface WorldRegion {
  centerQ: number;         // Center Q coordinate
  centerR: number;         // Center R coordinate
  radius: number;          // Radius of the region
  biasType: BiomeType;     // Biome type this region biases towards
}

/**
 * Interface for resource distribution
 */
export interface ResourceDistribution {
  common: string[];        // List of common resource types
  uncommon: string[];      // List of uncommon resource types
  rare: string[];          // List of rare resource types
  commonChance: number;    // Chance of finding common resources
  uncommonChance: number;  // Chance of finding uncommon resources
  rareChance: number;      // Chance of finding rare resources
}

/**
 * Interface for a biome variation
 */
export interface BiomeVariation {
  id: string;              // ID of the variation
  name: string;            // Name of the variation
  description: string;     // Description of the variation
  textureModifier: string; // Modifier for the texture name
  specialProperties: {     // Special properties for this variation
    resourceMultiplier?: number; // Multiplier for resource generation
    energyMultiplier?: number;   // Multiplier for energy effects
    movementModifier?: number;   // Modifier for movement speed
    discoveryChance?: number;    // Modifier for discovery chance
    hazardLevel?: number;        // Level of environmental hazards
  };
}

/**
 * Energy pattern types
 */
export enum EnergyPatternType {
  LINEAR = 'linear',
  SPIRAL = 'spiral',
  ZIGZAG = 'zigzag',
  PULSING = 'pulsing',
  GEOMETRIC = 'geometric'
}

/**
 * Interface for energy pattern definitions
 */
export interface EnergyPatternDefinition {
  type: EnergyPatternType; // Type of pattern
  color: number;           // Color in hex format
  speed: number;           // Animation speed
  width: number;           // Line width
  alpha: number;           // Transparency
}

/**
 * Interface for a energy pulse
 */
export interface EnergyPulse {
  color: number;           // Color in hex format
  frequency: number;       // Pulse frequency
  intensity: number;       // Pulse intensity
  pattern: EnergyPatternType; // Pattern type
}

/**
 * Valid hover element shapes
 */
export type HoverElementShape = 'irregular' | 'triangle' | 'rectangle' | 'pentagon' | 'hexagon' | 'diamond';

/**
 * Interface for hovering element definitions
 */
export interface HoverElementDefinition {
  shape: HoverElementShape; // Shape of the element
  size: number;            // Size of the element
  color: number;           // Color in hex format
  alpha: number;           // Transparency
  hoverHeight: number;     // Height above the tile
  rotationSpeed: number;   // Rotation speed
  oscillationRange: number; // Range of vertical oscillation
  oscillationSpeed: number; // Speed of oscillation
  energyPulse?: EnergyPulse; // Optional energy pulse effect
}

/**
 * Interface for enhanced biome definitions
 */
export interface EnhancedBiomeDefinition {
  type: BiomeType;         // Type of biome
  primaryEnergyColor: number; // Primary energy color
  secondaryEnergyColor: number; // Secondary energy color
  variations: BiomeVariation[]; // Variations of this biome
  hoveringElements: HoverElementDefinition[]; // Hovering elements
  energyPatterns: EnergyPatternDefinition[]; // Energy patterns
  baseTexturePath: string; // Base path for textures
  specialFeatures: string[]; // Special features unique to this biome
  resourceDistribution: ResourceDistribution; // Resource distribution
}
