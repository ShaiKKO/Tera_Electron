## Multiplayer Implementation

TerraFlux's multiplayer features are built on SpacetimeDB, providing a robust, real-time synchronization framework with automatic conflict resolution.

### SpacetimeDB Integration

```typescript
// SpacetimeDB client integration
export class SpacetimeDBClient {
    private client: SpacetimeDBClient;
    private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private syncStatus: SyncStatus = SyncStatus.UNSYNCED;
    private subscriptions: Map<string, Subscription> = new Map();
    
    constructor(private config: SpacetimeConfig) {
        this.client = new ClockworkSDK.SpacetimeDBClient(config);
        
        // Set up event listeners
        this.client.onConnectionStatusChange((status) => {
            this.connectionStatus = status;
            EventBus.emit('connection-status-changed', status);
        });
        
        this.client.onSyncStatusChange((status) => {
            this.syncStatus = status;
            EventBus.emit('sync-status-changed', status);
        });
    }
    
    public async connect(): Promise<boolean> {
        try {
            await this.client.connect();
            return true;
        } catch (error) {
            console.error("Failed to connect to SpacetimeDB:", error);
            return false;
        }
    }
    
    public disconnect(): void {
        this.client.disconnect();
    }
    
    public isConnected(): boolean {
        return this.connectionStatus === ConnectionStatus.CONNECTED;
    }
    
    public isSynced(): boolean {
        return this.syncStatus === SyncStatus.SYNCED;
    }
    
    // Subscribe to changes in specific tables
    public subscribe<T>(tableId: string, callback: (changes: TableChange<T>) => void): string {
        const subscription = this.client.subscribe<T>(tableId, callback);
        const id = crypto.randomUUID();
        this.subscriptions.set(id, subscription);
        return id;
    }
    
    public unsubscribe(subscriptionId: string): boolean {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionId);
            return true;
        }
        return false;
    }
    
    // Execute reducer function on the database
    public async reduce<T, R>(reducer: string, args: T): Promise<R> {
        return await this.client.reduce<T, R>(reducer, args);
    }
    
    // Query data from the database
    public async query<T>(query: string, args?: any): Promise<T[]> {
        return await this.client.query<T>(query, args);
    }
}

// Enum definitions for connection and sync status
enum ConnectionStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    RECONNECTING = 'reconnecting'
}

enum SyncStatus {
    UNSYNCED = 'unsynced',
    SYNCING = 'syncing',
    SYNCED = 'synced'
}
```

### Multiplayer Architecture

TerraFlux uses a dual-mode architecture that allows seamless transitions between single-player and multiplayer:

1. **Local Mode**:
   - Game state stored locally
   - Operates completely offline
   - Uses local SQLite database for persistence

2. **Connected Mode**:
   - Game state synchronized with SpacetimeDB
   - Real-time updates from other players
   - Automatic conflict resolution

This is achieved through a storage abstraction layer:

```typescript
// Storage interface that can be implemented for both local and remote storage
interface StorageProvider {
    saveWorld(world: WorldMap): Promise<boolean>;
    loadWorld(id: string): Promise<WorldMap | null>;
    updateTile(worldId: string, q: number, r: number, updates: Partial<HexTile>): Promise<boolean>;
    // Other storage operations...
}

// Local storage implementation
class LocalStorageProvider implements StorageProvider {
    private db: SQLite.Database;
    
    constructor() {
        this.db = new SQLite.Database('terraflux.db');
        this.initializeSchema();
    }
    
    public async saveWorld(world: WorldMap): Promise<boolean> {
        try {
            // Save to SQLite database
            const serialized = world.serialize();
            const worldId = await this.db.run(
                'INSERT OR REPLACE INTO worlds (id, data) VALUES (?, ?)',
                [world.id, JSON.stringify(serialized)]
            );
            return true;
        } catch (error) {
            console.error('Failed to save world:', error);
            return false;
        }
    }
    
    public async loadWorld(id: string): Promise<WorldMap | null> {
        try {
            const result = await this.db.get('SELECT data FROM worlds WHERE id = ?', [id]);
            if (!result) return null;
            
            const data = JSON.parse(result.data);
            return WorldMap.deserialize(data);
        } catch (error) {
            console.error('Failed to load world:', error);
            return null;
        }
    }
    
    // Other storage operations...
}

// SpacetimeDB storage implementation
class SpacetimeStorageProvider implements StorageProvider {
    private client: SpacetimeDBClient;
    
    constructor(client: SpacetimeDBClient) {
        this.client = client;
    }
    
    public async saveWorld(world: WorldMap): Promise<boolean> {
        try {
            // Convert to SpacetimeDB format
            const worldData = WorldAdapter.toSpacetime(world);
            
            // Save using reducer
            await this.client.reduce('save_world', worldData);
            return true;
        } catch (error) {
            console.error('Failed to save world to SpacetimeDB:', error);
            return false;
        }
    }
    
    public async loadWorld(id: string): Promise<WorldMap | null> {
        try {
            // Query world from SpacetimeDB
            const result = await this.client.query('SELECT * FROM worlds WHERE id = ?', [id]);
            if (result.length === 0) return null;
            
            // Convert from SpacetimeDB format
            return WorldAdapter.fromSpacetime(result[0]);
        } catch (error) {
            console.error('Failed to load world from SpacetimeDB:', error);
            return false;
        }
    }
    
    // Other storage operations...
}

// Storage service that can switch between providers
class StorageService {
    private localProvider: LocalStorageProvider;
    private remoteProvider: SpacetimeStorageProvider | null = null;
    private currentProvider: StorageProvider;
    
    constructor(useRemote: boolean = false) {
        this.localProvider = new LocalStorageProvider();
        this.currentProvider = this.localProvider;
        
        // If remote mode requested, try to connect
        if (useRemote) {
            this.setupRemoteProvider();
        }
    }
    
    private async setupRemoteProvider(): Promise<void> {
        const client = new SpacetimeDBClient(getSpacetimeConfig());
        const connected = await client.connect();
        
        if (connected) {
            this.remoteProvider = new SpacetimeStorageProvider(client);
            this.currentProvider = this.remoteProvider;
        } else {
            console.warn('Failed to connect to SpacetimeDB, falling back to local storage');
        }
    }
    
    public setMode(useRemote: boolean): void {
        if (useRemote && this.remoteProvider) {
            this.currentProvider = this.remoteProvider;
        } else {
            this.currentProvider = this.localProvider;
        }
    }
    
    // Storage operations delegate to current provider
    public async saveWorld(world: WorldMap): Promise<boolean> {
        return this.currentProvider.saveWorld(world);
    }
    
    public async loadWorld(id: string): Promise<WorldMap | null> {
        return this.currentProvider.loadWorld(id);
    }
    
    // Other storage operations...
}
```

### Multiplayer Features

TerraFlux's multiplayer implementation provides several key features:

1. **Shared World Exploration**:
   - Players can explore the same procedurally generated world
   - Discoveries are synchronized in real-time
   - Resource changes (harvesting, etc.) are visible to all players

2. **Real-time Interaction**:
   - Players can see others moving and performing actions
   - Visual indicators show other players' activities
   - Chat and emote system for communication

3. **Colony Visiting**:
   - Players can visit each other's colonies
   - Permission system controls visit access and interaction rights
   - Trades and resource exchanges can occur during visits

4. **Expedition Parties**:
   - Players can form groups to explore dangerous areas together
   - Shared rewards for discoveries and combat
   - Specialized party roles (scout, defender, researcher, etc.)
   - Real-time coordination through party communication system

5. **Convergence Events**:
   - Server-scheduled multiplayer events that bring players together
   - Global challenges that require cooperative effort
   - Synchronized rewards and progression
   - Timed events with real-world schedules

### Real-time Conflict Resolution

One of the key benefits of using SpacetimeDB is its built-in conflict resolution system:

```typescript
// Example SpacetimeDB reducer for harvesting resources
export function harvestResource(
    worldId: string,
    tileQ: number,
    tileR: number,
    resourceType: ResourceType,
    amount: number,
    playerId: string
) {
    return (ctx: ReducerContext) => {
        // 1. Find the tile
        const tile = ctx.query(WorldTileSchema)
            .filter({ worldId, q: tileQ, r: tileR })
            .first();
            
        if (!tile) {
            throw new Error('Tile not found');
        }
        
        // 2. Find resource on the tile
        const resource = ctx.query(ResourceSchema)
            .filter({ tileId: tile.id, type: resourceType })
            .first();
            
        if (!resource) {
            throw new Error('Resource not found on tile');
        }
        
        // 3. Check if enough resource available
        if (resource.amount < amount) {
            // Return what's available instead
            amount = resource.amount;
        }
        
        // 4. Reduce resource amount (transaction ensures this is atomic)
        const remainingAmount = resource.amount - amount;
        ctx.update(ResourceSchema, resource.id, { amount: remainingAmount });
        
        // 5. Add to player's inventory
        const inventory = ctx.query(PlayerInventorySchema)
            .filter({ playerId, resourceType })
            .first();
            
        if (inventory) {
            ctx.update(PlayerInventorySchema, inventory.id, { 
                amount: inventory.amount + amount 
            });
        } else {
            ctx.insert(PlayerInventorySchema, {
                playerId,
                resourceType,
                amount
            });
        }
        
        // 6. Create harvest record
        ctx.insert(HarvestLogSchema, {
            playerId,
            worldId,
            tileQ,
            tileR,
            resourceType,
            amount,
            timestamp: Date.now()
        });
        
        // 7. Return the amount actually harvested
        return amount;
    };
}
```

