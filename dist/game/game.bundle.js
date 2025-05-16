(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["TerraFluxGame"] = factory();
	else
		root["TerraFluxGame"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/game/components/HexPosition.ts":
/*!********************************************!*\
  !*** ./src/game/components/HexPosition.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HEX_POSITION_COMPONENT_ID: () => (/* binding */ HEX_POSITION_COMPONENT_ID),
/* harmony export */   HexPositionComponent: () => (/* binding */ HexPositionComponent)
/* harmony export */ });
/* harmony import */ var _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/ecs/Component */ "./src/game/core/ecs/Component.ts");
/* harmony import */ var _core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/utils/TypeRegistry */ "./src/game/core/utils/TypeRegistry.ts");
/* harmony import */ var _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/utils/CoordinateSystem */ "./src/game/core/utils/CoordinateSystem.ts");
/**
 * TerraFlux - Hex Position Component
 *
 * Represents a position in the hex grid coordinate system.
 */



// Component ID
const HEX_POSITION_COMPONENT_ID = 'hexPosition';
// Hex Position component
class HexPositionComponent extends _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(q = 0, r = 0) {
        super();
        // Type ID of this component
        this.typeId = HEX_POSITION_COMPONENT_ID;
        // Hex grid coordinates (axial system)
        this.q = 0;
        this.r = 0;
        this.q = q;
        this.r = r;
    }
    /**
     * Clone the component
     */
    clone() {
        return new HexPositionComponent(this.q, this.r);
    }
    /**
     * Reset component to its initial state
     */
    reset() {
        this.q = 0;
        this.r = 0;
    }
    /**
     * Get the world position corresponding to this hex position
     */
    toWorld() {
        return _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.hexToWorld(this.q, this.r);
    }
    /**
     * Set the position from world coordinates
     *
     * @param x World X coordinate
     * @param y World Y coordinate
     */
    fromWorld(x, y) {
        const hex = _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.worldToHex(x, y);
        this.q = hex.q;
        this.r = hex.r;
    }
    /**
     * Get the grid position corresponding to this hex position
     */
    toGrid() {
        return _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.hexToGrid(this.q, this.r);
    }
    /**
     * Set the position from grid coordinates
     *
     * @param x Grid X coordinate
     * @param y Grid Y coordinate
     */
    fromGrid(x, y) {
        const hex = _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.gridToHex(x, y);
        this.q = hex.q;
        this.r = hex.r;
    }
    /**
     * Calculate the distance to another hex position
     *
     * @param other The other hex position
     * @returns Distance in hex units
     */
    distanceTo(other) {
        return _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.hexDistance(this.q, this.r, other.q, other.r);
    }
    /**
     * Get the neighboring hex positions
     *
     * @returns Array of neighboring hex positions
     */
    getNeighbors() {
        return _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem.getHexNeighbors(this.q, this.r);
    }
    /**
     * Serialize component data
     */
    serialize() {
        return Object.assign(Object.assign({}, super.serialize()), { q: this.q, r: this.r });
    }
    /**
     * Deserialize component data
     */
    deserialize(data) {
        var _a, _b;
        super.deserialize(data);
        this.q = (_a = data.q) !== null && _a !== void 0 ? _a : 0;
        this.r = (_b = data.r) !== null && _b !== void 0 ? _b : 0;
    }
}
// Register the hex position component
_core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__.componentRegistry.register({
    id: HEX_POSITION_COMPONENT_ID,
    name: 'HexPosition',
    create: () => new HexPositionComponent()
});


/***/ }),

/***/ "./src/game/components/Position.ts":
/*!*****************************************!*\
  !*** ./src/game/components/Position.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POSITION_COMPONENT_ID: () => (/* binding */ POSITION_COMPONENT_ID),
/* harmony export */   PositionComponent: () => (/* binding */ PositionComponent)
/* harmony export */ });
/* harmony import */ var _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/ecs/Component */ "./src/game/core/ecs/Component.ts");
/* harmony import */ var _core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/utils/TypeRegistry */ "./src/game/core/utils/TypeRegistry.ts");
/**
 * TerraFlux - Position Component
 *
 * Represents a position in 2D space.
 */


// Component ID
const POSITION_COMPONENT_ID = 'position';
// Position component
class PositionComponent extends _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(x = 0, y = 0) {
        super();
        // Type ID of this component
        this.typeId = POSITION_COMPONENT_ID;
        // Position data
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
    }
    // Clone the component
    clone() {
        return new PositionComponent(this.x, this.y);
    }
    // Reset component to its initial state
    reset() {
        this.x = 0;
        this.y = 0;
    }
    // Serialize component data
    serialize() {
        return Object.assign(Object.assign({}, super.serialize()), { x: this.x, y: this.y });
    }
    // Deserialize component data
    deserialize(data) {
        var _a, _b;
        super.deserialize(data);
        this.x = (_a = data.x) !== null && _a !== void 0 ? _a : 0;
        this.y = (_b = data.y) !== null && _b !== void 0 ? _b : 0;
    }
}
// Register the position component
_core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__.componentRegistry.register({
    id: POSITION_COMPONENT_ID,
    name: 'Position',
    create: () => new PositionComponent()
});


/***/ }),

/***/ "./src/game/components/Velocity.ts":
/*!*****************************************!*\
  !*** ./src/game/components/Velocity.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   VELOCITY_COMPONENT_ID: () => (/* binding */ VELOCITY_COMPONENT_ID),
/* harmony export */   VelocityComponent: () => (/* binding */ VelocityComponent)
/* harmony export */ });
/* harmony import */ var _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/ecs/Component */ "./src/game/core/ecs/Component.ts");
/* harmony import */ var _core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/utils/TypeRegistry */ "./src/game/core/utils/TypeRegistry.ts");
/**
 * TerraFlux - Velocity Component
 *
 * Represents velocity in 2D space.
 */


// Component ID
const VELOCITY_COMPONENT_ID = 'velocity';
// Velocity component
class VelocityComponent extends _core_ecs_Component__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(vx = 0, vy = 0) {
        super();
        // Type ID of this component
        this.typeId = VELOCITY_COMPONENT_ID;
        // Velocity data
        this.vx = 0;
        this.vy = 0;
        this.vx = vx;
        this.vy = vy;
    }
    // Clone the component
    clone() {
        return new VelocityComponent(this.vx, this.vy);
    }
    // Reset component to its initial state
    reset() {
        this.vx = 0;
        this.vy = 0;
    }
    // Serialize component data
    serialize() {
        return Object.assign(Object.assign({}, super.serialize()), { vx: this.vx, vy: this.vy });
    }
    // Deserialize component data
    deserialize(data) {
        var _a, _b;
        super.deserialize(data);
        this.vx = (_a = data.vx) !== null && _a !== void 0 ? _a : 0;
        this.vy = (_b = data.vy) !== null && _b !== void 0 ? _b : 0;
    }
}
// Register the velocity component
_core_utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_1__.componentRegistry.register({
    id: VELOCITY_COMPONENT_ID,
    name: 'Velocity',
    create: () => new VelocityComponent()
});


/***/ }),

/***/ "./src/game/core/Game.ts":
/*!*******************************!*\
  !*** ./src/game/core/Game.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Game: () => (/* binding */ Game),
/* harmony export */   GameEventType: () => (/* binding */ GameEventType),
/* harmony export */   GameState: () => (/* binding */ GameState),
/* harmony export */   game: () => (/* binding */ game)
/* harmony export */ });
/* harmony import */ var _ecs_EntityManager__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ecs/EntityManager */ "./src/game/core/ecs/EntityManager.ts");
/* harmony import */ var _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ecs/SystemManager */ "./src/game/core/ecs/SystemManager.ts");
/* harmony import */ var _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ecs/EventEmitter */ "./src/game/core/ecs/EventEmitter.ts");
/* harmony import */ var _utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/TypeRegistry */ "./src/game/core/utils/TypeRegistry.ts");
/**
 * TerraFlux - Game Core
 *
 * Central game engine class that ties together the ECS framework.
 * Manages the game loop, timing, and provides access to global managers.
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};




/**
 * Game state enumeration
 */
var GameState;
(function (GameState) {
    GameState["UNINITIALIZED"] = "uninitialized";
    GameState["INITIALIZING"] = "initializing";
    GameState["READY"] = "ready";
    GameState["RUNNING"] = "running";
    GameState["PAUSED"] = "paused";
    GameState["STOPPING"] = "stopping";
    GameState["STOPPED"] = "stopped";
})(GameState || (GameState = {}));
/**
 * Game event types
 */
var GameEventType;
(function (GameEventType) {
    GameEventType["INITIALIZED"] = "game_initialized";
    GameEventType["STARTED"] = "game_started";
    GameEventType["PAUSED"] = "game_paused";
    GameEventType["RESUMED"] = "game_resumed";
    GameEventType["STOPPED"] = "game_stopped";
    GameEventType["UPDATE"] = "game_update";
    GameEventType["ERROR"] = "game_error";
    GameEventType["TIME_SCALE_CHANGED"] = "game_time_scale_changed";
    GameEventType["TIMESTEP_MODE_CHANGED"] = "game_timestep_mode_changed";
    GameEventType["PERFORMANCE_SNAPSHOT"] = "game_performance_snapshot";
})(GameEventType || (GameEventType = {}));
/**
 * Central game engine class
 */
