/**
 * TerraFlux - UUID Generator
 * 
 * A utility for generating unique identifiers for entities and components.
 * Uses a combination of timestamp, random values, and counter to ensure uniqueness,
 * even when generated in rapid succession.
 */

export class UUID {
  // Counter to ensure uniqueness for multiple IDs generated within the same millisecond
  private static counter: number = 0;
  
  // Last timestamp used - to detect clock issues and ensure ascending order
  private static lastTimestamp: number = 0;
  
  /**
   * Generate a unique identifier string
   * Format: timestamp-random-counter
   * 
   * @returns A string UUID that is guaranteed to be unique
   */
  public static generate(): string {
    // Get current timestamp
    let timestamp = Date.now();
    
    // Check for clock drift or multiple calls within same millisecond
    if (timestamp <= UUID.lastTimestamp) {
      // Use the last timestamp and increment counter to ensure uniqueness
      timestamp = UUID.lastTimestamp;
      UUID.counter++;
    } else {
      // New millisecond, reset counter
      UUID.counter = 0;
      UUID.lastTimestamp = timestamp;
    }
    
    // Generate a random part
    const random = Math.floor(Math.random() * 0x100000).toString(16).padStart(5, '0');
    
    // Format: base36 timestamp + random hex + counter
    return `${timestamp.toString(36)}-${random}-${UUID.counter.toString(36)}`;
  }
  
  /**
   * Generate a unique identifier with a specific prefix
   * Useful for debugging and identifying entity types
   * 
   * @param prefix A string prefix to prepend to the UUID
   * @returns A prefixed unique identifier
   */
  public static generateWithPrefix(prefix: string): string {
    return `${prefix}-${UUID.generate()}`;
  }
  
  /**
   * Generate an entity ID with an optional type hint
   * 
   * @param entityType Optional type hint for debugging
   * @returns Entity ID string
   */
  public static generateEntityId(entityType?: string): string {
    return entityType 
      ? UUID.generateWithPrefix(`ent-${entityType}`)
      : UUID.generateWithPrefix('ent');
  }
  
  /**
   * Generate a component type ID
   * 
   * @param componentName The name of the component
   * @returns Component type ID string
   */
  public static generateComponentId(componentName: string): string {
    // Clean the component name to make it URL-safe
    const safeName = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
      
    return `comp-${safeName}-${UUID.generate()}`;
  }
  
  /**
   * Generate a system ID
   * 
   * @param systemName The name of the system
   * @returns System ID string
   */
  public static generateSystemId(systemName: string): string {
    // Clean the system name to make it URL-safe
    const safeName = systemName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
      
    return `sys-${safeName}-${UUID.generate()}`;
  }
  
  /**
   * Validate if a string is a properly formatted UUID
   * 
   * @param id The string to validate
   * @returns True if the string is a valid UUID format
   */
  public static isValid(id: string): boolean {
    // Basic validation for our UUID format
    return /^[a-z]+-[a-z0-9]+-[a-z0-9]{5}-[a-z0-9]+$/.test(id);
  }
}
