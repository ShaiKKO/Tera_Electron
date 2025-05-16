/**
 * TerraFlux - Coordinate System
 * 
 * Handles conversions between different coordinate systems:
 * - Hex Coordinates (q, r): Used for the world map
 * - World Coordinates (x, y): Used for rendering in world space
 * - Grid Coordinates (x, y): Used for colony grid-based positioning
 */

/**
 * Coordinate system utility for handling conversions between different coordinate systems
 */
export class CoordinateSystem {
  /**
   * Size of a hex in world units
   * This affects the scale of the rendered hexagons
   */
  private static readonly HEX_SIZE: number = 64;
  
  /**
   * Size of a grid cell in world units
   * This affects the scale of the grid-based colony system
   */
  private static readonly GRID_SIZE: number = 32;

  /**
   * Convert hex coordinates to world position
   * 
   * @param q The q coordinate (axial system)
   * @param r The r coordinate (axial system)
   * @returns World position as {x, y}
   */
  public static hexToWorld(q: number, r: number): { x: number, y: number } {
    const x = this.HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
    const y = this.HEX_SIZE * (3/2 * r);
    return { x, y };
  }
  
  /**
   * Convert world position to hex coordinates
   * 
   * @param x X coordinate in world space
   * @param y Y coordinate in world space
   * @returns Hex coordinates as {q, r}
   */
  public static worldToHex(x: number, y: number): { q: number, r: number } {
    const r = y * 2/3 / this.HEX_SIZE;
    const q = (x - Math.sqrt(3)/2 * r * this.HEX_SIZE) / (Math.sqrt(3) * this.HEX_SIZE);
    
    // Round to nearest hex
    const [q_rounded, r_rounded] = this.cubeRound(q, r, -q-r);
    
    return { q: q_rounded, r: r_rounded };
  }
  
  /**
   * Convert cube coordinates to axial coordinates with proper rounding
   * This ensures we get exact hex coordinates even with floating point inputs
   * 
   * @param q Floating point q coordinate
   * @param r Floating point r coordinate
   * @param s Floating point s coordinate
   * @returns Rounded [q, r] coordinates
   */
  public static cubeRound(q: number, r: number, s: number): [number, number] {
    let rx = Math.round(q);
    let ry = Math.round(r);
    let rz = Math.round(s);
    
    const x_diff = Math.abs(rx - q);
    const y_diff = Math.abs(ry - r);
    const z_diff = Math.abs(rz - s);
    
    // Adjust based on largest delta to maintain q + r + s = 0
    if (x_diff > y_diff && x_diff > z_diff) {
      rx = -ry - rz;
    } else if (y_diff > z_diff) {
      ry = -rx - rz;
    } else {
      rz = -rx - ry;
    }
    
    return [rx, ry];
  }
  
  /**
   * Convert grid coordinates to world position
   * 
   * @param x X coordinate in grid space
   * @param y Y coordinate in grid space
   * @returns World position as {x, y}
   */
  public static gridToWorld(x: number, y: number): { x: number, y: number } {
    return {
      x: x * this.GRID_SIZE,
      y: y * this.GRID_SIZE
    };
  }
  
  /**
   * Convert world position to grid coordinates
   * 
   * @param x X coordinate in world space
   * @param y Y coordinate in world space
   * @returns Grid coordinates as {x, y}
   */
  public static worldToGrid(x: number, y: number): { x: number, y: number } {
    return {
      x: Math.floor(x / this.GRID_SIZE),
      y: Math.floor(y / this.GRID_SIZE)
    };
  }
  
  /**
   * Convert directly from hex coordinates to grid coordinates
   * 
   * @param q The q coordinate (axial system)
   * @param r The r coordinate (axial system)
   * @returns Grid coordinates as {x, y}
   */
  public static hexToGrid(q: number, r: number): { x: number, y: number } {
    const worldPos = this.hexToWorld(q, r);
    return this.worldToGrid(worldPos.x, worldPos.y);
  }
  
