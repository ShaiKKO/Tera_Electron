/**
 * TerraFlux - Animation Test Type Declarations
 * 
 * Type definitions for the animation and visual effects test renderer.
 */

// Texture configuration
interface TextureConfig {
  color: number;
  width: number;
  height: number;
  shape: 'circle' | 'rect' | 'triangle';
  alpha?: number;
  offsetX?: number;
  offsetY?: number;
}

// Texture configurations map
interface TextureConfigMap {
  [key: string]: TextureConfig;
}

// Animation frame
interface AnimFrame {
  texture: string;
  duration: number;
}

// Animation definition
interface AnimationConfig {
  frames: AnimFrame[];
  loop?: boolean;
  speed?: number;
  resetOnComplete?: boolean;
}

// Animation configurations map
interface AnimationConfigMap {
  [key: string]: AnimationConfig;
}

// Effect configuration
interface EffectConfig {
  id?: string;
  type: import('../components/VisualEffect').VisualEffectType;
  // Common properties
  duration?: number;
  intensity?: number;
  offset?: { x: number, y: number };
  
  // Type-specific properties (union of possible properties)
  // Glow effect
  color?: number;
  blurRadius?: number;
  
  // Text effect
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  offsetY?: number;
  float?: boolean;
  floatSpeed?: number;
  fadeOut?: boolean;
  
  // Scale effect
  scale?: number;
  pulse?: boolean;
  pulseFrequency?: number;
  
  // Particle effect
  texture?: string;
  count?: number;
  speed?: number;
  spread?: number;
  gravity?: number;
  
  // Distortion effect
  animate?: boolean;
  animationSpeed?: number;
}

// Effect configurations map
interface EffectConfigMap {
  [key: string]: EffectConfig;
}

// Entity configuration for test
interface EntityConfig {
  id: string;
  position: { q: number, r: number };
  animations: string[];
  effects: string[];
}

// Visual Effect Types
interface TintEffect extends VisualEffectProperties {
  fadeOut?: boolean;
}

interface ParticleEffect extends VisualEffectProperties {
  speed?: number;
}

// Additional declarations for type compatibility
interface RenderManager {
  initialize(app: any): void;
  createLayer(layerType: string): void;
  getContainer(): any;
}

interface TextureManager {
  registerTexture(name: string, texture: any): void;
}

interface HexGrid {
  generate(): void;
  toggleGrid(): void;
}

interface SystemManager {
  addSystem(system: any): void;
  getSystem(id: string): any;
  update(deltaTime: number): void;
}

interface EntityManager {
  registerEntity(entity: any): void;
}

interface CameraController {
  update(deltaTime: number): void;
  setZoom(zoom: number): void;
  resetPosition(): void;
  resetZoom(): void;
  enable(): void;
  onZoomChanged?: (zoom: number) => void;
}

interface Entity {
  id: string;
  addComponent(component: any): void;
  getComponent(typeId: string): any;
}
