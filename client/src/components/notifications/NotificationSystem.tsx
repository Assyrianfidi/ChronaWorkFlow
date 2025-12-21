declare global {
  interface Window {
    [key: string]: any;
  }
}

/**
 * Advanced Notification System
 * Ultra-modern, accessible, and feature-rich notification management
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/design-system/icons/IconSystem";

export interface Notification {
  id: string;
  type: "success" | "warning" | "error" | "info" | "loading";
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  progress?: number;
  timestamp: Date;
  priority?: "low" | "medium" | "high" | "critical";
  category?: "system" | "user" | "security" | "performance" | "business";
  metadata?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
}

export interface NotificationSystemProps {
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  maxNotifications?: number;
  className?: string;
  enableSound?: boolean;
  enableDesktop?: boolean;
  customStyles?: React.CSSProperties;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  position = "top-right",
  maxNotifications = 5,
  className = "",
  enableSound = true,
  enableDesktop = true,
  customStyles = {},
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const soundEnabled = useRef(enableSound);
  const desktopEnabled = useRef(enableDesktop);

  // Request desktop notification permission
  useEffect(() => {
    if (
      desktopEnabled.current &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // Play notification sound
  const playSound = useCallback((type: Notification["type"]) => {
    if (!soundEnabled.current) return;

    const audio = new Audio();
    switch (type) {
      case "success":
        audio.src =
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT";
        break;
      case "error":
        audio.src =
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT";
        break;
      case "warning":
        audio.src =
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT";
        break;
      default:
        audio.src =
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWT";
    }

    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio play errors
    });
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((notification: Notification) => {
    if (
      !desktopEnabled.current ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    const notificationOptions: NotificationOptions = {
      body: notification.message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: notification.id,
      requireInteraction: notification.persistent,
      silent: !soundEnabled.current,
    };

    const desktopNotification = new Notification(
      notification.title,
      notificationOptions,
    );

    // Auto-close after duration
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        desktopNotification.close();
      }, notification.duration);
    }

    // Handle click
    desktopNotification.onclick = () => {
      desktopNotification.close();
      window.focus();
    };
  }, []);

  // Add notification
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date(),
        priority: notification.priority ?? "medium",
      };

      setNotifications((prev) => {
        const updated = [...prev, newNotification];
        // Keep only the most recent notifications
        return updated.slice(-maxNotifications);
      });

      // Play sound
      playSound(notification.type);

      // Show desktop notification
      showDesktopNotification(newNotification);

      // Auto-remove if not persistent
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [maxNotifications, playSound, showDesktopNotification],
  );

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update notification
  const updateNotification = useCallback(
    (id: string, updates: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      );
    },
    [],
  );

  // Pause/resume auto-dismissal
  const pauseNotifications = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeNotifications = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Get notification icon
  const getNotificationIcon = useCallback(
    (type: Notification["type"], customIcon?: string) => {
      if (customIcon) return customIcon;

      switch (type) {
        case "success":
          return "check-circle";
        case "error":
          return "alert-circle";
        case "warning":
          return "alert-circle";
        case "info":
          return "info-circle";
        case "loading":
          return "spinner";
        default:
          return "info-circle";
      }
    },
    [],
  );

  // Get notification color
  const getNotificationColor = useCallback((type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "loading":
        return "bg-gray-50 border-gray-200 text-gray-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  }, []);

  // Get position styles
  const getPositionStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      pointerEvents: "none",
    };

    switch (position) {
      case "top-right":
        return { ...baseStyles, top: 20, right: 20 };
      case "top-left":
        return { ...baseStyles, top: 20, left: 20 };
      case "bottom-right":
        return { ...baseStyles, bottom: 20, right: 20 };
      case "bottom-left":
        return { ...baseStyles, bottom: 20, left: 20 };
      case "top-center":
        return {
          ...baseStyles,
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "bottom-center":
        return {
          ...baseStyles,
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
        };
      default:
        return { ...baseStyles, top: 20, right: 20 };
    }
  }, [position]);

  // Animation variants
  const notificationVariants = {
    initial: { opacity: 0, y: 50, scale: 0.3 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.9,
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
  };

  return (
    <div
      ref={containerRef}
      className={`notification-system ${className}`}
      style={{ ...getPositionStyles(), ...customStyles }}
      onMouseEnter={pauseNotifications}
      onMouseLeave={resumeNotifications}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className={`notification ${getNotificationColor(notification.type)}`}
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            style={{
              pointerEvents: "auto",
              marginBottom: 12,
              minWidth: 300,
              maxWidth: 400,
              borderRadius: 8,
              border: "1px solid",
              padding: 16,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              backdropFilter: "blur(10px)",
              background: "rgba(255, 255, 255, 0.9)",
            }}
          >
            <div className="notification-content">
              <div
                className="notification-header"
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div className="notification-icon">
                  <Icon
                    name={getNotificationIcon(
                      notification.type,
                      notification.icon,
                    )}
                    size={20}
                    spin={notification.type === "loading"}
                  />
                </div>

                <div className="notification-body" style={{ flex: 1 }}>
                  <div
                    className="notification-title"
                    style={{ fontWeight: 600, marginBottom: 4 }}
                  >
                    {notification.title}
                  </div>

                  {notification.message && (
                    <div
                      className="notification-message"
                      style={{ fontSize: 14, opacity: 0.8 }}
                    >
                      {notification.message}
                    </div>
                  )}

                  {notification.category && (
                    <div
                      className="notification-category"
                      style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}
                    >
                      {notification.category}
                    </div>
                  )}
                </div>

                <div
                  className="notification-actions"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {!notification.persistent && (
                    <button
                      className="notification-close"
                      onClick={() => removeNotification(notification.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.6,
                        padding: 4,
                        borderRadius: 4,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "0.6")
                      }
                    >
                      <Icon name="minus" size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar for loading notifications */}
              {notification.type === "loading" &&
                notification.progress !== undefined && (
                  <div
                    className="notification-progress"
                    style={{ marginTop: 12 }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        height: 3,
                        background: "rgba(0, 0, 0, 0.1)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          height: "100%",
                          background: "currentColor",
                          borderRadius: 2,
                          width: `${Math.max(0, Math.min(100, notification.progress))}%`,
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
                  </div>
                )}

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div
                  className="notification-action-row"
                  style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}
                >
                  {notification.actions.map((action) => {
                    const isPrimary = action.variant === "primary";
                    const isDanger = action.variant === "danger";
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          void action.action();
                          if (!notification.persistent) {
                            removeNotification(notification.id);
                          }
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 4,
                          border: isPrimary ? "none" : "1px solid currentColor",
                          background: isPrimary
                            ? "currentColor"
                            : isDanger
                              ? "rgba(239, 68, 68, 0.1)"
                              : "transparent",
                          color: isPrimary ? "white" : "currentColor",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 500,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          transition: "all 200ms ease",
                        }}
                        aria-label={action.label}
                      >
                        {action.icon && <Icon name={action.icon} size={12} />}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Timestamp */}
              <div
                className="notification-timestamp"
                style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}
              >
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Clear all button when there are many notifications */}
      {notifications.length > 3 && (
        <motion.button
          className="clear-all-notifications"
          onClick={clearNotifications}
          style={{
            position: "absolute",
            top: -40,
            right: 0,
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "6px 12px",
            fontSize: 12,
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            pointerEvents: "auto",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          Clear All ({notifications.length})
        </motion.button>
      )}
    </div>
  );
};

