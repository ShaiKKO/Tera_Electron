/**
 * TerraFlux - Camera Controller
 * 
 * Handles camera movement and zoom based on input.
 * Implements RimWorld-style camera navigation with physics-based
 * movement, momentum, and advanced zoom controls.
 */

import { InputAction } from './types';
import { eventEmitter } from '../ecs/EventEmitter';

/**
 * Camera event types
 */
export enum CameraEventType {
  MOVED = 'camera_moved',
  ZOOMED = 'camera_zoomed',
  BOUNDS_CHANGED = 'camera_bounds_changed',
  SHAKE_START = 'camera_shake_start',
  SHAKE_END = 'camera_shake_end',
  ANIMATION_START = 'camera_animation_start',
  ANIMATION_END = 'camera_animation_end',
}

/**
 * CameraState interface
 */
export interface CameraState {
  position: { x: number, y: number };
  zoom: number;
  rotation?: number;
  velocity?: { x: number, y: number };
}

/**
 * Camera animation options
 */
export interface CameraAnimationOptions {
  duration: number;
  easing?: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut' | 'bounce';
  onComplete?: () => void;
}

/**
 * Camera shake options
 */
export interface CameraShakeOptions {
  intensity: number;
  duration: number;
  falloff?: 'linear' | 'exponential';
  frequency?: number;
}

/**
 * CameraController class
 * Handles camera movement based on input actions with physics-based
 * movement and advanced features for game world navigation
 */
export class CameraController {
  private position: { x: number, y: number } = { x: 0, y: 0 };
  private zoom: number = 1.0;
  private rotation: number = 0; // Added rotation support
  private targetPosition: { x: number, y: number } = { x: 0, y: 0 };
  private targetZoom: number = 1.0;
  private targetRotation: number = 0; // Target rotation for smooth transitions
  
  // Physics-based movement
  private velocity: { x: number, y: number } = { x: 0, y: 0 };
  private acceleration: { x: number, y: number } = { x: 0, y: 0 };
  private friction: number = 0.92; // Base friction coefficient
  private momentumEnabled: boolean = true;
  private bounceFactor: number = 0.5; // Bounce elasticity when hitting boundaries
  
  // Camera movement settings
  private moveSpeed: number = 5.0;
  private zoomSpeed: number = 0.1;
  private smoothing: number = 0.2;
  private maxVelocity: number = 20.0;
  
  // Camera limits
  private minZoom: number = 0.5;
  private maxZoom: number = 3.0;
  private bounds: { minX: number, minY: number, maxX: number, maxY: number } | null = null;
  
  // Input tracking
  private movementInputs: {[key in 'up' | 'down' | 'left' | 'right']: boolean} = {
    up: false,
    down: false,
    left: false,
    right: false
  };
  
  // Edge scrolling
  private edgeScrollEnabled: boolean = true;
  private edgeScrollSize: number = 20; // Pixels from edge that trigger scrolling
  private edgeScrollSpeed: number = 3.0;
  private edgeScrollActive: boolean = false;
  
  // Follow mode
  private followTarget: { 
    getPosition: () => { x: number, y: number },
    getVelocity?: () => { x: number, y: number } 
  } | null = null;
  private followOffset: { x: number, y: number } = { x: 0, y: 0 };
  private followLag: number = 0.1;
  
  // Camera animation
  private isAnimating: boolean = false;
  private animationStart: CameraState | null = null;
  private animationEnd: CameraState | null = null;
  private animationProgress: number = 0;
  private animationDuration: number = 0;
  private animationEasing: (t: number) => number = (t) => t; // Linear by default
  private animationCallback: (() => void) | null = null;
  
  // Camera shake effect
  private isShaking: boolean = false;
  private shakeIntensity: number = 0;
  private shakeDecay: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;
  private shakeOffset: { x: number, y: number } = { x: 0, y: 0 };
  private shakeFrequency: number = 0.1;
  
