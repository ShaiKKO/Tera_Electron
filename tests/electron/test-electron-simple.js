/**
 * Simple Electron test app to check if Electron is working correctly
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('Starting simple Electron test...');

// Create a simple window
function createWindow() {
  console.log('Creating window...');
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load a simple HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Simple Electron Test</title>
        <style>
          body { background-color: #333; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
          h1 { color: #0f0; }
        </style>
      </head>
      <body>
        <h1>TerraFlux Electron Test</h1>
        <p>If you can see this, Electron is working correctly!</p>
        <p>Current time: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `;

  const tempPath = path.join(__dirname, 'temp-test.html');
  fs.writeFileSync(tempPath, htmlContent);
  
  console.log('Loading HTML file from:', tempPath);
  mainWindow.loadFile(tempPath);
  
  // Open DevTools
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  
  mainWindow.on('closed', () => {
    // Delete the temporary file
    try {
      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }
  });
}

app.whenReady().then(() => {
  console.log('Electron is ready...');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
