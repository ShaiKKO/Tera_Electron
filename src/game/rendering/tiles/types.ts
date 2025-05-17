/**
 * TerraFlux - Tile Rendering Types
 * 
 * Type definitions for the tile rendering system.
 */

/**
 * Enum for different biome types
 */
export enum BiomeType {
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  TUNDRA = 'tundra',
  WETLAND = 'wetland',
  VOLCANIC = 'volcanic',
  CRYSTAL = 'crystal'
}

/**
 * Enum for different feature types
 */
export enum FeatureType {
  LANDMARK = 'landmark',
  RESOURCE = 'resource',
  HAZARD = 'hazard',
  STRUCTURE = 'structure',
  ANOMALY = 'anomaly',
  SPECIAL = 'special',
  RESOURCE_NODE = 'resource_node',
  ENERGY_SOURCE = 'energy_source',
  ANCIENT_RUIN = 'ancient_ruin'
}

/**
 * Enum for hex directions
 */
export enum HexDirection {
  NORTHEAST = 0,
  EAST = 1,
  SOUTHEAST = 2,
  SOUTHWEST = 3,
  WEST = 4,
  NORTHWEST = 5
}

/**
 * Enum for tile visibility states
 */
export enum VisibilityState {
  HIDDEN = 'hidden',
  DISCOVERED = 'discovered',
  EXPLORED = 'explored',
  VISIBLE = 'visible',
  FOGGY = 'foggy',
  UNEXPLORED = 'unexplored'
}

/**
 * Enum for tile selection types
 */
export enum SelectionType {
  NONE = 'none',
  PRIMARY = 'primary',
  PATH = 'path',
  HOVER = 'hover',
  TARGET = 'target',
  RANGE = 'range',
  AFFECTED = 'affected',
  SELECTED = 'selected',
  HIGHLIGHTED = 'highlighted',
  TARGETABLE = 'targetable',
  INVALID = 'invalid'
}

/**
 * Interface for resource nodes on tiles
 */
export interface ResourceNode {
  type: string;
  amount: number;
  quality: number;
  visible: boolean;
  position: { x: number; y: number };
  extractionProgress?: number;
  harvestable?: boolean;
}

/**
 * Visual definitions for each biome type
 */
export const BIOME_VISUALS = {
  [BiomeType.FOREST]: {
    color: 0x2b803e,
    overlayColor: 0x4dbe60,
    baseColor: 0x2b803e,
    highlightColor: 0x4dbe60,
    hoverColor: 0x5fd178,
    texture: 'forest',
    decorations: ['tree', 'bush', 'flowers'],
    decorationDensity: 0.7
  },
  [BiomeType.MOUNTAIN]: {
    color: 0x7a7a7a,
    overlayColor: 0x9b9b9b,
    baseColor: 0x7a7a7a,
    highlightColor: 0x9b9b9b,
    hoverColor: 0xb8b8b8,
    texture: 'mountain',
    decorations: ['rocks', 'peak', 'cliff'],
    decorationDensity: 0.5
  },
  [BiomeType.DESERT]: {
    color: 0xe5c271,
    overlayColor: 0xf0d696,
    baseColor: 0xe5c271,
    highlightColor: 0xf0d696,
    hoverColor: 0xffe9b7,
    texture: 'desert',
    decorations: ['cactus', 'dune', 'rocks'],
    decorationDensity: 0.3
  },
  [BiomeType.TUNDRA]: {
    color: 0xd0e5f2,
    overlayColor: 0xe8f4fc,
    baseColor: 0xd0e5f2,
    highlightColor: 0xe8f4fc,
    hoverColor: 0xf5fdff,
    texture: 'tundra',
    decorations: ['snowdrift', 'ice', 'frost'],
    decorationDensity: 0.4
  },
  [BiomeType.WETLAND]: {
    color: 0x42734a,
    overlayColor: 0x5b9b66,
    baseColor: 0x42734a,
    highlightColor: 0x5b9b66,
    hoverColor: 0x75c483,
    texture: 'wetland',
    decorations: ['reeds', 'roots', 'puddle'],
    decorationDensity: 0.8
  },
  [BiomeType.VOLCANIC]: {
    color: 0x813129,
    overlayColor: 0xb3453a,
    baseColor: 0x813129,
    highlightColor: 0xb3453a,
    hoverColor: 0xd55649,
    texture: 'volcanic',
    decorations: ['magma', 'ash', 'smoke'],
    decorationDensity: 0.6
  },
  [BiomeType.CRYSTAL]: {
    color: 0x9c59b3,
    overlayColor: 0xc27ed3,
    baseColor: 0x9c59b3,
    highlightColor: 0xc27ed3,
    hoverColor: 0xdaa0e8,
    texture: 'crystal',
    decorations: ['crystal', 'glow', 'shard'],
    decorationDensity: 0.5
  }
};

