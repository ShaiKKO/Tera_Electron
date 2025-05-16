/**
 * TerraFlux Camera System Test - Renderer
 * 
 * Test application for the camera system using PixiJS for rendering.
 */

import * as PIXI from 'pixi.js';
import { CameraController, CameraEventType, CameraState, CameraAnimationOptions, CameraShakeOptions } from './src/game/core/input/CameraController';
import { InputAction, Coordinate, Vector2 } from './src/game/core/input/types';
import { eventEmitter } from './src/game/core/ecs/EventEmitter';

/**
 * Entity interface for our test
 */
interface TestEntity {
    id: number;
    position: Vector2;
    velocity: Vector2;
    sprite: PIXI.Graphics;
    element: HTMLDivElement;
}

/**
 * Camera System Test class
 */
class CameraSystemTest {
    // DOM elements
    private container: HTMLElement;
    private statsElement: HTMLElement;
    private isStatsVisible: boolean = true;
    
    // PIXI application
    private app!: PIXI.Application;
    private worldContainer!: PIXI.Container;
    private hexGrid!: PIXI.Graphics;
    
    // Camera controller
    private cameraController!: CameraController;
    
    // Entities
    private entities: TestEntity[] = [];
    private selectedEntity: TestEntity | null = null;
    private isFollowing: boolean = false;
    
    // Mouse and input tracking
    private isDragging: boolean = false;
    private dragStartPosition: Vector2 = { x: 0, y: 0 };
    private mousePrevPosition: Vector2 = { x: 0, y: 0 };
    private mouseDragThreshold: number = 3;
    private lastClickTime: number = 0;
    
    // Performance tracking
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fps: number = 0;
    private lastFpsUpdate: number = 0;
    
    // Internal state for feature detection
    private momentumEnabled: boolean = true;
    private edgeScrollingEnabled: boolean = true;
    
    /**
     * Constructor
     */
    constructor() {
        const gameContainer = document.getElementById('game-container');
        const statsElement = document.getElementById('stats');
        
        if (!gameContainer || !statsElement) {
            throw new Error('Required DOM elements not found');
        }
        
        this.container = gameContainer;
        this.statsElement = statsElement;
        
        // Setup button event listeners
        document.getElementById('toggle-stats')?.addEventListener('click', () => this.toggleStats());
        document.getElementById('shake-camera')?.addEventListener('click', () => this.shakeCamera());
        document.getElementById('animate-camera')?.addEventListener('click', () => this.animateCamera());
        document.getElementById('toggle-momentum')?.addEventListener('click', () => this.toggleMomentum());
        document.getElementById('toggle-edge-scroll')?.addEventListener('click', () => this.toggleEdgeScrolling());
        document.getElementById('reset-camera')?.addEventListener('click', () => this.resetCamera());
        
        // Initialize the test
        this.initialize();
    }
    
    /**
     * Initialize the test application
     */
    async initialize(): Promise<void> {
        try {
            // Create PIXI Application
            this.app = new PIXI.Application({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x1a1a2e,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true,
                antialias: true
            });
            
            // Add canvas to the DOM
            const view = this.app.view as unknown as Node;
            this.container.appendChild(view);
            
            // Setup camera controller with initial state
            this.cameraController = new CameraController({
                position: { x: 0, y: 0 },
                zoom: 1.0
            });
            
            // Create main container for all game objects
            this.worldContainer = new PIXI.Container();
            this.app.stage.addChild(this.worldContainer);
            
            // Generate hex grid background
            this.createHexGrid();
            
            // Create entities to interact with
            this.createEntities();
            
            // Setup input handlers
            this.setupInput();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Set up camera bounds based on our world
            this.cameraController.setBounds(-2000, -2000, 2000, 2000);
            
            // Enable momentum by default
            this.cameraController.setMomentumEnabled(true);
            this.momentumEnabled = true;
            
            // Enable edge scrolling
            this.cameraController.setEdgeScrollingEnabled(true);
            this.edgeScrollingEnabled = true;
            this.cameraController.configureEdgeScrolling(20, 3.0);
            
            // Start update loop
            this.app.ticker.add(() => this.update());
            
            // Setup stats update
            setInterval(() => this.updateStats(), 500);
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            console.log('Camera System Test initialized successfully');
            this.lastFrameTime = performance.now();
            this.lastFpsUpdate = performance.now();
        } catch (error) {
            console.error('Failed to initialize Camera System Test:', error);
            this.statsElement.innerHTML = `Error: ${(error as Error).message}`;
        }
    }
    
