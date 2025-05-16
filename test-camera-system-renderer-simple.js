"use strict";
/**
 * Simplified Camera System Test for TerraFlux
 *
 * A streamlined version focused on core camera functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
var PIXI = require("pixi.js");
var CameraController_1 = require("./src/game/core/input/CameraController");
var types_1 = require("./src/game/core/input/types");
/**
 * Simplified Camera Test Class
 */
var SimpleCameraTest = /** @class */ (function () {
    function SimpleCameraTest() {
        var _this = this;
        var _a;
        this.frameCount = 0;
        this.fps = 0;
        this.lastTime = 0;
        // Internal state
        this.isDragging = false;
        this.momentumEnabled = true;
        this.edgeScrollEnabled = true;
        // Set up the PIXI application
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a2e,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        (_a = document.getElementById('game-container')) === null || _a === void 0 ? void 0 : _a.appendChild(this.app.view);
        // Create camera controller
        this.camera = new CameraController_1.CameraController({ position: { x: 0, y: 0 }, zoom: 1 });
        // Create world container
        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);
        // Find stats element
        this.stats = document.getElementById('stats');
        // Set camera bounds
        this.camera.setBounds(-1000, -1000, 1000, 1000);
        // Create test scene
        this.createScene();
        // Set up event handlers
        this.setupInputHandlers();
        this.setupButtonListeners();
        // Start update loop
        this.app.ticker.add(this.update.bind(this));
        // Update stats periodically
        setInterval(function () { return _this.updateStats(); }, 500);
        // Handle window resize
        window.addEventListener('resize', function () {
            _this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
        console.log('Camera test initialized');
    }
    /**
     * Create visual elements for the scene
     */
    SimpleCameraTest.prototype.createScene = function () {
        // Create a grid for reference
        var grid = new PIXI.Graphics();
        grid.lineStyle(1, 0x444444);
        // Draw grid lines
        for (var x = -1000; x <= 1000; x += 100) {
            grid.moveTo(x, -1000);
            grid.lineTo(x, 1000);
        }
        for (var y = -1000; y <= 1000; y += 100) {
            grid.moveTo(-1000, y);
            grid.lineTo(1000, y);
        }
        // Draw origin lines with different color
        grid.lineStyle(2, 0x666666);
        grid.moveTo(-1000, 0);
        grid.lineTo(1000, 0);
        grid.moveTo(0, -1000);
        grid.lineTo(0, 1000);
        // Add grid to world
        this.worldContainer.addChild(grid);
        // Create origin marker
        var origin = new PIXI.Graphics();
        origin.beginFill(0xff0000);
        origin.drawCircle(0, 0, 10);
        origin.endFill();
        this.worldContainer.addChild(origin);
        // Create some test objects
        for (var i = 0; i < 10; i++) {
            var obj = new PIXI.Graphics();
            obj.beginFill(0x00aaff);
            obj.drawRect(-25, -25, 50, 50);
            obj.endFill();
            obj.x = (Math.random() * 1600) - 800;
            obj.y = (Math.random() * 1600) - 800;
            obj.rotation = Math.random() * Math.PI * 2;
            this.worldContainer.addChild(obj);
        }
    };
    /**
     * Set up input handlers
     */
    SimpleCameraTest.prototype.setupInputHandlers = function () {
        // Keyboard controls
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        // Mouse wheel zoom - use passive event listener to prevent errors
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: true });
        // Mouse drag
        if (this.app.view instanceof HTMLCanvasElement) {
            this.app.view.addEventListener('mousedown', this.handleMouseDown.bind(this));
            window.addEventListener('mousemove', this.handleMouseMove.bind(this));
            window.addEventListener('mouseup', this.handleMouseUp.bind(this));
            // Double click for centering
            this.app.view.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        }
    };
    /**
     * Handle double click for camera centering
     */
    SimpleCameraTest.prototype.handleDoubleClick = function (event) {
        // Convert screen coordinates to world coordinates
        var view = this.app.view;
        if (!view)
            return;
        var rect = view.getBoundingClientRect();
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;
        // Calculate world position
        var worldX = this.camera.getState().position.x + (mouseX - this.app.renderer.width / 2) * this.camera.getState().zoom;
        var worldY = this.camera.getState().position.y + (mouseY - this.app.renderer.height / 2) * this.camera.getState().zoom;
        // Animate camera to center on the clicked point
        this.camera.animateTo({
            position: { x: worldX, y: worldY },
            zoom: this.camera.getState().zoom
        }, {
            duration: 500,
            easing: 'easeOut'
        });
    };
    /**
     * Set up button listeners
     */
    SimpleCameraTest.prototype.setupButtonListeners = function () {
        var _this = this;
        var _a, _b, _c, _d, _e;
        (_a = document.getElementById('shake-camera')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            _this.camera.shake({
                intensity: 15,
                duration: 500,
                falloff: 'exponential',
                frequency: 0.2
            });
        });
        (_b = document.getElementById('animate-camera')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function () {
            var targetX = (Math.random() * 1600) - 800;
            var targetY = (Math.random() * 1600) - 800;
            _this.camera.animateTo({
                position: { x: targetX, y: targetY },
                zoom: 0.5 + Math.random() * 1.5
            }, {
                duration: 1500,
                easing: 'easeInOut'
            });
        });
        (_c = document.getElementById('toggle-momentum')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', function () {
            _this.momentumEnabled = !_this.momentumEnabled;
            _this.camera.setMomentumEnabled(_this.momentumEnabled);
        });
        (_d = document.getElementById('toggle-edge-scroll')) === null || _d === void 0 ? void 0 : _d.addEventListener('click', function () {
            _this.edgeScrollEnabled = !_this.edgeScrollEnabled;
            _this.camera.setEdgeScrollingEnabled(_this.edgeScrollEnabled);
        });
        (_e = document.getElementById('reset-camera')) === null || _e === void 0 ? void 0 : _e.addEventListener('click', function () {
            _this.camera.moveTo(0, 0, true);
            _this.camera.setZoom(1, true);
        });
    };
    /**
     * Main update loop
     */
    SimpleCameraTest.prototype.update = function (delta) {
        // Update time stats
        var now = performance.now();
        this.frameCount++;
        if (now - this.lastTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
        // Convert PIXI delta (usually around 1/60) to seconds
        var deltaTime = delta / 60;
        // Update camera
        this.camera.update(deltaTime);
        // Apply camera transform to world
        var cameraState = this.camera.getState();
        // Apply camera transformations to the world container
        // Position needs to be inverted for the "camera" effect
        this.worldContainer.x = this.app.renderer.width / 2 - cameraState.position.x;
        this.worldContainer.y = this.app.renderer.height / 2 - cameraState.position.y;
        this.worldContainer.scale.set(1 / cameraState.zoom);
        if (cameraState.rotation !== undefined) {
            this.worldContainer.rotation = -cameraState.rotation;
        }
    };
    /**
     * Update stats display
     */
    SimpleCameraTest.prototype.updateStats = function () {
        if (!this.stats)
            return;
        var cameraState = this.camera.getState();
        this.stats.innerHTML = "\n            FPS: ".concat(this.fps, "<br>\n            Position: (").concat(cameraState.position.x.toFixed(1), ", ").concat(cameraState.position.y.toFixed(1), ")<br>\n            Zoom: ").concat(cameraState.zoom.toFixed(2), "<br>\n            Momentum: ").concat(this.momentumEnabled ? 'On' : 'Off', "<br>\n            Edge scrolling: ").concat(this.edgeScrollEnabled ? 'On' : 'Off', "\n        ");
    };
    /**
     * Handle keyboard key press
     */
    SimpleCameraTest.prototype.handleKeyDown = function (event) {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_UP, 1);
                break;
            case 'ArrowDown':
            case 's':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_DOWN, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_LEFT, 1);
                break;
            case 'ArrowRight':
            case 'd':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_RIGHT, 1);
                break;
            case ' ':
                this.momentumEnabled = !this.momentumEnabled;
                this.camera.setMomentumEnabled(this.momentumEnabled);
                break;
        }
    };
    /**
     * Handle keyboard key release
     */
    SimpleCameraTest.prototype.handleKeyUp = function (event) {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_UP, 0);
                break;
            case 'ArrowDown':
            case 's':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_DOWN, 0);
                break;
            case 'ArrowLeft':
            case 'a':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_LEFT, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.camera.handleInputAction(types_1.InputAction.MOVE_CAMERA_RIGHT, 0);
                break;
        }
    };
    /**
     * Handle mouse wheel for zooming
     */
    SimpleCameraTest.prototype.handleWheel = function (event) {
        // Don't call preventDefault() - wheel events are passive by default
        // Ensure the view exists
        var view = this.app.view;
        if (!view)
            return;
        // Get the bounding rectangle and explicitly type it as a DOMRect
        var rect = view.getBoundingClientRect();
        // Access the coordinates from the properly typed DOMRect
        var mouseX = event.clientX - rect.left;
        var mouseY = event.clientY - rect.top;
        // Zoom factor - smaller value for smoother zooming
        var zoomSpeed = 0.03;
        // Apply zoom - deltaY is positive when scrolling down/away (zoom out)
        this.camera.zoomAtPosition(event.deltaY > 0 ? zoomSpeed : -zoomSpeed, mouseX, mouseY, rect.width, rect.height);
    };
    /**
     * Handle mouse button press
     */
    SimpleCameraTest.prototype.handleMouseDown = function (event) {
        if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse button or Alt+Left click
            this.isDragging = true;
            document.body.style.cursor = 'grabbing';
            this.camera.startDrag(event.clientX, event.clientY);
            // Prevent focus changes and text selection during drag
            event.preventDefault();
        }
    };
    /**
     * Handle mouse movement
     */
    SimpleCameraTest.prototype.handleMouseMove = function (event) {
        if (this.isDragging) {
            this.camera.continueDrag(event.clientX, event.clientY);
        }
    };
    /**
     * Handle mouse button release
     */
    SimpleCameraTest.prototype.handleMouseUp = function (event) {
        if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse button or Alt+Left click
            this.isDragging = false;
            document.body.style.cursor = 'default';
            this.camera.endDrag();
        }
    };
    return SimpleCameraTest;
}());
// Initialize the test when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    try {
        new SimpleCameraTest();
    }
    catch (error) {
        console.error('Failed to initialize camera test:', error);
    }
});