When multiple players try to harvest from the same resource simultaneously, SpacetimeDB handles the conflicts by:

1. Serializing the operations in a consistent order
2. Ensuring each operation sees the latest state
3. Preventing race conditions and data corruption
4. Providing predictable outcomes to all clients

### Offline to Online Transition

TerraFlux handles seamless transitions between offline and online play:

```typescript
// Example: Transitioning from offline to online mode
class MultiplayerManager {
    private isOnline: boolean = false;
    private storageService: StorageService;
    private syncQueue: PendingChange[] = [];
    
    constructor(private gameState: GameState) {
        this.storageService = new StorageService(false);
    }
    
    public async goOnline(): Promise<boolean> {
        if (this.isOnline) return true;
        
        try {
            // 1. Switch storage to remote mode
            this.storageService.setMode(true);
            
            // 2. Apply pending changes
            await this.synchronizeChanges();
            
            // 3. Subscribe to relevant tables
            this.setupSubscriptions();
            
            this.isOnline = true;
            return true;
        } catch (error) {
            console.error('Failed to go online:', error);
            this.storageService.setMode(false);
            return false;
        }
    }
    
    public goOffline(): void {
        if (!this.isOnline) return;
        
        // Switch back to local storage
        this.storageService.setMode(false);
        this.isOnline = false;
    }
    
    private async synchronizeChanges(): Promise<void> {
        // Process each pending change in order
        for (const change of this.syncQueue) {
            await this.applyChange(change);
        }
        
        // Clear the queue
        this.syncQueue = [];
    }
    
    private async applyChange(change: PendingChange): Promise<void> {
        // Apply different types of changes
        switch (change.type) {
            case 'RESOURCE_HARVEST':
                await this.applyResourceHarvest(change);
                break;
            case 'ENTITY_MOVE':
                await this.applyEntityMove(change);
                break;
            // Other change types...
        }
    }
    
    private setupSubscriptions(): void {
        // Subscribe to world updates
        this.storageService.subscribeToWorld(this.gameState.currentWorldId, (changes) => {
            this.handleWorldChanges(changes);
        });
        
        // Subscribe to player updates
        this.storageService.subscribeToPLayers((changes) => {
            this.handlePlayerChanges(changes);
        });
        
        // Additional subscriptions...
    }
    
    // Record changes when offline for later synchronization
    public recordChange(change: PendingChange): void {
        if (!this.isOnline) {
            this.syncQueue.push(change);
        }
    }
}

// Types for pending changes
interface PendingChange {
    type: string;
    timestamp: number;
    data: any;
}
```

### Schema Design

TerraFlux's SpacetimeDB schema is designed to efficiently represent the game state:

```typescript
// Core schemas
const WorldSchema = new TableSchema('world', {
    id: Identity(),
    name: Text(),
    seed: Integer(),
    createdAt: Integer(),
    updatedAt: Integer(),
    owner: Text(),
    isPublic: Boolean(),
    maxPlayers: Integer(),
    description: Text()
});

const WorldTileSchema = new TableSchema('world_tile', {
    id: Identity(),
    worldId: Integer(),
    q: Integer(),
    r: Integer(),
    biomeType: Integer(),
    elevation: Float(),
    moisture: Float(),
    temperature: Float(),
    explored: Boolean(),
    lastUpdated: Integer()
});

const PlayerSchema = new TableSchema('player', {
    id: Identity(),
    username: Text(),
    worldId: Integer(),
    lastActive: Integer(),
    positionQ: Integer(),
    positionR: Integer(),
    isOnline: Boolean()
});

const ColonySchema = new TableSchema('colony', {
    id: Identity(),
    name: Text(),
    worldId: Integer(),
    ownerId: Integer(),
    q: Integer(),
    r: Integer(),
    foundedAt: Integer(),
    level: Integer(),
    population: Integer()
});

// Permissions for colony visiting
const ColonyPermissionSchema = new TableSchema('colony_permission', {
    id: Identity(),
    colonyId: Integer(),
    playerId: Integer(),
    permissionLevel: Integer(),
    grantedAt: Integer(),
    grantedBy: Integer()
});

// Expedition groups
const ExpeditionSchema = new TableSchema('expedition', {
    id: Identity(),
    name: Text(),
    leaderId: Integer(),
    worldId: Integer(),
    createdAt: Integer(),
    status: Integer(),
    targetQ: Integer(),
    targetR: Integer()
});

const ExpeditionMemberSchema = new TableSchema('expedition_member', {
    expeditionId: Integer(),
    playerId: Integer(),
    role: Integer(),
    joinedAt: Integer()
});

// Events
const WorldEventSchema = new TableSchema('world_event', {
    id: Identity(),
    worldId: Integer(),
    type: Integer(),
    startTime: Integer(),
    endTime: Integer(),
    status: Integer(),
    centerQ: Integer(),
    centerR: Integer(),
    radius: Integer()
});

const EventParticipationSchema = new TableSchema('event_participation', {
    eventId: Integer(),
    playerId: Integer(),
    joinedAt: Integer(),
    contribution: Integer(),
    rewards: Text() // JSON string of rewards
});
```

