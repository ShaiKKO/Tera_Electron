// Import required libraries
import * as PIXI from 'pixi.js';
import { renderManager } from './src/game/rendering/RenderManager';
import { textureManager } from './src/game/rendering/TextureManager';
import { RenderLayerType } from './src/game/rendering/types';

// Generate placeholder sprite if no assets available
function generatePlaceholderTexture(color = 0xFF5555, width = 128, height = 128) {
    // Get app renderer for texture generation
    const app = renderManager.getApp();
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color, 1); // Full opacity
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    // Add some visual detail with thicker lines
    graphics.lineStyle(6, 0xFFFFFF, 1);
    graphics.moveTo(0, 0);
    graphics.lineTo(width, height);
    graphics.moveTo(width, 0);
    graphics.lineTo(0, height);
    graphics.drawRect(8, 8, width - 16, height - 16);
    
    // Add a center dot for visibility
    graphics.beginFill(0xFFFFFF);
    graphics.drawCircle(width / 2, height / 2, width / 6);
    graphics.endFill();

    // Use the app's renderer to create the texture
    return app.renderer.generateTexture(graphics);
}

// Generate a hex grid texture with higher visibility
function generateHexGridTexture(color = 0x88AAFF, backgroundColor = 0x1a1a2e, size = 512) {
    // Get app renderer for texture generation
    const app = renderManager.getApp();
    const graphics = new PIXI.Graphics();
    
    // Fill background
    graphics.beginFill(backgroundColor);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Draw hex grid with thicker lines and high visibility
    graphics.lineStyle(4, color, 1);
    
    const hexRadius = 48; // Larger hexes
    const hexHeight = hexRadius * 2;
    const hexWidth = Math.sqrt(3) * hexRadius;
    const verticalOffset = hexHeight * 0.75;
    
    for (let row = -1; row < size / verticalOffset + 1; row++) {
        const isOddRow = row % 2 === 1;
        const xOffset = isOddRow ? hexWidth / 2 : 0;
        
        for (let col = -1; col < size / hexWidth + 1; col++) {
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
            
            // Add center dot for better visibility
            graphics.beginFill(color, 0.5);
            graphics.drawCircle(x + hexWidth / 2, y + hexHeight / 2, 4);
            graphics.endFill();
        }
    }

    // Use the app's renderer to create the texture
    return app.renderer.generateTexture(graphics);
}

