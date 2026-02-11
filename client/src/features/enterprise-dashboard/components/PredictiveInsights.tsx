import React from "react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BellRing,
  Lightbulb,
} from "lucide-react";

interface Insight {
  id: string;
  type: "alert" | "opportunity" | "trend";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  date: string;
  actions?: Array<{ label: string; onClick: () => void }>;
}

export const PredictiveInsights: React.FC = () => {
  const insights: Insight[] = [
    {
      id: "insight-1",
      type: "alert",
      title: "Unusual Expense Increase",
      description:
        "Office supplies expense increased by 42% compared to the previous quarter, exceeding the budget by $12,500.",
      impact: "high",
      date: "2025-11-28",
      actions: [
        { label: "View Details", onClick: () => {} },
        { label: "Set Alert", onClick: () => {} },
      ],
    },
    {
      id: "insight-2",
      type: "opportunity",
      title: "Early Payment Discount Available",
      description:
        "You could save $2,400 by taking advantage of early payment terms with 3 of your top vendors.",
      impact: "medium",
      date: "2025-11-27",
      actions: [{ label: "View Vendors", onClick: () => {} }],
    },
    {
      id: "insight-3",
      type: "trend",
      title: "Seasonal Revenue Pattern Detected",
      description:
        "Historical data shows a consistent 15-20% revenue increase in Q4 over the past 3 years. Consider adjusting inventory and staffing.",
      impact: "medium",
      date: "2025-11-26",
      actions: [{ label: "View Forecast", onClick: () => {} }],
    },
  ];

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case "trend":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      default:
        return <BellRing className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: Insight["impact"]) => {
    switch (impact) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI-Powered Insights</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              Live Analysis
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{getIcon(insight.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {insight.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact.charAt(0).toUpperCase() +
                        insight.impact.slice(1)}{" "}
                      Impact
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {insight.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(insight.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex space-x-2">
                      {insight.actions?.map((action, i) => (
                        <button
                          key={i}
                          onClick={action.onClick}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-center w-full">
            View all insights
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
