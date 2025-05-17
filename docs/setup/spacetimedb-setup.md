# SpacetimeDB Setup Guide

This guide explains how to set up SpacetimeDB for development with TerraFlux.

## Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- SpacetimeDB CLI tool

## Installation

1. Install the SpacetimeDB CLI:
   ```bash
   npm install -g @clockworklabs/spacetimedb-cli
   ```

2. Add SpacetimeDB client library to the project:
   ```bash
   npm install @clockworklabs/spacetimedb-sdk
   ```

## Configuration

Create a SpacetimeDB configuration file at `src/game/spacetime/config.ts`:

```typescript
export const SPACETIMEDB_CONFIG = {
  // Development environment
  development: {
    appId: 'terraflux-dev',
    endpoint: 'localhost:3000',
    insecure: true
  },
  
  // Testing environment
  testing: {
    appId: 'terraflux-test',
    endpoint: 'localhost:3001',
    insecure: true
  },
  
  // Production environment
  production: {
    appId: 'terraflux-prod',
    endpoint: 'api.terraflux-game.com',
    insecure: false
  }
};

// Select the appropriate config based on environment
export const getSpacetimeConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return SPACETIMEDB_CONFIG[env] || SPACETIMEDB_CONFIG.development;
};
```

## Local Development Server

Set up a local SpacetimeDB server for development:

1. Initialize a SpacetimeDB project:
   ```bash
   spacetime init terraflux
   cd terraflux
   ```

2. Start the local SpacetimeDB server:
   ```bash
   spacetime start --project terraflux
   ```

3. The server is now running at `localhost:3000` and ready for connections.

## Project Structure

Create the following folder structure for SpacetimeDB integration:

```
src/game/spacetime/
├── config.ts              # Configuration settings
├── adapter.ts             # Client adapter for game integration
├── entities/              # Schema definitions
│   ├── world.ts           # World entity definitions
│   ├── tile.ts            # Tile entity definitions
│   └── ...
├── reducers/              # State reducer functions
│   ├── world-reducers.ts  # World state reducers
│   └── ...
├── queries/               # Query definitions
│   ├── world-queries.ts   # World data queries
│   └── ...
└── __tests__/             # Test files
```

## Schema Definition

Define your schemas in appropriate files. Example for world entities:

```typescript
// src/game/spacetime/entities/world.ts
import { TableSchema, Identity, Text, Integer, Float, Boolean } from '@clockworklabs/spacetimedb-sdk';

export const WorldSchema = new TableSchema('world', {
  id: Identity(),
  name: Text(),
  seed: Integer(),
  timestamp: Integer(),
  version: Text(),
  size: Integer(),
  playerTileQ: Integer(),
  playerTileR: Integer(),
  exploredTileCount: Integer()
});

export const TileSchema = new TableSchema('world_tile', {
  worldId: Integer(), // Foreign key to world
  q: Integer(),
  r: Integer(),
  biomeType: Integer(),
  variation: Integer(),
  elevation: Float(),
  moisture: Float(),
  temperature: Float(),
  discovered: Boolean(),
  explored: Boolean(),
  visibility: Float()
});

// Other entity definitions...
```

## Reducers

Create reducer functions that will modify the state:

```typescript
// src/game/spacetime/reducers/world-reducers.ts
import { WorldSchema, TileSchema } from '../entities/world';

export function createWorld(name: string, seed: number, size: number) {
  return (ctx: any) => {
    const timestamp = Date.now();
    const worldId = ctx.insert(WorldSchema, {
      name,
      seed,
      timestamp,
      version: '1.0',
      size,
      playerTileQ: 0,
      playerTileR: 0,
      exploredTileCount: 0
    });
    
    return worldId;
  };
}

export function updateTile(worldId: number, q: number, r: number, 
                          updates: Partial<typeof TileSchema.shape>) {
  return (ctx: any) => {
    const tile = ctx.query(TileSchema)
      .filter({ worldId, q, r })
      .first();
    
    if (tile) {
      ctx.update(TileSchema, tile.id, updates);
      return true;
    }
    
    return false;
  };
}

// More reducer functions...
```

## Client Integration

Create a client adapter to abstract SpacetimeDB operations:

```typescript
// src/game/spacetime/adapter.ts
import { SpacetimeDBClient } from '@clockworklabs/spacetimedb-sdk';
import { getSpacetimeConfig } from './config';
import { WorldSchema, TileSchema } from './entities/world';
import { createWorld, updateTile } from './reducers/world-reducers';

export class SpacetimeAdapter {
  private client: SpacetimeDBClient;
  private connected: boolean = false;
  
  constructor() {
    const config = getSpacetimeConfig();
    this.client = new SpacetimeDBClient(config);
  }
  
  async connect() {
    try {
      await this.client.connect();
      this.connected = true;
      return true;
    } catch (error) {
      console.error('Failed to connect to SpacetimeDB:', error);
      this.connected = false;
      return false;
    }
  }
  
  isConnected() {
    return this.connected;
  }
  
  // World operations
  async createNewWorld(name: string, seed: number, size: number) {
    if (!this.connected) {
      throw new Error('Not connected to SpacetimeDB');
    }
    
    return this.client.reduce(createWorld(name, seed, size));
  }
  
  async getWorld(worldId: number) {
    if (!this.connected) {
      throw new Error('Not connected to SpacetimeDB');
    }
    
    return this.client.query(WorldSchema)
      .filter({ id: worldId })
      .first();
  }
  
  // Tile operations
  async updateTile(worldId: number, q: number, r: number, updates: any) {
    if (!this.connected) {
      throw new Error('Not connected to SpacetimeDB');
    }
    
    return this.client.reduce(updateTile(worldId, q, r, updates));
  }
  
  // Add more adapter methods for other operations
}
```

