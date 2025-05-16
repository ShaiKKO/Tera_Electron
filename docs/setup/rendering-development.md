# Rendering System Development Environment

This document provides setup instructions and guidance for developing and testing the TerraFlux rendering system.

## Development Prerequisites

- Node.js 18+ with npm
- Modern browser with WebGL support (Chrome/Firefox recommended for development)
- Visual Studio Code (recommended)
  - Extensions:
    - ESLint
    - Prettier
    - Debugger for Chrome
    - Mermaid Preview (for documentation diagrams)

## Project Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Configure development environment:
   ```bash
   # Start the development server
   npm run dev
   ```

## Testing the Rendering System

The project includes several test harnesses specifically for the rendering system:

### 1. Basic Rendering Test

```bash
# Run the basic rendering test
node test-rendering.js
```

This test initializes the PixiJS renderer and displays basic sprites to verify core rendering functionality.

### 2. Coordinate System Rendering Test

```bash
# Run the coordinate system visualization test
node test-coordinate-rendering.js
```

This test visualizes the coordinate system grid to verify proper positioning.

### 3. Performance Testing

```bash
# Run rendering performance test
node test-rendering-performance.js
```

This test generates a large number of sprites to measure rendering performance.

## Debug Tools

### Performance Monitoring

The rendering system includes built-in performance monitoring. To enable it:

1. Open the developer console in your browser
2. Enter: `window.TERRAFLUX.debug.showPerformanceStats = true`

This will display an overlay with FPS, draw calls, and memory usage.

### Visual Debugging

Visual debugging tools can be enabled with:

```javascript
// In browser console
window.TERRAFLUX.debug.showBoundingBoxes = true;
window.TERRAFLUX.debug.showLayerBorders = true;
window.TERRAFLUX.debug.showCoordinateGrid = true;
```

## Common Development Tasks

### Adding a New Sprite Type

1. Add the texture to the assets folder
2. Register in TextureManager:
   ```typescript
   // In src/game/rendering/TextureManager.ts
   this.registerTexture('spriteName', 'path/to/sprite.png');
   ```
3. Create a factory method in a relevant system:
   ```typescript
   // Example in an entity factory
   createEntityWithSprite(world, x, y) {
     const entity = world.createEntity();
     entity.addComponent(new Position(x, y));
     entity.addComponent(new Renderable({
       layer: RenderLayerType.Entities,
       spriteUrl: 'spriteName'
     }));
     return entity;
   }
   ```

### Adding a New Render Layer

1. Add the layer type to the enum:
   ```typescript
   // In src/game/rendering/types.ts
   export enum RenderLayerType {
     // Existing layers...
     NewLayer = 'new-layer'
   }
   ```
2. Configure the layer in LayerManager:
   ```typescript
   // In src/game/rendering/LayerManager.ts (initializeLayers method)
   this.createLayer(RenderLayerType.NewLayer, {
     zIndex: 150, // Between entities (100) and UI (200)
     sortChildren: true
   });
   ```

## Troubleshooting

### WebGL Context Lost

If you encounter a WebGL context loss, check:

1. Is the GPU under heavy load from other applications?
2. Are there too many sprites or textures being rendered?
3. Is the texture memory usage too high?

Solution: Implement the context restoration event handling in RenderManager.

### Performance Issues

If rendering performance is poor:

1. Check texture sizes and reduce where possible
2. Ensure proper batching by using sprite sheets
3. Use the LayerManager's culling features to hide off-screen objects
4. Profile with browser developer tools to identify bottlenecks

### Missing Textures

If textures are not displaying:

1. Verify the path is correct
2. Check the browser console for loading errors
3. Ensure TextureManager has completed loading before rendering
4. Verify the CORS settings if loading from external sources

## Best Practices

1. **Memory Management**
   - Dispose unused textures with `TextureManager.unloadTexture()`
   - Remove display objects from renderer when entities are destroyed

2. **Performance Optimization**
   - Use texture atlases instead of individual sprites
   - Implement proper culling for off-screen entities
   - Batch similar sprites together in the same layer

3. **Code Organization**
   - Keep rendering logic separate from game logic
   - Use the RenderSystem as the bridge between ECS and PixiJS
   - Document any non-obvious rendering techniques with comments
