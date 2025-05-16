/**
 * TerraFlux - Velocity Component
 * 
 * Represents velocity in 2D space.
 */

import { UUID } from '../core/utils/UUID';
import { Component } from '../core/ecs/Component';
import { componentRegistry } from '../core/utils/TypeRegistry';

// Component ID
export const VELOCITY_COMPONENT_ID = 'velocity';

// Velocity component
export class VelocityComponent extends Component {
  // Type ID of this component
  public readonly typeId = VELOCITY_COMPONENT_ID;
  
  // Velocity data
  public vx: number = 0;
  public vy: number = 0;
  
  constructor(vx = 0, vy = 0) {
    super();
    this.vx = vx;
    this.vy = vy;
  }
  
  // Clone the component
  public clone(): VelocityComponent {
    return new VelocityComponent(this.vx, this.vy);
  }
  
  // Reset component to its initial state
  public reset(): void {
    this.vx = 0;
    this.vy = 0;
  }
  
  // Serialize component data
  public serialize(): Record<string, any> {
    return {
      ...super.serialize(),
      vx: this.vx,
      vy: this.vy
    };
  }
  
  // Deserialize component data
  public deserialize(data: Record<string, any>): void {
    super.deserialize(data);
    this.vx = data.vx ?? 0;
    this.vy = data.vy ?? 0;
  }
}

// Register the velocity component
componentRegistry.register({
  id: VELOCITY_COMPONENT_ID,
  name: 'Velocity',
  create: () => new VelocityComponent()
});
