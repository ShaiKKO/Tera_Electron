"use strict";
/**
 * TerraFlux - Entity Component System Core Types
 *
 * This file defines the core types used throughout the ECS implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemEventType = exports.SystemPriority = exports.ComponentStorageType = exports.EntityEventType = void 0;
/** Entity event types */
var EntityEventType;
(function (EntityEventType) {
    EntityEventType["CREATED"] = "entity_created";
    EntityEventType["DESTROYED"] = "entity_destroyed";
    EntityEventType["COMPONENT_ADDED"] = "component_added";
    EntityEventType["COMPONENT_REMOVED"] = "component_removed";
    EntityEventType["TAG_ADDED"] = "tag_added";
    EntityEventType["TAG_REMOVED"] = "tag_removed";
})(EntityEventType || (exports.EntityEventType = EntityEventType = {}));
/** Component storage strategy types */
var ComponentStorageType;
(function (ComponentStorageType) {
    /** Array of Structs - Each entity's components are stored together */
    ComponentStorageType["ARRAY_OF_STRUCTS"] = "array_of_structs";
    /** Struct of Arrays - Each component type is stored in its own array */
    ComponentStorageType["STRUCT_OF_ARRAYS"] = "struct_of_arrays";
})(ComponentStorageType || (exports.ComponentStorageType = ComponentStorageType = {}));
/** System update priority levels - Higher values run earlier */
var SystemPriority;
(function (SystemPriority) {
    SystemPriority[SystemPriority["HIGHEST"] = 1000] = "HIGHEST";
    SystemPriority[SystemPriority["HIGH"] = 800] = "HIGH";
    SystemPriority[SystemPriority["NORMAL"] = 500] = "NORMAL";
    SystemPriority[SystemPriority["LOW"] = 200] = "LOW";
    SystemPriority[SystemPriority["LOWEST"] = 0] = "LOWEST";
})(SystemPriority || (exports.SystemPriority = SystemPriority = {}));
/** System event types */
var SystemEventType;
(function (SystemEventType) {
    SystemEventType["INITIALIZED"] = "system_initialized";
    SystemEventType["UPDATED"] = "system_updated";
    SystemEventType["DESTROYED"] = "system_destroyed";
})(SystemEventType || (exports.SystemEventType = SystemEventType = {}));
