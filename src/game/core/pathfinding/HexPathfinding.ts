/**
 * TerraFlux - Hex Grid Pathfinding
 * 
 * Implements A* pathfinding algorithm for hex grids.
 */

import { CoordinateSystem } from '../utils/CoordinateSystem';

/**
 * Interface for hex grid nodes used in pathfinding
 */
interface HexNode {
  q: number;
  r: number;
  f: number; // Total cost (g + h)
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to goal)
  parent: HexNode | null;
}

/**
 * Interface defining a terrain cost function
 */
export type TerrainCostFunction = (q: number, r: number) => number;

/**
 * Interface defining obstacle checking function
 */
export type ObstacleFunction = (q: number, r: number) => boolean;

/**
 * Options for pathfinding
 */
export interface HexPathfindingOptions {
  /**
   * Maximum path length to search before giving up
   * Default: 100
   */
  maxPathLength?: number;
  
  /**
   * Function that returns the movement cost for a given hex
   * Default: All movement costs 1
   */
  terrainCostFn?: TerrainCostFunction;
  
  /**
   * Function that determines if a hex is an obstacle (not walkable)
   * Default: No obstacles
   */
  isObstacleFn?: ObstacleFunction;
  
  /**
   * Whether to allow diagonal movement between hex tiles
   * Default: false
   */
  allowDiagonal?: boolean;
}

/**
 * Implementation of A* pathfinding algorithm for hex grids
 */
export class HexPathfinding {
  private maxPathLength: number = 100;
  private terrainCostFn: TerrainCostFunction;
  private isObstacleFn: ObstacleFunction;
  private allowDiagonal: boolean = false;
  
  /**
   * Create a new pathfinding instance
   * 
   * @param options Configuration options
   */
  constructor(options: HexPathfindingOptions = {}) {
    this.maxPathLength = options.maxPathLength ?? 100;
    this.terrainCostFn = options.terrainCostFn ?? (() => 1);
    this.isObstacleFn = options.isObstacleFn ?? (() => false);
    this.allowDiagonal = options.allowDiagonal ?? false;
  }
  
  /**
   * Find a path from start to goal hex coordinates
   * 
   * @param startQ Start q coordinate
   * @param startR Start r coordinate
   * @param goalQ Goal q coordinate
   * @param goalR Goal r coordinate
   * @returns Array of hex coordinates forming the path, or null if no path found
   */
  public findPath(startQ: number, startR: number, goalQ: number, goalR: number): { q: number, r: number }[] | null {
    // Quick check for start == goal
    if (startQ === goalQ && startR === goalR) {
      return [{ q: startQ, r: startR }];
    }
    
    // Check if start or goal is an obstacle
    if (this.isObstacleFn(startQ, startR) || this.isObstacleFn(goalQ, goalR)) {
      return null;
    }
    
    // Initialize open and closed lists
    const openList: HexNode[] = [];
    const closedList: Map<string, HexNode> = new Map();
    
    // Create start node
    const startNode: HexNode = {
      q: startQ,
      r: startR,
      f: 0,
      g: 0,
      h: this.heuristic(startQ, startR, goalQ, goalR),
      parent: null
    };
    
    // Add start node to open list
    openList.push(startNode);
    
    // Main pathfinding loop
    while (openList.length > 0) {
      // Sort open list by f-score (lowest first)
      openList.sort((a, b) => a.f - b.f);
      
      // Get the node with the lowest f-score
      const currentNode = openList.shift()!;
      
      // Check if we've reached the goal
      if (currentNode.q === goalQ && currentNode.r === goalR) {
        return this.reconstructPath(currentNode);
      }
      
      // Add current node to closed list
      closedList.set(`${currentNode.q},${currentNode.r}`, currentNode);
      
      // Get neighboring nodes
      const neighbors = this.getNeighbors(currentNode.q, currentNode.r);
      
      for (const neighbor of neighbors) {
        // Skip if neighbor is an obstacle or in the closed list
        if (this.isObstacleFn(neighbor.q, neighbor.r) || 
            closedList.has(`${neighbor.q},${neighbor.r}`)) {
          continue;
        }
        
        // Calculate g-score for this neighbor
        const tentativeG = currentNode.g + this.terrainCostFn(neighbor.q, neighbor.r);
        
        // Check if neighbor is in open list
        const existingIndex = openList.findIndex(node => 
          node.q === neighbor.q && node.r === neighbor.r);
        
        if (existingIndex === -1) {
          // Neighbor is not in open list, add it
          const h = this.heuristic(neighbor.q, neighbor.r, goalQ, goalR);
          openList.push({
            q: neighbor.q,
            r: neighbor.r,
            g: tentativeG,
            h: h,
            f: tentativeG + h,
            parent: currentNode
          });
        } else if (tentativeG < openList[existingIndex].g) {
          // Found a better path to an existing node in the open list
          openList[existingIndex].g = tentativeG;
          openList[existingIndex].f = tentativeG + openList[existingIndex].h;
          openList[existingIndex].parent = currentNode;
        }
      }
      
      // Check if path is getting too long
      if (closedList.size > this.maxPathLength) {
        console.warn(`Pathfinding aborted: Exceeded maximum path length (${this.maxPathLength})`);
        return null;
      }
    }
    
    // No path found
    return null;
  }
  