class Game {
    /**
     * Constructor for Game
     *
     * @param config Game configuration options
     */
    constructor(config = {}) {
        var _a, _b, _c, _d, _e, _f;
        /**
         * Current game state
         */
        this._state = GameState.UNINITIALIZED;
        /**
         * Time of the last frame
         */
        this._lastFrameTime = 0;
        /**
         * Time accumulator for fixed timestep
         */
        this._accumulator = 0;
        /**
         * Stats about the game loop
         */
        this._stats = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            idleTime: 0,
            totalFrames: 0,
            droppedFrames: 0,
            timeScale: 1.0,
            entityCount: 0,
            systemCount: 0
        };
        this._targetFPS = (_a = config.targetFPS) !== null && _a !== void 0 ? _a : 60;
        this._maxDeltaTime = (_b = config.maxDeltaTime) !== null && _b !== void 0 ? _b : 0.25; // 250ms
        this._debug = (_c = config.debug) !== null && _c !== void 0 ? _c : false;
        this._useFixedTimestep = (_d = config.useFixedTimestep) !== null && _d !== void 0 ? _d : false;
        this._fixedTimestepValue = (_e = config.fixedTimestepValue) !== null && _e !== void 0 ? _e : 1 / 60;
        this._timeScale = (_f = config.timeScale) !== null && _f !== void 0 ? _f : 1.0;
        // Auto-start if specified
        if (config.autoStart) {
            this.initialize().then(() => this.start());
        }
    }
    /**
     * Get the current game state
     */
    get state() {
        return this._state;
    }
    /**
     * Get the target updates per second
     */
    get targetFPS() {
        return this._targetFPS;
    }
    /**
     * Set the target updates per second
     */
    set targetFPS(value) {
        this._targetFPS = value;
    }
    /**
     * Get whether fixed timestep is being used
     */
    get useFixedTimestep() {
        return this._useFixedTimestep;
    }
    /**
     * Set whether fixed timestep should be used
     */
    set useFixedTimestep(value) {
        const oldValue = this._useFixedTimestep;
        this._useFixedTimestep = value;
        if (oldValue !== this._useFixedTimestep) {
            _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.TIMESTEP_MODE_CHANGED, this, this._useFixedTimestep);
        }
    }
    /**
     * Get the fixed timestep value in seconds
     */
    get fixedTimestepValue() {
        return this._fixedTimestepValue;
    }
    /**
     * Set the fixed timestep value in seconds
     */
    set fixedTimestepValue(value) {
        this._fixedTimestepValue = Math.max(0.001, Math.min(0.1, value));
    }
    /**
     * Get the time scale factor
     */
    get timeScale() {
        return this._timeScale;
    }
    /**
     * Set the time scale factor
     */
    set timeScale(value) {
        const oldValue = this._timeScale;
        this._timeScale = Math.max(0.1, Math.min(10, value));
        if (oldValue !== this._timeScale) {
            _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.TIME_SCALE_CHANGED, this, this._timeScale);
        }
    }
    /**
     * Get the maximum delta time
     */
    get maxDeltaTime() {
        return this._maxDeltaTime;
    }
    /**
     * Set the maximum delta time
     */
    set maxDeltaTime(value) {
        this._maxDeltaTime = value;
    }
    /**
     * Get whether the game is currently in debug mode
     */
    get debug() {
        return this._debug;
    }
    /**
     * Set whether the game is currently in debug mode
     */
    set debug(value) {
        this._debug = value;
    }
    /**
     * Get the current game stats
     */
    get stats() {
        return this._stats;
    }
    /**
     * Initialize the game
     *
     * @returns Promise that resolves when initialization is complete
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if we're already initialized
            if (this._state !== GameState.UNINITIALIZED) {
                return true;
            }
            // Set state to initializing
            this._state = GameState.INITIALIZING;
            try {
                // Initialize core systems
                // If needed, this is where we would load configuration, 
                // assets, or set up any other required infrastructure
                // Set state to ready
                this._state = GameState.READY;
                // Emit initialized event
                _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.INITIALIZED, this);
                return true;
            }
            catch (error) {
                // Set state back to uninitialized
                this._state = GameState.UNINITIALIZED;
                // Emit error event
                _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.ERROR, this, error);
                // Re-throw the error
                throw error;
            }
        });
    }
    /**
     * Start the game loop
     *
     * @returns True if the game was started successfully
     */
    start() {
        // Check if we're in a valid state to start
        if (this._state !== GameState.READY && this._state !== GameState.PAUSED && this._state !== GameState.STOPPED) {
            return false;
        }
        // Set state to running
        this._state = GameState.RUNNING;
        // Reset frame time
        this._lastFrameTime = performance.now();
        // Start the game loop
        this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
        // Emit started event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.STARTED, this);
        return true;
    }
    /**
     * Pause the game loop
     *
     * @returns True if the game was paused successfully
     */
    pause() {
        // Check if we're in a valid state to pause
        if (this._state !== GameState.RUNNING) {
            return false;
        }
        // Set state to paused
        this._state = GameState.PAUSED;
        // Stop the game loop
        if (this._rafId !== undefined) {
            cancelAnimationFrame(this._rafId);
            this._rafId = undefined;
        }
        // Emit paused event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.PAUSED, this);
        return true;
    }
    /**
     * Resume the game loop
     *
     * @returns True if the game was resumed successfully
     */
    resume() {
        // Check if we're in a valid state to resume
        if (this._state !== GameState.PAUSED) {
            return false;
        }
        // Set state to running
        this._state = GameState.RUNNING;
        // Reset frame time
        this._lastFrameTime = performance.now();
        // Start the game loop
        this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
        // Emit resumed event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.RESUMED, this);
        return true;
    }
    /**
     * Stop the game loop
     *
     * @returns True if the game was stopped successfully
     */
    stop() {
        // Check if we're in a valid state to stop
        if (this._state !== GameState.RUNNING && this._state !== GameState.PAUSED) {
            return false;
        }
        // Set state to stopping
        this._state = GameState.STOPPING;
        // Stop the game loop
        if (this._rafId !== undefined) {
            cancelAnimationFrame(this._rafId);
            this._rafId = undefined;
        }
        // Reset stats
        this._stats = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            idleTime: 0,
            totalFrames: 0,
            droppedFrames: 0,
            timeScale: this._timeScale,
            entityCount: 0,
            systemCount: 0
        };
        // Set state to stopped
        this._state = GameState.STOPPED;
        // Emit stopped event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.STOPPED, this);
        return true;
    }
    /**
     * Reset the game to its initial state
     *
     * @returns True if the game was reset successfully
     */
    reset() {
        // Stop the game first
        this.stop();
        // Clear all entities
        _ecs_EntityManager__WEBPACK_IMPORTED_MODULE_0__.entityManager.clear();
        // Clear all systems
        _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__.systemManager.clear();
        // Set state to ready
        this._state = GameState.READY;
        return true;
    }
    /**
     * Main game loop
     *
     * @param timestamp Current timestamp from requestAnimationFrame
     */
    _gameLoop(timestamp) {
        // Calculate delta time with time scaling
        const rawDeltaTime = Math.min((timestamp - this._lastFrameTime) / 1000, this._maxDeltaTime);
        const scaledDeltaTime = rawDeltaTime * this._timeScale;
        this._lastFrameTime = timestamp;
        // Start update timing
        const updateStartTime = performance.now();
        if (this._useFixedTimestep) {
            // Fixed timestep implementation
            this._accumulator += scaledDeltaTime;
            // Run as many fixed updates as needed
            let updatesThisFrame = 0;
            while (this._accumulator >= this._fixedTimestepValue && updatesThisFrame < 10) {
                // Update systems with fixed timestep
                _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__.systemManager.update(this._fixedTimestepValue);
                this._accumulator -= this._fixedTimestepValue;
                updatesThisFrame++;
            }
            // If we've hit max updates but still have accumulator time, we're falling behind
            if (this._accumulator >= this._fixedTimestepValue && this._debug) {
                console.warn(`Game loop falling behind! Accumulator: ${this._accumulator.toFixed(3)}s`);
            }
        }
        else {
            // Standard variable timestep
            _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__.systemManager.update(scaledDeltaTime);
        }
        // End update timing
        const updateEndTime = performance.now();
        // Start render timing (placeholder for future rendering system)
        const renderStartTime = performance.now();
        const renderEndTime = renderStartTime; // No rendering yet
        // Update stats
        this._updateStats(rawDeltaTime, updateEndTime - updateStartTime, renderEndTime - renderStartTime);
        // Emit update event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.UPDATE, this, scaledDeltaTime);
        // Continue the loop if still running
        if (this._state === GameState.RUNNING) {
            this._rafId = requestAnimationFrame(this._gameLoop.bind(this));
        }
    }
    /**
     * Update game stats
     *
     * @param deltaTime Time elapsed since the last update in seconds
     * @param updateTime Time taken for the update in milliseconds
     * @param renderTime Time taken for rendering in milliseconds
     */
    _updateStats(deltaTime, updateTime, renderTime = 0) {
        // Calculate frame time and determine if frame was dropped
        const frameTime = updateTime + renderTime;
        const targetFrameTime = 1000 / this._targetFPS;
        const droppedFrame = frameTime > targetFrameTime * 1.2; // 20% margin
        // Calculate idle time (time spent not updating or rendering)
        const idleTime = Math.max(0, targetFrameTime - frameTime);
        // Increment total frames
        this._stats.totalFrames++;
        if (droppedFrame)
            this._stats.droppedFrames++;
        // Calculate exponential moving averages
        const alpha = 0.1; // Smoothing factor
        this._stats.fps = (1 / deltaTime) * alpha + this._stats.fps * (1 - alpha);
        this._stats.frameTime = frameTime * alpha + this._stats.frameTime * (1 - alpha);
        this._stats.updateTime = updateTime * alpha + this._stats.updateTime * (1 - alpha);
        this._stats.renderTime = renderTime * alpha + this._stats.renderTime * (1 - alpha);
        this._stats.idleTime = idleTime * alpha + this._stats.idleTime * (1 - alpha);
        // Update entity and system counts
        this._stats.entityCount = _ecs_EntityManager__WEBPACK_IMPORTED_MODULE_0__.entityManager.getEntityCount();
        this._stats.systemCount = _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__.systemManager.getSystemCount();
        this._stats.timeScale = this._timeScale;
        // Log stats in debug mode
        if (this._debug && this._stats.totalFrames % 60 === 0) {
            console.log(`FPS: ${this._stats.fps.toFixed(2)}, ` +
                `Frame: ${this._stats.frameTime.toFixed(2)}ms, ` +
                `Update: ${this._stats.updateTime.toFixed(2)}ms, ` +
                `Render: ${this._stats.renderTime.toFixed(2)}ms, ` +
                `Entities: ${this._stats.entityCount}, ` +
                `Speed: ${this._stats.timeScale.toFixed(1)}x`);
        }
    }
    /**
     * Get the entity manager
     */
    get entityManager() {
        return _ecs_EntityManager__WEBPACK_IMPORTED_MODULE_0__.entityManager;
    }
    /**
     * Get the system manager
     */
    get systemManager() {
        return _ecs_SystemManager__WEBPACK_IMPORTED_MODULE_1__.systemManager;
    }
    /**
     * Get the event emitter
     */
    get eventEmitter() {
        return _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter;
    }
    /**
     * Get the component registry
     */
    get componentRegistry() {
        return _utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_3__.componentRegistry;
    }
    /**
     * Toggle between fixed and variable timestep
     * @returns New timestep mode (true = fixed, false = variable)
     */
    toggleTimestepMode() {
        this.useFixedTimestep = !this._useFixedTimestep;
        if (this._debug) {
            console.log(`Switched to ${this._useFixedTimestep ? 'fixed' : 'variable'} timestep mode`);
        }
        return this._useFixedTimestep;
    }
    /**
     * Cycle through game speeds (normal -> fast -> ultra-fast -> normal)
     * @returns New time scale value
     */
    cycleGameSpeed() {
        if (this._timeScale <= 1.0) {
            this.setFastSpeed();
        }
        else if (this._timeScale <= 2.0) {
            this.setUltraFastSpeed();
        }
        else {
            this.setNormalSpeed();
        }
        if (this._debug) {
            console.log(`Game speed set to ${this._timeScale}x`);
        }
        return this._timeScale;
    }
    /**
     * Set normal game speed (1x)
     */
    setNormalSpeed() {
        this.timeScale = 1.0;
    }
    /**
     * Set fast game speed (2x)
     */
    setFastSpeed() {
        this.timeScale = 2.0;
    }
    /**
     * Set ultra-fast game speed (5x)
     */
    setUltraFastSpeed() {
        this.timeScale = 5.0;
    }
    /**
     * Take a performance snapshot
     * @returns Object with detailed performance metrics
     */
    takePerformanceSnapshot() {
        const snapshot = Object.assign(Object.assign({}, this._stats), { timestamp: Date.now(), memory: typeof performance !== 'undefined' && 'memory' in performance ? {
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize
            } : undefined });
        if (this._debug) {
            console.table(snapshot);
        }
        // Emit performance snapshot event
        _ecs_EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(GameEventType.PERFORMANCE_SNAPSHOT, this, snapshot);
        return snapshot;
    }
}
// Create a global game instance
const game = new Game();


/***/ }),

/***/ "./src/game/core/ecs/Component.ts":
/*!****************************************!*\
  !*** ./src/game/core/ecs/Component.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Component: () => (/* binding */ Component)
/* harmony export */ });
/* harmony import */ var _utils_UUID__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/UUID */ "./src/game/core/utils/UUID.ts");
/**
 * TerraFlux - Component Base Class
 *
 * Provides the foundation for all components in the ECS architecture.
 * Components are pure data containers with minimal logic.
 */

/**
 * Abstract base class for all components
 */
class Component {
    /**
     * Constructor for Component
     */
    constructor() {
        this._instanceId = _utils_UUID__WEBPACK_IMPORTED_MODULE_0__.UUID.generateWithPrefix('comp-inst');
    }
    /**
     * Get the unique instance ID for this component
     */
    get instanceId() {
        return this._instanceId;
    }
    /**
     * Clone this component to create a new instance with the same data
     * Derived classes should override this to properly copy their data
     */
    clone() {
        // This is a basic implementation that should be overridden
        // by derived classes to properly copy their data
        const clone = Object.create(Object.getPrototypeOf(this));
        return Object.assign(clone, this);
    }
    /**
     * Reset the component to its initial state for reuse from pool
     * Derived classes should override this to properly reset their data
     */
    reset() {
        // This is a basic implementation that should be overridden
        // by derived classes to properly reset their data
    }
    /**
     * Serialize the component to a JSON-compatible object
     * Derived classes should override this to properly serialize their data
     *
     * @returns A JSON-compatible object representing this component's data
     */
    serialize() {
        // Default implementation - derived classes should override
        return {
            typeId: this.typeId,
            instanceId: this.instanceId
        };
    }
    /**
     * Deserialize the component from a JSON-compatible object
     * Derived classes should override this to properly deserialize their data
     *
     * @param data A JSON-compatible object to deserialize from
     */
    deserialize(data) {
        // Default implementation - derived classes should override
        // Most implementations will do nothing with typeId and instanceId
        // as these are typically immutable, but may be used for validation
    }
    /**
     * Creates an object pool factory for this component type
     * This can be used to efficiently reuse component instances
     *
     * @param ComponentClass The component class to create a pool for
     * @param initialSize The initial size of the pool
     * @param growthFactor How much to grow the pool by when more instances are needed
     * @returns A factory function that creates/reuses component instances
     */
    static createPool(ComponentClass, initialSize = 10, growthFactor = 5) {
        // Create the initial pool of components
        const pool = Array(initialSize)
            .fill(null)
            .map(() => new ComponentClass());
        // Return a factory function that gets from the pool or creates new instances
        return () => {
            // If there are no components left in the pool, add more
            if (pool.length === 0) {
                for (let i = 0; i < growthFactor; i++) {
                    pool.push(new ComponentClass());
                }
            }
            // Return a component from the pool
            const component = pool.pop();
            component.reset(); // Ensure the component is reset to initial state
            return component;
        };
    }
}


/***/ }),

/***/ "./src/game/core/ecs/ComponentStorage.ts":
/*!***********************************************!*\
  !*** ./src/game/core/ecs/ComponentStorage.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ArrayComponentStorage: () => (/* binding */ ArrayComponentStorage),
/* harmony export */   SparseSetComponentStorage: () => (/* binding */ SparseSetComponentStorage),
/* harmony export */   createComponentStorage: () => (/* binding */ createComponentStorage)
/* harmony export */ });
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./types */ "./src/game/core/ecs/types.ts");
/**
 * TerraFlux - Component Storage
 *
 * Provides storage implementations for components in the ECS architecture.
 * Implements both Array of Structs (AoS) and Struct of Arrays (SoA) approaches.
 */

/**
 * Array of Structs (AoS) implementation of component storage
 * Each entity's components are stored together in a map
 * Good for complex relational components or those accessed together
 */
class ArrayComponentStorage {
    /**
     * Constructor
     *
     * @param componentTypeId The component type ID
     */
    constructor(componentTypeId) {
        /**
         * The type of storage strategy
         */
        this.storageType = _types__WEBPACK_IMPORTED_MODULE_0__.ComponentStorageType.ARRAY_OF_STRUCTS;
        /**
         * Maps entity IDs to components
         */
        this.entityComponentMap = new Map();
        this.componentTypeId = componentTypeId;
    }
    /**
     * Add a component for an entity
     *
     * @param entityId The entity ID
     * @param component The component to add
     * @returns True if the component was added, false if it already existed
     */
    add(entityId, component) {
        // Check if this entity already has this component
        if (this.entityComponentMap.has(entityId)) {
            return false;
        }
        // Add the component
        this.entityComponentMap.set(entityId, component);
        return true;
    }
    /**
     * Get a component for an entity
     *
     * @param entityId The entity ID
     * @returns The component, or undefined if not found
     */
    get(entityId) {
        return this.entityComponentMap.get(entityId);
    }
    /**
     * Check if an entity has a component
     *
     * @param entityId The entity ID
     * @returns True if the entity has the component
     */
    has(entityId) {
        return this.entityComponentMap.has(entityId);
    }
    /**
     * Remove a component from an entity
     *
     * @param entityId The entity ID
     * @returns The removed component, or undefined if not found
     */
    remove(entityId) {
        const component = this.entityComponentMap.get(entityId);
        if (component) {
            this.entityComponentMap.delete(entityId);
        }
        return component;
    }
    /**
     * Get all entities that have a component
     *
     * @returns Array of entity IDs
     */
    getEntities() {
        return Array.from(this.entityComponentMap.keys());
    }
    /**
     * Get all components
     *
     * @returns Array of components
     */
    getComponents() {
        return Array.from(this.entityComponentMap.values());
    }
    /**
     * Get entity and component pairs
     *
     * @returns Array of entity ID and component pairs
     */
    getEntityComponentPairs() {
        return Array.from(this.entityComponentMap.entries());
    }
    /**
     * Clear all components
     */
    clear() {
        this.entityComponentMap.clear();
    }
    /**
     * Get the number of components in the storage
     *
     * @returns The number of components
     */
    count() {
        return this.entityComponentMap.size;
    }
    /**
     * Get the component type ID
     *
     * @returns The component type ID
     */
    getComponentTypeId() {
        return this.componentTypeId;
    }
}
/**
 * Struct of Arrays (SoA) implementation of component storage
 * Each component type has its own array, optimized for system iteration
 * Better for cache coherency and performance-critical components
 */
