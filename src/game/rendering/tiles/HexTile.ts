/**
 * TerraFlux - Hex Tile Rendering Component
 * 
 * Core class representing a single hexagonal tile in the game world.
 * Each HexTile is a container that manages various visual elements like
 * base tile sprites, overlays, decorations, and hovering elements.
 */

import * as PIXI from 'pixi.js';
import { HexDirection, BiomeType, VisibilityState, SelectionType, ResourceNode } from './types';
import { CoordinateSystem } from '../../core/utils/CoordinateSystem';

/**
 * Represents a single hexagonal tile in the world grid
 */
export class HexTile extends PIXI.Container {
  // Hex grid coordinates
  private _q: number;
  private _r: number;
  
  // Type of biome this tile represents
  private _biomeType: BiomeType;
  
  // Core visual elements
  private _baseTile!: PIXI.Sprite;
  private _overlays: Map<string, PIXI.Sprite>;
  private _decorations: PIXI.Container;
  private _hoveringElements: PIXI.Container;
  
  // Transition edges to adjacent biomes
  private _transitionEdges: Map<HexDirection, BiomeType>;
  
  // State properties
  private _visibilityState: VisibilityState;
  private _selectionState: SelectionType;
  private _resources: ResourceNode[];
  private _animationTime: number;
  
  // Shader filters
  private _crystallineFilter!: PIXI.Filter;
  private _energyFlowFilter!: PIXI.Filter;
  private _selectionFilter!: PIXI.Filter;
  private _fogFilter!: PIXI.Filter;
  
  /**
   * Constructor for HexTile
   * 
   * @param q - q coordinate in axial coordinate system
   * @param r - r coordinate in axial coordinate system
   * @param biomeType - The type of biome this tile represents
   */
  constructor(q: number, r: number, biomeType: BiomeType) {
    super();
    
    this._q = q;
    this._r = r;
    this._biomeType = biomeType;
    
    this._visibilityState = VisibilityState.UNEXPLORED;
    this._selectionState = SelectionType.NONE;
    this._resources = [];
    this._animationTime = 0;
    
    // Initialize containers for visual elements
    this._overlays = new Map<string, PIXI.Sprite>();
    this._decorations = new PIXI.Container();
    this._hoveringElements = new PIXI.Container();
    this._transitionEdges = new Map<HexDirection, BiomeType>();
    
    // Position tile based on axial coordinates
    const position = CoordinateSystem.hexToWorld(q, r);
    this.position.set(position.x, position.y);
    
    // Initialize base structure
    this._initializeBaseStructure();
    
    // Create proper hitArea for interaction
    this._setupHitArea();
  }
  
  /**
   * Initialize the base visual structure of the tile
   */
  private _initializeBaseStructure(): void {
    // Create a temporary placeholder hexagon for the base tile
    this._baseTile = this._createHexagonPlaceholder();
    this.addChild(this._baseTile);
    
    // Add decorations container
    this.addChild(this._decorations);
    
    // Add hovering elements container (slightly above the base)
    this._hoveringElements.position.y = -10; // Float 10px above the tile
    this.addChild(this._hoveringElements);
    
    // Initialize filters
    this._initializeFilters();
  }
  
  /**
   * Creates a simple hexagon shape as a placeholder until proper textures are loaded
   */
  private _createHexagonPlaceholder(): PIXI.Sprite {
    // Create a hexagon graphics object
    const radius = 50; // Hex radius in pixels
    const graphics = new PIXI.Graphics();
    
    // Draw hexagon
    graphics.beginFill(0xcccccc);
    graphics.lineStyle(2, 0x999999);
    
    // Start at top point of hexagon and draw the six sides
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    
    graphics.closePath();
    graphics.endFill();
    
    // Convert to texture and create sprite
    const texture = PIXI.RenderTexture.create({ 
      width: radius * 2 + 4, // Add padding for the line width
      height: radius * 2 + 4
    });
    
    // Center the hexagon in the texture
    graphics.position.set(radius + 2, radius + 2);
    
    // Render graphics to texture
    const renderer = PIXI.autoDetectRenderer() as PIXI.Renderer;
    renderer.render(graphics, { renderTexture: texture });
    
    // Create and return sprite from texture
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    return sprite;
  }
  
  /**
   * Setup the hexagonal hit area for proper interaction detection
   */
  private _setupHitArea(): void {
    const radius = 50; // Match the placeholder radius
    const hitArea = new PIXI.Polygon();
    
    // Create the six points of the hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      hitArea.points.push(x, y);
    }
    