// Class to manage our test application
class RenderingTest {
    constructor() {
        this.container = document.getElementById('game-container');
        this.statsElement = document.getElementById('stats');
        this.sprites = [];
        this.isStatsVisible = true;
        this.textures = {};
        
        // Setup event listeners
        document.getElementById('toggle-stats').addEventListener('click', () => this.toggleStats());
        document.getElementById('add-sprites').addEventListener('click', () => this.addSprites(100));
        document.getElementById('toggle-layers').addEventListener('click', () => this.toggleGridLayer());
        document.getElementById('lose-context').addEventListener('click', () => this.simulateContextLoss());
        
        // Initialize the rendering system
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log("Initializing RenderingTest...");
            
            // Initialize the render manager with the container
            await renderManager.initialize(this.container);
            console.log("RenderManager initialized.");
            
            // Set camera to origin to ensure proper view
            renderManager.setCamera(0, 0, 1, 0);
            
            // Enable stats recording
            renderManager.setStatsRecording(true);
            
            console.log("Generating textures...");
            // Generate placeholder textures with larger size and brighter colors
            this.textures.red = generatePlaceholderTexture(0xFF0000, 256, 256);
            this.textures.green = generatePlaceholderTexture(0x00FF00, 256, 256);
            this.textures.blue = generatePlaceholderTexture(0x0000FF, 256, 256);
            this.textures.yellow = generatePlaceholderTexture(0xFFFF00, 256, 256);
            this.textures.hexGrid = generateHexGridTexture(0x88AAFF, 0x1a1a2e, 512);
            console.log("Textures generated successfully:", Object.keys(this.textures));
            
            const { width, height } = renderManager.getDimensions();
            console.log(`Container dimensions: ${width}x${height}`);
            
            // Verify all layers exist and are visible
            console.log("Checking layer setup...");
            const layerManager = renderManager.getLayerManager();
            const allLayerTypes = Object.values(RenderLayerType);
            
            allLayerTypes.forEach(layerType => {
                const layer = layerManager.getLayer(layerType);
                if (layer) {
                    console.log(`Layer ${layerType} exists with z-index ${layer.zIndex}`);
                    if (!layer.visible && layerType !== RenderLayerType.DEBUG) {
                        console.log(`Making layer ${layerType} visible`);
                        renderManager.setLayerVisibility(layerType, true);
                    }
                } else {
                    console.error(`Layer ${layerType} not found!`);
                }
            });
            
            console.log("Creating grid background...");
            // Create a grid with high contrast
            const grid = new PIXI.TilingSprite(
                this.textures.hexGrid,
                width,
                height
            );
            
            // Make grid cover the entire viewport
            grid.x = 0;
            grid.y = 0;
            grid.width = width;
            grid.height = height;
            
            // Ensure grid is added to the grid layer
            if (!renderManager.addToLayer(grid, RenderLayerType.GRID)) {
                console.error("Failed to add grid to layer");
            } else {
                console.log("Grid added successfully to layer:", RenderLayerType.GRID);
            }
            
            // Force grid layer to be visible
            renderManager.setLayerVisibility(RenderLayerType.GRID, true);
            
            // Add some test sprites to different layers with higher visibility
            console.log("Adding sprites...");
            this.addSprites(100);
            
            // Setup stats update listener
            this.setupStatsListener();
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            // Check all layers after setup
            layerManager.getLayers().forEach(layer => {
                if (layer.visible) {
                    console.log(`Layer ${layer.name} is visible with ${layer.children.length} children`);
                }
            });

            // Force rendering update
            renderManager.getApp().ticker.add(() => {
                // This is just to ensure continuous rendering
            });
            
            // Manually trigger a render to ensure everything is displayed
            renderManager.getApp().render();
            
            console.log('PixiJS Integration Test initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PixiJS Integration Test:', error);
            this.statsElement.innerHTML = `Error: ${error.message}`;
        }
    }
    
    setupStatsListener() {
        // Update stats periodically
        setInterval(() => {
            if (!this.isStatsVisible) return;
            
            const stats = renderManager.getStats();
            this.statsElement.innerHTML = `
                FPS: ${stats.fps.toFixed(1)}<br>
                Render Time: ${stats.renderTime.toFixed(2)}ms<br>
                Objects: ${stats.visibleObjects} / ${stats.totalObjects}<br>
                Sprites: ${stats.sprites}<br>
                Draw Calls: ${stats.drawCalls}<br>
                Memory: ${(stats.textureMemory / 1024 / 1024).toFixed(2)} MB<br>
                Sprites Added: ${this.sprites.length}
            `;
        }, 500);
    }
    
    addSprites(count) {
        const { width, height } = renderManager.getDimensions();
        const textureKeys = ['red', 'green', 'blue', 'yellow'];
        const layers = [
            RenderLayerType.ENTITIES_BELOW,
            RenderLayerType.ENTITIES,
            RenderLayerType.ENTITIES_ABOVE
        ];
        
        // Create a container for debug purposes - to verify sprites are being created
        const debugContainer = new PIXI.Container();
        renderManager.getApp().stage.addChild(debugContainer);
        
        console.log("Adding", count, "sprites to view");
        
        for (let i = 0; i < count; i++) {
            // Pick random texture and layer
            const textureKey = textureKeys[Math.floor(Math.random() * textureKeys.length)];
            const texture = this.textures[textureKey];
            const layer = layers[Math.floor(Math.random() * layers.length)];
            
            if (!texture) {
                console.error(`Texture ${textureKey} not found!`, this.textures);
                continue;
            }
            
            // Create sprite with visual debugging indicators
            const sprite = new PIXI.Sprite(texture);
            
            // Add a border to make them more visible
            const border = new PIXI.Graphics();
            border.lineStyle(3, 0xFFFFFF, 1);
            border.drawRect(-texture.width/2, -texture.height/2, texture.width, texture.height);
            sprite.addChild(border);
            
            // Random position but keep within view bounds
            sprite.x = 100 + Math.random() * (width - 200);
            sprite.y = 100 + Math.random() * (height - 200);
            sprite.rotation = Math.random() * Math.PI * 2;
            sprite.scale.set(0.25 + Math.random() * 0.5); // Smaller so more fit on screen
            sprite.alpha = 1.0; // Make sprites fully visible
            sprite.anchor.set(0.5);
            
            // Add directly to stage as well for debugging
            const debugCopy = new PIXI.Sprite(texture);
            debugCopy.x = sprite.x;
            debugCopy.y = sprite.y;
            debugCopy.rotation = sprite.rotation;
            debugCopy.scale.set(sprite.scale.x, sprite.scale.y);
            debugCopy.anchor.set(0.5);
            debugContainer.addChild(debugCopy);
            
            // Add sprite to layer with explicit logging
            console.log(`Adding sprite to layer ${layer}`);
            const success = renderManager.addToLayer(sprite, layer);
            if (!success) {
                console.error(`Failed to add sprite to layer ${layer}`);
            }
            
            // Store reference
            this.sprites.push(sprite);
            
            // Add animation
            this.animateSprite(sprite);
        }
        
        console.log(`Total sprites in array: ${this.sprites.length}`);
        console.log(`Total children in debug container: ${debugContainer.children.length}`);
    }
    
    animateSprite(sprite) {
        // Give each sprite a random movement pattern
        const speedX = (Math.random() - 0.5) * 4; // Double speed for more visible movement
        const speedY = (Math.random() - 0.5) * 4; // Double speed for more visible movement
        const rotationSpeed = (Math.random() - 0.5) * 0.2; // Faster rotation
        
        const animate = () => {
            const { width, height } = renderManager.getDimensions();
            
            // Update position
            sprite.x += speedX;
            sprite.y += speedY;
            sprite.rotation += rotationSpeed;
            
            // Wrap around edges
            if (sprite.x < 0) sprite.x = width;
            if (sprite.x > width) sprite.x = 0;
            if (sprite.y < 0) sprite.y = height;
            if (sprite.y > height) sprite.y = 0;
            
            // Continue animation
            requestAnimationFrame(animate);
        };
        
        // Start animation
        animate();
    }
    
    toggleStats() {
        this.isStatsVisible = !this.isStatsVisible;
        this.statsElement.style.display = this.isStatsVisible ? 'block' : 'none';
    }
    
    toggleGridLayer() {
        // Get the grid layer by its type
        const gridLayer = renderManager.getLayerManager().getLayer(RenderLayerType.GRID);
        if (gridLayer) {
            // Toggle visibility and log the change
            gridLayer.visible = !gridLayer.visible;
            console.log(`Grid layer visibility set to: ${gridLayer.visible}`);
            
            // Make the toggle more visually apparent by changing background color
            const gameContainer = document.getElementById('game-container');
            if (gridLayer.visible) {
                gameContainer.style.backgroundColor = '#1a1a2e';
            } else {
                gameContainer.style.backgroundColor = '#0a0a16';
            }
        } else {
            console.error('Grid layer not found');
        }
    }
    
    simulateContextLoss() {
        // Get WebGL context and simulate loss
        const canvas = renderManager.getCanvas();
        const gl = canvas.getContext('webgl');
        
        if (gl && gl.getExtension('WEBGL_lose_context')) {
            gl.getExtension('WEBGL_lose_context').loseContext();
            console.log('WebGL context loss simulated');
        }
    }
    
    handleResize() {
        // Update any responsive elements
        const { width, height } = renderManager.getDimensions();
        
        // Resize grid if it exists
        const gridLayer = renderManager.getLayerManager().getLayer(RenderLayerType.GRID);
        if (gridLayer && gridLayer.children.length > 0) {
            const grid = gridLayer.children[0];
            if (grid instanceof PIXI.TilingSprite) {
                grid.width = width;
                grid.height = height;
            }
        }
    }
}

// Start the test when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RenderingTest();
});
