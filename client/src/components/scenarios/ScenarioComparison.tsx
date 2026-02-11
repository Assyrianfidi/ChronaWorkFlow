import React, { useEffect, useState } from "react";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

interface ScenarioData {
  id: string;
  name: string;
  type: string;
  riskLevel: string;
  riskScore: number;
  projectedImpact: {
    runwayDays?: number;
    monthlyBurnIncrease?: number;
    monthlyRevenueIncrease?: number;
    oneTimeImpact?: number;
  };
  parameters: Record<string, any>;
  status: string;
}

interface ScenarioComparisonProps {
  scenarioIds: string[];
  className?: string;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenarioIds,
  className = "",
}) => {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises = scenarioIds.map((id) =>
          fetch(`/api/scenarios/${id}`, {
            headers: { "Content-Type": "application/json" },
          }).then((res) => res.json()),
        );

        const data = await Promise.all(promises);
        setScenarios(data);
      } catch (err) {
        console.error("Error fetching scenarios:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (scenarioIds.length > 0) {
      fetchScenarios();
    } else {
      setLoading(false);
    }
  }, [scenarioIds]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDelta = (
    value1: number | undefined,
    value2: number | undefined,
  ): {
    value: number;
    percentage: number;
    direction: "up" | "down" | "neutral";
  } | null => {
    if (value1 === undefined || value2 === undefined) return null;
    const delta = value2 - value1;
    const percentage = value1 !== 0 ? (delta / Math.abs(value1)) * 100 : 0;
    const direction = delta > 0 ? "up" : delta < 0 ? "down" : "neutral";
    return { value: delta, percentage, direction };
  };

  const getDeltaIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return <ArrowUp className="w-4 h-4" aria-hidden="true" />;
      case "down":
        return <ArrowDown className="w-4 h-4" aria-hidden="true" />;
      default:
        return <Minus className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const getDeltaColor = (
    direction: "up" | "down" | "neutral",
    isPositive: boolean,
  ) => {
    if (direction === "neutral") return "text-gray-600";
    return (direction === "up" && isPositive) ||
      (direction === "down" && !isPositive)
      ? "text-green-600"
      : "text-red-600";
  };

  const getRiskColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case "CRITICAL":
        return "text-red-700 bg-red-50 border-red-300";
      case "HIGH":
        return "text-orange-700 bg-orange-50 border-orange-300";
      case "MEDIUM":
        return "text-yellow-700 bg-yellow-50 border-yellow-300";
      case "LOW":
        return "text-green-700 bg-green-50 border-green-300";
      default:
        return "text-gray-700 bg-gray-50 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <LoadingState label="Loading scenario comparison..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertCircle className="w-6 h-6" />}
            title="Unable to load scenarios"
            description={error}
          />
        </CardContent>
      </Card>
    );
  }

  if (scenarios.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<TrendingUp className="w-6 h-6" />}
            title="No scenarios to compare"
            description="Select at least two scenarios to see a side-by-side comparison"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of {scenarios.length} scenarios
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Scenario comparison table showing key metrics and differences
              </caption>
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th
                    scope="col"
                    className="text-left p-4 text-sm font-semibold text-gray-700 bg-gray-50"
                  >
                    Metric
                  </th>
                  {scenarios.map((scenario) => (
                    <th
                      key={scenario.id}
                      scope="col"
                      className="text-left p-4 text-sm font-semibold text-gray-700 bg-gray-50"
                    >
                      {scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Scenario Type */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Type
                  </th>
                  {scenarios.map((scenario) => (
                    <td key={scenario.id} className="p-4">
                      <Badge variant="outline">
                        {scenario.type.replace("_", " ")}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* Risk Level */}
                <tr className="bg-gray-50">
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Risk Level
                  </th>
                  {scenarios.map((scenario) => (
                    <td key={scenario.id} className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                          scenario.riskLevel,
                        )}`}
                      >
                        {scenario.riskLevel}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Risk Score */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Risk Score
                  </th>
                  {scenarios.map((scenario, index) => {
                    const delta =
                      index > 0
                        ? getDelta(scenarios[0].riskScore, scenario.riskScore)
                        : null;
                    return (
                      <td key={scenario.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {scenario.riskScore}
                          </span>
                          {delta && (
                            <span
                              className={`flex items-center text-xs font-medium ${getDeltaColor(
                                delta.direction,
                                false,
                              )}`}
                            >
                              {getDeltaIcon(delta.direction)}
                              {Math.abs(delta.value).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Runway Impact */}
                <tr className="bg-gray-50">
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Runway Impact
                  </th>
                  {scenarios.map((scenario, index) => {
                    const runwayDays = scenario.projectedImpact.runwayDays;
                    const delta =
                      index > 0 && runwayDays !== undefined
                        ? getDelta(
                            scenarios[0].projectedImpact.runwayDays,
                            runwayDays,
                          )
                        : null;
                    return (
                      <td key={scenario.id} className="p-4">
                        {runwayDays !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                runwayDays >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {runwayDays >= 0 ? "+" : ""}
                              {runwayDays} days
                            </span>
                            {delta && (
                              <span
                                className={`flex items-center text-xs font-medium ${getDeltaColor(
                                  delta.direction,
                                  true,
                                )}`}
                              >
                                {getDeltaIcon(delta.direction)}
                                {Math.abs(delta.value).toFixed(0)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Monthly Burn Impact */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Monthly Burn Impact
                  </th>
                  {scenarios.map((scenario, index) => {
                    const burnIncrease =
                      scenario.projectedImpact.monthlyBurnIncrease;
                    const delta =
                      index > 0 && burnIncrease !== undefined
                        ? getDelta(
                            scenarios[0].projectedImpact.monthlyBurnIncrease,
                            burnIncrease,
                          )
                        : null;
                    return (
                      <td key={scenario.id} className="p-4">
                        {burnIncrease !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                burnIncrease <= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {burnIncrease >= 0 ? "+" : ""}
                              {formatCurrency(burnIncrease)}
                            </span>
                            {delta && (
                              <span
                                className={`flex items-center text-xs font-medium ${getDeltaColor(
                                  delta.direction,
                                  false,
                                )}`}
                              >
                                {getDeltaIcon(delta.direction)}
                                {formatCurrency(Math.abs(delta.value))}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Monthly Revenue Impact */}
                <tr className="bg-gray-50">
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Monthly Revenue Impact
                  </th>
                  {scenarios.map((scenario, index) => {
                    const revenueIncrease =
                      scenario.projectedImpact.monthlyRevenueIncrease;
                    const delta =
                      index > 0 && revenueIncrease !== undefined
                        ? getDelta(
                            scenarios[0].projectedImpact.monthlyRevenueIncrease,
                            revenueIncrease,
                          )
                        : null;
                    return (
                      <td key={scenario.id} className="p-4">
                        {revenueIncrease !== undefined ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                revenueIncrease >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {revenueIncrease >= 0 ? "+" : ""}
                              {formatCurrency(revenueIncrease)}
                            </span>
                            {delta && (
                              <span
                                className={`flex items-center text-xs font-medium ${getDeltaColor(
                                  delta.direction,
                                  true,
                                )}`}
                              >
                                {getDeltaIcon(delta.direction)}
                                {formatCurrency(Math.abs(delta.value))}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Status */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 text-sm font-medium text-gray-900"
                  >
                    Status
                  </th>
                  {scenarios.map((scenario) => (
                    <td key={scenario.id} className="p-4">
                      <Badge
                        variant={
                          scenario.status === "COMPLETED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {scenario.status}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Understanding Deltas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <ArrowUp
                  className="w-4 h-4 text-green-600"
                  aria-hidden="true"
                />
                <span className="text-gray-700">
                  Green up arrow: Improvement vs. baseline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDown
                  className="w-4 h-4 text-red-600"
                  aria-hidden="true"
                />
                <span className="text-gray-700">
                  Red down arrow: Decline vs. baseline
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-gray-600" aria-hidden="true" />
                <span className="text-gray-700">No change vs. baseline</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              * The first scenario serves as the baseline for comparison
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioComparison;
