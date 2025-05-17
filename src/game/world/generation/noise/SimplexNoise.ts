/**
 * TerraFlux - Simplex Noise Implementation
 * 
 * This is an implementation of Simplex Noise, a more efficient alternative
 * to Perlin noise. It's adapted for TerraFlux to ensure deterministic
 * results across all clients with the same seed.
 * 
 * Based on the paper by Stefan Gustavson:
 * "Simplex Noise Demystified"
 */

/**
 * Simplex noise implementation optimized for TerraFlux's hex grid
 */
export class SimplexNoise {
  // Permutation table
  private perm: number[] = new Array(512);
  private gradP: number[][] = new Array(512);
  
  // Skewing and unskewing factors for 2D
  private static readonly F2 = 0.5 * (Math.sqrt(3) - 1);
  private static readonly G2 = (3 - Math.sqrt(3)) / 6;
  
  // Gradient vectors for 2D (12 directions)
  private static readonly grad3 = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [1, 0], [-1, 0],
    [0, 1], [0, -1], [0, 1], [0, -1]
  ];

  /**
   * Constructor
   * @param seed - Seed value for noise generation
   */
  constructor(seed: number) {
    // Initialize the permutation table deterministically with the seed
    this.seed(seed);
  }

  /**
   * Seed the noise function for deterministic generation
   * @param seed - Seed value
   */
  public seed(seed: number): void {
    // Create shuffled permutation table
    const p = new Array(256);
    
    // Fill with values 0...255
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Seeded shuffle
    let state = seed || 0;
    for (let i = 255; i > 0; i--) {
      // LCG algorithm similar to our SeededRandom
      state = (state * 1664525 + 1013904223) % 4294967296;
      const j = Math.floor(state / 4294967296 * (i + 1));
      
      // Swap elements
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate for tile wrap
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.gradP[i] = SimplexNoise.grad3[this.perm[i] % 12];
    }
  }

  /**
   * 2D simplex noise
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Noise value (-1 to 1)
   */
  public noise2D(x: number, y: number): number {
    // Find unit grid cell containing point
    const s = (x + y) * SimplexNoise.F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    // Unskew the cell origin back to (x,y) space
    const t = (i + j) * SimplexNoise.G2;
    const X0 = i - t;
    const Y0 = j - t;
    
    // The x,y distances from the cell origin
    const x0 = x - X0;
    const y0 = y - Y0;
    
    // For 2D, the simplex shape is an equilateral triangle
    // Determine which simplex we're in
    let i1: number, j1: number;
    
    if (x0 > y0) {
      // Lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1 = 1;
      j1 = 0;
    } else {
      // Upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1 = 0;
      j1 = 1;
    }
    
    // Offsets for corners
    const x1 = x0 - i1 + SimplexNoise.G2;
    const y1 = y0 - j1 + SimplexNoise.G2;
    const x2 = x0 - 1.0 + 2.0 * SimplexNoise.G2;
    const y2 = y0 - 1.0 + 2.0 * SimplexNoise.G2;
    
    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.gradP[(ii + this.perm[jj]) & 511];
    const gi1 = this.gradP[(ii + i1 + this.perm[(jj + j1) & 255]) & 511];
    const gi2 = this.gradP[(ii + 1 + this.perm[(jj + 1) & 255]) & 511];
    
    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    let n0 = (t0 < 0) ? 0.0 : Math.pow(t0, 4) * this.dot(gi0, [x0, y0]);
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    let n1 = (t1 < 0) ? 0.0 : Math.pow(t1, 4) * this.dot(gi1, [x1, y1]);
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    let n2 = (t2 < 0) ? 0.0 : Math.pow(t2, 4) * this.dot(gi2, [x2, y2]);
    
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70.0 * (n0 + n1 + n2);
  }

  /**
   * Generate "crystalline" patterns - creates more angular, faceted noise
   * with sharp transitions more appropriate for the TerraFlux aesthetic.
   * 
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param angularity - Factor that controls how angular/faceted the pattern is (0-1)
   * @param facets - Number of facet divisions (higher = more crystalline appearance)
   * @returns Crystal noise value (-1 to 1)
   */
  public crystalNoise2D(x: number, y: number, angularity: number = 0.7, facets: number = 6): number {
    // Base noise
    let noise = this.noise2D(x, y);
    
    // For crystalline effect, transform coordinates to polar
    const angle = Math.atan2(y, x);
    const dist = Math.sqrt(x*x + y*y);
    
    // Facet the angle based on the number of facets
    const facetSize = Math.PI * 2 / facets;
    const facetedAngle = Math.floor(angle / facetSize) * facetSize;
    
    // Generate noise with the faceted angle
    const xMod = Math.cos(facetedAngle) * dist;
    const yMod = Math.sin(facetedAngle) * dist;
    const facetedNoise = this.noise2D(xMod, yMod);
    
    // Blend between regular noise and faceted noise based on angularity
    noise = noise * (1 - angularity) + facetedNoise * angularity;
    
    // Add sharpening to create more crystalline edges
    noise = this.sharpen(noise, 0.3 + angularity * 0.5);
    
    return noise;
  }
  
  /**
   * Sharpens the noise, creating more distinct transitions
   * @param value - Input value
   * @param amount - Amount of sharpening (0-1)
   * @returns Sharpened value
   */
  private sharpen(value: number, amount: number): number {
    // Transform to 0-1 range
    const v = (value + 1) * 0.5;
    
    // Apply sharpening function
    const sharpened = Math.pow(Math.abs(v - 0.5) * 2, amount) * 0.5;
    
    // Return to original range with sign preserved
    return (v > 0.5) ? (sharpened * 2 - 1) : (1 - sharpened * 2);
  }

  /**
   * Generate ridge noise, useful for crystalline mountain ranges
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param sharpness - Ridge sharpness (0-1)
   * @returns Ridge noise value (0-1)
   */
  public ridgeNoise2D(x: number, y: number, sharpness: number = 0.5): number {
    // Get base noise
    let n = this.noise2D(x, y);
    
    // Transform noise to create ridges
    n = 1.0 - Math.abs(n);
    
    // Apply sharpness
    n = Math.pow(n, 1.0 + 4.0 * sharpness);
    
    return n;
  }
  
  /**
   * Fractal Brownian Motion (layered noise)
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param octaves - Number of layers
   * @param persistence - How much each layer contributes
   * @param lacunarity - How frequency increases with each octave
   * @param crystalline - Whether to use crystal noise (0-1)
   * @returns FBM noise value (-1 to 1)
   */
  public fbm2D(
    x: number, 
    y: number, 
    octaves: number = 4, 
    persistence: number = 0.5, 
    lacunarity: number = 2.0,
    crystalline: number = 0.0
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    
    // Sum octaves
    for (let i = 0; i < octaves; i++) {
      let noiseValue: number;
      
      // Choose between regular or crystal noise
      if (crystalline > 0) {
        const regular = this.noise2D(x * frequency, y * frequency);
        const crystal = this.crystalNoise2D(x * frequency, y * frequency);
        noiseValue = regular * (1 - crystalline) + crystal * crystalline;
      } else {
        noiseValue = this.noise2D(x * frequency, y * frequency);
      }
      
      total += noiseValue * amplitude;
      maxValue += amplitude;
      
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    // Normalize
    return total / maxValue;
  }
  
  /**
   * Helper function for dot product calculation
   * @param a - First vector
   * @param b - Second vector
   * @returns Dot product
   */
  private dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1];
  }
}
