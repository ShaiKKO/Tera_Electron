/**
 * TerraFlux - Input System Test
 * 
 * A simple test to demonstrate the input system functionality.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// HTML content for our test
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>TerraFlux Input System Test</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: #333;
      color: #fff;
      font-family: Arial, sans-serif;
    }
    #game-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    #canvas-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
    }
    #hud {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 5px;
      pointer-events: none;
    }
    #input-debug {
      position: absolute;
      top: 10px;
      right: 10px;
      padding: 10px;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 5px;
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
    }
    h1 {
      margin: 0 0 10px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      margin-right: 10px;
    }
    .info-value {
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div id="canvas-container">
      <canvas id="game-canvas"></canvas>
      <div id="hud">
        <h1>TerraFlux Input Test</h1>
        <div class="info-row">
          <span class="info-label">Camera Position:</span>
          <span class="info-value" id="camera-position">0, 0</span>
        </div>
        <div class="info-row">
          <span class="info-label">Camera Zoom:</span>
          <span class="info-value" id="camera-zoom">1.0</span>
        </div>
        <div class="info-row">
          <span class="info-label">Context:</span>
          <span class="info-value" id="current-context">Default</span>
        </div>
      </div>
      <div id="input-debug">
        <h2>Input Events</h2>
        <div id="event-log"></div>
      </div>
    </div>
  </div>

  <script>
    // We'll load the actual input system and tests when the page is set up
    document.addEventListener('DOMContentLoaded', () => {
      // This script tag will be replaced with the compiled game code in the actual app
      if (window.TerraFlux && window.TerraFlux.initInputTest) {
        window.TerraFlux.initInputTest();
      } else {
        document.getElementById('event-log').innerHTML = 
          '<div style="color: red">Error: Input system not loaded.</div>';
      }
    });
  </script>
</body>
</html>
`;

// Create temporary HTML file
const fs = require('fs');
const tempHtmlPath = path.join(__dirname, 'temp-input-test.html');
fs.writeFileSync(tempHtmlPath, TEST_HTML);

// Remove electron-squirrel-startup dependency
// This is only needed for packaged apps, not for development testing

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Keep contextIsolation false as we're using global
      preload: path.join(__dirname, 'test-input-preload.js')
    }
  });

  // Load the test HTML file
  mainWindow.loadURL(url.format({
    pathname: tempHtmlPath,
    protocol: 'file:',
    slashes: true
  }));

  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Clean up temporary file
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
