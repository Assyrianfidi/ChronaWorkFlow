declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useUserExperienceMode } from "./UserExperienceMode";
import { usePerformance } from "./UI-Performance-Engine";
import { cn } from "@/lib/utils";

// Notification types
export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  progress?: number;
  icon?: React.ReactNode;
  sound?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

const NotificationContext = React.createContext<NotificationContextType | null>(
  null,
);

// Notification type configurations
const NOTIFICATION_CONFIGS = {
  success: {
    icon: "✅",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-800 dark:text-green-200",
    iconColor: "text-green-600 dark:text-green-400",
    sound: "success",
  },
  error: {
    icon: "❌",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-800 dark:text-red-200",
    iconColor: "text-red-600 dark:text-red-400",
    sound: "error",
  },
  warning: {
    icon: "⚠️",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-800 dark:text-yellow-200",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    sound: "warning",
  },
  info: {
    icon: "ℹ️",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-800 dark:text-blue-200",
    iconColor: "text-blue-600 dark:text-blue-400",
    sound: "info",
  },
  loading: {
    icon: "⏳",
    bgColor: "bg-gray-50 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
    textColor: "text-gray-800 dark:text-gray-200",
    iconColor: "text-gray-600 dark:text-gray-400",
    sound: null,
  },
};

export function NotificationSystem({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context for sounds
  useEffect(() => {
    if (
      currentMode.sounds &&
      typeof window !== "undefined" &&
      !audioContextRef.current
    ) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [currentMode.sounds]);

  // Play notification sound
  const playSound = useCallback(
    (type: NotificationType) => {
      if (
        !currentMode.sounds ||
        !audioContextRef.current ||
        isLowPerformanceMode
      )
        return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        error: 300,
        warning: 600,
        info: 500,
        loading: 400,
      };

      oscillator.frequency.value = frequencies[type] || 500;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.1,
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    },
    [currentMode.sounds, isLowPerformanceMode],
  );

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = { ...notification, id };

      setNotifications((prev) => {
        // Remove oldest notifications if too many
        const maxNotifications = isLowPerformanceMode ? 3 : 5;
        const filtered =
          prev.length >= maxNotifications
            ? prev.slice(-maxNotifications + 1)
            : prev;
        return [...filtered, newNotification];
      });

      // Play sound if enabled
      if (notification.type) {
        playSound(notification.type);
      }

      // Auto-remove notification after duration
      if (
        notification.duration &&
        notification.duration > 0 &&
        !notification.persistent
      ) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, notification.duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [playSound, isLowPerformanceMode],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const updateNotification = useCallback(
    (id: string, updates: Partial<Notification>) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, ...updates }
            : notification,
        ),
      );
    },
    [],
  );

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    updateNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationSystem");
  }
  return context;
}

// Notification Container Component
function NotificationContainer() {
  const { notifications } = useNotifications();
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();

  if (notifications.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          reducedMotion={
            isLowPerformanceMode || currentMode.animations === "minimal"
          }
          enhancedAnimation={currentMode.animations === "enhanced"}
        />
      ))}
    </div>,
    document.body,
  );
}