## Integration with Game Code

Create a storage service that can switch between local and SpacetimeDB modes:

```typescript
// src/game/services/storage-service.ts
import { SpacetimeAdapter } from '../spacetime/adapter';
import { LocalStorageAdapter } from './local-storage-adapter';
import { WorldMap } from '../world/WorldMap';
import { WorldTile } from '../world/WorldTile';

export class StorageService {
  private spacetimeAdapter: SpacetimeAdapter;
  private localAdapter: LocalStorageAdapter;
  private useSpacetime: boolean;
  
  constructor(useSpacetime: boolean = false) {
    this.spacetimeAdapter = new SpacetimeAdapter();
    this.localAdapter = new LocalStorageAdapter();
    this.useSpacetime = useSpacetime;
  }
  
  async initialize() {
    if (this.useSpacetime) {
      return await this.spacetimeAdapter.connect();
    }
    return true;
  }
  
  setMode(useSpacetime: boolean) {
    this.useSpacetime = useSpacetime;
  }
  
  getAdapter() {
    return this.useSpacetime ? this.spacetimeAdapter : this.localAdapter;
  }
  
  // Facade methods that delegate to the appropriate adapter
  async getWorld(id: string) {
    return this.getAdapter().getWorld(id);
  }
  
  async saveWorld(world: WorldMap) {
    return this.getAdapter().saveWorld(world);
  }
  
  async updateTile(worldId: string, tile: WorldTile) {
    return this.getAdapter().updateTile(worldId, tile);
  }
  
  // Add more methods that delegate to the appropriate adapter
}
```

## Testing

Create tests specifically for SpacetimeDB integration:

```typescript
// src/game/spacetime/__tests__/adapter.test.ts
import { SpacetimeAdapter } from '../adapter';

describe('SpacetimeDB Adapter', () => {
  let adapter: SpacetimeAdapter;

  beforeEach(() => {
    adapter = new SpacetimeAdapter();
  });

  test('connects to SpacetimeDB', async () => {
    // Mock connection
    jest.spyOn(adapter, 'connect').mockResolvedValue(true);
    
    const result = await adapter.connect();
    expect(result).toBe(true);
    expect(adapter.isConnected()).toBe(true);
  });

  // More test cases...
});
```

## Data Conversion Utilities

Create utilities to convert between game models and SpacetimeDB models:

```typescript
// src/game/spacetime/utils/converters.ts
import { WorldMap } from '../../world/WorldMap';
import { WorldTile } from '../../world/WorldTile';

export function convertWorldMapToSpacetime(worldMap: WorldMap): any {
  return {
    name: worldMap.name,
    seed: worldMap.seed,
    timestamp: worldMap.timestamp,
    version: worldMap.version,
    size: worldMap.size,
    playerTileQ: worldMap.playerTileQ,
    playerTileR: worldMap.playerTileR,
    exploredTileCount: worldMap.exploredTileCount
  };
}

export function convertSpacetimeToWorldMap(data: any): WorldMap {
  return WorldMap.deserialize({
    id: data.id,
    name: data.name,
    seed: data.seed,
    timestamp: data.timestamp,
    version: data.version,
    size: data.size,
    biomeDistribution: {}, // This would need to be fetched separately
    tiles: [], // Tiles would need to be fetched separately
    playerTileQ: data.playerTileQ,
    playerTileR: data.playerTileR,
    exploredTileCount: data.exploredTileCount
  });
}

// Similar conversion functions for tiles, features, resources, etc.
```

## Deployment

For production deployment:

1. Set up a SpacetimeDB instance on a cloud provider or dedicated server.

2. Configure domain and SSL certificates for secure communication.

3. Update the production configuration in `src/game/spacetime/config.ts` to point to your production server.

4. Create deployment scripts to automate the deployment process:

   ```bash
   # Example deployment script
   spacetime deploy --app terraflux-prod --module world
   ```

5. Set up monitoring and logging for the production instance.

## Common Issues and Troubleshooting

### Connection Issues

If you're having trouble connecting to SpacetimeDB:

1. Ensure the SpacetimeDB server is running (`spacetime status`).
2. Check that the configuration has the correct endpoint.
3. Verify network connectivity to the endpoint.
4. If using TLS, ensure certificates are valid.

### Schema Evolution

When your schema changes:

1. Create migration functions to handle the schema change.
2. Use versioning to track schema changes.
3. Test migration paths thoroughly.

### Performance Optimization

If experiencing performance issues:

1. Use projections to fetch only needed data.
2. Implement pagination for large data sets.
3. Use batch operations for multiple updates.
4. Consider sharding data for very large worlds.

## Next Steps

1. Implement a basic demo that connects to SpacetimeDB and stores/retrieves data.
2. Create subscription handlers to react to real-time updates.
3. Develop the offline fallback mechanism.
4. Build more comprehensive schema for game entities.
5. Create admin tools for managing SpacetimeDB data.
