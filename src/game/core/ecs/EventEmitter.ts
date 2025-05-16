/**
 * TerraFlux - Event Emitter
 * 
 * A lightweight, typed event emitter for the ECS architecture.
 * Handles entity lifecycle events, component events, and system events.
 */

import { UUID } from '../utils/UUID';
import { EventCallback, SubscriptionToken } from './types';

/**
 * EventEmitter class for subscribing to and emitting events
 */
export class EventEmitter {
  /**
   * Maps event names to a map of subscription tokens and their callbacks
   */
  private eventMap: Map<string, Map<SubscriptionToken, EventCallback>> = new Map();
  
  /**
   * Subscribe to an event
   * 
   * @param eventName The name of the event to subscribe to
   * @param callback The function to call when the event is emitted
   * @returns A subscription token that can be used to unsubscribe
   */
  public subscribe(eventName: string, callback: EventCallback): SubscriptionToken {
    // Create event map if it doesn't exist
    if (!this.eventMap.has(eventName)) {
      this.eventMap.set(eventName, new Map());
    }
    
    // Generate a unique subscription token
    const subscriptionToken: SubscriptionToken = UUID.generateWithPrefix('sub');
    
    // Add the callback to the event map
    const eventCallbacks = this.eventMap.get(eventName)!;
    eventCallbacks.set(subscriptionToken, callback);
    
    return subscriptionToken;
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param eventName The name of the event to unsubscribe from
   * @param token The subscription token returned from subscribe
   * @returns True if the subscription was successfully removed
   */
  public unsubscribe(eventName: string, token: SubscriptionToken): boolean {
    // Check if event exists
    const eventCallbacks = this.eventMap.get(eventName);
    if (!eventCallbacks) {
      return false;
    }
    
    // Remove the subscription
    return eventCallbacks.delete(token);
  }
  
  /**
   * Emit an event to all subscribers
   * 
   * @param eventName The name of the event to emit
   * @param args Arguments to pass to the callback functions
   */
  public emit(eventName: string, ...args: any[]): void {
    // Check if event exists
    const eventCallbacks = this.eventMap.get(eventName);
    if (!eventCallbacks || eventCallbacks.size === 0) {
      return;
    }
    
    // Call all callbacks
    eventCallbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event callback for '${eventName}':`, error);
      }
    });
  }
  
  /**
   * Check if an event has subscribers
   * 
   * @param eventName The name of the event to check
   * @returns True if the event has subscribers
   */
  public hasSubscribers(eventName: string): boolean {
    const eventCallbacks = this.eventMap.get(eventName);
    return !!eventCallbacks && eventCallbacks.size > 0;
  }
  
  /**
   * Get the number of subscribers for an event
   * 
   * @param eventName The name of the event to check
   * @returns The number of subscribers for the event
   */
  public subscriberCount(eventName: string): number {
    const eventCallbacks = this.eventMap.get(eventName);
    return eventCallbacks ? eventCallbacks.size : 0;
  }
  
  /**
   * Remove all subscriptions for an event
   * 
   * @param eventName The name of the event to clear
   */
  public clearEvent(eventName: string): void {
    const eventCallbacks = this.eventMap.get(eventName);
    if (eventCallbacks) {
      eventCallbacks.clear();
    }
  }
  
  /**
   * Remove all subscriptions for all events
   */
  public clearAllEvents(): void {
    this.eventMap.forEach(eventCallbacks => {
      eventCallbacks.clear();
    });
    this.eventMap.clear();
  }
  
  /**
   * Get a list of all active event names
   * 
   * @returns Array of event names with subscribers
   */
  public getActiveEvents(): string[] {
    return Array.from(this.eventMap.keys()).filter(
      eventName => this.subscriberCount(eventName) > 0
    );
  }
  
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
  public subscribeWithLifespan(
    eventName: string,
    callback: EventCallback,
    lifespan: { addDestroyCallback?: (callback: () => void) => void, onDestroy?: (callback: () => void) => void }
  ): SubscriptionToken {
    const token = this.subscribe(eventName, callback);
    
    // When the lifespan object is destroyed, unsubscribe
    // Support both System's addDestroyCallback and other objects' onDestroy
    const registerCallback = lifespan.addDestroyCallback || lifespan.onDestroy;
    
    if (registerCallback) {
      registerCallback.call(lifespan, () => {
        this.unsubscribe(eventName, token);
      });
    } else {
      console.warn('Lifespan object does not have addDestroyCallback or onDestroy method');
    }
    
    return token;
  }
}

// Create a global event emitter instance
export const eventEmitter = new EventEmitter();
