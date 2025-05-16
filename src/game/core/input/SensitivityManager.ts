/**
 * TerraFlux - Sensitivity Manager
 * 
 * Manages input sensitivity settings for various input types.
 */

import { SensitivitySettings } from './types';

/**
 * Default sensitivity settings
 */
const DEFAULT_SENSITIVITY_SETTINGS: SensitivitySettings = {
  mouseMovement: 1.0,
  mouseScrollZoom: 1.0,
  keyRepeatDelay: 500,
  keyRepeatRate: 50,
  gamepadDeadzone: 0.1,
  gamepadAxisSensitivity: 1.0,
  gamepadCurve: 'exponential',
  touchDragSensitivity: 1.0,
  touchPinchSensitivity: 1.0
};

/**
 * SensitivityManager class
 * Handles input sensitivity configuration and processing
 */
export class SensitivityManager {
  private settings: SensitivitySettings;
  private lastRepeatTimes: Map<string, number> = new Map();
  
  /**
   * Constructor
   */
  constructor() {
    this.settings = { ...DEFAULT_SENSITIVITY_SETTINGS };
  }
  
  /**
   * Load sensitivity settings
   */
  public loadSettings(settings: Partial<SensitivitySettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
  }
  
  /**
   * Get current sensitivity settings
   */
  public getSettings(): SensitivitySettings {
    return { ...this.settings };
  }
  
  /**
   * Reset to default settings
   */
  public resetToDefaults(): void {
    this.settings = { ...DEFAULT_SENSITIVITY_SETTINGS };
  }
  
  /**
   * Set a specific sensitivity value
   */
  public setSensitivity<K extends keyof SensitivitySettings>(
    key: K, 
    value: SensitivitySettings[K]
  ): void {
    this.settings[key] = value;
  }
  
  /**
   * Get a specific sensitivity value
   */
  public getSensitivity(key: keyof SensitivitySettings): number | string {
    return this.settings[key];
  }
  
  /**
   * Apply mouse movement sensitivity
   */
  public applyMouseMovementSensitivity(dx: number, dy: number): { dx: number, dy: number } {
    return {
      dx: dx * this.settings.mouseMovement,
      dy: dy * this.settings.mouseMovement
    };
  }
  
  /**
   * Apply mouse wheel sensitivity
   */
  public applyMouseWheelSensitivity(delta: number): number {
    return delta * this.settings.mouseScrollZoom;
  }
  
  /**
   * Apply gamepad sensitivity with optional curve
   */
  public applyGamepadSensitivity(value: number): number {
    // Apply deadzone
    if (Math.abs(value) < this.settings.gamepadDeadzone) {
      return 0;
    }
    
    // Normalize value after deadzone
    const normalizedValue = (Math.abs(value) - this.settings.gamepadDeadzone) / 
      (1 - this.settings.gamepadDeadzone);
    
    // Apply curve based on setting
    let processedValue = normalizedValue;
    
    switch (this.settings.gamepadCurve) {
      case 'linear':
        // No change needed - linear curve
        break;
      case 'exponential':
        // Apply exponential curve
        processedValue = normalizedValue * normalizedValue;
        break;
      case 'custom':
        // Custom curve could be implemented here
        // For now, use a mild curve (x^1.5)
        processedValue = Math.pow(normalizedValue, 1.5);
        break;
    }
    
    // Apply sensitivity
    processedValue *= this.settings.gamepadAxisSensitivity;
    
    // Restore original sign
    return Math.sign(value) * processedValue;
  }
  
  /**
   * Apply touch drag sensitivity
   */
  public applyTouchDragSensitivity(dx: number, dy: number): { dx: number, dy: number } {
    return {
      dx: dx * this.settings.touchDragSensitivity,
      dy: dy * this.settings.touchDragSensitivity
    };
  }
  
  /**
   * Apply touch pinch sensitivity
   */
  public applyTouchPinchSensitivity(delta: number): number {
    return delta * this.settings.touchPinchSensitivity;
  }
  
  /**
   * Check if a key should repeat
   */
  public shouldRepeatKey(timeHeld: number, lastRepeatTime: number): boolean {
    const firstRepeat = lastRepeatTime === 0;
    
    if (firstRepeat) {
      // First repeat after initial delay
      return timeHeld >= this.settings.keyRepeatDelay;
    } else {
      // Subsequent repeats at repeat rate
      return timeHeld >= this.settings.keyRepeatRate;
    }
  }
  
  /**
   * Set key repeat rate
   */
  public setKeyRepeatRate(delay: number, rate: number): void {
    this.settings.keyRepeatDelay = delay;
    this.settings.keyRepeatRate = rate;
  }
  
  /**
   * Set gamepad deadzone
   */
  public setGamepadDeadzone(deadzone: number): void {
    this.settings.gamepadDeadzone = Math.max(0, Math.min(1, deadzone));
  }
  
  /**
   * Set mouse sensitivity
   */
  public setMouseSensitivity(sensitivity: number): void {
    this.settings.mouseMovement = Math.max(0.1, sensitivity);
  }
  
  /**
   * Set mouse wheel zoom sensitivity
   */
  public setMouseWheelSensitivity(sensitivity: number): void {
    this.settings.mouseScrollZoom = Math.max(0.1, sensitivity);
  }
  
  /**
   * Set touch sensitivity
   */
  public setTouchSensitivity(dragSensitivity: number, pinchSensitivity: number): void {
    this.settings.touchDragSensitivity = Math.max(0.1, dragSensitivity);
    this.settings.touchPinchSensitivity = Math.max(0.1, pinchSensitivity);
  }
}