    this.hitArea = hitArea;
    this.interactive = true;
    this.cursor = 'pointer'; // Modern replacement for buttonMode
  }
  
  /**
   * Initialize shader filters for the tile
   */
  private _initializeFilters(): void {
    // For now, we'll use placeholder filters until the proper shaders are implemented
    // These will be replaced with the actual crystalline/energy flow shaders later
    
    // Simple color adjustment filter as placeholder for crystalline effect
    this._crystallineFilter = new PIXI.ColorMatrixFilter();
    
    // Displacement filter as placeholder for energy flow
    const displacementSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    const displacementFilter = new PIXI.DisplacementFilter(displacementSprite);
    displacementFilter.scale.set(10, 10);
    this._energyFlowFilter = displacementFilter;
    
    // Glow filter for selection
    this._selectionFilter = new PIXI.ColorMatrixFilter();
    
    // Adjustment filter for fog of war
    this._fogFilter = new PIXI.ColorMatrixFilter();
    
    // We'll apply appropriate filters based on state later in the update cycle
  }
  
  /**
   * Update the tile's visual state
   * @param deltaTime - Time elapsed since last update in seconds
   */
  public update(deltaTime: number): void {
    // Update animation time
    this._animationTime += deltaTime;
    
    // Update hovering elements position
    this._updateHoveringElements(deltaTime);
    
    // Update shader uniforms
    this._updateShaderUniforms(deltaTime);
  }
  
  /**
   * Update the positions and animation of hovering elements
   */
  private _updateHoveringElements(deltaTime: number): void {
    // Simple bobbing animation for hovering elements
    const hoverOffset = Math.sin(this._animationTime * 2) * 3;
    this._hoveringElements.position.y = -10 + hoverOffset;
    
    // Update rotation of individual elements if they exist
    this._hoveringElements.children.forEach((child, index) => {
      child.rotation = 0.1 * Math.sin(this._animationTime + index * 0.5);
    });
  }
  
  /**
   * Update shader uniforms based on current state and time
   */
  private _updateShaderUniforms(deltaTime: number): void {
    // Update displacement filter as placeholder for energy flow animation
    if (this.filters?.includes(this._energyFlowFilter)) {
      const displacementFilter = this._energyFlowFilter as PIXI.DisplacementFilter;
      displacementFilter.scale.x = Math.sin(this._animationTime) * 10;
      displacementFilter.scale.y = Math.cos(this._animationTime) * 10;
    }
    
    // Update other filter uniforms if needed
    // This will be replaced with proper shader uniform updates later
  }
  
  /**
   * Sets the visibility state of the tile
   * @param visibilityState - The new visibility state
   */
  public setVisibility(visibilityState: VisibilityState): void {
    if (this._visibilityState === visibilityState) return;
    
    this._visibilityState = visibilityState;
    
    // Apply visual changes based on visibility state
    switch (visibilityState) {
      case VisibilityState.VISIBLE:
        this.filters = [this._crystallineFilter, this._energyFlowFilter];
        this.alpha = 1.0;
        break;
        
      case VisibilityState.FOGGY:
        this.filters = [this._crystallineFilter, this._fogFilter];
        this.alpha = 0.7;
        break;
        
      case VisibilityState.UNEXPLORED:
        this.filters = [this._fogFilter];
        this.alpha = 0.5;
        break;
    }
    
    // Update children visibility
    this._decorations.visible = visibilityState !== VisibilityState.UNEXPLORED;
    this._hoveringElements.visible = visibilityState === VisibilityState.VISIBLE;
  }
  
  /**
   * Sets the selection state of the tile
   * @param selectionState - The new selection state
   */
  public setSelection(selectionState: SelectionType): void {
    if (this._selectionState === selectionState) return;
    
    this._selectionState = selectionState;
    
    // Apply visual changes based on selection state
    switch (selectionState) {
      case SelectionType.SELECTED:
        this._applySelectionEffect(0xffffff, 0.5);
        break;
        
      case SelectionType.HIGHLIGHTED:
        this._applySelectionEffect(0x99ff99, 0.3);
        break;
        
      case SelectionType.PATH:
        this._applySelectionEffect(0x99ccff, 0.3);
        break;
        
      case SelectionType.TARGETABLE:
        this._applySelectionEffect(0xffcc99, 0.3);
        break;
        
      case SelectionType.INVALID:
        this._applySelectionEffect(0xff9999, 0.3);
        break;
        
      case SelectionType.NONE:
      default:
        this._removeSelectionEffect();
        break;
    }
  }
  
  /**
   * Apply a selection visual effect
   */
  private _applySelectionEffect(color: number, intensity: number): void {
    // Create a selection overlay if it doesn't exist
    if (!this._overlays.has('selection')) {
      const overlay = new PIXI.Sprite(this._baseTile.texture);
      overlay.anchor.set(0.5);
      overlay.blendMode = PIXI.BLEND_MODES.ADD;
      this._overlays.set('selection', overlay);
      this.addChild(overlay);
    }
    
    const overlay = this._overlays.get('selection')!;
    overlay.tint = color;
    overlay.alpha = intensity;
    overlay.visible = true;
  }
  
  /**
   * Remove selection visual effect
   */
  private _removeSelectionEffect(): void {
    if (this._overlays.has('selection')) {
      const overlay = this._overlays.get('selection')!;
      overlay.visible = false;
    }
  }
  
  /**
   * Adds a transition edge to an adjacent biome
   * @param direction - The direction of the transition
   * @param biomeType - The biome type to transition to
   */
  public setTransitionEdge(direction: HexDirection, biomeType: BiomeType): void {
    this._transitionEdges.set(direction, biomeType);
    // Transition visualization will be implemented later
  }
  
  /**
   * Add a decoration to the tile
   * @param decoration - The PIXI display object to add as decoration
   */
  public addDecoration(decoration: PIXI.DisplayObject): void {
    this._decorations.addChild(decoration);
  }
  
  /**
   * Add a hovering element to the tile
   * @param element - The PIXI display object to add as hovering element
   */
  public addHoveringElement(element: PIXI.DisplayObject): void {
    this._hoveringElements.addChild(element);
  }
  
  /**
   * Sets the base texture for the tile
   * @param texture - The PIXI texture to use
   */
  public setBaseTexture(texture: PIXI.Texture): void {
    this._baseTile.texture = texture;
  }
  
  /**
   * Apply a shader to the tile
   * @param shader - The PIXI filter to apply
   */
  public applyShader(shader: PIXI.Filter): void {
    if (!this.filters) {
      this.filters = [shader];
    } else if (!this.filters.includes(shader)) {
      this.filters.push(shader);
    }
  }
  
  /**
   * Remove a shader from the tile
   * @param shader - The PIXI filter to remove
   */
  public removeShader(shader: PIXI.Filter): void {
    if (this.filters && this.filters.includes(shader)) {
      this.filters = this.filters.filter(f => f !== shader);
      if (this.filters.length === 0) {
        this.filters = null;
      }
    }
  }
  
  /**
   * Creates a pulse animation effect on the tile
   * @param color - Color of the pulse
   * @param duration - Duration of the pulse in seconds
   */
  public pulse(color: number, duration: number): void {
    // Create a pulse overlay if it doesn't exist
    if (!this._overlays.has('pulse')) {
      const overlay = new PIXI.Sprite(this._baseTile.texture);
      overlay.anchor.set(0.5);
      overlay.blendMode = PIXI.BLEND_MODES.ADD;
      this._overlays.set('pulse', overlay);
      this.addChild(overlay);
    }
    
    const overlay = this._overlays.get('pulse')!;
    overlay.tint = color;
    overlay.alpha = 0.7;
    overlay.scale.set(1.0);
    overlay.visible = true;
    
    // Animate the pulse
    // Implement a simple animation without gsap
    const startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      overlay.alpha = 0.7 * (1 - progress);
      overlay.scale.set(1 + 0.3 * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        overlay.visible = false;
      }
    };
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Add resources to the tile
   * @param resource - The resource node to add
   */
  public addResource(resource: ResourceNode): void {
    this._resources.push(resource);
    // Resource visualization will be added later
  }
  
  /**
   * Get the biome type of this tile
   */
  public get biomeType(): BiomeType {
    return this._biomeType;
  }
  
  /**
   * Get the q coordinate
   */
  public get q(): number {
    return this._q;
  }
  
  /**
   * Get the r coordinate
   */
  public get r(): number {
    return this._r;
  }
  
  /**
   * Get the visibility state
   */
  public get visibilityState(): VisibilityState {
    return this._visibilityState;
  }
  
  /**
   * Get the selection state
   */
  public get selectionState(): SelectionType {
    return this._selectionState;
  }
  
  /**
   * Get the resources on this tile
   */
  public get resources(): ResourceNode[] {
    return [...this._resources];
  }
}
