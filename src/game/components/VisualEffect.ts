/**
 * TerraFlux - VisualEffect Component
 * 
 * Component for entities that have visual effects.
 * This includes status effects, action indicators, and other temporary visual elements.
 */

import { Component } from '../core/ecs/Component';
import { ComponentId } from '../core/ecs/types';

/**
 * Types of visual effects
 */
export enum VisualEffectType {
  /** Particle emitter effect */
  PARTICLES = 'particles',
  /** Sprite sheet animation effect */
  ANIMATION = 'animation',
  /** Shader effect applied to the entity */
  SHADER = 'shader',
  /** Tint/color overlay effect */
  TINT = 'tint',
  /** Floating text effect */
  TEXT = 'text',
  /** Scale/pulse effect */
  SCALE = 'scale',
  /** Glow effect */
  GLOW = 'glow',
  /** Displacement/distortion effect */
  DISTORTION = 'distortion'
}

/**
 * Base properties for all visual effects
 */
export interface VisualEffectBase {
  /** Unique identifier for the effect */
  id: string;
  /** Type of visual effect */
  type: VisualEffectType;
  /** Duration of the effect in seconds (0 = permanent) */
  duration?: number;
  /** Time elapsed since effect started */
  elapsed?: number;
  /** Effect intensity (0-1) */
  intensity?: number;
  /** Whether the effect is active */
  active?: boolean;
  /** Offset from entity position (x) */
  offsetX?: number;
  /** Offset from entity position (y) */
  offsetY?: number;
  /** Whether to scale effect with entity */
  scaleWithEntity?: boolean;
  /** Z-order offset for layering effects */
  zOffset?: number;
  /** Whether the effect should loop */
  loop?: boolean;
  /** Custom data for specific effect types */
  data?: Record<string, any>;
}

/**
 * Particle effect properties
 */
export interface ParticleEffect extends VisualEffectBase {
  type: VisualEffectType.PARTICLES;
  /** Particle texture/image */
  texture: string;
  /** Number of particles to emit */
  count: number;
  /** Emission rate (particles per second) */
  rate: number;
  /** Minimum particle lifetime in seconds */
  lifetimeMin: number;
  /** Maximum particle lifetime in seconds */
  lifetimeMax: number;
  /** Minimum particle speed */
  speedMin: number;
  /** Maximum particle speed */
  speedMax: number;
  /** Particle start scale */
  scaleStart?: number;
  /** Particle end scale */
  scaleEnd?: number;
  /** Particle start alpha */
  alphaStart?: number;
  /** Particle end alpha */
  alphaEnd?: number;
  /** Minimum particle rotation speed (degrees/sec) */
  rotationSpeedMin?: number;
  /** Maximum particle rotation speed (degrees/sec) */
  rotationSpeedMax?: number;
  /** Whether to blend additively */
  additive?: boolean;
  /** Emission angle range from center */
  angleRange?: number;
  /** Tint color for particles */
  tint?: number;
  /** Gravity effect on particles */
  gravity?: number;
}

/**
 * Animation effect properties
 */
export interface AnimationEffect extends VisualEffectBase {
  type: VisualEffectType.ANIMATION;
  /** Animation name */
  animationName: string;
  /** Playback speed multiplier */
  speed?: number;
  /** Whether to attach to entity */
  attachToEntity?: boolean;
}

/**
 * Shader effect properties
 */
export interface ShaderEffect extends VisualEffectBase {
  type: VisualEffectType.SHADER;
  /** Shader program name */
  shaderName: string;
  /** Shader uniform values */
  uniforms?: Record<string, any>;
}

/**
 * Tint effect properties
 */
export interface TintEffect extends VisualEffectBase {
  type: VisualEffectType.TINT;
  /** Tint color */
  color: number;
  /** Whether to pulse the tint */
  pulse?: boolean;
  /** Pulse frequency in Hz */
  pulseFrequency?: number;
}

/**
 * Text effect properties
 */
export interface TextEffect extends VisualEffectBase {
  type: VisualEffectType.TEXT;
  /** Text content */
  text: string;
  /** Text color */
  color?: number;
  /** Font size */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Whether to float upward */
  float?: boolean;
  /** Float speed */
  floatSpeed?: number;
  /** Whether to fade out */
  fadeOut?: boolean;
}

/**
 * Scale effect properties
 */
export interface ScaleEffect extends VisualEffectBase {
  type: VisualEffectType.SCALE;
  /** Scale multiplier */
  scale: number;
  /** Whether to pulse the scale */
  pulse?: boolean;
  /** Pulse frequency in Hz */
  pulseFrequency?: number;
  /** Minimum scale during pulse */
  pulseMin?: number;
  /** Maximum scale during pulse */
  pulseMax?: number;
}

/**
 * Glow effect properties
 */
