/**
 * TerraFlux - Render System
 * 
 * Handles rendering of all entities with Renderable components.
 * Manages sprite creation, position updates, and special effects.
 */

import * as PIXI from 'pixi.js';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Entity';
import { SystemPriority } from '../../core/ecs/types';
import { eventEmitter } from '../../core/ecs/EventEmitter';
import { entityManager } from '../../core/ecs/EntityManager';
import { Renderable } from '../../components/Renderable';
import { POSITION_COMPONENT_ID, PositionComponent } from '../../components/Position';
import { HEX_POSITION_COMPONENT_ID, HexPositionComponent } from '../../components/HexPosition';
import { RenderLayerType, RenderEventType } from '../types';
import { renderManager } from '../RenderManager';
import { textureManager } from '../TextureManager';

/**
 * System that handles rendering of all entities with Renderable components
 */
export class RenderSystem extends System {
  /**
   * System ID
   */
  public static readonly ID = 'RenderSystem';
  
  /**
   * Entities with Renderable components that need processing
   */
  private _renderableEntities: Map<string, Entity> = new Map();
  
  /**
   * Tracking objects that are pending attachment
   */
  private _pendingAttachments: Renderable[] = [];
  
  /**
   * Time accumulator for animation
   */
  private _timeAccumulator: number = 0;
  
  /**
   * Whether the system has been initialized
   */
  private _initialized: boolean = false;
  
  /**
   * Constructor
   */
  constructor() {
    super({
      name: RenderSystem.ID,
      priority: SystemPriority.NORMAL,
      query: {
        withComponents: [Renderable.TYPE_ID] // Use the correct TYPE_ID
      }
    });
  }
  
  /**
   * Initialize this system
   */
  protected onInitialize(): boolean {
    if (this._initialized) return true;
    
    // Register for entity events
    this._registerEventHandlers();
    
    // Find all entities with Renderable components
    this._findAllRenderableEntities();
    
    this._initialized = true;
    return true;
  }
  
  /**
   * Register event handlers
   */
  private _registerEventHandlers(): void {
    // Listen for component added events
    eventEmitter.subscribe('component_added', (entity: Entity, componentId: string) => {
      if (componentId === Renderable.TYPE_ID) {
        this._renderableEntities.set(entity.id, entity);
      }
    });
    
    // Listen for component removed events
    eventEmitter.subscribe('component_removed', (entity: Entity, componentId: string) => {
      if (componentId === Renderable.TYPE_ID) {
        this._renderableEntities.delete(entity.id);
        
        // Get the renderable component that was removed
        const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable | undefined;
        
        // If component still attached to entity, detach its display object
        if (renderable && renderable.attached && renderable.displayObject) {
          this._detachFromRenderer(renderable);
        }
      }
    });
    
    // Listen for entity destroyed events
    eventEmitter.subscribe('entity_destroyed', (entity: Entity) => {
      this._renderableEntities.delete(entity.id);
    });
    
    // Listen for renderer events
    eventEmitter.subscribe(RenderEventType.INITIALIZED, () => {
      // Attach all renderable entities
      for (const entity of this._renderableEntities.values()) {
        const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable;
        if (renderable && !renderable.attached) {
          this._pendingAttachments.push(renderable);
        }
      }
    });
  }
  
  /**
   * Find all entities with Renderable components
   */
  private _findAllRenderableEntities(): void {
    const entities = entityManager.getEntitiesWithComponent(Renderable.TYPE_ID);
    for (const entity of entities) {
      this._renderableEntities.set(entity.id, entity);
    }
  }
  
  /**
   * Called when the system is updated
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   * @param entities Array of entities that match this system's query
   */
  protected onUpdate(deltaTime: number, entities: Entity[]): void {
    if (!this._initialized) return;
    
    // Update time accumulator for animations
    this._timeAccumulator += deltaTime;
    
    // Process pending texture loads and attachments
    this._processAttachments();
    
    // Update all renderable entities
    for (const entity of this._renderableEntities.values()) {
      const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable;
      
      // Skip if no renderable component
      if (!renderable) continue;
      
      // If not attached and has sprite URL, queue for attachment
      if (!renderable.attached && renderable.spriteUrl && !this._pendingAttachments.includes(renderable)) {
        this._pendingAttachments.push(renderable);
        continue;
      }
      
      // Skip if not attached or not visible
      if (!renderable.attached || !renderable.visible) continue;
      
      // Update position based on component if needed
      if (renderable.autoPositionUpdate && renderable.displayObject) {
        this._updatePosition(entity, renderable);
      }
      
      // Update special effects
      this._updateEffects(entity, renderable, deltaTime);
    }
  }
  