    /**
     * Create hexagonal grid
     */
    createHexGrid(): void {
        const gridSize = 4000;  // Make the grid 4000x4000 pixels
        
        // Create graphics object
        const graphics = new PIXI.Graphics();
        
        // Draw hex grid
        graphics.lineStyle(1, 0x334466);
        
        const hexRadius = 64;
        const hexHeight = hexRadius * 2;
        const hexWidth = Math.sqrt(3) * hexRadius;
        const verticalOffset = hexHeight * 0.75;
        
        for (let row = -gridSize / verticalOffset; row < gridSize / verticalOffset; row++) {
            const isOddRow = row % 2 === 1;
            const xOffset = isOddRow ? hexWidth / 2 : 0;
            
            for (let col = -gridSize / hexWidth; col < gridSize / hexWidth; col++) {
                const x = col * hexWidth + xOffset;
                const y = row * verticalOffset;
                
                // Draw hexagon
                graphics.moveTo(x + hexWidth / 2, y - hexRadius / 2);
                graphics.lineTo(x + hexWidth, y);
                graphics.lineTo(x + hexWidth, y + hexHeight / 2);
                graphics.lineTo(x + hexWidth / 2, y + hexHeight);
                graphics.lineTo(x, y + hexHeight / 2);
                graphics.lineTo(x, y);
                graphics.lineTo(x + hexWidth / 2, y - hexRadius / 2);
            }
        }
        
        // Add to world container
        this.hexGrid = graphics;
        this.worldContainer.addChild(graphics);
        
        // Draw origin marker
        const originMarker = new PIXI.Graphics();
        originMarker.beginFill(0xff0000);
        originMarker.drawCircle(0, 0, 10);
        originMarker.endFill();
        this.worldContainer.addChild(originMarker);
        
        // Add coordinate axes
        const axes = new PIXI.Graphics();
        axes.lineStyle(2, 0xffffff);
        axes.moveTo(-1000, 0);
        axes.lineTo(1000, 0);
        axes.moveTo(0, -1000);
        axes.lineTo(0, 1000);
        
        // Add axis labels
        const xAxisLabel = new PIXI.Text('X', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        xAxisLabel.position.set(1020, 0);
        xAxisLabel.anchor.set(0, 0.5);
        
        const yAxisLabel = new PIXI.Text('Y', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });
        yAxisLabel.position.set(0, -1020);
        yAxisLabel.anchor.set(0.5, 1);
        
        this.worldContainer.addChild(axes, xAxisLabel, yAxisLabel);
    }
    
    /**
     * Create test entities
     */
    createEntities(): void {
        // Create some entities spread around the world
        for (let i = 0; i < 20; i++) {
            // Create entity
            const entity: TestEntity = {
                id: i + 1,
                position: {
                    x: (Math.random() * 2000) - 1000,
                    y: (Math.random() * 2000) - 1000
                },
                velocity: {
                    x: (Math.random() - 0.5) * 50,
                    y: (Math.random() - 0.5) * 50
                },
                sprite: new PIXI.Graphics(),
                element: document.createElement('div')
            };
            
            // Setup DOM element
            entity.element.className = 'entity';
            entity.element.textContent = entity.id.toString();
            entity.element.style.left = '0px';
            entity.element.style.top = '0px';
            entity.element.addEventListener('click', () => this.selectEntity(entity));
            this.container.appendChild(entity.element);
            
            // Add to entities list
            this.entities.push(entity);
            
            // Create PIXI sprite
            const sprite = entity.sprite;
            sprite.beginFill(0xff0000);
            sprite.drawCircle(0, 0, 16);
            sprite.endFill();
            sprite.alpha = 0.5; // Make PIXI sprite transparent
            
            this.worldContainer.addChild(sprite);
        }
    }
    
