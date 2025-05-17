# SpacetimeDB Multiplayer Features

This document outlines the multiplayer features that will be implemented using SpacetimeDB in TerraFlux.

## Core Multiplayer Features

### 1. Expedition Parties

SpacetimeDB will manage expedition groups where multiple players can:
- Explore the world map together
- Share discoveries
- Cooperatively gather resources
- Defend against threats

**Implementation Notes:**
- Expedition party data will be stored in `expedition` and `expedition_member` tables
- Party leader permissions will be enforced through SpacetimeDB's access control
- Real-time position updates will use SpacetimeDB's change subscription
- Shared resource collection will use atomic transactions

### 2. Origin Tile Visits

Players can visit each other's colonies with permission:
- View other player's bases
- Interact with specific buildings
- Trade resources directly
- Participate in local events

**Implementation Notes:**
- Colony permission system will use `colony_permission` table
- Visitor activity will be tracked and restricted based on permission levels
- Host players will receive real-time notifications of visitor actions
- Specialized buildings can be created to facilitate multiplayer interactions

### 3. Trading System

Players can engage in secure trades:
- Propose resource exchanges
- Negotiate terms
- Complete transactions with guarantees

**Implementation Notes:**
- Trade proposals will use `trade_offer` and `trade_line_item` tables
- Transaction atomicity will be guaranteed through SpacetimeDB's transactional operations
- Trade history will be maintained for reference and analytics
- Secure escrow system will prevent trade scams

### 4. Conclaves

Specialized player groups with shared goals:
- Research Conclaves: Share research progress
- Trade Conclaves: Special trading privileges
- Warden Conclaves: Coordinate defense
- Nomad Conclaves: Coordinate exploration

**Implementation Notes:**
- Conclave membership and roles will be stored in dedicated tables
- Benefits will be calculated through SpacetimeDB functions
- Real-time coordination features will leverage SpacetimeDB's pubsub capabilities
- Shared resources and discoveries will be tracked and distributed fairly

### 5. Convergence Events

Limited-time world phenomena affecting multiple players:
- Crystal storms
- Resource surges
- Ancient awakenings
- Dimensional rifts

**Implementation Notes:**
- Events will be globally scheduled and synchronized through SpacetimeDB
- Participation and rewards will be tracked in real-time
- Event state will be consistent across all participants
- Server-side logic will coordinate event progression

## Technical Implementation

### Real-time Synchronization

SpacetimeDB will provide real-time updates for:
- Player positions and actions
- World state changes
- Resource availability
- Building constructions/upgrades
- Event progress and outcomes

Implementation will use:
- Efficient delta updates to minimize bandwidth
- Prioritized synchronization based on relevance
- Update rate throttling based on action type
- Preemptive loading for anticipated interactions

### Conflict Resolution

When multiple players attempt contradictory actions:
1. SpacetimeDB transactions will prevent data corruption
2. First-writer priority for resource gathering
3. Area-based locking for construction
4. Queue systems for high-demand interactions
5. Intelligent conflict resolution for overlapping activities

Implementations will include:
- Optimistic UI updates with rollback capability
- Clearly communicated resolution outcomes
- Fair distribution systems for contested resources
- Cooldown periods for certain actions to prevent spam

### Scaling Strategy

As player count increases:
1. Shard world map by region
2. Implement interest management to reduce update volume
3. Use proximity-based subscription systems
4. Dynamically adjust update frequency based on player density
5. Implement spatial indexing for efficient proximity queries

Performance targets:
- Support 100+ simultaneous players in shared world
- Maintain 60ms or less response time for critical actions
- Gracefully degrade non-essential updates during high load
- Prioritize game-critical interactions during congestion

### Offline Capability

Even in multiplayer mode, TerraFlux will support:
1. Offline colony management
2. Local-only game saves
3. Synchronization when reconnecting
4. Conflict resolution for changes made while offline

Implementation approach:
- Queue pending changes when offline
- Store delta changes locally
- Resolve conflicts during reconnection using timestamps and priority rules
- Use versioning to track synchronized state

## Player Experience

### Multiplayer Onboarding

1. Players start in single-player mode
2. After establishing their first colony, multiplayer features unlock
3. Guided introduction to each multiplayer feature
4. Progressive revealing of more complex interactions

Implementation flow:
- Tutorial-style introduction to multiplayer concepts
- Safe, consequence-free initial multiplayer experiences
- Gradual introduction of competitive elements
- Clear UI indicators for multiplayer vs. single-player actions

### Multiplayer UI Elements

