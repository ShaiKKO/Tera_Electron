/**
 * TerraFlux - Position Component
 * 
 * Represents a position in 2D space.
 */

import { UUID } from '../core/utils/UUID';
import { Component } from '../core/ecs/Component';
import { componentRegistry } from '../core/utils/TypeRegistry';

// Component ID
export const POSITION_COMPONENT_ID = 'position';

// Position component
export class PositionComponent extends Component {
  // Type ID of this component
  public readonly typeId = POSITION_COMPONENT_ID;
  
  // Position data
  public x: number = 0;
  public y: number = 0;
  
  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }
  
  // Clone the component
  public clone(): PositionComponent {
    return new PositionComponent(this.x, this.y);
  }
  
  // Reset component to its initial state
  public reset(): void {
    this.x = 0;
    this.y = 0;
  }
  
  // Serialize component data
  public serialize(): Record<string, any> {
    return {
      ...super.serialize(),
      x: this.x,
      y: this.y
    };
  }
  
  // Deserialize component data
  public deserialize(data: Record<string, any>): void {
    super.deserialize(data);
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
  }
}

// Register the position component
componentRegistry.register({
  id: POSITION_COMPONENT_ID,
  name: 'Position',
  create: () => new PositionComponent()
});
