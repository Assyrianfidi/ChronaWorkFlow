import React from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

interface ConfidenceIndicatorProps {
  score: number;
  showLabel?: boolean;
  showExplanation?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score,
  showLabel = true,
  showExplanation = false,
  size = "md",
  className = "",
}) => {
  const getConfidenceConfig = (
    score: number,
  ): {
    level: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    description: string;
  } => {
    if (score >= 80) {
      return {
        level: "High Confidence",
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-300",
        icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
        description:
          "This forecast is highly reliable based on strong data quality and historical accuracy.",
      };
    } else if (score >= 60) {
      return {
        level: "Moderate Confidence",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50 border-yellow-300",
        icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
        description:
          "This forecast is reasonably reliable but may be affected by data limitations or assumptions.",
      };
    } else {
      return {
        level: "Low Confidence",
        color: "text-red-700",
        bgColor: "bg-red-50 border-red-300",
        icon: <Info className="w-4 h-4" aria-hidden="true" />,
        description:
          "This forecast has limited reliability due to data quality issues or high uncertainty.",
      };
    }
  };

  const config = getConfidenceConfig(score);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const barHeight = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div
      className={className}
      role="status"
      aria-label={`Confidence score: ${score}%`}
    >
      <div className="flex items-center gap-3">
        {/* Confidence Score */}
        <div className="flex items-center gap-2">
          <span
            className={`${config.color} ${sizeClasses[size]} font-semibold`}
          >
            {score}%
          </span>
          {showLabel && (
            <Badge
              variant="outline"
              className={`${config.color} flex items-center gap-1`}
            >
              {config.icon}
              {config.level}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-xs">
          <div className={`w-full bg-gray-200 rounded-full ${barHeight[size]}`}>
            <div
              className={`${barHeight[size]} rounded-full transition-all duration-500 ${
                score >= 80
                  ? "bg-green-600"
                  : score >= 60
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }`}
              style={{ width: `${score}%` }}
              role="progressbar"
              aria-label={`Confidence level: ${score}%`}
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={`mt-3 p-3 rounded-lg border ${config.bgColor}`}>
          <p className={`${sizeClasses[size]} ${config.color}`}>
            {config.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConfidenceIndicator;
