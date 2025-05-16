/**
 * TerraFlux - Gesture Recognizer
 * 
 * Recognizes touch gestures for touch-enabled devices.
 */

import { TouchPoint, TouchState, GestureType } from './types';

/**
 * Gesture result interface
 */
interface Gesture {
  type: GestureType;
  touchIds: number[];
  position: { x: number, y: number };
  startPosition?: { x: number, y: number };
  direction?: { x: number, y: number };
  distance?: number;
  magnitude?: number;
  angle?: number;
  time: number;
  duration: number;
}

/**
 * Configuration options for gesture recognition
 */
interface GestureConfig {
  tapMaxDistance: number;
  tapMaxDuration: number;
  doubleTapMaxDelay: number;
  longPressMinDuration: number;
  swipeMinDistance: number;
  swipeMaxTime: number;
  pinchMinChange: number;
}

/**
 * Default gesture configuration
 */
const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  tapMaxDistance: 10,           // Maximum movement in pixels for a tap
  tapMaxDuration: 300,          // Maximum time in ms for a tap
  doubleTapMaxDelay: 300,       // Maximum time between taps for a double tap
  longPressMinDuration: 500,    // Minimum time in ms for a long press
  swipeMinDistance: 50,         // Minimum distance in pixels for a swipe
  swipeMaxTime: 300,            // Maximum time in ms for a swipe
  pinchMinChange: 10            // Minimum change in pixels for a pinch
};

/**
 * GestureRecognizer class
 * Processes touch inputs to recognize gestures
 */
export class GestureRecognizer {
  private activeTouches: Map<number, TouchPoint> = new Map();
  private startTouches: Map<number, TouchPoint> = new Map();
  private gestures: Gesture[] = [];
  private lastTapTime: number = 0;
  private lastTapPosition: { x: number, y: number } = { x: 0, y: 0 };
  private config: GestureConfig;
  
  // Long press tracking
  private longPressTimer: number | null = null;
  private longPressTouch: TouchPoint | null = null;
  
  /**
   * Constructor
   */
  constructor(config?: Partial<GestureConfig>) {
    this.config = {
      ...DEFAULT_GESTURE_CONFIG,
      ...config
    };
  }
  
  /**
   * Add a touch point
   */
  public addTouchPoint(id: number, x: number, y: number): void {
    const touch: TouchPoint = {
      id,
      x,
      y,
      time: performance.now()
    };
    
    this.activeTouches.set(id, touch);
    this.startTouches.set(id, { ...touch });
    
    // Start long press timer for single touch
    if (this.activeTouches.size === 1) {
      this.startLongPressTimer(touch);
    } else {
      this.cancelLongPressTimer();
    }
  }
  
  /**
   * Update a touch point
   */
  public updateTouchPoint(id: number, x: number, y: number): void {
    const touch = this.activeTouches.get(id);
    if (!touch) return;
    
    // Calculate distance moved
    const startTouch = this.startTouches.get(id);
    if (startTouch) {
      const dx = x - startTouch.x;
      const dy = y - startTouch.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Cancel long press if moved too far
      if (this.longPressTouch && this.longPressTouch.id === id && 
          distance > this.config.tapMaxDistance) {
        this.cancelLongPressTimer();
      }
    }
    
    // Update position
    touch.x = x;
    touch.y = y;
  }
  
  /**
   * Remove a touch point
   */
  public removeTouchPoint(id: number): void {
    const touch = this.activeTouches.get(id);
    if (!touch) return;
    
    // Get start touch
    const startTouch = this.startTouches.get(id);
    if (startTouch) {
      // Calculate gesture data
      const dx = touch.x - startTouch.x;
      const dy = touch.y - startTouch.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = touch.time - startTouch.time;
      
      // Detect tap or swipe for single touches
      if (this.activeTouches.size === 1) {
        // Cancel long press timer
        this.cancelLongPressTimer();
        
        // Check for tap
        if (distance <= this.config.tapMaxDistance && 
            duration <= this.config.tapMaxDuration) {
          
          // Check for double tap
          const now = performance.now();
          const timeSinceLastTap = now - this.lastTapTime;
          const lastTapDx = touch.x - this.lastTapPosition.x;
          const lastTapDy = touch.y - this.lastTapPosition.y;
          const lastTapDistance = Math.sqrt(lastTapDx * lastTapDx + lastTapDy * lastTapDy);
          
          if (timeSinceLastTap <= this.config.doubleTapMaxDelay && 
              lastTapDistance <= this.config.tapMaxDistance * 2) {
            // Double tap
            this.addGesture({
              type: GestureType.DOUBLE_TAP,
              touchIds: [id],
              position: { x: touch.x, y: touch.y },
              time: now,
              duration: timeSinceLastTap + duration
            });
            
            // Reset tap tracking
            this.lastTapTime = 0;
          } else {
            // Single tap
            this.addGesture({
              type: GestureType.TAP,
              touchIds: [id],
              position: { x: touch.x, y: touch.y },
              time: now,
              duration
            });
            
            // Store for potential double tap
            this.lastTapTime = now;
            this.lastTapPosition = { x: touch.x, y: touch.y };
          }
        }
        // Check for swipe
        else if (distance >= this.config.swipeMinDistance && 
                 duration <= this.config.swipeMaxTime) {
          // Determine swipe direction
          const angle = Math.atan2(dy, dx);
          const direction = this.getSwipeDirection(angle);
          
          // Create swipe gesture
          this.addGesture({
            type: direction,
            touchIds: [id],
            position: { x: touch.x, y: touch.y },
            startPosition: { x: startTouch.x, y: startTouch.y },
            direction: { x: dx / distance, y: dy / distance },
            distance,
            magnitude: distance / duration, // pixels per ms
            angle,
            time: performance.now(),
            duration
          });
        }
      }
    }
    
    // Clean up
    this.activeTouches.delete(id);
    this.startTouches.delete(id);
  }
  