class SparseSetComponentStorage {
    /**
     * Constructor
     *
     * @param componentTypeId The component type ID
     */
    constructor(componentTypeId) {
        /**
         * The type of storage strategy
         */
        this.storageType = _types__WEBPACK_IMPORTED_MODULE_0__.ComponentStorageType.STRUCT_OF_ARRAYS;
        /**
         * Maps entity IDs to indices in the dense array
         */
        this.sparse = new Map();
        /**
         * Dense array of entity IDs
         */
        this.denseEntities = [];
        /**
         * Dense array of components, parallel to denseEntities
         */
        this.denseComponents = [];
        this.componentTypeId = componentTypeId;
    }
    /**
     * Add a component for an entity
     *
     * @param entityId The entity ID
     * @param component The component to add
     * @returns True if the component was added, false if it already existed
     */
    add(entityId, component) {
        // Check if this entity already has this component
        if (this.sparse.has(entityId)) {
            return false;
        }
        // Add to dense arrays
        const index = this.denseEntities.length;
        this.denseEntities.push(entityId);
        this.denseComponents.push(component);
        // Map entity ID to index
        this.sparse.set(entityId, index);
        return true;
    }
    /**
     * Get a component for an entity
     *
     * @param entityId The entity ID
     * @returns The component, or undefined if not found
     */
    get(entityId) {
        const index = this.sparse.get(entityId);
        if (index === undefined) {
            return undefined;
        }
        return this.denseComponents[index];
    }
    /**
     * Check if an entity has a component
     *
     * @param entityId The entity ID
     * @returns True if the entity has the component
     */
    has(entityId) {
        return this.sparse.has(entityId);
    }
    /**
     * Remove a component from an entity
     *
     * @param entityId The entity ID
     * @returns The removed component, or undefined if not found
     */
    remove(entityId) {
        const index = this.sparse.get(entityId);
        if (index === undefined) {
            return undefined;
        }
        // Get the component that will be removed
        const component = this.denseComponents[index];
        // If this is not the last element, move the last element to this position
        const lastIndex = this.denseEntities.length - 1;
        if (index !== lastIndex) {
            // Move the last entity/component to this position
            const lastEntityId = this.denseEntities[lastIndex];
            this.denseEntities[index] = lastEntityId;
            this.denseComponents[index] = this.denseComponents[lastIndex];
            // Update the sparse map for the moved entity
            this.sparse.set(lastEntityId, index);
        }
        // Remove the last entity/component (now duplicated or the one we want to remove)
        this.denseEntities.pop();
        this.denseComponents.pop();
        // Remove from sparse map
        this.sparse.delete(entityId);
        return component;
    }
    /**
     * Get all entities that have a component
     *
     * @returns Array of entity IDs
     */
    getEntities() {
        return [...this.denseEntities];
    }
    /**
     * Get all components
     *
     * @returns Array of components
     */
    getComponents() {
        return [...this.denseComponents];
    }
    /**
     * Get entity and component pairs
     *
     * @returns Array of entity ID and component pairs
     */
    getEntityComponentPairs() {
        return this.denseEntities.map((entityId, index) => [entityId, this.denseComponents[index]]);
    }
    /**
     * Clear all components
     */
    clear() {
        this.sparse.clear();
        this.denseEntities = [];
        this.denseComponents = [];
    }
    /**
     * Get the number of components in the storage
     *
     * @returns The number of components
     */
    count() {
        return this.denseEntities.length;
    }
    /**
     * Get the component type ID
     *
     * @returns The component type ID
     */
    getComponentTypeId() {
        return this.componentTypeId;
    }
    /**
     * Get direct access to the dense arrays for optimized iteration
     * WARNING: Do not modify these arrays directly unless you know what you're doing
     *
     * @returns Object containing dense entity and component arrays
     */
    getDenseArrays() {
        return {
            entities: this.denseEntities,
            components: this.denseComponents
        };
    }
}
/**
 * Factory function to create a component storage based on the specified strategy
 *
 * @param componentTypeId The component type ID
 * @param storageType The storage strategy to use
 * @returns A component storage instance
 */
function createComponentStorage(componentTypeId, storageType = _types__WEBPACK_IMPORTED_MODULE_0__.ComponentStorageType.STRUCT_OF_ARRAYS) {
    switch (storageType) {
        case _types__WEBPACK_IMPORTED_MODULE_0__.ComponentStorageType.ARRAY_OF_STRUCTS:
            return new ArrayComponentStorage(componentTypeId);
        case _types__WEBPACK_IMPORTED_MODULE_0__.ComponentStorageType.STRUCT_OF_ARRAYS:
            return new SparseSetComponentStorage(componentTypeId);
        default:
            throw new Error(`Unknown component storage type: ${storageType}`);
    }
}


/***/ }),

/***/ "./src/game/core/ecs/Entity.ts":
/*!*************************************!*\
  !*** ./src/game/core/ecs/Entity.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Entity: () => (/* binding */ Entity)
/* harmony export */ });
/* harmony import */ var _utils_UUID__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/UUID */ "./src/game/core/utils/UUID.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types */ "./src/game/core/ecs/types.ts");
/* harmony import */ var _EventEmitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./EventEmitter */ "./src/game/core/ecs/EventEmitter.ts");
/**
 * TerraFlux - Entity
 *
 * The core entity class for the ECS architecture.
 * Entities are essentially just IDs with collections of components and tags.
 */



/**
 * Entity class representing a game object in the ECS architecture
 */
class Entity {
    /**
     * Create a new entity
     *
     * @param id Optional unique identifier. If not provided, a new one will be generated.
     * @param name Optional human-readable name for debugging
     */
    constructor(id, name) {
        /**
         * Tags associated with this entity for filtering
         */
        this._tags = new Set();
        this._id = id || _utils_UUID__WEBPACK_IMPORTED_MODULE_0__.UUID.generateEntityId();
        this._name = name || `Entity_${this._id.substr(-6)}`;
    }
    /**
     * Get the entity's unique identifier
     */
    get id() {
        return this._id;
    }
    /**
     * Get the entity's name
     */
    get name() {
        return this._name;
    }
    /**
     * Set the entity's name
     */
    set name(value) {
        this._name = value;
    }
    /**
     * Add a tag to the entity
     *
     * @param tag The tag to add
     * @returns This entity for method chaining
     */
    addTag(tag) {
        if (!this._tags.has(tag)) {
            this._tags.add(tag);
            _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_1__.EntityEventType.TAG_ADDED, this, tag);
        }
        return this;
    }
    /**
     * Remove a tag from the entity
     *
     * @param tag The tag to remove
     * @returns True if the tag was removed, false if it wasn't present
     */
    removeTag(tag) {
        if (this._tags.has(tag)) {
            this._tags.delete(tag);
            _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_1__.EntityEventType.TAG_REMOVED, this, tag);
            return true;
        }
        return false;
    }
    /**
     * Check if the entity has a specific tag
     *
     * @param tag The tag to check for
     * @returns True if the entity has the tag
     */
    hasTag(tag) {
        return this._tags.has(tag);
    }
    /**
     * Get all tags for this entity
     *
     * @returns Array of tags for this entity
     */
    getTags() {
        return [...this._tags];
    }
    /**
     * Get a component from this entity
     *
     * @param componentId The component type ID to get
     * @returns The component, or undefined if not found
     */
    getComponent(componentId) {
        // Components are stored in the EntityManager, so we need to use it here
        // This is a convenience method that delegates to the EntityManager
        // Dynamically import to avoid circular dependencies
        const { entityManager } = __webpack_require__(/*! ./EntityManager */ "./src/game/core/ecs/EntityManager.ts");
        return entityManager.getComponent(this.id, componentId);
    }
    /**
     * Clear all tags from the entity
     *
     * @returns This entity for method chaining
     */
    clearTags() {
        const tags = this.getTags();
        this._tags.clear();
        tags.forEach(tag => {
            _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_1__.EntityEventType.TAG_REMOVED, this, tag);
        });
        return this;
    }
    /**
     * Serialize this entity to a JSON-compatible object
     * Note: Component attachment/detachment is handled by EntityManager
     *
     * @returns A JSON-compatible object
     */
    serialize() {
        return {
            id: this._id,
            name: this._name,
            tags: this.getTags()
        };
    }
    /**
     * Deserialize this entity from a JSON-compatible object
     * Note: Component attachment/detachment is handled by EntityManager
     *
     * @param data A JSON-compatible object
     */
    deserialize(data) {
        // ID is immutable, so we don't set it
        // Set name
        if (data.name) {
            this._name = data.name;
        }
        // Clear and re-add tags
        this.clearTags();
        if (Array.isArray(data.tags)) {
            data.tags.forEach((tag) => {
                this.addTag(tag);
            });
        }
    }
    /**
     * Check if this entity equals another entity
     * Entities are equal if they have the same ID
     *
     * @param other The other entity to compare with
     * @returns True if the entities are equal
     */
    equals(other) {
        return this._id === other._id;
    }
    /**
     * Convert the entity to a string
     *
     * @returns A string representation of the entity
     */
    toString() {
        return `Entity(id=${this._id}, name=${this._name}, tags=[${this.getTags().join(', ')}])`;
    }
}


/***/ }),

/***/ "./src/game/core/ecs/EntityManager.ts":
/*!********************************************!*\
  !*** ./src/game/core/ecs/EntityManager.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EntityManager: () => (/* binding */ EntityManager),
/* harmony export */   entityManager: () => (/* binding */ entityManager)
/* harmony export */ });
/* harmony import */ var _Entity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Entity */ "./src/game/core/ecs/Entity.ts");
/* harmony import */ var _ComponentStorage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ComponentStorage */ "./src/game/core/ecs/ComponentStorage.ts");
/* harmony import */ var _EventEmitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./EventEmitter */ "./src/game/core/ecs/EventEmitter.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./types */ "./src/game/core/ecs/types.ts");
/* harmony import */ var _utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/TypeRegistry */ "./src/game/core/utils/TypeRegistry.ts");
/**
 * TerraFlux - Entity Manager
 *
 * Manages entity lifecycle, component attachment, and entity querying.
 * Provides efficient way to query entities based on components and tags.
 */





/**
 * Creates an ArchetypeKey from a list of component IDs
 */
function createArchetypeKey(componentIds) {
    return [...componentIds].sort().join('|');
}
/**
 * EntityManager class responsible for managing entity lifecycle
 * and component attachment/detachment
 */