    /**
     * Set up input handlers
     */
    setupInput(): void {
        // Keyboard input
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse wheel for zoom
        window.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Mouse drag for camera movement
        const view = this.app.view as HTMLCanvasElement;
        view.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Double click detection
        view.addEventListener('click', this.handleClick.bind(this));
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners(): void {
        // Listen for camera events
        eventEmitter.subscribe(CameraEventType.MOVED, (state: CameraState) => {
            // Could use this to update UI based on camera movement
        });
        
        eventEmitter.subscribe(CameraEventType.ANIMATION_START, (data: any) => {
            console.log('Camera animation started', data);
        });
        
        eventEmitter.subscribe(CameraEventType.ANIMATION_END, (state: CameraState) => {
            console.log('Camera animation ended', state);
        });
    }
    
    /**
     * Main update method called every frame
     */
    update(): void {
        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = now;
        
        // Update frame counter for FPS calculation
        this.frameCount++;
        if (now - this.lastFpsUpdate > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }
        
        // Update camera controller
        this.cameraController.update(deltaTime);
        
        // Apply camera transform to world container
        const cameraState = this.cameraController.getState();
        
        // Apply camera transformations to the world container
        // Position needs to be inverted for the "camera" effect
        this.worldContainer.x = this.app.view.width / 2 - cameraState.position.x;
        this.worldContainer.y = this.app.view.height / 2 - cameraState.position.y;
        this.worldContainer.scale.set(1 / cameraState.zoom);
        if (cameraState.rotation !== undefined) {
            this.worldContainer.rotation = -cameraState.rotation; // Invert rotation for camera effect
        }
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update entity DOM elements positions
        this.updateEntityPositions();
    }
    
    /**
     * Update entity positions and handle boundary collisions
     */
    updateEntities(deltaTime: number): void {
        for (const entity of this.entities) {
            // Update position based on velocity
            entity.position.x += entity.velocity.x * deltaTime;
            entity.position.y += entity.velocity.y * deltaTime;
            
            // Bounce off world boundaries
            if (entity.position.x < -1800 || entity.position.x > 1800) {
                entity.velocity.x *= -1;
                entity.position.x = Math.max(-1800, Math.min(1800, entity.position.x));
            }
            
            if (entity.position.y < -1800 || entity.position.y > 1800) {
                entity.velocity.y *= -1;
                entity.position.y = Math.max(-1800, Math.min(1800, entity.position.y));
            }
            
            // Update PIXI sprite position
            entity.sprite.position.set(entity.position.x, entity.position.y);
            
            // If we're following this entity, update camera position
            if (this.isFollowing && this.selectedEntity === entity) {
                // Target is non-null by this point
                const target = {
                    getPosition: () => this.selectedEntity!.position,
                    getVelocity: () => this.selectedEntity!.velocity
                };
                this.cameraController.follow(target);
            }
        }
    }
    
    /**
     * Update DOM elements that display entities
     */
    updateEntityPositions(): void {
        const cameraState = this.cameraController.getState();
        const canvasRect = this.app.view.getBoundingClientRect();
        
        for (const entity of this.entities) {
            // Convert world position to screen position
            const screenX = (entity.position.x - cameraState.position.x) / cameraState.zoom + canvasRect.width / 2;
            const screenY = (entity.position.y - cameraState.position.y) / cameraState.zoom + canvasRect.height / 2;
            
            // Update DOM element position
            entity.element.style.left = `${screenX - 16}px`;
            entity.element.style.top = `${screenY - 16}px`;
            
            // Check if entity is within view bounds (with margin)
            const margin = 100;
            const isVisible = 
                screenX > -margin && 
                screenX < canvasRect.width + margin && 
                screenY > -margin && 
                screenY < canvasRect.height + margin;
            
            // Show/hide DOM element based on visibility
            entity.element.style.display = isVisible ? 'flex' : 'none';
            
            // Update selected state
            if (this.selectedEntity === entity) {
                entity.element.classList.add('selected');
            } else {
                entity.element.classList.remove('selected');
            }
        }
    }
    
    /**
     * Update stats display
     */
    updateStats(): void {
        if (!this.isStatsVisible) return;
        
        const cameraState = this.cameraController.getState();
        
        this.statsElement.innerHTML = `
            FPS: ${this.fps}<br>
            Camera Position: (${cameraState.position.x.toFixed(1)}, ${cameraState.position.y.toFixed(1)})<br>
            Camera Zoom: ${cameraState.zoom.toFixed(2)}<br>
            Camera Rotation: ${((cameraState.rotation || 0) * 180 / Math.PI).toFixed(1)}°<br>
            Camera Velocity: (${(cameraState.velocity?.x || 0).toFixed(2)}, ${(cameraState.velocity?.y || 0).toFixed(2)})<br>
            Momentum: ${this.momentumEnabled ? 'Enabled' : 'Disabled'}<br>
            Edge Scrolling: ${this.edgeScrollingEnabled ? 'Enabled' : 'Disabled'}<br>
            Following: ${this.isFollowing ? `Entity #${this.selectedEntity?.id}` : 'None'}<br>
            Selected: ${this.selectedEntity ? `Entity #${this.selectedEntity.id}` : 'None'}
        `;
    }
    
    /**
     * Handle window resize
     */
    handleResize(): void {
        // Update PixiJS renderer size
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Toggle stats display
     */
    toggleStats(): void {
        this.isStatsVisible = !this.isStatsVisible;
        this.statsElement.style.display = this.isStatsVisible ? 'block' : 'none';
    }
    
    /**
     * Select an entity
     */
    selectEntity(entity: TestEntity): void {
        // Deselect current entity if selecting the same one
        if (this.selectedEntity === entity) {
            this.selectedEntity = null;
            this.isFollowing = false;
            this.cameraController.stopFollowing();
            return;
        }
        
        // Select new entity
        this.selectedEntity = entity;
        
        // Update UI
        this.updateEntityPositions();
    }
    
    /**
     * Apply camera shake effect
     */
    shakeCamera(): void {
        // Apply a camera shake effect with intensity, duration, and frequency
        const options: CameraShakeOptions = {
            intensity: 15,
            duration: 500,
            falloff: 'exponential',
            frequency: 0.2
        };
        this.cameraController.shake(options);
    }
    
    /**
     * Animate camera to random position
     */
    animateCamera(): void {
        // Animate camera to a random position
        const targetX = (Math.random() * 2000) - 1000;
        const targetY = (Math.random() * 2000) - 1000;
        
        const options: CameraAnimationOptions = {
            duration: 1500,
            easing: 'easeInOut'
        };
        
        this.cameraController.animateTo({
            position: { x: targetX, y: targetY },
            zoom: 0.5 + Math.random() * 1.5
        }, options);
    }
    
    /**
     * Toggle camera momentum
     */
    toggleMomentum(): void {
        // Track the state internally since CameraController doesn't have a getter
        this.momentumEnabled = !this.momentumEnabled;
        this.cameraController.setMomentumEnabled(this.momentumEnabled);
    }
    
    /**
     * Toggle edge scrolling
     */
    toggleEdgeScrolling(): void {
        // Track the state internally since CameraController doesn't have a getter
        this.edgeScrollingEnabled = !this.edgeScrollingEnabled; 
        this.cameraController.setEdgeScrollingEnabled(this.edgeScrollingEnabled);
    }
    
    /**
     * Reset camera to defaults
     */
    resetCamera(): void {
        // Reset camera to origin position with default zoom
        this.cameraController.moveTo(0, 0, true);
        this.cameraController.setZoom(1, true);
        this.isFollowing = false;
        this.cameraController.stopFollowing();
    }
    
    /**
     * Handle keyboard key down events
     */
    handleKeyDown(event: KeyboardEvent): void {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_UP, 1);
                break;
            case 'ArrowDown':
            case 's':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_DOWN, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_LEFT, 1);
                break;
            case 'ArrowRight':
            case 'd':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_RIGHT, 1);
                break;
            case 'f':
                // Toggle following selected entity
                if (this.selectedEntity) {
                    this.isFollowing = !this.isFollowing;
                    if (this.isFollowing) {
                        const target = {
                            getPosition: () => this.selectedEntity!.position,
                            getVelocity: () => this.selectedEntity!.velocity
                        };
                        this.cameraController.follow(target);
                    } else {
                        this.cameraController.stopFollowing();
                    }
                }
                break;
            case ' ':
                // Toggle momentum
                this.toggleMomentum();
                break;
            case 'e':
                // Toggle edge scrolling
                this.toggleEdgeScrolling();
                break;
            case 'r':
                // Reset camera
                this.resetCamera();
                break;
        }
    }
    
    /**
     * Handle keyboard key up events
     */
    handleKeyUp(event: KeyboardEvent): void {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_UP, 0);
                break;
            case 'ArrowDown':
            case 's':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_DOWN, 0);
                break;
            case 'ArrowLeft':
            case 'a':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_LEFT, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.cameraController.handleInputAction(InputAction.MOVE_CAMERA_RIGHT, 0);
                break;
        }
    }
    
    /**
     * Handle mouse wheel events for zooming
     */
    handleWheel(event: WheelEvent): void {
        // Prevent default scrolling behavior
        event.preventDefault();
        
        // Get mouse position relative to canvas
        const rect = this.app.view!.getBoundingClientRect();
        const mouseX = event.clientX - rect.x;
        const mouseY = event.clientY - rect.y;
        
        // Use zoomAtPosition for zooming at the mouse cursor
        const zoomSpeed = 0.1; // Use a constant since getZoomSpeed isn't exposed
        this.cameraController.zoomAtPosition(
            event.deltaY > 0 ? zoomSpeed : -zoomSpeed, 
            mouseX, mouseY, 
            rect.width, rect.height
        );
    }
    
    /**
     * Handle mouse down events
     */
    handleMouseDown(event: MouseEvent): void {
        // Only proceed with middle mouse button (button 1)
        if (event.button !== 1) return;
        
        this.isDragging = true;
        this.dragStartPosition = { x: event.clientX, y: event.clientY };
        this.mousePrevPosition = { x: event.clientX, y: event.clientY };
        
        // Start camera drag
        this.cameraController.startDrag(event.clientX, event.clientY);
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
    }
    
    /**
     * Handle mouse move events
     */
    handleMouseMove(event: MouseEvent): void {
        if (!this.isDragging) return;
        
        // Continue camera drag
        this.cameraController.continueDrag(event.clientX, event.clientY);
        
        // Update previous position
        this.mousePrevPosition = { x: event.clientX, y: event.clientY };
    }
    
    /**
     * Handle mouse up events
     */
    handleMouseUp(event: MouseEvent): void {
        if (event.button !== 1) return;
        
        this.isDragging = false;
        this.cameraController.endDrag();
        document.body.style.cursor = 'default';
    }
    
    /**
     * Handle mouse click events
     */
    handleClick(event: MouseEvent): void {
        // Handle double click
        const now = performance.now();
        const timeSinceLastClick = now - this.lastClickTime;
        
        if (timeSinceLastClick < 300) { // Double click detected
            // Get click position in world coordinates
            const rect = this.app.view!.getBoundingClientRect();
            const cameraState = this.cameraController.getState();
            
            const worldX = (event.clientX - rect.x - rect.width / 2) * cameraState.zoom + cameraState.position.x;
            const worldY = (event.clientY - rect.y - rect.height / 2) * cameraState.zoom + cameraState.position.y;
            
            // Animate to clicked position
            this.cameraController.animateTo({
                position: { x: worldX, y: worldY }
            }, {
                duration: 500,
                easing: 'easeOut'
            });
        }
        
        this.lastClickTime = now;
    }
}

// Initialize the test when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CameraSystemTest();
});
