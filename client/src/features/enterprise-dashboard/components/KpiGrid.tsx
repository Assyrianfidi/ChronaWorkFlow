import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";

interface Kpi {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  target?: number;
  format?: "currency" | "number" | "percent";
  chartData?: Array<{ date: string; value: number }>;
}

interface KpiGridProps {
  kpis: Kpi[];
  onKpiClick: (kpiId: string) => void;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis, onKpiClick }) => {
  const formatValue = (kpi: Kpi) => {
    if (kpi.format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Number(kpi.value));
    }
    if (kpi.format === "percent") {
      return `${kpi.value}%`;
    }
    return kpi.value;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <Card
          key={kpi.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onKpiClick(kpi.id)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {kpi.title}
            </CardTitle>
            <div className="h-4 w-4 text-gray-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(kpi)}</div>
            {kpi.change !== undefined && (
              <div className="flex items-center text-sm mt-1">
                {kpi.change >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={
                    kpi.change >= 0 ? "text-green-500" : "text-red-500"
                  }
                >
                  {Math.abs(kpi.change)}%{" "}
                  {kpi.change >= 0 ? "increase" : "decrease"} from last period
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