class EntityManager {
    /**
     * Create a new EntityManager
     */
    constructor(defaultStorageType) {
        /**
         * Map of entity IDs to entities
         */
        this.entities = new Map();
        /**
         * Map of component type IDs to their storage
         */
        this.componentStorages = new Map();
        /**
         * Map of entity archetypes to sets of entity IDs
         * Used for efficient querying of entities with specific component combinations
         */
        this.entityArchetypes = new Map();
        /**
         * Map of tags to sets of entity IDs
         * Used for efficient querying of entities with specific tags
         */
        this.entityTags = new Map();
        /**
         * Default component storage type for new component types
         */
        this.defaultStorageType = _types__WEBPACK_IMPORTED_MODULE_3__.ComponentStorageType.STRUCT_OF_ARRAYS;
        if (defaultStorageType !== undefined) {
            this.defaultStorageType = defaultStorageType;
        }
        // Subscribe to entity tag events to update the entity tags mapping
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.subscribe(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.TAG_ADDED, this.handleTagAdded.bind(this));
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.subscribe(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.TAG_REMOVED, this.handleTagRemoved.bind(this));
    }
    /**
     * Handler for tag added event
     */
    handleTagAdded(entity, tag) {
        // Ensure the tag set exists
        if (!this.entityTags.has(tag)) {
            this.entityTags.set(tag, new Set());
        }
        // Add the entity to the tag set
        this.entityTags.get(tag).add(entity.id);
    }
    /**
     * Handler for tag removed event
     */
    handleTagRemoved(entity, tag) {
        // Remove the entity from the tag set
        const tagSet = this.entityTags.get(tag);
        if (tagSet) {
            tagSet.delete(entity.id);
            // Clean up empty tag sets
            if (tagSet.size === 0) {
                this.entityTags.delete(tag);
            }
        }
    }
    /**
     * Create a new entity
     */
    createEntity(options = {}) {
        // Create the entity
        const entity = new _Entity__WEBPACK_IMPORTED_MODULE_0__.Entity(options.id, options.name);
        // Register the entity
        this.entities.set(entity.id, entity);
        // Add initial tags if provided
        if (options.tags) {
            options.tags.forEach(tag => entity.addTag(tag));
        }
        // Emit entity created event
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.CREATED, entity);
        return entity;
    }
    /**
     * Get an entity by ID
     */
    getEntity(entityId) {
        return this.entities.get(entityId);
    }
    /**
     * Check if an entity exists
     */
    hasEntity(entityId) {
        return this.entities.has(entityId);
    }
    /**
     * Destroy an entity and remove all its components
     */
    destroyEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity) {
            return false;
        }
        // Remove all components
        for (const componentStorage of this.componentStorages.values()) {
            if (componentStorage.has(entityId)) {
                // This will update archetypes internally
                this.removeComponent(entityId, componentStorage.getComponentTypeId());
            }
        }
        // Clear entity tags
        entity.clearTags();
        // Remove from entities map
        this.entities.delete(entityId);
        // Emit entity destroyed event
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.DESTROYED, entity);
        return true;
    }
    /**
     * Get all entities
     */
    getAllEntities() {
        return Array.from(this.entities.values());
    }
    /**
     * Get the number of entities
     */
    getEntityCount() {
        return this.entities.size;
    }
    /**
     * Get or create a component storage
     */
    getOrCreateComponentStorage(componentTypeId, storageType) {
        // Check if storage already exists
        let storage = this.componentStorages.get(componentTypeId);
        if (!storage) {
            // Create new storage
            storage = (0,_ComponentStorage__WEBPACK_IMPORTED_MODULE_1__.createComponentStorage)(componentTypeId, storageType || this.defaultStorageType);
            this.componentStorages.set(componentTypeId, storage);
        }
        return storage;
    }
    /**
     * Update entity archetypes when components are added or removed
     */
    updateEntityArchetypes(entityId, oldComponentTypes, newComponentTypes) {
        // Remove from old archetype
        const oldArchetypeKey = createArchetypeKey(oldComponentTypes);
        const oldArchetype = this.entityArchetypes.get(oldArchetypeKey);
        if (oldArchetype) {
            oldArchetype.delete(entityId);
            // Clean up empty archetypes
            if (oldArchetype.size === 0) {
                this.entityArchetypes.delete(oldArchetypeKey);
            }
        }
        // Add to new archetype
        const newArchetypeKey = createArchetypeKey(newComponentTypes);
        if (!this.entityArchetypes.has(newArchetypeKey)) {
            this.entityArchetypes.set(newArchetypeKey, new Set());
        }
        this.entityArchetypes.get(newArchetypeKey).add(entityId);
    }
    /**
     * Get all component types for an entity
     */
    getEntityComponentTypes(entityId) {
        const componentTypes = [];
        for (const [componentTypeId, storage] of this.componentStorages.entries()) {
            if (storage.has(entityId)) {
                componentTypes.push(componentTypeId);
            }
        }
        return componentTypes;
    }
    /**
     * Add a component to an entity
     */
    addComponent(entityId, component) {
        // Check if entity exists
        if (!this.hasEntity(entityId)) {
            return false;
        }
        // Get the component storage
        const componentTypeId = component.typeId;
        const storage = this.getOrCreateComponentStorage(componentTypeId);
        // Check if already has this component
        if (storage.has(entityId)) {
            return false;
        }
        // Get current component types before adding
        const oldComponentTypes = this.getEntityComponentTypes(entityId);
        // Add component to storage
        storage.add(entityId, component);
        // Update archetypes
        const newComponentTypes = [...oldComponentTypes, componentTypeId];
        this.updateEntityArchetypes(entityId, oldComponentTypes, newComponentTypes);
        // Emit component added event
        const entity = this.entities.get(entityId);
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.COMPONENT_ADDED, entity, component);
        return true;
    }
    /**
     * Get a component from an entity
     */
    getComponent(entityId, componentTypeId) {
        // Check if entity exists
        if (!this.hasEntity(entityId)) {
            return undefined;
        }
        // Get the component storage
        const storage = this.componentStorages.get(componentTypeId);
        if (!storage) {
            return undefined;
        }
        // Get the component
        return storage.get(entityId);
    }
    /**
     * Check if an entity has a component
     */
    hasComponent(entityId, componentTypeId) {
        // Check if entity exists
        if (!this.hasEntity(entityId)) {
            return false;
        }
        // Get the component storage
        const storage = this.componentStorages.get(componentTypeId);
        if (!storage) {
            return false;
        }
        // Check if the entity has the component
        return storage.has(entityId);
    }
    /**
     * Remove a component from an entity
     */
    removeComponent(entityId, componentTypeId) {
        // Check if entity exists
        if (!this.hasEntity(entityId)) {
            return undefined;
        }
        // Get the component storage
        const storage = this.componentStorages.get(componentTypeId);
        if (!storage) {
            return undefined;
        }
        // Check if has component
        if (!storage.has(entityId)) {
            return undefined;
        }
        // Get current component types before removal
        const oldComponentTypes = this.getEntityComponentTypes(entityId);
        // Remove the component
        const component = storage.remove(entityId);
        // Update archetypes
        const newComponentTypes = oldComponentTypes.filter(id => id !== componentTypeId);
        this.updateEntityArchetypes(entityId, oldComponentTypes, newComponentTypes);
        // Emit component removed event
        const entity = this.entities.get(entityId);
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.EntityEventType.COMPONENT_REMOVED, entity, component);
        return component;
    }
    /**
     * Query entities based on components, tags, and filters
     */
    queryEntities(options = {}) {
        // Start with all entities
        let result = new Set(this.entities.keys());
        // Filter by required components
        if (options.withComponents && options.withComponents.length > 0) {
            for (const componentId of options.withComponents) {
                const storage = this.componentStorages.get(componentId);
                if (!storage || storage.count() === 0) {
                    // No entities have this component
                    return [];
                }
                const entitiesWithComponent = storage.getEntities();
                result = new Set([...result].filter(id => entitiesWithComponent.includes(id)));
                if (result.size === 0) {
                    // No entities left after filtering
                    return [];
                }
            }
        }
        // Filter by excluded components
        if (options.withoutComponents && options.withoutComponents.length > 0) {
            for (const componentId of options.withoutComponents) {
                const storage = this.componentStorages.get(componentId);
                if (storage) {
                    const entitiesWithComponent = storage.getEntities();
                    entitiesWithComponent.forEach(id => result.delete(id));
                }
            }
        }
        // Filter by required tags
        if (options.withTags && options.withTags.length > 0) {
            for (const tag of options.withTags) {
                const entitiesWithTag = this.entityTags.get(tag);
                if (!entitiesWithTag || entitiesWithTag.size === 0) {
                    // No entities have this tag
                    return [];
                }
                result = new Set([...result].filter(id => entitiesWithTag.has(id)));
                if (result.size === 0) {
                    // No entities left after filtering
                    return [];
                }
            }
        }
        // Filter by excluded tags
        if (options.withoutTags && options.withoutTags.length > 0) {
            for (const tag of options.withoutTags) {
                const entitiesWithTag = this.entityTags.get(tag);
                if (entitiesWithTag) {
                    entitiesWithTag.forEach(id => result.delete(id));
                }
            }
        }
        // Apply custom filter if provided
        if (options.filter) {
            const entities = [...result].map(id => this.entities.get(id));
            const filteredEntities = entities.filter(entity => options.filter(entity));
            return filteredEntities;
        }
        // Convert result set to array of entities
        return [...result].map(id => this.entities.get(id));
    }
    /**
     * Get all entities with a specific component
     */
    getEntitiesWithComponent(componentTypeId) {
        const storage = this.componentStorages.get(componentTypeId);
        if (!storage) {
            return [];
        }
        return storage.getEntities().map(id => this.entities.get(id));
    }
    /**
     * Get all entities with a specific tag
     */
    getEntitiesWithTag(tag) {
        const entityIds = this.entityTags.get(tag);
        if (!entityIds) {
            return [];
        }
        return [...entityIds].map(id => this.entities.get(id));
    }
    /**
     * Clear all entities and components
     */
    clear() {
        // Clear all entities
        for (const entityId of this.entities.keys()) {
            this.destroyEntity(entityId);
        }
        // Clear all component storages
        this.componentStorages.clear();
        // Clear all entity archetypes
        this.entityArchetypes.clear();
        // Clear all entity tags
        this.entityTags.clear();
    }
    /**
     * Serialize all entities
     */
    serialize() {
        const entities = [];
        for (const entity of this.entities.values()) {
            const serializedEntity = entity.serialize();
            // Add components
            const components = {};
            for (const [componentTypeId, storage] of this.componentStorages.entries()) {
                const component = storage.get(entity.id);
                if (component) {
                    components[componentTypeId] = component.serialize();
                }
            }
            serializedEntity.components = components;
            entities.push(serializedEntity);
        }
        return { entities };
    }
    /**
     * Deserialize entities
     */
    deserialize(data) {
        // Clear existing entities
        this.clear();
        // Deserialize entities
        if (Array.isArray(data.entities)) {
            for (const entityData of data.entities) {
                // Create entity
                const entity = this.createEntity({
                    id: entityData.id,
                    name: entityData.name,
                    tags: entityData.tags
                });
                // Add components
                if (entityData.components) {
                    for (const [componentTypeId, componentData] of Object.entries(entityData.components)) {
                        // Create component
                        const componentType = _utils_TypeRegistry__WEBPACK_IMPORTED_MODULE_4__.componentRegistry.getById(componentTypeId);
                        if (componentType) {
                            const component = componentType.create();
                            component.deserialize(componentData);
                            this.addComponent(entity.id, component);
                        }
                    }
                }
            }
        }
    }
}
// Create a global entity manager instance
const entityManager = new EntityManager();


/***/ }),

/***/ "./src/game/core/ecs/EventEmitter.ts":
/*!*******************************************!*\
  !*** ./src/game/core/ecs/EventEmitter.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EventEmitter: () => (/* binding */ EventEmitter),
/* harmony export */   eventEmitter: () => (/* binding */ eventEmitter)
/* harmony export */ });
/* harmony import */ var _utils_UUID__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/UUID */ "./src/game/core/utils/UUID.ts");
/**
 * TerraFlux - Event Emitter
 *
 * A lightweight, typed event emitter for the ECS architecture.
 * Handles entity lifecycle events, component events, and system events.
 */

/**
 * EventEmitter class for subscribing to and emitting events
 */
class EventEmitter {
    constructor() {
        /**
         * Maps event names to a map of subscription tokens and their callbacks
         */
        this.eventMap = new Map();
    }
    /**
     * Subscribe to an event
     *
     * @param eventName The name of the event to subscribe to
     * @param callback The function to call when the event is emitted
     * @returns A subscription token that can be used to unsubscribe
     */
    subscribe(eventName, callback) {
        // Create event map if it doesn't exist
        if (!this.eventMap.has(eventName)) {
            this.eventMap.set(eventName, new Map());
        }
        // Generate a unique subscription token
        const subscriptionToken = _utils_UUID__WEBPACK_IMPORTED_MODULE_0__.UUID.generateWithPrefix('sub');
        // Add the callback to the event map
        const eventCallbacks = this.eventMap.get(eventName);
        eventCallbacks.set(subscriptionToken, callback);
        return subscriptionToken;
    }
    /**
     * Unsubscribe from an event
     *
     * @param eventName The name of the event to unsubscribe from
     * @param token The subscription token returned from subscribe
     * @returns True if the subscription was successfully removed
     */
    unsubscribe(eventName, token) {
        // Check if event exists
        const eventCallbacks = this.eventMap.get(eventName);
        if (!eventCallbacks) {
            return false;
        }
        // Remove the subscription
        return eventCallbacks.delete(token);
    }
    /**
     * Emit an event to all subscribers
     *
     * @param eventName The name of the event to emit
     * @param args Arguments to pass to the callback functions
     */
    emit(eventName, ...args) {
        // Check if event exists
        const eventCallbacks = this.eventMap.get(eventName);
        if (!eventCallbacks || eventCallbacks.size === 0) {
            return;
        }
        // Call all callbacks
        eventCallbacks.forEach(callback => {
            try {
                callback(...args);
            }
            catch (error) {
                console.error(`Error in event callback for '${eventName}':`, error);
            }
        });
    }
    /**
     * Check if an event has subscribers
     *
     * @param eventName The name of the event to check
     * @returns True if the event has subscribers
     */
    hasSubscribers(eventName) {
        const eventCallbacks = this.eventMap.get(eventName);
        return !!eventCallbacks && eventCallbacks.size > 0;
    }
    /**
     * Get the number of subscribers for an event
     *
     * @param eventName The name of the event to check
     * @returns The number of subscribers for the event
     */
    subscriberCount(eventName) {
        const eventCallbacks = this.eventMap.get(eventName);
        return eventCallbacks ? eventCallbacks.size : 0;
    }
    /**
     * Remove all subscriptions for an event
     *
     * @param eventName The name of the event to clear
     */
    clearEvent(eventName) {
        const eventCallbacks = this.eventMap.get(eventName);
        if (eventCallbacks) {
            eventCallbacks.clear();
        }
    }
    /**
     * Remove all subscriptions for all events
     */
    clearAllEvents() {
        this.eventMap.forEach(eventCallbacks => {
            eventCallbacks.clear();
        });
        this.eventMap.clear();
    }
    /**
     * Get a list of all active event names
     *
     * @returns Array of event names with subscribers
     */
    getActiveEvents() {
        return Array.from(this.eventMap.keys()).filter(eventName => this.subscriberCount(eventName) > 0);
    }
    /**
     * Create a subscription that automatically unsubscribes when the provided
     * lifespan object is destroyed. Useful for creating subscriptions tied to
     * the lifecycle of a system or component.
     *
     * @param eventName The name of the event to subscribe to
     * @param callback The function to call when the event is emitted
     * @param lifespan An object with a method to register destruction callbacks
     * @returns A subscription token that can be used to unsubscribe
     */
    subscribeWithLifespan(eventName, callback, lifespan) {
        const token = this.subscribe(eventName, callback);
        // When the lifespan object is destroyed, unsubscribe
        // Support both System's addDestroyCallback and other objects' onDestroy
        const registerCallback = lifespan.addDestroyCallback || lifespan.onDestroy;
        if (registerCallback) {
            registerCallback.call(lifespan, () => {
                this.unsubscribe(eventName, token);
            });
        }
        else {
            console.warn('Lifespan object does not have addDestroyCallback or onDestroy method');
        }
        return token;
    }
}
// Create a global event emitter instance
const eventEmitter = new EventEmitter();


/***/ }),

/***/ "./src/game/core/ecs/System.ts":
/*!*************************************!*\
  !*** ./src/game/core/ecs/System.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   System: () => (/* binding */ System)
/* harmony export */ });
/* harmony import */ var _utils_UUID__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/UUID */ "./src/game/core/utils/UUID.ts");
/* harmony import */ var _EntityManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EntityManager */ "./src/game/core/ecs/EntityManager.ts");
/* harmony import */ var _EventEmitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./EventEmitter */ "./src/game/core/ecs/EventEmitter.ts");
/* harmony import */ var _types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./types */ "./src/game/core/ecs/types.ts");
/**
 * TerraFlux - System Base Class
 *
 * Provides the foundation for all systems in the ECS architecture.
 * Systems operate on entities with specific component combinations.
 */




/**
 * Abstract base class for all systems
 */
class System {
    /**
     * Constructor for System
     *
     * @param config System configuration options
     */
    constructor(config) {
        var _a, _b, _c;
        this._id = _utils_UUID__WEBPACK_IMPORTED_MODULE_0__.UUID.generateSystemId(config.name);
        this._name = config.name;
        this._priority = (_a = config.priority) !== null && _a !== void 0 ? _a : _types__WEBPACK_IMPORTED_MODULE_3__.SystemPriority.NORMAL;
        this._query = (_b = config.query) !== null && _b !== void 0 ? _b : {};
        this._enabled = (_c = config.enabled) !== null && _c !== void 0 ? _c : true;
    }
    /**
     * Get the unique identifier for this system
     */
    get id() {
        return this._id;
    }
    /**
     * Get the human-readable name for this system
     */
    get name() {
        return this._name;
    }
    /**
     * Get the priority level for this system
     */
    get priority() {
        return this._priority;
    }
    /**
     * Set the priority level for this system
     */
    set priority(value) {
        this._priority = value;
    }
    /**
     * Get whether this system is currently enabled
     */
    get enabled() {
        return this._enabled;
    }
    /**
     * Set whether this system is currently enabled
     */
    set enabled(value) {
        if (this._enabled !== value) {
            this._enabled = value;
            if (value) {
                this.onEnable();
            }
            else {
                this.onDisable();
            }
        }
    }
    /**
     * Get the query options for selecting entities
     */
    get query() {
        return this._query;
    }
    /**
     * Set the query options for selecting entities
     */
    set query(value) {
        this._query = value;
    }
    /**
     * Initialize this system
     *
     * @returns True if the system was successfully initialized
     */
    initialize() {
        const result = this.onInitialize();
        // Notify that the system has been initialized
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.SystemEventType.INITIALIZED, this);
        return result;
    }
    /**
     * Called when the system is initialized
     * Override this to perform custom initialization
     *
     * @returns True if the system was successfully initialized
     */
    onInitialize() {
        return true;
    }
    /**
     * Called when the system is enabled
     * Override this to perform custom enable logic
     */
    onEnable() {
        // Default implementation does nothing
    }
    /**
     * Called when the system is disabled
     * Override this to perform custom disable logic
     */
    onDisable() {
        // Default implementation does nothing
    }
    /**
     * Update this system
     *
     * @param deltaTime Time elapsed since the last update in seconds
     */
    update(deltaTime) {
        if (!this._enabled) {
            return;
        }
        // Query entities that match this system's requirements
        const entities = _EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.queryEntities(this._query);
        // Process entities
        this.onUpdate(deltaTime, entities);
        // Notify that the system has been updated
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.SystemEventType.UPDATED, this, deltaTime);
    }
    /**
     * Destroy this system
     */
    destroy() {
        this.onDestroy();
        // Notify that the system has been destroyed
        _EventEmitter__WEBPACK_IMPORTED_MODULE_2__.eventEmitter.emit(_types__WEBPACK_IMPORTED_MODULE_3__.SystemEventType.DESTROYED, this);
    }
    /**
     * Called when the system is destroyed
     * Override this to perform custom cleanup
     */
    onDestroy() {
        // Default implementation does nothing
    }
    /**
     * Register a callback to be executed when the system is destroyed
     * Used by other systems like the EventEmitter for cleanup
     *
     * @param callback Function to call when the system is destroyed
     */
    addDestroyCallback(callback) {
        const originalOnDestroy = this.onDestroy.bind(this);
        this.onDestroy = () => {
            originalOnDestroy();
            callback();
        };
    }
}


