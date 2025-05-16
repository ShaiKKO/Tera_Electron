/**
 * TerraFlux - Movement System
 * 
 * Updates entity positions based on their velocities.
 */

import { System, SystemConfig } from '../core/ecs/System';
import { Entity } from '../core/ecs/Entity';
import { POSITION_COMPONENT_ID, PositionComponent } from '../components/Position';
import { VELOCITY_COMPONENT_ID, VelocityComponent } from '../components/Velocity';
import { SystemPriority } from '../core/ecs/types';

/**
 * Movement system configuration
 */
export interface MovementSystemConfig extends SystemConfig {
  // Any additional configuration specific to the movement system
}

/**
 * System that updates entity positions based on velocities
 */
export class MovementSystem extends System {
  /**
   * Constructor for MovementSystem
   * 
   * @param config System configuration
   */
  constructor(config: Partial<MovementSystemConfig> = {}) {
    super({
      name: 'Movement',
      priority: SystemPriority.NORMAL,
      query: {
        withComponents: [POSITION_COMPONENT_ID, VELOCITY_COMPONENT_ID]
      },
      ...config
    });
  }
  
  /**
   * Called during system initialization
   */
  protected onInitialize(): boolean {
    console.log(`[${this.name}] Initialized`);
    return true;
  }
  
  /**
   * Update method called each frame for entities with position and velocity
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   * @param entities Array of entities that match this system's query
   */
  protected onUpdate(deltaTime: number, entities: Entity[]): void {
    // Process all matching entities
    for (const entity of entities) {
      // Get the position and velocity components
      const position = entity.getComponent<PositionComponent>(POSITION_COMPONENT_ID);
      const velocity = entity.getComponent<VelocityComponent>(VELOCITY_COMPONENT_ID);
      
      if (position && velocity) {
        // Update position based on velocity and delta time
        position.x += velocity.vx * deltaTime;
        position.y += velocity.vy * deltaTime;
      }
    }
  }
  
  /**
   * Called when the system is enabled
   */
  protected onEnable(): void {
    console.log(`[${this.name}] Enabled`);
  }
  
  /**
   * Called when the system is disabled
   */
  protected onDisable(): void {
    console.log(`[${this.name}] Disabled`);
  }
  
  /**
   * Called when the system is destroyed
   */
  protected onDestroy(): void {
    console.log(`[${this.name}] Destroyed`);
  }
}
