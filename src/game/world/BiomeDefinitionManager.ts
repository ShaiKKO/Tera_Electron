/**
 * TerraFlux - Biome Definition Manager
 * 
 * Manages biome definitions that define the visual and gameplay
 * properties of different biome types in the world.
 */

import { BiomeType } from '../rendering/tiles/types';
import { 
  EnhancedBiomeDefinition, 
  BiomeVariation, 
  HoverElementDefinition, 
  EnergyPatternDefinition, 
  EnergyPatternType,
  ResourceDistribution
} from './types';

/**
 * Class that manages biome definitions
 */
export class BiomeDefinitionManager {
  private _definitions: Map<BiomeType, EnhancedBiomeDefinition>;
  
  /**
   * Constructor
   */
  constructor() {
    this._definitions = new Map();
    this._initializeDefaultDefinitions();
  }
  
  /**
   * Initialize default biome definitions
   */
  private _initializeDefaultDefinitions(): void {
    // Initialize Forest biome
    this._definitions.set(BiomeType.FOREST, {
      type: BiomeType.FOREST,
      primaryEnergyColor: 0x2dff57,
      secondaryEnergyColor: 0x87ff92,
      variations: this._createForestVariations(),
      hoveringElements: this._createForestHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.SPIRAL,
          color: 0x4eff8a,
          speed: 0.5,
          width: 2,
          alpha: 0.7
        },
        {
          type: EnergyPatternType.PULSING,
          color: 0x2d825e,
          speed: 0.3,
          width: 1.5,
          alpha: 0.5
        }
      ],
      baseTexturePath: 'assets/biomes/forest',
      specialFeatures: [
        'ancient_tree',
        'crystal_outcrop',
        'energy_node'
      ],
      resourceDistribution: {
        common: ['wood', 'medicinal_herbs', 'fruit'],
        uncommon: ['hardwood', 'rare_herbs', 'resin'],
        rare: ['crystal_sap', 'ancient_seed', 'living_wood'],
        commonChance: 0.7,
        uncommonChance: 0.25,
        rareChance: 0.05
      }
    });
    
    // Initialize Mountain biome
    this._definitions.set(BiomeType.MOUNTAIN, {
      type: BiomeType.MOUNTAIN,
      primaryEnergyColor: 0x3a7fff,
      secondaryEnergyColor: 0x73b0ff,
      variations: this._createMountainVariations(),
      hoveringElements: this._createMountainHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.ZIGZAG,
          color: 0x73b0ff,
          speed: 0.4,
          width: 3,
          alpha: 0.6
        },
        {
          type: EnergyPatternType.GEOMETRIC,
          color: 0x3a5f8f,
          speed: 0.2,
          width: 2,
          alpha: 0.4
        }
      ],
      baseTexturePath: 'assets/biomes/mountain',
      specialFeatures: [
        'mineral_vein',
        'mountain_peak',
        'energy_fault'
      ],
      resourceDistribution: {
        common: ['stone', 'iron_ore', 'coal'],
        uncommon: ['silver_ore', 'gold_ore', 'crystal_shards'],
        rare: ['energy_crystal', 'starstone', 'adamantite'],
        commonChance: 0.6,
        uncommonChance: 0.3,
        rareChance: 0.1
      }
    });
    
    // Initialize Desert biome
    this._definitions.set(BiomeType.DESERT, {
      type: BiomeType.DESERT,
      primaryEnergyColor: 0xffe066,
      secondaryEnergyColor: 0xffd966,
      variations: this._createDesertVariations(),
      hoveringElements: this._createDesertHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.LINEAR,
          color: 0xffcc66,
          speed: 0.7,
          width: 1.5,
          alpha: 0.5
        },
        {
          type: EnergyPatternType.PULSING,
          color: 0xc9973f,
          speed: 0.6,
          width: 2,
          alpha: 0.4
        }
      ],
      baseTexturePath: 'assets/biomes/desert',
      specialFeatures: [
        'oasis',
        'ancient_ruins',
        'sand_vortex'
      ],
      resourceDistribution: {
        common: ['sand', 'clay', 'cactus_fiber'],
        uncommon: ['solar_crystal', 'heat_stone', 'golden_sand'],
        rare: ['time_shard', 'mirage_essence', 'desert_pearl'],
        commonChance: 0.65,
        uncommonChance: 0.25,
        rareChance: 0.1
      }
    });
    
    // Initialize Tundra biome
    this._definitions.set(BiomeType.TUNDRA, {
      type: BiomeType.TUNDRA,
      primaryEnergyColor: 0xc7f0ff,
      secondaryEnergyColor: 0x8fb7bf,
      variations: this._createTundraVariations(),
      hoveringElements: this._createTundraHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.PULSING,
          color: 0xc7f0ff,
          speed: 0.3,
          width: 2,
          alpha: 0.6
        },
        {
          type: EnergyPatternType.GEOMETRIC,
          color: 0x8fb7bf,
          speed: 0.2,
          width: 1.5,
          alpha: 0.4
        }
      ],
      baseTexturePath: 'assets/biomes/tundra',
      specialFeatures: [
        'ice_formation',
        'frozen_entity',
        'thermal_vent'
      ],
      resourceDistribution: {
        common: ['ice', 'snow', 'frost_herbs'],
        uncommon: ['freeze_crystal', 'chilled_metal', 'pristine_ice'],
        rare: ['time_frozen_relic', 'aurora_essence', 'cryo_core'],
        commonChance: 0.6,
        uncommonChance: 0.3,
        rareChance: 0.1
      }
    });
    
    // Initialize Wetland biome
    this._definitions.set(BiomeType.WETLAND, {
      type: BiomeType.WETLAND,
      primaryEnergyColor: 0x3cff8a,
      secondaryEnergyColor: 0x6effb2,
      variations: this._createWetlandVariations(),
      hoveringElements: this._createWetlandHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.SPIRAL,
          color: 0x6effb2,
          speed: 0.4,
          width: 2,
          alpha: 0.5
        },
        {
          type: EnergyPatternType.ZIGZAG,
          color: 0x3c8c5e,
          speed: 0.3,
          width: 1.5,
          alpha: 0.4
        }
      ],
      baseTexturePath: 'assets/biomes/wetland',
      specialFeatures: [
        'floating_island',
        'bioluminescent_pool',
        'mist_vortex'
      ],
      resourceDistribution: {
        common: ['reeds', 'algae', 'mud'],
        uncommon: ['vitality_sap', 'bog_iron', 'glowing_moss'],
        rare: ['primal_essence', 'mist_crystal', 'ancient_marsh_amber'],
        commonChance: 0.7,
        uncommonChance: 0.2,
        rareChance: 0.1
      }
    });
    
    // Initialize Volcanic biome
    this._definitions.set(BiomeType.VOLCANIC, {
      type: BiomeType.VOLCANIC,
      primaryEnergyColor: 0xff4040,
      secondaryEnergyColor: 0xff6666,
      variations: this._createVolcanicVariations(),
      hoveringElements: this._createVolcanicHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.PULSING,
          color: 0xff6666,
          speed: 0.8,
          width: 3,
          alpha: 0.7
        },
        {
          type: EnergyPatternType.LINEAR,
          color: 0x992a2a,
          speed: 0.6,
          width: 2,
          alpha: 0.5
        }
      ],
      baseTexturePath: 'assets/biomes/volcanic',
      specialFeatures: [
        'lava_geyser',
        'flame_vortex',
        'obsidian_formation'
      ],
      resourceDistribution: {
        common: ['obsidian', 'sulfur', 'volcanic_ash'],
        uncommon: ['fire_crystal', 'molten_metal', 'heat_stone'],
        rare: ['phoenix_essence', 'eternal_flame_core', 'dragon_scale'],
        commonChance: 0.6,
        uncommonChance: 0.3,
        rareChance: 0.1
      }
    });
    
    // Initialize Crystal biome
    this._definitions.set(BiomeType.CRYSTAL, {
      type: BiomeType.CRYSTAL,
      primaryEnergyColor: 0xd899ff,
      secondaryEnergyColor: 0xf092ff,
      variations: this._createCrystalVariations(),
      hoveringElements: this._createCrystalHoveringElements(),
      energyPatterns: [
        {
          type: EnergyPatternType.GEOMETRIC,
          color: 0xf092ff,
          speed: 0.5,
          width: 2,
          alpha: 0.7
        },
        {
          type: EnergyPatternType.PULSING,
          color: 0x9966cc,
          speed: 0.4,
          width: 1.5,
          alpha: 0.6
        }
      ],
      baseTexturePath: 'assets/biomes/crystal',
      specialFeatures: [
        'resonance_node',
        'crystal_formation',
        'energy_nexus'
      ],
      resourceDistribution: {
        common: ['crystal_shards', 'resonant_dust', 'prismatic_fragment'],
        uncommon: ['pure_crystal', 'harmonic_crystal', 'energy_shard'],
        rare: ['void_crystal', 'dimension_fragment', 'temporal_crystal'],
        commonChance: 0.5,
        uncommonChance: 0.3,
        rareChance: 0.2
      }
    });
  }
  
  /**
   * Get the biome definition for a biome type
   * @param biomeType - The biome type to get the definition for
   * @returns The biome definition, or undefined if not found
   */
  public getBiomeDefinition(biomeType: BiomeType): EnhancedBiomeDefinition | undefined {
    return this._definitions.get(biomeType);
  }
  
  /**
   * Get all biome definitions
   * @returns All biome definitions
   */
  public getAllBiomeDefinitions(): EnhancedBiomeDefinition[] {
    return Array.from(this._definitions.values());
  }
  
  /**
   * Create a biome definition
   * @param biomeType - The biome type
   * @param definition - The biome definition
   */
  public createBiomeDefinition(biomeType: BiomeType, definition: EnhancedBiomeDefinition): void {
    this._definitions.set(biomeType, definition);
  }
  
  /**
   * Update a biome definition
   * @param biomeType - The biome type
   * @param definition - The biome definition
   * @returns Whether the update was successful
   */
  public updateBiomeDefinition(biomeType: BiomeType, definition: Partial<EnhancedBiomeDefinition>): boolean {
    const existing = this._definitions.get(biomeType);
    if (!existing) {
      return false;
    }
    
    this._definitions.set(biomeType, {
      ...existing,
      ...definition
    });
    
    return true;
  }
  
  /**
   * Create forest variations
   * @returns Forest variations
   */
  private _createForestVariations(): BiomeVariation[] {
    return [
      {
        id: 'sparse_forest',
        name: 'Sparse Forest',
        description: 'A light forest with scattered trees and clearings.',
        textureModifier: 'sparse',
        specialProperties: { resourceMultiplier: 0.8 }
      },
      {
        id: 'woodland',
        name: 'Woodland',
        description: 'A balanced mix of trees and open areas.',
        textureModifier: 'standard',
        specialProperties: { resourceMultiplier: 1.0 }
      },
      {
        id: 'dense_forest',
        name: 'Dense Forest',
        description: 'A thick canopy of trees creating a shadowy environment.',
        textureModifier: 'dense',
        specialProperties: { resourceMultiplier: 1.2 }
      },
      {
        id: 'ancient_grove',
        name: 'Ancient Grove',
        description: 'Old-growth trees with a mystical energy presence.',
        textureModifier: 'ancient',
        specialProperties: { energyMultiplier: 1.5, resourceMultiplier: 1.3 }
      },
      {
        id: 'crystal_forest',
        name: 'Crystal Forest',
        description: 'Trees infused with crystalline growths, glowing with energy.',
        textureModifier: 'crystal',
        specialProperties: { energyMultiplier: 2.0, resourceMultiplier: 1.5 }
      }
    ];
  }
  
  /**
   * Create mountain variations
   * @returns Mountain variations
   */
  private _createMountainVariations(): BiomeVariation[] {
    return [
      {
        id: 'foothills',
        name: 'Foothills',
        description: 'The lower slopes of mountains, with gentle inclines.',
        textureModifier: 'low',
        specialProperties: { movementModifier: 0.9 }
      },
      {
        id: 'highlands',
        name: 'Highlands',
        description: 'Elevated terrain with moderate slopes.',
        textureModifier: 'standard',
        specialProperties: { movementModifier: 0.8 }
      },
      {
        id: 'alpine',
        name: 'Alpine',
        description: 'High mountain terrain with steep slopes.',
        textureModifier: 'high',
        specialProperties: { movementModifier: 0.7, resourceMultiplier: 1.2 }
      },
      {
        id: 'rugged_peaks',
        name: 'Rugged Peaks',
        description: 'Jagged mountain tops with treacherous terrain.',
        textureModifier: 'peak',
        specialProperties: { movementModifier: 0.6, resourceMultiplier: 1.4 }
      },
      {
        id: 'crystal_peak',
        name: 'Crystal Peak',
        description: 'Mountain summits with crystalline formations that channel energy.',
        textureModifier: 'crystal',
        specialProperties: { movementModifier: 0.5, energyMultiplier: 1.8, resourceMultiplier: 1.6 }
      }
    ];
  }
  
  /**
   * Create desert variations
   * @returns Desert variations
   */
  private _createDesertVariations(): BiomeVariation[] {
    return [
      {
        id: 'sandy_flat',
        name: 'Sandy Flat',
        description: 'Vast expanses of flat sand with minimal features.',
        textureModifier: 'flat',
        specialProperties: { movementModifier: 1.1 }
      },
      {
        id: 'dune_sea',
        name: 'Dune Sea',
        description: 'Rolling sand dunes that stretch to the horizon.',
        textureModifier: 'dunes',
        specialProperties: { movementModifier: 0.9 }
      },
      {
        id: 'rocky_desert',
        name: 'Rocky Desert',
        description: 'Arid terrain with rock formations and sparse vegetation.',
        textureModifier: 'rocky',
        specialProperties: { resourceMultiplier: 1.2 }
      },
      {
        id: 'ancient_desert',
        name: 'Ancient Desert',
        description: 'Desert regions with buried ruins and artifacts.',
        textureModifier: 'ancient',
        specialProperties: { resourceMultiplier: 1.4, discoveryChance: 1.3 }
      },
      {
        id: 'energy_desert',
        name: 'Energy Desert',
        description: 'Desert with natural energy formations that shimmer in the heat.',
        textureModifier: 'energy',
        specialProperties: { energyMultiplier: 1.7, resourceMultiplier: 1.5 }
      }
    ];
  }
  
  /**
   * Create tundra variations
   * @returns Tundra variations
   */
  private _createTundraVariations(): BiomeVariation[] {
    return [
      {
        id: 'frost_plain',
        name: 'Frost Plain',
        description: 'Open plains covered in a layer of frost and sparse snow.',
        textureModifier: 'plain',
        specialProperties: { movementModifier: 0.9 }
      },
      {
        id: 'snow_field',
        name: 'Snow Field',
        description: 'Fields of snow with moderate depth.',
        textureModifier: 'snow',
        specialProperties: { movementModifier: 0.8 }
      },
      {
        id: 'glacier',
        name: 'Glacier',
        description: 'Thick ice formations that flow slowly over the landscape.',
        textureModifier: 'glacier',
        specialProperties: { movementModifier: 0.7, resourceMultiplier: 1.2 }
      },
      {
        id: 'frozen_wasteland',
        name: 'Frozen Wasteland',
        description: 'Barren, frozen terrain with ice formations and harsh winds.',
        textureModifier: 'frozen',
        specialProperties: { movementModifier: 0.6, resourceMultiplier: 1.3 }
      },
      {
        id: 'aurora_zone',
        name: 'Aurora Zone',
        description: 'Frozen regions where energy manifests as beautiful auroras above.',
        textureModifier: 'aurora',
        specialProperties: { energyMultiplier: 1.8, resourceMultiplier: 1.5 }
      }
    ];
  }
  
  /**
   * Create wetland variations
   * @returns Wetland variations
   */
  private _createWetlandVariations(): BiomeVariation[] {
    return [
      {
        id: 'marshland',
        name: 'Marshland',
        description: 'Shallow wetlands with reeds and tall grasses.',
        textureModifier: 'marsh',
        specialProperties: { movementModifier: 0.8 }
      },
      {
        id: 'swamp',
        name: 'Swamp',
        description: 'Dense wetlands with twisted trees and murky water.',
        textureModifier: 'swamp',
        specialProperties: { movementModifier: 0.7, resourceMultiplier: 1.1 }
      },
      {
        id: 'bog',
        name: 'Bog',
        description: 'Spongy wetlands with thick mosses and decomposing plant matter.',
        textureModifier: 'bog',
        specialProperties: { movementModifier: 0.6, resourceMultiplier: 1.2 }
      },
      {
        id: 'mangrove',
        name: 'Mangrove',
        description: 'Wetlands dominated by mangrove trees with complex root systems.',
        textureModifier: 'mangrove',
        specialProperties: { movementModifier: 0.5, resourceMultiplier: 1.4 }
      },
      {
        id: 'energy_swamp',
        name: 'Energy Swamp',
        description: 'Wetlands where energy collects in pools and flows through channels.',
        textureModifier: 'energy',
        specialProperties: { energyMultiplier: 1.7, resourceMultiplier: 1.5 }
      }
    ];
  }
  
  /**
   * Create volcanic variations
   * @returns Volcanic variations
   */
  private _createVolcanicVariations(): BiomeVariation[] {
    return [
      {
        id: 'volcanic_soil',
        name: 'Volcanic Soil',
        description: 'Terrain with rich volcanic soil and minimal active features.',
        textureModifier: 'soil',
        specialProperties: { resourceMultiplier: 1.1 }
      },
      {
        id: 'obsidian_fields',
        name: 'Obsidian Fields',
        description: 'Areas where cooled lava has formed fields of obsidian.',
        textureModifier: 'obsidian',
        specialProperties: { resourceMultiplier: 1.3 }
      },
      {
        id: 'active_volcanic',
        name: 'Active Volcanic',
        description: 'Regions with visible magma channels and active vents.',
        textureModifier: 'active',
        specialProperties: { movementModifier: 0.7, hazardLevel: 1.5, resourceMultiplier: 1.5 }
      },
      {
        id: 'lava_flow',
        name: 'Lava Flow',
        description: 'Areas with flowing lava and extreme heat.',
        textureModifier: 'lava',
        specialProperties: { movementModifier: 0.5, hazardLevel: 2.0, resourceMultiplier: 1.7 }
      },
      {
        id: 'energy_volcanic',
        name: 'Energy Volcanic',
        description: 'Volcanic regions where energy and magma interact in spectacular displays.',
        textureModifier: 'energy',
        specialProperties: { energyMultiplier: 2.0, hazardLevel: 2.5, resourceMultiplier: 2.0 }
      }
    ];
  }
  
  /**
   * Create crystal variations
   * @returns Crystal variations
   */
  private _createCrystalVariations(): BiomeVariation[] {
    return [
      {
        id: 'crystal_sprouts',
        name: 'Crystal Sprouts',
        description: 'Areas with small crystal formations emerging from the ground.',
        textureModifier: 'sprout',
        specialProperties: { energyMultiplier: 1.2 }
      },
      {
        id: 'crystal_field',
        name: 'Crystal Field',
        description: 'Open regions covered with medium-sized crystal formations.',
        textureModifier: 'field',
        specialProperties: { energyMultiplier: 1.4, resourceMultiplier: 1.2 }
      },
      {
        id: 'crystal_forest',
        name: 'Crystal Forest',
        description: 'Dense clusters of large crystal formations resembling a forest.',
        textureModifier: 'forest',
        specialProperties: { energyMultiplier: 1.6, resourceMultiplier: 1.4 }
      },
      {
        id: 'resonating_crystals',
        name: 'Resonating Crystals',
        description: 'Crystal formations that actively pulse and resonate with energy.',
        textureModifier: 'resonant',
        specialProperties: { energyMultiplier: 1.8, resourceMultiplier: 1.6 }
      },
      {
        id: 'energy_nexus',
        name: 'Energy Nexus',
        description: 'A concentrated formation of crystals where energy flows converge.',
        textureModifier: 'nexus',
        specialProperties: { energyMultiplier: 2.5, resourceMultiplier: 2.0 }
      }
    ];
  }
  
  /**
   * Create forest hovering elements
   * @returns Forest hovering elements
   */
  private _createForestHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'triangle',
        size: 15,
        color: 0x4eff8a,
        alpha: 0.7,
        hoverHeight: 20,
        rotationSpeed: 0.02,
        oscillationRange: 5,
        oscillationSpeed: 0.5,
        energyPulse: {
          color: 0x2dff57,
          frequency: 0.7,
          intensity: 0.5,
          pattern: EnergyPatternType.PULSING
        }
      },
      {
        shape: 'irregular',
        size: 10,
        color: 0x87ff92,
        alpha: 0.6,
        hoverHeight: 15,
        rotationSpeed: 0.01,
        oscillationRange: 3,
        oscillationSpeed: 0.3
      }
    ];
  }
  
  /**
   * Create mountain hovering elements
   * @returns Mountain hovering elements
   */
  private _createMountainHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'pentagon',
        size: 12,
        color: 0x73b0ff,
        alpha: 0.7,
        hoverHeight: 25,
        rotationSpeed: 0.01,
        oscillationRange: 4,
        oscillationSpeed: 0.4,
        energyPulse: {
          color: 0x3a7fff,
          frequency: 0.5,
          intensity: 0.6,
          pattern: EnergyPatternType.ZIGZAG
        }
      },
      {
        shape: 'rectangle',
        size: 8,
        color: 0x3a5f8f,
        alpha: 0.5,
        hoverHeight: 18,
        rotationSpeed: 0.02,
        oscillationRange: 6,
        oscillationSpeed: 0.6
      }
    ];
  }
  
  /**
   * Create desert hovering elements
   * @returns Desert hovering elements
   */
  private _createDesertHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'triangle',
        size: 10,
        color: 0xffcc66,
        alpha: 0.6,
        hoverHeight: 22,
        rotationSpeed: 0.03,
        oscillationRange: 7,
        oscillationSpeed: 0.7,
        energyPulse: {
          color: 0xffe066,
          frequency: 0.8,
          intensity: 0.4,
          pattern: EnergyPatternType.LINEAR
        }
      },
      {
        shape: 'irregular',
        size: 6,
        color: 0xc9973f,
        alpha: 0.5,
        hoverHeight: 15,
        rotationSpeed: 0.02,
        oscillationRange: 5,
        oscillationSpeed: 0.5
      }
    ];
  }
  
  /**
   * Create tundra hovering elements
   * @returns Tundra hovering elements
   */
  private _createTundraHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'hexagon',
        size: 12,
        color: 0xc7f0ff,
        alpha: 0.8,
        hoverHeight: 24,
        rotationSpeed: 0.01,
        oscillationRange: 3,
        oscillationSpeed: 0.3,
        energyPulse: {
          color: 0x8fb7bf,
          frequency: 0.4,
          intensity: 0.5,
          pattern: EnergyPatternType.GEOMETRIC
        }
      },
      {
        shape: 'triangle',
        size: 8,
        color: 0x8fb7bf,
        alpha: 0.6,
        hoverHeight: 16,
        rotationSpeed: 0.015,
        oscillationRange: 4,
        oscillationSpeed: 0.4
      }
    ];
  }
  
  /**
   * Create wetland hovering elements
   * @returns Wetland hovering elements
   */
  private _createWetlandHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'irregular',
        size: 14,
        color: 0x6effb2,
        alpha: 0.7,
        hoverHeight: 18,
        rotationSpeed: 0.01,
        oscillationRange: 6,
        oscillationSpeed: 0.4,
        energyPulse: {
          color: 0x3cff8a,
          frequency: 0.6,
          intensity: 0.5,
          pattern: EnergyPatternType.SPIRAL
        }
      },
      {
        shape: 'pentagon',
        size: 7,
        color: 0x3c8c5e,
        alpha: 0.5,
        hoverHeight: 12,
        rotationSpeed: 0.02,
        oscillationRange: 4,
        oscillationSpeed: 0.3
      }
    ];
  }
  
  /**
   * Create volcanic hovering elements
   * @returns Volcanic hovering elements
   */
  private _createVolcanicHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'triangle',
        size: 16,
        color: 0xff6666,
        alpha: 0.8,
        hoverHeight: 28,
        rotationSpeed: 0.03,
        oscillationRange: 8,
        oscillationSpeed: 0.8,
        energyPulse: {
          color: 0xff4040,
          frequency: 1.0,
          intensity: 0.7,
          pattern: EnergyPatternType.PULSING
        }
      },
      {
        shape: 'irregular',
        size: 10,
        color: 0x992a2a,
        alpha: 0.6,
        hoverHeight: 20,
        rotationSpeed: 0.04,
        oscillationRange: 6,
        oscillationSpeed: 0.7
      }
    ];
  }
  
  /**
   * Create crystal hovering elements
   * @returns Crystal hovering elements
   */
  private _createCrystalHoveringElements(): HoverElementDefinition[] {
    return [
      {
        shape: 'diamond',
        size: 14,
        color: 0xf092ff,
        alpha: 0.8,
        hoverHeight: 26,
        rotationSpeed: 0.02,
        oscillationRange: 6,
        oscillationSpeed: 0.5,
        energyPulse: {
          color: 0xd899ff,
          frequency: 0.8,
          intensity: 0.6,
          pattern: EnergyPatternType.GEOMETRIC
        }
      },
      {
        shape: 'hexagon',
        size: 9,
        color: 0x9966cc,
        alpha: 0.6,
        hoverHeight: 18,
        rotationSpeed: 0.03,
        oscillationRange: 4,
        oscillationSpeed: 0.4
      }
    ];
  }
}
