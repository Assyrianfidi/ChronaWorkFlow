import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, AlertCircle, Info } from "lucide-react";

interface ForecastDataPoint {
  month: string;
  bestCase: number;
  expected: number;
  worstCase: number;
}

interface ForecastResult {
  id: string;
  type: string;
  name: string;
  description: string;
  result: {
    value: number;
    unit: string;
    confidence: number;
  };
  formula: string;
  assumptions: Array<{
    key: string;
    value: number;
    sensitivity: string;
  }>;
  confidenceScore: number;
  projections?: ForecastDataPoint[];
}

interface ForecastResultsViewProps {
  forecastId?: string;
  className?: string;
}

export const ForecastResultsView: React.FC<ForecastResultsViewProps> = ({
  forecastId,
  className = "",
}) => {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = forecastId
          ? `/api/forecasts/${forecastId}`
          : "/api/forecasts/latest";

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch forecast");
        }

        const data = await response.json();
        setForecast(data);
      } catch (err) {
        console.error("Error fetching forecast:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [forecastId]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return "High Confidence";
    if (confidence >= 60) return "Moderate Confidence";
    return "Low Confidence";
  };

  if (loading) {
    return (
      <div className={className}>
        <LoadingState label="Loading forecast results..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertCircle className="w-6 h-6" />}
            title="Unable to load forecast"
            description={error}
          />
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<TrendingUp className="w-6 h-6" />}
            title="No forecast available"
            description="Generate a forecast to see projections and insights"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{forecast.name}</CardTitle>
              <CardDescription className="mt-2">
                {forecast.description}
              </CardDescription>
            </div>
            <Badge variant="outline">{forecast.type.replace("_", " ")}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Forecast Result Summary */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Forecast Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  {forecast.result.unit === "USD"
                    ? formatCurrency(forecast.result.value)
                    : `${forecast.result.value} ${forecast.result.unit}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
                <p
                  className={`text-3xl font-bold ${getConfidenceColor(
                    forecast.confidenceScore,
                  )}`}
                >
                  {forecast.confidenceScore}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {getConfidenceLabel(forecast.confidenceScore)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Formula</p>
                <code className="text-sm bg-white px-3 py-2 rounded border border-gray-300 block overflow-x-auto">
                  {forecast.formula}
                </code>
              </div>
            </div>
          </div>

          {/* Cash Flow Projection Chart */}
          {forecast.projections && forecast.projections.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cash Flow Projection
                </h3>
                <button
                  onClick={() => setShowTable(!showTable)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                  aria-expanded={showTable}
                  aria-controls="forecast-data-table"
                >
                  {showTable ? "Hide" : "Show"} data table
                </button>
              </div>

              {/* Chart Visualization */}
              <div
                className="w-full h-80 mb-4"
                role="img"
                aria-label="Cash flow projection chart showing best case, expected, and worst case scenarios over time"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={forecast.projections}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorBest"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorExpected"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorWorst"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "12px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                      labelStyle={{ fontWeight: "bold", marginBottom: "8px" }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "20px" }}
                      iconType="line"
                    />
                    <Area
                      type="monotone"
                      dataKey="bestCase"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#colorBest)"
                      name="Best Case"
                    />
                    <Area
                      type="monotone"
                      dataKey="expected"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fill="url(#colorExpected)"
                      name="Expected"
                    />
                    <Area
                      type="monotone"
                      dataKey="worstCase"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#colorWorst)"
                      name="Worst Case"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Accessible Data Table */}
              {showTable && (
                <div
                  id="forecast-data-table"
                  className="overflow-x-auto border border-gray-200 rounded-lg"
                >
                  <table className="min-w-full divide-y divide-gray-200">
                    <caption className="sr-only">
                      Cash flow projection data table showing best case,
                      expected, and worst case scenarios by month
                    </caption>
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Month
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Best Case
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Expected
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Worst Case
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {forecast.projections.map((row, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                            {formatCurrency(row.bestCase)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                            {formatCurrency(row.expected)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                            {formatCurrency(row.worstCase)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Assumptions */}
          {forecast.assumptions && forecast.assumptions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info
                  className="w-5 h-5 mr-2 text-blue-600"
                  aria-hidden="true"
                />
                Key Assumptions
              </h3>
              <div className="space-y-3">
                {forecast.assumptions.map((assumption, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {assumption.key.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Sensitivity: {assumption.sensitivity}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {typeof assumption.value === "number"
                        ? formatCurrency(assumption.value)
                        : assumption.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Explanation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              About Confidence Scores
            </h4>
            <p className="text-sm text-blue-800">
              Confidence scores reflect the reliability of this forecast based
              on data quality, historical accuracy, and assumption sensitivity.
              Higher scores indicate more reliable predictions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastResultsView;
