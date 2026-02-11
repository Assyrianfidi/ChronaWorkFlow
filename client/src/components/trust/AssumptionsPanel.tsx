import React from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Info, AlertTriangle, TrendingUp } from "lucide-react";

interface Assumption {
  key: string;
  value: number | string;
  sensitivity: "HIGH" | "MEDIUM" | "LOW";
  description?: string;
  source?: string;
  lastUpdated?: string;
}

interface AssumptionsPanelProps {
  assumptions: Assumption[];
  title?: string;
  description?: string;
  className?: string;
}

export const AssumptionsPanel: React.FC<AssumptionsPanelProps> = ({
  assumptions,
  title = "Key Assumptions",
  description = "These assumptions drive the forecast calculations",
  className = "",
}) => {
  const getSensitivityConfig = (
    sensitivity: string,
  ): {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    label: string;
  } => {
    switch (sensitivity.toUpperCase()) {
      case "HIGH":
        return {
          icon: <AlertTriangle className="w-4 h-4" aria-hidden="true" />,
          color: "text-red-700",
          bgColor: "bg-red-50 border-red-200",
          label: "High Sensitivity",
        };
      case "MEDIUM":
        return {
          icon: <TrendingUp className="w-4 h-4" aria-hidden="true" />,
          color: "text-yellow-700",
          bgColor: "bg-yellow-50 border-yellow-200",
          label: "Medium Sensitivity",
        };
      case "LOW":
        return {
          icon: <Info className="w-4 h-4" aria-hidden="true" />,
          color: "text-blue-700",
          bgColor: "bg-blue-50 border-blue-200",
          label: "Low Sensitivity",
        };
      default:
        return {
          icon: <Info className="w-4 h-4" aria-hidden="true" />,
          color: "text-gray-700",
          bgColor: "bg-gray-50 border-gray-200",
          label: "Unknown Sensitivity",
        };
    }
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return value;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-2">{description}</p>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {assumptions.map((assumption, index) => {
            const sensitivityConfig = getSensitivityConfig(
              assumption.sensitivity,
            );

            return (
              <article
                key={index}
                className={`p-4 rounded-lg border ${sensitivityConfig.bgColor}`}
                aria-labelledby={`assumption-${index}-title`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4
                      id={`assumption-${index}-title`}
                      className="text-sm font-semibold text-gray-900"
                    >
                      {assumption.key.replace(/_/g, " ")}
                    </h4>
                    {assumption.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {assumption.description}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    <Badge
                      variant="outline"
                      className={`${sensitivityConfig.color} flex items-center gap-1`}
                    >
                      {sensitivityConfig.icon}
                      <span className="sr-only">Sensitivity: </span>
                      {assumption.sensitivity}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Value</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatValue(assumption.value)}
                    </p>
                  </div>

                  {assumption.source && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Source</p>
                      <p className="text-xs font-medium text-gray-900">
                        {assumption.source}
                      </p>
                    </div>
                  )}

                  {assumption.lastUpdated && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Last Updated</p>
                      <p className="text-xs font-medium text-gray-900">
                        {formatDate(assumption.lastUpdated)}
                      </p>
                    </div>
                  )}
                </div>

                {assumption.sensitivity === "HIGH" && (
                  <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-900">
                    <strong>High Sensitivity:</strong> Small changes to this
                    value significantly impact the forecast. Review carefully.
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* Sensitivity Guide */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Understanding Sensitivity
          </h4>
          <dl className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <dt className="font-medium text-red-700 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                High:
              </dt>
              <dd className="text-gray-700">
                Small changes significantly impact the forecast
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="font-medium text-yellow-700 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                Medium:
              </dt>
              <dd className="text-gray-700">
                Moderate impact on forecast accuracy
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="font-medium text-blue-700 flex items-center gap-1">
                <Info className="w-4 h-4" aria-hidden="true" />
                Low:
              </dt>
              <dd className="text-gray-700">
                Minimal impact on overall forecast
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssumptionsPanel;