export interface GlowEffect extends VisualEffectBase {
  type: VisualEffectType.GLOW;
  /** Glow color */
  color: number;
  /** Glow blur radius */
  blurRadius?: number;
  /** Whether to pulse the glow */
  pulse?: boolean;
  /** Pulse frequency in Hz */
  pulseFrequency?: number;
}

/**
 * Distortion effect properties
 */
export interface DistortionEffect extends VisualEffectBase {
  type: VisualEffectType.DISTORTION;
  /** Distortion intensity */
  intensity: number;
  /** Whether to animate the distortion */
  animate?: boolean;
  /** Animation speed */
  animationSpeed?: number;
  /** Distortion texture */
  texture?: string;
}

/**
 * Union type for all visual effect types
 */
export type VisualEffectProperties = 
  | ParticleEffect 
  | AnimationEffect 
  | ShaderEffect 
  | TintEffect 
  | TextEffect 
  | ScaleEffect 
  | GlowEffect 
  | DistortionEffect;

/**
 * Properties for VisualEffect component
 */
export interface VisualEffectProps {
  /** List of effects to apply */
  effects?: VisualEffectProperties[];
}

/**
 * Component for visual effects on entities
 */
export class VisualEffect extends Component {
  /** Component type ID */
  public static readonly TYPE_ID: ComponentId = 'VisualEffect';
  
  /** Component type for instance */
  public readonly typeId: ComponentId = VisualEffect.TYPE_ID;
  
  /** Active effects */
  private _effects: Map<string, VisualEffectProperties> = new Map();
  
  /** Whether this component needs update */
  public needsUpdate: boolean = false;
  
  /**
   * Constructor
   * 
   * @param props Component properties
   */
  constructor(props: VisualEffectProps = {}) {
    super();
    
    // Add initial effects
    if (props.effects) {
      for (const effect of props.effects) {
        this.addEffect(effect);
      }
    }
  }
  
  /**
   * Add a visual effect
   * 
   * @param effect Effect to add
   * @returns Success flag
   */
  public addEffect(effect: VisualEffectProperties): boolean {
    // Check if effect with this ID already exists
    if (this._effects.has(effect.id)) {
      return false;
    }
    
    // Initialize effect properties
    const initializedEffect = {
      ...effect,
      elapsed: 0,
      active: true,
      intensity: effect.intensity ?? 1.0,
      offsetX: effect.offsetX ?? 0,
      offsetY: effect.offsetY ?? 0,
      scaleWithEntity: effect.scaleWithEntity ?? false,
      zOffset: effect.zOffset ?? 0,
      loop: effect.loop ?? false
    };
    
    // Add to effects map
    this._effects.set(effect.id, initializedEffect);
    
    // Mark for update
    this.needsUpdate = true;
    
    return true;
  }
  
  /**
   * Remove a visual effect
   * 
   * @param effectId ID of effect to remove
   * @returns Success flag
   */
  public removeEffect(effectId: string): boolean {
    // Check if effect exists
    if (!this._effects.has(effectId)) {
      return false;
    }
    
    // Remove from effects map
    this._effects.delete(effectId);
    
    // Mark for update
    this.needsUpdate = true;
    
    return true;
  }
  
  /**
   * Get a specific effect
   * 
   * @param effectId ID of effect to get
   * @returns The effect or undefined if not found
   */
  public getEffect(effectId: string): VisualEffectProperties | undefined {
    return this._effects.get(effectId);
  }
  
  /**
   * Get all active effects
   * 
   * @returns Array of active effects
   */
  public getActiveEffects(): VisualEffectProperties[] {
    return Array.from(this._effects.values()).filter(effect => effect.active);
  }
  
  /**
   * Get all effects of a specific type
   * 
   * @param type Type of effects to get
   * @returns Array of effects of the specified type
   */
  public getEffectsByType(type: VisualEffectType): VisualEffectProperties[] {
    return Array.from(this._effects.values())
      .filter(effect => effect.type === type && effect.active);
  }
  
  /**
   * Update all effects
   * 
   * @param deltaTime Time elapsed since last update in seconds
   * @returns Whether any effects were removed
   */
  public update(deltaTime: number): boolean {
    if (this._effects.size === 0) {
      this.needsUpdate = false;
      return false;
    }
    
    let effectsRemoved = false;
    
    // Update all effects
    for (const [id, effect] of this._effects.entries()) {
      // Skip inactive effects
      if (!effect.active) continue;
      
      // Update elapsed time
      if (effect.duration && effect.duration > 0) {
        effect.elapsed = (effect.elapsed ?? 0) + deltaTime;
        
        // Check if effect has expired
        if (effect.elapsed >= effect.duration) {
          if (effect.loop) {
            // Reset elapsed time for looping effects
            effect.elapsed = effect.elapsed % effect.duration;
          } else {
            // Remove expired effects
            this._effects.delete(id);
            effectsRemoved = true;
            continue;
          }
        }
      }
      
      // Update type-specific properties
      this._updateSpecificEffect(effect, deltaTime);
    }
    
    // If all effects removed, mark as not needing update
    if (this._effects.size === 0) {
      this.needsUpdate = false;
    }
    
    return effectsRemoved;
  }
  
