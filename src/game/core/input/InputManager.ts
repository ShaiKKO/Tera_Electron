/**
 * TerraFlux - Input Manager
 * 
 * Central hub for input handling, integrating all input subsystems.
 */

import { EventEmitter } from '../ecs/EventEmitter';
import { InputBindingManager } from './InputBindingManager';
import { SensitivityManager } from './SensitivityManager';
import { GamepadManager } from './GamepadManager';
import { GestureRecognizer } from './GestureRecognizer';
import { CameraController } from './CameraController';
import { ContextInputHandler } from './ContextInputHandler';
import { 
  InputAction, 
  InputType, 
  InputBinding, 
  InputEvent, 
  SensitivitySettings,
  InputSettings,
  AccessibilityOptions,
  TouchPoint,
  GameContext
} from './types';

/**
 * Default accessibility options
 */
const DEFAULT_ACCESSIBILITY_OPTIONS: AccessibilityOptions = {
  inputSensitivity: 1.0,
  deadZone: 0.1,
  repeatDelay: 500,
  repeatRate: 50,
  uiScale: 1.0
};

/**
 * Input state tracking
 */
interface InputState {
  keyboardState: Map<string, boolean>;
  keyRepeatTimers: Map<string, number>;
  mouseState: {
    position: { x: number, y: number };
    buttons: Map<number, boolean>;
    wheel: number;
  };
  touchState: {
    activeTouches: Map<number, TouchPoint>;
    lastGestureTime: number;
  };
}

/**
 * InputManager class
 * Central manager for all input systems
 */
export class InputManager {
  // Sub-managers
  private bindingManager: InputBindingManager;
  private sensitivityManager: SensitivityManager;
  private gamepadManager: GamepadManager;
  private gestureRecognizer: GestureRecognizer;
  private cameraController: CameraController;
  private contextHandler: ContextInputHandler;
  
  // Event system
  private eventEmitter: EventEmitter;
  
  // State tracking
  private inputState: InputState;
  
  // Accessibility options
  private accessibilityOptions: AccessibilityOptions;
  
  // Flags
  private isEnabled: boolean = true;
  private isInitialized: boolean = false;
  
  /**
   * Constructor
   */
  constructor() {
    // Create event emitter
    this.eventEmitter = new EventEmitter();
    
    // Initialize sub-managers
    this.bindingManager = new InputBindingManager();
    this.sensitivityManager = new SensitivityManager();
    this.gamepadManager = new GamepadManager();
    this.gestureRecognizer = new GestureRecognizer();
    this.cameraController = new CameraController();
    this.contextHandler = new ContextInputHandler();
    
    // Initialize state
    this.inputState = {
      keyboardState: new Map<string, boolean>(),
      keyRepeatTimers: new Map<string, number>(),
      mouseState: {
        position: { x: 0, y: 0 },
        buttons: new Map<number, boolean>(),
        wheel: 0
      },
      touchState: {
        activeTouches: new Map<number, TouchPoint>(),
        lastGestureTime: 0
      }
    };
    
    // Initialize accessibility options
    this.accessibilityOptions = { ...DEFAULT_ACCESSIBILITY_OPTIONS };
    
    // Connect context handler to camera controller
    this.connectContextToCameraController();
  }
  
  /**
   * Initialize and start listening for input events
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    this.setupEventListeners();
    this.isInitialized = true;
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Mouse events
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Touch events
    window.addEventListener('touchstart', this.handleTouchStart.bind(this));
    window.addEventListener('touchmove', this.handleTouchMove.bind(this));
    window.addEventListener('touchend', this.handleTouchEnd.bind(this));
    window.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    
    // Context menu (right-click)
    window.addEventListener('contextmenu', (e) => {
      // Prevent default right-click menu if we have a handler
      if (this.contextHandler.getActionForInput(InputAction.CONTEXT_MENU)) {
        e.preventDefault();
      }
    });
    
    // Window events
    window.addEventListener('blur', () => {
      this.resetInputState();
    });
  }
  
  /**
   * Reset all input state
   */
  private resetInputState(): void {
    this.inputState.keyboardState.clear();
    this.inputState.keyRepeatTimers.clear();
    this.inputState.mouseState.buttons.clear();
    this.inputState.touchState.activeTouches.clear();
  }
  
  /**
   * Connect context handler to camera controller
   */
  private connectContextToCameraController(): void {
    // Handle camera movement based on context
    this.contextHandler.onContextChanged((context) => {
      // Disable camera movement in menu/dialog contexts
      const disableCameraControl = 
        context === GameContext.MENU_OPEN || 
        context === GameContext.DIALOG_OPEN;
      
      // Could do more context-specific handling here
    });
  }
  
