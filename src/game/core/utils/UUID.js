"use strict";
/**
 * TerraFlux - UUID Generator
 *
 * A utility for generating unique identifiers for entities and components.
 * Uses a combination of timestamp, random values, and counter to ensure uniqueness,
 * even when generated in rapid succession.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UUID = void 0;
var UUID = /** @class */ (function () {
    function UUID() {
    }
    /**
     * Generate a unique identifier string
     * Format: timestamp-random-counter
     *
     * @returns A string UUID that is guaranteed to be unique
     */
    UUID.generate = function () {
        // Get current timestamp
        var timestamp = Date.now();
        // Check for clock drift or multiple calls within same millisecond
        if (timestamp <= UUID.lastTimestamp) {
            // Use the last timestamp and increment counter to ensure uniqueness
            timestamp = UUID.lastTimestamp;
            UUID.counter++;
        }
        else {
            // New millisecond, reset counter
            UUID.counter = 0;
            UUID.lastTimestamp = timestamp;
        }
        // Generate a random part
        var random = Math.floor(Math.random() * 0x100000).toString(16).padStart(5, '0');
        // Format: base36 timestamp + random hex + counter
        return "".concat(timestamp.toString(36), "-").concat(random, "-").concat(UUID.counter.toString(36));
    };
    /**
     * Generate a unique identifier with a specific prefix
     * Useful for debugging and identifying entity types
     *
     * @param prefix A string prefix to prepend to the UUID
     * @returns A prefixed unique identifier
     */
    UUID.generateWithPrefix = function (prefix) {
        return "".concat(prefix, "-").concat(UUID.generate());
    };
    /**
     * Generate an entity ID with an optional type hint
     *
     * @param entityType Optional type hint for debugging
     * @returns Entity ID string
     */
    UUID.generateEntityId = function (entityType) {
        return entityType
            ? UUID.generateWithPrefix("ent-".concat(entityType))
            : UUID.generateWithPrefix('ent');
    };
    /**
     * Generate a component type ID
     *
     * @param componentName The name of the component
     * @returns Component type ID string
     */
    UUID.generateComponentId = function (componentName) {
        // Clean the component name to make it URL-safe
        var safeName = componentName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return "comp-".concat(safeName, "-").concat(UUID.generate());
    };
    /**
     * Generate a system ID
     *
     * @param systemName The name of the system
     * @returns System ID string
     */
    UUID.generateSystemId = function (systemName) {
        // Clean the system name to make it URL-safe
        var safeName = systemName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return "sys-".concat(safeName, "-").concat(UUID.generate());
    };
    /**
     * Validate if a string is a properly formatted UUID
     *
     * @param id The string to validate
     * @returns True if the string is a valid UUID format
     */
    UUID.isValid = function (id) {
        // Basic validation for our UUID format
        return /^[a-z]+-[a-z0-9]+-[a-z0-9]{5}-[a-z0-9]+$/.test(id);
    };
    // Counter to ensure uniqueness for multiple IDs generated within the same millisecond
    UUID.counter = 0;
    // Last timestamp used - to detect clock issues and ensure ascending order
    UUID.lastTimestamp = 0;
    return UUID;
}());
exports.UUID = UUID;
