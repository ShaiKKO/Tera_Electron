/**
 * TerraFlux Camera System Test - Renderer Mock
 * 
 * This is a simplified mock implementation of the camera system renderer
 * to demonstrate camera controls without requiring the full TypeScript build
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize PIXI Application
    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
    });
    
    document.getElementById('game-container').appendChild(app.view);
    
    // Create camera state
    const camera = {
        position: { x: 0, y: 0 },
        targetPosition: { x: 0, y: 0 },
        zoom: 1,
        targetZoom: 1,
        velocity: { x: 0, y: 0 },
        isAnimating: false,
        isShaking: false,
        momentumEnabled: true,
        edgeScrollEnabled: true,
        friction: 0.92,
        moveSpeed: 5,
        zoomSpeed: 0.1,
        smoothing: 0.15,
        followTarget: null
    };
    
    // Create containers for world elements
    const worldContainer = new PIXI.Container();
    app.stage.addChild(worldContainer);
    
    // Create grid
    const gridContainer = new PIXI.Container();
    worldContainer.addChild(gridContainer);
    
    const gridSize = 50;
    const gridWidth = 100;
    const gridHeight = 100;
    
    const grid = new PIXI.Graphics();
    gridContainer.addChild(grid);
    
    function drawGrid() {
        grid.clear();
        grid.lineStyle(1, 0x333355, 0.5);
        
        // Draw horizontal lines
        for (let y = -gridHeight / 2; y <= gridHeight / 2; y++) {
            grid.moveTo(-gridWidth * gridSize / 2, y * gridSize);
            grid.lineTo(gridWidth * gridSize / 2, y * gridSize);
        }
        
        // Draw vertical lines
        for (let x = -gridWidth / 2; x <= gridWidth / 2; x++) {
            grid.moveTo(x * gridSize, -gridHeight * gridSize / 2);
            grid.lineTo(x * gridSize, gridHeight * gridSize / 2);
        }
        
        // Draw axes with different color
        grid.lineStyle(2, 0x5555aa, 0.8);
        grid.moveTo(-gridWidth * gridSize / 2, 0);
        grid.lineTo(gridWidth * gridSize / 2, 0);
        grid.moveTo(0, -gridHeight * gridSize / 2);
        grid.lineTo(0, gridHeight * gridSize / 2);
    }
    
    drawGrid();
    
    // Create entities
    const entities = [];
    const entityContainer = new PIXI.Container();
    worldContainer.addChild(entityContainer);
    
    function createEntity(x, y, id) {
        const entity = {
            id,
            position: { x, y },
            velocity: { 
                x: Math.random() * 2 - 1, 
                y: Math.random() * 2 - 1 
            },
            sprite: new PIXI.Graphics(),
            selected: false
        };
        
        // Draw entity
        entity.sprite.beginFill(0xff0000);
        entity.sprite.drawCircle(0, 0, 16);
        entity.sprite.endFill();
        
        // Add text label
        const text = new PIXI.Text(`${id}`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xffffff
        });
        text.anchor.set(0.5);
        entity.sprite.addChild(text);
        
        // Add to container
        entityContainer.addChild(entity.sprite);
        
        // Add click handler
        entity.sprite.eventMode = 'static';
        entity.sprite.cursor = 'pointer';
        entity.sprite.on('pointerdown', () => selectEntity(entity));
        
        return entity;
    }
    
    // Create some random entities
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() * gridWidth - gridWidth/2) * gridSize;
        const y = (Math.random() * gridHeight - gridHeight/2) * gridSize;
        entities.push(createEntity(x, y, i + 1));
    }
    
    let selectedEntity = null;
    
    function selectEntity(entity) {
        // Deselect current entity
        if (selectedEntity) {
            selectedEntity.selected = false;
            selectedEntity.sprite.tint = 0xffffff;
        }
        
        // Select new entity
        selectedEntity = entity;
        if (selectedEntity) {
            selectedEntity.selected = true;
            selectedEntity.sprite.tint = 0x00ff00;
        }
        
        updateStats();
    }
    
    // Apply camera transform to world
    function updateCamera() {
        // Update camera position with physics
        if (camera.momentumEnabled) {
            // Apply friction
            camera.velocity.x *= camera.friction;
            camera.velocity.y *= camera.friction;
            
            // Apply velocity to target position
            if (Math.abs(camera.velocity.x) > 0.01 || Math.abs(camera.velocity.y) > 0.01) {
                camera.targetPosition.x += camera.velocity.x;
                camera.targetPosition.y += camera.velocity.y;
            } else {
                camera.velocity.x = 0;
                camera.velocity.y = 0;
            }
        }
        
        // Follow target if set
        if (camera.followTarget) {
            camera.targetPosition.x = camera.followTarget.position.x;
            camera.targetPosition.y = camera.followTarget.position.y;
        }
        
        // Smooth camera movement
        camera.position.x += (camera.targetPosition.x - camera.position.x) * camera.smoothing;
        camera.position.y += (camera.targetPosition.y - camera.position.y) * camera.smoothing;
        camera.zoom += (camera.targetZoom - camera.zoom) * camera.smoothing;
        
        // Apply camera transform to world container
        worldContainer.scale.set(1 / camera.zoom);
        worldContainer.position.x = app.screen.width / 2 - camera.position.x / camera.zoom;
        worldContainer.position.y = app.screen.height / 2 - camera.position.y / camera.zoom;
    }
    
    // Update entity positions
    function updateEntities(delta) {
        entities.forEach(entity => {
            // Move entities slowly
            entity.position.x += entity.velocity.x * delta;
            entity.position.y += entity.velocity.y * delta;
            
            // Bounce at boundaries
            const bounds = gridSize * gridWidth / 2;
            if (Math.abs(entity.position.x) > bounds) {
                entity.velocity.x *= -1;
                entity.position.x = Math.sign(entity.position.x) * bounds;
            }
            
            if (Math.abs(entity.position.y) > bounds) {
                entity.velocity.y *= -1;
                entity.position.y = Math.sign(entity.position.y) * bounds;
            }
            
            // Update sprite position
            entity.sprite.position.x = entity.position.x;
            entity.sprite.position.y = entity.position.y;
        });
    }
    
    // Update stats display
    function updateStats() {
        const stats = document.getElementById('stats');
        
        let html = `
            <strong>Camera Position:</strong> (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)})<br>
            <strong>Camera Zoom:</strong> ${camera.zoom.toFixed(2)}x<br>
            <strong>Camera Velocity:</strong> (${camera.velocity.x.toFixed(2)}, ${camera.velocity.y.toFixed(2)})<br>
            <strong>Momentum:</strong> ${camera.momentumEnabled ? 'Enabled' : 'Disabled'}<br>
            <strong>Edge Scrolling:</strong> ${camera.edgeScrollEnabled ? 'Enabled' : 'Disabled'}<br>
        `;
        
        if (selectedEntity) {
            html += `
                <br><strong>Selected Entity:</strong> #${selectedEntity.id}<br>
                <strong>Entity Position:</strong> (${selectedEntity.position.x.toFixed(1)}, ${selectedEntity.position.y.toFixed(1)})<br>
                <strong>Entity Velocity:</strong> (${selectedEntity.velocity.x.toFixed(2)}, ${selectedEntity.velocity.y.toFixed(2)})<br>
                <strong>Following:</strong> ${camera.followTarget === selectedEntity ? 'Yes' : 'No'}<br>
            `;
        }
        
        stats.innerHTML = html;
    }
    
    // Input handling
    const keys = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    
    window.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'w':
            case 'ArrowUp':
                keys.up = true;
                break;
            case 's':
            case 'ArrowDown':
                keys.down = true;
                break;
            case 'a':
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'd':
            case 'ArrowRight':
                keys.right = true;
                break;
            case 'f':
                // Follow selected entity
                if (selectedEntity) {
                    camera.followTarget = camera.followTarget === selectedEntity ? null : selectedEntity;
                    updateStats();
                }
                break;
            case ' ':
                // Toggle momentum
                camera.momentumEnabled = !camera.momentumEnabled;
                updateStats();
                break;
            case 'e':
                // Toggle edge scrolling
                camera.edgeScrollEnabled = !camera.edgeScrollEnabled;
                updateStats();
                break;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        switch (e.key) {
            case 'w':
            case 'ArrowUp':
                keys.up = false;
                break;
            case 's':
            case 'ArrowDown':
                keys.down = false;
                break;
            case 'a':
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'd':
            case 'ArrowRight':
                keys.right = false;
                break;
        }
    });
    
    // Mouse handling
    let dragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastClickTime = 0;
    
    app.view.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // Middle mouse button
            dragging = true;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            e.preventDefault();
        }
    });
    
    app.view.addEventListener('mousemove', (e) => {
        if (dragging) {
            const dx = e.clientX - lastMouseX;
            const dy = e.clientY - lastMouseY;
            
            camera.targetPosition.x -= dx * camera.zoom;
            camera.targetPosition.y -= dy * camera.zoom;
            
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
        
        // Edge scrolling
        if (camera.edgeScrollEnabled && !dragging) {
            const edgeSize = 20;
            const edgeSpeed = 4;
            
            if (e.clientX < edgeSize) {
                camera.velocity.x -= edgeSpeed * (1 - e.clientX / edgeSize);
            } else if (e.clientX > window.innerWidth - edgeSize) {
                camera.velocity.x += edgeSpeed * (1 - (window.innerWidth - e.clientX) / edgeSize);
            }
            
            if (e.clientY < edgeSize) {
                camera.velocity.y -= edgeSpeed * (1 - e.clientY / edgeSize);
            } else if (e.clientY > window.innerHeight - edgeSize) {
                camera.velocity.y += edgeSpeed * (1 - (window.innerHeight - e.clientY) / edgeSize);
            }
        }
    });
    
    window.addEventListener('mouseup', (e) => {
        if (e.button === 1) { // Middle mouse button
            dragging = false;
        }
    });
    
    app.view.addEventListener('click', (e) => {
        const now = Date.now();
        const doubleClickTime = 300;
        
        if (now - lastClickTime < doubleClickTime) {
            // Double click - center on point
            const worldX = (e.clientX - app.screen.width / 2) * camera.zoom + camera.position.x;
            const worldY = (e.clientY - app.screen.height / 2) * camera.zoom + camera.position.y;
            
            // Animate to position
            animateCamera({
                position: { x: worldX, y: worldY }
            });
        }
        
        lastClickTime = now;
    });
    
    app.view.addEventListener('wheel', (e) => {
        // Zoom at mouse position
        const worldX = (e.clientX - app.screen.width / 2) * camera.zoom + camera.position.x;
        const worldY = (e.clientY - app.screen.height / 2) * camera.zoom + camera.position.y;
        
        // Apply zoom
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const oldZoom = camera.targetZoom;
        camera.targetZoom = Math.max(0.25, Math.min(4, camera.targetZoom * zoomFactor));
        
        // Adjust position to keep mouse point in same place
        if (oldZoom !== camera.targetZoom) {
            const newWorldX = (e.clientX - app.screen.width / 2) * camera.targetZoom + camera.position.x;
            const newWorldY = (e.clientY - app.screen.height / 2) * camera.targetZoom + camera.position.y;
            
            camera.targetPosition.x += (worldX - newWorldX) * (camera.targetZoom / oldZoom);
            camera.targetPosition.y += (worldY - newWorldY) * (camera.targetZoom / oldZoom);
        }
        
        e.preventDefault();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    });
    
    // Button handlers
    document.getElementById('toggle-stats').addEventListener('click', () => {
        const stats = document.getElementById('stats');
        stats.style.display = stats.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('shake-camera').addEventListener('click', () => {
        shakeCamera();
    });
    
    document.getElementById('animate-camera').addEventListener('click', () => {
        // Animate to a random position
        const x = (Math.random() * gridWidth - gridWidth/2) * gridSize;
        const y = (Math.random() * gridHeight - gridHeight/2) * gridSize;
        const zoom = 0.5 + Math.random() * 1.5;
        
        animateCamera({
            position: { x, y },
            zoom: zoom
        });
    });
    
    document.getElementById('toggle-momentum').addEventListener('click', () => {
        camera.momentumEnabled = !camera.momentumEnabled;
        updateStats();
    });
    
    document.getElementById('toggle-edge-scroll').addEventListener('click', () => {
        camera.edgeScrollEnabled = !camera.edgeScrollEnabled;
        updateStats();
    });
    
    document.getElementById('reset-camera').addEventListener('click', () => {
        camera.targetPosition.x = 0;
        camera.targetPosition.y = 0;
        camera.targetZoom = 1;
        camera.velocity.x = 0;
        camera.velocity.y = 0;
        camera.followTarget = null;
        
        selectEntity(null);
    });
    
    // Animation functionality
    let animationFrame = 0;
    let animationStart = null;
    let animationEnd = null;
    let animationProgress = 0;
    let animationDuration = 0;
    
    function animateCamera(targetState, duration = 1000) {
        // Stop following during animation
        const oldFollowTarget = camera.followTarget;
        camera.followTarget = null;
        
        // Store start state
        animationStart = {
            position: { x: camera.position.x, y: camera.position.y },
            zoom: camera.zoom
        };
        
        // Create end state
        animationEnd = {
            position: targetState.position || { x: camera.position.x, y: camera.position.y },
            zoom: targetState.zoom !== undefined ? targetState.zoom : camera.zoom
        };
        
        // Setup animation
        animationFrame = 0;
        animationProgress = 0;
        animationDuration = duration;
        
        camera.isAnimating = true;
        
        // Set a timeout to resume following after animation
        if (oldFollowTarget) {
            setTimeout(() => {
                if (!camera.isAnimating) {
                    camera.followTarget = oldFollowTarget;
                }
            }, duration + 100);
        }
    }
    
    function updateAnimation(delta) {
        if (!camera.isAnimating) return;
        
        animationFrame += delta;
        animationProgress = Math.min(1, animationFrame / animationDuration);
        
        // Easing function (ease-out)
        const t = 1 - Math.pow(1 - animationProgress, 3);
        
        // Interpolate between start and end states
        camera.position.x = animationStart.position.x + (animationEnd.position.x - animationStart.position.x) * t;
        camera.position.y = animationStart.position.y + (animationEnd.position.y - animationStart.position.y) * t;
        camera.zoom = animationStart.zoom + (animationEnd.zoom - animationStart.zoom) * t;
        
        // Set target to match current position to prevent smoothing from interfering
        camera.targetPosition.x = camera.position.x;
        camera.targetPosition.y = camera.position.y;
        camera.targetZoom = camera.zoom;
        
        if (animationProgress >= 1) {
            camera.isAnimating = false;
        }
    }
    
    // Camera shake functionality
    let shakeIntensity = 0;
    let shakeDuration = 0;
    let shakeElapsed = 0;
    
    function shakeCamera(intensity = 30, duration = 500) {
        camera.isShaking = true;
        shakeIntensity = intensity;
        shakeDuration = duration;
        shakeElapsed = 0;
    }
    
    function updateShake(delta) {
        if (!camera.isShaking) return;
        
        shakeElapsed += delta * 16.67;  // Convert to milliseconds
        
        if (shakeElapsed >= shakeDuration) {
            camera.isShaking = false;
            return;
        }
        
        // Calculate intensity based on remaining time
        const remainingIntensity = shakeIntensity * (1 - shakeElapsed / shakeDuration);
        
        // Apply random offset
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * remainingIntensity;
        
        camera.position.x += Math.cos(angle) * distance;
        camera.position.y += Math.sin(angle) * distance;
    }
    
    // Main game loop
    let lastTime = 0;
    
    app.ticker.add((delta) => {
        // Handle keyboard input
        const movementSpeed = 10 * delta;
        if (keys.up) {
            if (camera.momentumEnabled) {
                camera.velocity.y -= movementSpeed;
            } else {
                camera.targetPosition.y -= movementSpeed * camera.zoom;
            }
        }
        if (keys.down) {
            if (camera.momentumEnabled) {
                camera.velocity.y += movementSpeed;
            } else {
                camera.targetPosition.y += movementSpeed * camera.zoom;
            }
        }
        if (keys.left) {
            if (camera.momentumEnabled) {
                camera.velocity.x -= movementSpeed;
            } else {
                camera.targetPosition.x -= movementSpeed * camera.zoom;
            }
        }
        if (keys.right) {
            if (camera.momentumEnabled) {
                camera.velocity.x += movementSpeed;
            } else {
                camera.targetPosition.x += movementSpeed * camera.zoom;
            }
        }
        
        // Update animations if active
        updateAnimation(delta);
        
        // Update shake if active
        updateShake(delta);
        
        // Update camera
        updateCamera();
        
        // Update entities
        updateEntities(delta);
        
        // Update stats every few frames
        if (app.ticker.frame % 10 === 0) {
            updateStats();
        }
    });
    
    // Initial stats update
    updateStats();
    
    // Show loading message
    console.log('TerraFlux Camera System Test loaded');
});
