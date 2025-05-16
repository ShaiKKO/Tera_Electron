/**
 * TerraFlux - Hex Position Component
 * 
 * Represents a position in the hex grid coordinate system.
 */

import { Component } from '../core/ecs/Component';
import { componentRegistry } from '../core/utils/TypeRegistry';
import { CoordinateSystem } from '../core/utils/CoordinateSystem';

// Component ID
export const HEX_POSITION_COMPONENT_ID = 'hexPosition';

// Hex Position component
export class HexPositionComponent extends Component {
  // Type ID of this component
  public readonly typeId = HEX_POSITION_COMPONENT_ID;
  
  // Hex grid coordinates (axial system)
  public q: number = 0;
  public r: number = 0;
  
  constructor(q = 0, r = 0) {
    super();
    this.q = q;
    this.r = r;
  }
  
  /**
   * Clone the component
   */
  public clone(): HexPositionComponent {
    return new HexPositionComponent(this.q, this.r);
  }
  
  /**
   * Reset component to its initial state
   */
  public reset(): void {
    this.q = 0;
    this.r = 0;
  }
  
  /**
   * Get the world position corresponding to this hex position
   */
  public toWorld(): { x: number, y: number } {
    return CoordinateSystem.hexToWorld(this.q, this.r);
  }
  
  /**
   * Set the position from world coordinates
   * 
   * @param x World X coordinate
   * @param y World Y coordinate
   */
  public fromWorld(x: number, y: number): void {
    const hex = CoordinateSystem.worldToHex(x, y);
    this.q = hex.q;
    this.r = hex.r;
  }
  
  /**
   * Get the grid position corresponding to this hex position
   */
  public toGrid(): { x: number, y: number } {
    return CoordinateSystem.hexToGrid(this.q, this.r);
  }
  
  /**
   * Set the position from grid coordinates
   * 
   * @param x Grid X coordinate
   * @param y Grid Y coordinate
   */
  public fromGrid(x: number, y: number): void {
    const hex = CoordinateSystem.gridToHex(x, y);
    this.q = hex.q;
    this.r = hex.r;
  }
  
  /**
   * Calculate the distance to another hex position
   * 
   * @param other The other hex position
   * @returns Distance in hex units
   */
  public distanceTo(other: HexPositionComponent): number {
    return CoordinateSystem.hexDistance(this.q, this.r, other.q, other.r);
  }
  
  /**
   * Get the neighboring hex positions
   * 
   * @returns Array of neighboring hex positions
   */
  public getNeighbors(): { q: number, r: number }[] {
    return CoordinateSystem.getHexNeighbors(this.q, this.r);
  }
  
  /**
   * Serialize component data
   */
  public serialize(): Record<string, any> {
    return {
      ...super.serialize(),
      q: this.q,
      r: this.r
    };
  }
  
  /**
   * Deserialize component data
   */
  public deserialize(data: Record<string, any>): void {
    super.deserialize(data);
    this.q = data.q ?? 0;
    this.r = data.r ?? 0;
  }
}

// Register the hex position component
componentRegistry.register({
  id: HEX_POSITION_COMPONENT_ID,
  name: 'HexPosition',
  create: () => new HexPositionComponent()
});
