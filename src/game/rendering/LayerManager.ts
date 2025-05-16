/**
 * TerraFlux - Layer Manager
 * 
 * Manages render layers within PixiJS to control the display order 
 * and organization of game objects.
 */

import * as PIXI from 'pixi.js';
import { RenderLayerType, RenderLayerConfig, LayerChild } from './types';

/**
 * Layer container that extends PIXI.Container with additional properties
 */
export class Layer extends PIXI.Container {
  /** Configuration for this layer */
  public config: RenderLayerConfig;
  
  /**
   * Create a new layer
   * @param config Layer configuration
   */
  constructor(config: RenderLayerConfig) {
    super();
    this.config = config;
    this.name = config.name;
    this.visible = config.visible;
    this.sortableChildren = !!config.sortable;
    
    // Apply any filters if provided
    if (config.filters && config.filters.length > 0) {
      this.filters = config.filters;
    }
  }
  
  /**
   * Custom sort method for layer children
   */
  public sortChildren(): void {
    if (this.config.sortFunction) {
      // Use custom sort function if provided
      this.children.sort(this.config.sortFunction);
    } else if (this.sortableChildren) {
      // Default sort by zIndex
      this.children.sort((a, b) => {
        return (a.zIndex || 0) - (b.zIndex || 0);
      });
    }
  }
}

/**
 * Manages render layers for organizing display objects
 */
export class LayerManager {
  /**
   * Map of layers by name
   */
  private _layers: Map<RenderLayerType, Layer> = new Map();
  
  /**
   * Root container for all layers
   */
  private _root: PIXI.Container;
  
  /**
   * Lookup map to find which layer contains a display object
   */
  private _objectLayerMap: Map<PIXI.DisplayObject, RenderLayerType> = new Map();
  
  /**
   * Constructor for LayerManager
   * 
   * @param root Root container to add layers to
   */
  constructor(root: PIXI.Container) {
    this._root = root;
    // Root container should be sortable to maintain layer order
    this._root.sortableChildren = true;
  }
  
  /**
   * Create a new render layer
   * 
   * @param config Layer configuration
   * @returns The created layer
   */
  public createLayer(config: RenderLayerConfig): Layer {
    // Check if layer already exists
    if (this._layers.has(config.name)) {
      console.warn(`Layer ${config.name} already exists.`);
      return this._layers.get(config.name)!;
    }
    
    // Create new layer
    const layer = new Layer(config);
    
    // Set layer's zIndex
    layer.zIndex = config.zIndex;
    
    // Add layer to root container
    this._root.addChild(layer);
    
    // Store layer in map
    this._layers.set(config.name, layer);
    
    return layer;
  }
  
  /**
   * Get a layer by its type
   * 
   * @param layerType Type of the layer to get
   * @returns The layer or undefined if not found
   */
  public getLayer(layerType: RenderLayerType): Layer | undefined {
    return this._layers.get(layerType);
  }
  
  /**
   * Add a display object to a layer
   * 
   * @param object Display object to add
   * @param layerType Layer to add the object to
   * @returns Whether the object was successfully added
   */
  public addToLayer(object: PIXI.DisplayObject & Partial<LayerChild>, layerType: RenderLayerType): boolean {
    const layer = this._layers.get(layerType);
    
    if (!layer) {
      console.warn(`Layer ${layerType} does not exist.`);
      return false;
    }
    
    // Remove from current layer if already in one
    this.removeFromLayer(object);
    
    // Add to new layer
    layer.addChild(object);
    
    // Store layer reference in object for future operations
    object.layer = layerType;
    
    // Set sort order if provided
    if (typeof object.sortOrder === 'number') {
      object.zIndex = object.sortOrder;
    }
    
    // Store in lookup map
    this._objectLayerMap.set(object, layerType);
    
    return true;
  }
  
  /**
   * Remove a display object from its layer
   * 
   * @param object Display object to remove
   * @returns Whether the object was successfully removed
   */
  public removeFromLayer(object: PIXI.DisplayObject): boolean {
    // Check if object is in a layer
    const layerType = this._objectLayerMap.get(object);
    
    if (!layerType) {
      // Object not in any layer
      return false;
    }
    
    const layer = this._layers.get(layerType);
    
    if (!layer) {
      // Layer doesn't exist anymore
      this._objectLayerMap.delete(object);
      return false;
    }
    
    // Remove from layer
    layer.removeChild(object);
    
    // Remove from lookup map
    this._objectLayerMap.delete(object);
    
    return true;
  }
  
  /**
   * Set the visibility of a layer
   * 
   * @param layerType Layer to change visibility
   * @param visible Whether the layer should be visible
   * @returns Whether the visibility was successfully changed
   */
  public setLayerVisibility(layerType: RenderLayerType, visible: boolean): boolean {
    const layer = this._layers.get(layerType);
    
    if (!layer) {
      console.warn(`Layer ${layerType} does not exist.`);
      return false;
    }
    
    layer.visible = visible;
    return true;
  }
  
  /**
   * Get all layers
   * 
   * @returns Array of all layers
   */
  public getLayers(): Layer[] {
    return Array.from(this._layers.values());
  }
  
  /**
   * Check if a layer exists
   * 
   * @param layerType Layer to check
   * @returns Whether the layer exists
   */
  public hasLayer(layerType: RenderLayerType): boolean {
    return this._layers.has(layerType);
  }
  
  /**
   * Get the layer of a display object
   * 
   * @param object Display object to check
   * @returns The layer type or undefined if not in a layer
   */
  public getObjectLayer(object: PIXI.DisplayObject): RenderLayerType | undefined {
    return this._objectLayerMap.get(object);
  }
  
  /**
   * Clear all display objects from all layers
   */
  public clear(): void {
    // Clear all layers
    this._layers.forEach(layer => {
      layer.removeChildren();
    });
    
    // Clear lookup map
    this._objectLayerMap.clear();
  }
  
  /**
   * Apply filters to a layer
   * 
   * @param layerType Layer to apply filters to
   * @param filters Array of filters to apply
   * @returns Whether the filters were successfully applied
   */
  public applyFilters(layerType: RenderLayerType, filters: PIXI.Filter[]): boolean {
    const layer = this._layers.get(layerType);
    
    if (!layer) {
      console.warn(`Layer ${layerType} does not exist.`);
      return false;
    }
    
    layer.filters = filters;
    return true;
  }
  
  /**
   * Clear filters from a layer
   * 
   * @param layerType Layer to clear filters from
   * @returns Whether the filters were successfully cleared
   */
  public clearFilters(layerType: RenderLayerType): boolean {
    const layer = this._layers.get(layerType);
    
    if (!layer) {
      console.warn(`Layer ${layerType} does not exist.`);
      return false;
    }
    
    layer.filters = null;
    return true;
  }
  
  /**
   * Sort all layers
   */
  public sortLayers(): void {
    this._root.sortChildren();
    
    // Sort children within sortable layers
    this._layers.forEach(layer => {
      if (layer.sortableChildren) {
        layer.sortChildren();
      }
    });
  }
}
