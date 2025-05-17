/**
 * TerraFlux - Exploration System Test Renderer
 * 
 * This file implements the renderer for testing the exploration system,
 * including fog of war, exploration tracking, and minimap visualization.
 */

import * as PIXI from 'pixi.js';
import { WorldMap } from './src/game/world/WorldMap';
import { WorldMapManager } from './src/game/world/WorldMapManager';
import { WorldTile } from './src/game/world/WorldTile';
import { FogOfWarManager } from './src/game/world/exploration/FogOfWarManager';
import { ExplorationTracker } from './src/game/world/exploration/ExplorationTracker';
import { MinimapRenderer } from './src/game/world/exploration/MinimapRenderer';
import { BiomeType, FeatureType } from './src/game/rendering/tiles/types';
import { CoordinateSystem } from './src/game/core/utils/CoordinateSystem';
import { DiscoveryType, MinimapMode, VisibilityState, Vector2 } from './src/game/world/exploration/types';

// Main application class
class ExplorationTestApp {
  // PIXI application
  private app: PIXI.Application;
  
  // World components
  private worldMap: WorldMap;
  private fogOfWar: FogOfWarManager;
  private explorationTracker: ExplorationTracker;
  private minimapRenderer: MinimapRenderer;
  
  // Rendering components
  private worldContainer: PIXI.Container;
  private fogContainer: PIXI.Container;
  private minimapSprite?: PIXI.Sprite;
  
  // Debug display
  private debugGraphics: PIXI.Graphics;
  private debugMode: boolean = false;
  
  // World generation parameters
  private worldSize: { width: number, height: number } = { width: 20, height: 20 };
  private worldSeed: string = 'exploration-test-1';
  
  /**
   * Constructor
   */
  constructor() {
    // Initialize PIXI Application
    this.app = new PIXI.Application({
      width: window.innerWidth - 300, // Accounting for the control panel
      height: window.innerHeight,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1
    });
    
    // Append canvas to the DOM
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      gameCanvas.appendChild(this.app.view as HTMLCanvasElement);
    }

    // Create containers for different visualization layers
    this.worldContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.debugGraphics = new PIXI.Graphics();
    
    // Add containers to stage
    this.app.stage.addChild(this.worldContainer);
    this.app.stage.addChild(this.fogContainer);
    this.app.stage.addChild(this.debugGraphics);
    
    // Attach resize handler
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Set up UI controls
    this.setupEventListeners();
    
