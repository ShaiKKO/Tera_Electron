/**
 * TerraFlux - Animated Component
 * 
 * Component for entities that have animations.
 * Works in conjunction with the Renderable component to provide animation capabilities.
 */

import * as PIXI from 'pixi.js';
import { Component } from '../core/ecs/Component';
import { ComponentId } from '../core/ecs/types';

/**
 * Animation frame definition
 */
export interface AnimationFrame {
  /** Texture name/key for this frame */
  texture: string;
  /** Duration of this frame in seconds */
  duration: number;
}

/**
 * Animation definition
 */
export interface AnimationDefinition {
  /** Unique name/identifier for this animation */
  name: string;
  /** Frames in this animation */
  frames: AnimationFrame[];
  /** Whether the animation should loop */
  loop?: boolean;
  /** Playback speed multiplier */
  speed?: number;
  /** Whether to return to the first frame when the animation completes (if not looping) */
  resetOnComplete?: boolean;
}

/**
 * Properties for Animated component
 */
export interface AnimatedProps {
  /** List of available animations for this entity */
  animations: AnimationDefinition[];
  /** Name of the default animation to play */
  defaultAnimation?: string;
  /** Whether to autoplay the default animation */
  autoplay?: boolean;
  /** Playback speed multiplier */
  speed?: number;
}

/**
 * Animation state
 */
export interface AnimationState {
  /** Name of the current animation */
  currentAnimation: string;
  /** Current frame index in the animation */
  currentFrame: number;
  /** Time accumulated in current frame */
  frameTime: number;
  /** Whether the animation is playing */
  playing: boolean;
  /** Playback speed multiplier */
  speed: number;
  /** Whether the animation is complete (for non-looping animations) */
  complete: boolean;
}

/**
 * Component for entities that have animations
 */
export class Animated extends Component {
  /** Component type ID */
  public static readonly TYPE_ID: ComponentId = 'Animated';
  
  /** Component type for instance */
  public readonly typeId: ComponentId = Animated.TYPE_ID;
  
  /** Animations defined for this entity */
  private _animations: Map<string, AnimationDefinition> = new Map();
  
  /** Current animation state */
  private _state: AnimationState = {
    currentAnimation: '',
    currentFrame: 0,
    frameTime: 0,
    playing: false,
    speed: 1.0,
    complete: false
  };
  
  /** Event callbacks */
  private _callbacks: {
    onComplete?: (animation: string) => void;
    onLoop?: (animation: string) => void;
    onFrame?: (animation: string, frame: number) => void;
  } = {};
  
  /** Whether this component needs update */
  public needsUpdate: boolean = false;
  
  /**
   * Constructor
   * 
   * @param props Component properties
   */
  constructor(props: AnimatedProps) {
    super();
    
    // Process animations
    for (const anim of props.animations) {
      this._animations.set(anim.name, {
        ...anim,
        loop: anim.loop ?? false,
        speed: anim.speed ?? 1.0,
        resetOnComplete: anim.resetOnComplete ?? false
      });
    }
    
    // Set initial state
    this._state.speed = props.speed ?? 1.0;
    
    // Set and play default animation if provided
    if (props.defaultAnimation && this._animations.has(props.defaultAnimation)) {
      this._state.currentAnimation = props.defaultAnimation;
      
      if (props.autoplay) {
        this._state.playing = true;
        this.needsUpdate = true;
      }
    }
  }
  
  /**
   * Get the current animation definition
   */
  public get currentAnimation(): AnimationDefinition | undefined {
    return this._animations.get(this._state.currentAnimation);
  }
  
  /**
   * Get the current animation state
   */
  public get state(): AnimationState {
    return { ...this._state };
  }
  
  /**
   * Get current animation frame
   */
  public get currentFrame(): AnimationFrame | undefined {
    const anim = this.currentAnimation;
    if (!anim || anim.frames.length === 0) return undefined;
    
    return anim.frames[this._state.currentFrame];
  }
  
  /**
   * Get current texture name
   */
  public get currentTexture(): string | undefined {
    return this.currentFrame?.texture;
  }
  
  /**
   * Get a list of all animation names
   */
  public get animationNames(): string[] {
    return Array.from(this._animations.keys());
  }
  
  /**
   * Check if a specific animation exists
   * 
   * @param name Animation name to check
   */
  public hasAnimation(name: string): boolean {
    return this._animations.has(name);
  }
  
  /**
   * Play an animation
   * 
   * @param name Animation name to play
   * @param reset Whether to reset the animation if it's already playing
   * @returns Success flag
   */
  public play(name: string, reset: boolean = false): boolean {
    // Validate animation exists
    if (!this._animations.has(name)) return false;
    
    // If already playing this animation and not resetting, do nothing
    if (this._state.currentAnimation === name && this._state.playing && !reset) {
      return true;
    }
    
    // Set current animation
    this._state.currentAnimation = name;
    this._state.playing = true;
    this._state.complete = false;
    
    // Reset frame if requested or changing animations
    if (reset || this._state.currentAnimation !== name) {
      this._state.currentFrame = 0;
      this._state.frameTime = 0;
    }
    
    this.needsUpdate = true;
    return true;
  }
  
  /**
   * Pause the current animation
   */
  public pause(): void {
    if (this._state.playing) {
      this._state.playing = false;
    }
  }
  
  /**
   * Resume the current animation
   */
  public resume(): void {
    if (!this._state.playing && this._state.currentAnimation) {
      this._state.playing = true;
      this.needsUpdate = true;
    }
  }
  
