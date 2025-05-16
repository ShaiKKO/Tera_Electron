/**
 * TerraFlux - Input System Types
 * 
 * Type definitions for the input system.
 */

/**
 * Input action types
 */
export enum InputAction {
  // Camera controls
  MOVE_CAMERA_UP,
  MOVE_CAMERA_DOWN,
  MOVE_CAMERA_LEFT,
  MOVE_CAMERA_RIGHT,
  ZOOM_CAMERA_IN,
  ZOOM_CAMERA_OUT,
  ZOOM_IN, // Alias for ZOOM_CAMERA_IN for backward compatibility
  ZOOM_OUT, // Alias for ZOOM_CAMERA_OUT for backward compatibility
  ROTATE_CAMERA_LEFT,
  ROTATE_CAMERA_RIGHT,
  RESET_CAMERA,
  
  // UI navigation
  UI_UP,
  UI_DOWN,
  UI_LEFT,
  UI_RIGHT,
  UI_CONFIRM,
  UI_CANCEL,
  UI_TAB_NEXT,
  UI_TAB_PREV,
  
  // Game actions
  SELECT_TILE,
  DESELECT,
  CONTEXT_ACTION_PRIMARY,
  CONTEXT_ACTION_SECONDARY,
  CONTEXT_MENU,
  PAUSE_GAME,
  SPEED_NORMAL,
  SPEED_FAST,
  SPEED_ULTRA,
  
  // Debug actions
  TOGGLE_DEBUG_OVERLAY,
  TOGGLE_GRID,
  SCREENSHOT
}

/**
 * Input type enumeration
 */
export enum InputType {
  KEYBOARD,
  MOUSE,
  GAMEPAD,
  TOUCH,
  GESTURE // For gesture-based inputs
}

/**
 * Input context enumeration
 */
export enum InputContext {
  DEFAULT = 'DEFAULT',
  ENTITY_SELECTED = 'ENTITY_SELECTED', 
  BUILDING_PLACEMENT = 'BUILDING_PLACEMENT',
  MENU_OPEN = 'MENU_OPEN',
  DIALOG_OPEN = 'DIALOG_OPEN'
}

/**
 * Game context enumeration (for backward compatibility)
 */
export enum GameContext {
  DEFAULT = 'DEFAULT',
  ENTITY_SELECTED = 'ENTITY_SELECTED', 
  BUILDING_PLACEMENT = 'BUILDING_PLACEMENT',
  MENU_OPEN = 'MENU_OPEN',
  DIALOG_OPEN = 'DIALOG_OPEN'
}

/**
 * Gesture type enumeration
 */
export enum GestureType {
  TAP = 'TAP',
  DOUBLE_TAP = 'DOUBLE_TAP',
  LONG_PRESS = 'LONG_PRESS',
  SWIPE_UP = 'SWIPE_UP',
  SWIPE_DOWN = 'SWIPE_DOWN',
  SWIPE_LEFT = 'SWIPE_LEFT',
  SWIPE_RIGHT = 'SWIPE_RIGHT',
  PINCH_IN = 'PINCH_IN',
  PINCH_OUT = 'PINCH_OUT',
  ROTATE = 'ROTATE'
}

/**
 * Sensitivity settings interface
 */
export interface SensitivitySettings {
  mouseMovement: number;
  mouseScrollZoom: number;
  keyRepeatDelay: number;
  keyRepeatRate: number;
  gamepadDeadzone: number;
  gamepadAxisSensitivity: number;
  gamepadCurve: 'linear' | 'exponential' | 'custom';
  touchDragSensitivity: number;
  touchPinchSensitivity: number;
}

/**
 * Input binding interface
 */
export interface InputBinding {
  inputType: InputType;
  inputCode: string | number;
  action: InputAction;
}

/**
 * Gamepad button state
 */
export interface GamepadState {
  buttons: boolean[];
  axes: number[];
  timestamp: number;
}

/**
 * Gamepad axis mapping
 */
export interface GamepadAxisMapping {
  positive: InputAction;
  negative: InputAction;
  deadzone: number;
}

/**
 * Gamepad bindings
 */
export interface GamepadBindings {
  buttons: Record<number, InputAction>;
  axes: Record<number, GamepadAxisMapping>;
}

/**
 * Touch point data
 */
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  time: number;
}

/**
 * Touch state
 */
export interface TouchState {
  activeTouches: Map<number, TouchPoint>;
  startTouches: Map<number, TouchPoint>;
}

/**
 * Camera state
 */
export interface CameraState {
  position: { x: number; y: number };
  zoom: number;
  rotation: number;
}

/**
 * Coordinate
 */
export interface Coordinate {
  x: number;
  y: number;
}

/**
 * Vector2D
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Context action type
 */
export interface ContextAction {
  context: InputContext;
  action: InputAction;
  handler: InputHandlerCallback;
  label: string; // User-friendly label for the action
  icon?: string; // Optional icon identifier
}

/**
 * Input settings interface
 */
export interface InputSettings {
  sensitivity: SensitivitySettings;
  bindings?: InputBinding[];
  accessibility?: AccessibilityOptions;
  defaultContext?: InputContext;
  version?: string | number; // For settings versioning
}

/**
 * Accessibility options interface
 */
export interface AccessibilityOptions {
  keyRepeatEnabled: boolean;
  autoRepeatDelay: number;
  autoRepeatRate: number;
  mouseHelpers: boolean;
  highContrastMode: boolean;
  slowMotionFactor: number;
  inputSensitivity?: number; // Global sensitivity multiplier
  deadZone?: number; // Global deadzone setting
}

/**
 * Input event
 */
export interface InputEvent {
  action: InputAction;
  inputType: InputType;
  inputCode: string | number;
  value?: number;
  position?: Coordinate;
  context: InputContext;
  timestamp: number;
  type?: string | InputType; // Optional for gesture events
  rawEvent?: any; // Original browser event if available
}

/**
 * Input handler callback
 */
export type InputHandlerCallback = (event: InputEvent) => void;

/**
 * Context action map
 */
export type ContextActionMap = Record<InputContext, Map<InputAction, InputHandlerCallback[]>>;