/***/ }),

/***/ "./src/game/core/ecs/SystemManager.ts":
/*!********************************************!*\
  !*** ./src/game/core/ecs/SystemManager.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SystemManager: () => (/* binding */ SystemManager),
/* harmony export */   systemManager: () => (/* binding */ systemManager)
/* harmony export */ });
/**
 * TerraFlux - System Manager
 *
 * Manages the lifecycle and execution of all systems.
 * Handles system registration, dependencies, and priority-based execution.
 */
/**
 * SystemManager class responsible for managing system lifecycle
 * and priority-based execution
 */
class SystemManager {
    constructor() {
        /**
         * Map of system IDs to systems
         */
        this.systems = new Map();
        /**
         * System dependencies - which systems must run before others
         */
        this.dependencies = [];
        /**
         * Flag to track if systems are sorted
         */
        this.sorted = true;
        /**
         * Ordered list of systems based on priority and dependencies
         */
        this.orderedSystems = [];
    }
    /**
     * Add a system to the manager
     *
     * @param system The system to add
     * @returns True if the system was added successfully
     */
    addSystem(system) {
        // Check if the system is already registered
        if (this.systems.has(system.id)) {
            console.warn(`System with ID '${system.id}' is already registered.`);
            return false;
        }
        // Add the system
        this.systems.set(system.id, system);
        // Mark as unsorted to trigger re-sorting on the next update
        this.sorted = false;
        // Initialize the system
        system.initialize();
        return true;
    }
    /**
     * Remove a system from the manager
     *
     * @param systemId The ID of the system to remove
     * @returns True if the system was removed successfully
     */
    removeSystem(systemId) {
        // Check if the system exists
        const system = this.systems.get(systemId);
        if (!system) {
            return false;
        }
        // Remove system dependencies
        this.dependencies = this.dependencies.filter(dep => dep.dependent !== systemId && dep.dependsOn !== systemId);
        // Destroy the system
        system.destroy();
        // Remove the system
        this.systems.delete(systemId);
        // Mark as unsorted to trigger re-sorting on the next update
        this.sorted = false;
        return true;
    }
    /**
     * Check if a system exists
     *
     * @param systemId The ID of the system to check
     * @returns True if the system exists
     */
    hasSystem(systemId) {
        return this.systems.has(systemId);
    }
    /**
     * Add a dependency between two systems
     *
     * @param dependency The dependency to add
     * @returns True if the dependency was added successfully
     */
    addDependency(dependency) {
        // Verify that both systems exist
        if (!this.hasSystem(dependency.dependent) || !this.hasSystem(dependency.dependsOn)) {
            return false;
        }
        // Add the dependency
        this.dependencies.push(dependency);
        // Mark as unsorted to trigger re-sorting on the next update
        this.sorted = false;
        return true;
    }
    /**
     * Sort systems based on priority and dependencies
     */
    sortSystems() {
        if (this.sorted) {
            return;
        }
        // Create a map of systems by priority
        const systemsByPriority = new Map();
        // Group systems by priority
        for (const system of this.systems.values()) {
            const priority = system.priority;
            if (!systemsByPriority.has(priority)) {
                systemsByPriority.set(priority, []);
            }
            systemsByPriority.get(priority).push(system);
        }
        // Sort priorities in descending order (higher priorities run first)
        const priorities = Array.from(systemsByPriority.keys()).sort((a, b) => b - a);
        // Create the ordered list of systems
        this.orderedSystems = [];
        // Add systems to the ordered list based on priority
        for (const priority of priorities) {
            const systems = systemsByPriority.get(priority);
            // Sort systems within a priority based on dependencies
            const sortedSystems = this.topologicalSort(systems);
            // Add to the ordered list
            this.orderedSystems.push(...sortedSystems);
        }
        this.sorted = true;
    }
    /**
     * Perform a topological sort of systems within a priority based on dependencies
     *
     * @param systems The systems to sort
     * @returns Sorted array of systems
     */
    topologicalSort(systems) {
        // Create a map of system IDs to systems
        const systemMap = new Map();
        for (const system of systems) {
            systemMap.set(system.id, system);
        }
        // Create a dependency graph for the systems
        const graph = new Map();
        // Initialize each system in the graph with an empty set of dependencies
        for (const system of systems) {
            graph.set(system.id, new Set());
        }
        // Add dependencies to the graph
        for (const dependency of this.dependencies) {
            // Skip dependencies that don't involve these systems
            if (!systemMap.has(dependency.dependent) || !systemMap.has(dependency.dependsOn)) {
                continue;
            }
            // Add the dependency edge
            graph.get(dependency.dependent).add(dependency.dependsOn);
        }
        // Perform topological sort
        const visited = new Set();
        const temp = new Set();
        const result = [];
        // Visit function for DFS
        const visit = (systemId) => {
            // Skip already visited nodes
            if (visited.has(systemId)) {
                return;
            }
            // Check for cycle
            if (temp.has(systemId)) {
                throw new Error(`Circular dependency detected in systems: ${systemId}`);
            }
            // Mark as temporarily visited
            temp.add(systemId);
            // Visit all dependencies
            for (const dependency of graph.get(systemId)) {
                visit(dependency);
            }
            // Mark as visited
            temp.delete(systemId);
            visited.add(systemId);
            // Add to result
            result.unshift(systemMap.get(systemId));
        };
        // Visit each system
        for (const system of systems) {
            if (!visited.has(system.id)) {
                visit(system.id);
            }
        }
        return result;
    }
    /**
     * Update all systems
     *
     * @param deltaTime Time elapsed since the last update in seconds
     */
    update(deltaTime) {
        // Sort systems if needed
        if (!this.sorted) {
            this.sortSystems();
        }
        // Update each system in order
        for (const system of this.orderedSystems) {
            if (system.enabled) {
                system.update(deltaTime);
            }
        }
    }
    /**
     * Get all registered systems
     *
     * @returns Array of all registered systems
     */
    getAllSystems() {
        return Array.from(this.systems.values());
    }
    /**
     * Get the total number of registered systems
     *
     * @returns The number of registered systems
     */
    getSystemCount() {
        return this.systems.size;
    }
    /**
     * Get the number of enabled systems
     * @returns Number of enabled systems
     */
    getEnabledSystemCount() {
        return Array.from(this.systems.values()).filter(system => system.enabled).length;
    }
    /**
     * Clear all systems
     */
    clear() {
        // Destroy all systems
        for (const system of this.systems.values()) {
            system.destroy();
        }
        // Clear the collections
        this.systems.clear();
        this.dependencies = [];
        this.orderedSystems = [];
        this.sorted = true;
    }
    /**
     * Destroy the system manager and all systems
     */
    destroy() {
        this.clear();
    }
}
// Create a global system manager instance
const systemManager = new SystemManager();


/***/ }),

/***/ "./src/game/core/ecs/types.ts":
/*!************************************!*\
  !*** ./src/game/core/ecs/types.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ComponentStorageType: () => (/* binding */ ComponentStorageType),
/* harmony export */   EntityEventType: () => (/* binding */ EntityEventType),
/* harmony export */   SystemEventType: () => (/* binding */ SystemEventType),
/* harmony export */   SystemPriority: () => (/* binding */ SystemPriority)
/* harmony export */ });
/**
 * TerraFlux - Entity Component System Core Types
 *
 * This file defines the core types used throughout the ECS implementation.
 */
/** Entity event types */
var EntityEventType;
(function (EntityEventType) {
    EntityEventType["CREATED"] = "entity_created";
    EntityEventType["DESTROYED"] = "entity_destroyed";
    EntityEventType["COMPONENT_ADDED"] = "component_added";
    EntityEventType["COMPONENT_REMOVED"] = "component_removed";
    EntityEventType["TAG_ADDED"] = "tag_added";
    EntityEventType["TAG_REMOVED"] = "tag_removed";
})(EntityEventType || (EntityEventType = {}));
/** Component storage strategy types */
var ComponentStorageType;
(function (ComponentStorageType) {
    /** Array of Structs - Each entity's components are stored together */
    ComponentStorageType["ARRAY_OF_STRUCTS"] = "array_of_structs";
    /** Struct of Arrays - Each component type is stored in its own array */
    ComponentStorageType["STRUCT_OF_ARRAYS"] = "struct_of_arrays";
})(ComponentStorageType || (ComponentStorageType = {}));
/** System update priority levels - Higher values run earlier */
var SystemPriority;
(function (SystemPriority) {
    SystemPriority[SystemPriority["HIGHEST"] = 1000] = "HIGHEST";
    SystemPriority[SystemPriority["HIGH"] = 800] = "HIGH";
    SystemPriority[SystemPriority["NORMAL"] = 500] = "NORMAL";
    SystemPriority[SystemPriority["LOW"] = 200] = "LOW";
    SystemPriority[SystemPriority["LOWEST"] = 0] = "LOWEST";
})(SystemPriority || (SystemPriority = {}));
/** System event types */
var SystemEventType;
(function (SystemEventType) {
    SystemEventType["INITIALIZED"] = "system_initialized";
    SystemEventType["UPDATED"] = "system_updated";
    SystemEventType["DESTROYED"] = "system_destroyed";
})(SystemEventType || (SystemEventType = {}));


/***/ }),

/***/ "./src/game/core/pathfinding/HexPathfinding.ts":
/*!*****************************************************!*\
  !*** ./src/game/core/pathfinding/HexPathfinding.ts ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HexPathfinding: () => (/* binding */ HexPathfinding)
/* harmony export */ });
/* harmony import */ var _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/CoordinateSystem */ "./src/game/core/utils/CoordinateSystem.ts");
/**
 * TerraFlux - Hex Grid Pathfinding
 *
 * Implements A* pathfinding algorithm for hex grids.
 */

/**
 * Implementation of A* pathfinding algorithm for hex grids
 */