  /**
   * Stop the current animation and reset to first frame
   */
  public stop(): void {
    this._state.playing = false;
    this._state.currentFrame = 0;
    this._state.frameTime = 0;
    this._state.complete = false;
    this.needsUpdate = true;
  }
  
  /**
   * Set animation playback speed
   * 
   * @param speed New playback speed
   */
  public setSpeed(speed: number): void {
    this._state.speed = Math.max(0.1, speed);
  }
  
  /**
   * Set event callback for animation complete
   * 
   * @param callback Function to call when animation completes
   */
  public onComplete(callback: (animation: string) => void): void {
    this._callbacks.onComplete = callback;
  }
  
  /**
   * Set event callback for animation loop
   * 
   * @param callback Function to call when animation loops
   */
  public onLoop(callback: (animation: string) => void): void {
    this._callbacks.onLoop = callback;
  }
  
  /**
   * Set event callback for frame change
   * 
   * @param callback Function to call when frame changes
   */
  public onFrame(callback: (animation: string, frame: number) => void): void {
    this._callbacks.onFrame = callback;
  }
  
  /**
   * Update the animation state
   * 
   * @param deltaTime Time elapsed since last update in seconds
   * @returns Whether the texture changed
   */
  public update(deltaTime: number): boolean {
    // Skip if not playing or no current animation
    if (!this._state.playing || !this._state.currentAnimation) return false;
    
    const anim = this._animations.get(this._state.currentAnimation);
    if (!anim || anim.frames.length === 0) return false;
    
    // Track if texture changes
    let textureChanged = false;
    
    // Update frame time
    this._state.frameTime += deltaTime * this._state.speed * (anim.speed ?? 1.0);
    
    // Check if we need to advance to the next frame
    const currentFrameData = anim.frames[this._state.currentFrame];
    if (this._state.frameTime >= currentFrameData.duration) {
      // Move to next frame
      this._state.frameTime -= currentFrameData.duration;
      const oldFrame = this._state.currentFrame;
      this._state.currentFrame++;
      
      // Check if we've reached the end of the animation
      if (this._state.currentFrame >= anim.frames.length) {
        if (anim.loop) {
          // Loop back to beginning
          this._state.currentFrame = 0;
          
          // Call loop callback
          if (this._callbacks.onLoop) {
            this._callbacks.onLoop(this._state.currentAnimation);
          }
        } else {
          // Animation complete
          this._state.currentFrame = anim.resetOnComplete ? 0 : anim.frames.length - 1;
          this._state.playing = false;
          this._state.complete = true;
          
          // Call complete callback
          if (this._callbacks.onComplete) {
            this._callbacks.onComplete(this._state.currentAnimation);
          }
        }
      }
      
      // Texture changed if we moved to a different frame
      textureChanged = this._state.currentFrame !== oldFrame;
      
      // Call frame change callback
      if (textureChanged && this._callbacks.onFrame) {
        this._callbacks.onFrame(this._state.currentAnimation, this._state.currentFrame);
      }
    }
    
    return textureChanged;
  }
  
  /**
   * Add a new animation
   * 
   * @param animation Animation to add
   * @returns Success flag
   */
  public addAnimation(animation: AnimationDefinition): boolean {
    if (this._animations.has(animation.name)) return false;
    
    this._animations.set(animation.name, {
      ...animation,
      loop: animation.loop ?? false,
      speed: animation.speed ?? 1.0,
      resetOnComplete: animation.resetOnComplete ?? false
    });
    
    return true;
  }
  
  /**
   * Remove an animation
   * 
   * @param name Animation name to remove
   * @returns Success flag
   */
  public removeAnimation(name: string): boolean {
    if (!this._animations.has(name)) return false;
    
    // If currently playing this animation, stop
    if (this._state.currentAnimation === name) {
      this.stop();
    }
    
    this._animations.delete(name);
    return true;
  }
  
  /**
   * Reset the component to its initial state
   */
  public reset(): void {
    this._state = {
      currentAnimation: '',
      currentFrame: 0,
      frameTime: 0,
      playing: false,
      speed: 1.0,
      complete: false
    };
    
    this._animations.clear();
    this._callbacks = {};
    this.needsUpdate = false;
  }
  
  /**
   * Serialize the component to a JSON-compatible object
   */
  public serialize(): Record<string, any> {
    return {
      typeId: this.typeId,
      instanceId: this.instanceId,
      animations: Array.from(this._animations.values()),
      state: { ...this._state }
    };
  }
  
  /**
   * Deserialize the component from a JSON-compatible object
   */
  public deserialize(data: Record<string, any>): void {
    // Clear current animations
    this._animations.clear();
    
    // Load animations
    if (Array.isArray(data.animations)) {
      for (const anim of data.animations) {
        this._animations.set(anim.name, anim);
      }
    }
    
    // Load state
    if (data.state) {
      this._state = {
        currentAnimation: data.state.currentAnimation || '',
        currentFrame: data.state.currentFrame || 0,
        frameTime: data.state.frameTime || 0,
        playing: data.state.playing || false,
        speed: data.state.speed || 1.0,
        complete: data.state.complete || false
      };
    }
    
    this.needsUpdate = !!this._state.playing;
  }
  
  /**
   * Clone this component
   * 
   * @returns A new instance of this component with the same properties
   */
  public clone(): Animated {
    // Create props for the new instance
    const props: AnimatedProps = {
      animations: Array.from(this._animations.values()),
      speed: this._state.speed
    };
    
    // Create a new instance
    const clone = new Animated(props);
    
    // Copy the current state
    clone._state = { ...this._state };
    
    return clone;
  }
}
