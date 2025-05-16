// Import required libraries
import * as PIXI from 'pixi.js';
import { CameraController, CameraEventType } from './src/game/core/input/CameraController';
import { InputAction } from './src/game/core/input/types';
import { eventEmitter } from './src/game/core/ecs/EventEmitter';

// Class to manage our test application
class CameraSystemTest {
    constructor() {
        this.container = document.getElementById('game-container');
        this.statsElement = document.getElementById('stats');
        this.isStatsVisible = true;
        this.selectedEntity = null;
        this.entities = [];
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = performance.now();
        this.isFollowing = false;
        this.isDragging = false;
        this.dragStartPosition = { x: 0, y: 0 };
        this.mouseDragThreshold = 3;
        this.mousePrevPosition = { x: 0, y: 0 };
        
        // Setup event listeners
        document.getElementById('toggle-stats').addEventListener('click', () => this.toggleStats());
        document.getElementById('shake-camera').addEventListener('click', () => this.shakeCamera());
        document.getElementById('animate-camera').addEventListener('click', () => this.animateCamera());
        document.getElementById('toggle-momentum').addEventListener('click', () => this.toggleMomentum());
        document.getElementById('toggle-edge-scroll').addEventListener('click', () => this.toggleEdgeScrolling());
        document.getElementById('reset-camera').addEventListener('click', () => this.resetCamera());
        
        // Initialize the test
        this.initialize();
    }
    
