import React from "react";

declare global {
  interface Window {
    [key: string]: any;
  }
}

import {
  Activity,
  User,
  FileText,
  Settings,
  AlertTriangle,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type:
    | "login"
    | "report"
    | "user_created"
    | "system"
    | "document"
    | "task"
    | "notification"
    | "approval"
    | "expense"
    | "target";
  message: string;
  timestamp: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  error?: Error;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLoading = false,
  error,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
      case "user_created":
        return User;
      case "report":
      case "document":
        return FileText;
      case "system":
      case "notification":
        return Settings;
      case "task":
      case "target":
        return Activity;
      case "approval":
      case "expense":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "login":
      case "user_created":
        return "text-primary bg-primary/10";
      case "report":
      case "document":
        return "text-success-700 dark:text-success bg-success/10";
      case "system":
      case "notification":
        return "text-info bg-info/10";
      case "task":
      case "target":
        return "text-warning-700 dark:text-warning bg-warning/10";
      case "approval":
      case "expense":
        return "text-destructive dark:text-destructive-500 bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-start space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Failed to load activity</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:text-primary/90"
        >
          Try again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent activity to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);

        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-foreground mb-1">
                {activity.message}
                {activity.user && (
                  <span className="font-medium"> by {activity.user}</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {activity.timestamp}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
