/**
 * TerraFlux - Coordinate System Verification
 * 
 * This utility verifies that coordinate conversions work correctly.
 * It performs a series of round-trip conversions and checks for accuracy.
 * Used to satisfy Checkpoint 2.3 in the masterplan.
 */

import { CoordinateSystem } from './CoordinateSystem';

/**
 * Class to verify coordinate conversions work correctly
 */
export class CoordinateSystemVerification {
  /**
   * Run all verification tests
   */
  public static runAllTests(): boolean {
    console.log('===== Coordinate System Verification Tests =====');
    
    const tests = [
      this.testHexToWorldAndBack,
      this.testGridToWorldAndBack,
      this.testHexToGridAndBack,
      this.testNeighborsConsistency,
      this.testHexDistanceProperties,
      this.testRingGeneration,
      this.testRadiusGeneration
    ];
    
    let allPassed = true;
    
    for (const test of tests) {
      const passed = test();
      allPassed = allPassed && passed;
      console.log(`${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
    }
    
    console.log(`===== Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} =====`);
    return allPassed;
  }
  
  /**
   * Test conversion from hex to world and back
   */
  private static testHexToWorldAndBack(): boolean {
    // Test a range of hex coordinates
    const testCoords = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 5, r: -3 },
      { q: -7, r: 4 }
    ];
    
    for (const hex of testCoords) {
      // Convert hex to world
      const world = CoordinateSystem.hexToWorld(hex.q, hex.r);
      
      // Convert world back to hex
      const hexBack = CoordinateSystem.worldToHex(world.x, world.y);
      
      // Check if we got the original coordinates back
      if (hexBack.q !== hex.q || hexBack.r !== hex.r) {
        console.error(`Hex-World-Hex conversion failed for ${JSON.stringify(hex)}`);
        console.error(`  World: ${JSON.stringify(world)}`);
        console.error(`  Hex back: ${JSON.stringify(hexBack)}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Test conversion from grid to world and back
   */
  private static testGridToWorldAndBack(): boolean {
    // Test a range of grid coordinates
    const testCoords = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
      { x: 10, y: -5 },
      { x: -8, y: 12 }
    ];
    
    for (const grid of testCoords) {
      // Convert grid to world
      const world = CoordinateSystem.gridToWorld(grid.x, grid.y);
      
      // Convert world back to grid
      const gridBack = CoordinateSystem.worldToGrid(world.x, world.y);
      
      // Check if we got the original coordinates back
      if (gridBack.x !== grid.x || gridBack.y !== grid.y) {
        console.error(`Grid-World-Grid conversion failed for ${JSON.stringify(grid)}`);
        console.error(`  World: ${JSON.stringify(world)}`);
        console.error(`  Grid back: ${JSON.stringify(gridBack)}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Test conversion from hex to grid and back
   */
  private static testHexToGridAndBack(): boolean {
    // Test a range of hex coordinates
    const testCoords = [
      { q: 0, r: 0 },
      { q: 1, r: 0 },
      { q: 0, r: 1 },
      { q: -1, r: 0 },
      { q: 0, r: -1 },
      { q: 5, r: -3 },
      { q: -7, r: 4 }
    ];
    
    for (const hex of testCoords) {
      // Convert hex to grid
      const grid = CoordinateSystem.hexToGrid(hex.q, hex.r);
      
      // Convert grid to world (intermediate step)
      const world = CoordinateSystem.gridToWorld(grid.x, grid.y);
      
      // Convert world back to hex
      const hexBack = CoordinateSystem.worldToHex(world.x, world.y);
      
      // This conversion might not be exact due to grid quantization
      // but should be close - within 1 hex distance
      const distance = CoordinateSystem.hexDistance(hex.q, hex.r, hexBack.q, hexBack.r);
      if (distance > 1) {
        console.error(`Hex-Grid-Hex conversion too far off for ${JSON.stringify(hex)}`);
        console.error(`  Grid: ${JSON.stringify(grid)}`);
        console.error(`  Hex back: ${JSON.stringify(hexBack)}`);
        console.error(`  Distance: ${distance}`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Test that hex neighbors are consistent
   */
  private static testNeighborsConsistency(): boolean {
    // Test that all neighbors are exactly distance 1 away
    const hex = { q: 3, r: -2 };
    const neighbors = CoordinateSystem.getHexNeighbors(hex.q, hex.r);
    
    // Check each neighbor
    for (const neighbor of neighbors) {
      const distance = CoordinateSystem.hexDistance(hex.q, hex.r, neighbor.q, neighbor.r);
      if (distance !== 1) {
        console.error(`Neighbor not at distance 1: ${JSON.stringify(neighbor)}`);
        console.error(`  Distance: ${distance}`);
        return false;
      }
    }
    
    // Check that we have exactly 6 neighbors
    if (neighbors.length !== 6) {
      console.error(`Wrong number of neighbors: ${neighbors.length} (expected 6)`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Test hex distance properties
   */
  private static testHexDistanceProperties(): boolean {
    // Test distance properties
    const hexes = [
      { q: 0, r: 0 },
      { q: 3, r: -2 },
      { q: -1, r: 5 },
      { q: 7, r: 0 }
    ];
    
    // Test symmetry: d(a,b) = d(b,a)
    for (let i = 0; i < hexes.length; i++) {
      for (let j = i + 1; j < hexes.length; j++) {
        const a = hexes[i];
        const b = hexes[j];
        
        const d1 = CoordinateSystem.hexDistance(a.q, a.r, b.q, b.r);
        const d2 = CoordinateSystem.hexDistance(b.q, b.r, a.q, a.r);
        
        if (d1 !== d2) {
          console.error(`Distance not symmetric: d(${JSON.stringify(a)}, ${JSON.stringify(b)}) = ${d1}, but d(${JSON.stringify(b)}, ${JSON.stringify(a)}) = ${d2}`);
          return false;
        }
      }
    }
    
    // Test triangle inequality: d(a,c) <= d(a,b) + d(b,c)
    for (let i = 0; i < hexes.length; i++) {
      for (let j = 0; j < hexes.length; j++) {
        if (i === j) continue;
        
        for (let k = 0; k < hexes.length; k++) {
          if (i === k || j === k) continue;
          
          const a = hexes[i];
          const b = hexes[j];
          const c = hexes[k];
          
          const dac = CoordinateSystem.hexDistance(a.q, a.r, c.q, c.r);
          const dab = CoordinateSystem.hexDistance(a.q, a.r, b.q, b.r);
          const dbc = CoordinateSystem.hexDistance(b.q, b.r, c.q, c.r);
          
          if (dac > dab + dbc) {
            console.error(`Triangle inequality violated: d(${JSON.stringify(a)}, ${JSON.stringify(c)}) = ${dac} > ${dab} + ${dbc} = d(${JSON.stringify(a)}, ${JSON.stringify(b)}) + d(${JSON.stringify(b)}, ${JSON.stringify(c)})`);
            return false;
          }
        }
      }
    }
    
    return true;
  }
  
  /**
   * Test hex ring generation
   */
  private static testRingGeneration(): boolean {
    const center = { q: 0, r: 0 };
    
    // Test rings of different radii
    for (let radius = 1; radius <= 3; radius++) {
      const ring = CoordinateSystem.getHexRing(center.q, center.r, radius);
      
      // Check that all hexes in the ring are at the correct distance from center
      for (const hex of ring) {
        const distance = CoordinateSystem.hexDistance(center.q, center.r, hex.q, hex.r);
        if (distance !== radius) {
          console.error(`Hex in ring at wrong distance: ${JSON.stringify(hex)}`);
          console.error(`  Expected distance: ${radius}, actual: ${distance}`);
          return false;
        }
      }
      
      // Check that the ring has the correct number of hexes
      // A ring of radius r should have 6*r hexes
      if (ring.length !== 6 * radius) {
        console.error(`Ring has wrong number of hexes: ${ring.length} (expected ${6 * radius})`);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Test hex radius generation
   */
  private static testRadiusGeneration(): boolean {
    const center = { q: 0, r: 0 };
    
    // Test hexes within different radii
    for (let radius = 1; radius <= 3; radius++) {
      const hexes = CoordinateSystem.getHexesInRadius(center.q, center.r, radius);
      
      // Check that all hexes are within the correct distance from center
      for (const hex of hexes) {
        const distance = CoordinateSystem.hexDistance(center.q, center.r, hex.q, hex.r);
        if (distance > radius) {
          console.error(`Hex outside radius: ${JSON.stringify(hex)}`);
          console.error(`  Maximum allowed distance: ${radius}, actual: ${distance}`);
          return false;
        }
      }
      
      // Check that the number of hexes is correct
      // The number of hexes within radius r is 1 + 3r(r+1)
      const expectedCount = 1 + 3 * radius * (radius + 1);
      if (hexes.length !== expectedCount) {
        console.error(`Radius has wrong number of hexes: ${hexes.length} (expected ${expectedCount})`);
        return false;
      }
    }
    
    return true;
  }
}
