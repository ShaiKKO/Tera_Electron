"use strict";
/**
 * TerraFlux - Camera Controller
 *
 * Handles camera movement and zoom based on input.
 * Implements RimWorld-style camera navigation with physics-based
 * movement, momentum, and advanced zoom controls.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraController = exports.CameraEventType = void 0;
var types_1 = require("./types");
var EventEmitter_1 = require("../ecs/EventEmitter");
/**
 * Camera event types
 */
var CameraEventType;
(function (CameraEventType) {
    CameraEventType["MOVED"] = "camera_moved";
    CameraEventType["ZOOMED"] = "camera_zoomed";
    CameraEventType["BOUNDS_CHANGED"] = "camera_bounds_changed";
    CameraEventType["SHAKE_START"] = "camera_shake_start";
    CameraEventType["SHAKE_END"] = "camera_shake_end";
    CameraEventType["ANIMATION_START"] = "camera_animation_start";
    CameraEventType["ANIMATION_END"] = "camera_animation_end";
})(CameraEventType || (exports.CameraEventType = CameraEventType = {}));
/**
 * CameraController class
 * Handles camera movement based on input actions with physics-based
 * movement and advanced features for game world navigation
 */
var CameraController = /** @class */ (function () {
    /**
     * Constructor
     */
    function CameraController(initialState) {
        this.position = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.rotation = 0; // Added rotation support
        this.targetPosition = { x: 0, y: 0 };
        this.targetZoom = 1.0;
        this.targetRotation = 0; // Target rotation for smooth transitions
        // Physics-based movement
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.friction = 0.92; // Base friction coefficient
        this.momentumEnabled = true;
        this.bounceFactor = 0.5; // Bounce elasticity when hitting boundaries
        // Camera movement settings
        this.moveSpeed = 5.0;
        this.zoomSpeed = 0.1;
        this.smoothing = 0.2;
        this.maxVelocity = 20.0;
        // Camera limits
        this.minZoom = 0.5;
        this.maxZoom = 3.0;
        this.bounds = null;
        // Input tracking
        this.movementInputs = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        // Edge scrolling
        this.edgeScrollEnabled = true;
        this.edgeScrollSize = 20; // Pixels from edge that trigger scrolling
        this.edgeScrollSpeed = 3.0;
        this.edgeScrollActive = false;
        // Follow mode
        this.followTarget = null;
        this.followOffset = { x: 0, y: 0 };
        this.followLag = 0.1;
        // Camera animation
        this.isAnimating = false;
        this.animationStart = null;
        this.animationEnd = null;
        this.animationProgress = 0;
        this.animationDuration = 0;
        this.animationEasing = function (t) { return t; }; // Linear by default
        this.animationCallback = null;
        // Camera shake effect
        this.isShaking = false;
        this.shakeIntensity = 0;
        this.shakeDecay = 0;
        this.shakeDuration = 0;
        this.shakeElapsed = 0;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeFrequency = 0.1;
        // Drag navigation
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragStartCameraPos = { x: 0, y: 0 };
        this.dragVelocity = { x: 0, y: 0 };
        this.lastDragPosition = { x: 0, y: 0 };
        this.dragTime = 0;
        // Double-click detection
        this.lastClickTime = 0;
        this.lastClickPosition = { x: 0, y: 0 };
        this.doubleClickThreshold = 300; // milliseconds
        this.doubleClickDistance = 10; // pixels
        if (initialState === null || initialState === void 0 ? void 0 : initialState.position) {
            this.position = __assign({}, initialState.position);
            this.targetPosition = __assign({}, initialState.position);
        }
        if (initialState === null || initialState === void 0 ? void 0 : initialState.zoom) {
            this.zoom = initialState.zoom;
            this.targetZoom = initialState.zoom;
        }
        if (initialState === null || initialState === void 0 ? void 0 : initialState.rotation) {
            this.rotation = initialState.rotation;
            this.targetRotation = initialState.rotation;
        }
        if (initialState === null || initialState === void 0 ? void 0 : initialState.velocity) {
            this.velocity = __assign({}, initialState.velocity);
        }
    }
    /**
     * Handle input action
     */
    CameraController.prototype.handleInputAction = function (action, value) {
        if (value === void 0) { value = 1; }
        switch (action) {
            case types_1.InputAction.MOVE_CAMERA_UP:
                this.movementInputs.up = value > 0;
                break;
            case types_1.InputAction.MOVE_CAMERA_DOWN:
                this.movementInputs.down = value > 0;
                break;
            case types_1.InputAction.MOVE_CAMERA_LEFT:
                this.movementInputs.left = value > 0;
                break;
            case types_1.InputAction.MOVE_CAMERA_RIGHT:
                this.movementInputs.right = value > 0;
                break;
            case types_1.InputAction.ZOOM_IN:
                this.zoomCamera(-value * this.zoomSpeed);
                break;
            case types_1.InputAction.ZOOM_OUT:
                this.zoomCamera(value * this.zoomSpeed);
                break;
        }
    };
    /**
     * Update camera position and zoom
     */
    CameraController.prototype.update = function (deltaTime) {
        // Cap deltaTime to avoid huge jumps on slow framerates
        var dt = Math.min(deltaTime, 0.1);
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
            EventEmitter_1.eventEmitter.emit(CameraEventType.MOVED, this.getState());
        }
    };
    /**
     * Process continuous movement inputs
     */
    CameraController.prototype.processMovementInputs = function (deltaTime) {
        // Calculate movement based on current inputs
        var dx = 0;
        var dy = 0;
        if (this.movementInputs.up)
            dy -= 1;
        if (this.movementInputs.down)
            dy += 1;
        if (this.movementInputs.left)
            dx -= 1;
        if (this.movementInputs.right)
            dx += 1;
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            var length_1 = Math.sqrt(dx * dx + dy * dy);
            dx /= length_1;
            dy /= length_1;
        }
        // Apply movement speed and zoom factor
        var effectiveSpeed = this.moveSpeed * this.zoom * deltaTime;
        this.targetPosition.x += dx * effectiveSpeed;
        this.targetPosition.y += dy * effectiveSpeed;
    };
    /**
     * Start camera drag
     */
    CameraController.prototype.startDrag = function (screenX, screenY) {
        this.isDragging = true;
        this.dragStart.x = screenX;
        this.dragStart.y = screenY;
        this.dragStartCameraPos.x = this.targetPosition.x;
        this.dragStartCameraPos.y = this.targetPosition.y;
    };
    /**
     * Continue camera drag
     */
    CameraController.prototype.continueDrag = function (screenX, screenY) {
        if (!this.isDragging)
            return;
        // Calculate drag distance in screen space
        var dx = screenX - this.dragStart.x;
        var dy = screenY - this.dragStart.y;
        // Convert to world space (considering zoom level)
        this.targetPosition.x = this.dragStartCameraPos.x - dx * this.zoom;
        this.targetPosition.y = this.dragStartCameraPos.y - dy * this.zoom;
    };
    /**
     * End camera drag
     */
    CameraController.prototype.endDrag = function () {
        this.isDragging = false;
    };
    /**
     * Zoom camera by delta amount
     */
    CameraController.prototype.zoomCamera = function (delta) {
        this.targetZoom *= (1 - delta);
        this.enforceZoomLimits();
    };
    /**
     * Zoom camera at specific screen position
     */
    CameraController.prototype.zoomAtPosition = function (delta, screenX, screenY, canvasWidth, canvasHeight) {
        // Convert screen position to world position before zoom
        var worldX = this.position.x + (screenX - canvasWidth / 2) * this.zoom;
        var worldY = this.position.y + (screenY - canvasHeight / 2) * this.zoom;
        // Apply zoom
        var oldZoom = this.targetZoom;
        this.targetZoom *= (1 - delta);
        this.enforceZoomLimits();
        // Adjust position to keep the point under cursor at the same place
        if (oldZoom !== this.targetZoom) {
            var zoomFactor = this.targetZoom / oldZoom;
            var newWorldX = this.position.x + (screenX - canvasWidth / 2) * this.targetZoom;
            var newWorldY = this.position.y + (screenY - canvasHeight / 2) * this.targetZoom;
            this.targetPosition.x += worldX - newWorldX;
            this.targetPosition.y += worldY - newWorldY;
        }
    };
    /**
     * Set camera bounds
     */
    CameraController.prototype.setBounds = function (minX, minY, maxX, maxY) {
        this.bounds = { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
        this.enforceBoundaryLimits();
    };
    /**
     * Clear camera bounds
     */
    CameraController.prototype.clearBounds = function () {
        this.bounds = null;
    };
    /**
     * Enforce zoom limits
     */
    CameraController.prototype.enforceZoomLimits = function () {
        this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.targetZoom));
    };
    /**
     * Enforce boundary limits
     */
    CameraController.prototype.enforceBoundaryLimits = function () {
        if (!this.bounds)
            return;
        this.targetPosition.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.targetPosition.x));
        this.targetPosition.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.targetPosition.y));
    };
    /**
     * Move camera to specific position
     */
    CameraController.prototype.moveTo = function (x, y, instant) {
        if (instant === void 0) { instant = false; }
        this.targetPosition.x = x;
        this.targetPosition.y = y;
        if (instant) {
            this.position.x = x;
            this.position.y = y;
        }
    };
    /**
     * Set zoom level
     */
    CameraController.prototype.setZoom = function (zoom, instant) {
        if (instant === void 0) { instant = false; }
        this.targetZoom = zoom;
        this.enforceZoomLimits();
        if (instant) {
            this.zoom = this.targetZoom;
        }
    };
    /**
     * Get current camera state
     */
    CameraController.prototype.getState = function () {
        return {
            position: __assign({}, this.position),
            zoom: this.zoom,
            rotation: this.rotation,
            velocity: __assign({}, this.velocity)
        };
    };
    /**
     * Get camera speed
     */
    CameraController.prototype.getMoveSpeed = function () {
        return this.moveSpeed;
    };
    /**
     * Set camera speed
     */
    CameraController.prototype.setMoveSpeed = function (speed) {
        this.moveSpeed = speed;
    };
    /**
     * Get zoom speed
     */
    CameraController.prototype.getZoomSpeed = function () {
        return this.zoomSpeed;
    };
    /**
     * Set zoom speed
     */
    CameraController.prototype.setZoomSpeed = function (speed) {
        this.zoomSpeed = speed;
    };
    /**
     * Set smoothing factor (0-1)
     */
    CameraController.prototype.setSmoothing = function (smoothing) {
        this.smoothing = Math.max(0, Math.min(1, smoothing));
    };
    /**
     * Update physics (momentum and friction)
     */
    CameraController.prototype.updatePhysics = function (deltaTime) {
        // Apply acceleration to velocity
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        // Apply friction
        this.velocity.x *= Math.pow(this.friction, deltaTime * 60);
        this.velocity.y *= Math.pow(this.friction, deltaTime * 60);
        // Cap velocity to maximum
        var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxVelocity) {
            var scale = this.maxVelocity / speed;
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
                }
                else if (this.targetPosition.x > this.bounds.maxX) {
                    this.targetPosition.x = this.bounds.maxX;
                    this.velocity.x = -this.velocity.x * this.bounceFactor;
                }
                if (this.targetPosition.y < this.bounds.minY) {
                    this.targetPosition.y = this.bounds.minY;
                    this.velocity.y = -this.velocity.y * this.bounceFactor;
                }
                else if (this.targetPosition.y > this.bounds.maxY) {
                    this.targetPosition.y = this.bounds.maxY;
                    this.velocity.y = -this.velocity.y * this.bounceFactor;
                }
            }
        }
        else {
            // Stop completely when velocity is very low
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        // Reset acceleration
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    };
    /**
     * Update camera animation
     */
    CameraController.prototype.updateAnimation = function (deltaTime) {
        if (!this.isAnimating || !this.animationStart || !this.animationEnd)
            return;
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
            EventEmitter_1.eventEmitter.emit(CameraEventType.ANIMATION_END, this.getState());
        }
        else {
            // Apply easing
            var t = this.animationEasing(this.animationProgress);
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
    };
    /**
     * Update camera shake effect
     */
    CameraController.prototype.updateShake = function (deltaTime) {
        if (!this.isShaking)
            return;
        // Update shake time
        this.shakeElapsed += deltaTime;
        if (this.shakeElapsed >= this.shakeDuration) {
            // Shake complete
            this.isShaking = false;
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            // Emit shake end event
            EventEmitter_1.eventEmitter.emit(CameraEventType.SHAKE_END, this.getState());
        }
        else {
            // Calculate remaining intensity based on elapsed time and decay
            var remainingIntensity = this.shakeIntensity * (1 - (this.shakeElapsed / this.shakeDuration) * this.shakeDecay);
            // Generate new random offset
            var angle = Math.random() * Math.PI * 2;
            var distance = Math.random() * remainingIntensity;
            this.shakeOffset.x = Math.cos(angle) * distance;
            this.shakeOffset.y = Math.sin(angle) * distance;
            // Apply offset to position
            this.position.x += this.shakeOffset.x;
            this.position.y += this.shakeOffset.y;
        }
    };
    /**
     * Update camera position when following a target
     */
    CameraController.prototype.updateFollowTarget = function (deltaTime) {
        if (!this.followTarget)
            return;
        // Get target position
        var targetPos = this.followTarget.getPosition();
        // Apply offset
        var targetX = targetPos.x + this.followOffset.x;
        var targetY = targetPos.y + this.followOffset.y;
        // If target has velocity, look ahead
        if (this.followTarget.getVelocity) {
            var velocity = this.followTarget.getVelocity();
            var lookAheadFactor = 1.0; // How far ahead to look based on velocity
            // Apply look-ahead based on target velocity
            this.targetPosition.x = targetX + velocity.x * lookAheadFactor;
            this.targetPosition.y = targetY + velocity.y * lookAheadFactor;
        }
        else {
            // Direct follow
            this.targetPosition.x = targetX;
            this.targetPosition.y = targetY;
        }
    };
    /**
     * Process edge scrolling
     */
    CameraController.prototype.processEdgeScrolling = function (deltaTime) {
        if (!this.edgeScrollEnabled)
            return;
        // This would normally check mouse position against screen edges
        // For now, we'll assume we have access to mouse position through a parameter
        // In a real implementation, this would be provided by the input system
        // This placeholder demonstrates the structure, but actual implementation
        // would require mouse coordinates from the input system
        var mouseX = 0; // Would come from input system
        var mouseY = 0; // Would come from input system
        var screenWidth = 800; // Would come from render system
        var screenHeight = 600; // Would come from render system
        var dx = 0;
        var dy = 0;
        // Check screen edges
        if (mouseX < this.edgeScrollSize) {
            // Left edge
            dx = -1 * (1 - mouseX / this.edgeScrollSize);
            this.edgeScrollActive = true;
        }
        else if (mouseX > screenWidth - this.edgeScrollSize) {
            // Right edge
            dx = 1 * (1 - (screenWidth - mouseX) / this.edgeScrollSize);
            this.edgeScrollActive = true;
        }
        if (mouseY < this.edgeScrollSize) {
            // Top edge
            dy = -1 * (1 - mouseY / this.edgeScrollSize);
            this.edgeScrollActive = true;
        }
        else if (mouseY > screenHeight - this.edgeScrollSize) {
            // Bottom edge
            dy = 1 * (1 - (screenHeight - mouseY) / this.edgeScrollSize);
            this.edgeScrollActive = true;
        }
        // Apply edge scrolling movement if active
        if (this.edgeScrollActive && (dx !== 0 || dy !== 0)) {
            // Normalize diagonal movement
            if (dx !== 0 && dy !== 0) {
                var length_2 = Math.sqrt(dx * dx + dy * dy);
                dx /= length_2;
                dy /= length_2;
            }
            // Apply movement with edge scroll speed
            var edgeScrollAmount = this.edgeScrollSpeed * this.zoom * deltaTime;
            this.targetPosition.x += dx * edgeScrollAmount;
            this.targetPosition.y += dy * edgeScrollAmount;
        }
        else {
            this.edgeScrollActive = false;
        }
    };
    /**
     * Animate camera to a new position and zoom level
     */
    CameraController.prototype.animateTo = function (targetState, options) {
        // Store current state as animation start
        this.animationStart = this.getState();
        // Create end state by merging current state with target state
        this.animationEnd = {
            position: targetState.position || __assign({}, this.position),
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
                this.animationEasing = function (t) { return t * t; };
                break;
            case 'easeOut':
                this.animationEasing = function (t) { return 1 - (1 - t) * (1 - t); };
                break;
            case 'easeInOut':
                this.animationEasing = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
                break;
            case 'bounce':
                this.animationEasing = function (t) {
                    var n1 = 7.5625;
                    var d1 = 2.75;
                    if (t < 1 / d1) {
                        return n1 * t * t;
                    }
                    else if (t < 2 / d1) {
                        return n1 * (t -= 1.5 / d1) * t + 0.75;
                    }
                    else if (t < 2.5 / d1) {
                        return n1 * (t -= 2.25 / d1) * t + 0.9375;
                    }
                    else {
                        return n1 * (t -= 2.625 / d1) * t + 0.984375;
                    }
                };
                break;
            default:
                // Linear
                this.animationEasing = function (t) { return t; };
        }
        // Start animation
        this.isAnimating = true;
        // Emit animation start event
        EventEmitter_1.eventEmitter.emit(CameraEventType.ANIMATION_START, {
            start: this.animationStart,
            end: this.animationEnd,
            duration: this.animationDuration
        });
    };
    /**
     * Start a camera shake effect
     */
    CameraController.prototype.shake = function (options) {
        this.shakeIntensity = options.intensity;
        this.shakeDuration = options.duration;
        this.shakeElapsed = 0;
        this.shakeDecay = options.falloff === 'exponential' ? 2.0 : 1.0;
        this.shakeFrequency = options.frequency || 0.1;
        this.isShaking = true;
        // Emit shake start event
        EventEmitter_1.eventEmitter.emit(CameraEventType.SHAKE_START, {
            intensity: this.shakeIntensity,
            duration: this.shakeDuration
        });
    };
    /**
     * Set camera to follow a target
     */
    CameraController.prototype.follow = function (target, offset, lag) {
        if (offset === void 0) { offset = { x: 0, y: 0 }; }
        if (lag === void 0) { lag = 0.1; }
        this.followTarget = target;
        this.followOffset = offset;
        this.followLag = Math.max(0, Math.min(1, lag));
    };
    /**
     * Stop following a target
     */
    CameraController.prototype.stopFollowing = function () {
        this.followTarget = null;
    };
    /**
     * Set edge scrolling enabled state
     */
    CameraController.prototype.setEdgeScrollingEnabled = function (enabled) {
        this.edgeScrollEnabled = enabled;
    };
    /**
     * Configure edge scrolling
     */
    CameraController.prototype.configureEdgeScrolling = function (edgeSize, speed) {
        this.edgeScrollSize = Math.max(1, edgeSize);
        this.edgeScrollSpeed = Math.max(0.1, speed);
    };
    /**
     * Set momentum enabled state
     */
    CameraController.prototype.setMomentumEnabled = function (enabled) {
        this.momentumEnabled = enabled;
        if (!enabled) {
            // Reset velocity when disabling momentum
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    };
    return CameraController;
}());
exports.CameraController = CameraController;