  /**
   * Convert directly from grid coordinates to hex coordinates
   * 
   * @param x X coordinate in grid space
   * @param y Y coordinate in grid space
   * @returns Hex coordinates as {q, r}
   */
  public static gridToHex(x: number, y: number): { q: number, r: number } {
    const worldPos = this.gridToWorld(x, y);
    return this.worldToHex(worldPos.x, worldPos.y);
  }
  
  /**
   * Calculate distance between two hex coordinates
   * 
   * @param q1 First hex q coordinate
   * @param r1 First hex r coordinate
   * @param q2 Second hex q coordinate
   * @param r2 Second hex r coordinate
   * @returns Distance in hex units
   */
  public static hexDistance(q1: number, r1: number, q2: number, r2: number): number {
    // Convert to cube coordinates
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    
    // Calculate distance using cube coordinates
    return Math.max(
      Math.abs(q1 - q2),
      Math.abs(r1 - r2),
      Math.abs(s1 - s2)
    );
  }
  
  /**
   * Get all neighboring hex coordinates
   * 
   * @param q The q coordinate
   * @param r The r coordinate
   * @returns Array of neighboring hex coordinates
   */
  public static getHexNeighbors(q: number, r: number): { q: number, r: number }[] {
    // Directions for neighboring hexes in axial coordinates
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 }
    ];
    
    return directions.map(dir => ({
      q: q + dir.q,
      r: r + dir.r
    }));
  }
  
  /**
   * Get hex coordinates in a ring around a center
   * 
   * @param centerQ Center hex q coordinate
   * @param centerR Center hex r coordinate
   * @param radius Radius of the ring
   * @returns Array of hex coordinates forming a ring
   */
  public static getHexRing(centerQ: number, centerR: number, radius: number): { q: number, r: number }[] {
    if (radius === 0) {
      return [{ q: centerQ, r: centerR }];
    }
    
    const results: { q: number, r: number }[] = [];
    
    // Start at the southwest corner
    let q = centerQ - 0;
    let r = centerR + radius;
    
    // Direction vectors for moving around the ring
    const directions = [
      { q: 1, r: -1 },  // Northeast
      { q: 1, r: 0 },   // East
      { q: 0, r: 1 },   // Southeast
      { q: -1, r: 1 },  // Southwest
      { q: -1, r: 0 },  // West
      { q: 0, r: -1 }   // Northwest
    ];
    
    // For each side of the ring
    for (let side = 0; side < 6; side++) {
      // Move along one side
      for (let i = 0; i < radius; i++) {
        results.push({ q, r });
        q += directions[side].q;
        r += directions[side].r;
      }
    }
    
    return results;
  }
  
  /**
   * Get all hex coordinates within a certain radius of a center point
   * 
   * @param centerQ Center hex q coordinate
   * @param centerR Center hex r coordinate
   * @param radius Maximum distance from center
   * @returns Array of hex coordinates within the radius
   */
  public static getHexesInRadius(centerQ: number, centerR: number, radius: number): { q: number, r: number }[] {
    const results: { q: number, r: number }[] = [];
    
    for (let q = centerQ - radius; q <= centerQ + radius; q++) {
      // Calculate r bounds based on hex grid geometry
      const rMin = Math.max(centerR - radius, -q - radius + centerQ + centerR);
      const rMax = Math.min(centerR + radius, -q + radius + centerQ + centerR);
      
      for (let r = rMin; r <= rMax; r++) {
        results.push({ q, r });
      }
    }
    
    return results;
  }
  
  /**
   * Get the size of a hex in world units
   * 
   * @returns The hex size
   */
  public static getHexSize(): number {
    return this.HEX_SIZE;
  }
  
  /**
   * Get the grid cell size in world units
   * 
   * @returns The grid size
   */
  public static getGridSize(): number {
    return this.GRID_SIZE;
  }
}