// Notification hook for easy usage
export const useNotification = () => {
  const [notificationSystem, setNotificationSystem] =
    useState<any>(null);

  const showNotification = useCallback(
    (
      type: Notification["type"],
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      if (!notificationSystem) return null;

      return notificationSystem.addNotification({
        type,
        title,
        message,
        ...options,
      });
    },
    [notificationSystem],
  );

  const showSuccess = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      return showNotification("success", title, message, options);
    },
    [showNotification],
  );

  const showError = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      return showNotification("error", title, message, options);
    },
    [showNotification],
  );

  const showWarning = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      return showNotification("warning", title, message, options);
    },
    [showNotification],
  );

  const showInfo = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      return showNotification("info", title, message, options);
    },
    [showNotification],
  );

  const showLoading = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Notification, "type" | "title" | "message">>,
    ) => {
      return showNotification("loading", title, message, {
        ...options,
        persistent: true,
      });
    },
    [showNotification],
  );

  return {
    setNotificationSystem,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
};

// Global notification manager
export class NotificationManager {
  private static instance: NotificationManager;
  private listeners: Set<(notification: Notification) => void> = new Set();
  private notifications: Notification[] = [];

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  addListener(listener: (notification: Notification) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (notification: Notification) => void): void {
    this.listeners.delete(listener);
  }

  notify(notification: Omit<Notification, "id" | "timestamp">): string {
    const fullNotification: Notification = {
      ...notification,
      id: `global-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.notifications.push(fullNotification);
    this.listeners.forEach((listener) => listener(fullNotification));

    return fullNotification.id;
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  clearNotifications(): void {
    this.notifications = [];
  }
}

// Convenience functions for global notifications
export const notify = {
  success: (
    title: string,
    message?: string,
    options?: Partial<Omit<Notification, "type" | "title" | "message">>,
  ) => {
    return NotificationManager.getInstance().notify({
      type: "success",
      title,
      message,
      ...options,
    });
  },
  error: (
    title: string,
    message?: string,
    options?: Partial<Omit<Notification, "type" | "title" | "message">>,
  ) => {
    return NotificationManager.getInstance().notify({
      type: "error",
      title,
      message,
      ...options,
    });
  },
  warning: (
    title: string,
    message?: string,
    options?: Partial<Omit<Notification, "type" | "title" | "message">>,
  ) => {
    return NotificationManager.getInstance().notify({
      type: "warning",
      title,
      message,
      ...options,
    });
  },
  info: (
    title: string,
    message?: string,
    options?: Partial<Omit<Notification, "type" | "title" | "message">>,
  ) => {
    return NotificationManager.getInstance().notify({
      type: "info",
      title,
      message,
      ...options,
    });
  },
  loading: (
    title: string,
    message?: string,
    options?: Partial<Omit<Notification, "type" | "title" | "message">>,
  ) => {
    return NotificationManager.getInstance().notify({
      type: "loading",
      title,
      message,
      persistent: true,
      ...options,
    });
  },
};

export default NotificationSystem;
