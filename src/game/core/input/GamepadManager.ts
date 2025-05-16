/**
 * TerraFlux - Gamepad Manager
 * 
 * Handles gamepad input and state tracking.
 */

import { GamepadState, InputAction, GamepadAxisMapping, GamepadBindings } from './types';

/**
 * Default button bindings
 */
const DEFAULT_BUTTON_BINDINGS: Record<number, InputAction> = {
  0: InputAction.CONTEXT_ACTION_PRIMARY,   // A button / Bottom button
  1: InputAction.CONTEXT_ACTION_SECONDARY, // B button / Right button
  2: InputAction.UI_CANCEL,                // X button / Left button
  3: InputAction.UI_CONFIRM,               // Y button / Top button
  4: InputAction.UI_TAB_PREV,              // Left shoulder
  5: InputAction.UI_TAB_NEXT,              // Right shoulder
  8: InputAction.PAUSE_GAME,               // Back/Select button
  9: InputAction.DESELECT,                 // Start button
  12: InputAction.UI_UP,                   // D-pad up
  13: InputAction.UI_DOWN,                 // D-pad down
  14: InputAction.UI_LEFT,                 // D-pad left
  15: InputAction.UI_RIGHT                 // D-pad right
};

/**
 * Default axis mappings
 */
const DEFAULT_AXIS_BINDINGS: Record<number, GamepadAxisMapping> = {
  0: { // Left stick horizontal
    positive: InputAction.MOVE_CAMERA_RIGHT,
    negative: InputAction.MOVE_CAMERA_LEFT,
    deadzone: 0.15
  },
  1: { // Left stick vertical
    positive: InputAction.MOVE_CAMERA_DOWN,
    negative: InputAction.MOVE_CAMERA_UP,
    deadzone: 0.15
  },
  2: { // Right stick horizontal
    positive: InputAction.UI_RIGHT,
    negative: InputAction.UI_LEFT,
    deadzone: 0.15
  },
  3: { // Right stick vertical
    positive: InputAction.UI_DOWN,
    negative: InputAction.UI_UP,
    deadzone: 0.15
  }
};

/**
 * GamepadManager class
 * Manages gamepad input and state
 */
export class GamepadManager {
  private gamepadStates: Map<number, GamepadState> = new Map();
  private previousStates: Map<number, GamepadState> = new Map();
  private bindings: GamepadBindings = {
    buttons: { ...DEFAULT_BUTTON_BINDINGS },
    axes: { ...DEFAULT_AXIS_BINDINGS }
  };
  
  /**
   * Constructor
   */
  constructor() {
    // Automatically initialize if we're in a browser environment
    if (typeof window !== 'undefined' && 'getGamepads' in navigator) {
      this.setupEventListeners();
    }
  }
  
