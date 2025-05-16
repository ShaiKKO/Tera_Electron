/**
 * TerraFlux - Coordinate System Test Script
 * 
 * This script demonstrates and tests the coordinate system implementation.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Wait for Electron to initialize
app.whenReady().then(() => {
  console.log('Starting TeraFlux Coordinate System Test');
  
  // Create a window for the test
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Create a simple HTML file for the test
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>TeraFlux Coordinate System Test</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          background-color: #f0f0f0;
          color: #333;
        }
        h1 { color: #2c3e50; }
        #results {
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
          white-space: pre;
          font-family: monospace;
        }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>TeraFlux Coordinate System Test</h1>
      <p>This test verifies the coordinate system implementation for TeraFlux.</p>
      <div id="results">Running tests...</div>
      
      <script src="dist/game/game.bundle.js"></script>
      <script>
        console.log("Document loaded, checking for TeraFlux namespace...");
        
        // Function to log to the results div
        function displayResult(message, isError) {
          const resultsDiv = document.getElementById('results');
          const element = document.createElement('div');
          element.textContent = message;
          if (isError) {
            element.classList.add('error');
          } else {
            element.classList.add('success');
          }
          
          if (resultsDiv.textContent === 'Running tests...') {
            resultsDiv.textContent = '';
          }
          
          resultsDiv.appendChild(element);
          console.log(message);
        }
        
        // Wait for everything to load
        setTimeout(function() {
          try {
            // Log what we found
            displayResult('TeraFlux global: ' + (window.TeraFlux ? 'Found' : 'Not Found'));
            
            if (window.TeraFlux && window.TeraFlux.Game) {
              displayResult('Game namespace: Found');
              
              // Check for coordinate system
              const components = [
                'CoordinateSystem',
                'CoordinateSystemVerification',
                'HexPositionComponent',
                'HexPathfinding'
              ];
              
              components.forEach(component => {
                if (window.TeraFlux.Game[component]) {
                  displayResult('[PASS] ' + component + ': Available');
                } else {
                  displayResult('[FAIL] ' + component + ': Missing', true);
                }
              });
              
              // If coordinate system exists, run a simple test
              if (window.TeraFlux.Game.CoordinateSystem) {
                const cs = window.TeraFlux.Game.CoordinateSystem;
                
                // Test hex-world conversion
                const hex = { q: 2, r: -1 };
                const world = cs.hexToWorld(hex.q, hex.r);
                const hexBack = cs.worldToHex(world.x, world.y);
                
                displayResult('');
                displayResult('Test: Hex (' + hex.q + ',' + hex.r + ') -> World (' + 
                  world.x.toFixed(2) + ',' + world.y.toFixed(2) + ') -> Hex (' + 
                  hexBack.q + ',' + hexBack.r + ')');
                
                if (hex.q === hexBack.q && hex.r === hexBack.r) {
                  displayResult('[PASS] Round-trip conversion successful');
                } else {
                  displayResult('[FAIL] Round-trip conversion failed', true);
                }
              }
            } else {
              displayResult('Game namespace not found in TeraFlux global', true);
            }
          } catch (error) {
            displayResult('ERROR: ' + error.message, true);
            console.error(error);
          }
        }, 1000);
      </script>
    </body>
    </html>
  `;
  
  // Write the test HTML to a temporary file
  const testHtmlPath = path.join(__dirname, 'temp-coordinate-test.html');
  fs.writeFileSync(testHtmlPath, testHtml);
  
  // Load the test HTML file
  win.loadFile(testHtmlPath);
  
  // Open DevTools for debugging
  win.webContents.openDevTools();
  
  console.log('Test window opened');
  
  // Quit app when window is closed
  win.on('closed', () => {
    // Clean up the temporary test HTML file
    try {
      fs.unlinkSync(testHtmlPath);
    } catch (err) {
      console.error('Could not delete temporary test file:', err);
    }
    
    app.quit();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});