  /**
   * Update method - should be called every frame
   */
  public update(deltaTime: number): void {
    if (!this.isEnabled || !this.isInitialized) return;
    
    // Update gamepad manager
    this.gamepadManager.update();
    
    // Process gamepad input
    this.processGamepadInput();
    
    // Update gesture recognizer
    const gestures = this.gestureRecognizer.update();
    this.processGestures(gestures);
    
    // Update camera controller
    this.cameraController.update(deltaTime);
    
    // Process repeating keys
    this.processKeyRepeats();
  }
  
  /**
   * Process gamepad input
   */
  private processGamepadInput(): void {
    // Handle all active gamepads
    for (const gamepadId of this.gamepadManager.getActiveGamepadIds()) {
      // Check for button presses
      for (let i = 0; i < 20; i++) { // Most controllers have up to 20 buttons
        if (this.gamepadManager.isButtonJustPressed(gamepadId, i)) {
          const action = this.gamepadManager.getActionForButton(i);
          if (action !== undefined) {
            this.triggerAction(action, 1, InputType.GAMEPAD);
          }
        }
        
        if (this.gamepadManager.isButtonJustReleased(gamepadId, i)) {
          const action = this.gamepadManager.getActionForButton(i);
          if (action !== undefined) {
            this.triggerAction(action, 0, InputType.GAMEPAD);
          }
        }
      }
      
      // Check axes
      for (let i = 0; i < 4; i++) { // Most controllers have 4 axes (2 sticks)
        const value = this.gamepadManager.getAxisValue(gamepadId, i);
        const processedValue = this.sensitivityManager.applyGamepadSensitivity(value);
        
        if (processedValue !== 0) {
          const action = this.gamepadManager.getActionForAxis(i, processedValue);
          if (action !== undefined) {
            this.triggerAction(action, Math.abs(processedValue), InputType.GAMEPAD);
          }
        }
      }
    }
  }
  
  /**
   * Process gestures from touch input
   */
  private processGestures(gestures: any[]): void {
    for (const gesture of gestures) {
      switch (gesture.type) {
        case 'PINCH_IN':
          this.triggerAction(InputAction.ZOOM_OUT, gesture.magnitude || 1, InputType.GESTURE);
          break;
        case 'PINCH_OUT':
          this.triggerAction(InputAction.ZOOM_IN, gesture.magnitude || 1, InputType.GESTURE);
          break;
        case 'SWIPE_UP':
          this.triggerAction(InputAction.MOVE_CAMERA_UP, 1, InputType.GESTURE);
          break;
        case 'SWIPE_DOWN':
          this.triggerAction(InputAction.MOVE_CAMERA_DOWN, 1, InputType.GESTURE);
          break;
        case 'SWIPE_LEFT':
          this.triggerAction(InputAction.MOVE_CAMERA_LEFT, 1, InputType.GESTURE);
          break;
        case 'SWIPE_RIGHT':
          this.triggerAction(InputAction.MOVE_CAMERA_RIGHT, 1, InputType.GESTURE);
          break;
        // Add more gesture handling as needed
      }
    }
  }
  
  /**
   * Process key repeat events
   */
  private processKeyRepeats(): void {
    const now = performance.now();
    
    for (const [key, isPressed] of this.inputState.keyboardState.entries()) {
      if (!isPressed) continue;
      
      const lastRepeatTime = this.inputState.keyRepeatTimers.get(key) || 0;
      const timeHeld = now - lastRepeatTime;
      
      if (this.sensitivityManager.shouldRepeatKey(timeHeld, lastRepeatTime)) {
        const action = this.bindingManager.getActionForInput(InputType.KEYBOARD, key);
        if (action !== undefined) {
          this.triggerAction(action, 1, InputType.KEYBOARD);
          this.inputState.keyRepeatTimers.set(key, now);
        }
      }
    }
  }
  
  /**
   * Handle key down event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    const key = event.key;
    
    // If already pressed, ignore (to avoid key repeat from browser)
    if (this.inputState.keyboardState.get(key)) return;
    
    // Update state
    this.inputState.keyboardState.set(key, true);
    this.inputState.keyRepeatTimers.set(key, performance.now());
    
    // Find action
    const action = this.bindingManager.getActionForInput(InputType.KEYBOARD, key);
    
    if (action !== undefined) {
      // Try context handler first
      if (!this.contextHandler.handleInputAction(action)) {
        // Then try normal action
        this.triggerAction(action, 1, InputType.KEYBOARD, event);
      }
      
      // Prevent default for handled keys
      event.preventDefault();
    }
  }
  
  /**
   * Handle key up event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled) return;
    
    const key = event.key;
    
    // Update state
    this.inputState.keyboardState.set(key, false);
    
    // Find action
    const action = this.bindingManager.getActionForInput(InputType.KEYBOARD, key);
    
    if (action !== undefined) {
      this.triggerAction(action, 0, InputType.KEYBOARD, event);
      event.preventDefault();
    }
  }
  
  /**
   * Handle mouse down event
   */
  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    const button = event.button;
    