// Individual Notification Item
function NotificationItem({
  notification,
  reducedMotion,
  enhancedAnimation,
}: {
  notification: Notification;
  reducedMotion: boolean;
  enhancedAnimation: boolean;
}) {
  const { removeNotification, updateNotification } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const config = NOTIFICATION_CONFIGS[notification.type];
  const isHighPriority =
    notification.priority === "high" || notification.priority === "critical";

  // Animate progress bar for loading notifications
  useEffect(() => {
    if (
      notification.type === "loading" &&
      notification.progress !== undefined &&
      progressRef.current
    ) {
      progressRef.current.style.width = `${notification.progress}%`;
    }
  }, [notification.progress]);

  const handleRemove = useCallback(() => {
    if (!notification.persistent) {
      removeNotification(notification.id);
    }
  }, [notification.id, notification.persistent, removeNotification]);

  const handleAction = useCallback(
    (action: NotificationAction) => {
      action.action();
      if (!notification.persistent) {
        removeNotification(notification.id);
      }
    },
    [
      notification.actions,
      notification.id,
      notification.persistent,
      removeNotification,
    ],
  );

  const animationClasses =
    enhancedAnimation && !reducedMotion
      ? "animate-slide-in-right"
      : reducedMotion
        ? "transition-none"
        : "transition-all duration-300";

  const liveMode =
    notification.type === "error" ? ("assertive" as const) : ("polite" as const);
  const landmarkRole =
    notification.type === "error" ? ("alert" as const) : ("status" as const);

  return (
    <div
      className={cn(
        "notification-item pointer-events-auto max-w-sm w-full shadow-lg rounded-lg border p-4",
        config.bgColor,
        config.borderColor,
        animationClasses,
        isHighPriority && "ring-2 ring-red-500 ring-opacity-50",
        notification.type === "loading" && "overflow-hidden",
      )}
      role={landmarkRole}
      aria-live={liveMode}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0 text-lg", config.iconColor)}>
          {notification.icon || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={cn("font-semibold text-sm", config.textColor)}>
                {notification.title}
              </h4>
              {notification.message && (
                <p
                  className={cn("text-sm mt-1", config.textColor, "opacity-80")}
                >
                  {notification.message}
                </p>
              )}
            </div>
            {!notification.persistent && (
              <button
                type="button"
                onClick={handleRemove}
                className={cn(
                  "flex-shrink-0 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors",
                  config.textColor,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            )}
          </div>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => handleAction(action)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    action.variant === "primary"
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : action.variant === "danger"
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Loading Notifications */}
      {notification.type === "loading" &&
        notification.progress !== undefined && (
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
            <div
              ref={progressRef}
              className="bg-blue-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${notification.progress}%` }}
            />
          </div>
        )}
    </div>
  );
}

// Notification Hook for easy usage
export function useNotification() {
  const { addNotification, removeNotification, updateNotification } =
    useNotifications();

  const notify = useCallback(
    (notification: Omit<Notification, "id">) => {
      return addNotification(notification);
    },
    [addNotification],
  );

  const success = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<
        Omit<Notification, "id" | "type" | "title" | "message">
      >,
    ) => {
      return addNotification({ type: "success", title, message, ...options });
    },
    [addNotification],
  );

  const error = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<
        Omit<Notification, "id" | "type" | "title" | "message">
      >,
    ) => {
      return addNotification({ type: "error", title, message, ...options });
    },
    [addNotification],
  );

  const warning = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<
        Omit<Notification, "id" | "type" | "title" | "message">
      >,
    ) => {
      return addNotification({ type: "warning", title, message, ...options });
    },
    [addNotification],
  );

  const info = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<
        Omit<Notification, "id" | "type" | "title" | "message">
      >,
    ) => {
      return addNotification({ type: "info", title, message, ...options });
    },
    [addNotification],
  );

  const loading = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<
        Omit<Notification, "id" | "type" | "title" | "message">
      >,
    ) => {
      return addNotification({
        type: "loading",
        title,
        message,
        persistent: true,
        ...options,
      });
    },
    [addNotification],
  );

  const updateProgress = useCallback(
    (id: string, progress: number) => {
      updateNotification(id, { progress });
    },
    [updateNotification],
  );

  return {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    updateProgress,
    remove: removeNotification,
  };
}

// Toast-style notification component for quick usage
export function Toast({
  type,
  title,
  message,
  duration = 3000,
  ...props
}: Omit<Notification, "id">) {
  const { addNotification } = useNotifications();
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  }, [props]);

  useEffect(() => {
    const id = addNotification({
      type,
      title,
      message,
      duration,
      ...propsRef.current,
    });
    return () => {
      // Cleanup if component unmounts
    };
  }, [type, title, message, duration, addNotification]);

  return null;
}

// Notification Queue for batch operations
export class NotificationQueue {
  private queue: Omit<Notification, "id">[] = [];
  private isProcessing = false;
  private notifications: ReturnType<typeof useNotifications>;

  constructor(notifications: ReturnType<typeof useNotifications>) {
    this.notifications = notifications;
  }

  add(notification: Omit<Notification, "id">) {
    this.queue.push(notification);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const notification = this.queue.shift();
      if (notification) {
        this.notifications.addNotification(notification);
        // Add small delay between notifications to prevent overwhelming
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
  }

  size() {
    return this.queue.length;
  }
}

export default NotificationSystem;
