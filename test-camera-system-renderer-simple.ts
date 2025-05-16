/**
 * Simplified Camera System Test for TerraFlux
 * 
 * A streamlined version focused on core camera functionality
 */

import * as PIXI from 'pixi.js';
import { CameraController, CameraEventType } from './src/game/core/input/CameraController';
import { InputAction } from './src/game/core/input/types';
import { eventEmitter } from './src/game/core/ecs/EventEmitter';

/**
 * Simplified Camera Test Class
 */
class SimpleCameraTest {
    // Core elements
    private app: PIXI.Application;
    private worldContainer: PIXI.Container;
    private camera: CameraController;
    
    // Stats tracking
    private stats: HTMLElement | null;
    private frameCount = 0;
    private fps = 0;
    private lastTime = 0;
    
    // Internal state
    private isDragging = false;
    private momentumEnabled = true;
    private edgeScrollEnabled = true;
    
    constructor() {
        // Set up the PIXI application
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a2e,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        document.getElementById('game-container')?.appendChild(this.app.view as any);
        
        // Create camera controller
        this.camera = new CameraController({ position: { x: 0, y: 0 }, zoom: 1 });
        
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
        setInterval(() => this.updateStats(), 500);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
        });
        
        console.log('Camera test initialized');
    }
    
    /**
     * Create visual elements for the scene
     */
    createScene(): void {
        // Create a grid for reference
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, 0x444444);
        
        // Draw grid lines
        for (let x = -1000; x <= 1000; x += 100) {
            grid.moveTo(x, -1000);
            grid.lineTo(x, 1000);
        }
        
        for (let y = -1000; y <= 1000; y += 100) {
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
        const origin = new PIXI.Graphics();
        origin.beginFill(0xff0000);
        origin.drawCircle(0, 0, 10);
        origin.endFill();
        this.worldContainer.addChild(origin);
        
        // Create some test objects
        for (let i = 0; i < 10; i++) {
            const obj = new PIXI.Graphics();
            obj.beginFill(0x00aaff);
            obj.drawRect(-25, -25, 50, 50);
            obj.endFill();
            obj.x = (Math.random() * 1600) - 800;
            obj.y = (Math.random() * 1600) - 800;
            obj.rotation = Math.random() * Math.PI * 2;
            this.worldContainer.addChild(obj);
        }
    }
    
    /**
     * Set up input handlers
     */
    setupInputHandlers(): void {
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
    }
    
    /**
     * Handle double click for camera centering
     */
    handleDoubleClick(event: MouseEvent): void {
        // Convert screen coordinates to world coordinates
        const view = this.app.view as unknown as HTMLCanvasElement;
        if (!view) return;
        
        const rect = view.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Calculate world position
        const worldX = this.camera.getState().position.x + (mouseX - this.app.renderer.width / 2) * this.camera.getState().zoom;
        const worldY = this.camera.getState().position.y + (mouseY - this.app.renderer.height / 2) * this.camera.getState().zoom;
        
        // Animate camera to center on the clicked point
        this.camera.animateTo({
            position: { x: worldX, y: worldY },
            zoom: this.camera.getState().zoom
        }, {
            duration: 500,
            easing: 'easeOut'
        });
    }
    
    /**
     * Set up button listeners
     */
    setupButtonListeners(): void {
        document.getElementById('shake-camera')?.addEventListener('click', () => {
            this.camera.shake({
                intensity: 15,
                duration: 500,
                falloff: 'exponential',
                frequency: 0.2
            });
        });
        
        document.getElementById('animate-camera')?.addEventListener('click', () => {
            const targetX = (Math.random() * 1600) - 800;
            const targetY = (Math.random() * 1600) - 800;
            
            this.camera.animateTo({
                position: { x: targetX, y: targetY },
                zoom: 0.5 + Math.random() * 1.5
            }, {
                duration: 1500,
                easing: 'easeInOut'
            });
        });
        
        document.getElementById('toggle-momentum')?.addEventListener('click', () => {
            this.momentumEnabled = !this.momentumEnabled;
            this.camera.setMomentumEnabled(this.momentumEnabled);
        });
        
        document.getElementById('toggle-edge-scroll')?.addEventListener('click', () => {
            this.edgeScrollEnabled = !this.edgeScrollEnabled;
            this.camera.setEdgeScrollingEnabled(this.edgeScrollEnabled);
        });
        
        document.getElementById('reset-camera')?.addEventListener('click', () => {
            this.camera.moveTo(0, 0, true);
            this.camera.setZoom(1, true);
        });
    }
    
    /**
     * Main update loop
     */
    update(delta: number): void {
        // Update time stats
        const now = performance.now();
        this.frameCount++;
        
        if (now - this.lastTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }
        
        // Convert PIXI delta (usually around 1/60) to seconds
        const deltaTime = delta / 60;
        
        // Update camera
        this.camera.update(deltaTime);
        
        // Apply camera transform to world
        const cameraState = this.camera.getState();
        
        // Apply camera transformations to the world container
        // Position needs to be inverted for the "camera" effect
        this.worldContainer.x = this.app.renderer.width / 2 - cameraState.position.x;
        this.worldContainer.y = this.app.renderer.height / 2 - cameraState.position.y;
        this.worldContainer.scale.set(1 / cameraState.zoom);
        if (cameraState.rotation !== undefined) {
            this.worldContainer.rotation = -cameraState.rotation;
        }
    }
    
    /**
     * Update stats display
     */
    updateStats(): void {
        if (!this.stats) return;
        
        const cameraState = this.camera.getState();
        
        this.stats.innerHTML = `
            FPS: ${this.fps}<br>
            Position: (${cameraState.position.x.toFixed(1)}, ${cameraState.position.y.toFixed(1)})<br>
            Zoom: ${cameraState.zoom.toFixed(2)}<br>
            Momentum: ${this.momentumEnabled ? 'On' : 'Off'}<br>
            Edge scrolling: ${this.edgeScrollEnabled ? 'On' : 'Off'}
        `;
    }
    
    /**
     * Handle keyboard key press
     */
    handleKeyDown(event: KeyboardEvent): void {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_UP, 1);
                break;
            case 'ArrowDown':
            case 's':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_DOWN, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_LEFT, 1);
                break;
            case 'ArrowRight':
            case 'd':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_RIGHT, 1);
                break;
            case ' ':
                this.momentumEnabled = !this.momentumEnabled;
                this.camera.setMomentumEnabled(this.momentumEnabled);
                break;
        }
    }
    
    /**
     * Handle keyboard key release
     */
    handleKeyUp(event: KeyboardEvent): void {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_UP, 0);
                break;
            case 'ArrowDown':
            case 's':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_DOWN, 0);
                break;
            case 'ArrowLeft':
            case 'a':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_LEFT, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.camera.handleInputAction(InputAction.MOVE_CAMERA_RIGHT, 0);
                break;
        }
    }
    
    /**
     * Handle mouse wheel for zooming
     */
    handleWheel(event: WheelEvent): void {
        // Don't call preventDefault() - wheel events are passive by default
        
        // Ensure the view exists
        const view = this.app.view as unknown as HTMLCanvasElement;
        if (!view) return;
        
        // Get the bounding rectangle and explicitly type it as a DOMRect
        const rect = view.getBoundingClientRect() as DOMRect;
        
        // Access the coordinates from the properly typed DOMRect
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Zoom factor - smaller value for smoother zooming
        const zoomSpeed = 0.03;
        
        // Apply zoom - deltaY is positive when scrolling down/away (zoom out)
        this.camera.zoomAtPosition(
            event.deltaY > 0 ? zoomSpeed : -zoomSpeed,
            mouseX, mouseY,
            rect.width, rect.height
        );
    }
    
    /**
     * Handle mouse button press
     */
    handleMouseDown(event: MouseEvent): void {
        if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse button or Alt+Left click
            this.isDragging = true;
            document.body.style.cursor = 'grabbing';
            this.camera.startDrag(event.clientX, event.clientY);
            
            // Prevent focus changes and text selection during drag
            event.preventDefault();
        }
    }
    
    /**
     * Handle mouse movement
     */
    handleMouseMove(event: MouseEvent): void {
        if (this.isDragging) {
            this.camera.continueDrag(event.clientX, event.clientY);
        }
    }
    
    /**
     * Handle mouse button release
     */
    handleMouseUp(event: MouseEvent): void {
        if (event.button === 1 || (event.button === 0 && event.altKey)) { // Middle mouse button or Alt+Left click
            this.isDragging = false;
            document.body.style.cursor = 'default';
            this.camera.endDrag();
        }
    }
}

// Initialize the test when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        new SimpleCameraTest();
    } catch (error) {
        console.error('Failed to initialize camera test:', error);
    }
});