  /**
   * Set up gamepad event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
      console.log(`Gamepad connected at index ${e.gamepad.index}: ${e.gamepad.id}`);
      this.updateGamepadState(e.gamepad);
    });
    
    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
      console.log(`Gamepad disconnected at index ${e.gamepad.index}: ${e.gamepad.id}`);
      this.gamepadStates.delete(e.gamepad.index);
      this.previousStates.delete(e.gamepad.index);
    });
  }
  
  /**
   * Update method - should be called every frame
   */
  public update(): void {
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return;
    
    // Save current states as previous states
    for (const [id, state] of this.gamepadStates.entries()) {
      this.previousStates.set(id, { ...state });
    }
    
    // Get fresh gamepad data
    const gamepads = navigator.getGamepads();
    
    // Update each connected gamepad
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        this.updateGamepadState(gamepad);
      }
    }
  }
  
  /**
   * Update state for a specific gamepad
   */
  private updateGamepadState(gamepad: Gamepad): void {
    // Create a new state if we don't have one
    if (!this.gamepadStates.has(gamepad.index)) {
      this.gamepadStates.set(gamepad.index, {
        buttons: new Array(gamepad.buttons.length).fill(false),
        axes: new Array(gamepad.axes.length).fill(0),
        timestamp: gamepad.timestamp
      });
    }
    
    // Update existing state
    const state = this.gamepadStates.get(gamepad.index)!;
    
    // Update button states
    for (let i = 0; i < gamepad.buttons.length; i++) {
      state.buttons[i] = gamepad.buttons[i].pressed;
    }
    
    // Update axis values
    for (let i = 0; i < gamepad.axes.length; i++) {
      state.axes[i] = gamepad.axes[i];
    }
    
    // Update timestamp
    state.timestamp = gamepad.timestamp;
  }
  
  /**
   * Get active gamepad IDs
   */
  public getActiveGamepadIds(): number[] {
    return Array.from(this.gamepadStates.keys());
  }
  
  /**
   * Check if a button is currently pressed
   */
  public isButtonPressed(gamepadId: number, buttonIndex: number): boolean {
    const state = this.gamepadStates.get(gamepadId);
    if (!state || buttonIndex >= state.buttons.length) return false;
    
    return state.buttons[buttonIndex];
  }
  
  /**
   * Check if a button was just pressed this frame
   */
  public isButtonJustPressed(gamepadId: number, buttonIndex: number): boolean {
    const currentState = this.gamepadStates.get(gamepadId);
    const prevState = this.previousStates.get(gamepadId);
    
    if (!currentState || !prevState) return false;
    if (buttonIndex >= currentState.buttons.length) return false;
    
    return currentState.buttons[buttonIndex] && !prevState.buttons[buttonIndex];
  }
  
  /**
   * Check if a button was just released this frame
   */
  public isButtonJustReleased(gamepadId: number, buttonIndex: number): boolean {
    const currentState = this.gamepadStates.get(gamepadId);
    const prevState = this.previousStates.get(gamepadId);
    
    if (!currentState || !prevState) return false;
    if (buttonIndex >= currentState.buttons.length) return false;
    
    return !currentState.buttons[buttonIndex] && prevState.buttons[buttonIndex];
  }
  
  /**
   * Get an axis value (between -1 and 1)
   */
  public getAxisValue(gamepadId: number, axisIndex: number): number {
    const state = this.gamepadStates.get(gamepadId);
    if (!state || axisIndex >= state.axes.length) return 0;
    
    // Get raw axis value
    const value = state.axes[axisIndex];
    
    // Apply deadzone if configured for this axis
    const axisMapping = this.bindings.axes[axisIndex];
    if (axisMapping) {
      const deadzone = axisMapping.deadzone;
      if (Math.abs(value) < deadzone) {
        return 0;
      }
      
      // Normalize the value after deadzone
      const sign = Math.sign(value);
      const normalizedValue = (Math.abs(value) - deadzone) / (1 - deadzone);
      return sign * normalizedValue;
    }
    
    return value;
  }
  
  /**
   * Get action for a button
   */
  public getActionForButton(buttonIndex: number): InputAction | undefined {
    return this.bindings.buttons[buttonIndex];
  }
  
  /**
   * Get action for an axis based on value
   */
  public getActionForAxis(axisIndex: number, value: number): InputAction | undefined {
    const mapping = this.bindings.axes[axisIndex];
    if (!mapping) return undefined;
    
    if (value > 0) {
      return mapping.positive;
    } else if (value < 0) {
      return mapping.negative;
    }
    
    return undefined;
  }
  
  /**
   * Set a button binding
   */
  public setButtonBinding(buttonIndex: number, action: InputAction | undefined): void {
    if (action === undefined) {
      delete this.bindings.buttons[buttonIndex];
    } else {
      this.bindings.buttons[buttonIndex] = action;
    }
  }
  
  /**
   * Set an axis binding
   */
  public setAxisBinding(
    axisIndex: number, 
    positive: InputAction, 
    negative: InputAction, 
    deadzone: number = 0.15
  ): void {
    this.bindings.axes[axisIndex] = {
      positive,
      negative,
      deadzone: Math.max(0, Math.min(1, deadzone))
    };
  }
  
  /**
   * Reset bindings to default
   */
  public resetBindings(): void {
    this.bindings = {
      buttons: { ...DEFAULT_BUTTON_BINDINGS },
      axes: { ...DEFAULT_AXIS_BINDINGS }
    };
  }
  
  /**
   * Get all bindings
   */
  public getBindings(): GamepadBindings {
    return { ...this.bindings };
  }
  
  /**
   * Set all bindings
   */
  public setBindings(bindings: GamepadBindings): void {
    this.bindings = { ...bindings };
  }
  
  /**
   * Get gamepad count
   */
  public getGamepadCount(): number {
    return this.gamepadStates.size;
  }
  
  /**
   * Get a display name for a gamepad
   */
  public getGamepadDisplayName(gamepadId: number): string {
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return '';
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadId];
    
    if (!gamepad) return `Unknown Gamepad ${gamepadId}`;
    
    // Extract a friendlier name from the gamepad ID
    // Examples:
    // "Xbox 360 Controller (XInput STANDARD GAMEPAD)" -> "Xbox 360 Controller"
    // "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)" -> "Wireless Controller"
    
    let displayName = gamepad.id;
    
    // Try to extract the part before the first parenthesis
    const parenIndex = displayName.indexOf('(');
    if (parenIndex > 0) {
      displayName = displayName.substring(0, parenIndex).trim();
    }
    
    // If the name is too generic, append the gamepad index
    if (displayName === 'Controller' || displayName === 'Gamepad') {
      displayName += ` #${gamepadId + 1}`;
    }
    
    return displayName;
  }
}
