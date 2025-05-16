/**
 * TerraFlux - Input System Test Preload
 * 
 * Preload script for the input system test app
 */

// Define global object for the renderer process
global.TerraFlux = {
  // Placeholder for actual input system code
  // This will be replaced with actual implementations
  
  initInputTest: () => {
    console.log('Input test initialized');
    
    const canvas = document.getElementById('game-canvas');
    const eventLog = document.getElementById('event-log');
    const cameraPosition = document.getElementById('camera-position');
    const cameraZoom = document.getElementById('camera-zoom');
    const currentContext = document.getElementById('current-context');
    
    if (!canvas || !eventLog || !cameraPosition || !cameraZoom || !currentContext) {
      console.error('Required DOM elements not found');
      return;
    }
    
    // Set up canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw coordinate grid
    const drawGrid = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set up transformations based on camera
      const camX = 0;
      const camY = 0;
      const zoom = 1.0;
      
      // Update HUD
      cameraPosition.textContent = `${camX}, ${camY}`;
      cameraZoom.textContent = zoom.toFixed(2);
      currentContext.textContent = 'Default';
      
      // Draw grid
      const gridSize = 50 * zoom;
      const offsetX = (camX % gridSize) - gridSize;
      const offsetY = (camY % gridSize) - gridSize;
      
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Vertical lines
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      
      // Horizontal lines
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      
      ctx.stroke();
      
      // Draw hex grid overlay
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      
      const hexSize = 60 * zoom;
      const hexHeight = hexSize * 2;
      const hexWidth = Math.sqrt(3) * hexSize;
      const hexVertOffset = hexHeight * 0.75;
      
      for (let row = -2; row < canvas.height / hexVertOffset + 2; row++) {
        for (let col = -2; col < canvas.width / hexWidth + 2; col++) {
          const x = col * hexWidth + ((row % 2) * (hexWidth / 2));
          const y = row * hexVertOffset;
          
          drawHex(ctx, x, y, hexSize);
        }
      }
      
      // Draw origin marker
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
      ctx.stroke();
    };
    
    const drawHex = (ctx, x, y, size) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = 2 * Math.PI / 6 * i + Math.PI / 6;
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      ctx.stroke();
    };
    
    // Log input events
    const logEvent = (eventType, details) => {
      const entry = document.createElement('div');
      entry.style.marginBottom = '5px';
      entry.style.borderBottom = '1px solid #555';
      entry.style.paddingBottom = '5px';
      
      const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
      entry.innerHTML = `<span style="color:#aaa">${timestamp}</span> <span style="color:#4CAF50">${eventType}</span>`;
      
      if (details) {
        entry.innerHTML += `: <span style="color:#64B5F6">${JSON.stringify(details)}</span>`;
      }
      
      eventLog.insertBefore(entry, eventLog.firstChild);
      
      // Limit number of entries
      if (eventLog.childNodes.length > 50) {
        eventLog.removeChild(eventLog.lastChild);
      }
    };
    
    // Set up event listeners
    canvas.addEventListener('mousedown', (e) => {
      logEvent('mousedown', { x: e.offsetX, y: e.offsetY, button: e.button });
    });
    
    canvas.addEventListener('mouseup', (e) => {
      logEvent('mouseup', { x: e.offsetX, y: e.offsetY, button: e.button });
    });
    
    canvas.addEventListener('mousemove', (e) => {
      // Don't log every move event as it would flood the log
      // Only log every 10th move event
      if (Math.random() < 0.1) {
        logEvent('mousemove', { x: e.offsetX, y: e.offsetY });
      }
    });
    
    canvas.addEventListener('wheel', (e) => {
      logEvent('wheel', { deltaY: e.deltaY > 0 ? 'down' : 'up' });
    });
    
    window.addEventListener('keydown', (e) => {
      logEvent('keydown', { key: e.key, code: e.code });
    });
    
    window.addEventListener('keyup', (e) => {
      logEvent('keyup', { key: e.key, code: e.code });
    });
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touches = Array.from(e.touches).map(t => ({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY
      }));
      logEvent('touchstart', { touches });
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      // Don't log every move event
      if (Math.random() < 0.1) {
        const touches = Array.from(e.touches).map(t => ({
          id: t.identifier,
          x: t.clientX,
          y: t.clientY
        }));
        logEvent('touchmove', { touches });
      }
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touches = Array.from(e.changedTouches).map(t => ({
        id: t.identifier,
        x: t.clientX,
        y: t.clientY
      }));
      logEvent('touchend', { touches });
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawGrid();
      logEvent('resize', { width: window.innerWidth, height: window.innerHeight });
    });
    
    // Initial draw
    drawGrid();
    
    // Animation loop
    const animate = () => {
      drawGrid();
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Log startup
    logEvent('TerraFlux Input Test Started');
  }
};

// No need for contextBridge when contextIsolation is disabled
