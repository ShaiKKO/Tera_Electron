"use strict";
/**
 * TerraFlux - Event Emitter
 *
 * A lightweight, typed event emitter for the ECS architecture.
 * Handles entity lifecycle events, component events, and system events.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = exports.EventEmitter = void 0;
var UUID_1 = require("../utils/UUID");
/**
 * EventEmitter class for subscribing to and emitting events
 */
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        /**
         * Maps event names to a map of subscription tokens and their callbacks
         */
        this.eventMap = new Map();
    }
    /**
     * Subscribe to an event
     *
     * @param eventName The name of the event to subscribe to
     * @param callback The function to call when the event is emitted
     * @returns A subscription token that can be used to unsubscribe
     */
    EventEmitter.prototype.subscribe = function (eventName, callback) {
        // Create event map if it doesn't exist
        if (!this.eventMap.has(eventName)) {
            this.eventMap.set(eventName, new Map());
        }
        // Generate a unique subscription token
        var subscriptionToken = UUID_1.UUID.generateWithPrefix('sub');
        // Add the callback to the event map
        var eventCallbacks = this.eventMap.get(eventName);
        eventCallbacks.set(subscriptionToken, callback);
        return subscriptionToken;
    };
    /**
     * Unsubscribe from an event
     *
     * @param eventName The name of the event to unsubscribe from
     * @param token The subscription token returned from subscribe
     * @returns True if the subscription was successfully removed
     */
    EventEmitter.prototype.unsubscribe = function (eventName, token) {
        // Check if event exists
        var eventCallbacks = this.eventMap.get(eventName);
        if (!eventCallbacks) {
            return false;
        }
        // Remove the subscription
        return eventCallbacks.delete(token);
    };
    /**
     * Emit an event to all subscribers
     *
     * @param eventName The name of the event to emit
     * @param args Arguments to pass to the callback functions
     */
    EventEmitter.prototype.emit = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        // Check if event exists
        var eventCallbacks = this.eventMap.get(eventName);
        if (!eventCallbacks || eventCallbacks.size === 0) {
            return;
        }
        // Call all callbacks
        eventCallbacks.forEach(function (callback) {
            try {
                callback.apply(void 0, args);
            }
            catch (error) {
                console.error("Error in event callback for '".concat(eventName, "':"), error);
            }
        });
    };
    /**
     * Check if an event has subscribers
     *
     * @param eventName The name of the event to check
     * @returns True if the event has subscribers
     */
    EventEmitter.prototype.hasSubscribers = function (eventName) {
        var eventCallbacks = this.eventMap.get(eventName);
        return !!eventCallbacks && eventCallbacks.size > 0;
    };
    /**
     * Get the number of subscribers for an event
     *
     * @param eventName The name of the event to check
     * @returns The number of subscribers for the event
     */
    EventEmitter.prototype.subscriberCount = function (eventName) {
        var eventCallbacks = this.eventMap.get(eventName);
        return eventCallbacks ? eventCallbacks.size : 0;
    };
    /**
     * Remove all subscriptions for an event
     *
     * @param eventName The name of the event to clear
     */
    EventEmitter.prototype.clearEvent = function (eventName) {
        var eventCallbacks = this.eventMap.get(eventName);
        if (eventCallbacks) {
            eventCallbacks.clear();
        }
    };
    /**
     * Remove all subscriptions for all events
     */
    EventEmitter.prototype.clearAllEvents = function () {
        this.eventMap.forEach(function (eventCallbacks) {
            eventCallbacks.clear();
        });
        this.eventMap.clear();
    };
    /**
     * Get a list of all active event names
     *
     * @returns Array of event names with subscribers
     */
    EventEmitter.prototype.getActiveEvents = function () {
        var _this = this;
        return Array.from(this.eventMap.keys()).filter(function (eventName) { return _this.subscriberCount(eventName) > 0; });
    };
    /**
     * Create a subscription that automatically unsubscribes when the provided
     * lifespan object is destroyed. Useful for creating subscriptions tied to
     * the lifecycle of a system or component.
     *
     * @param eventName The name of the event to subscribe to
     * @param callback The function to call when the event is emitted
     * @param lifespan An object with a method to register destruction callbacks
     * @returns A subscription token that can be used to unsubscribe
     */
    EventEmitter.prototype.subscribeWithLifespan = function (eventName, callback, lifespan) {
        var _this = this;
        var token = this.subscribe(eventName, callback);
        // When the lifespan object is destroyed, unsubscribe
        // Support both System's addDestroyCallback and other objects' onDestroy
        var registerCallback = lifespan.addDestroyCallback || lifespan.onDestroy;
        if (registerCallback) {
            registerCallback.call(lifespan, function () {
                _this.unsubscribe(eventName, token);
            });
        }
        else {
            console.warn('Lifespan object does not have addDestroyCallback or onDestroy method');
        }
        return token;
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
// Create a global event emitter instance
exports.eventEmitter = new EventEmitter();