  /**
   * Update type-specific effect properties
   * 
   * @param effect Effect to update
   * @param deltaTime Time elapsed since last update in seconds
   */
  private _updateSpecificEffect(effect: VisualEffectProperties, deltaTime: number): void {
    switch (effect.type) {
      case VisualEffectType.PARTICLES:
        // Particle systems would be updated externally by the particle system
        break;
        
      case VisualEffectType.ANIMATION:
        // Animation would be handled by the animation system
        break;
        
      case VisualEffectType.TINT:
        if (effect.pulse && effect.pulseFrequency) {
          // Calculate pulsing intensity
          const phase = ((effect.elapsed ?? 0) * effect.pulseFrequency) % 1;
          effect.intensity = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
        }
        break;
        
      case VisualEffectType.SCALE:
        if (effect.pulse && effect.pulseFrequency) {
          const phase = ((effect.elapsed ?? 0) * effect.pulseFrequency) % 1;
          const pulseMin = effect.pulseMin ?? 0.8;
          const pulseMax = effect.pulseMax ?? 1.2;
          
          // Calculate scale based on pulse
          const pulseFactor = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
          effect.scale = pulseMin + pulseFactor * (pulseMax - pulseMin);
        }
        break;
        
      case VisualEffectType.GLOW:
        if (effect.pulse && effect.pulseFrequency) {
          const phase = ((effect.elapsed ?? 0) * effect.pulseFrequency) % 1;
          effect.intensity = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);
        }
        break;
        
      case VisualEffectType.TEXT:
        if (effect.float && effect.floatSpeed) {
          // Update offset for floating text
          effect.offsetY = (effect.offsetY ?? 0) - effect.floatSpeed * deltaTime;
        }
        
        if (effect.fadeOut && effect.duration) {
          // Calculate fade based on remaining time
          const progress = Math.min(1, (effect.elapsed ?? 0) / effect.duration);
          effect.intensity = 1 - progress;
        }
        break;
        
      case VisualEffectType.DISTORTION:
        if (effect.animate && effect.animationSpeed) {
          // Animation would update uniforms for the shader
          // This is just a placeholder - the actual shader uniforms
          // would be updated in the rendering system
          effect.data = effect.data || {};
          effect.data.time = (effect.data.time || 0) + deltaTime * effect.animationSpeed;
        }
        break;
    }
  }
  
  /**
   * Set effect active state
   * 
   * @param effectId ID of effect to update
   * @param active New active state
   * @returns Success flag
   */
  public setEffectActive(effectId: string, active: boolean): boolean {
    const effect = this._effects.get(effectId);
    if (!effect) return false;
    
    effect.active = active;
    this.needsUpdate = true;
    
    return true;
  }
  
  /**
   * Set effect intensity
   * 
   * @param effectId ID of effect to update
   * @param intensity New intensity value (0-1)
   * @returns Success flag
   */
  public setEffectIntensity(effectId: string, intensity: number): boolean {
    const effect = this._effects.get(effectId);
    if (!effect) return false;
    
    effect.intensity = Math.max(0, Math.min(1, intensity));
    this.needsUpdate = true;
    
    return true;
  }
  
  /**
   * Reset the component to its initial state
   */
  public reset(): void {
    this._effects.clear();
    this.needsUpdate = false;
  }
  
  /**
   * Serialize the component to a JSON-compatible object
   */
  public serialize(): Record<string, any> {
    return {
      typeId: this.typeId,
      instanceId: this.instanceId,
      effects: Array.from(this._effects.values())
    };
  }
  
  /**
   * Deserialize the component from a JSON-compatible object
   */
  public deserialize(data: Record<string, any>): void {
    // Clear current effects
    this._effects.clear();
    
    // Load effects
    if (Array.isArray(data.effects)) {
      for (const effect of data.effects) {
        this._effects.set(effect.id, effect);
      }
    }
    
    this.needsUpdate = this._effects.size > 0;
  }
  
  /**
   * Clone this component
   * 
   * @returns A new instance of this component with the same properties
   */
  public clone(): VisualEffect {
    // Create a new instance
    const clone = new VisualEffect();
    
    // Copy effects
    for (const effect of this._effects.values()) {
      clone.addEffect({ ...effect });
    }
    
    return clone;
  }
  
  /**
   * Clear all effects
   */
  public clearEffects(): void {
    this._effects.clear();
    this.needsUpdate = false;
  }
}
