/**
 * TerraFlux - Visual Effect System
 * 
 * Handles updating and rendering visual effects for entities.
 * Manages effect lifetimes, updates effect properties and applies them to rendering.
 */

import * as PIXI from 'pixi.js';
import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Entity';
import { SystemPriority } from '../../core/ecs/types';
import { eventEmitter } from '../../core/ecs/EventEmitter';
import { entityManager } from '../../core/ecs/EntityManager';
import { Renderable } from '../../components/Renderable';
import { VisualEffect, VisualEffectType, VisualEffectProperties } from '../../components/VisualEffect';
import { textureManager } from '../TextureManager';
import { renderManager } from '../RenderManager';
import { RenderLayerType } from '../types';

/**
 * System that handles visual effects for entities
 */
export class VisualEffectSystem extends System {
  /**
   * System ID
   */
  public static readonly ID = 'VisualEffectSystem';
  
  /**
   * Entities with VisualEffect components that need updating
   */
  private _effectEntities: Map<string, Entity> = new Map();
  
  /**
   * Effect display objects (keyed by entity ID + effect ID)
   */
  private _effectDisplayObjects: Map<string, PIXI.DisplayObject> = new Map();
  
  /**
   * Particle emitters
   */
  private _particleEmitters: Map<string, any> = new Map();
  
  /**
   * Whether the system has been initialized
   */
  private _initialized: boolean = false;
  
