/**
 * TerraFlux - Tile Rendering System Test
 * 
 * A minimal test application to demonstrate the hex tile rendering system.
 * This creates a grid of hex tiles with different biomes, features, and 
 * allows interaction with them through the mouse.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'electron/preload-tile-test.js')
    }
  });

  // Create temp HTML file for testing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TerraFlux Tile System Test</title>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          overflow: hidden; 
          background-color: #111111;
        }
        #app {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        #controls {
          padding: 10px;
          background-color: #222222;
          color: #ffffff;
          font-family: Arial, sans-serif;
          display: flex;
          gap: 15px;
        }
        #gameCanvas {
          flex: 1;
        }
        button {
          background-color: #444444;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #555555;
        }
        select {
          background-color: #444444;
          color: white;
          border: none;
          padding: 5px;
          border-radius: 4px;
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        #tileInfo {
          padding: 10px;
          background-color: #222222;
          color: #ffffff;
          font-family: Arial, sans-serif;
          height: 60px;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <div id="app">
        <div id="controls">
          <div class="control-group">
            <label for="biomeSelect">Biome:</label>
            <select id="biomeSelect">
              <option value="forest">Forest</option>
              <option value="mountain">Mountain</option>
              <option value="desert">Desert</option>
              <option value="tundra">Tundra</option>
              <option value="wetland">Wetland</option>
              <option value="volcanic">Volcanic</option>
              <option value="crystal">Crystal</option>
            </select>
          </div>
          <div class="control-group">
            <label for="featureSelect">Feature:</label>
            <select id="featureSelect">
              <option value="none">None</option>
              <option value="resourceNode">Resource Node</option>
              <option value="landmark">Landmark</option>
              <option value="structure">Structure</option>
              <option value="energySource">Energy Source</option>
              <option value="ancientRuin">Ancient Ruin</option>
            </select>
          </div>
          <div class="control-group">
            <label for="visibilityRange">Visibility:</label>
            <input type="range" id="visibilityRange" min="3" max="20" value="10" />
            <span id="visibilityValue">10</span>
          </div>
          <button id="resetBtn">Reset Grid</button>
          <button id="clearSelectionBtn">Clear Selection</button>
        </div>
        <canvas id="gameCanvas"></canvas>
        <div id="tileInfo">Click on a tile to view information</div>
      </div>
      
      <script src="./test-tile-system-renderer.bundle.js"></script>
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          if (window.initTileTester) {
            window.initTileTester();
          } else {
            document.body.innerHTML = 'Error: Tile tester script not loaded';
          }
        });
      </script>
    </body>
    </html>
  `;

  const htmlPath = path.join(__dirname, 'temp-tile-test.html');
  fs.writeFileSync(htmlPath, htmlContent);

  // Load the test HTML file
  mainWindow.loadFile(htmlPath);

  // Open the DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function() {
  if (mainWindow === null) createWindow();
});
