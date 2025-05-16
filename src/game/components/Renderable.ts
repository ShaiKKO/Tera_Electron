/**
 * TerraFlux - Renderable Component
 * 
 * Component for entities that should be rendered visually.
 * Provides connection between ECS and the rendering system.
 */

import * as PIXI from 'pixi.js';
import { Component } from '../core/ecs/Component';
import { ComponentId } from '../core/ecs/types';
import { RenderLayerType } from '../rendering/types';

/**
 * Properties for Renderable component
 */
export interface RenderableProps {
  /** The layer this entity should be rendered on */
  layer: RenderLayerType;
  /** Sprite or other display object for this entity */
  displayObject?: PIXI.DisplayObject;
  /** Sprite URL to load (alternative to providing a display object) */
  spriteUrl?: string;
  /** Whether the entity is visible */
  visible?: boolean;
  /** Horizontal scale */
  scaleX?: number;
  /** Vertical scale */
  scaleY?: number;
  /** Rotation in radians */
  rotation?: number;
  /** Alpha transparency (0-1) */
  alpha?: number;
  /** Anchor point X (0-1) */
  anchorX?: number;
  /** Anchor point Y (0-1) */
  anchorY?: number;
  /** Blend mode */
  blendMode?: PIXI.BLEND_MODES;
  /** Sort value for controlling draw order within layer */
  sortValue?: number;
  /** Whether to use world coordinates for position (default: true) */
  useWorldCoordinates?: boolean;
  /** Tint color (for sprites) */
  tint?: number;
  /** Whether to automatically update the display object based on position component */
  autoPositionUpdate?: boolean;
  /** Optional fixed width for the sprite */
  width?: number;
  /** Optional fixed height for the sprite */
  height?: number;
  /** Crystalline effect intensity (0-1) */
  crystallineIntensity?: number;
  /** Energy glow effect intensity (0-1) */
  energyGlowIntensity?: number;
  /** Hover height in pixels (0 = no hover) */
  hoverHeight?: number;
  /** Hover animation speed (0-1) */
  hoverSpeed?: number;
}

/**
 * Component for visual representation of entities
 */
export class Renderable extends Component {
  /** Component type ID */
  public static readonly TYPE_ID: ComponentId = 'Renderable';
  
  /** Component type for instance */
  public readonly typeId: ComponentId = Renderable.TYPE_ID;
  
  /** The layer this entity should be rendered on */
  public layer: RenderLayerType;
  
  /** Sprite or other display object for this entity */
  public displayObject: PIXI.DisplayObject | null = null;
  
  /** URL for sprite (if provided instead of display object) */
  public spriteUrl?: string;
  
  /** Whether the entity is currently visible */
  public visible: boolean = true;
  
  /** Whether the display object is currently attached to the renderer */
  public attached: boolean = false;
  
  /** Whether to automatically update the display object based on position component */
  public autoPositionUpdate: boolean = true;
  
  /** Whether to use world coordinates for position (default: true) */
  public useWorldCoordinates: boolean = true;
  
  /** Sort value for controlling draw order within layer */
  public sortValue: number = 0;
  
  /** Crystalline effect intensity (0-1) */
  public crystallineIntensity: number = 0;
  
  /** Energy glow effect intensity (0-1) */
  public energyGlowIntensity: number = 0;
  
  /** Hover height in pixels (0 = no hover) */
  public hoverHeight: number = 0;
  
  /** Hover animation speed (0-1) */
  public hoverSpeed: number = 0.5;
  
  /** Whether the entity needs to be attached to the renderer */
  public needsAttach: boolean = false;
  
  /** Whether the entity needs visual update */
  public needsUpdate: boolean = true;
  
  /** Any additional custom rendering data */
  public customData: Record<string, any> = {};

  /**
   * Constructor
   * 
   * @param props Component properties
   */
  constructor(props: RenderableProps) {
    super();
    
    this.layer = props.layer;
    this.visible = props.visible ?? true;
    this.autoPositionUpdate = props.autoPositionUpdate ?? true;
    this.useWorldCoordinates = props.useWorldCoordinates ?? true;
    this.sortValue = props.sortValue ?? 0;
    this.crystallineIntensity = props.crystallineIntensity ?? 0;
    this.energyGlowIntensity = props.energyGlowIntensity ?? 0;
    this.hoverHeight = props.hoverHeight ?? 0;
    this.hoverSpeed = props.hoverSpeed ?? 0.5;
    
    // Set display object if provided
    if (props.displayObject) {
      this.setDisplayObject(props.displayObject);
      
      // Apply properties to display object
      this.applyPropsToDisplayObject(props);
    } 
    // Otherwise store sprite URL for later loading
    else if (props.spriteUrl) {
      this.spriteUrl = props.spriteUrl;
      this.needsAttach = true;
    }
  }
  
  
  /**
   * Set the display object for this entity
   * 
   * @param displayObject New display object
   */
  public setDisplayObject(displayObject: PIXI.DisplayObject): void {
    // Store reference to display object
    this.displayObject = displayObject;
    
    // Mark as needing update and attach
    this.needsUpdate = true;
    this.needsAttach = true;
  }
  