  /**
   * Text style cache
   */
  private _textStyles: Map<string, PIXI.TextStyle> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    super({
      name: VisualEffectSystem.ID,
      priority: SystemPriority.HIGH, // Run after animations but before rendering
      query: {
        withComponents: [VisualEffect.TYPE_ID]
      }
    });
  }
  
  /**
   * Initialize this system
   */
  protected onInitialize(): boolean {
    if (this._initialized) return true;
    
    // Register event handlers
    this._registerEventHandlers();
    
    // Find all entities with VisualEffect components
    this._findAllEffectEntities();
    
    this._initialized = true;
    return true;
  }
  
  /**
   * Register event handlers
   */
  private _registerEventHandlers(): void {
    // Add entities with VisualEffect component
    eventEmitter.subscribe('component_added', (entity: Entity, componentId: string) => {
      if (componentId === VisualEffect.TYPE_ID) {
        this._effectEntities.set(entity.id, entity);
      }
    });
    
    // Remove entities that lose the component
    eventEmitter.subscribe('component_removed', (entity: Entity, componentId: string) => {
      if (componentId === VisualEffect.TYPE_ID) {
        this._cleanupEntityEffects(entity);
        this._effectEntities.delete(entity.id);
      }
    });
    
    // Remove destroyed entities
    eventEmitter.subscribe('entity_destroyed', (entity: Entity) => {
      this._cleanupEntityEffects(entity);
      this._effectEntities.delete(entity.id);
    });
  }
  
  /**
   * Find all entities with VisualEffect components
   */
  private _findAllEffectEntities(): void {
    // Get all entities with VisualEffect component
    const effectEntities = entityManager.getEntitiesWithComponent(VisualEffect.TYPE_ID);
    
    // Add to tracked entities
    for (const entity of effectEntities) {
      this._effectEntities.set(entity.id, entity);
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
    
    // Update all entities with visual effects
    for (const entity of this._effectEntities.values()) {
      const visualEffect = entity.getComponent(VisualEffect.TYPE_ID) as VisualEffect;
      
      // Skip if no visual effect component
      if (!visualEffect) continue;
      
      // Skip if component doesn't need update
      if (!visualEffect.needsUpdate) continue;
      
      // Update the effects
      const effectsRemoved = visualEffect.update(deltaTime);
      
      // Process effects
      this._processEntityEffects(entity, visualEffect, effectsRemoved);
    }
  }
  
  /**
   * Process visual effects for an entity
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param effectsRemoved Whether any effects were removed during update
   */
  private _processEntityEffects(entity: Entity, visualEffect: VisualEffect, effectsRemoved: boolean): void {
    // Get active effects
    const activeEffects = visualEffect.getActiveEffects();
    
    // Get renderable component if available
    const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable | undefined;
    
    // Process each type of effect
    this._processParticleEffects(entity, visualEffect, renderable);
    this._processTintEffects(entity, visualEffect, renderable);
    this._processTextEffects(entity, visualEffect, renderable);
    this._processScaleEffects(entity, visualEffect, renderable);
    this._processGlowEffects(entity, visualEffect, renderable);
    this._processDistortionEffects(entity, visualEffect, renderable);
    
    // If effects were removed, clean up any orphaned display objects
    if (effectsRemoved) {
      this._cleanupOrphanedEffects(entity, visualEffect);
    }
  }
  
  /**
   * Process particle effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processParticleEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all particle effects
    const particleEffects = visualEffect.getEffectsByType(VisualEffectType.PARTICLES);
    
    // Process each particle effect
    for (const effect of particleEffects) {
      const effectKey = `${entity.id}-${effect.id}`;
      
      // Check if we already have an emitter for this effect
      if (!this._particleEmitters.has(effectKey)) {
        // Create new particle emitter (not actually implemented yet)
        // In a real implementation, we'd initialize a PixiJS particle emitter or similar
        console.log(`Creating particle emitter for effect ${effect.id} on entity ${entity.id}`);
        
        // For now, just create a placeholder display object
        const placeholder = new PIXI.Graphics();
        placeholder.beginFill(0xFFFFFF);
        placeholder.drawCircle(0, 0, 5);
        placeholder.endFill();
        
        // Store display object
        this._effectDisplayObjects.set(effectKey, placeholder);
        
        // Add to effects layer
        renderManager.addToLayer(placeholder, RenderLayerType.EFFECTS);
      }
      
      // Update particle emitter properties
      const displayObject = this._effectDisplayObjects.get(effectKey);
      if (displayObject && renderable) {
        // Update position based on entity position and effect offset
        if (renderable.displayObject) {
          displayObject.position.x = renderable.displayObject.position.x + (effect.offsetX ?? 0);
          displayObject.position.y = renderable.displayObject.position.y + (effect.offsetY ?? 0);
        }
        
        // Update other properties like intensity, etc.
        displayObject.alpha = effect.intensity ?? 1.0;
      }
    }
  }
  
  /**
   * Process tint effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processTintEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all tint effects
    const tintEffects = visualEffect.getEffectsByType(VisualEffectType.TINT);
    
    // Skip if no renderable or no display object
    if (!renderable?.displayObject) return;
    
    // Skip if not a sprite or similar object that supports tinting
    if (!('tint' in renderable.displayObject)) return;
    
    // Process each tint effect (combine them)
    if (tintEffects.length > 0) {
      // Get the first tint effect (we could combine multiple tints, but that's complex)
      const effect = tintEffects[0] as import('../../components/VisualEffect').TintEffect;
      
      // Apply tint
      (renderable.displayObject as PIXI.Sprite).tint = effect.color;
      
      // Store original tint for cleanup
      if (renderable.customData.originalTint === undefined) {
        renderable.customData.originalTint = 0xFFFFFF; // Default white
      }
    } else if (renderable.customData.originalTint !== undefined) {
      // Restore original tint
      (renderable.displayObject as PIXI.Sprite).tint = renderable.customData.originalTint;
      delete renderable.customData.originalTint;
    }
  }
  
  /**
   * Process text effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processTextEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all text effects
    const textEffects = visualEffect.getEffectsByType(VisualEffectType.TEXT);
    
    // Process each text effect
    for (const effect of textEffects) {
      const effectKey = `${entity.id}-${effect.id}`;
      
      // Check if we already have a text object for this effect
      if (!this._effectDisplayObjects.has(effectKey)) {
        // Cast to TextEffect to access its properties
        const textEffect = effect as import('../../components/VisualEffect').TextEffect;
        
        // Create text style
        const styleKey = `${textEffect.fontSize || 16}-${textEffect.fontFamily || 'Arial'}-${textEffect.color || 0xFFFFFF}`;
        
        // Reuse text style if we've already created one for these parameters
        let textStyle = this._textStyles.get(styleKey);
        if (!textStyle) {
          textStyle = new PIXI.TextStyle({
            fontFamily: textEffect.fontFamily || 'Arial',
            fontSize: textEffect.fontSize || 16,
            fill: textEffect.color || 0xFFFFFF,
            align: 'center'
          });
          
          // Cache the style
          this._textStyles.set(styleKey, textStyle);
        }
        
        // Create text object
        const text = new PIXI.Text(textEffect.text, textStyle);
        text.anchor.set(0.5, 1); // Anchor at bottom center
        
        // Store display object
        this._effectDisplayObjects.set(effectKey, text);
        
        // Add to effects layer
        renderManager.addToLayer(text, RenderLayerType.EFFECTS);
      }
      
      // Update text object properties
      const displayObject = this._effectDisplayObjects.get(effectKey) as PIXI.Text;
      if (displayObject && renderable?.displayObject) {
        // Update position based on entity position and effect offset
        displayObject.position.x = renderable.displayObject.position.x + (effect.offsetX ?? 0);
        displayObject.position.y = renderable.displayObject.position.y + (effect.offsetY ?? 0);
        
        // Update alpha based on intensity
        displayObject.alpha = effect.intensity ?? 1.0;
      }
    }
  }
  
  /**
   * Process scale effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processScaleEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all scale effects
    const scaleEffects = visualEffect.getEffectsByType(VisualEffectType.SCALE);
    
    // Skip if no renderable or no display object
    if (!renderable?.displayObject) return;
    
    // Process each scale effect (use the first one for simplicity)
    if (scaleEffects.length > 0) {
      const effect = scaleEffects[0] as import('../../components/VisualEffect').ScaleEffect;
      
      // Store original scale if first time applying scale effect
      if (renderable.customData.originalScale === undefined) {
        renderable.customData.originalScale = {
          x: renderable.displayObject.scale.x,
          y: renderable.displayObject.scale.y
        };
      }
      
      // Apply scale
      renderable.displayObject.scale.x = (renderable.customData.originalScale.x * effect.scale);
      renderable.displayObject.scale.y = (renderable.customData.originalScale.y * effect.scale);
    } else if (renderable.customData.originalScale) {
      // Restore original scale
      renderable.displayObject.scale.x = renderable.customData.originalScale.x;
      renderable.displayObject.scale.y = renderable.customData.originalScale.y;
      delete renderable.customData.originalScale;
    }
  }
  
  /**
   * Process glow effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processGlowEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all glow effects
    const glowEffects = visualEffect.getEffectsByType(VisualEffectType.GLOW);
    
    // Skip if no renderable or no display object
    if (!renderable?.displayObject) return;
    
    // Process glow effects - simplified implementation without filters
    if (glowEffects.length > 0) {
      const effect = glowEffects[0] as import('../../components/VisualEffect').GlowEffect;
      
      // Instead of filter, use a simple glow sprite overlay
      const effectKey = `${entity.id}-${effect.id}-glow`;
      
      if (!this._effectDisplayObjects.has(effectKey)) {
        // Create a simple glow sprite (a circle)
        const glow = new PIXI.Graphics();
        const radius = 30; // Base radius
        const alpha = 0.3; // Base alpha
        
        glow.beginFill(effect.color, alpha);
        glow.drawCircle(0, 0, radius);
        glow.endFill();
        
        // Store display object
        this._effectDisplayObjects.set(effectKey, glow);
        
        // Add to effects layer, behind the entity
        renderManager.addToLayer(glow, RenderLayerType.EFFECTS);
      }
      
      // Update glow properties
      const displayObject = this._effectDisplayObjects.get(effectKey);
      if (displayObject && renderable?.displayObject) {
        // Update position based on entity position
        displayObject.position.x = renderable.displayObject.position.x;
        displayObject.position.y = renderable.displayObject.position.y;
        
        // Update alpha based on intensity
        displayObject.alpha = (effect.intensity ?? 1.0) * 0.5;
        
        // Update scale to match entity
        if (renderable.displayObject.scale) {
          displayObject.scale.x = renderable.displayObject.scale.x * 1.5;
          displayObject.scale.y = renderable.displayObject.scale.y * 1.5;
        }
      }
    } else {
      // Remove glow if no longer needed
      const effectKey = `${entity.id}-glow`;
      const displayObject = this._effectDisplayObjects.get(effectKey);
      
      if (displayObject) {
        renderManager.removeFromLayer(displayObject);
        this._effectDisplayObjects.delete(effectKey);
      }
    }
  }
  
  /**
   * Process distortion effects
   * 
   * @param entity Entity to process effects for
   * @param visualEffect Visual effect component
   * @param renderable Optional renderable component
   */
  private _processDistortionEffects(entity: Entity, visualEffect: VisualEffect, renderable?: Renderable): void {
    // Get all distortion effects
    const distortionEffects = visualEffect.getEffectsByType(VisualEffectType.DISTORTION);
    
    // Skip if no renderable or no display object
    if (!renderable?.displayObject) return;
    
    // Process distortion effects - simplified implementation without filters
    if (distortionEffects.length > 0) {
      const effect = distortionEffects[0] as import('../../components/VisualEffect').DistortionEffect;
      
      // Instead of complex displacement, just wiggle the sprite position slightly
      if (!renderable.customData.distortionData) {
        renderable.customData.distortionData = {
          originalX: renderable.displayObject.position.x,
          originalY: renderable.displayObject.position.y,
          time: 0
        };
      }
      
      // Update distortion
      const data = renderable.customData.distortionData;
      data.time += 0.1;
      
      const amplitude = (effect.intensity || 0.5) * 3;
      renderable.displayObject.position.x = data.originalX + Math.sin(data.time) * amplitude;
      renderable.displayObject.position.y = data.originalY + Math.cos(data.time * 1.5) * amplitude;
      
      // Mark renderable as needing update
      renderable.needsUpdate = true;
    } else if (renderable.customData.distortionData) {
      // Reset position
      renderable.displayObject.position.x = renderable.customData.distortionData.originalX;
      renderable.displayObject.position.y = renderable.customData.distortionData.originalY;
      
      // Remove distortion data
      delete renderable.customData.distortionData;
      
      // Mark renderable as needing update
      renderable.needsUpdate = true;
    }
  }
  
  /**
   * Clean up orphaned effects for an entity
   * 
   * @param entity Entity to clean up
   * @param visualEffect Visual effect component
   */
  private _cleanupOrphanedEffects(entity: Entity, visualEffect: VisualEffect): void {
    // Get active effect IDs
    const activeEffectIds = new Set(
      visualEffect.getActiveEffects().map(effect => effect.id)
    );
    
    // Find display objects to remove
    const keysToRemove: string[] = [];
    
    for (const key of this._effectDisplayObjects.keys()) {
      // Check if this display object belongs to this entity
      if (key.startsWith(`${entity.id}-`)) {
        // Extract effect ID from key
        const effectId = key.substring(entity.id.length + 1);
        
        // If effect no longer active, mark for removal
        if (!activeEffectIds.has(effectId)) {
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove orphaned display objects
    for (const key of keysToRemove) {
      const displayObject = this._effectDisplayObjects.get(key);
      if (displayObject) {
        renderManager.removeFromLayer(displayObject);
        this._effectDisplayObjects.delete(key);
      }
      
      // Also remove from particle emitters if applicable
      this._particleEmitters.delete(key);
    }
  }
  
  /**
   * Clean up all effects for an entity
   * 
   * @param entity Entity to clean up
   */
  private _cleanupEntityEffects(entity: Entity): void {
    // Find all display objects for this entity
    const keysToRemove: string[] = [];
    
    for (const key of this._effectDisplayObjects.keys()) {
      // Check if this display object belongs to this entity
      if (key.startsWith(`${entity.id}-`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove display objects
    for (const key of keysToRemove) {
      const displayObject = this._effectDisplayObjects.get(key);
      if (displayObject) {
        renderManager.removeFromLayer(displayObject);
        this._effectDisplayObjects.delete(key);
      }
      
      // Also remove from particle emitters if applicable
      this._particleEmitters.delete(key);
    }
    
    // Clean up renderable customData
    const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable | undefined;
    if (renderable) {
      // Reset tint
      if (renderable.displayObject && 'tint' in renderable.displayObject && 
          renderable.customData.originalTint !== undefined) {
        (renderable.displayObject as PIXI.Sprite).tint = renderable.customData.originalTint;
        delete renderable.customData.originalTint;
      }
      
      // Reset scale
      if (renderable.displayObject && renderable.customData.originalScale) {
        renderable.displayObject.scale.x = renderable.customData.originalScale.x;
        renderable.displayObject.scale.y = renderable.customData.originalScale.y;
        delete renderable.customData.originalScale;
      }
      
      // Reset distortion
      if (renderable.displayObject && renderable.customData.distortionData) {
        renderable.displayObject.position.x = renderable.customData.distortionData.originalX;
        renderable.displayObject.position.y = renderable.customData.distortionData.originalY;
        delete renderable.customData.distortionData;
      }
    }
  }
  
  /**
   * Add a visual effect to an entity
   * 
   * @param entity Entity to add effect to
   * @param effect Effect to add
   * @returns Success flag
   */
  public addEffect(entity: Entity, effect: VisualEffectProperties): boolean {
    // Get visual effect component
    let visualEffect = entity.getComponent(VisualEffect.TYPE_ID) as VisualEffect | undefined;
    
    // Create component if it doesn't exist
    if (!visualEffect) {
      visualEffect = new VisualEffect();
      // Use the addComponent method if available, otherwise fail gracefully
      if ('addComponent' in entity) {
        (entity as any).addComponent(visualEffect);
      } else {
        // Fall back to entityManager if necessary
        console.warn('Entity.addComponent not available, visual effect not added to entity');
        return false;
      }
    }
    
    // Add effect to component
    return visualEffect.addEffect(effect);
  }
  
  /**
   * Remove a visual effect from an entity
   * 
   * @param entity Entity to remove effect from
   * @param effectId ID of effect to remove
   * @returns Success flag
   */
  public removeEffect(entity: Entity, effectId: string): boolean {
    // Get visual effect component
    const visualEffect = entity.getComponent(VisualEffect.TYPE_ID) as VisualEffect | undefined;
    if (!visualEffect) return false;
    
    // Remove effect
    return visualEffect.removeEffect(effectId);
  }
  
  /**
   * Clean up the system
   */
  protected onDestroy(): void {
    // Clean up all effects
    for (const entity of this._effectEntities.values()) {
      this._cleanupEntityEffects(entity);
    }
    
    // Clear maps
    this._effectEntities.clear();
    this._effectDisplayObjects.clear();
    this._particleEmitters.clear();
    this._textStyles.clear();
    
    this._initialized = false;
  }
}

// Create a singleton instance
export const visualEffectSystem = new VisualEffectSystem();