  /**
   * Start long press timer
   */
  private startLongPressTimer(touch: TouchPoint): void {
    this.cancelLongPressTimer();
    
    this.longPressTouch = { ...touch };
    this.longPressTimer = window.setTimeout(() => {
      if (this.longPressTouch) {
        // Trigger long press gesture
        this.addGesture({
          type: GestureType.LONG_PRESS,
          touchIds: [this.longPressTouch.id],
          position: { x: this.longPressTouch.x, y: this.longPressTouch.y },
          time: performance.now(),
          duration: this.config.longPressMinDuration
        });
        
        this.longPressTouch = null;
        this.longPressTimer = null;
      }
    }, this.config.longPressMinDuration);
  }
  
  /**
   * Cancel long press timer
   */
  private cancelLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
      this.longPressTouch = null;
    }
  }
  
  /**
   * Update method - process touches and detect gestures
   * Should be called every frame
   */
  public update(): Gesture[] {
    // Skip if we have less than 2 touches (single touches handled as they end)
    if (this.activeTouches.size < 2) {
      const result = [...this.gestures];
      this.gestures = [];
      return result;
    }
    
    // Check for multi-touch gestures
    this.recognizeMultiTouchGestures();
    
    // Return and clear pending gestures
    const result = [...this.gestures];
    this.gestures = [];
    return result;
  }
  
  /**
   * Recognize multi-touch gestures like pinch and rotate
   */
  private recognizeMultiTouchGestures(): void {
    // For now, only handle 2-finger gestures
    if (this.activeTouches.size !== 2) return;
    
    // Get the two touch points
    const touchPoints = Array.from(this.activeTouches.values());
    const startTouchPoints = Array.from(this.startTouches.values());
    
    // Ensure we have matching start points
    if (startTouchPoints.length !== 2) return;
    
    // Calculate current distance between points
    const currentDistance = this.distanceBetweenPoints(
      touchPoints[0].x, touchPoints[0].y,
      touchPoints[1].x, touchPoints[1].y
    );
    
    // Calculate starting distance between points
    const startDistance = this.distanceBetweenPoints(
      startTouchPoints[0].x, startTouchPoints[0].y,
      startTouchPoints[1].x, startTouchPoints[1].y
    );
    
    // Calculate distance change
    const distanceChange = currentDistance - startDistance;
    
    // Check for pinch
    if (Math.abs(distanceChange) >= this.config.pinchMinChange) {
      // Calculate center point
      const centerX = (touchPoints[0].x + touchPoints[1].x) / 2;
      const centerY = (touchPoints[0].y + touchPoints[1].y) / 2;
      
      // Determine if it's pinch in or out
      const gestureType = distanceChange < 0 ? GestureType.PINCH_IN : GestureType.PINCH_OUT;
      
      // Create gesture
      this.addGesture({
        type: gestureType,
        touchIds: [touchPoints[0].id, touchPoints[1].id],
        position: { x: centerX, y: centerY },
        distance: Math.abs(distanceChange),
        magnitude: Math.abs(distanceChange) / startDistance, // Scale factor
        time: performance.now(),
        duration: Math.max(
          touchPoints[0].time - startTouchPoints[0].time,
          touchPoints[1].time - startTouchPoints[1].time
        )
      });
      
      // Update starting positions for continuous gesture recognition
      // This prevents generating the same gesture repeatedly
      this.startTouches.set(touchPoints[0].id, { ...touchPoints[0] });
      this.startTouches.set(touchPoints[1].id, { ...touchPoints[1] });
    }
    
    // Calculate rotation (could be added in the future)
  }
  
  /**
   * Get swipe direction based on angle
   */
  private getSwipeDirection(angle: number): GestureType {
    // Convert to degrees and normalize to 0-360
    const degrees = ((angle * 180 / Math.PI) + 360) % 360;
    
    // Determine direction based on 45 degree segments
    if (degrees >= 315 || degrees < 45) return GestureType.SWIPE_RIGHT;
    if (degrees >= 45 && degrees < 135) return GestureType.SWIPE_DOWN;
    if (degrees >= 135 && degrees < 225) return GestureType.SWIPE_LEFT;
    return GestureType.SWIPE_UP;
  }
  
  /**
   * Calculate distance between two points
   */
  private distanceBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Add a gesture to the queue
   */
  private addGesture(gesture: Gesture): void {
    this.gestures.push(gesture);
  }
  
  /**
   * Clear all touch data
   */
  public clear(): void {
    this.activeTouches.clear();
    this.startTouches.clear();
    this.gestures = [];
    this.cancelLongPressTimer();
  }
  
  /**
   * Set gesture configuration
   */
  public setConfig(config: Partial<GestureConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Get current gesture configuration
   */
  public getConfig(): GestureConfig {
    return { ...this.config };
  }
}
