/**
 * TerraFlux - Rendering System Types
 * 
 * Type definitions for the rendering system.
 */

import * as PIXI from 'pixi.js';
import { Entity } from '../core/ecs/Entity';

/**
 * Render layer types for controlling the drawing order
 */
export enum RenderLayerType {
  BACKGROUND = 'background',
  TERRAIN = 'terrain',
  TERRAIN_DECORATION = 'terrain_decoration',
  SELECTION = 'selection',
  GRID = 'grid',
  ENTITIES_BELOW = 'entities_below',
  ENTITIES = 'entities',
  ENTITIES_ABOVE = 'entities_above',
  EFFECTS = 'effects',
  UI_BACKGROUND = 'ui_background',
  UI = 'ui',
  UI_FOREGROUND = 'ui_foreground',
  DEBUG = 'debug'
}

/**
 * Layer configuration with z-index and other properties
 */
export interface RenderLayerConfig {
  name: RenderLayerType;
  zIndex: number;
  visible: boolean;
  sortable?: boolean;
  sortFunction?: (a: PIXI.DisplayObject, b: PIXI.DisplayObject) => number;
  filters?: PIXI.Filter[];
}

/**
 * Configuration options for the rendering system
 */
export interface RenderOptions {
  width: number;
  height: number;
  backgroundColor: number;
  antialias: boolean;
  resolution: number;
  autoDensity: boolean;
  preserveDrawingBuffer?: boolean;
  clearBeforeRender?: boolean;
  forceFXAA?: boolean;
  powerPreference?: WebGLPowerPreference;
}

/**
 * Interface for objects that can be attached to a render layer
 */
export interface LayerChild {
  layer: RenderLayerType;
  zIndex?: number;
  sortOrder?: number;
}

/**
 * Camera settings interface
 */
export interface CameraSettings {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  minZoom: number;
  maxZoom: number;
  zoomSpeed: number;
  movementSpeed: number;
}

/**
 * Interface for renderable entity data
 */
export interface RenderableData {
  entity: Entity;
  displayObject: PIXI.DisplayObject;
  layer: RenderLayerType;
  sortValue: number;
  visible: boolean;
}

/**
 * Texture loading options
 */
export interface TextureLoadOptions {
  priority?: number;
  crossOrigin?: boolean | string;
  mipmap?: PIXI.MIPMAP_MODES;
  anisotropicLevel?: number;
  scaleMode?: PIXI.SCALE_MODES;
}

/**
 * Asset load status
 */
export enum AssetLoadStatus {
  PENDING = 'pending',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error'
}

/**
 * Asset load information
 */
export interface AssetLoadInfo {
  url: string;
  status: AssetLoadStatus;
  progress: number;
  error?: Error;
}

/**
 * Shader uniform type for crystalline effects
 */
export interface CrystallineShaderUniforms {
  uTime: number;
  uColor: number[];
  uIntensity: number;
  uFacetSize: number;
  uNoiseScale: number;
  uRefractStrength: number;
}

/**
 * Energy flow shader uniforms
 */
export interface EnergyFlowShaderUniforms {
  uTime: number;
  uColor: number[];
  uSpeed: number;
  uDirection: number[];
  uFlowIntensity: number;
  uGlowStrength: number;
}

/**
 * Hover effect shader uniforms
 */
export interface HoverEffectShaderUniforms {
  uTime: number;
  uHoverHeight: number;
  uBobSpeed: number;
  uBobStrength: number;
}

/**
 * Aura shader uniforms
 */
export interface AuraShaderUniforms {
  uTime: number;
  uColor: number[];
  uPulseSpeed: number;
  uPulseStrength: number;
  uRadius: number;
  uFalloff: number;
}

/**
 * Render event types
 */
export enum RenderEventType {
  INITIALIZED = 'render_initialized',
  RESIZE = 'render_resize',
  VIEWPORT_CHANGE = 'render_viewport_change',
  LAYER_VISIBILITY_CHANGE = 'render_layer_visibility_change',
  RENDER_STATS_UPDATE = 'render_stats_update',
  TEXTURE_LOADED = 'texture_loaded',
  TEXTURE_ERROR = 'texture_error',
  RENDER_ERROR = 'render_error'
}

/**
 * Performance metrics for rendering
 */
export interface RenderStats {
  fps: number;
  renderTime: number;
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  sprites: number;
  particleCount: number;
  visibleObjects: number;
  totalObjects: number;
  textureMemory: number;
  geometryMemory: number;
}
