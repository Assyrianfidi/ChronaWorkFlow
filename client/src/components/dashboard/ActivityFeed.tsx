import React from 'react'

declare global {
  interface Window {
    [key: string]: any;
  }
}

;
;
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
        return "text-blue-600 bg-blue-50";
      case "report":
      case "document":
        return "text-green-600 bg-green-50";
      case "system":
      case "notification":
        return "text-purple-600 bg-purple-50";
      case "task":
      case "target":
        return "text-orange-600 bg-orange-50";
      case "approval":
      case "expense":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Failed to load activity</div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
              <div className="text-sm text-gray-900 mb-1">
                {activity.message}
                {activity.user && (
                  <span className="font-medium"> by {activity.user}</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{activity.timestamp}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