  /**
   * Calculate the heuristic (estimated distance) between two hex coordinates
   * 
   * @param q1 Start q coordinate
   * @param r1 Start r coordinate
   * @param q2 Goal q coordinate
   * @param r2 Goal r coordinate
   * @returns Estimated distance
   */
  private heuristic(q1: number, r1: number, q2: number, r2: number): number {
    return CoordinateSystem.hexDistance(q1, r1, q2, r2);
  }
  
  /**
   * Get neighboring hex coordinates
   * 
   * @param q Current q coordinate
   * @param r Current r coordinate
   * @returns Array of neighboring coordinates
   */
  private getNeighbors(q: number, r: number): { q: number, r: number }[] {
    return CoordinateSystem.getHexNeighbors(q, r);
  }
  
  /**
   * Reconstruct the path from the goal node
   * 
   * @param goalNode The goal node with parent references
   * @returns Array of hex coordinates forming the path
   */
  private reconstructPath(goalNode: HexNode): { q: number, r: number }[] {
    const path: { q: number, r: number }[] = [];
    let currentNode: HexNode | null = goalNode;
    
    // Walk backwards from goal to start
    while (currentNode !== null) {
      path.unshift({ q: currentNode.q, r: currentNode.r });
      currentNode = currentNode.parent;
    }
    
    return path;
  }
  
  /**
   * Find a path and convert it to world coordinates
   * 
   * @param startQ Start q coordinate
   * @param startR Start r coordinate
   * @param goalQ Goal q coordinate
   * @param goalR Goal r coordinate
   * @returns Array of world positions forming the path, or null if no path found
   */
  public findPathWorld(startQ: number, startR: number, goalQ: number, goalR: number): { x: number, y: number }[] | null {
    const hexPath = this.findPath(startQ, startR, goalQ, goalR);
    
    if (!hexPath) {
      return null;
    }
    
    // Convert hex coordinates to world coordinates
    return hexPath.map(hex => CoordinateSystem.hexToWorld(hex.q, hex.r));
  }
  
  /**
   * Smooth a path to remove unnecessary zigzags
   * 
   * @param path The original path
   * @returns Smoothed path
   */
  public smoothPath(path: { q: number, r: number }[]): { q: number, r: number }[] {
    if (path.length <= 2) {
      return [...path]; // No need to smooth paths of length 0, 1, or 2
    }
    
    const smoothed: { q: number, r: number }[] = [path[0]]; // Start with the first point
    let current = 0;
    
    // Keep examining paths until we reach the end
    while (current < path.length - 1) {
      // Find the furthest point we can see directly
      let furthest = current + 1;
      
      for (let i = current + 2; i < path.length; i++) {
        if (this.hasLineOfSight(path[current].q, path[current].r, path[i].q, path[i].r)) {
          furthest = i;
        }
      }
      
      // Add the furthest visible point to our smoothed path
      if (furthest !== current) {
        smoothed.push(path[furthest]);
        current = furthest;
      } else {
        current++;
      }
    }
    
    return smoothed;
  }
  
  /**
   * Check if there is a clear line of sight between two hex coordinates
   * 
   * @param startQ Start q coordinate
   * @param startR Start r coordinate
   * @param endQ End q coordinate
   * @param endR End r coordinate
   * @returns True if there is a clear line of sight
   */
  private hasLineOfSight(startQ: number, startR: number, endQ: number, endR: number): boolean {
    // Use Bresenham's line algorithm adapted for hex grids
    const line = this.getHexLine(startQ, startR, endQ, endR);
    
    // Check if any point in the line is an obstacle
    for (let i = 1; i < line.length - 1; i++) {
      if (this.isObstacleFn(line[i].q, line[i].r)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get a line of hex coordinates between two hex coordinates
   * 
   * @param startQ Start q coordinate
   * @param startR Start r coordinate
   * @param endQ End q coordinate
   * @param endR End r coordinate
   * @returns Array of hex coordinates forming a line
   */
  private getHexLine(startQ: number, startR: number, endQ: number, endR: number): { q: number, r: number }[] {
    const N = CoordinateSystem.hexDistance(startQ, startR, endQ, endR);
    
    if (N === 0) {
      return [{ q: startQ, r: startR }];
    }
    
    const results: { q: number, r: number }[] = [];
    
    // Convert to cube coordinates for linear interpolation
    const startS = -startQ - startR;
    const endS = -endQ - endR;
    
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      
      // Linear interpolation in cube coordinates
      const q = startQ + (endQ - startQ) * t;
      const r = startR + (endR - startR) * t;
      const s = startS + (endS - startS) * t;
      
      // Round to get exact hex coordinates
      const [roundedQ, roundedR] = CoordinateSystem.cubeRound(q, r, s);
      
      results.push({ q: roundedQ, r: roundedR });
    }
    
    return results;
  }
}
