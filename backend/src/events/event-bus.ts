/**
 * Event Bus Implementation
 * Simple event emitter for inter-module communication
 */

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, handler: EventHandler<T>): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(handler);
  }

  /**
   * Subscribe to an event once
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    const onceHandler = (data: T) => {
      handler(data);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    const handlers = this.events.get(event);
    if (handlers) {
      const promises = Array.from(handlers).map((handler) => {
        try {
          return Promise.resolve(handler(data));
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
          return Promise.resolve();
        }
      });
      await Promise.all(promises);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.size || 0;
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
}

export default EventBus;