  // Drag navigation
  private isDragging: boolean = false;
  private dragStart: { x: number, y: number } = { x: 0, y: 0 };
  private dragStartCameraPos: { x: number, y: number } = { x: 0, y: 0 };
  private dragVelocity: { x: number, y: number } = { x: 0, y: 0 };
  private lastDragPosition: { x: number, y: number } = { x: 0, y: 0 };
  private dragTime: number = 0;
  
  // Double-click detection
  private lastClickTime: number = 0;
  private lastClickPosition: { x: number, y: number } = { x: 0, y: 0 };
  private doubleClickThreshold: number = 300; // milliseconds
  private doubleClickDistance: number = 10; // pixels
  
  /**
   * Constructor
   */
  constructor(initialState?: Partial<CameraState>) {
    if (initialState?.position) {
      this.position = { ...initialState.position };
      this.targetPosition = { ...initialState.position };
    }
    
    if (initialState?.zoom) {
      this.zoom = initialState.zoom;
      this.targetZoom = initialState.zoom;
    }
    
    if (initialState?.rotation) {
      this.rotation = initialState.rotation;
      this.targetRotation = initialState.rotation;
    }
    
    if (initialState?.velocity) {
      this.velocity = { ...initialState.velocity };
    }
  }
  
  /**
   * Handle input action
   */
  public handleInputAction(action: InputAction, value: number = 1): void {
    switch (action) {
      case InputAction.MOVE_CAMERA_UP:
        this.movementInputs.up = value > 0;
        break;
      case InputAction.MOVE_CAMERA_DOWN:
        this.movementInputs.down = value > 0;
        break;
      case InputAction.MOVE_CAMERA_LEFT:
        this.movementInputs.left = value > 0;
        break;
      case InputAction.MOVE_CAMERA_RIGHT:
        this.movementInputs.right = value > 0;
        break;
      case InputAction.ZOOM_IN:
        this.zoomCamera(-value * this.zoomSpeed);
        break;
      case InputAction.ZOOM_OUT:
        this.zoomCamera(value * this.zoomSpeed);
        break;
    }
  }
  
  /**
   * Update camera position and zoom
   */
  public update(deltaTime: number): void {
    // Cap deltaTime to avoid huge jumps on slow framerates
    const dt = Math.min(deltaTime, 0.1);
    
    // Process animation if active
    if (this.isAnimating) {
      this.updateAnimation(dt);
    }
    
    // Process camera shake if active
    if (this.isShaking) {
      this.updateShake(dt);
    }
    
    // Process edge scrolling if enabled
    if (this.edgeScrollEnabled && !this.isDragging) {
      this.processEdgeScrolling(dt);
    }
    
    // Process target following if enabled
    if (this.followTarget) {
      this.updateFollowTarget(dt);
    }
    
    // Process movement from keyboard/gamepad if not animating
    if (!this.isAnimating) {
      this.processMovementInputs(dt);
    }
    
    // Update physics - apply momentum and friction
    if (this.momentumEnabled && !this.isAnimating && !this.isDragging) {
      this.updatePhysics(dt);
    }
    
    // Smooth camera movement (position, zoom, and rotation)
    this.position.x += (this.targetPosition.x - this.position.x) * this.smoothing;
    this.position.y += (this.targetPosition.y - this.position.y) * this.smoothing;
    this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
    this.rotation += (this.targetRotation - this.rotation) * this.smoothing;
    
    // Enforce camera limits
    this.enforceZoomLimits();
    this.enforceBoundaryLimits();
    
    // Emit moved event if position changed significantly
    if (Math.abs(this.position.x - this.targetPosition.x) > 0.01 || 
        Math.abs(this.position.y - this.targetPosition.y) > 0.01) {
      eventEmitter.emit(CameraEventType.MOVED, this.getState());
    }
  }
  