class HexPathfinding {
    /**
     * Create a new pathfinding instance
     *
     * @param options Configuration options
     */
    constructor(options = {}) {
        var _a, _b, _c, _d;
        this.maxPathLength = 100;
        this.allowDiagonal = false;
        this.maxPathLength = (_a = options.maxPathLength) !== null && _a !== void 0 ? _a : 100;
        this.terrainCostFn = (_b = options.terrainCostFn) !== null && _b !== void 0 ? _b : (() => 1);
        this.isObstacleFn = (_c = options.isObstacleFn) !== null && _c !== void 0 ? _c : (() => false);
        this.allowDiagonal = (_d = options.allowDiagonal) !== null && _d !== void 0 ? _d : false;
    }
    /**
     * Find a path from start to goal hex coordinates
     *
     * @param startQ Start q coordinate
     * @param startR Start r coordinate
     * @param goalQ Goal q coordinate
     * @param goalR Goal r coordinate
     * @returns Array of hex coordinates forming the path, or null if no path found
     */
    findPath(startQ, startR, goalQ, goalR) {
        // Quick check for start == goal
        if (startQ === goalQ && startR === goalR) {
            return [{ q: startQ, r: startR }];
        }
        // Check if start or goal is an obstacle
        if (this.isObstacleFn(startQ, startR) || this.isObstacleFn(goalQ, goalR)) {
            return null;
        }
        // Initialize open and closed lists
        const openList = [];
        const closedList = new Map();
        // Create start node
        const startNode = {
            q: startQ,
            r: startR,
            f: 0,
            g: 0,
            h: this.heuristic(startQ, startR, goalQ, goalR),
            parent: null
        };
        // Add start node to open list
        openList.push(startNode);
        // Main pathfinding loop
        while (openList.length > 0) {
            // Sort open list by f-score (lowest first)
            openList.sort((a, b) => a.f - b.f);
            // Get the node with the lowest f-score
            const currentNode = openList.shift();
            // Check if we've reached the goal
            if (currentNode.q === goalQ && currentNode.r === goalR) {
                return this.reconstructPath(currentNode);
            }
            // Add current node to closed list
            closedList.set(`${currentNode.q},${currentNode.r}`, currentNode);
            // Get neighboring nodes
            const neighbors = this.getNeighbors(currentNode.q, currentNode.r);
            for (const neighbor of neighbors) {
                // Skip if neighbor is an obstacle or in the closed list
                if (this.isObstacleFn(neighbor.q, neighbor.r) ||
                    closedList.has(`${neighbor.q},${neighbor.r}`)) {
                    continue;
                }
                // Calculate g-score for this neighbor
                const tentativeG = currentNode.g + this.terrainCostFn(neighbor.q, neighbor.r);
                // Check if neighbor is in open list
                const existingIndex = openList.findIndex(node => node.q === neighbor.q && node.r === neighbor.r);
                if (existingIndex === -1) {
                    // Neighbor is not in open list, add it
                    const h = this.heuristic(neighbor.q, neighbor.r, goalQ, goalR);
                    openList.push({
                        q: neighbor.q,
                        r: neighbor.r,
                        g: tentativeG,
                        h: h,
                        f: tentativeG + h,
                        parent: currentNode
                    });
                }
                else if (tentativeG < openList[existingIndex].g) {
                    // Found a better path to an existing node in the open list
                    openList[existingIndex].g = tentativeG;
                    openList[existingIndex].f = tentativeG + openList[existingIndex].h;
                    openList[existingIndex].parent = currentNode;
                }
            }
            // Check if path is getting too long
            if (closedList.size > this.maxPathLength) {
                console.warn(`Pathfinding aborted: Exceeded maximum path length (${this.maxPathLength})`);
                return null;
            }
        }
        // No path found
        return null;
    }
    /**
     * Calculate the heuristic (estimated distance) between two hex coordinates
     *
     * @param q1 Start q coordinate
     * @param r1 Start r coordinate
     * @param q2 Goal q coordinate
     * @param r2 Goal r coordinate
     * @returns Estimated distance
     */
    heuristic(q1, r1, q2, r2) {
        return _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(q1, r1, q2, r2);
    }
    /**
     * Get neighboring hex coordinates
     *
     * @param q Current q coordinate
     * @param r Current r coordinate
     * @returns Array of neighboring coordinates
     */
    getNeighbors(q, r) {
        return _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.getHexNeighbors(q, r);
    }
    /**
     * Reconstruct the path from the goal node
     *
     * @param goalNode The goal node with parent references
     * @returns Array of hex coordinates forming the path
     */
    reconstructPath(goalNode) {
        const path = [];
        let currentNode = goalNode;
        // Walk backwards from goal to start
        while (currentNode !== null) {
            path.unshift({ q: currentNode.q, r: currentNode.r });
            currentNode = currentNode.parent;
        }
        return path;
    }
    /**
     * Find a path and convert it to world coordinates
     *
     * @param startQ Start q coordinate
     * @param startR Start r coordinate
     * @param goalQ Goal q coordinate
     * @param goalR Goal r coordinate
     * @returns Array of world positions forming the path, or null if no path found
     */
    findPathWorld(startQ, startR, goalQ, goalR) {
        const hexPath = this.findPath(startQ, startR, goalQ, goalR);
        if (!hexPath) {
            return null;
        }
        // Convert hex coordinates to world coordinates
        return hexPath.map(hex => _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexToWorld(hex.q, hex.r));
    }
    /**
     * Smooth a path to remove unnecessary zigzags
     *
     * @param path The original path
     * @returns Smoothed path
     */
    smoothPath(path) {
        if (path.length <= 2) {
            return [...path]; // No need to smooth paths of length 0, 1, or 2
        }
        const smoothed = [path[0]]; // Start with the first point
        let current = 0;
        // Keep examining paths until we reach the end
        while (current < path.length - 1) {
            // Find the furthest point we can see directly
            let furthest = current + 1;
            for (let i = current + 2; i < path.length; i++) {
                if (this.hasLineOfSight(path[current].q, path[current].r, path[i].q, path[i].r)) {
                    furthest = i;
                }
            }
            // Add the furthest visible point to our smoothed path
            if (furthest !== current) {
                smoothed.push(path[furthest]);
                current = furthest;
            }
            else {
                current++;
            }
        }
        return smoothed;
    }
    /**
     * Check if there is a clear line of sight between two hex coordinates
     *
     * @param startQ Start q coordinate
     * @param startR Start r coordinate
     * @param endQ End q coordinate
     * @param endR End r coordinate
     * @returns True if there is a clear line of sight
     */
    hasLineOfSight(startQ, startR, endQ, endR) {
        // Use Bresenham's line algorithm adapted for hex grids
        const line = this.getHexLine(startQ, startR, endQ, endR);
        // Check if any point in the line is an obstacle
        for (let i = 1; i < line.length - 1; i++) {
            if (this.isObstacleFn(line[i].q, line[i].r)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get a line of hex coordinates between two hex coordinates
     *
     * @param startQ Start q coordinate
     * @param startR Start r coordinate
     * @param endQ End q coordinate
     * @param endR End r coordinate
     * @returns Array of hex coordinates forming a line
     */
    getHexLine(startQ, startR, endQ, endR) {
        const N = _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(startQ, startR, endQ, endR);
        if (N === 0) {
            return [{ q: startQ, r: startR }];
        }
        const results = [];
        // Convert to cube coordinates for linear interpolation
        const startS = -startQ - startR;
        const endS = -endQ - endR;
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            // Linear interpolation in cube coordinates
            const q = startQ + (endQ - startQ) * t;
            const r = startR + (endR - startR) * t;
            const s = startS + (endS - startS) * t;
            // Round to get exact hex coordinates
            const [roundedQ, roundedR] = _utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.cubeRound(q, r, s);
            results.push({ q: roundedQ, r: roundedR });
        }
        return results;
    }
}


/***/ }),

/***/ "./src/game/core/utils/CoordinateSystem.ts":
/*!*************************************************!*\
  !*** ./src/game/core/utils/CoordinateSystem.ts ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoordinateSystem: () => (/* binding */ CoordinateSystem)
/* harmony export */ });
/**
 * TerraFlux - Coordinate System
 *
 * Handles conversions between different coordinate systems:
 * - Hex Coordinates (q, r): Used for the world map
 * - World Coordinates (x, y): Used for rendering in world space
 * - Grid Coordinates (x, y): Used for colony grid-based positioning
 */
/**
 * Coordinate system utility for handling conversions between different coordinate systems
 */
class CoordinateSystem {
    /**
     * Convert hex coordinates to world position
     *
     * @param q The q coordinate (axial system)
     * @param r The r coordinate (axial system)
     * @returns World position as {x, y}
     */
    static hexToWorld(q, r) {
        const x = this.HEX_SIZE * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = this.HEX_SIZE * (3 / 2 * r);
        return { x, y };
    }
    /**
     * Convert world position to hex coordinates
     *
     * @param x X coordinate in world space
     * @param y Y coordinate in world space
     * @returns Hex coordinates as {q, r}
     */
    static worldToHex(x, y) {
        const r = y * 2 / 3 / this.HEX_SIZE;
        const q = (x - Math.sqrt(3) / 2 * r * this.HEX_SIZE) / (Math.sqrt(3) * this.HEX_SIZE);
        // Round to nearest hex
        const [q_rounded, r_rounded] = this.cubeRound(q, r, -q - r);
        return { q: q_rounded, r: r_rounded };
    }
    /**
     * Convert cube coordinates to axial coordinates with proper rounding
     * This ensures we get exact hex coordinates even with floating point inputs
     *
     * @param q Floating point q coordinate
     * @param r Floating point r coordinate
     * @param s Floating point s coordinate
     * @returns Rounded [q, r] coordinates
     */
    static cubeRound(q, r, s) {
        let rx = Math.round(q);
        let ry = Math.round(r);
        let rz = Math.round(s);
        const x_diff = Math.abs(rx - q);
        const y_diff = Math.abs(ry - r);
        const z_diff = Math.abs(rz - s);
        // Adjust based on largest delta to maintain q + r + s = 0
        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        }
        else if (y_diff > z_diff) {
            ry = -rx - rz;
        }
        else {
            rz = -rx - ry;
        }
        return [rx, ry];
    }
    /**
     * Convert grid coordinates to world position
     *
     * @param x X coordinate in grid space
     * @param y Y coordinate in grid space
     * @returns World position as {x, y}
     */
    static gridToWorld(x, y) {
        return {
            x: x * this.GRID_SIZE,
            y: y * this.GRID_SIZE
        };
    }
    /**
     * Convert world position to grid coordinates
     *
     * @param x X coordinate in world space
     * @param y Y coordinate in world space
     * @returns Grid coordinates as {x, y}
     */
    static worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.GRID_SIZE),
            y: Math.floor(y / this.GRID_SIZE)
        };
    }
    /**
     * Convert directly from hex coordinates to grid coordinates
     *
     * @param q The q coordinate (axial system)
     * @param r The r coordinate (axial system)
     * @returns Grid coordinates as {x, y}
     */
    static hexToGrid(q, r) {
        const worldPos = this.hexToWorld(q, r);
        return this.worldToGrid(worldPos.x, worldPos.y);
    }
    /**
     * Convert directly from grid coordinates to hex coordinates
     *
     * @param x X coordinate in grid space
     * @param y Y coordinate in grid space
     * @returns Hex coordinates as {q, r}
     */
    static gridToHex(x, y) {
        const worldPos = this.gridToWorld(x, y);
        return this.worldToHex(worldPos.x, worldPos.y);
    }
    /**
     * Calculate distance between two hex coordinates
     *
     * @param q1 First hex q coordinate
     * @param r1 First hex r coordinate
     * @param q2 Second hex q coordinate
     * @param r2 Second hex r coordinate
     * @returns Distance in hex units
     */
    static hexDistance(q1, r1, q2, r2) {
        // Convert to cube coordinates
        const s1 = -q1 - r1;
        const s2 = -q2 - r2;
        // Calculate distance using cube coordinates
        return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
    }
    /**
     * Get all neighboring hex coordinates
     *
     * @param q The q coordinate
     * @param r The r coordinate
     * @returns Array of neighboring hex coordinates
     */
    static getHexNeighbors(q, r) {
        // Directions for neighboring hexes in axial coordinates
        const directions = [
            { q: 1, r: 0 },
            { q: 1, r: -1 },
            { q: 0, r: -1 },
            { q: -1, r: 0 },
            { q: -1, r: 1 },
            { q: 0, r: 1 }
        ];
        return directions.map(dir => ({
            q: q + dir.q,
            r: r + dir.r
        }));
    }
    /**
     * Get hex coordinates in a ring around a center
     *
     * @param centerQ Center hex q coordinate
     * @param centerR Center hex r coordinate
     * @param radius Radius of the ring
     * @returns Array of hex coordinates forming a ring
     */
    static getHexRing(centerQ, centerR, radius) {
        if (radius === 0) {
            return [{ q: centerQ, r: centerR }];
        }
        const results = [];
        // Start at the southwest corner
        let q = centerQ - 0;
        let r = centerR + radius;
        // Direction vectors for moving around the ring
        const directions = [
            { q: 1, r: -1 }, // Northeast
            { q: 1, r: 0 }, // East
            { q: 0, r: 1 }, // Southeast
            { q: -1, r: 1 }, // Southwest
            { q: -1, r: 0 }, // West
            { q: 0, r: -1 } // Northwest
        ];
        // For each side of the ring
        for (let side = 0; side < 6; side++) {
            // Move along one side
            for (let i = 0; i < radius; i++) {
                results.push({ q, r });
                q += directions[side].q;
                r += directions[side].r;
            }
        }
        return results;
    }
    /**
     * Get all hex coordinates within a certain radius of a center point
     *
     * @param centerQ Center hex q coordinate
     * @param centerR Center hex r coordinate
     * @param radius Maximum distance from center
     * @returns Array of hex coordinates within the radius
     */
    static getHexesInRadius(centerQ, centerR, radius) {
        const results = [];
        for (let q = centerQ - radius; q <= centerQ + radius; q++) {
            // Calculate r bounds based on hex grid geometry
            const rMin = Math.max(centerR - radius, -q - radius + centerQ + centerR);
            const rMax = Math.min(centerR + radius, -q + radius + centerQ + centerR);
            for (let r = rMin; r <= rMax; r++) {
                results.push({ q, r });
            }
        }
        return results;
    }
    /**
     * Get the size of a hex in world units
     *
     * @returns The hex size
     */
    static getHexSize() {
        return this.HEX_SIZE;
    }
    /**
     * Get the grid cell size in world units
     *
     * @returns The grid size
     */
    static getGridSize() {
        return this.GRID_SIZE;
    }
}
/**
 * Size of a hex in world units
 * This affects the scale of the rendered hexagons
 */
CoordinateSystem.HEX_SIZE = 64;
/**
 * Size of a grid cell in world units
 * This affects the scale of the grid-based colony system
 */
CoordinateSystem.GRID_SIZE = 32;


/***/ }),

/***/ "./src/game/core/utils/CoordinateSystemVerification.ts":
/*!*************************************************************!*\
  !*** ./src/game/core/utils/CoordinateSystemVerification.ts ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoordinateSystemVerification: () => (/* binding */ CoordinateSystemVerification)
/* harmony export */ });
/* harmony import */ var _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CoordinateSystem */ "./src/game/core/utils/CoordinateSystem.ts");
/**
 * TerraFlux - Coordinate System Verification
 *
 * This utility verifies that coordinate conversions work correctly.
 * It performs a series of round-trip conversions and checks for accuracy.
 * Used to satisfy Checkpoint 2.3 in the masterplan.
 */

/**
 * Class to verify coordinate conversions work correctly
 */
