/**
 * TerraFlux - Texture Manager
 * 
 * Handles loading, caching, and managing textures for the rendering system.
 * Provides methods for creating sprites, managing texture memory, and applying effects.
 */

import * as PIXI from 'pixi.js';
import { eventEmitter } from '../core/ecs/EventEmitter';
import { RenderEventType } from './types';

/**
 * Options for texture loading
 */
export interface TextureLoadOptions {
  /** Whether to use mipmapping */
  useMipmap?: boolean;
  /** Filtering mode for magnification */
  magFilter?: PIXI.SCALE_MODES;
  /** Filtering mode for minification */
  minFilter?: PIXI.SCALE_MODES;
  /** Wrap mode for texture */
  wrapMode?: PIXI.WRAP_MODES;
  /** Wrap mode for S coordinate */
  wrapModeS?: PIXI.WRAP_MODES;
  /** Wrap mode for T coordinate */
  wrapModeT?: PIXI.WRAP_MODES;
  /** Whether to generate mip levels */
  mipmap?: boolean;
  /** Resolution of the texture */
  resolution?: number;
  /** Whether to use ANISOTROPIC_LEVEL filtering */
  anisotropicLevel?: number;
  /** Placeholder color when texture is loading */
  placeholderColor?: number;
}

/**
 * Default texture loading options
 */
const DEFAULT_TEXTURE_OPTIONS: TextureLoadOptions = {
  useMipmap: true,
  magFilter: PIXI.SCALE_MODES.LINEAR,
  minFilter: PIXI.SCALE_MODES.LINEAR, // PixiJS v6+ uses different enum values
  wrapMode: PIXI.WRAP_MODES.CLAMP,
  mipmap: true,
  resolution: 1,
  anisotropicLevel: 16, // High-quality filtering for textures viewed at oblique angles
};

/**
 * Manager for handling textures and sprite creation
 */
export class TextureManager {
  /**
   * Cache of loaded textures
   */
  private _textureCache: Map<string, PIXI.Texture> = new Map();
  
  /**
   * Cache of sprite sheets
   */
  private _spriteSheetCache: Map<string, PIXI.Spritesheet> = new Map();
  
  /**
   * Default texture to use when a requested texture is not found
   */
  private _fallbackTexture: PIXI.Texture;
  
  /**
   * Whether this manager has been initialized
   */
  private _initialized: boolean = false;
  
  /**
   * Textures that are currently being loaded
   */
  private _pendingTextures: Map<string, Promise<PIXI.Texture>> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    // Create fallback texture
    this._fallbackTexture = this._createFallbackTexture();
    