1. Player presence indicators on world map
2. Expedition party formation interface
3. Trading proposal and negotiation screens
4. Conclave membership and benefits panel
5. Convergence event notifications and tracking

UI design principles:
- Consistent color coding for multiplayer elements
- Clear status indicators for connection state
- Responsive feedback for multiplayer actions
- Fallback UI modes for offline/disconnected state

### Communication Tools

1. Context-sensitive emotes and signals
2. Limited text chat with templated messages
3. Trade negotiation interface
4. Expedition planning tools

Implementation approach:
- Predefined message templates for common communications
- Emoji and reaction system for quick feedback
- Drawing and marking tools for map coordination
- Voice chat integration for parties (optional)

## Implementation Phases

### Phase 1: Basic Multiplayer Presence
- Player visibility in shared worlds
- Simple real-time position updates
- Basic chat functionality
- Connection state management

### Phase 2: Expedition Parties
- Party formation and management
- Shared exploration mechanics
- Cooperative resource gathering
- Group-based permissions

### Phase 3: Trading and Visiting
- Colony permission system
- Secure trading protocol
- Origin tile visiting mechanics
- Inter-colony interaction systems

### Phase 4: Conclaves
- Conclave creation and management
- Specialized benefits per conclave type
- Shared research and progress tracking
- Conclave territory and resource management

### Phase 5: Convergence Events
- Global event scheduling system
- Synchronized event progression
- Multiplayer participation tracking
- Reward distribution mechanism

## SpacetimeDB Schema Preview

```typescript
// Basic table structure for key multiplayer features

// Players
const PlayerSchema = new TableSchema('player', {
  id: Identity(),
  username: Text(),
  lastSeen: Integer(),
  status: Integer()  // Online, offline, busy, etc.
});

// Expeditions
const ExpeditionSchema = new TableSchema('expedition', {
  id: Identity(),
  name: Text(),
  leaderId: Integer(),
  worldId: Integer(),
  status: Integer(),
  createdAt: Integer()
});

const ExpeditionMemberSchema = new TableSchema('expedition_member', {
  expeditionId: Integer(),
  playerId: Integer(),
  role: Integer(),
  joinedAt: Integer()
});

// Trading
const TradeOfferSchema = new TableSchema('trade_offer', {
  id: Identity(),
  offerorId: Integer(),
  receiverId: Integer(),
  status: Integer(),
  createdAt: Integer(),
  completedAt: Integer()
});

const TradeLineItemSchema = new TableSchema('trade_line_item', {
  tradeOfferId: Integer(),
  direction: Integer(),  // Offering or requesting
  resourceType: Text(),
  quantity: Integer()
});

// Colony permissions
const ColonyPermissionSchema = new TableSchema('colony_permission', {
  colonyId: Integer(),
  playerId: Integer(),
  permissionLevel: Integer(),
  grantedBy: Integer(),
  grantedAt: Integer()
});

// Conclaves
const ConclaveSchema = new TableSchema('conclave', {
  id: Identity(),
  name: Text(),
  type: Integer(),
  founderId: Integer(),
  createdAt: Integer()
});

const ConclaveMemberSchema = new TableSchema('conclave_member', {
  conclaveId: Integer(),
  playerId: Integer(),
  role: Integer(),
  joinedAt: Integer()
});

// Convergence events
const ConvergenceEventSchema = new TableSchema('convergence_event', {
  id: Identity(),
  type: Integer(),
  worldId: Integer(),
  status: Integer(),
  startTime: Integer(),
  endTime: Integer(),
  centerTileQ: Integer(),
  centerTileR: Integer(),
  radius: Integer()
});

const EventParticipationSchema = new TableSchema('event_participation', {
  eventId: Integer(),
  playerId: Integer(),
  contributionScore: Integer(),
  rewards: Text()  // JSON of rewards
});
```

## Security Considerations

1. **Authentication**: Integration with secure authentication system
2. **Authorization**: Permission-based access to actions and data
3. **Anti-Cheat**: Server-side validation of all significant actions
4. **Rate Limiting**: Protection against spam and DoS attacks
5. **Data Validation**: Thorough validation of all client inputs
6. **Audit Logging**: Comprehensive activity tracking for dispute resolution

## Monitoring and Operations

1. **Real-time Metrics**: Dashboard for active players, transactions, etc.
2. **Performance Monitoring**: Tracking of response times and system health
3. **Alerting**: Automated notifications for service disruptions
4. **Backups**: Regular automated backups of world data
5. **Maintenance Window**: Scheduled downtime procedures with player notifications
6. **Scaling Procedures**: Documented processes for handling player surges