class CoordinateSystemVerification {
    /**
     * Run all verification tests
     */
    static runAllTests() {
        console.log('===== Coordinate System Verification Tests =====');
        const tests = [
            this.testHexToWorldAndBack,
            this.testGridToWorldAndBack,
            this.testHexToGridAndBack,
            this.testNeighborsConsistency,
            this.testHexDistanceProperties,
            this.testRingGeneration,
            this.testRadiusGeneration
        ];
        let allPassed = true;
        for (const test of tests) {
            const passed = test();
            allPassed = allPassed && passed;
            console.log(`${test.name}: ${passed ? 'PASSED' : 'FAILED'}`);
        }
        console.log(`===== Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} =====`);
        return allPassed;
    }
    /**
     * Test conversion from hex to world and back
     */
    static testHexToWorldAndBack() {
        // Test a range of hex coordinates
        const testCoords = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: 0, r: 1 },
            { q: -1, r: 0 },
            { q: 0, r: -1 },
            { q: 5, r: -3 },
            { q: -7, r: 4 }
        ];
        for (const hex of testCoords) {
            // Convert hex to world
            const world = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexToWorld(hex.q, hex.r);
            // Convert world back to hex
            const hexBack = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.worldToHex(world.x, world.y);
            // Check if we got the original coordinates back
            if (hexBack.q !== hex.q || hexBack.r !== hex.r) {
                console.error(`Hex-World-Hex conversion failed for ${JSON.stringify(hex)}`);
                console.error(`  World: ${JSON.stringify(world)}`);
                console.error(`  Hex back: ${JSON.stringify(hexBack)}`);
                return false;
            }
        }
        return true;
    }
    /**
     * Test conversion from grid to world and back
     */
    static testGridToWorldAndBack() {
        // Test a range of grid coordinates
        const testCoords = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 10, y: -5 },
            { x: -8, y: 12 }
        ];
        for (const grid of testCoords) {
            // Convert grid to world
            const world = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.gridToWorld(grid.x, grid.y);
            // Convert world back to grid
            const gridBack = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.worldToGrid(world.x, world.y);
            // Check if we got the original coordinates back
            if (gridBack.x !== grid.x || gridBack.y !== grid.y) {
                console.error(`Grid-World-Grid conversion failed for ${JSON.stringify(grid)}`);
                console.error(`  World: ${JSON.stringify(world)}`);
                console.error(`  Grid back: ${JSON.stringify(gridBack)}`);
                return false;
            }
        }
        return true;
    }
    /**
     * Test conversion from hex to grid and back
     */
    static testHexToGridAndBack() {
        // Test a range of hex coordinates
        const testCoords = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: 0, r: 1 },
            { q: -1, r: 0 },
            { q: 0, r: -1 },
            { q: 5, r: -3 },
            { q: -7, r: 4 }
        ];
        for (const hex of testCoords) {
            // Convert hex to grid
            const grid = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexToGrid(hex.q, hex.r);
            // Convert grid to world (intermediate step)
            const world = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.gridToWorld(grid.x, grid.y);
            // Convert world back to hex
            const hexBack = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.worldToHex(world.x, world.y);
            // This conversion might not be exact due to grid quantization
            // but should be close - within 1 hex distance
            const distance = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(hex.q, hex.r, hexBack.q, hexBack.r);
            if (distance > 1) {
                console.error(`Hex-Grid-Hex conversion too far off for ${JSON.stringify(hex)}`);
                console.error(`  Grid: ${JSON.stringify(grid)}`);
                console.error(`  Hex back: ${JSON.stringify(hexBack)}`);
                console.error(`  Distance: ${distance}`);
                return false;
            }
        }
        return true;
    }
    /**
     * Test that hex neighbors are consistent
     */
    static testNeighborsConsistency() {
        // Test that all neighbors are exactly distance 1 away
        const hex = { q: 3, r: -2 };
        const neighbors = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.getHexNeighbors(hex.q, hex.r);
        // Check each neighbor
        for (const neighbor of neighbors) {
            const distance = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(hex.q, hex.r, neighbor.q, neighbor.r);
            if (distance !== 1) {
                console.error(`Neighbor not at distance 1: ${JSON.stringify(neighbor)}`);
                console.error(`  Distance: ${distance}`);
                return false;
            }
        }
        // Check that we have exactly 6 neighbors
        if (neighbors.length !== 6) {
            console.error(`Wrong number of neighbors: ${neighbors.length} (expected 6)`);
            return false;
        }
        return true;
    }
    /**
     * Test hex distance properties
     */
    static testHexDistanceProperties() {
        // Test distance properties
        const hexes = [
            { q: 0, r: 0 },
            { q: 3, r: -2 },
            { q: -1, r: 5 },
            { q: 7, r: 0 }
        ];
        // Test symmetry: d(a,b) = d(b,a)
        for (let i = 0; i < hexes.length; i++) {
            for (let j = i + 1; j < hexes.length; j++) {
                const a = hexes[i];
                const b = hexes[j];
                const d1 = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(a.q, a.r, b.q, b.r);
                const d2 = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(b.q, b.r, a.q, a.r);
                if (d1 !== d2) {
                    console.error(`Distance not symmetric: d(${JSON.stringify(a)}, ${JSON.stringify(b)}) = ${d1}, but d(${JSON.stringify(b)}, ${JSON.stringify(a)}) = ${d2}`);
                    return false;
                }
            }
        }
        // Test triangle inequality: d(a,c) <= d(a,b) + d(b,c)
        for (let i = 0; i < hexes.length; i++) {
            for (let j = 0; j < hexes.length; j++) {
                if (i === j)
                    continue;
                for (let k = 0; k < hexes.length; k++) {
                    if (i === k || j === k)
                        continue;
                    const a = hexes[i];
                    const b = hexes[j];
                    const c = hexes[k];
                    const dac = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(a.q, a.r, c.q, c.r);
                    const dab = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(a.q, a.r, b.q, b.r);
                    const dbc = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(b.q, b.r, c.q, c.r);
                    if (dac > dab + dbc) {
                        console.error(`Triangle inequality violated: d(${JSON.stringify(a)}, ${JSON.stringify(c)}) = ${dac} > ${dab} + ${dbc} = d(${JSON.stringify(a)}, ${JSON.stringify(b)}) + d(${JSON.stringify(b)}, ${JSON.stringify(c)})`);
                        return false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * Test hex ring generation
     */
    static testRingGeneration() {
        const center = { q: 0, r: 0 };
        // Test rings of different radii
        for (let radius = 1; radius <= 3; radius++) {
            const ring = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.getHexRing(center.q, center.r, radius);
            // Check that all hexes in the ring are at the correct distance from center
            for (const hex of ring) {
                const distance = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(center.q, center.r, hex.q, hex.r);
                if (distance !== radius) {
                    console.error(`Hex in ring at wrong distance: ${JSON.stringify(hex)}`);
                    console.error(`  Expected distance: ${radius}, actual: ${distance}`);
                    return false;
                }
            }
            // Check that the ring has the correct number of hexes
            // A ring of radius r should have 6*r hexes
            if (ring.length !== 6 * radius) {
                console.error(`Ring has wrong number of hexes: ${ring.length} (expected ${6 * radius})`);
                return false;
            }
        }
        return true;
    }
    /**
     * Test hex radius generation
     */
    static testRadiusGeneration() {
        const center = { q: 0, r: 0 };
        // Test hexes within different radii
        for (let radius = 1; radius <= 3; radius++) {
            const hexes = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.getHexesInRadius(center.q, center.r, radius);
            // Check that all hexes are within the correct distance from center
            for (const hex of hexes) {
                const distance = _CoordinateSystem__WEBPACK_IMPORTED_MODULE_0__.CoordinateSystem.hexDistance(center.q, center.r, hex.q, hex.r);
                if (distance > radius) {
                    console.error(`Hex outside radius: ${JSON.stringify(hex)}`);
                    console.error(`  Maximum allowed distance: ${radius}, actual: ${distance}`);
                    return false;
                }
            }
            // Check that the number of hexes is correct
            // The number of hexes within radius r is 1 + 3r(r+1)
            const expectedCount = 1 + 3 * radius * (radius + 1);
            if (hexes.length !== expectedCount) {
                console.error(`Radius has wrong number of hexes: ${hexes.length} (expected ${expectedCount})`);
                return false;
            }
        }
        return true;
    }
}


/***/ }),

/***/ "./src/game/core/utils/TypeRegistry.ts":
/*!*********************************************!*\
  !*** ./src/game/core/utils/TypeRegistry.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ComponentRegistry: () => (/* binding */ ComponentRegistry),
/* harmony export */   TypeRegistry: () => (/* binding */ TypeRegistry),
/* harmony export */   componentRegistry: () => (/* binding */ componentRegistry)
/* harmony export */ });
/* harmony import */ var _UUID__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./UUID */ "./src/game/core/utils/UUID.ts");
/**
 * TerraFlux - Type Registry
 *
 * A type-safe registry for component types and other game object types.
 * Allows for registration, lookup, and validation of types by ID or name.
 */

/**
 * Generic type registry for managing registrations of any type
 */
class TypeRegistry {
    constructor() {
        /**
         * Maps type IDs to their registration details
         */
        this.registry = new Map();
        /**
         * Maps type names to their IDs for name-based lookups
         */
        this.nameIndex = new Map();
    }
    /**
     * Register a new type
     *
     * @param type The type to register
     * @returns The same type (for chaining)
     * @throws Error if a type with the same ID is already registered
     */
    register(type) {
        // Check if already registered
        if (this.registry.has(type.id)) {
            throw new Error(`Type with ID '${type.id}' is already registered.`);
        }
        // Check for conflicting name
        if (this.nameIndex.has(type.name)) {
            throw new Error(`Type with name '${type.name}' is already registered with ID '${this.nameIndex.get(type.name)}'.`);
        }
        // Add to registry and index by name
        this.registry.set(type.id, type);
        this.nameIndex.set(type.name, type.id);
        return type;
    }
    /**
     * Get a type by its ID
     *
     * @param id The ID of the type to retrieve
     * @returns The registered type or undefined if not found
     */
    getById(id) {
        return this.registry.get(id);
    }
    /**
     * Get a type by its name
     *
     * @param name The name of the type to retrieve
     * @returns The registered type or undefined if not found
     */
    getByName(name) {
        const id = this.nameIndex.get(name);
        return id ? this.registry.get(id) : undefined;
    }
    /**
     * Check if a type with the given ID is registered
     *
     * @param id The ID to check
     * @returns True if a type with the given ID is registered
     */
    hasId(id) {
        return this.registry.has(id);
    }
    /**
     * Check if a type with the given name is registered
     *
     * @param name The name to check
     * @returns True if a type with the given name is registered
     */
    hasName(name) {
        return this.nameIndex.has(name);
    }
    /**
     * Unregister a type by ID
     *
     * @param id The ID of the type to unregister
     * @returns True if the type was successfully unregistered
     */
    unregister(id) {
        const type = this.registry.get(id);
        if (!type) {
            return false;
        }
        // Remove from name index
        this.nameIndex.delete(type.name);
        // Remove from registry
        return this.registry.delete(id);
    }
    /**
     * Get all registered types
     *
     * @returns Array of all registered types
     */
    getAll() {
        return Array.from(this.registry.values());
    }
    /**
     * Get the number of registered types
     *
     * @returns The number of registered types
     */
    get count() {
        return this.registry.size;
    }
    /**
     * Clear all registered types
     */
    clear() {
        this.registry.clear();
        this.nameIndex.clear();
    }
}
/**
 * Registry specifically for component types
 */
class ComponentRegistry extends TypeRegistry {
    /**
     * Register a new component type with automatic ID generation
     *
     * @param name Human-readable component name
     * @param createFn Factory function to create new instances
     * @returns The registered component type
     */
    registerComponentType(name, createFn) {
        // Generate a stable ID based on the component name
        const id = _UUID__WEBPACK_IMPORTED_MODULE_0__.UUID.generateComponentId(name);
        // Create the component type descriptor
        const componentType = {
            id,
            name,
            create: createFn
        };
        // Register it in the base registry
        return this.register(componentType);
    }
    /**
     * Create a new instance of a component by type name
     *
     * @param name The name of the component type
     * @returns A new component instance or undefined if type not found
     */
    createByName(name) {
        const componentType = this.getByName(name);
        return componentType ? componentType.create() : undefined;
    }
    /**
     * Create a new instance of a component by type ID
     *
     * @param id The ID of the component type
     * @returns A new component instance or undefined if type not found
     */
    createById(id) {
        const componentType = this.getById(id);
        return componentType ? componentType.create() : undefined;
    }
}
// Create a global instance of the component registry
const componentRegistry = new ComponentRegistry();


/***/ }),

/***/ "./src/game/core/utils/UUID.ts":
/*!*************************************!*\
  !*** ./src/game/core/utils/UUID.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UUID: () => (/* binding */ UUID)
/* harmony export */ });
/**
 * TerraFlux - UUID Generator
 *
 * A utility for generating unique identifiers for entities and components.
 * Uses a combination of timestamp, random values, and counter to ensure uniqueness,
 * even when generated in rapid succession.
 */
class UUID {
    /**
     * Generate a unique identifier string
     * Format: timestamp-random-counter
     *
     * @returns A string UUID that is guaranteed to be unique
     */
    static generate() {
        // Get current timestamp
        let timestamp = Date.now();
        // Check for clock drift or multiple calls within same millisecond
        if (timestamp <= UUID.lastTimestamp) {
            // Use the last timestamp and increment counter to ensure uniqueness
            timestamp = UUID.lastTimestamp;
            UUID.counter++;
        }
        else {
            // New millisecond, reset counter
            UUID.counter = 0;
            UUID.lastTimestamp = timestamp;
        }
        // Generate a random part
        const random = Math.floor(Math.random() * 0x100000).toString(16).padStart(5, '0');
        // Format: base36 timestamp + random hex + counter
        return `${timestamp.toString(36)}-${random}-${UUID.counter.toString(36)}`;
    }
    /**
     * Generate a unique identifier with a specific prefix
     * Useful for debugging and identifying entity types
     *
     * @param prefix A string prefix to prepend to the UUID
     * @returns A prefixed unique identifier
     */
    static generateWithPrefix(prefix) {
        return `${prefix}-${UUID.generate()}`;
    }
    /**
     * Generate an entity ID with an optional type hint
     *
     * @param entityType Optional type hint for debugging
     * @returns Entity ID string
     */
    static generateEntityId(entityType) {
        return entityType
            ? UUID.generateWithPrefix(`ent-${entityType}`)
            : UUID.generateWithPrefix('ent');
    }
    /**
     * Generate a component type ID
     *
     * @param componentName The name of the component
     * @returns Component type ID string
     */
    static generateComponentId(componentName) {
        // Clean the component name to make it URL-safe
        const safeName = componentName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return `comp-${safeName}-${UUID.generate()}`;
    }
    /**
     * Generate a system ID
     *
     * @param systemName The name of the system
     * @returns System ID string
     */
    static generateSystemId(systemName) {
        // Clean the system name to make it URL-safe
        const safeName = systemName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return `sys-${safeName}-${UUID.generate()}`;
    }
    /**
     * Validate if a string is a properly formatted UUID
     *
     * @param id The string to validate
     * @returns True if the string is a valid UUID format
     */
    static isValid(id) {
        // Basic validation for our UUID format
        return /^[a-z]+-[a-z0-9]+-[a-z0-9]{5}-[a-z0-9]+$/.test(id);
    }
}
// Counter to ensure uniqueness for multiple IDs generated within the same millisecond
UUID.counter = 0;
// Last timestamp used - to detect clock issues and ensure ascending order
UUID.lastTimestamp = 0;


/***/ }),

/***/ "./src/game/example/GameExample.ts":
/*!*****************************************!*\
  !*** ./src/game/example/GameExample.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameExample: () => (/* binding */ GameExample),