    // Update state
    this.inputState.mouseState.buttons.set(button, true);
    
    // Find action
    const action = this.bindingManager.getActionForInput(InputType.MOUSE, button);
    
    if (action !== undefined) {
      // Try context handler first
      if (!this.contextHandler.handleInputAction(action)) {
        // Then try normal action
        this.triggerAction(action, 1, InputType.MOUSE, event);
      }
      
      // Special handling for camera drag with middle mouse button
      if (button === 1) { // Middle mouse
        this.cameraController.startDrag(event.clientX, event.clientY);
      }
      
      // Prevent default for handled buttons
      event.preventDefault();
    }
  }
  
  /**
   * Handle mouse up event
   */
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    const button = event.button;
    
    // Update state
    this.inputState.mouseState.buttons.set(button, false);
    
    // Find action
    const action = this.bindingManager.getActionForInput(InputType.MOUSE, button);
    
    if (action !== undefined) {
      this.triggerAction(action, 0, InputType.MOUSE, event);
      
      // Special handling for camera drag end
      if (button === 1) { // Middle mouse
        this.cameraController.endDrag();
      }
      
      event.preventDefault();
    }
  }
  
  /**
   * Handle mouse move event
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;
    
    // Update state
    this.inputState.mouseState.position.x = event.clientX;
    this.inputState.mouseState.position.y = event.clientY;
    
    // Handle camera drag if active
    if (this.inputState.mouseState.buttons.get(1)) { // Middle mouse
      this.cameraController.continueDrag(event.clientX, event.clientY);
    }
    
    // Emit mouse move event
    this.eventEmitter.emit('mouse:move', {
      x: event.clientX,
      y: event.clientY,
      movementX: event.movementX,
      movementY: event.movementY
    });
  }
  
  /**
   * Handle mouse wheel event
   */
  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;
    
    // Update state
    this.inputState.mouseState.wheel = event.deltaY;
    
    // Normalize the wheel delta
    const delta = this.sensitivityManager.applyMouseWheelSensitivity(
      Math.sign(event.deltaY) * 0.1
    );
    
    // Apply zoom
    if (delta > 0) {
      this.triggerAction(InputAction.ZOOM_OUT, Math.abs(delta), InputType.MOUSE, event);
    } else if (delta < 0) {
      this.triggerAction(InputAction.ZOOM_IN, Math.abs(delta), InputType.MOUSE, event);
    }
    
    // Zoom at cursor position
    this.cameraController.zoomAtPosition(
      delta,
      event.clientX,
      event.clientY,
      window.innerWidth,
      window.innerHeight
    );
    
    // Prevent default to avoid page scrolling
    event.preventDefault();
  }
  
  /**
   * Handle touch start event
   */
  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    // Update state
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        time: performance.now()
      };
      
      this.inputState.touchState.activeTouches.set(touch.identifier, touchPoint);
      
      // Add touch to gesture recognizer
      this.gestureRecognizer.addTouchPoint(touch.identifier, touch.clientX, touch.clientY);
    }
    
    // If this is a two-finger touch, start pinch/zoom tracking
    if (this.inputState.touchState.activeTouches.size === 2) {
      // Additional logic could be here for two-finger gestures
    }
    
    // Prevent default to avoid browser handling
    event.preventDefault();
  }
  
  /**
   * Handle touch move event
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    // Update state
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchPoint = this.inputState.touchState.activeTouches.get(touch.identifier);
      
      if (touchPoint) {
        touchPoint.x = touch.clientX;
        touchPoint.y = touch.clientY;
        
        // Update gesture recognizer
        this.gestureRecognizer.updateTouchPoint(
          touch.identifier,
          touch.clientX,
          touch.clientY
        );
      }
    }
    
    // Handle camera drag with single touch
    if (this.inputState.touchState.activeTouches.size === 1) {
      const touch = Array.from(this.inputState.touchState.activeTouches.values())[0];
      this.cameraController.continueDrag(touch.x, touch.y);
    }
    
    // Prevent default to avoid browser handling
    event.preventDefault();
  }
  
  /**
   * Handle touch end event
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled) return;
    
    // Update state
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      
      // Remove from state
      this.inputState.touchState.activeTouches.delete(touch.identifier);
      
      // Update gesture recognizer
      this.gestureRecognizer.removeTouchPoint(touch.identifier);
    }
    
    // End camera drag if no touches left
    if (this.inputState.touchState.activeTouches.size === 0) {
      this.cameraController.endDrag();
    }
    
    // Prevent default to avoid browser handling
    event.preventDefault();
  }
  
  /**
   * Trigger an input action
   */
  private triggerAction(
    action: InputAction,
    value: number = 1,
    inputType: InputType = InputType.KEYBOARD,
    rawEvent?: any
  ): void {
    // Create input event
    const inputEvent: InputEvent = {
      type: inputType,
      action,
      value,
      rawEvent
    };
    
    // Emit generic action event
    this.eventEmitter.emit('input:action', inputEvent);
    
    // Emit specific action event
    this.eventEmitter.emit(`input:action:${InputAction[action]}`, inputEvent);
    
    // Forward to camera controller for camera actions
    switch (action) {
      case InputAction.MOVE_CAMERA_UP:
      case InputAction.MOVE_CAMERA_DOWN:
      case InputAction.MOVE_CAMERA_LEFT:
      case InputAction.MOVE_CAMERA_RIGHT:
      case InputAction.ZOOM_IN:
      case InputAction.ZOOM_OUT:
        this.cameraController.handleInputAction(action, value);
        break;
    }
  }
  
  /**
   * Subscribe to an input action
   */
  public subscribe(action: InputAction, callback: (event: InputEvent) => void): () => void {
    const eventName = `input:action:${InputAction[action]}`;
    this.eventEmitter.subscribe(eventName, callback as any);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.unsubscribe(eventName, callback as any);
    };
  }
  
  /**
   * Subscribe to all input actions
   */
  public subscribeToAll(callback: (event: InputEvent) => void): () => void {
    this.eventEmitter.subscribe('input:action', callback as any);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.unsubscribe('input:action', callback as any);
    };
  }
  
  /**
   * Subscribe to mouse movement
   */
  public subscribeToMouseMove(
    callback: (position: { x: number, y: number, movementX: number, movementY: number }) => void
  ): () => void {
    this.eventEmitter.subscribe('mouse:move', callback as any);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.unsubscribe('mouse:move', callback as any);
    };
  }
  
  /**
   * Get camera controller
   */
  public getCameraController(): CameraController {
    return this.cameraController;
  }
  
  /**
   * Get context handler
   */
  public getContextHandler(): ContextInputHandler {
    return this.contextHandler;
  }
  
  /**
   * Get binding manager
   */
  public getBindingManager(): InputBindingManager {
    return this.bindingManager;
  }
  
  /**
   * Get sensitivity manager
   */
  public getSensitivityManager(): SensitivityManager {
    return this.sensitivityManager;
  }
  
  /**
   * Get gamepad manager
   */
  public getGamepadManager(): GamepadManager {
    return this.gamepadManager;
  }
  
  /**
   * Enable/disable input
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.resetInputState();
    }
  }
  
  /**
   * Check if input is enabled
   */
  public isInputEnabled(): boolean {
    return this.isEnabled;
  }
  
  /**
   * Set accessibility options
   */
  public setAccessibilityOptions(options: Partial<AccessibilityOptions>): void {
    this.accessibilityOptions = {
      ...this.accessibilityOptions,
      ...options
    };
    
    // Apply relevant settings to other managers
    // For example, we might adjust sensitivity based on the inputSensitivity value
  }
  
  /**
   * Get accessibility options
   */
  public getAccessibilityOptions(): AccessibilityOptions {
    return { ...this.accessibilityOptions };
  }
  
  /**
   * Load input settings
   */
  public loadSettings(settings: InputSettings): void {
    // Load bindings
    if (settings.bindings) {
      this.bindingManager.loadBindings(settings.bindings);
    }
    
    // Load sensitivity settings
    if (settings.sensitivity) {
      this.sensitivityManager.loadSettings(settings.sensitivity);
    }
    
    // Load accessibility options
    if (settings.accessibility) {
      this.setAccessibilityOptions(settings.accessibility);
    }
  }
  
  /**
   * Get current input settings
   */
  public getSettings(): InputSettings {
    return {
      bindings: this.bindingManager.getBindings(),
      sensitivity: this.sensitivityManager.getSettings(),
      accessibility: this.accessibilityOptions,
      version: 1 // Current settings version
    };
  }
}
