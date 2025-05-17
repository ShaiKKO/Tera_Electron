# Animation and Visual Effects System

This document describes the animation and visual effects systems for TerraFlux.

## Overview

The animation and visual effects systems provide entities with the ability to display animations and visual effects. These systems are built on top of the ECS (Entity Component System) architecture and utilize PixiJS for rendering.

## Components

### Animated Component

**Purpose:** Provides an entity with animation capabilities.

**Key Features:**
- Animation sequence management
- Frame-based animation
- Animation control (play, pause, stop)
- Event callbacks for animation completion, looping, and frame changes
- Animation speed control
- Multiple animation definitions per entity

**Implementation:**
- Located at `src/game/components/Animated.ts`
- Uses a data-driven approach where animations are defined as sequences of frames
- Each frame references a texture (sprite) and has a duration
- Tracks animation state (current frame, elapsed time, etc.)

### VisualEffect Component

**Purpose:** Adds various visual effects to entities.

**Effect Types:**
- Particles: For particle emitters
- Animation: For sprite sheet animations
- Shader: For custom shader effects
- Tint: For color overlays
- Text: For floating text
- Scale: For scaling/pulsing effects
- Glow: For glow effects
- Distortion: For displacement/distortion effects

**Key Features:**
- Effect lifecycle management
- Effect intensity control
- Layered effects
- Time-based effects (e.g., fading, pulsing)
- Positional offsets for effects

**Implementation:**
- Located at `src/game/components/VisualEffect.ts`
- Uses a flexible data structure to define different types of effects
- Each effect has common properties (duration, intensity, etc.) and type-specific properties
- Effects can be added, removed, and updated dynamically

## Systems

### AnimationSystem

**Purpose:** Updates animations for entities with Animated components and updates their visual representation.

**Key Features:**
- Efficient animation updates
- Integration with RenderSystem
- Animation playback control (play, stop, speed control)
- Event handling for animation state changes

**Implementation:**
- Located at `src/game/rendering/systems/AnimationSystem.ts`
- Subscribes to entity events (creation, destruction, component addition/removal)
- Updates animation state based on elapsed time
- Updates entity textures when animation frames change
- Provides public methods for controlling animations

### VisualEffectSystem

**Purpose:** Manages visual effects for entities, including creation, updating, and removal of effect instances.

**Key Features:**
- Effect lifecycle management
- Effect rendering
- Integration with RenderSystem
- Various effect implementations:
  - Particle effects
  - Tint effects
  - Text effects
  - Scale effects
  - Glow effects
  - Distortion effects

**Implementation:**
- Located at `src/game/rendering/systems/VisualEffectSystem.ts`
- Creates and manages PixiJS display objects for effects
- Updates effect properties based on effect definitions and elapsed time
- Cleans up effects when they expire or are removed
- Uses RenderManager to add effect display objects to appropriate layers

## Usage Examples

### Adding an Animation

```typescript
// Create an animated component
const animated = new Animated({
  animations: [
    {
      name: 'walk',
      frames: [
        { texture: 'walk1', duration: 0.1 },
        { texture: 'walk2', duration: 0.1 },
        { texture: 'walk3', duration: 0.1 },
        { texture: 'walk4', duration: 0.1 }
      ],
      loop: true
    },
    {
      name: 'attack',
      frames: [
        { texture: 'attack1', duration: 0.08 },
        { texture: 'attack2', duration: 0.08 },
        { texture: 'attack3', duration: 0.12 }
      ],
      loop: false
    }
  ],
  defaultAnimation: 'walk',
  autoplay: true
});

// Add to entity
entity.addComponent(animated);

// Later, to play a different animation
animationSystem.playAnimation(entity, 'attack', true);
```

### Adding Visual Effects

```typescript
// Add a glow effect to an entity
visualEffectSystem.addEffect(entity, {
  id: 'healing-glow',
  type: VisualEffectType.GLOW,
  color: 0x00ff00, // Green glow
  intensity: 0.8,
  blurRadius: 15,
  duration: 2.0, // Will last for 2 seconds
  pulse: true,
  pulseFrequency: 2.0 // Pulse twice per second
});

// Add floating damage text
visualEffectSystem.addEffect(entity, {
  id: 'damage-text',
  type: VisualEffectType.TEXT,
  text: '150',
  color: 0xff0000, // Red text
  fontSize: 20,
  float: true,
  floatSpeed: 40,
  fadeOut: true,
  duration: 1.5
});
```

## Integration with Rendering System

Both the AnimationSystem and VisualEffectSystem work closely with the RenderSystem and other rendering components:

- They update entity textures and visual properties which are then rendered by the RenderSystem
- They utilize the TextureManager for sprite and texture access
- They use the RenderManager and its layer system to properly order effects and entity sprites
- They handle cleanup of visual resources when entities are destroyed or components are removed

## Design Considerations

- **Performance**: Both systems are designed to be efficient, updating only when necessary and using object pooling where appropriate.
- **Flexibility**: The component-based design allows for easy addition of new animation and effect types.
- **Separation of Concerns**: Animation and visual effects are separated from entity logic and rendering.
- **Ease of Use**: The API is designed to be simple and intuitive, with sensible defaults.

## Future Improvements

- Add more sophisticated particle effect support
- Implement a more comprehensive shader effect system
- Add support for skeletal/bone-based animations
- Implement animation blending for smoother transitions
- Add support for sprite sheet animations with texture atlases
- Improve performance with batching and more aggressive optimizations