/* harmony export */   gameExample: () => (/* binding */ gameExample)
/* harmony export */ });
/* harmony import */ var _core_Game__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/Game */ "./src/game/core/Game.ts");
/* harmony import */ var _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/ecs/EntityManager */ "./src/game/core/ecs/EntityManager.ts");
/* harmony import */ var _core_ecs_SystemManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/ecs/SystemManager */ "./src/game/core/ecs/SystemManager.ts");
/* harmony import */ var _core_ecs_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../core/ecs/types */ "./src/game/core/ecs/types.ts");
/* harmony import */ var _components_Position__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../components/Position */ "./src/game/components/Position.ts");
/* harmony import */ var _components_Velocity__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../components/Velocity */ "./src/game/components/Velocity.ts");
/* harmony import */ var _systems_MovementSystem__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../systems/MovementSystem */ "./src/game/systems/MovementSystem.ts");
/**
 * TerraFlux - Game Example
 *
 * A simple example demonstrating the ECS architecture.
 * Creates bouncing entities with position and velocity components
 * managed by a movement system.
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};







// Game area boundaries
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ENTITY_SIZE = 20;
// Entity bounce system
class BounceSystem extends _systems_MovementSystem__WEBPACK_IMPORTED_MODULE_6__.MovementSystem {
    constructor() {
        super({
            name: 'Bounce',
            // Use a higher priority to ensure it runs after movement
            priority: _core_ecs_types__WEBPACK_IMPORTED_MODULE_3__.SystemPriority.HIGH
        });
    }
    onUpdate(deltaTime, entities) {
        // First let movement system update positions
        super.onUpdate(deltaTime, entities);
        // Then handle bouncing off walls
        for (const entity of entities) {
            const position = entity.getComponent('position');
            const velocity = entity.getComponent('velocity');
            if (position && velocity) {
                // Bounce off left/right walls
                if (position.x < 0) {
                    position.x = 0;
                    velocity.vx = Math.abs(velocity.vx);
                }
                else if (position.x > GAME_WIDTH - ENTITY_SIZE) {
                    position.x = GAME_WIDTH - ENTITY_SIZE;
                    velocity.vx = -Math.abs(velocity.vx);
                }
                // Bounce off top/bottom walls
                if (position.y < 0) {
                    position.y = 0;
                    velocity.vy = Math.abs(velocity.vy);
                }
                else if (position.y > GAME_HEIGHT - ENTITY_SIZE) {
                    position.y = GAME_HEIGHT - ENTITY_SIZE;
                    velocity.vy = -Math.abs(velocity.vy);
                }
            }
        }
    }
}
// Renderer system - just logs positions, would normally draw entities
class RenderSystem {
    constructor() {
        this.canvas = null;
        this.context = null;
        // Initialize canvas when document is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.initCanvas();
        });
    }
    initCanvas() {
        var _a;
        // Create canvas if it doesn't exist
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = GAME_WIDTH;
            this.canvas.height = GAME_HEIGHT;
            this.canvas.style.border = '1px solid black';
            this.canvas.style.backgroundColor = '#f0f0f0';
            (_a = document.getElementById('game-container')) === null || _a === void 0 ? void 0 : _a.appendChild(this.canvas);
            // Get context
            this.context = this.canvas.getContext('2d');
        }
    }
    render(entities) {
        if (!this.context || !this.canvas) {
            this.initCanvas();
            if (!this.context)
                return;
        }
        // Clear canvas
        this.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Draw each entity
        for (const entity of entities) {
            const position = entity.getComponent('position');
            if (position) {
                // Draw entity
                this.context.fillStyle = entity.hasTag('player') ? 'blue' : 'red';
                this.context.fillRect(position.x, position.y, ENTITY_SIZE, ENTITY_SIZE);
                // Draw entity name
                this.context.fillStyle = 'black';
                this.context.font = '10px Arial';
                this.context.fillText(entity.name, position.x, position.y - 5);
            }
        }
    }
}
/**
 * Game Example class
 */
class GameExample {
    constructor() {
        this.renderer = new RenderSystem();
        // Set up event listeners
        _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_0__.GameEventType.INITIALIZED, this.onGameInitialized.bind(this));
        _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_0__.GameEventType.UPDATE, this.onGameUpdate.bind(this));
    }
    /**
     * Initialize the game example
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            // Configure and initialize the game
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.debug = true;
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.targetFPS = 60;
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.useFixedTimestep = false; // Use variable timestep by default
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.timeScale = 1.0; // Normal speed
            yield _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.initialize();
            // Create systems
            const bounceSystem = new BounceSystem();
            _core_ecs_SystemManager__WEBPACK_IMPORTED_MODULE_2__.systemManager.addSystem(bounceSystem);
            // Create entities
            this.createEntities();
            // Set up event listeners for game loop changes
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_0__.GameEventType.TIME_SCALE_CHANGED, this.onTimeScaleChanged.bind(this));
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_0__.GameEventType.TIMESTEP_MODE_CHANGED, this.onTimestepModeChanged.bind(this));
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_0__.GameEventType.PERFORMANCE_SNAPSHOT, this.onPerformanceSnapshot.bind(this));
            // Start the game
            _core_Game__WEBPACK_IMPORTED_MODULE_0__.game.start();
            console.log('Game example initialized with', _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.getEntityCount(), 'entities');
            return _core_Game__WEBPACK_IMPORTED_MODULE_0__.game;
        });
    }
    /**
     * Called when the time scale changes
     */
    onTimeScaleChanged(game, timeScale) {
        console.log(`Time scale changed to ${timeScale.toFixed(1)}x`);
        // We could use this to visually indicate the current speed
        // For example, changing a UI element or adjusting animations
    }
    /**
     * Called when the timestep mode changes
     */
    onTimestepModeChanged(game, useFixedTimestep) {
        console.log(`Switched to ${useFixedTimestep ? 'fixed' : 'variable'} timestep mode`);
        // Could adjust UI or physics behavior based on timestep mode
    }
    /**
     * Called when a performance snapshot is taken
     */
    onPerformanceSnapshot(game, snapshot) {
        console.log('Performance snapshot:', snapshot);
        // Could display detailed performance metrics in a UI
    }
    /**
     * Called when the game is initialized
     */
    onGameInitialized() {
        console.log('Game initialized!');
    }
    /**
     * Called every frame
     */
    onGameUpdate(game, deltaTime) {
        // Get all entities with position components
        const entities = _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.getEntitiesWithComponent('position');
        // Render entities
        this.renderer.render(entities);
    }
    /**
     * Create initial entities
     */
    createEntities() {
        // Create player entity
        const player = _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.createEntity({ name: 'Player' });
        player.addTag('player');
        // Add components to player
        _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.addComponent(player.id, new _components_Position__WEBPACK_IMPORTED_MODULE_4__.PositionComponent(GAME_WIDTH / 2, GAME_HEIGHT / 2));
        _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.addComponent(player.id, new _components_Velocity__WEBPACK_IMPORTED_MODULE_5__.VelocityComponent(100, 130));
        // Create some random entities
        for (let i = 0; i < 10; i++) {
            const entity = _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.createEntity({ name: `Entity ${i + 1}` });
            // Random position within game area
            const x = Math.random() * (GAME_WIDTH - ENTITY_SIZE);
            const y = Math.random() * (GAME_HEIGHT - ENTITY_SIZE);
            // Random velocity
            const vx = (Math.random() - 0.5) * 200;
            const vy = (Math.random() - 0.5) * 200;
            // Add components
            _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.addComponent(entity.id, new _components_Position__WEBPACK_IMPORTED_MODULE_4__.PositionComponent(x, y));
            _core_ecs_EntityManager__WEBPACK_IMPORTED_MODULE_1__.entityManager.addComponent(entity.id, new _components_Velocity__WEBPACK_IMPORTED_MODULE_5__.VelocityComponent(vx, vy));
        }
    }
}
// Export an instance of the game example for easy access
const gameExample = new GameExample();


/***/ }),

/***/ "./src/game/systems/MovementSystem.ts":
/*!********************************************!*\
  !*** ./src/game/systems/MovementSystem.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MovementSystem: () => (/* binding */ MovementSystem)
/* harmony export */ });
/* harmony import */ var _core_ecs_System__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/ecs/System */ "./src/game/core/ecs/System.ts");
/* harmony import */ var _components_Position__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../components/Position */ "./src/game/components/Position.ts");
/* harmony import */ var _components_Velocity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../components/Velocity */ "./src/game/components/Velocity.ts");
/* harmony import */ var _core_ecs_types__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../core/ecs/types */ "./src/game/core/ecs/types.ts");
/**
 * TerraFlux - Movement System
 *
 * Updates entity positions based on their velocities.
 */




/**
 * System that updates entity positions based on velocities
 */
class MovementSystem extends _core_ecs_System__WEBPACK_IMPORTED_MODULE_0__.System {
    /**
     * Constructor for MovementSystem
     *
     * @param config System configuration
     */
    constructor(config = {}) {
        super(Object.assign({ name: 'Movement', priority: _core_ecs_types__WEBPACK_IMPORTED_MODULE_3__.SystemPriority.NORMAL, query: {
                withComponents: [_components_Position__WEBPACK_IMPORTED_MODULE_1__.POSITION_COMPONENT_ID, _components_Velocity__WEBPACK_IMPORTED_MODULE_2__.VELOCITY_COMPONENT_ID]
            } }, config));
    }
    /**
     * Called during system initialization
     */
    onInitialize() {
        console.log(`[${this.name}] Initialized`);
        return true;
    }
    /**
     * Update method called each frame for entities with position and velocity
     *
     * @param deltaTime Time elapsed since the last update in seconds
     * @param entities Array of entities that match this system's query
     */
    onUpdate(deltaTime, entities) {
        // Process all matching entities
        for (const entity of entities) {
            // Get the position and velocity components
            const position = entity.getComponent(_components_Position__WEBPACK_IMPORTED_MODULE_1__.POSITION_COMPONENT_ID);
            const velocity = entity.getComponent(_components_Velocity__WEBPACK_IMPORTED_MODULE_2__.VELOCITY_COMPONENT_ID);
            if (position && velocity) {
                // Update position based on velocity and delta time
                position.x += velocity.vx * deltaTime;
                position.y += velocity.vy * deltaTime;
            }
        }
    }
    /**
     * Called when the system is enabled
     */
    onEnable() {
        console.log(`[${this.name}] Enabled`);
    }
    /**
     * Called when the system is disabled
     */
    onDisable() {
        console.log(`[${this.name}] Disabled`);
    }
    /**
     * Called when the system is destroyed
     */
    onDestroy() {
        console.log(`[${this.name}] Destroyed`);
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***************************!*\
  !*** ./src/game/index.ts ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CoordinateSystem: () => (/* reexport safe */ _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem),
/* harmony export */   CoordinateSystemVerification: () => (/* reexport safe */ _core_utils_CoordinateSystemVerification__WEBPACK_IMPORTED_MODULE_3__.CoordinateSystemVerification),
/* harmony export */   HexPathfinding: () => (/* reexport safe */ _core_pathfinding_HexPathfinding__WEBPACK_IMPORTED_MODULE_5__.HexPathfinding),
/* harmony export */   HexPositionComponent: () => (/* reexport safe */ _components_HexPosition__WEBPACK_IMPORTED_MODULE_4__.HexPositionComponent),
/* harmony export */   game: () => (/* reexport safe */ _core_Game__WEBPACK_IMPORTED_MODULE_1__.game),
/* harmony export */   gameExample: () => (/* reexport safe */ _example_GameExample__WEBPACK_IMPORTED_MODULE_0__.gameExample)
/* harmony export */ });
/* harmony import */ var _example_GameExample__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./example/GameExample */ "./src/game/example/GameExample.ts");
/* harmony import */ var _core_Game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core/Game */ "./src/game/core/Game.ts");
/* harmony import */ var _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./core/utils/CoordinateSystem */ "./src/game/core/utils/CoordinateSystem.ts");
/* harmony import */ var _core_utils_CoordinateSystemVerification__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./core/utils/CoordinateSystemVerification */ "./src/game/core/utils/CoordinateSystemVerification.ts");
/* harmony import */ var _components_HexPosition__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/HexPosition */ "./src/game/components/HexPosition.ts");
/* harmony import */ var _core_pathfinding_HexPathfinding__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./core/pathfinding/HexPathfinding */ "./src/game/core/pathfinding/HexPathfinding.ts");
/**
 * TerraFlux - Game Entry Point
 *
 * Main entry point for initializing the game within the Electron application.
 * This file serves as the bridge between the Electron IPC system and the game engine.
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


/**
 * Initialize game when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game DOM ready, waiting for init event from Electron');
    // Create game container for rendering
    const container = document.createElement('div');
    container.id = 'game-container';
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.margin = '20px auto';
    document.body.appendChild(container);
    // Listen for initialization events from the Electron main process
    window.electron.onGameInit((config) => {
        console.log('Received game init from Electron with config:', config);
        // Apply configuration
        if (config.debug !== undefined)
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.debug = config.debug;
        if (config.targetFPS !== undefined)
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.targetFPS = config.targetFPS;
        if (config.useFixedTimestep !== undefined)
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.useFixedTimestep = config.useFixedTimestep;
        if (config.fixedTimestepValue !== undefined)
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.fixedTimestepValue = config.fixedTimestepValue;
        if (config.timeScale !== undefined)
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.timeScale = config.timeScale;
        // Initialize the game example
        initGame();
    });
    // If no init event received after a timeout, auto-initialize (for browser testing)
    setTimeout(() => {
        if (_core_Game__WEBPACK_IMPORTED_MODULE_1__.game.state === 'uninitialized') {
            console.log('No init from Electron received, auto-initializing game');
            initGame();
        }
    }, 1000);
});
/**
 * Initialize the game
 */
function initGame() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Register event listeners
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_1__.GameEventType.UPDATE, onGameUpdate);
            _core_Game__WEBPACK_IMPORTED_MODULE_1__.game.eventEmitter.subscribe(_core_Game__WEBPACK_IMPORTED_MODULE_1__.GameEventType.ERROR, onGameError);
            // Initialize the game example
            yield _example_GameExample__WEBPACK_IMPORTED_MODULE_0__.gameExample.init();
            // Notify Electron that the game has initialized
            window.electron.sendGameState(_core_Game__WEBPACK_IMPORTED_MODULE_1__.game.state);
            console.log('Game initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize game:', error);
            window.electron.sendGameError(error instanceof Error ? error.message : String(error));
        }
    });
}
/**
 * Handle game updates
 */
function onGameUpdate(game, deltaTime) {
    // Send game stats to Electron every second
    if (game.stats.totalFrames % 60 === 0) {
        // Add deltaTime to the stats
        const statsWithDelta = Object.assign(Object.assign({}, game.stats), { deltaTime });
        window.electron.sendGameStats(statsWithDelta);
    }
}
/**
 * Handle game errors
 */
function onGameError(game, error) {
    console.error('Game error:', error);
    window.electron.sendGameError(error.message);
}
// Electron interface types are defined in src/app/types/electron.d.ts
// Export coordinate system components




// Export the game for direct access

// Add to window.TeraFlux if it exists (for testing)
if (typeof window !== 'undefined') {
    // Create TeraFlux namespace if doesn't exist
    if (!window.TeraFlux) {
        window.TeraFlux = { Game: {} };
    }
    else if (!window.TeraFlux.Game) {
        window.TeraFlux.Game = {};
    }
    // Add coordinate system components to TeraFlux namespace
    if (window.TeraFlux && window.TeraFlux.Game) {
        window.TeraFlux.Game.CoordinateSystem = _core_utils_CoordinateSystem__WEBPACK_IMPORTED_MODULE_2__.CoordinateSystem;
        window.TeraFlux.Game.CoordinateSystemVerification = _core_utils_CoordinateSystemVerification__WEBPACK_IMPORTED_MODULE_3__.CoordinateSystemVerification;
        window.TeraFlux.Game.HexPositionComponent = _components_HexPosition__WEBPACK_IMPORTED_MODULE_4__.HexPositionComponent;
        window.TeraFlux.Game.HexPathfinding = _core_pathfinding_HexPathfinding__WEBPACK_IMPORTED_MODULE_5__.HexPathfinding;
    }
}

})();

__webpack_exports__ = __webpack_exports__["default"];
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=game.bundle.js.map