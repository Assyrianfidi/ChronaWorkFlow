
declare global {
  interface Window {
    [key: string]: any;
  }
}

import { toast } from "sonner";

// Types for offline storage
interface OfflineCache {
  timestamp: number;
  data: any;
  ttl: number; // Time to live in milliseconds
}

interface OfflineQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  endpoint: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

class OfflineService {
  private cacheName = "accubooks-cache-v1";
  private queueName = "accubooks-queue-v1";
  private maxRetries = 3;
  private retryDelay = 5000; // 5 seconds

  constructor() {
    this.initializeServiceWorker();
    this.setupOnlineListener();
  }

  // Initialize service worker for offline support
  private async initializeServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration);
      } catch (error) {
        console.log("Service Worker registration failed:", error);
      }
    }
  }

  // Listen for online/offline events
  private setupOnlineListener() {
    window.addEventListener("online", () => {
      toast.success("Connection restored");
      this.processQueue();
    });

    window.addEventListener("offline", () => {
      toast.warning("Connection lost. Working in offline mode.");
    });
  }

  // Check if online
  get isOnline(): boolean {
    return navigator.onLine;
  }

  // Cache management
  async setCache(key: string, data: any, ttl: number = 300000): Promise<void> {
    // Default 5 minutes
    try {
      const cache: OfflineCache = {
        timestamp: Date.now(),
        data,
        ttl,
      };

      localStorage.setItem(`${this.cacheName}:${key}`, JSON.stringify(cache));
    } catch (error) {
      console.error("Failed to cache data:", error);
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    try {
      const cached = localStorage.getItem(`${this.cacheName}:${key}`);
      if (!cached) return null;

      const cache: OfflineCache = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() - cache.timestamp > cache.ttl) {
        localStorage.removeItem(`${this.cacheName}:${key}`);
        return null;
      }

// @ts-ignore
      return cache.data as T;
    } catch (error) {
      console.error("Failed to retrieve cached data:", error);
      return null;
    }
  }

  async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        localStorage.removeItem(`${this.cacheName}:${key}`);
      } else {
        // Clear all cache
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(this.cacheName)) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  // Queue management for offline actions
  private async getQueue(): Promise<OfflineQueueItem[]> {
    try {
      const queue = localStorage.getItem(this.queueName);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error("Failed to get queue:", error);
      return [];
    }
  }

  private async setQueue(queue: OfflineQueueItem[]): Promise<void> {
    try {
      localStorage.setItem(this.queueName, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to set queue:", error);
    }
  }

  async addToQueue(
    item: Omit<OfflineQueueItem, "id" | "timestamp" | "retryCount">,
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const queueItem: OfflineQueueItem = {
        ...item,
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };

      queue.push(queueItem);
      await this.setQueue(queue);
      toast.info("Action queued for when you're back online");
    } catch (error) {
      console.error("Failed to add to queue:", error);
    }
  }

  async processQueue(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const queue = await this.getQueue();
      const processed: string[] = [];
      const failed: OfflineQueueItem[] = [];

      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          processed.push(item.id);
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);

          if (item.retryCount < this.maxRetries) {
            failed.push({
              ...item,
              retryCount: item.retryCount + 1,
            });
          } else {
            toast.error(`Failed to sync: ${item.endpoint}`);
          }
        }
      }

      // Update queue
      const remainingQueue = queue.filter(
        (item) => !processed.includes(item.id),
      );
      await this.setQueue([...remainingQueue, ...failed]);

      if (processed.length > 0) {
        toast.success(`Synced ${processed.length} item(s)`);
      }
    } catch (error) {
      console.error("Failed to process queue:", error);
    }
  }

  private async processQueueItem(item: OfflineQueueItem): Promise<void> {
    const token = localStorage.getItem("auth-token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    let response: Response;

    switch (item.type) {
      case "create":
        response = await fetch(`/api${item.endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(item.data),
        });
        break;
      case "update":
        response = await fetch(`/api${item.endpoint}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(item.data),
        });
        break;
      case "delete":
        response = await fetch(`/api${item.endpoint}`, {
          method: "DELETE",
          headers,
        });
        break;
      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Get queue status
  async getQueueStatus(): Promise<{ pending: number; failed: number }> {
    try {
      const queue = await this.getQueue();
      const pending = queue.filter((item) => item.retryCount === 0).length;
      const failed = queue.filter(
        (item) => item.retryCount >= this.maxRetries,
      ).length;

      return { pending, failed };
    } catch (error) {
      console.error("Failed to get queue status:", error);
      return { pending: 0, failed: 0 };
    }
  }

  // Clear queue
  async clearQueue(): Promise<void> {
    try {
      localStorage.removeItem(this.queueName);
      toast.info("Queue cleared");
    } catch (error) {
      console.error("Failed to clear queue:", error);
    }
  }

  // Storage quota management
  async getStorageUsage(): Promise<{
    used: number;
    available: number;
    percentage: number;
  }> {
    try {
      if ("storage" in navigator && "estimate" in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const available = estimate.quota || 0;
        const percentage = available > 0 ? (used / available) * 100 : 0;

        return { used, available, percentage };
      }

      // Fallback: estimate based on localStorage
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      return { used, available: 5242880, percentage: (used / 5242880) * 100 }; // 5MB estimated quota
    } catch (error) {
      console.error("Failed to get storage usage:", error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  // Cleanup expired cache
  async cleanupExpiredCache(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.cacheName),
      );
      let cleaned = 0;

      for (const key of keys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cache: OfflineCache = JSON.parse(cached);
          if (Date.now() - cache.timestamp > cache.ttl) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }

      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired cache items`);
      }
    } catch (error) {
      console.error("Failed to cleanup expired cache:", error);
    }
  }
}

// Create singleton instance
export const offlineService = new OfflineService();

// Export types
export type { OfflineCache, OfflineQueueItem };