  /**
   * Process pending attachments to the renderer
   */
  private _processAttachments(): void {
    // Skip if no pending attachments
    if (this._pendingAttachments.length === 0) return;
    
    // Process a limited number of attachments per frame to avoid freezing
    const maxProcessPerFrame = 5;
    const toProcess = Math.min(this._pendingAttachments.length, maxProcessPerFrame);
    
    for (let i = 0; i < toProcess; i++) {
      const renderable = this._pendingAttachments.shift();
      if (!renderable) continue;
      
      // Get the entity for this renderable
      const entity = this._getEntityForComponent(renderable);
      if (!entity) continue;
      
      // If no display object but has sprite URL, create sprite
      if (!renderable.displayObject && renderable.spriteUrl) {
        renderable.displayObject = textureManager.createSprite(renderable.spriteUrl);
      }
      
      // Skip if no display object
      if (!renderable.displayObject) continue;
      
      // Attach to renderer
      this._attachToRenderer(renderable);
      
      // Update position
      this._updatePosition(entity, renderable);
    }
  }
  
  /**
   * Attach a renderable's display object to the renderer
   * 
   * @param renderable Renderable component to attach
   */
  private _attachToRenderer(renderable: Renderable): void {
    if (!renderable.displayObject) return;
    
    // Add to appropriate layer
    const success = renderManager.addToLayer(renderable.displayObject, renderable.layer);
    
    if (success) {
      // Mark as attached
      renderable.attached = true;
      renderable.needsAttach = false;
      
      // Set visibility
      renderable.displayObject.visible = renderable.visible;
      
      // Set sort value/zIndex
      if ('zIndex' in renderable.displayObject) {
        renderable.displayObject.zIndex = renderable.sortValue;
      }
    }
  }
  
  /**
   * Detach a renderable's display object from the renderer
   * 
   * @param renderable Renderable component to detach
   */
  private _detachFromRenderer(renderable: Renderable): void {
    if (!renderable.displayObject) return;
    
    // Remove from renderer
    renderManager.removeFromLayer(renderable.displayObject);
    
    // Mark as detached
    renderable.attached = false;
  }
  
  /**
   * Update a renderable's position based on the entity's position component
   * 
   * @param entity Entity to update position for
   * @param renderable Renderable component to update
   */
  private _updatePosition(entity: Entity, renderable: Renderable): void {
    if (!renderable.displayObject) return;
    
    // Check for normal Position component first
    const position = entity.getComponent(POSITION_COMPONENT_ID) as PositionComponent | undefined;
    
    if (position) {
      // Set display object position
      renderable.displayObject.position.x = position.x;
      renderable.displayObject.position.y = position.y;
      
      // We'll just use Y for sorting in 2D for now
      renderable.sortValue = position.y;
      
      if ('zIndex' in renderable.displayObject) {
        renderable.displayObject.zIndex = renderable.sortValue;
      }
      return;
    }
    
    // If no Position component, check for HexPosition
    const hexPosition = entity.getComponent(HEX_POSITION_COMPONENT_ID) as HexPositionComponent | undefined;
    
    if (hexPosition) {
      // Convert hex position to world coordinates using the component's utility method
      const worldPos = hexPosition.toWorld();
      
      // Set display object position
      renderable.displayObject.position.x = worldPos.x;
      renderable.displayObject.position.y = worldPos.y;
      
      // Use Y coordinate for sorting
      renderable.sortValue = worldPos.y;
      
      if ('zIndex' in renderable.displayObject) {
        renderable.displayObject.zIndex = renderable.sortValue;
      }
    }
  }
  