    // Wait for API to be ready from preload script
    window.addEventListener('terraflux-api-ready', () => {
      this.logMessage('API Ready', 'info');
      this.logMessage('Exploration System Test initialized', 'success');
    });
  }
  
  /**
   * Initializes event listeners for UI controls
   */
  private setupEventListeners(): void {
    // World generation
    const generateWorldButton = document.getElementById('generate-world');
    if (generateWorldButton) {
      generateWorldButton.addEventListener('click', () => {
        this.generateWorld();
      });
    }
    
    // World size selector
    const worldSizeSelect = document.getElementById('world-size');
    if (worldSizeSelect) {
      worldSizeSelect.addEventListener('change', (e) => {
        const select = e.target as HTMLSelectElement;
        switch (select.value) {
          case 'tiny':
            this.worldSize = { width: 10, height: 10 };
            break;
          case 'small':
            this.worldSize = { width: 20, height: 20 };
            break;
          case 'medium':
            this.worldSize = { width: 30, height: 30 };
            break;
          case 'large':
            this.worldSize = { width: 40, height: 40 };
            break;
        }
      });
    }
    
    // Seed input
    const seedInput = document.getElementById('seed');
    if (seedInput) {
      seedInput.addEventListener('input', (e) => {
        this.worldSeed = (e.target as HTMLInputElement).value;
      });
    }
    
    // Exploration radius slider
    const exploreRadiusInput = document.getElementById('explore-radius');
    if (exploreRadiusInput) {
      exploreRadiusInput.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        const radiusValue = document.getElementById('radius-value');
        if (radiusValue) {
          radiusValue.textContent = value;
        }
      });
    }
    
    // Explore location button
    const exploreLocationButton = document.getElementById('explore-location');
    if (exploreLocationButton) {
      exploreLocationButton.addEventListener('click', () => {
        const exploreXInput = document.getElementById('explore-x') as HTMLInputElement;
        const exploreYInput = document.getElementById('explore-y') as HTMLInputElement;
        const exploreRadiusInput = document.getElementById('explore-radius') as HTMLInputElement;
        
        if (exploreXInput && exploreYInput && exploreRadiusInput) {
          const x = parseFloat(exploreXInput.value);
          const y = parseFloat(exploreYInput.value);
          const radius = parseFloat(exploreRadiusInput.value);
          
          this.exploreArea({ x, y }, radius);
        }
      });
    }
    
    // Explore random button
    const exploreRandomButton = document.getElementById('explore-random');
    if (exploreRandomButton) {
      exploreRandomButton.addEventListener('click', () => {
        this.exploreRandomArea();
      });
    }
    
    // Discover feature button
    const discoverFeatureButton = document.getElementById('discover-feature');
    if (discoverFeatureButton) {
      discoverFeatureButton.addEventListener('click', () => {
        this.discoverRandomFeature();
      });
    }
    
    // Discover resource button
    const discoverResourceButton = document.getElementById('discover-resource');
    if (discoverResourceButton) {
      discoverResourceButton.addEventListener('click', () => {
        this.discoverRandomResource();
      });
    }
    
    // Minimap mode selector
    const minimapModeSelect = document.getElementById('minimap-mode');
    if (minimapModeSelect) {
      minimapModeSelect.addEventListener('change', (e) => {
        const select = e.target as HTMLSelectElement;
        switch (select.value) {
          case 'terrain':
            this.setMinimapMode(MinimapMode.TERRAIN);
            break;
          case 'resources':
            this.setMinimapMode(MinimapMode.RESOURCES);
            break;
          case 'elevation':
            this.setMinimapMode(MinimapMode.ELEVATION);
            break;
          case 'ownership':
            this.setMinimapMode(MinimapMode.OWNERSHIP);
            break;
        }
      });
    }
    
    // Zoom level slider
    const zoomLevelInput = document.getElementById('zoom-level');
    if (zoomLevelInput) {
      zoomLevelInput.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        const zoomValue = document.getElementById('zoom-value');
        if (zoomValue) {
          zoomValue.textContent = value.toFixed(1);
        }
        if (this.minimapRenderer) {
          this.minimapRenderer.setZoomLevel(value);
          this.updateMinimapDisplay();
        }
      });
    }
    
    // Update minimap button
    const updateMinimapButton = document.getElementById('update-minimap');
    if (updateMinimapButton) {
      updateMinimapButton.addEventListener('click', () => {
        this.updateMinimapDisplay();
      });
    }
    
    // Debug toggle button
    const toggleDebugButton = document.getElementById('toggle-debug');
    if (toggleDebugButton) {
      toggleDebugButton.addEventListener('click', () => {
        this.debugMode = !this.debugMode;
        this.renderDebug();
      });
    }
    
    // Run verification button
    const runVerificationButton = document.getElementById('run-verification');
    if (runVerificationButton) {
      runVerificationButton.addEventListener('click', () => {
        this.runVerificationTests();
      });
    }
    
    // Reset all button
    const resetAllButton = document.getElementById('reset-all');
    if (resetAllButton) {
      resetAllButton.addEventListener('click', () => {
        this.reset();
      });
    }
  }
  
  /**
   * Handles window resize events
   */
  private handleResize(): void {
    // Resize the PIXI canvas to match the new window size
    this.app.renderer.resize(window.innerWidth - 300, window.innerHeight);
    
    // Re-render the world
    this.renderWorld();
  }
  
  /**
   * Generates a new world with the current settings
   */
  private generateWorld(): void {
    this.logMessage(`Generating world (${this.worldSize.width}x${this.worldSize.height}) with seed: ${this.worldSeed}`, 'info');
    
    try {
      // Create a new world map
      this.worldMap = new WorldMap();
      
      // Create dummy tiles for testing
      // In a full implementation, we would use WorldGenerator
      for (let q = -Math.floor(this.worldSize.width / 2); q < Math.floor(this.worldSize.width / 2); q++) {
        for (let r = -Math.floor(this.worldSize.height / 2); r < Math.floor(this.worldSize.height / 2); r++) {
          // Create a tile with pseudorandom biome and elevation based on position
          const hash = Math.abs(q * 73 + r * 179 + this.worldSeed.charCodeAt(0));
          
          // Determine biome based on hash
          let biomeType: BiomeType;
          const biomeValue = hash % 7;
          switch (biomeValue) {
            case 0: biomeType = BiomeType.FOREST; break;
            case 1: biomeType = BiomeType.MOUNTAIN; break;
            case 2: biomeType = BiomeType.DESERT; break;
            case 3: biomeType = BiomeType.TUNDRA; break;
            case 4: biomeType = BiomeType.WETLAND; break;
            case 5: biomeType = BiomeType.VOLCANIC; break;
            case 6: biomeType = BiomeType.CRYSTAL; break;
            default: biomeType = BiomeType.FOREST;
          }
          
          // Calculate pseudorandom tile properties
          const variation = hash % 5;
          const elevation = (hash % 100) / 100;
          const moisture = ((hash * 13) % 100) / 100;
          const temperature = ((hash * 29) % 100) / 100;
          
          // Create and add the tile
          const tile = new WorldTile(q, r, biomeType, variation, elevation, moisture, temperature);
          
          // Add resources to some tiles
          if (hash % 5 === 0) {
            const resourceHash = hash * 17;
            const resourceType = ['wood', 'stone', 'metal', 'crystal', 'water', 'food'][resourceHash % 6];
            const amount = (resourceHash % 50) + 10;
            
            tile.addResource({
              type: resourceType,
              amount: amount,
              quality: (resourceHash % 10) / 10,
              discovered: false,
              extractable: true
            });
          }
          
          // Add features to some tiles
          if (hash % 8 === 0) {
            const featureHash = hash * 23;
            const featureType = featureHash % 2 === 0 ? FeatureType.LANDMARK : FeatureType.HAZARD;
            const subTypes = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
            const subType = subTypes[featureHash % 5];
            
            tile.addFeature({
              type: featureType,
              subType: subType,
              discovered: false
            });
          }
          
          // Add the tile to the world map
          this.worldMap.addTile(tile);
        }
      }
      
      // Initialize the fog of war manager
      this.fogOfWar = new FogOfWarManager(this.worldMap);
      
      // Initialize exploration tracker
      this.explorationTracker = new ExplorationTracker(this.worldMap, 'player1');
      
      // Initialize minimap renderer
      this.minimapRenderer = new MinimapRenderer(this.worldMap, this.fogOfWar);
      
      // Render the world
      this.renderWorld();
      
      // Update the minimap display
      this.updateMinimapDisplay();
      
      this.logMessage('World generated successfully', 'success');
      
      // Update statistics
      this.updateStatistics();
    } catch (error) {
      this.logMessage(`Error generating world: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Renders the world map
   */
  private renderWorld(): void {
    if (!this.worldMap) return;
    
    // Clear containers
    this.worldContainer.removeChildren();
    this.fogContainer.removeChildren();
    
    // Calculate scale based on window size to ensure entire world is visible
    const scale = Math.min(
      this.app.screen.width / (this.worldSize.width * 20),
      this.app.screen.height / (this.worldSize.height * 20)
    );
    
    // Create graphics for tiles
    const graphics = new PIXI.Graphics();
    
    // Define colors for different biome types
    const biomeColors = {
      [BiomeType.FOREST]: 0x2b803e,
      [BiomeType.MOUNTAIN]: 0x7a7a7a,
      [BiomeType.DESERT]: 0xe5c271,
      [BiomeType.TUNDRA]: 0xd0e5f2,
      [BiomeType.WETLAND]: 0x42734a,
      [BiomeType.VOLCANIC]: 0x813129,
      [BiomeType.CRYSTAL]: 0x9c59b3
    };
    
    // Center the container in the viewport
    this.worldContainer.x = this.app.screen.width / 2;
    this.worldContainer.y = this.app.screen.height / 2;
    this.worldContainer.scale.set(scale);
    
    // Position fog container to match world container
    this.fogContainer.x = this.app.screen.width / 2;
    this.fogContainer.y = this.app.screen.height / 2;
    this.fogContainer.scale.set(scale);
    
    // Draw tiles
    for (const tile of this.worldMap.tiles) {
      const pos = CoordinateSystem.hexToWorld(tile.q, tile.r);
      const hexSize = 10;
      
      // Draw tile based on biome
      graphics.beginFill(biomeColors[tile.biomeType] || 0x888888);
      
      // Draw hexagon
      graphics.drawPolygon([
        -hexSize, 0,
        -hexSize/2, hexSize * 0.866,
        hexSize/2, hexSize * 0.866,
        hexSize, 0,
        hexSize/2, -hexSize * 0.866,
        -hexSize/2, -hexSize * 0.866
      ]);
      
      graphics.endFill();
      
      // Create a sprite from the graphics
      const tileSprite = new PIXI.Sprite(this.app.renderer.generateTexture(graphics));
      tileSprite.x = pos.x;
      tileSprite.y = pos.y;
      tileSprite.anchor.set(0.5);
      
      // Add to container
      this.worldContainer.addChild(tileSprite);
      
      // Clear graphics for next tile
      graphics.clear();
      
      // Add fog of war overlay
      const fogSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      fogSprite.width = hexSize * 2;
      fogSprite.height = hexSize * 2;
      fogSprite.anchor.set(0.5);
      fogSprite.x = pos.x;
      fogSprite.y = pos.y;
      
      // Set visibility based on fog of war
      const visibility = this.fogOfWar.getTileVisibility(tile.q, tile.r);
      switch (visibility) {
        case VisibilityState.UNEXPLORED:
          fogSprite.tint = 0x000000;
          fogSprite.alpha = 0.9;
          break;
        case VisibilityState.PARTIALLY_EXPLORED:
          fogSprite.tint = 0x000000;
          fogSprite.alpha = 0.5;
          break;
        case VisibilityState.FULLY_EXPLORED:
          fogSprite.tint = 0x000000;
          fogSprite.alpha = 0;
          break;
      }
      
      this.fogContainer.addChild(fogSprite);
    }
    
    // Render debug info if enabled
    this.renderDebug();
  }
  
  /**
   * Updates the minimap display
   */
  private updateMinimapDisplay(): void {
    if (!this.minimapRenderer || !this.worldMap) return;
    
    try {
      // Update the minimap texture
      const texture = this.minimapRenderer.updateTexture();
      
      // Create a canvas renderer to display the texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      
      // Get the container element
      const container = document.getElementById('minimap-canvas');
      if (!container) return;
      
      // Clear previous content
      container.innerHTML = '';
      
      // Add the canvas to the DOM
      container.appendChild(canvas);
      
      // Draw the texture to the canvas
      const context = canvas.getContext('2d');
      if (context) {
        // Code to render texture to canvas would go here
        // We're simplifying for the test by just coloring the canvas
        context.fillStyle = '#336699';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      this.logMessage('Minimap updated', 'info');
    } catch (error) {
      this.logMessage(`Error updating minimap: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Renders debug information
   */
  private renderDebug(): void {
    // Clear debug graphics
    this.debugGraphics.clear();
    
    if (!this.debugMode || !this.worldMap) return;
    
    // Match debug container position to world container
    this.debugGraphics.x = this.app.screen.width / 2;
    this.debugGraphics.y = this.app.screen.height / 2;
    this.debugGraphics.scale.set(this.worldContainer.scale.x);
    
    // For each tile with discoveries, draw an indicator
    for (const tile of this.worldMap.tiles) {
      const pos = CoordinateSystem.hexToWorld(tile.q, tile.r);
      
      // Check for discovered resources
      if (tile.resources && tile.resources.some(r => r.discovered)) {
        // Draw a star for resources
        this.debugGraphics.lineStyle(1, 0xffff00);
        this.debugGraphics.beginFill(0xffff00, 0.5);
        
        // Star shape
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? 5 : 2;
          const angle = Math.PI * 2 * (i / 10);
          starPoints.push(pos.x + radius * Math.cos(angle));
          starPoints.push(pos.y + radius * Math.sin(angle));
        }
        
        this.debugGraphics.drawPolygon(starPoints);
        this.debugGraphics.endFill();
      }
      
      // Check for discovered features
      if (tile.features && tile.features.some(f => f.discovered)) {
        // Draw a circle for features
        this.debugGraphics.lineStyle(1, 0x00ffff);
        this.debugGraphics.beginFill(0x00ffff, 0.5);
        this.debugGraphics.drawCircle(pos.x, pos.y, 5);
        this.debugGraphics.endFill();
      }
    }
  }
  
  /**
   * Sets the minimap mode
   */
  private setMinimapMode(mode: MinimapMode): void {
    if (!this.minimapRenderer) return;
    
    this.minimapRenderer.setMode(mode);
    this.updateMinimapDisplay();
  }
  
  /**
   * Explores an area around the given position
   */
  private exploreArea(position: Vector2, radius: number): void {
    if (!this.fogOfWar || !this.explorationTracker) return;
    
    try {
      // Convert world position to hex coordinates
      const hexCoords = CoordinateSystem.worldToHex(position.x, position.y);
      
      // Mark area as explored in fog of war
      this.fogOfWar.revealArea(hexCoords.q, hexCoords.r, radius);
      
      // Mark area as explored in exploration tracker
      this.explorationTracker.markAreaExplored(position);
      
      // Re-render the world and minimap
      this.renderWorld();
      this.updateMinimapDisplay();
      
      // Update statistics
      this.updateStatistics();
      
      this.logMessage(`Explored area at (${position.x.toFixed(1)}, ${position.y.toFixed(1)}) with radius ${radius}`, 'success');
    } catch (error) {
      this.logMessage(`Error exploring area: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Chooses a random position in the world and explores around it
   */
  private exploreRandomArea(): void {
    if (!this.worldMap) return;
    
    try {
      // Select a random tile
      const tiles = this.worldMap.tiles;
      if (tiles.length === 0) return;
      
      const randomIndex = Math.floor(Math.random() * tiles.length);
      const randomTile = tiles[randomIndex];
      
      // Convert hex coordinates to world position
      const worldPos = CoordinateSystem.hexToWorld(randomTile.q, randomTile.r);
      
      // Get the exploration radius
      const radius = parseFloat((document.getElementById('explore-radius') as HTMLInputElement).value);
      
      // Explore the area
      this.exploreArea({ x: worldPos.x, y: worldPos.y }, radius);
    } catch (error) {
      this.logMessage(`Error exploring random area: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Discovers a random feature in the world
   */
  private discoverRandomFeature(): void {
    if (!this.worldMap || !this.explorationTracker) return;
    
    try {
      // Find tiles with undiscovered features
      const tilesWithFeatures = this.worldMap.tiles.filter(tile => 
        tile.features && 
        tile.features.length > 0 &&
        tile.features.some(f => !f.discovered)
      );
      
      if (tilesWithFeatures.length === 0) {
        this.logMessage('No undiscovered features left in the world', 'info');
        return;
      }
      
      // Select a random tile with features
      const randomIndex = Math.floor(Math.random() * tilesWithFeatures.length);
      const selectedTile = tilesWithFeatures[randomIndex];
      
      // Find undiscovered features in the tile
      const undiscoveredFeatures = selectedTile.features.filter(f => !f.discovered);
      if (undiscoveredFeatures.length === 0) return;
      
      // Select a random feature
      const randomFeature = undiscoveredFeatures[Math.floor(Math.random() * undiscoveredFeatures.length)];
      
      // Convert hex coordinates to world position
      const worldPos = CoordinateSystem.hexToWorld(selectedTile.q, selectedTile.r);
      
      // Register the discovery
      const discoveryType = randomFeature.type === FeatureType.HAZARD 
                            ? DiscoveryType.HAZARD 
                            : DiscoveryType.SPECIAL_LOCATION;
      
      this.explorationTracker.registerDiscovery(discoveryType, { x: worldPos.x, y: worldPos.y });
      
      // Mark the feature as discovered
      selectedTile.discoverFeature(randomFeature.type, randomFeature.subType);
      
      // Make sure the area around the feature is visible
      this.fogOfWar.revealArea(selectedTile.q, selectedTile.r, 2);
      
      // Re-render the world
      this.renderWorld();
      this.updateMinimapDisplay();
      
      // Update statistics
      this.updateStatistics();
      
      this.logMessage(`Discovered ${randomFeature.type} (${randomFeature.subType}) at (${selectedTile.q}, ${selectedTile.r})`, 'success');
    } catch (error) {
      this.logMessage(`Error discovering feature: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Discovers a random resource in the world
   */
  private discoverRandomResource(): void {
    if (!this.worldMap || !this.explorationTracker) return;
    
    try {
      // Find tiles with undiscovered resources
      const tilesWithResources = this.worldMap.tiles.filter(tile => 
        tile.resources && 
        tile.resources.length > 0 &&
        tile.resources.some(r => !r.discovered)
      );
      
      if (tilesWithResources.length === 0) {
        this.logMessage('No undiscovered resources left in the world', 'info');
        return;
      }
      
      // Select a random tile with resources
      const randomIndex = Math.floor(Math.random() * tilesWithResources.length);
      const selectedTile = tilesWithResources[randomIndex];
      
      // Find undiscovered resources in the tile
      const undiscoveredResources = selectedTile.resources.filter(r => !r.discovered);
      if (undiscoveredResources.length === 0) return;
      
      // Select a random resource
      const randomResource = undiscoveredResources[Math.floor(Math.random() * undiscoveredResources.length)];
      
      // Convert hex coordinates to world position
      const worldPos = CoordinateSystem.hexToWorld(selectedTile.q, selectedTile.r);
      
      // Register the discovery
      this.explorationTracker.registerDiscovery(DiscoveryType.RESOURCE, { x: worldPos.x, y: worldPos.y });
      
      // Mark the resource as discovered
      selectedTile.discoverResource(randomResource.type);
      
      // Make sure the area around the resource is visible
      this.fogOfWar.revealArea(selectedTile.q, selectedTile.r, 1);
      
      // Re-render the world
      this.renderWorld();
      this.updateMinimapDisplay();
      
      // Update statistics
      this.updateStatistics();
      
      this.logMessage(`Discovered ${randomResource.type} resource (amount: ${randomResource.amount}) at (${selectedTile.q}, ${selectedTile.r})`, 'success');
    } catch (error) {
      this.logMessage(`Error discovering resource: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Updates the statistics display
   */
  private updateStatistics(): void {
    if (!this.explorationTracker || !this.worldMap) return;
    
    try {
      // Calculate exploration percentage
      const explorationPercentage = this.explorationTracker.getExplorationPercentage();
      const statDiscovered = document.getElementById('stat-discovered');
      if (statDiscovered) {
        statDiscovered.textContent = (explorationPercentage * 100).toFixed(1);
      }
      
      // Calculate fully explored tiles percentage
      const exploreCount = this.worldMap.tiles.filter(t => t.explored).length;
      const exploredPercentage = this.worldMap.tiles.length > 0 ? exploreCount / this.worldMap.tiles.length : 0;
      
      const statExplored = document.getElementById('stat-explored');
      if (statExplored) {
        statExplored.textContent = (exploredPercentage * 100).toFixed(1);
      }
      
      // Get discovery statistics
      const stats = this.explorationTracker.getDiscoveryStatistics();
      const statDiscoveries = document.getElementById('stat-discoveries');
      if (statDiscoveries) {
        statDiscoveries.textContent = stats.total.toString();
      }
      
      // Resource count
      const resourceCount = (stats.byType[DiscoveryType.RESOURCE] || 0);
      const statResources = document.getElementById('stat-resources');
      if (statResources) {
        statResources.textContent = resourceCount.toString();
      }
      
      // Feature count (combining all feature types)
      const featureCount = (stats.byType[DiscoveryType.SPECIAL_LOCATION] || 0) + 
                          (stats.byType[DiscoveryType.ANOMALY] || 0);
      
      const statFeatures = document.getElementById('stat-features');
      if (statFeatures) {
        statFeatures.textContent = featureCount.toString();
      }
    } catch (error) {
      this.logMessage(`Error updating statistics: ${error.message}`, 'error');
      console.error(error);
    }
  }
  
  /**
   * Runs verification tests on the exploration system
   */
  private runVerificationTests(): void {
    this.logMessage('Running verification tests...', 'info');
    
    if (!this.worldMap || !this.fogOfWar || !this.explorationTracker) {
      this.logMessage('Cannot run verification tests - world not generated', 'error');
      return;
    }
    
    try {
      let passed = 0;
      let total = 0;
      
      // Test 1: Fog of war reveals correct tiles
      total++;
      const testTile = this.worldMap.tiles[0];
      this.fogOfWar.revealArea(testTile.q, testTile.r, 2);
      const visibility