    async initialize() {
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
            this.container.appendChild(this.app.view);
            
            // Setup camera controller
            this.cameraController = new CameraController();
            
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
            
            // Enable edge scrolling
            this.cameraController.setEdgeScrollingEnabled(true);
            this.cameraController.configureEdgeScrolling(20, 3.0);
            
            // Start update loop
            this.app.ticker.add(() => this.update());
            
            // Setup stats update
            setInterval(() => this.updateStats(), 500);
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            console.log('Camera System Test initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Camera System Test:', error);
            this.statsElement.innerHTML = `Error: ${error.message}`;
        }
    }
    
    createHexGrid() {
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
    
    createEntities() {
        // Create some entities spread around the world
        for (let i = 0; i < 20; i++) {
            // Create entity
            const entity = {
                id: i + 1,
                position: {
                    x: (Math.random() * 2000) - 1000,
                    y: (Math.random() * 2000) - 1000
                },
                velocity: {
                    x: (Math.random() - 0.5) * 50,
                    y: (Math.random() - 0.5) * 50
                },
                sprite: null,
                element: document.createElement('div')
            };
            
            // Setup DOM element
            entity.element.className = 'entity';
            entity.element.textContent = entity.id;
            entity.element.style.left = '0px';
            entity.element.style.top = '0px';
            entity.element.addEventListener('click', () => this.selectEntity(entity));
            this.container.appendChild(entity.element);
            
            // Add to entities list
            this.entities.push(entity);
            
            // Add entity to PIXI
            const sprite = new PIXI.Graphics();
            sprite.beginFill(0xff0000);
            sprite.drawCircle(0, 0, 16);
            sprite.endFill();
            sprite.alpha = 0.5; // Make PIXI sprite transparent
            
            entity.sprite = sprite;
            this.worldContainer.addChild(sprite);
        }
    }
    
    setupInput() {
        // Keyboard input
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse wheel for zoom
        window.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Mouse drag for camera movement
        this.app.view.addEventListener('mousedown', this.handleMouseDown.bind(this));
        window.addEventListener('mousemove', this.handleMouseMove.bind(this));
        window.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Double click detection
        this.lastClickTime = 0;
        this.app.view.addEventListener('click', this.handleClick.bind(this));
        
        // Mouse position tracking for edge scrolling
        window.addEventListener('mousemove', this.trackMousePosition.bind(this));
    }
    
    setupEventListeners() {
        // Listen for camera events
        eventEmitter.on(CameraEventType.MOVED, (state) => {
            // Could use this to update UI based on camera movement
        });
        
        eventEmitter.on(CameraEventType.ANIMATION_START, (data) => {
            console.log('Camera animation started', data);
        });
        
        eventEmitter.on(CameraEventType.ANIMATION_END, (state) => {
            console.log('Camera animation ended', state);
        });
    }
    
    update() {
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
        this.worldContainer.rotation = -cameraState.rotation; // Invert rotation for camera effect
        
        // Update entities
        this.updateEntities(deltaTime);
        
        // Update entity DOM elements positions
        this.updateEntityPositions();
    }
    
    updateEntities(deltaTime) {
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
                this.cameraController.followPosition(entity.position, 0.1, entity.velocity);
            }
        }
    }
    
    updateEntityPositions() {
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
    
    updateStats() {
        if (!this.isStatsVisible) return;
        
        const cameraState = this.cameraController.getState();
        
        this.statsElement.innerHTML = `
            FPS: ${this.fps}<br>
            Camera Position: (${cameraState.position.x.toFixed(1)}, ${cameraState.position.y.toFixed(1)})<br>
            Camera Zoom: ${cameraState.zoom.toFixed(2)}<br>
            Camera Rotation: ${(cameraState.rotation * 180 / Math.PI).toFixed(1)}°<br>
            Camera Velocity: (${cameraState.velocity.x.toFixed(2)}, ${cameraState.velocity.y.toFixed(2)})<br>
            Momentum: ${this.cameraController.isMomentumEnabled() ? 'Enabled' : 'Disabled'}<br>
            Edge Scrolling: ${this.cameraController.isEdgeScrollingEnabled() ? 'Enabled' : 'Disabled'}<br>
            Following: ${this.isFollowing ? `Entity #${this.selectedEntity.id}` : 'None'}<br>
            Selected: ${this.selectedEntity ? `Entity #${this.selectedEntity.id}` : 'None'}
        `;
    }
    
    handleResize() {
        // Update PixiJS renderer size
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
    }
    
    toggleStats() {
        this.isStatsVisible = !this.isStatsVisible;
        this.statsElement.style.display = this.isStatsVisible ? 'block' : 'none';
    }
    
    selectEntity(entity) {
        // Deselect current entity if selecting the same one
        if (this.selectedEntity === entity) {
            this.selectedEntity = null;
            this.isFollowing = false;
            return;
        }
        
        // Select new entity
        this.selectedEntity = entity;
        
        // Update UI
        this.updateEntityPositions();
    }
    
    shakeCamera() {
        // Apply a camera shake effect
        this.cameraController.shake(15, 0.5, 0.2);
    }
    
    animateCamera() {
        // Animate camera to a random position
        const targetX = (Math.random() * 2000) - 1000;
        const targetY = (Math.random() * 2000) - 1000;
        
        this.cameraController.animateTo({
            position: { x: targetX, y: targetY },
            zoom: 0.5 + Math.random() * 1.5,
            duration: 1.5,
            easing: 'easeInOutQuad'
        });
    }
    
    toggleMomentum() {
        const currentState = this.cameraController.isMomentumEnabled();
        this.cameraController.setMomentumEnabled(!currentState);
    }
    
    toggleEdgeScrolling() {
        const currentState = this.cameraController.isEdgeScrollingEnabled();
        this.cameraController.setEdgeScrollingEnabled(!currentState);
    }
    
    resetCamera() {
        // Reset camera to origin position with default zoom
        this.cameraController.resetToDefaults();
        this.isFollowing = false;
    }
    
    handleKeyDown(event) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.cameraController.setInputState(InputAction.MOVE_UP, true);
                break;
            case 'ArrowDown':
            case 's':
                this.cameraController.setInputState(InputAction.MOVE_DOWN, true);
                break;
            case 'ArrowLeft':
            case 'a':
                this.cameraController.setInputState(InputAction.MOVE_LEFT, true);
                break;
            case 'ArrowRight':
            case 'd':
                this.cameraController.setInputState(InputAction.MOVE_RIGHT, true);
                break;
            case 'f':
                // Toggle following selected entity
                if (this.selectedEntity) {
                    this.isFollowing = !this.isFollowing;
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
    
    handleKeyUp(event) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                this.cameraController.setInputState(InputAction.MOVE_UP, false);
                break;
            case 'ArrowDown':
            case 's':
                this.cameraController.setInputState(InputAction.MOVE_DOWN, false);
                break;
            case 'ArrowLeft':
            case 'a':
                this.cameraController.setInputState(InputAction.MOVE_LEFT, false);
                break;
            case 'ArrowRight':
            case 'd':
                this.cameraController.setInputState(InputAction.MOVE_RIGHT, false);
                break;
        }
    }
    
    handleWheel(event) {
        // Prevent default scrolling behavior
        event.preventDefault();
        
        // Calculate zoom factor based on wheel delta
        const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
        
        // Get mouse position relative to canvas
        const rect = this.app.view.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Zoom at mouse position
        this.cameraController.zoomAtPoint(zoomFactor, { x: mouseX, y: mouseY });
    }
    
    handleMouseDown(event) {
        // Only proceed with middle mouse button (button 1)
        if (event.button !== 1) return;
        
        this.isDragging = true;
        this.dragStartPosition = { x: event.clientX, y: event.clientY };
        this.mousePrevPosition = { x: event.clientX, y: event.clientY };
        
        // Change cursor
        document.body.style.cursor = 'grabbing';
    }
    
    handleMouseMove(event) {
        if (!this.isDragging) return;
        
        // Calculate mouse movement since last position
        const deltaX = event.clientX - this.mousePrevPosition.x;
        const deltaY = event.clientY - this.mousePrevPosition.y;
        
        // Calculate mouse movement since drag start (for threshold)
        const totalDeltaX = event.clientX - this.dragStartPosition.x;
        const totalDeltaY = event.clientY - this.dragStartPosition.y;
        
        // Store current position for next delta calculation
        this.mousePrevPosition = { x: event.clientX, y: event.clientY };
        
        // Check if we've moved past the threshold
        if (Math.abs(totalDeltaX) > this.mouseDragThreshold || 
            Math.abs(totalDeltaY) > this.mouseDragThreshold) {
            
            // Apply the movement to the camera (inversed and scaled by zoom)
            const cameraState = this.cameraController.getState();
            this.cameraController.dragByAmount(deltaX * cameraState.zoom, deltaY * cameraState.zoom);
        }
    }
    
    handleMouseUp(event) {
        if (event.button !== 1) return;
        
        this.isDragging = false;
        document.body.style.cursor = 'default';
    }
    
    trackMousePosition(event) {
        // Track mouse position for edge scrolling
        const rect = this.app.view.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.cameraController.updateMousePosition(x, y);
    }
    
    handleClick(event) {
        // Handle double click
        const now = performance.now();
        const timeSinceLastClick = now - this.lastClickTime;
        
        if (timeSinceLastClick < 300) { // Double click detected
            // Get click position in world coordinates
            const rect = this.app.view.getBoundingClientRect();
            const cameraState = this.cameraController.getState();
            
            const worldX = (event.clientX - rect.left - rect.width / 2) * cameraState.zoom + cameraState.position.x;
            const worldY = (event.clientY - rect.top - rect.height / 2) * cameraState.zoom + cameraState.position.y;
            
            // Animate to clicked position
            this.cameraController.animateTo({
                position: { x: worldX, y: worldY },
                duration: 0.5,
                easing: 'easeOutQuad'
            });
        }
        
        this.lastClickTime = now;
    }
}

// Initialize the test when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CameraSystemTest();
});