  /**
   * Apply rendering properties to the display object
   * 
   * @param props Properties to apply
   */
  public applyPropsToDisplayObject(props: Partial<RenderableProps>): void {
    if (!this.displayObject) return;
    
    // Apply properties that apply to all display objects
    if (props.visible !== undefined) {
      this.displayObject.visible = props.visible;
      this.visible = props.visible;
    }
    
    if (props.rotation !== undefined) {
      this.displayObject.rotation = props.rotation;
    }
    
    if (props.alpha !== undefined) {
      this.displayObject.alpha = props.alpha;
    }
    
    if (props.blendMode !== undefined && 'blendMode' in this.displayObject) {
      (this.displayObject as any).blendMode = props.blendMode;
    }
    
    // Apply scale properties
    if (props.scaleX !== undefined || props.scaleY !== undefined) {
      this.displayObject.scale.x = props.scaleX ?? this.displayObject.scale.x;
      this.displayObject.scale.y = props.scaleY ?? this.displayObject.scale.y;
    }
    
    // Apply sprite-specific properties
    if (this.displayObject instanceof PIXI.Sprite) {
      const sprite = this.displayObject as PIXI.Sprite;
      
      // Apply anchor if provided
      if (props.anchorX !== undefined || props.anchorY !== undefined) {
        sprite.anchor.x = props.anchorX ?? sprite.anchor.x;
        sprite.anchor.y = props.anchorY ?? sprite.anchor.y;
      }
      
      // Apply tint if provided
      if (props.tint !== undefined) {
        sprite.tint = props.tint;
      }
      
      // Apply fixed dimensions if provided
      if (props.width !== undefined) {
        sprite.width = props.width;
      }
      
      if (props.height !== undefined) {
        sprite.height = props.height;
      }
    }
    
    // Update sort value if provided
    if (props.sortValue !== undefined) {
      this.sortValue = props.sortValue;
      if ('zIndex' in this.displayObject) {
        this.displayObject.zIndex = this.sortValue;
      }
    }
    
    // Update special effects
    if (props.crystallineIntensity !== undefined) {
      this.crystallineIntensity = props.crystallineIntensity;
    }
    
    if (props.energyGlowIntensity !== undefined) {
      this.energyGlowIntensity = props.energyGlowIntensity;
    }
    
    if (props.hoverHeight !== undefined) {
      this.hoverHeight = props.hoverHeight;
    }
    
    if (props.hoverSpeed !== undefined) {
      this.hoverSpeed = props.hoverSpeed;
    }
    
    // Mark for update
    this.needsUpdate = true;
  }
  
  /**
   * Set the visibility of this entity
   * 
   * @param visible New visibility state
   */
  public setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    
    this.visible = visible;
    
    if (this.displayObject) {
      this.displayObject.visible = visible;
    }
  }
  
  /**
   * Set the layer this entity should be rendered on
   * 
   * @param layer New render layer
   */
  public setLayer(layer: RenderLayerType): void {
    if (this.layer === layer) return;
    
    this.layer = layer;
    
    // Mark as needing reattach
    this.needsAttach = true;
  }
  
  /**
   * Reset the component to its initial state
   */
  public reset(): void {
    // Clear the display object
    this.displayObject = null;
    this.attached = false;
    this.visible = true;
    this.autoPositionUpdate = true;
    this.useWorldCoordinates = true;
    this.sortValue = 0;
    this.crystallineIntensity = 0;
    this.energyGlowIntensity = 0;
    this.hoverHeight = 0;
    this.hoverSpeed = 0.5;
    this.needsAttach = false;
    this.needsUpdate = true;
    this.customData = {};
  }
  
  /**
   * Serialize the component to a JSON-compatible object
   */
  public serialize(): Record<string, any> {
    return {
      typeId: this.typeId,
      instanceId: this.instanceId,
      layer: this.layer,
      visible: this.visible,
      sortValue: this.sortValue,
      autoPositionUpdate: this.autoPositionUpdate,
      useWorldCoordinates: this.useWorldCoordinates,
      crystallineIntensity: this.crystallineIntensity,
      energyGlowIntensity: this.energyGlowIntensity,
      hoverHeight: this.hoverHeight,
      hoverSpeed: this.hoverSpeed,
      spriteUrl: this.spriteUrl,
      customData: { ...this.customData }
    };
  }
  
  /**
   * Deserialize the component from a JSON-compatible object
   */
  public deserialize(data: Record<string, any>): void {
    this.layer = data.layer;
    this.visible = data.visible ?? true;
    this.sortValue = data.sortValue ?? 0;
    this.autoPositionUpdate = data.autoPositionUpdate ?? true;
    this.useWorldCoordinates = data.useWorldCoordinates ?? true;
    this.crystallineIntensity = data.crystallineIntensity ?? 0;
    this.energyGlowIntensity = data.energyGlowIntensity ?? 0;
    this.hoverHeight = data.hoverHeight ?? 0;
    this.hoverSpeed = data.hoverSpeed ?? 0.5;
    this.spriteUrl = data.spriteUrl;
    this.customData = data.customData ? { ...data.customData } : {};
    
    // Mark as needing update and attach if we have a sprite URL
    if (this.spriteUrl) {
      this.needsUpdate = true;
      this.needsAttach = true;
    }
  }
  
  /**
   * Clone this component
   * 
   * @returns A new instance of this component with the same properties
   */
  public clone(): Renderable {
    // Create a new instance with basic properties
    const clone = new Renderable({
      layer: this.layer,
      visible: this.visible,
      sortValue: this.sortValue,
      autoPositionUpdate: this.autoPositionUpdate,
      useWorldCoordinates: this.useWorldCoordinates,
      crystallineIntensity: this.crystallineIntensity,
      energyGlowIntensity: this.energyGlowIntensity,
      hoverHeight: this.hoverHeight,
      hoverSpeed: this.hoverSpeed
    });
    
    // Copy sprite URL if present
    if (this.spriteUrl) {
      clone.spriteUrl = this.spriteUrl;
    }
    
    // Clone the display object if present
    if (this.displayObject) {
      // Note: Actual cloning of display objects would depend on the specific type
      // and isn't straightforward in PIXI. In many cases, it's better to create
      // a new display object rather than clone one.
      clone.needsAttach = true;
    }
    
    // Clone custom data
    clone.customData = { ...this.customData };
    
    return clone;
  }
}
