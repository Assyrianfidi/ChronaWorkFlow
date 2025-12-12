"use strict";
/**
 * WebSocket Server Implementation
 * Real-time communication server
 */
var __extends =
  (this && this.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b)
            if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError(
          "Class extends value " + String(b) + " is not a constructor or null",
        );
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
var events_1 = require("events");
var WebSocketServer = /** @class */ (function (_super) {
  __extends(WebSocketServer, _super);
  function WebSocketServer(options) {
    if (options === void 0) {
      options = {};
    }
    var _this = _super.call(this) || this;
    _this.clients = new Map();
    _this.rooms = new Map();
    _this.options = __assign(
      {
        port: 8080,
        path: "/ws",
        heartbeatInterval: 30000,
        maxConnections: 1000,
        enableCompression: true,
      },
      options,
    );
    _this.startHeartbeat();
    return _this;
  }
  /**
   * Start the WebSocket server
   */
  WebSocketServer.prototype.start = function () {
    // Mock implementation - in real scenario, this would use ws or socket.io
    this.emit("server:started", {
      port: this.options.port,
      path: this.options.path,
    });
  };
  /**
   * Stop the WebSocket server
   */
  WebSocketServer.prototype.stop = function () {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    // Disconnect all clients
    for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
      var client = _a[_i];
      this.disconnect(client.id, "Server shutting down");
    }
    this.emit("server:stopped");
  };
  /**
   * Add a client connection
   */
  WebSocketServer.prototype.addClient = function (socket, metadata) {
    if (metadata === void 0) {
      metadata = {};
    }
    var clientId = this.generateClientId();
    var client = {
      id: clientId,
      socket: socket,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      subscriptions: new Set(),
      metadata: metadata,
    };
    this.clients.set(clientId, client);
    // Set up socket event handlers
    this.setupSocketHandlers(client);
    this.emit("client:connected", client);
    return clientId;
  };
  /**
   * Disconnect a client
   */
  WebSocketServer.prototype.disconnect = function (clientId, reason) {
    var client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    // Remove from all rooms
    for (var _i = 0, _a = client.subscriptions; _i < _a.length; _i++) {
      var room = _a[_i];
      this.leaveRoom(clientId, room);
    }
    // Remove client
    this.clients.delete(clientId);
    // Close socket
    if (client.socket && typeof client.socket.close === "function") {
      client.socket.close();
    }
    this.emit("client:disconnected", { clientId: clientId, reason: reason });
    return true;
  };
  /**
   * Send message to specific client
   */
  WebSocketServer.prototype.sendToClient = function (clientId, message) {
    var client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    try {
      var messageData = __assign(__assign({}, message), {
        timestamp: Date.now(),
        id: message.id || this.generateMessageId(),
      });
      if (client.socket && typeof client.socket.send === "function") {
        client.socket.send(JSON.stringify(messageData));
        client.lastActivity = Date.now();
        return true;
      }
    } catch (error) {
      console.error(
        "Failed to send message to client ".concat(clientId, ":"),
        error,
      );
      this.disconnect(clientId, "Send error");
    }
    return false;
  };
  /**
   * Send message to room
   */
  WebSocketServer.prototype.sendToRoom = function (
    roomName,
    message,
    excludeClientId,
  ) {
    var room = this.rooms.get(roomName);
    if (!room) {
      return 0;
    }
    var sentCount = 0;
    for (var _i = 0, room_1 = room; _i < room_1.length; _i++) {
      var clientId = room_1[_i];
      if (clientId !== excludeClientId) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }
    return sentCount;
  };
  /**
   * Send message to specific user
   */
  WebSocketServer.prototype.sendToUser = function (userId, message) {
    var sentCount = 0;
    for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
      var client = _a[_i];
      if (client.userId === userId) {
        if (this.sendToClient(client.id, message)) {
          sentCount++;
        }
      }
    }
    return sentCount;
  };
  /**
   * Broadcast message to role
   */
  WebSocketServer.prototype.broadcastToRole = function (role, message) {
    var _a;
    var sentCount = 0;
    for (var _i = 0, _b = this.clients.values(); _i < _b.length; _i++) {
      var client = _b[_i];
      if (
        ((_a = client.metadata) === null || _a === void 0
          ? void 0
          : _a.role) === role
      ) {
        if (this.sendToClient(client.id, message)) {
          sentCount++;
        }
      }
    }
    return sentCount;
  };
  /**
   * Broadcast message to all clients
   */
  WebSocketServer.prototype.broadcast = function (message, excludeClientId) {
    var sentCount = 0;
    for (var _i = 0, _a = this.clients.keys(); _i < _a.length; _i++) {
      var clientId = _a[_i];
      if (clientId !== excludeClientId) {
        if (this.sendToClient(clientId, message)) {
          sentCount++;
        }
      }
    }
    return sentCount;
  };
  /**
   * Join a room
   */
  WebSocketServer.prototype.joinRoom = function (clientId, roomName) {
    var client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    // Add room to client subscriptions
    client.subscriptions.add(roomName);
    // Add client to room
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName).add(clientId);
    this.emit("client:joined-room", { clientId: clientId, roomName: roomName });
    return true;
  };
  /**
   * Leave a room
   */
  WebSocketServer.prototype.leaveRoom = function (clientId, roomName) {
    var client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    // Remove room from client subscriptions
    client.subscriptions.delete(roomName);
    // Remove client from room
    var room = this.rooms.get(roomName);
    if (room) {
      room.delete(clientId);
      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
    this.emit("client:left-room", { clientId: clientId, roomName: roomName });
    return true;
  };
  /**
   * Get client by ID
   */
  WebSocketServer.prototype.getClient = function (clientId) {
    return this.clients.get(clientId);
  };
  /**
   * Get all clients
   */
  WebSocketServer.prototype.getAllClients = function () {
    return Array.from(this.clients.values());
  };
  /**
   * Get clients in room
   */
  WebSocketServer.prototype.getClientsInRoom = function (roomName) {
    var _this = this;
    var room = this.rooms.get(roomName);
    if (!room) {
      return [];
    }
    return Array.from(room)
      .map(function (clientId) {
        return _this.clients.get(clientId);
      })
      .filter(function (client) {
        return client !== undefined;
      });
  };
  /**
   * Get room information
   */
  WebSocketServer.prototype.getRoomInfo = function (roomName) {
    var clients = this.getClientsInRoom(roomName);
    return {
      name: roomName,
      clientCount: clients.length,
      clients: clients,
    };
  };
  /**
   * Get server statistics
   */
  WebSocketServer.prototype.getStats = function () {
    var connectionsPerRoom = {};
    for (var _i = 0, _a = this.rooms.entries(); _i < _a.length; _i++) {
      var _b = _a[_i],
        roomName = _b[0],
        room = _b[1];
      connectionsPerRoom[roomName] = room.size;
    }
    return {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      connectionsPerRoom: connectionsPerRoom,
    };
  };
  /**
   * Set up socket event handlers
   */
  WebSocketServer.prototype.setupSocketHandlers = function (client) {
    var _this = this;
    if (!client.socket) {
      return;
    }
    // Message handler
    if (typeof client.socket.on === "function") {
      client.socket.on("message", function (data) {
        try {
          var message = JSON.parse(data.toString());
          _this.handleMessage(client, message);
        } catch (error) {
          console.error(
            "Invalid message from client ".concat(client.id, ":"),
            error,
          );
        }
      });
      // Close handler
      client.socket.on("close", function () {
        _this.disconnect(client.id, "Connection closed");
      });
      // Error handler
      client.socket.on("error", function (error) {
        console.error("Socket error for client ".concat(client.id, ":"), error);
        _this.disconnect(client.id, "Socket error");
      });
    }
  };
  /**
   * Handle incoming message
   */
  WebSocketServer.prototype.handleMessage = function (client, message) {
    client.lastActivity = Date.now();
    this.emit("message:received", {
      clientId: client.id,
      message: message,
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
        this.emit("message:".concat(message.type), {
          clientId: client.id,
          message: message,
        });
    }
  };
  /**
   * Start heartbeat monitoring
   */
  WebSocketServer.prototype.startHeartbeat = function () {
    var _this = this;
    this.heartbeatInterval = setInterval(function () {
      var now = Date.now();
      var timeout = _this.options.heartbeatInterval * 2; // 2x heartbeat interval
      for (var _i = 0, _a = _this.clients.entries(); _i < _a.length; _i++) {
        var _b = _a[_i],
          clientId = _b[0],
          client = _b[1];
        if (now - client.lastActivity > timeout) {
          _this.disconnect(clientId, "Heartbeat timeout");
        } else {
          // Send ping
          _this.sendToClient(client.id, {
            type: "ping",
            data: { timestamp: now },
            timestamp: Date.now(),
          });
        }
      }
    }, this.options.heartbeatInterval);
  };
  /**
   * Generate client ID
   */
  WebSocketServer.prototype.generateClientId = function () {
    return "client_"
      .concat(Date.now(), "_")
      .concat(Math.random().toString(36).substr(2, 9));
  };
  /**
   * Generate message ID
   */
  WebSocketServer.prototype.generateMessageId = function () {
    return "msg_"
      .concat(Date.now(), "_")
      .concat(Math.random().toString(36).substr(2, 9));
  };
  return WebSocketServer;
})(events_1.EventEmitter);
exports.WebSocketServer = WebSocketServer;
exports.default = WebSocketServer;
