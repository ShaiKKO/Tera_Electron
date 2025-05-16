/**
 * TerraFlux Rendering Test Harness
 * 
 * This test demonstrates the PixiJS integration with our rendering system.
 * It displays a basic scene with sprites organized in different layers,
 * and shows performance statistics.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Create test HTML file
const testHtmlPath = path.join(__dirname, 'temp-pixi-test.html');
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TerraFlux PixiJS Integration Test</title>
    <style>
        html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #1a1a2e;
            color: white;
            font-family: Arial, sans-serif;
        }
        #game-container {
            width: 100%;
            height: 100%;
            position: relative;
        }
        #stats {
            position: fixed;
            top: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
        }
        .control-panel {
            position: fixed;
            right: 10px;
            top: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
        }
        button {
            background-color: #334;
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 5px;
            border-radius: 3px;
            cursor: pointer;
        }
        button:hover {
            background-color: #556;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <div id="stats">Loading...</div>
    <div class="control-panel">
        <button id="toggle-stats">Toggle Stats</button>
        <button id="add-sprites">Add 100 Sprites</button>
        <button id="toggle-layers">Toggle Grid Layer</button>
        <button id="lose-context">Simulate Context Loss</button>
    </div>
    <script src="test-pixi-integration-renderer.js"></script>
</body>
</html>`;

fs.writeFileSync(testHtmlPath, htmlContent);

// Create the renderer script
const rendererScriptPath = path.join(__dirname, 'test-pixi-integration-renderer.js');
const rendererScript = `
// Import required libraries
import * as PIXI from 'pixi.js';
import { renderManager } from './src/game/rendering/RenderManager';
import { textureManager } from './src/game/rendering/TextureManager';
import { RenderLayerType } from './src/game/rendering/types';

// Generate placeholder sprite if no assets available
function generatePlaceholderTexture(color = 0xFF5555, width = 64, height = 64) {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    // Add some visual detail
    graphics.lineStyle(2, 0xFFFFFF);
    graphics.moveTo(0, 0);
    graphics.lineTo(width, height);
    graphics.moveTo(width, 0);
    graphics.lineTo(0, height);
    graphics.drawRect(4, 4, width - 8, height - 8);
    
    return PIXI.RenderTexture.create({
        width,
        height
    });
}

// Generate a hex grid texture
function generateHexGridTexture(color = 0x334466, backgroundColor = 0x1a1a2e, size = 512) {
    const graphics = new PIXI.Graphics();
    
    // Fill background
    graphics.beginFill(backgroundColor);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    // Draw hex grid
    graphics.lineStyle(1, color);
    
    const hexRadius = 32;
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
        }
    }
    
    return PIXI.RenderTexture.create({
        width: size,
        height: size
    });
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
            // Initialize the render manager with the container
            await renderManager.initialize(this.container);
            
            // Enable stats recording
            renderManager.setStatsRecording(true);
            
            // Generate placeholder textures
            this.textures.red = generatePlaceholderTexture(0xFF5555);
            this.textures.green = generatePlaceholderTexture(0x55FF55);
            this.textures.blue = generatePlaceholderTexture(0x5555FF);
            this.textures.yellow = generatePlaceholderTexture(0xFFFF55);
            this.textures.hexGrid = generateHexGridTexture();
            
            // Create a grid background
            const grid = new PIXI.TilingSprite(
                this.textures.hexGrid,
                renderManager.getDimensions().width,
                renderManager.getDimensions().height
            );
            renderManager.addToLayer(grid, RenderLayerType.GRID);
            
            // Add some test sprites to different layers
            this.addSprites(200);
            
            // Setup stats update listener
            this.setupStatsListener();
            
            // Handle window resize
            window.addEventListener('resize', () => this.handleResize());
            
            console.log('PixiJS Integration Test initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PixiJS Integration Test:', error);
            this.statsElement.innerHTML = \`Error: \${error.message}\`;
        }
    }
    
    setupStatsListener() {
        // Update stats periodically
        setInterval(() => {
            if (!this.isStatsVisible) return;
            
            const stats = renderManager.getStats();
            this.statsElement.innerHTML = \`
                FPS: \${stats.fps.toFixed(1)}<br>
                Render Time: \${stats.renderTime.toFixed(2)}ms<br>
                Objects: \${stats.visibleObjects} / \${stats.totalObjects}<br>
                Sprites: \${stats.sprites}<br>
                Draw Calls: \${stats.drawCalls}<br>
                Memory: \${(stats.textureMemory / 1024 / 1024).toFixed(2)} MB<br>
                Sprites Added: \${this.sprites.length}
            \`;
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
        
        for (let i = 0; i < count; i++) {
            // Pick random texture and layer
            const texture = this.textures[textureKeys[Math.floor(Math.random() * textureKeys.length)]];
            const layer = layers[Math.floor(Math.random() * layers.length)];
            
            // Create sprite
            const sprite = new PIXI.Sprite(texture);
            
            // Random position and properties
            sprite.x = Math.random() * width;
            sprite.y = Math.random() * height;
            sprite.rotation = Math.random() * Math.PI * 2;
            sprite.scale.set(0.5 + Math.random() * 1.5);
            sprite.alpha = 0.6 + Math.random() * 0.4;
            sprite.anchor.set(0.5);
            
            // Add sprite to layer
            renderManager.addToLayer(sprite, layer);
            
            // Store reference
            this.sprites.push(sprite);
            
            // Add animation
            this.animateSprite(sprite);
        }
    }
    
    animateSprite(sprite) {
        // Give each sprite a random movement pattern
        const speedX = (Math.random() - 0.5) * 2;
        const speedY = (Math.random() - 0.5) * 2;
        const rotationSpeed = (Math.random() - 0.5) * 0.1;
        
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
        const gridLayer = renderManager.getLayerManager().getLayer(RenderLayerType.GRID);
        if (gridLayer) {
            gridLayer.visible = !gridLayer.visible;
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
`;

fs.writeFileSync(rendererScriptPath, rendererScript);

// Create Electron app
let mainWindow;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron/preload.js')
        }
    });

    // Load the test HTML
    await mainWindow.loadFile(testHtmlPath);
    mainWindow.setTitle('TerraFlux PixiJS Integration Test');
    
    // Open DevTools
    mainWindow.webContents.openDevTools();
}

// Electron app events
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
