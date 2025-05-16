/**
 * TerraFlux - Game Example
 * 
 * A simple example demonstrating the ECS architecture.
 * Creates bouncing entities with position and velocity components
 * managed by a movement system.
 */

import { game, GameEventType } from '../core/Game';
import { entityManager } from '../core/ecs/EntityManager';
import { systemManager } from '../core/ecs/SystemManager';
import { SystemPriority } from '../core/ecs/types';
import { PositionComponent } from '../components/Position';
import { VelocityComponent } from '../components/Velocity';
import { MovementSystem } from '../systems/MovementSystem';

// Game area boundaries
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ENTITY_SIZE = 20;

// Entity bounce system
class BounceSystem extends MovementSystem {
  constructor() {
    super({
      name: 'Bounce',
      // Use a higher priority to ensure it runs after movement
      priority: SystemPriority.HIGH
    });
  }

  protected onUpdate(deltaTime: number, entities: any[]): void {
    // First let movement system update positions
    super.onUpdate(deltaTime, entities);
    
    // Then handle bouncing off walls
    for (const entity of entities) {
      const position = entity.getComponent('position') as PositionComponent;
      const velocity = entity.getComponent('velocity') as VelocityComponent;
      
      if (position && velocity) {
        // Bounce off left/right walls
        if (position.x < 0) {
          position.x = 0;
          velocity.vx = Math.abs(velocity.vx);
        } else if (position.x > GAME_WIDTH - ENTITY_SIZE) {
          position.x = GAME_WIDTH - ENTITY_SIZE;
          velocity.vx = -Math.abs(velocity.vx);
        }
        
        // Bounce off top/bottom walls
        if (position.y < 0) {
          position.y = 0;
          velocity.vy = Math.abs(velocity.vy);
        } else if (position.y > GAME_HEIGHT - ENTITY_SIZE) {
          position.y = GAME_HEIGHT - ENTITY_SIZE;
          velocity.vy = -Math.abs(velocity.vy);
        }
      }
    }
  }
}

// Renderer system - just logs positions, would normally draw entities
class RenderSystem {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  constructor() {
    // Initialize canvas when document is ready
    document.addEventListener('DOMContentLoaded', () => {
      this.initCanvas();
    });
  }
  
  private initCanvas() {
    // Create canvas if it doesn't exist
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = GAME_WIDTH;
      this.canvas.height = GAME_HEIGHT;
      this.canvas.style.border = '1px solid black';
      this.canvas.style.backgroundColor = '#f0f0f0';
      document.getElementById('game-container')?.appendChild(this.canvas);
      
      // Get context
      this.context = this.canvas.getContext('2d');
    }
  }
  
  public render(entities: any[]) {
    if (!this.context || !this.canvas) {
      this.initCanvas();
      if (!this.context) return;
    }
    
    // Clear canvas
    this.context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw each entity
    for (const entity of entities) {
      const position = entity.getComponent('position') as PositionComponent;
      if (position) {
        // Draw entity
        this.context.fillStyle = entity.hasTag('player') ? 'blue' : 'red';
        this.context.fillRect(position.x, position.y, ENTITY_SIZE, ENTITY_SIZE);
        
        // Draw entity name
        this.context.fillStyle = 'black';
        this.context.font = '10px Arial';
        this.context.fillText(entity.name, position.x, position.y - 5);
      }
    }
  }
}

/**
 * Game Example class
 */
export class GameExample {
  private renderer: RenderSystem;
  
  constructor() {
    this.renderer = new RenderSystem();
    
    // Set up event listeners
    game.eventEmitter.subscribe(GameEventType.INITIALIZED, this.onGameInitialized.bind(this));
    game.eventEmitter.subscribe(GameEventType.UPDATE, this.onGameUpdate.bind(this));
  }
  
  /**
   * Initialize the game example
   */
  public async init() {
    // Configure and initialize the game
    game.debug = true;
    game.targetFPS = 60;
    
    await game.initialize();
    
    // Create systems
    const bounceSystem = new BounceSystem();
    systemManager.addSystem(bounceSystem);
    
    // Create entities
    this.createEntities();
    
    // Start the game
    game.start();
    
    console.log('Game example initialized with', entityManager.getEntityCount(), 'entities');
    
    return game;
  }
  
  /**
   * Called when the game is initialized
   */
  private onGameInitialized() {
    console.log('Game initialized!');
  }
  
  /**
   * Called every frame
   */
  private onGameUpdate(game: any, deltaTime: number) {
    // Get all entities with position components
    const entities = entityManager.getEntitiesWithComponent('position');
    
    // Render entities
    this.renderer.render(entities);
  }
  
  /**
   * Create initial entities
   */
  private createEntities() {
    // Create player entity
    const player = entityManager.createEntity({ name: 'Player' });
    player.addTag('player');
    
    // Add components to player
    entityManager.addComponent(player.id, new PositionComponent(GAME_WIDTH / 2, GAME_HEIGHT / 2));
    entityManager.addComponent(player.id, new VelocityComponent(100, 130));
    
    // Create some random entities
    for (let i = 0; i < 10; i++) {
      const entity = entityManager.createEntity({ name: `Entity ${i+1}` });
      
      // Random position within game area
      const x = Math.random() * (GAME_WIDTH - ENTITY_SIZE);
      const y = Math.random() * (GAME_HEIGHT - ENTITY_SIZE);
      
      // Random velocity
      const vx = (Math.random() - 0.5) * 200;
      const vy = (Math.random() - 0.5) * 200;
      
      // Add components
      entityManager.addComponent(entity.id, new PositionComponent(x, y));
      entityManager.addComponent(entity.id, new VelocityComponent(vx, vy));
    }
  }
}

// Export an instance of the game example for easy access
export const gameExample = new GameExample();