  /**
   * Update special effects for a renderable
   * 
   * @param entity Entity to update effects for
   * @param renderable Renderable component to update
   * @param deltaTime Time elapsed since last update in seconds
   */
  private _updateEffects(entity: Entity, renderable: Renderable, deltaTime: number): void {
    if (!renderable.displayObject) return;
    
    // Apply hover effect
    if (renderable.hoverHeight > 0) {
      // Calculate hover offset using sine wave
      const hoverOffset = Math.sin(this._timeAccumulator * renderable.hoverSpeed * Math.PI) * renderable.hoverHeight;
      
      // Get base position
      let baseY = renderable.displayObject.position.y;
      
      // Adjust for hover offset
      if (renderable.customData.baseY !== undefined) {
        baseY = renderable.customData.baseY;
      } else {
        // Store original base Y position
        renderable.customData.baseY = baseY;
      }
      
      // Apply hover offset
      renderable.displayObject.position.y = baseY - hoverOffset;
    }
    
    // Apply crystalline effect if enabled
    if (renderable.crystallineIntensity > 0) {
      // Check if we already have a filter
      let filter = renderable.customData.crystallineFilter as PIXI.ColorMatrixFilter | undefined;
      
      // Create filter if it doesn't exist
      if (!filter) {
        // For now, use a simple ColorMatrixFilter as a placeholder
        // In a real implementation, this would be a custom shader
        filter = new PIXI.ColorMatrixFilter();
        renderable.customData.crystallineFilter = filter;
        
        // Add filter to display object
        renderable.displayObject.filters = [
          ...(renderable.displayObject.filters || []),
          filter
        ];
      }
      
      // Update filter parameters based on intensity
      // This is a simple hue rotation effect as a placeholder
      const intensity = renderable.crystallineIntensity;
      const hueRotation = this._timeAccumulator * 20 * intensity;
      filter.matrix = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
      ];
    }
    
    // Apply energy glow effect if enabled
    if (renderable.energyGlowIntensity > 0) {
      // Similar to crystalline effect, we'd use a custom filter
      // For now, just use a simple glow placeholder
      let filter = renderable.customData.energyGlowFilter as PIXI.ColorMatrixFilter | undefined;
      
      if (!filter) {
        // Use a simple ColorMatrixFilter as a placeholder
        filter = new PIXI.ColorMatrixFilter();
        renderable.customData.energyGlowFilter = filter;
        
        // Add filter to display object if no crystalline filter
        if (!renderable.customData.crystallineFilter) {
          renderable.displayObject.filters = [
            ...(renderable.displayObject.filters || []),
            filter
          ];
        }
      }
      
      // Update filter parameters based on intensity
      // This is a simple brightness pulsing effect as a placeholder
      const intensity = renderable.energyGlowIntensity;
      const pulse = 0.5 + Math.sin(this._timeAccumulator * 5) * 0.5;
      const brightness = 1 + pulse * intensity;
      filter.matrix = [
        brightness, 0, 0, 0, 0,
        0, brightness, 0, 0, 0,
        0, 0, brightness, 0, 0,
        0, 0, 0, 1, 0
      ];
    }
  }
  
  /**
   * Get the entity that owns a renderable component
   * 
   * @param renderable Renderable component to find the entity for
   * @returns The entity or undefined if not found
   */
  private _getEntityForComponent(renderable: Renderable): Entity | undefined {
    for (const entity of this._renderableEntities.values()) {
      const entityRenderable = entity.getComponent(Renderable.TYPE_ID) as Renderable;
      if (entityRenderable === renderable) {
        return entity;
      }
    }
    return undefined;
  }
  
  /**
   * Clean up the system
   */
  protected onDestroy(): void {
    // Detach all renderables
    for (const entity of this._renderableEntities.values()) {
      const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable;
      if (renderable && renderable.attached) {
        this._detachFromRenderer(renderable);
      }
    }
    
    // Clear maps and arrays
    this._renderableEntities.clear();
    this._pendingAttachments.length = 0;
    
    // In real implementation we would track subscription tokens and unsubscribe
    this._initialized = false;
  }
  
  /**
   * Show or hide a specific rendering layer
   * 
   * @param layerType Layer to change visibility
   * @param visible Whether the layer should be visible
   */
  public setLayerVisibility(layerType: RenderLayerType, visible: boolean): void {
    renderManager.setLayerVisibility(layerType, visible);
  }
  
  /**
   * Toggle the visibility of a specific rendering layer
   * 
   * @param layerType Layer to toggle visibility
   * @returns New visibility state
   */
  public toggleLayerVisibility(layerType: RenderLayerType): boolean {
    const layer = renderManager.getLayerManager().getLayer(layerType);
    const newVisibility = layer ? !layer.visible : false;
    renderManager.setLayerVisibility(layerType, newVisibility);
    return newVisibility;
  }
  
  /**
   * Toggle debug visualization
   * 
   * @param enabled Whether debug visualization should be enabled
   */
  public setDebugVisualization(enabled: boolean): void {
    renderManager.setLayerVisibility(RenderLayerType.DEBUG, enabled);
  }
}

// Create a singleton instance
export const renderSystem = new RenderSystem();
