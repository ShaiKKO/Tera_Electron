/**
 * TerraFlux - Animation System
 * 
 * Handles updating animations for entities with Animated components.
 * Works with the RenderSystem to update sprites based on animation states.
 */

import { System } from '../../core/ecs/System';
import { Entity } from '../../core/ecs/Entity';
import { SystemPriority } from '../../core/ecs/types';
import { eventEmitter } from '../../core/ecs/EventEmitter';
import { entityManager } from '../../core/ecs/EntityManager';
import { Animated } from '../../components/Animated';
import { Renderable } from '../../components/Renderable';
import { textureManager } from '../TextureManager';

/**
 * System that handles updating animations for entities
 */
export class AnimationSystem extends System {
  /**
   * System ID
   */
  public static readonly ID = 'AnimationSystem';
  
  /**
   * Entities with Animated components that need updating
   */
  private _animatedEntities: Map<string, Entity> = new Map();
  
  /**
   * Whether the system has been initialized
   */
  private _initialized: boolean = false;
  
  /**
   * Constructor
   */
  constructor() {
    super({
      name: AnimationSystem.ID,
      // Animation should run before rendering
      priority: SystemPriority.HIGH,
      query: {
        withComponents: [Animated.TYPE_ID, Renderable.TYPE_ID]
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
    
    // Find all entities with both Animated and Renderable components
    this._findAllAnimatedEntities();
    
    this._initialized = true;
    return true;
  }
  
  /**
   * Register event handlers
   */
  private _registerEventHandlers(): void {
    // Add entities with Animated component
    eventEmitter.subscribe('component_added', (entity: Entity, componentId: string) => {
      if (componentId === Animated.TYPE_ID) {
        // Only add if it also has a Renderable component
        if (entity.getComponent(Renderable.TYPE_ID)) {
          this._animatedEntities.set(entity.id, entity);
        }
      } else if (componentId === Renderable.TYPE_ID) {
        // If Renderable was added, check if entity already has Animated
        if (entity.getComponent(Animated.TYPE_ID)) {
          this._animatedEntities.set(entity.id, entity);
        }
      }
    });
    
    // Remove entities that lose either component
    eventEmitter.subscribe('component_removed', (entity: Entity, componentId: string) => {
      if (componentId === Animated.TYPE_ID || componentId === Renderable.TYPE_ID) {
        this._animatedEntities.delete(entity.id);
      }
    });
    
    // Remove destroyed entities
    eventEmitter.subscribe('entity_destroyed', (entity: Entity) => {
      this._animatedEntities.delete(entity.id);
    });
  }
  
  /**
   * Find all entities with both Animated and Renderable components
   */
  private _findAllAnimatedEntities(): void {
    // Get entities that have both components
    const animatedEntities = [];
    
    // Get all entities with Animated component
    const entitiesWithAnimated = entityManager.getEntitiesWithComponent(Animated.TYPE_ID);
    
    // Filter to only include those that also have Renderable
    for (const entity of entitiesWithAnimated) {
      if (entity.getComponent(Renderable.TYPE_ID)) {
        this._animatedEntities.set(entity.id, entity);
      }
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
    
    // Update all animated entities
    for (const entity of this._animatedEntities.values()) {
      const animated = entity.getComponent(Animated.TYPE_ID) as Animated;
      const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable;
      
      // Skip if either component is missing (shouldn't happen due to our system query)
      if (!animated || !renderable) continue;
      
      // Skip if animation doesn't need update
      if (!animated.needsUpdate) continue;
      
      // Update the animation
      const textureChanged = animated.update(deltaTime);
      
      // If texture changed, update the renderable
      if (textureChanged) {
        this._updateTexture(entity, animated, renderable);
      }
    }
  }
  
  /**
   * Update a renderable's texture based on the current animation frame
   * 
   * @param entity Entity to update
   * @param animated Animated component
   * @param renderable Renderable component
   */
  private _updateTexture(entity: Entity, animated: Animated, renderable: Renderable): void {
    // Get current texture name
    const textureName = animated.currentTexture;
    if (!textureName) return;
    
    // Update renderable's texture
    if (renderable.displayObject && 'texture' in renderable.displayObject) {
      // Get the texture from the TextureManager
      const texture = textureManager.getTexture(textureName);
      
      // Update sprite texture
      if (texture) {
        (renderable.displayObject as any).texture = texture;
        renderable.needsUpdate = true;
      }
    } else if (!renderable.displayObject) {
      // If no display object yet, set sprite URL for later loading
      renderable.spriteUrl = textureName;
      renderable.needsAttach = true;
    }
  }
  
  /**
   * Play an animation on an entity
   * 
   * @param entity Entity to play animation on
   * @param animationName Name of animation to play
   * @param reset Whether to reset the animation if it's already playing
   * @returns Success flag
   */
  public playAnimation(entity: Entity, animationName: string, reset: boolean = false): boolean {
    // Get the animated component
    const animated = entity.getComponent(Animated.TYPE_ID) as Animated | undefined;
    if (!animated) return false;
    
    // Play the animation
    const success = animated.play(animationName, reset);
    
    // If successful, update the texture immediately
    if (success) {
      const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable | undefined;
      if (renderable) {
        this._updateTexture(entity, animated, renderable);
      }
    }
    
    return success;
  }
  
  /**
   * Stop an entity's current animation
   * 
   * @param entity Entity to stop animation for
   */
  public stopAnimation(entity: Entity): void {
    // Get the animated component
    const animated = entity.getComponent(Animated.TYPE_ID) as Animated | undefined;
    if (!animated) return;
    
    // Stop the animation
    animated.stop();
    
    // Update the texture
    const renderable = entity.getComponent(Renderable.TYPE_ID) as Renderable | undefined;
    if (renderable) {
      this._updateTexture(entity, animated, renderable);
    }
  }
  
  /**
   * Set animation playback speed for an entity
   * 
   * @param entity Entity to set speed for
   * @param speed New playback speed
   */
  public setAnimationSpeed(entity: Entity, speed: number): void {
    // Get the animated component
    const animated = entity.getComponent(Animated.TYPE_ID) as Animated | undefined;
    if (!animated) return;
    
    // Set the speed
    animated.setSpeed(speed);
  }
  
  /**
   * Clean up the system
   */
  protected onDestroy(): void {
    // Clear entity map
    this._animatedEntities.clear();
    
    // Reset initialized flag
    this._initialized = false;
  }
}

// Create a singleton instance
export const animationSystem = new AnimationSystem();
