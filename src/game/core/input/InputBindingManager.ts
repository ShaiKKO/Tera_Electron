/**
 * TerraFlux - Input Binding Manager
 * 
 * Manages input bindings and key mappings.
 */

import { InputAction, InputType, InputBinding } from './types';

/**
 * Default keyboard bindings
 */
const DEFAULT_KEYBOARD_BINDINGS: Array<[InputAction, string]> = [
  // Camera controls
  [InputAction.MOVE_CAMERA_UP, 'w'],
  [InputAction.MOVE_CAMERA_DOWN, 's'],
  [InputAction.MOVE_CAMERA_LEFT, 'a'],
  [InputAction.MOVE_CAMERA_RIGHT, 'd'],
  
  // UI navigation
  [InputAction.UI_UP, 'ArrowUp'],
  [InputAction.UI_DOWN, 'ArrowDown'],
  [InputAction.UI_LEFT, 'ArrowLeft'],
  [InputAction.UI_RIGHT, 'ArrowRight'],
  [InputAction.UI_CONFIRM, 'Enter'],
  [InputAction.UI_CANCEL, 'Escape'],
  [InputAction.UI_TAB_NEXT, 'Tab'],
  [InputAction.UI_TAB_PREV, 'ShiftLeft+Tab'],
  
  // Game speed controls
  [InputAction.PAUSE_GAME, ' '],
  [InputAction.SPEED_NORMAL, '1'],
  [InputAction.SPEED_FAST, '2'],
  [InputAction.SPEED_ULTRA, '3']
];

/**
 * Default mouse bindings
 */
const DEFAULT_MOUSE_BINDINGS: Array<[InputAction, number]> = [
  [InputAction.SELECT_TILE, 0],       // Left click
  [InputAction.CONTEXT_MENU, 2],      // Right click
  [InputAction.DESELECT, 1]           // Middle click
];

/**
 * InputBindingManager class
 * Manages input bindings for different input types
 */
export class InputBindingManager {
  private bindings: InputBinding[] = [];
  
  /**
   * Constructor
   */
  constructor() {
    this.resetToDefaults();
  }
  
  /**
   * Reset to default bindings
   */
  public resetToDefaults(): void {
    this.bindings = [];
    
    // Add keyboard bindings
    DEFAULT_KEYBOARD_BINDINGS.forEach(([action, key]) => {
      this.bindings.push({
        inputType: InputType.KEYBOARD,
        inputCode: key,
        action
      });
    });
    
    // Add mouse bindings
    DEFAULT_MOUSE_BINDINGS.forEach(([action, button]) => {
      this.bindings.push({
        inputType: InputType.MOUSE,
        inputCode: button,
        action
      });
    });
  }
  
  /**
   * Get action for an input
   */
  public getActionForInput(inputType: InputType, inputCode: string | number): InputAction | undefined {
    const binding = this.bindings.find(b => 
      b.inputType === inputType && b.inputCode === inputCode
    );
    
    return binding?.action;
  }
  
  /**
   * Get all bindings for an action
   */
  public getBindingsForAction(action: InputAction): InputBinding[] {
    return this.bindings.filter(b => b.action === action);
  }
  
  /**
   * Get the primary binding for an action
   */
  public getPrimaryBindingForAction(action: InputAction): InputBinding | undefined {
    return this.bindings.find(b => b.action === action);
  }
  
  /**
   * Add a binding
   */
  public addBinding(binding: InputBinding): void {
    // Remove any existing binding with the same input type and code
    this.removeBinding(binding.inputType, binding.inputCode);
    
    // Add new binding
    this.bindings.push(binding);
  }
  
  /**
   * Remove a binding
   */
  public removeBinding(inputType: InputType, inputCode: string | number): void {
    this.bindings = this.bindings.filter(b => 
      !(b.inputType === inputType && b.inputCode === inputCode)
    );
  }
  
  /**
   * Get all bindings
   */
  public getBindings(): InputBinding[] {
    return [...this.bindings];
  }
  
  /**
   * Load bindings
   */
  public loadBindings(bindings: InputBinding[]): void {
    this.bindings = [...bindings];
  }
  
  /**
   * Get binding display name
   */
  public getBindingDisplayName(binding: InputBinding): string {
    if (binding.inputType === InputType.KEYBOARD) {
      // Format keyboard bindings
      const key = binding.inputCode as string;
      
      // Special case formatting
      const specialKeys: Record<string, string> = {
        ' ': 'Space',
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→',
        'ShiftLeft': 'Shift',
        'ShiftRight': 'Shift',
        'ControlLeft': 'Ctrl',
        'ControlRight': 'Ctrl',
        'AltLeft': 'Alt',
        'AltRight': 'Alt',
        'MetaLeft': 'Meta',
        'MetaRight': 'Meta'
      };
      
      // Handle compound keys (e.g., "ShiftLeft+Tab")
      if (key.includes('+')) {
        return key.split('+').map(k => specialKeys[k] || k).join('+');
      }
      
      return specialKeys[key] || key.toUpperCase();
    } 
    else if (binding.inputType === InputType.MOUSE) {
      // Format mouse bindings
      const button = binding.inputCode as number;
      switch (button) {
        case 0: return 'Left Click';
        case 1: return 'Middle Click';
        case 2: return 'Right Click';
        default: return `Mouse ${button}`;
      }
    }
    else if (binding.inputType === InputType.GAMEPAD) {
      // Format gamepad bindings
      const code = binding.inputCode as number;
      if (typeof code === 'number') {
        if (code < 20) {
          return `Button ${code}`;
        } else {
          return `Axis ${code - 20}`;
        }
      }
      return String(code);
    }
    
    return String(binding.inputCode);
  }
  
  /**
   * Get action display name
   */
  public getActionDisplayName(action: InputAction): string {
    // Convert enum names to display-friendly format
    const name = InputAction[action];
    
    // Convert from UPPER_SNAKE_CASE to Title Case With Spaces
    return name.split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