### Performance Optimizations

To ensure smooth multiplayer even with many players:

1. **Interest Management**:
   - Only sync entities near the player
   - Progressive loading of distant areas
   - Priority-based updates (important entities get more frequent updates)

2. **Delta Compression**:
   - Only send changed properties
   - Batch updates when possible
   - Use efficient serialization

3. **Prediction and Reconciliation**:
   - Client-side prediction for responsive UI
   - Server reconciliation for consistency
   - Smooth correction of prediction errors

```typescript
class PlayerPositionSystem extends System {
    private predictedPositions: Map<string, Position> = new Map();
    private lastServerPositions: Map<string, Position> = new Map();
    
    constructor(entityManager: EntityManager, private networkManager: NetworkManager) {
        super(entityManager);
        
        // Subscribe to server position updates
        networkManager.subscribe('player_position', (data) => {
            this.handleServerPositionUpdate(data);
        });
    }
    
    public update(deltaTime: number): void {
        // Update local player position based on input
        const localPlayer = this.entities.find(e => e.hasComponent('LocalPlayer'));
        if (localPlayer) {
            const posComp = localPlayer.getComponent<PositionComponent>('Position');
            const inputComp = localPlayer.getComponent<InputComponent>('Input');
            
            // Calculate new position based on input
            const newPosition = this.calculateNewPosition(posComp, inputComp, deltaTime);
            
            // Apply locally immediately for responsiveness
            posComp.x = newPosition.x;
            posComp.y = newPosition.y;
            
            // Store prediction
            this.predictedPositions.set(localPlayer.id, new Position(newPosition.x, newPosition.y));
            
            // Send to server
            this.networkManager.sendPosition(localPlayer.id, newPosition.x, newPosition.y);
        }
        
        // Update remote player positions
        for (const entity of this.entities) {
            if (entity.hasComponent('RemotePlayer')) {
                this.updateRemotePlayer(entity, deltaTime);
            }
        }
    }
    
    private handleServerPositionUpdate(data: any): void {
        // Store the authoritative position from server
        this.lastServerPositions.set(data.playerId, new Position(data.x, data.y));
        
        // Check if this is for local player
        const localPlayer = this.entities.find(e => 
            e.hasComponent('LocalPlayer') && e.id === data.playerId
        );
        
        if (localPlayer) {
            const predicted = this.predictedPositions.get(data.playerId);
            if (predicted) {
                // Calculate difference between prediction and server position
                const dx = data.x - predicted.x;
                const dy = data.y - predicted.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // If difference is significant, correct with smooth reconciliation
                if (distance > 0.1) {
                    const posComp = localPlayer.getComponent<PositionComponent>('Position');
                    this.reconcilePosition(posComp, data.x, data.y);
                }
            }
        }
    }
    
    private reconcilePosition(posComp: PositionComponent, serverX: number, serverY: number): void {
        // Smooth reconciliation over multiple frames
        posComp.x = posComp.x * 0.8 + serverX * 0.2;
        posComp.y = posComp.y * 0.8 + serverY * 0.2;
    }
    
    private updateRemotePlayer(entity: Entity, deltaTime: number): void {
        // Interpolation for remote players to make movement smooth
        const posComp = entity.getComponent<PositionComponent>('Position');
        const serverPos = this.lastServerPositions.get(entity.id);
        
        if (serverPos) {
            // Smoothly interpolate to server position
            posComp.x = posComp.x * 0.9 + serverPos.x * 0.1;
            posComp.y = posComp.y * 0.9 + serverPos.y * 0.1;
        }
    }
    
    // Helper methods...
}
```

### Security Considerations

TerraFlux's multiplayer implementation includes several security features:

1. **Authentication**:
   - Secure token-based authentication
   - Session management with timeouts
   - Device verification

2. **Authorization**:
   - Permission-based access to colonies and resources
   - Role-based actions (admin, moderator, player)
   - Resource isolation between worlds

3. **Anti-Cheat Measures**:
   - Server-side validation of all game-changing actions
   - Rate limiting to prevent abuse
   - Anomaly detection for suspicious activity
   - Secure random number generation for critical game elements