/**
 * Extended feature types for all biomes
 */
export const EXTENDED_FEATURE_TYPES = {
  FOREST: {
    LANDMARK: ['ancient_tree', 'crystal_grove', 'emerald_waterfall'],
    RESOURCE: ['hardwood_grove', 'medicinal_herb_patch', 'fruit_trees'],
    HAZARD: ['toxic_mushroom_cluster', 'carnivorous_plants', 'energy_distortion'],
    STRUCTURE: ['abandoned_druid_hut', 'energy_conduit', 'ancient_shrine']
  },
  MOUNTAIN: {
    LANDMARK: ['mountain_peak', 'ancient_statue', 'floating_rock_formation'],
    RESOURCE: ['ore_vein', 'crystal_deposit', 'energy_spring'],
    HAZARD: ['unstable_cliff', 'energy_storm_nexus', 'gravity_anomaly'],
    STRUCTURE: ['mountain_observatory', 'abandoned_mine', 'power_amplifier']
  },
  DESERT: {
    LANDMARK: ['giant_dune', 'mirage_oasis', 'ancient_column'],
    RESOURCE: ['sun_crystal_deposit', 'rare_cactus_grove', 'subterranean_water'],
    HAZARD: ['sand_vortex', 'quicksand_pit', 'sunburn_anomaly'],
    STRUCTURE: ['buried_ruins', 'sun_altar', 'nomadic_settlement']
  },
  TUNDRA: {
    LANDMARK: ['ice_spires', 'aurora_nexus', 'frozen_waterfall'],
    RESOURCE: ['pristine_ice_deposit', 'frost_crystal_grove', 'thermal_spring'],
    HAZARD: ['freezing_wind_tunnel', 'thin_ice', 'temporal_frost'],
    STRUCTURE: ['ice_fortress', 'cryo_research_station', 'ancient_ice_tomb']
  },
  WETLAND: {
    LANDMARK: ['massive_mangrove', 'living_island', 'glowing_marsh'],
    RESOURCE: ['alchemical_fungus', 'bioluminescent_plants', 'medicinal_water'],
    HAZARD: ['poison_mist', 'energy_sink', 'quickmud_pit'],
    STRUCTURE: ['stilted_village', 'submerged_ruin', 'moss_covered_monument']
  },
  VOLCANIC: {
    LANDMARK: ['active_volcano', 'magma_waterfall', 'obsidian_formation'],
    RESOURCE: ['fire_crystal_deposit', 'thermal_energy_vent', 'heat_resistant_flora'],
    HAZARD: ['lava_geyser', 'ash_storm', 'energy_overload'],
    STRUCTURE: ['forge_temple', 'obsidian_monolith', 'salamander_settlement']
  },
  CRYSTAL: {
    LANDMARK: ['crystal_cathedral', 'resonance_spire', 'energy_nexus'],
    RESOURCE: ['pure_crystal_formation', 'energy_condensate', 'harmonic_mineral'],
    HAZARD: ['reality_fracture', 'crystal_radiation', 'dimensional_flux'],
    STRUCTURE: ['crystal_laboratory', 'energetic_observatory', 'reality_anchor']
  }
};
