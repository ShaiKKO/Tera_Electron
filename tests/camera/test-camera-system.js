/**
 * TerraFlux Camera System Test
 * 
 * This test demonstrates the enhanced RimWorld-style camera system
 * with features like physics-based movement, momentum, following,
 * and edge scrolling.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Create test HTML file
const testHtmlPath = path.join(__dirname, 'temp-camera-test.html');
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TerraFlux Camera System Test</title>
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
        .entity {
            position: absolute;
            width: 32px;
            height: 32px;
            background-color: #f00;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            transition: background-color 0.3s;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 10px;
            user-select: none;
        }
        .entity.selected {
            background-color: #0f0;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
        }
        .grid {
            position: absolute;
            top: 0;
            left: 0;
            pointer-events: none;
        }
        .info-overlay {
            position: fixed;
            bottom: 10px;
            left: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 999;
            max-width: 300px;
        }
        kbd {
            background-color: #333;
            border-radius: 3px;
            border: 1px solid #666;
            padding: 2px 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div id="game-container"></div>
    <div id="stats">Loading...</div>
    <div class="info-overlay">
        <p><kbd>WASD</kbd> or <kbd>Arrow Keys</kbd>: Move camera</p>
        <p><kbd>Mouse Wheel</kbd>: Zoom in/out</p>
        <p><kbd>Middle Mouse</kbd>: Drag camera</p>
        <p><kbd>Double Click</kbd>: Center on point</p>
        <p><kbd>F</kbd>: Follow selected entity</p>
        <p><kbd>Space</kbd>: Toggle camera momentum</p>
        <p><kbd>E</kbd>: Toggle edge scrolling</p>
    </div>
    <div class="control-panel">
        <button id="toggle-stats">Toggle Stats</button>
        <button id="shake-camera">Shake Camera</button>
        <button id="animate-camera">Animate Camera</button>
        <button id="toggle-momentum">Toggle Momentum</button>
        <button id="toggle-edge-scroll">Toggle Edge Scroll</button>
        <button id="reset-camera">Reset Camera</button>
    </div>
    <script src="test-camera-system-renderer.bundle.js"></script>
</body>
</html>`;

fs.writeFileSync(testHtmlPath, htmlContent);

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
    mainWindow.setTitle('TerraFlux Camera System Test');
    
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
