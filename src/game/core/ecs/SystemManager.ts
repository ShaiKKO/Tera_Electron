/**
 * TerraFlux - System Manager
 * 
 * Manages the lifecycle and execution of all systems.
 * Handles system registration, dependencies, and priority-based execution.
 */

import { System } from './System';
import { SystemId, SystemPriority, SystemDependency } from './types';

/**
 * SystemManager class responsible for managing system lifecycle
 * and priority-based execution
 */
export class SystemManager {
  /**
   * Map of system IDs to systems
   */
  private systems: Map<SystemId, System> = new Map();
  
  /**
   * System dependencies - which systems must run before others
   */
  private dependencies: SystemDependency[] = [];
  
  /**
   * Flag to track if systems are sorted
   */
  private sorted: boolean = true;
  
  /**
   * Ordered list of systems based on priority and dependencies
   */
  private orderedSystems: System[] = [];
  
  /**
   * Add a system to the manager
   * 
   * @param system The system to add
   * @returns True if the system was added successfully
   */
  public addSystem(system: System): boolean {
    // Check if the system is already registered
    if (this.systems.has(system.id)) {
      console.warn(`System with ID '${system.id}' is already registered.`);
      return false;
    }
    
    // Add the system
    this.systems.set(system.id, system);
    
    // Mark as unsorted to trigger re-sorting on the next update
    this.sorted = false;
    
    // Initialize the system
    system.initialize();
    
    return true;
  }
  
  /**
   * Remove a system from the manager
   * 
   * @param systemId The ID of the system to remove
   * @returns True if the system was removed successfully
   */
  public removeSystem(systemId: SystemId): boolean {
    // Check if the system exists
    const system = this.systems.get(systemId);
    if (!system) {
      return false;
    }
    
    // Remove system dependencies
    this.dependencies = this.dependencies.filter(
      dep => dep.dependent !== systemId && dep.dependsOn !== systemId
    );
    
    // Destroy the system
    system.destroy();
    
    // Remove the system
    this.systems.delete(systemId);
    
    // Mark as unsorted to trigger re-sorting on the next update
    this.sorted = false;
    
    return true;
  }
  
  /**
   * Check if a system exists
   * 
   * @param systemId The ID of the system to check
   * @returns True if the system exists
   */
  public hasSystem(systemId: SystemId): boolean {
    return this.systems.has(systemId);
  }
  
  /**
   * Add a dependency between two systems
   * 
   * @param dependency The dependency to add
   * @returns True if the dependency was added successfully
   */
  public addDependency(dependency: SystemDependency): boolean {
    // Verify that both systems exist
    if (!this.hasSystem(dependency.dependent) || !this.hasSystem(dependency.dependsOn)) {
      return false;
    }
    
    // Add the dependency
    this.dependencies.push(dependency);
    
    // Mark as unsorted to trigger re-sorting on the next update
    this.sorted = false;
    
    return true;
  }
  
  /**
   * Sort systems based on priority and dependencies
   */
  private sortSystems(): void {
    if (this.sorted) {
      return;
    }
    
    // Create a map of systems by priority
    const systemsByPriority = new Map<SystemPriority, System[]>();
    
    // Group systems by priority
    for (const system of this.systems.values()) {
      const priority = system.priority;
      if (!systemsByPriority.has(priority)) {
        systemsByPriority.set(priority, []);
      }
      systemsByPriority.get(priority)!.push(system);
    }
    
    // Sort priorities in descending order (higher priorities run first)
    const priorities = Array.from(systemsByPriority.keys()).sort((a, b) => b - a);
    
    // Create the ordered list of systems
    this.orderedSystems = [];
    
    // Add systems to the ordered list based on priority
    for (const priority of priorities) {
      const systems = systemsByPriority.get(priority)!;
      
      // Sort systems within a priority based on dependencies
      const sortedSystems = this.topologicalSort(systems);
      
      // Add to the ordered list
      this.orderedSystems.push(...sortedSystems);
    }
    
    this.sorted = true;
  }
  
  /**
   * Perform a topological sort of systems within a priority based on dependencies
   * 
   * @param systems The systems to sort
   * @returns Sorted array of systems
   */
  private topologicalSort(systems: System[]): System[] {
    // Create a map of system IDs to systems
    const systemMap = new Map<SystemId, System>();
    for (const system of systems) {
      systemMap.set(system.id, system);
    }
    
    // Create a dependency graph for the systems
    const graph = new Map<SystemId, Set<SystemId>>();
    
    // Initialize each system in the graph with an empty set of dependencies
    for (const system of systems) {
      graph.set(system.id, new Set());
    }
    
    // Add dependencies to the graph
    for (const dependency of this.dependencies) {
      // Skip dependencies that don't involve these systems
      if (!systemMap.has(dependency.dependent) || !systemMap.has(dependency.dependsOn)) {
        continue;
      }
      
      // Add the dependency edge
      graph.get(dependency.dependent)!.add(dependency.dependsOn);
    }
    
    // Perform topological sort
    const visited = new Set<SystemId>();
    const temp = new Set<SystemId>();
    const result: System[] = [];
    
    // Visit function for DFS
    const visit = (systemId: SystemId): void => {
      // Skip already visited nodes
      if (visited.has(systemId)) {
        return;
      }
      
      // Check for cycle
      if (temp.has(systemId)) {
        throw new Error(`Circular dependency detected in systems: ${systemId}`);
      }
      
      // Mark as temporarily visited
      temp.add(systemId);
      
      // Visit all dependencies
      for (const dependency of graph.get(systemId)!) {
        visit(dependency);
      }
      
      // Mark as visited
      temp.delete(systemId);
      visited.add(systemId);
      
      // Add to result
      result.unshift(systemMap.get(systemId)!);
    };
    
    // Visit each system
    for (const system of systems) {
      if (!visited.has(system.id)) {
        visit(system.id);
      }
    }
    
    return result;
  }
  
  /**
   * Update all systems
   * 
   * @param deltaTime Time elapsed since the last update in seconds
   */
  public update(deltaTime: number): void {
    // Sort systems if needed
    if (!this.sorted) {
      this.sortSystems();
    }
    
    // Update each system in order
    for (const system of this.orderedSystems) {
      if (system.enabled) {
        system.update(deltaTime);
      }
    }
  }
  
  /**
   * Get all registered systems
   * 
   * @returns Array of all registered systems
   */
  public getAllSystems(): System[] {
    return Array.from(this.systems.values());
  }
  
  /**
   * Get the total number of registered systems
   * 
   * @returns The number of registered systems
   */
  public getSystemCount(): number {
    return this.systems.size;
  }
  
  /**
   * Get the number of enabled systems
   * @returns Number of enabled systems
   */
  public getEnabledSystemCount(): number {
    return Array.from(this.systems.values()).filter(system => system.enabled).length;
  }
  
  /**
   * Clear all systems
   */
  public clear(): void {
    // Destroy all systems
    for (const system of this.systems.values()) {
      system.destroy();
    }
    
    // Clear the collections
    this.systems.clear();
    this.dependencies = [];
    this.orderedSystems = [];
    this.sorted = true;
  }
  
  /**
   * Destroy the system manager and all systems
   */
  public destroy(): void {
    this.clear();
  }
}

// Create a global system manager instance
export const systemManager = new SystemManager();