    // Listen for events
    eventEmitter.subscribe(RenderEventType.RENDER_ERROR, (_, error) => {
      if (error && error.message.includes('context')) {
        // Context loss/recovery - we need to reload textures
        this._handleContextRecovery();
      }
    });
  }
  
  /**
   * Generate fallback texture for missing textures
   */
  private _createFallbackTexture(): PIXI.Texture {
    const size = 64;
    const graphics = new PIXI.Graphics();
    
    // Draw checkerboard pattern
    graphics.beginFill(0xFF00FF);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, size/2, size/2);
    graphics.drawRect(size/2, size/2, size/2, size/2);
    graphics.endFill();
    
    // Add '?' text in the middle
    const text = new PIXI.Text('?', {
      fontFamily: 'Arial',
      fontSize: 32,
      fill: 0xFFFFFF,
      align: 'center'
    });
    text.anchor.set(0.5);
    text.position.set(size / 2, size / 2);
    graphics.addChild(text);
    
    // Generate texture from graphics
    const renderTexture = PIXI.RenderTexture.create({
      width: size,
      height: size
    });
    
    // Render graphics to texture
    const tempApp = new PIXI.Application();
    tempApp.renderer.render(graphics, { renderTexture });
    tempApp.destroy();
    
    return renderTexture;
  }
  
  /**
   * Handle WebGL context recovery
   */
  private _handleContextRecovery(): void {
    // Mark all textures for reloading
    this._textureCache.forEach((texture, url) => {
      if (!texture.destroyed) {
        // Force texture update
        if (texture.baseTexture) {
          texture.baseTexture.update();
        }
      }
    });
    
    // Clear sprite sheet cache
    this._spriteSheetCache.clear();
    
    console.log('TextureManager: Handled context recovery');
  }
  
  /**
   * Load a texture from a URL
   * 
   * @param url URL of the texture to load
   * @param options Options for texture loading
   * @returns Promise that resolves when the texture is loaded
   */
  public async loadTexture(url: string, options: Partial<TextureLoadOptions> = {}): Promise<PIXI.Texture> {
    // Check if already cached
    if (this._textureCache.has(url)) {
      return this._textureCache.get(url)!;
    }
    
    // Check if currently being loaded
    if (this._pendingTextures.has(url)) {
      return this._pendingTextures.get(url)!;
    }
    
    // Merge options with defaults
    const mergedOptions = { ...DEFAULT_TEXTURE_OPTIONS, ...options };
    
    try {
      // Create loading promise
      const loadingPromise = new Promise<PIXI.Texture>((resolve, reject) => {
        // Create base texture from URL with options
        const baseTexture = PIXI.BaseTexture.from(url);
        
        // Set texture options
        if (mergedOptions.wrapMode !== undefined) {
          baseTexture.wrapMode = mergedOptions.wrapMode;
        }
        
        if (mergedOptions.wrapModeS !== undefined) {
          baseTexture.wrapMode = mergedOptions.wrapModeS;
        }
        
        if (mergedOptions.wrapModeT !== undefined) {
          baseTexture.wrapMode = mergedOptions.wrapModeT;
        }
        
        if (mergedOptions.mipmap !== undefined) {
          baseTexture.mipmap = mergedOptions.mipmap ? PIXI.MIPMAP_MODES.ON : PIXI.MIPMAP_MODES.OFF;
        }
        
        if (mergedOptions.anisotropicLevel !== undefined) {
          baseTexture.anisotropicLevel = mergedOptions.anisotropicLevel;
        }
        
        if (mergedOptions.magFilter !== undefined) {
          baseTexture.scaleMode = mergedOptions.magFilter;
        }
        
        if (mergedOptions.resolution !== undefined) {
          baseTexture.resolution = mergedOptions.resolution;
        }
        
        // Create texture from base texture
        const texture = new PIXI.Texture(baseTexture);
        
        // Handle load events
        if (baseTexture.valid) {
          // Texture already loaded
          this._textureCache.set(url, texture);
          this._pendingTextures.delete(url);
          resolve(texture);
        } else {
          // Wait for texture to load
          baseTexture.once('loaded', () => {
            this._textureCache.set(url, texture);
            this._pendingTextures.delete(url);
            resolve(texture);
          });
          
          // Handle load error
          baseTexture.once('error', (error) => {
            console.error(`Failed to load texture: ${url}`, error);
            this._pendingTextures.delete(url);
            reject(error);
          });
        }
      });
      
      // Store in pending textures
      this._pendingTextures.set(url, loadingPromise);
      
      return loadingPromise;
    } catch (error) {
      console.error(`Error loading texture: ${url}`, error);
      this._pendingTextures.delete(url);
      
      // Return fallback texture instead
      return this._fallbackTexture;
    }
  }
  
  /**
   * Get a texture from the cache or load it if not cached
   * 
   * @param url URL of the texture to get
   * @param options Options for texture loading
   * @returns The texture (may be fallback texture if loading fails)
   */
  public getTexture(url: string, options: Partial<TextureLoadOptions> = {}): PIXI.Texture {
    // Check if already cached
    if (this._textureCache.has(url)) {
      return this._textureCache.get(url)!;
    }
    
    // Not cached, start loading
    this.loadTexture(url, options).catch(() => {
      // Error already logged in loadTexture
    });
    
    // While loading, return fallback texture
    return this._getFallbackTextureForUrl(url, options.placeholderColor);
  }
  
  /**
   * Create a sprite from a texture URL
   * 
   * @param url URL of the texture to use
   * @param options Options for texture loading
   * @returns The created sprite
   */
  public createSprite(url: string, options: Partial<TextureLoadOptions> = {}): PIXI.Sprite {
    // Get texture (may be fallback while loading)
    const texture = this.getTexture(url, options);
    
    // Create sprite from texture
    const sprite = new PIXI.Sprite(texture);
    
    // If we're using the fallback texture, update the sprite when the real texture loads
    if (texture === this._fallbackTexture || texture instanceof PIXI.RenderTexture) {
      this.loadTexture(url, options)
        .then((loadedTexture) => {
          sprite.texture = loadedTexture;
        })
        .catch(() => {
          // Error already logged in loadTexture
        });
    }
    
    return sprite;
  }
  
  /**
   * Create a custom fallback texture for a specific URL
   * 
   * @param url URL to create a fallback for
   * @param color Optional color to use
   * @returns Fallback texture
   */
  private _getFallbackTextureForUrl(url: string, color = 0xFF00FF): PIXI.Texture {
    // For now, just return the generic fallback
    return this._fallbackTexture;
    
    // In a more advanced implementation, we could generate a custom texture
    // based on the URL or filename, or use the provided color
  }
  
  /**
   * Load a sprite sheet from a JSON file
   * 
   * @param jsonUrl URL of the sprite sheet JSON file
   * @param options Options for texture loading
   * @returns Promise that resolves when the sprite sheet is loaded
   */
  public async loadSpriteSheet(jsonUrl: string, options: Partial<TextureLoadOptions> = {}): Promise<PIXI.Spritesheet> {
    // Check if already cached
    if (this._spriteSheetCache.has(jsonUrl)) {
      return this._spriteSheetCache.get(jsonUrl)!;
    }
    
    try {
      // Load the JSON file
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`Failed to load sprite sheet JSON: ${jsonUrl}, status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create and load the sprite sheet
      return new Promise<PIXI.Spritesheet>((resolve, reject) => {
        // Determine base path for image
        const baseUrl = jsonUrl.substring(0, jsonUrl.lastIndexOf('/') + 1);
        const imageUrl = baseUrl + data.meta.image;
        
        // Load the texture
        this.loadTexture(imageUrl, options)
          .then((texture) => {
            // Create sprite sheet
            const spriteSheet = new PIXI.Spritesheet(texture.baseTexture, data);
            
            // Parse the sprite sheet (PixiJS v6+ doesn't accept a callback)
            spriteSheet.parse().then(() => {
              // Store in cache
              this._spriteSheetCache.set(jsonUrl, spriteSheet);
              resolve(spriteSheet);
            });
          })
          .catch(reject);
      });
    } catch (error) {
      console.error(`Error loading sprite sheet: ${jsonUrl}`, error);
      throw error;
    }
  }
  
  /**
   * Create a sprite from a sprite sheet frame
   * 
   * @param jsonUrl URL of the sprite sheet JSON file
   * @param frameName Name of the frame to use
   * @param options Options for texture loading
   * @returns Promise that resolves with the created sprite
   */
  public async createSpriteFromSpriteSheet(
    jsonUrl: string, 
    frameName: string, 
    options: Partial<TextureLoadOptions> = {}
  ): Promise<PIXI.Sprite> {
    try {
      // Load the sprite sheet
      const spriteSheet = await this.loadSpriteSheet(jsonUrl, options);
      
      // Get the texture for the frame
      const texture = spriteSheet.textures[frameName];
      
      if (!texture) {
        throw new Error(`Frame not found in sprite sheet: ${frameName}`);
      }
      
      // Create sprite from texture
      return new PIXI.Sprite(texture);
    } catch (error) {
      console.error(`Error creating sprite from sprite sheet: ${jsonUrl}, frame: ${frameName}`, error);
      
      // Return sprite with fallback texture
      return new PIXI.Sprite(this._fallbackTexture);
    }
  }
  
  /**
   * Generate a texture from a Graphics object
   * 
   * @param graphics The graphics object to render to a texture
   * @param options Options for the generated texture
   * @returns The generated texture
   */
  public generateTextureFromGraphics(
    graphics: PIXI.Graphics,
    options: {
      width?: number,
      height?: number,
      resolution?: number,
      region?: PIXI.Rectangle
    } = {}
  ): PIXI.RenderTexture {
    // Determine dimensions
    const width = options.width ?? graphics.width ?? 256;
    const height = options.height ?? graphics.height ?? 256;
    const resolution = options.resolution ?? 1;
    
    // Create render texture
    const renderTexture = PIXI.RenderTexture.create({
      width,
      height,
      resolution
    });
    
    // Render graphics to texture
    const tempApp = new PIXI.Application();
    
    // Render graphics to the texture
    if (options.region) {
      tempApp.renderer.render(graphics, { 
        renderTexture, 
        clear: true,
        transform: new PIXI.Matrix(1, 0, 0, 1, -options.region.x, -options.region.y)
      });
    } else {
      tempApp.renderer.render(graphics, { renderTexture, clear: true });
    }
    
    tempApp.destroy();
    
    return renderTexture;
  }
  
  /**
   * Generate a gradient texture
   * 
   * @param width Width of the texture
   * @param height Height of the texture
   * @param colors Array of colors in the gradient
   * @param vertical Whether the gradient is vertical (true) or horizontal (false)
   * @param stops Optional array of stops (0-1) for each color
   * @returns The generated texture
   */
  public generateGradientTexture(
    width: number,
    height: number,
    colors: number[],
    vertical = false,
    stops?: number[]
  ): PIXI.RenderTexture {
    // Create graphics object
    const graphics = new PIXI.Graphics();
    
    // If no stops provided, distribute colors evenly
    const actualStops = stops || colors.map((_, index) => index / (colors.length - 1));
    
    if (vertical) {
      // Draw vertical gradient
      for (let i = 0; i < colors.length - 1; i++) {
        const startColor = colors[i];
        const endColor = colors[i + 1];
        const startStop = actualStops[i];
        const endStop = actualStops[i + 1];
        
        // Draw gradient segment
        this._drawGradientRect(
          graphics,
          0, Math.floor(startStop * height),
          width, Math.ceil((endStop - startStop) * height),
          startColor, endColor,
          vertical
        );
      }
    } else {
      // Draw horizontal gradient
      for (let i = 0; i < colors.length - 1; i++) {
        const startColor = colors[i];
        const endColor = colors[i + 1];
        const startStop = actualStops[i];
        const endStop = actualStops[i + 1];
        
        // Draw gradient segment
        this._drawGradientRect(
          graphics,
          Math.floor(startStop * width), 0,
          Math.ceil((endStop - startStop) * width), height,
          startColor, endColor,
          vertical
        );
      }
    }
    
    // Generate texture from graphics
    return this.generateTextureFromGraphics(graphics, { width, height });
  }
  
  /**
   * Helper to draw a gradient rectangle
   */
  private _drawGradientRect(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    startColor: number,
    endColor: number,
    vertical: boolean
  ): void {
    // Extract color components
    const startR = (startColor >> 16) & 0xFF;
    const startG = (startColor >> 8) & 0xFF;
    const startB = startColor & 0xFF;
    
    const endR = (endColor >> 16) & 0xFF;
    const endG = (endColor >> 8) & 0xFF;
    const endB = endColor & 0xFF;
    
    // Number of steps to use for gradient
    const steps = vertical ? height : width;
    const stepSize = vertical ? height / steps : width / steps;
    
    // Draw gradient segments
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      
      // Interpolate color
      const r = Math.round(startR + (endR - startR) * ratio);
      const g = Math.round(startG + (endG - startG) * ratio);
      const b = Math.round(startB + (endB - startB) * ratio);
      
      const color = (r << 16) | (g << 8) | b;
      
      // Draw segment
      graphics.beginFill(color);
      if (vertical) {
        graphics.drawRect(x, y + i * stepSize, width, stepSize + 1);
      } else {
        graphics.drawRect(x + i * stepSize, y, stepSize + 1, height);
      }
      graphics.endFill();
    }
  }
  
  /**
   * Clear the texture cache to free memory
   * 
   * @param textures Optional array of texture URLs to remove. If not provided, all textures are removed.
   */
  public clearCache(textures?: string[]): void {
    if (textures) {
      // Remove specific textures
      textures.forEach(url => {
        const texture = this._textureCache.get(url);
        if (texture) {
          if (!texture.destroyed) {
            texture.destroy(true);
          }
          this._textureCache.delete(url);
        }
      });
    } else {
      // Remove all textures
      this._textureCache.forEach(texture => {
        if (!texture.destroyed) {
          texture.destroy(true);
        }
      });
      this._textureCache.clear();
      
      // Clear sprite sheet cache
      this._spriteSheetCache.forEach(spriteSheet => {
        // Sprite sheets don't have a destroy method, base textures are destroyed with textures
      });
      this._spriteSheetCache.clear();
    }
  }
  
  /**
   * Apply a blur filter to a texture
   * 
   * @param texture Texture to apply filter to
   * @param blurAmount Amount of blur to apply
   * @param quality Quality of the blur
   * @returns New texture with blur applied
   */
  public applyBlurFilter(texture: PIXI.Texture, blurAmount: number, quality = 4): PIXI.RenderTexture {
    // Create sprite with texture
    const sprite = new PIXI.Sprite(texture);
    
    // Apply blur filter
    const blurFilter = new PIXI.filters.BlurFilter(blurAmount, quality);
    sprite.filters = [blurFilter];
    
    // Calculate padding needed for blur
    const padding = blurAmount * 2;
    
    // Create render texture with padding
    const renderTexture = PIXI.RenderTexture.create({
      width: texture.width + padding * 2,
      height: texture.height + padding * 2
    });
    
    // Center sprite in render texture
    sprite.position.set(padding, padding);
    
    // Render to texture
    const tempApp = new PIXI.Application();
    tempApp.renderer.render(sprite, { renderTexture, clear: true });
    tempApp.destroy();
    
    return renderTexture;
  }
  
  /**
   * Get the total memory used by textures in bytes
   * 
   * @returns Memory usage in bytes
   */
  public getMemoryUsage(): number {
    let totalMemory = 0;
    
    this._textureCache.forEach(texture => {
      if (texture.baseTexture) {
        // Calculate memory usage based on dimensions and format
        const { width, height } = texture.baseTexture;
        const bytesPerPixel = 4; // Assume RGBA format (4 bytes per pixel)
        totalMemory += width * height * bytesPerPixel;
      }
    });
    
    return totalMemory;
  }
  
  /**
   * Get cached texture count
   * 
   * @returns Number of textures in cache
   */
  public getCachedTextureCount(): number {
    return this._textureCache.size;
  }
}

// Create a singleton instance
export const textureManager = new TextureManager();
