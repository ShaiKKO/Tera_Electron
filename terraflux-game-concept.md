# TerraFlux: Game Concept Document

## Core Concept

TerraFlux is a colony simulation and exploration game built with Electron, featuring RimWorld-inspired design and camera systems. Players manage a base on a hexagonal world map, gather resources, develop character skills through use, and participate in limited multiplayer interactions.

## Game Definition

**Genre**: Colony Simulation / Base Building / Exploration  
**Platform**: Desktop (Windows via Electron)  
**Visual Style**: "Crystalline Conquest" - geometric precision, clean edges, faceted surfaces  
**Perspective**: Top-down isometric view with RimWorld-style camera controls  
**Multiplayer**: "Contained multiplayer" with specific interaction points  

## Fundamental Gameplay Loop

1. **Colony Management**: Build and manage a grid-based Origin Tile with specialized buildings
2. **Character Development**: Direct colonists with skill-based progression and need management
3. **Resource Collection**: Send expeditions to gather resources from the hex-based world map
4. **World Exploration**: Discover new biomes, resources, and points of interest
5. **Crafting & Production**: Process resources and create items through production chains

## Visual Style & Perspective

TerraFlux uses a distinctive "Crystalline Conquest" art style:
- Clean, geometric precision inspired by Valorant
- Bold, chunky proportions reminiscent of Warhammer
- Vibrant fantasy elements drawing from World of Warcraft
- Signature crystalline aesthetic with faceted surfaces and hovering fragments

The game employs a RimWorld-style camera system:
- Top-down isometric perspective
- Zoom in/out capabilities
- Panning across the map
- Slight rotation for better viewing angles

## Core Systems

### 1. Hex Grid World Map
- Procedurally generated hexagonal tiles representing different biomes
- Each hex contains resources, points of interest, and potential dangers
- Exploration reveals new hexes and their contents
- Biomes include: Forest, Mountain, Desert, Tundra, Wetland, Volcanic, Crystal Formation

### 2. Grid-Based Colony System
- RimWorld-style grid system for precise building placement
- Buildings have specific footprints and placement requirements
- Colony expands and evolves through five progression levels
- Infrastructure includes production, storage, research, and living quarters

### 3. Character & Skill System
- Colonists have needs (hunger, rest, comfort, joy, social)
- Skills improve through use (no traditional XP/level system)
- Eight core skills: Construction, Mining, Cooking, Crafting, Research, Medicine, Combat, Gardening
- Attributes affect base capabilities: Strength, Dexterity, Intelligence, Endurance, Social

### 4. Biome Attunement
- Extended presence in biome types develops attunement (levels 0-10)
- Attunement grants environmental bonuses and special abilities
- "Resonance Abilities" allow using biome elements outside their native environment
- Creates strategic depth for expedition planning

### 5. Production & Crafting
- Multi-stage production chains
- Resource refinement processes
- Equipment and tool crafting
- Building construction and upgrades

### 6. Multiplayer Elements
- Expedition Parties: Temporary groups (2-5 players) can explore together
- Origin Tile Visits: Visit other players' bases with permission-based interactions
- Trading: Exchange resources directly or through automated trading posts
- Conclaves: Join specialized groups (Research, Trade, Warden, Nomad) for shared benefits
- Convergence Events: Limited-time world phenomena for multiple players

## Technical Implementation

TerraFlux is built using:
- **Electron**: For desktop application framework
- **React**: For UI components
- **Redux**: For state management
- **PixiJS**: For 2D rendering with WebGL acceleration
- **Entity-Component-System (ECS)**: For game logic architecture

This enables a desktop experience using web technologies with:
- Full access to file system for save games
- Native window controls and menus
- Offline gameplay capabilities
- Efficient 2D rendering with WebGL

## Distinctive Features

### World Exploration
- Hex-based world with procedurally generated biomes
- Resources and points of interest on each hex
- Expedition system for resource gathering and discovery
- Mystery and exploration as core gameplay elements

### Character Progression
- Skills advance through actual use rather than arbitrary XP
- Biome attunement system creates specializations
- Harmony Skills unlock by combining different specializations
- Colonists have needs and moods affecting productivity

### Colony Development
- Five stages of Origin Tile evolution (Starter to Master)
- Building placement on a grid-based system
- Resource production chains between buildings
- Customization options for aesthetics and efficiency

### Resource System
- Multi-stage refinement processes
- Resource nodes with varying yields and quality
- Strategic resource management and storage
- Production optimization gameplay

### Multiplayer Interactions
- Cooperative exploration with expedition parties
- Permission-based base visits
- Trading systems between players
- Participation in convergence events
- Conclave membership for shared benefits

## Development Priorities

1. Solid core gameplay systems (colony management, character progression)
2. Smooth, intuitive UI with RimWorld-style controls
3. Procedural generation creating interesting worlds
4. Performance optimization for smooth experience
5. Stable desktop application with proper save/load functionality
6. Multiplayer features that enhance but don't dominate gameplay

This document serves as the definitive reference for TerraFlux's concept and design direction during development with Claude 3.7.
