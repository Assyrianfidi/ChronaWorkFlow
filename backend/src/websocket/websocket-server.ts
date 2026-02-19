/**
 * WebSocket Server Implementation
 * Real-time communication server
 */

import { EventEmitter } from "events";

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketClient {
  id: string;
  socket: any; // WebSocket instance
  userId?: string;
  connectedAt: number;
  lastActivity: number;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
}

export interface WebSocketOptions {
  port?: number;
  path?: string;
  heartbeatInterval?: number;
  maxConnections?: number;
  enableCompression?: boolean;
}

export class WebSocketServer extends EventEmitter {
  private clients: Map<string, WebSocketClient> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private options: WebSocketOptions;
  private heartbeatInterval?: NodeJS.Timeout;
  private server?: any; // WebSocket server instance

  constructor(options: WebSocketOptions = {}) {
    super();

    this.options = {
      port: 8080,
      path: "/ws",
      heartbeatInterval: 30000, // 30 seconds
      maxConnections: 1000,
      enableCompression: true,
      ...options,
    };

    this.startHeartbeat();
  }

  /**
   * Start the WebSocket server
   */
  start(): void {
    // Mock implementation - in real scenario, this would use ws or socket.io
    this.emit("server:started", {
      port: this.options.port,
      path: this.options.path,
    });
  }

  /**
   * Stop the WebSocket server
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Disconnect all clients
    for (const client of this.clients.values()) {
      this.disconnect(client.id, "Server shutting down");
    }

    this.emit("server:stopped");
  }

  /**
   * Add a client connection
   */
  addClient(socket: any, metadata: Record<string, any> = {}): string {
    const clientId = this.generateClientId();

    const client: WebSocketClient = {
      id: clientId,
      socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata,
    };

    this.clients.set(clientId, client);

    // Set up socket event handlers
    this.setupSocketHandlers(client);

    this.emit("client:connected", client);

    return clientId;
  }

  /**
   * Disconnect a client
   */
  disconnect(clientId: string, reason?: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    // Remove from all rooms
    for (const room of client.subscriptions) {
      this.leaveRoom(clientId, room);
    }

    // Remove client
    this.clients.delete(clientId);

    // Close socket
    if (client.socket && typeof client.socket.close === "function") {
      client.socket.close();
    }

    this.emit("client:disconnected", { clientId, reason });

    return true;
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    try {
      const messageData = {
        ...message,
        timestamp: Date.now(),
        id: message.id || this.generateMessageId(),
      };

      if (client.socket && typeof client.socket.send === "function") {
        client.socket.send(JSON.stringify(messageData));
        client.lastActivity = Date.now();
        return true;
      }
    } catch (error: any) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      this.disconnect(clientId, "Send error");
    }

    return false;
  }

  /**
   * Send message to room
   */
  sendToRoom(
    roomName: string,
    message: WebSocketMessage,
    excludeClientId?: string,
  ): number {
    const room = this.rooms.get(roomName);

    if (!room) {
      return 0;
    }

    let sentCount = 0;

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, message: WebSocketMessage): number {
    let sentCount = 0;

    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        if (this.sendToClient(client.id, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to role
   */
  broadcastToRole(role: string, message: WebSocketMessage): number {
    let sentCount = 0;

    for (const client of this.clients.values()) {
      if (client.metadata?.role === role) {
        if (this.sendToClient(client.id, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to all clients
   */
  broadcast(message: WebSocketMessage, excludeClientId?: string): number {
    let sentCount = 0;

    for (const clientId of this.clients.keys()) {
      if (clientId !== excludeClientId) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Join a room
   */
  joinRoom(clientId: string, roomName: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    // Add room to client subscriptions
    client.subscriptions.add(roomName);

    // Add client to room
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(clientId);

    this.emit("client:joined-room", { clientId, roomName });

    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(clientId: string, roomName: string): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      return false;
    }

    // Remove room from client subscriptions
    client.subscriptions.delete(roomName);

    // Remove client from room
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(clientId);

      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }

    this.emit("client:left-room", { clientId, roomName });

    return true;
  }

  /**
   * Get client by ID
   */
  getClient(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all clients
   */
  getAllClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get clients in room
   */
  getClientsInRoom(roomName: string): WebSocketClient[] {
    const room = this.rooms.get(roomName);

    if (!room) {
      return [];
    }

    return Array.from(room)
      .map((clientId) => this.clients.get(clientId))
      .filter((client): client is WebSocketClient => client !== undefined);
  }

  /**
   * Get room information
   */
  getRoomInfo(roomName: string): {
    name: string;
    clientCount: number;
    clients: WebSocketClient[];
  } {
    const clients = this.getClientsInRoom(roomName);

    return {
      name: roomName,
      clientCount: clients.length,
      clients,
    };
  }

  /**
   * Get server statistics
   */
  getStats(): {
    totalClients: number;
    totalRooms: number;
    connectionsPerRoom: Record<string, number>;
  } {
    const connectionsPerRoom: Record<string, number> = {};

    for (const [roomName, room] of this.rooms.entries()) {
      connectionsPerRoom[roomName] = room.size;
    }

    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      connectionsPerRoom,
    };
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(client: WebSocketClient): void {
    if (!client.socket) {
      return;
    }

    // Message handler
    if (typeof client.socket.on === "function") {
      client.socket.on("message", (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(client, message);
        } catch (error: any) {
          console.error(`Invalid message from client ${client.id}:`, error);
        }
      });

      // Close handler
      client.socket.on("close", () => {
        this.disconnect(client.id, "Connection closed");
      });

      // Error handler
      client.socket.on("error", (error: any) => {
        console.error(`Socket error for client ${client.id}:`, error);
        this.disconnect(client.id, "Socket error");
      });
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(client: WebSocketClient, message: any): void {
    client.lastActivity = Date.now();

    this.emit("message:received", {
      clientId: client.id,
      message,
    });

    // Handle specific message types
    switch (message.type) {
      case "ping":
        this.sendToClient(client.id, {
          type: "pong",
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
        break;

      case "join-room":
        this.joinRoom(client.id, message.data.room);
        break;

      case "leave-room":
        this.leaveRoom(client.id, message.data.room);
        break;

      default:
        // Emit custom message event
        this.emit(`message:${message.type}`, {
          clientId: client.id,
          message,
        });
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.options.heartbeatInterval! * 2; // 2x heartbeat interval

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastActivity > timeout) {
          this.disconnect(clientId, "Heartbeat timeout");
        } else {
          // Send ping
          this.sendToClient(client.id, {
            type: "ping",
            data: { timestamp: now },
            timestamp: Date.now(),
          });
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * Generate client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default WebSocketServer;