  /**
   * Process continuous movement inputs
   */
  private processMovementInputs(deltaTime: number): void {
    // Calculate movement based on current inputs
    let dx = 0;
    let dy = 0;
    
    if (this.movementInputs.up) dy -= 1;
    if (this.movementInputs.down) dy += 1;
    if (this.movementInputs.left) dx -= 1;
    if (this.movementInputs.right) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }
    
    // Apply movement speed and zoom factor
    const effectiveSpeed = this.moveSpeed * this.zoom * deltaTime;
    this.targetPosition.x += dx * effectiveSpeed;
    this.targetPosition.y += dy * effectiveSpeed;
  }
  
  /**
   * Start camera drag
   */
  public startDrag(screenX: number, screenY: number): void {
    this.isDragging = true;
    this.dragStart.x = screenX;
    this.dragStart.y = screenY;
    this.dragStartCameraPos.x = this.targetPosition.x;
    this.dragStartCameraPos.y = this.targetPosition.y;
  }
  
  /**
   * Continue camera drag
   */
  public continueDrag(screenX: number, screenY: number): void {
    if (!this.isDragging) return;
    
    // Calculate drag distance in screen space
    const dx = screenX - this.dragStart.x;
    const dy = screenY - this.dragStart.y;
    
    // Convert to world space (considering zoom level)
    this.targetPosition.x = this.dragStartCameraPos.x - dx * this.zoom;
    this.targetPosition.y = this.dragStartCameraPos.y - dy * this.zoom;
  }
  
  /**
   * End camera drag
   */
  public endDrag(): void {
    this.isDragging = false;
  }
  
  /**
   * Zoom camera by delta amount
   */
  public zoomCamera(delta: number): void {
    this.targetZoom *= (1 - delta);
    this.enforceZoomLimits();
  }
  
  /**
   * Zoom camera at specific screen position
   */
  public zoomAtPosition(delta: number, screenX: number, screenY: number, canvasWidth: number, canvasHeight: number): void {
    // Convert screen position to world position before zoom
    const worldX = this.position.x + (screenX - canvasWidth / 2) * this.zoom;
    const worldY = this.position.y + (screenY - canvasHeight / 2) * this.zoom;
    
    // Apply zoom
    const oldZoom = this.targetZoom;
    this.targetZoom *= (1 - delta);
    this.enforceZoomLimits();
    
    // Adjust position to keep the point under cursor at the same place
    if (oldZoom !== this.targetZoom) {
      const zoomFactor = this.targetZoom / oldZoom;
      const newWorldX = this.position.x + (screenX - canvasWidth / 2) * this.targetZoom;
      const newWorldY = this.position.y + (screenY - canvasHeight / 2) * this.targetZoom;
      
      this.targetPosition.x += worldX - newWorldX;
      this.targetPosition.y += worldY - newWorldY;
    }
  }
  
  /**
   * Set camera bounds
   */
  public setBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.bounds = { minX, minY, maxX, maxY };
    this.enforceBoundaryLimits();
  }
  
  /**
   * Clear camera bounds
   */
  public clearBounds(): void {
    this.bounds = null;
  }
  
  /**
   * Enforce zoom limits
   */
  private enforceZoomLimits(): void {
    this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
  }
  
  /**
   * Enforce boundary limits
   */
  private enforceBoundaryLimits(): void {
    if (!this.bounds) return;
    
    this.targetPosition.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.targetPosition.x));
    this.targetPosition.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.targetPosition.y));
  }
  
  /**
   * Move camera to specific position
   */
  public moveTo(x: number, y: number, instant: boolean = false): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
    
    if (instant) {
      this.position.x = x;
      this.position.y = y;
    }
  }
  
  /**
   * Set zoom level
   */
  public setZoom(zoom: number, instant: boolean = false): void {
    this.targetZoom = zoom;
    this.enforceZoomLimits();
    
    if (instant) {
      this.zoom = this.targetZoom;
    }
  }
  
  /**
   * Get current camera state
   */
  public getState(): CameraState {
    return {
      position: { ...this.position },
      zoom: this.zoom,
      rotation: this.rotation,
      velocity: { ...this.velocity }
    };
  }
  
  /**
   * Get camera speed
   */
  public getMoveSpeed(): number {
    return this.moveSpeed;
  }
  
  /**
   * Set camera speed
   */
  public setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }
  
  /**
   * Get zoom speed
   */
  public getZoomSpeed(): number {
    return this.zoomSpeed;
  }
  
  /**
   * Set zoom speed
   */
  public setZoomSpeed(speed: number): void {
    this.zoomSpeed = speed;
  }
  
  /**
   * Set smoothing factor (0-1)
   */
  public setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
  }
  
  /**
   * Update physics (momentum and friction)
   */
  private updatePhysics(deltaTime: number): void {
    // Apply acceleration to velocity
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    
    // Apply friction
    this.velocity.x *= Math.pow(this.friction, deltaTime * 60);
    this.velocity.y *= Math.pow(this.friction, deltaTime * 60);
    
    // Cap velocity to maximum
    const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > this.maxVelocity) {
      const scale = this.maxVelocity / speed;
      this.velocity.x *= scale;
      this.velocity.y *= scale;
    }
    
    // Apply velocity to position
    if (Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01) {
      this.targetPosition.x += this.velocity.x * deltaTime;
      this.targetPosition.y += this.velocity.y * deltaTime;
      
      // Bounce off boundaries if enabled
      if (this.bounds) {
        if (this.targetPosition.x < this.bounds.minX) {
          this.targetPosition.x = this.bounds.minX;
          this.velocity.x = -this.velocity.x * this.bounceFactor;
        } else if (this.targetPosition.x > this.bounds.maxX) {
          this.targetPosition.x = this.bounds.maxX;
          this.velocity.x = -this.velocity.x * this.bounceFactor;
        }
        
        if (this.targetPosition.y < this.bounds.minY) {
          this.targetPosition.y = this.bounds.minY;
          this.velocity.y = -this.velocity.y * this.bounceFactor;
        } else if (this.targetPosition.y > this.bounds.maxY) {
          this.targetPosition.y = this.bounds.maxY;
          this.velocity.y = -this.velocity.y * this.bounceFactor;
        }
      }
    } else {
      // Stop completely when velocity is very low
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
    
    // Reset acceleration
    this.acceleration.x = 0;
    this.acceleration.y = 0;
  }
  
  /**
   * Update camera animation
   */
  private updateAnimation(deltaTime: number): void {
    if (!this.isAnimating || !this.animationStart || !this.animationEnd) return;
    
    // Update progress
    this.animationProgress += deltaTime / this.animationDuration;
    
    if (this.animationProgress >= 1) {
      // Animation complete
      this.position.x = this.animationEnd.position.x;
      this.position.y = this.animationEnd.position.y;
      this.zoom = this.animationEnd.zoom;
      if (this.animationEnd.rotation !== undefined) {
        this.rotation = this.animationEnd.rotation;
      }
      
      this.targetPosition.x = this.position.x;
      this.targetPosition.y = this.position.y;
      this.targetZoom = this.zoom;
      this.targetRotation = this.rotation;
      
      this.isAnimating = false;
      
      // Call the completion callback if provided
      if (this.animationCallback) {
        this.animationCallback();
        this.animationCallback = null;
      }
      
      // Emit animation end event
      eventEmitter.emit(CameraEventType.ANIMATION_END, this.getState());
    } else {
      // Apply easing
      const t = this.animationEasing(this.animationProgress);
      
      // Interpolate between start and end states
      this.position.x = this.animationStart.position.x + (this.animationEnd.position.x - this.animationStart.position.x) * t;
      this.position.y = this.animationStart.position.y + (this.animationEnd.position.y - this.animationStart.position.y) * t;
      this.zoom = this.animationStart.zoom + (this.animationEnd.zoom - this.animationStart.zoom) * t;
      
      if (this.animationEnd.rotation !== undefined && this.animationStart.rotation !== undefined) {
        this.rotation = this.animationStart.rotation + (this.animationEnd.rotation - this.animationStart.rotation) * t;
      }
      
      // Set target to match current position to prevent smoothing from interfering
      this.targetPosition.x = this.position.x;
      this.targetPosition.y = this.position.y;
      this.targetZoom = this.zoom;
      this.targetRotation = this.rotation;
    }
  }
  
  /**
   * Update camera shake effect
   */
  private updateShake(deltaTime: number): void {
    if (!this.isShaking) return;
    
    // Update shake time
    this.shakeElapsed += deltaTime;
    
    if (this.shakeElapsed >= this.shakeDuration) {
      // Shake complete
      this.isShaking = false;
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      
      // Emit shake end event
      eventEmitter.emit(CameraEventType.SHAKE_END, this.getState());
    } else {
      // Calculate remaining intensity based on elapsed time and decay
      const remainingIntensity = this.shakeIntensity * (1 - (this.shakeElapsed / this.shakeDuration) * this.shakeDecay);
      
      // Generate new random offset
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * remainingIntensity;
      
      this.shakeOffset.x = Math.cos(angle) * distance;
      this.shakeOffset.y = Math.sin(angle) * distance;
      
      // Apply offset to position
      this.position.x += this.shakeOffset.x;
      this.position.y += this.shakeOffset.y;
    }
  }
  
  /**
   * Update camera position when following a target
   */
  private updateFollowTarget(deltaTime: number): void {
    if (!this.followTarget) return;
    
    // Get target position
    const targetPos = this.followTarget.getPosition();
    
    // Apply offset
    const targetX = targetPos.x + this.followOffset.x;
    const targetY = targetPos.y + this.followOffset.y;
    
    // If target has velocity, look ahead
    if (this.followTarget.getVelocity) {
      const velocity = this.followTarget.getVelocity();
      const lookAheadFactor = 1.0; // How far ahead to look based on velocity
      
      // Apply look-ahead based on target velocity
      this.targetPosition.x = targetX + velocity.x * lookAheadFactor;
      this.targetPosition.y = targetY + velocity.y * lookAheadFactor;
    } else {
      // Direct follow
      this.targetPosition.x = targetX;
      this.targetPosition.y = targetY;
    }
  }
  
  /**
   * Process edge scrolling
   */
  private processEdgeScrolling(deltaTime: number): void {
    if (!this.edgeScrollEnabled) return;
    
    // This would normally check mouse position against screen edges
    // For now, we'll assume we have access to mouse position through a parameter
    // In a real implementation, this would be provided by the input system
    
    // This placeholder demonstrates the structure, but actual implementation
    // would require mouse coordinates from the input system
    const mouseX = 0; // Would come from input system
    const mouseY = 0; // Would come from input system
    const screenWidth = 800; // Would come from render system
    const screenHeight = 600; // Would come from render system
    
    let dx = 0;
    let dy = 0;
    
    // Check screen edges
    if (mouseX < this.edgeScrollSize) {
      // Left edge
      dx = -1 * (1 - mouseX / this.edgeScrollSize);
      this.edgeScrollActive = true;
    } else if (mouseX > screenWidth - this.edgeScrollSize) {
      // Right edge
      dx = 1 * (1 - (screenWidth - mouseX) / this.edgeScrollSize);
      this.edgeScrollActive = true;
    }
    
    if (mouseY < this.edgeScrollSize) {
      // Top edge
      dy = -1 * (1 - mouseY / this.edgeScrollSize);
      this.edgeScrollActive = true;
    } else if (mouseY > screenHeight - this.edgeScrollSize) {
      // Bottom edge
      dy = 1 * (1 - (screenHeight - mouseY) / this.edgeScrollSize);
      this.edgeScrollActive = true;
    }
    
    // Apply edge scrolling movement if active
    if (this.edgeScrollActive && (dx !== 0 || dy !== 0)) {
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }
      
      // Apply movement with edge scroll speed
      const edgeScrollAmount = this.edgeScrollSpeed * this.zoom * deltaTime;
      this.targetPosition.x += dx * edgeScrollAmount;
      this.targetPosition.y += dy * edgeScrollAmount;
    } else {
      this.edgeScrollActive = false;
    }
  }
  
  /**
   * Animate camera to a new position and zoom level
   */
  public animateTo(targetState: Partial<CameraState>, options: CameraAnimationOptions): void {
    // Store current state as animation start
    this.animationStart = this.getState();
    
    // Create end state by merging current state with target state
    this.animationEnd = {
      position: targetState.position || { ...this.position },
      zoom: targetState.zoom !== undefined ? targetState.zoom : this.zoom,
      rotation: targetState.rotation !== undefined ? targetState.rotation : this.rotation,
      velocity: targetState.velocity || { x: 0, y: 0 }
    };
    
    // Reset velocity when animation starts
    this.velocity.x = 0;
    this.velocity.y = 0;
    
    // Setup animation parameters
    this.animationDuration = options.duration;
    this.animationProgress = 0;
    this.animationCallback = options.onComplete || null;
    
    // Set easing function based on option
    switch (options.easing) {
      case 'easeIn':
        this.animationEasing = (t) => t * t;
        break;
      case 'easeOut':
        this.animationEasing = (t) => 1 - (1 - t) * (1 - t);
        break;
      case 'easeInOut':
        this.animationEasing = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        break;
      case 'bounce':
        this.animationEasing = (t) => {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) {
            return n1 * t * t;
          } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
          } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
          } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
          }
        };
        break;
      default:
        // Linear
        this.animationEasing = (t) => t;
    }
    
    // Start animation
    this.isAnimating = true;
    
    // Emit animation start event
    eventEmitter.emit(CameraEventType.ANIMATION_START, {
      start: this.animationStart,
      end: this.animationEnd,
      duration: this.animationDuration
    });
  }
  
  /**
   * Start a camera shake effect
   */
  public shake(options: CameraShakeOptions): void {
    this.shakeIntensity = options.intensity;
    this.shakeDuration = options.duration;
    this.shakeElapsed = 0;
    this.shakeDecay = options.falloff === 'exponential' ? 2.0 : 1.0;
    this.shakeFrequency = options.frequency || 0.1;
    
    this.isShaking = true;
    
    // Emit shake start event
    eventEmitter.emit(CameraEventType.SHAKE_START, {
      intensity: this.shakeIntensity,
      duration: this.shakeDuration
    });
  }
  
  /**
   * Set camera to follow a target
   */
  public follow(target: { getPosition: () => { x: number, y: number }, getVelocity?: () => { x: number, y: number } }, 
                offset: { x: number, y: number } = { x: 0, y: 0 },
                lag: number = 0.1): void {
    this.followTarget = target;
    this.followOffset = offset;
    this.followLag = Math.max(0, Math.min(1, lag));
  }
  
  /**
   * Stop following a target
   */
  public stopFollowing(): void {
    this.followTarget = null;
  }
  
  /**
   * Set edge scrolling enabled state
   */
  public setEdgeScrollingEnabled(enabled: boolean): void {
    this.edgeScrollEnabled = enabled;
  }
  
  /**
   * Configure edge scrolling
   */
  public configureEdgeScrolling(edgeSize: number, speed: number): void {
    this.edgeScrollSize = Math.max(1, edgeSize);
    this.edgeScrollSpeed = Math.max(0.1, speed);
  }
  
  /**
   * Set momentum enabled state
   */
  public setMomentumEnabled(enabled: boolean): void {
    this.momentumEnabled = enabled;
    
    if (!enabled) {
      // Reset velocity when disabling momentum
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }
}
