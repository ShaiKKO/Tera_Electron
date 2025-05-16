"use strict";
/**
 * TerraFlux - Input System Types
 *
 * Type definitions for the input system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestureType = exports.GameContext = exports.InputContext = exports.InputType = exports.InputAction = void 0;
/**
 * Input action types
 */
var InputAction;
(function (InputAction) {
    // Camera controls
    InputAction[InputAction["MOVE_CAMERA_UP"] = 0] = "MOVE_CAMERA_UP";
    InputAction[InputAction["MOVE_CAMERA_DOWN"] = 1] = "MOVE_CAMERA_DOWN";
    InputAction[InputAction["MOVE_CAMERA_LEFT"] = 2] = "MOVE_CAMERA_LEFT";
    InputAction[InputAction["MOVE_CAMERA_RIGHT"] = 3] = "MOVE_CAMERA_RIGHT";
    InputAction[InputAction["ZOOM_CAMERA_IN"] = 4] = "ZOOM_CAMERA_IN";
    InputAction[InputAction["ZOOM_CAMERA_OUT"] = 5] = "ZOOM_CAMERA_OUT";
    InputAction[InputAction["ZOOM_IN"] = 6] = "ZOOM_IN";
    InputAction[InputAction["ZOOM_OUT"] = 7] = "ZOOM_OUT";
    InputAction[InputAction["ROTATE_CAMERA_LEFT"] = 8] = "ROTATE_CAMERA_LEFT";
    InputAction[InputAction["ROTATE_CAMERA_RIGHT"] = 9] = "ROTATE_CAMERA_RIGHT";
    InputAction[InputAction["RESET_CAMERA"] = 10] = "RESET_CAMERA";
    // UI navigation
    InputAction[InputAction["UI_UP"] = 11] = "UI_UP";
    InputAction[InputAction["UI_DOWN"] = 12] = "UI_DOWN";
    InputAction[InputAction["UI_LEFT"] = 13] = "UI_LEFT";
    InputAction[InputAction["UI_RIGHT"] = 14] = "UI_RIGHT";
    InputAction[InputAction["UI_CONFIRM"] = 15] = "UI_CONFIRM";
    InputAction[InputAction["UI_CANCEL"] = 16] = "UI_CANCEL";
    InputAction[InputAction["UI_TAB_NEXT"] = 17] = "UI_TAB_NEXT";
    InputAction[InputAction["UI_TAB_PREV"] = 18] = "UI_TAB_PREV";
    // Game actions
    InputAction[InputAction["SELECT_TILE"] = 19] = "SELECT_TILE";
    InputAction[InputAction["DESELECT"] = 20] = "DESELECT";
    InputAction[InputAction["CONTEXT_ACTION_PRIMARY"] = 21] = "CONTEXT_ACTION_PRIMARY";
    InputAction[InputAction["CONTEXT_ACTION_SECONDARY"] = 22] = "CONTEXT_ACTION_SECONDARY";
    InputAction[InputAction["CONTEXT_MENU"] = 23] = "CONTEXT_MENU";
    InputAction[InputAction["PAUSE_GAME"] = 24] = "PAUSE_GAME";
    InputAction[InputAction["SPEED_NORMAL"] = 25] = "SPEED_NORMAL";
    InputAction[InputAction["SPEED_FAST"] = 26] = "SPEED_FAST";
    InputAction[InputAction["SPEED_ULTRA"] = 27] = "SPEED_ULTRA";
    // Debug actions
    InputAction[InputAction["TOGGLE_DEBUG_OVERLAY"] = 28] = "TOGGLE_DEBUG_OVERLAY";
    InputAction[InputAction["TOGGLE_GRID"] = 29] = "TOGGLE_GRID";
    InputAction[InputAction["SCREENSHOT"] = 30] = "SCREENSHOT";
})(InputAction || (exports.InputAction = InputAction = {}));
/**
 * Input type enumeration
 */
var InputType;
(function (InputType) {
    InputType[InputType["KEYBOARD"] = 0] = "KEYBOARD";
    InputType[InputType["MOUSE"] = 1] = "MOUSE";
    InputType[InputType["GAMEPAD"] = 2] = "GAMEPAD";
    InputType[InputType["TOUCH"] = 3] = "TOUCH";
    InputType[InputType["GESTURE"] = 4] = "GESTURE"; // For gesture-based inputs
})(InputType || (exports.InputType = InputType = {}));
/**
 * Input context enumeration
 */
var InputContext;
(function (InputContext) {
    InputContext["DEFAULT"] = "DEFAULT";
    InputContext["ENTITY_SELECTED"] = "ENTITY_SELECTED";
    InputContext["BUILDING_PLACEMENT"] = "BUILDING_PLACEMENT";
    InputContext["MENU_OPEN"] = "MENU_OPEN";
    InputContext["DIALOG_OPEN"] = "DIALOG_OPEN";
})(InputContext || (exports.InputContext = InputContext = {}));
/**
 * Game context enumeration (for backward compatibility)
 */
var GameContext;
(function (GameContext) {
    GameContext["DEFAULT"] = "DEFAULT";
    GameContext["ENTITY_SELECTED"] = "ENTITY_SELECTED";
    GameContext["BUILDING_PLACEMENT"] = "BUILDING_PLACEMENT";
    GameContext["MENU_OPEN"] = "MENU_OPEN";
    GameContext["DIALOG_OPEN"] = "DIALOG_OPEN";
})(GameContext || (exports.GameContext = GameContext = {}));
/**
 * Gesture type enumeration
 */
var GestureType;
(function (GestureType) {
    GestureType["TAP"] = "TAP";
    GestureType["DOUBLE_TAP"] = "DOUBLE_TAP";
    GestureType["LONG_PRESS"] = "LONG_PRESS";
    GestureType["SWIPE_UP"] = "SWIPE_UP";
    GestureType["SWIPE_DOWN"] = "SWIPE_DOWN";
    GestureType["SWIPE_LEFT"] = "SWIPE_LEFT";
    GestureType["SWIPE_RIGHT"] = "SWIPE_RIGHT";
    GestureType["PINCH_IN"] = "PINCH_IN";
    GestureType["PINCH_OUT"] = "PINCH_OUT";
    GestureType["ROTATE"] = "ROTATE";
})(GestureType || (exports.GestureType = GestureType = {}));
