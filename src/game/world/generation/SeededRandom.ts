/**
 * TerraFlux - Seeded Random
 * 
 * Provides a deterministic random number generator for consistent
 * world generation across clients.
 */

/**
 * Random number generator with seedable state
 * This implementation ensures consistent results across all clients
 * with the same seed, which is critical for multiplayer.
 */
export class SeededRandom {
  private _state: number;
  
  /**
   * Constructor
   * @param seed - Seed value to initialize the generator
   */
  constructor(seed: number) {
    // Ensure we have a valid seed value
    this._state = Math.floor(seed) || 1;
  }
  
  /**
   * Generate a random number between 0 and 1
   * @returns Random number between 0 and 1
   */
  next(): number {
    // Linear Congruential Generator parameters
    // Using the same parameters as Java's LCG for compatibility
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    
    // Update state
    this._state = (a * this._state + c) % m;
    
    // Return a number between 0 and 1
    return this._state / m;
  }
  
  /**
   * Generate a random integer between min and max (inclusive)
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer between min and max
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Generate a random float between min and max
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Select a random element from an array
   * @param array - The array to select from
   * @returns A random element from the array
   */
  select<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Select a random element from an array with weighted probabilities
   * @param array - The array to select from
   * @param weights - The weights corresponding to each element
   * @returns A random element from the array based on weights
   */
  weightedSelect<T>(array: T[], weights: number[]): T {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = this.next() * totalWeight;
    
    let weightSum = 0;
    for (let i = 0; i < array.length; i++) {
      weightSum += weights[i];
      if (random < weightSum) {
        return array[i];
      }
    }
    
    // Fallback to last element
    return array[array.length - 1];
  }
  
  /**
   * Generate 2D simplex noise
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param scale - Scale factor for the noise
   * @param octaves - Number of octaves to use
   * @param persistence - Persistence value for octaves
   * @returns Noise value (0-1)
   */
  simplex2D(x: number, y: number, scale: number, octaves: number, persistence: number): number {
    // Deterministic noise implementation
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      // Hash the coordinates with the seed and current octave
      const nx = x * scale * frequency;
      const ny = y * scale * frequency;
      const seedOffset = i * 1000;
      
      // Use deterministic hash function for noise
      const hash = Math.sin(nx * 12.9898 + ny * 78.233 + this._state + seedOffset) * 43758.5453;
      const noise = (hash - Math.floor(hash)) * 2 - 1; // Range -1 to 1
      
      value += (noise + 1) / 2 * amplitude; // Range 0 to 1
      maxValue += amplitude;
      
      amplitude *= persistence;
      frequency *= 2;
    }
    
    // Normalize to 0-1
    return value / maxValue;
  }
  
  /**
   * Create a new SeededRandom instance with a derived seed
   * Useful for generating different but still deterministic sequences
   * @param salt - Value to modify the seed with
   * @returns A new SeededRandom instance with a derived seed
   */
  deriveNew(salt: number | string): SeededRandom {
    let saltValue: number;
    
    if (typeof salt === 'string') {
      // Convert string to number by summing char codes
      saltValue = 0;
      for (let i = 0; i < salt.length; i++) {
        saltValue += salt.charCodeAt(i);
      }
    } else {
      saltValue = salt;
    }
    
    // Create new seed as a combination of current state and salt
    const newSeed = (this._state * 31 + saltValue) % 2147483647;
    return new SeededRandom(newSeed);
  }
}
