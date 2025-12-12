/**
 * Enterprise Dashboard 3.0
 * Fully intelligent analytics cockpit with real-time KPIs, heatmaps, and predictive insights
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore
import { useAdaptiveUI } from '../../state/ui/UserExperienceMode.js.js';
// @ts-ignore
import { useAdvancedFeedback } from '../../hooks/useInteractiveFeedback.js.js';
// @ts-ignore
import { generateGlassmorphismCSS } from '../../design-system/glassmorphism.js.js';

// Types
interface KPIData {
  id: string;
  title: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "neutral";
  target?: number;
  unit?: string;
  format?: "currency" | "percentage" | "number" | "duration";
  category:
    | "revenue"
    | "expenses"
    | "profit"
    | "cash"
    | "customers"
    | "operations";
  priority: "high" | "medium" | "low";
  animated?: boolean;
}

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
  label: string;
}

interface AnomalyData {
  id: string;
  type: "spike" | "drop" | "pattern" | "outlier";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metric: string;
  value: number;
  expected: number;
  timestamp: Date;
  confidence: number;
}

interface PredictiveInsight {
  id: string;
  type: "trend" | "forecast" | "recommendation" | "warning";
  title: string;
  description: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  timeframe: string;
  actionItems: string[];
}

// Sample data generators
const generateKPIData = (): KPIData[] => [
  {
    id: "revenue",
    title: "Total Revenue",
    value: 2847500,
    previousValue: 2654300,
    change: 193200,
    changePercent: 7.3,
    trend: "up",
    target: 3000000,
    format: "currency",
    category: "revenue",
    priority: "high",
    animated: true,
  },
  {
    id: "expenses",
    title: "Total Expenses",
    value: 1843200,
    previousValue: 1926500,
    change: -83300,
    changePercent: -4.3,
    trend: "down",
    format: "currency",
    category: "expenses",
    priority: "high",
    animated: true,
  },
  {
    id: "profit",
    title: "Net Profit",
    value: 1004300,
    previousValue: 727800,
    change: 276500,
    changePercent: 38.0,
    trend: "up",
    target: 1200000,
    format: "currency",
    category: "profit",
    priority: "high",
    animated: true,
  },
  {
    id: "cash",
    title: "Cash Flow",
    value: 456000,
    previousValue: 423000,
    change: 33000,
    changePercent: 7.8,
    trend: "up",
    format: "currency",
    category: "cash",
    priority: "medium",
    animated: true,
  },
  {
    id: "customers",
    title: "Active Customers",
    value: 1247,
    previousValue: 1189,
    change: 58,
    changePercent: 4.9,
    trend: "up",
    target: 1500,
    format: "number",
    category: "customers",
    priority: "medium",
    animated: true,
  },
  {
    id: "operations",
    title: "Operational Efficiency",
    value: 87.3,
    previousValue: 84.1,
    change: 3.2,
    changePercent: 3.8,
    trend: "up",
    target: 90,
    format: "percentage",
    category: "operations",
    priority: "low",
    animated: true,
  },
];

const generateHeatmapData = (): HeatmapData[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const data: HeatmapData[] = [];

  days.forEach((day) => {
    for (let hour = 0; hour < 24; hour++) {
      const baseValue = Math.random() * 100;
      const isWeekend = day === "Sat" || day === "Sun";
      const isBusinessHours = hour >= 9 && hour <= 17;

      let value = baseValue;
      if (isWeekend) value *= 0.3;
      else if (isBusinessHours) value *= 1.5;
      else if (hour >= 18 && hour <= 22) value *= 0.7;
      else value *= 0.2;

      data.push({
        day,
        hour,
        value: Math.round(value),
        label: `${day} ${hour}:00`,
      });
    }
  });

  return data;
};

const generateAnomalyData = (): AnomalyData[] => [
  {
    id: "anomaly-1",
    type: "spike",
    severity: "medium",
    description: "Unusual spike in customer acquisition",
    metric: "New Customers",
    value: 47,
    expected: 15,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    confidence: 0.82,
  },
  {
    id: "anomaly-2",
    type: "drop",
    severity: "low",
    description: "Slight drop in operational efficiency",
    metric: "Process Time",
    value: 92,
    expected: 87,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    confidence: 0.71,
  },
];

const generatePredictiveInsights = (): PredictiveInsight[] => [
  {
    id: "insight-1",
    type: "trend",
    title: "Revenue Growth Acceleration",
    description:
      "Based on current trends, revenue is projected to grow 12% faster than forecasted",
    confidence: 0.89,
    impact: "high",
    timeframe: "Next 30 days",
    actionItems: [
      "Prepare additional inventory",
      "Scale customer support",
      "Review pricing strategy",
    ],
  },
  {
    id: "insight-2",
    type: "warning",
    title: "Cash Flow Pressure",
    description:
      "Expected increase in accounts payable may impact cash flow in 2 weeks",
    confidence: 0.76,
    impact: "medium",
    timeframe: "14 days",
    actionItems: [
      "Review payment terms",
      "Consider short-term financing",
      "Optimize inventory levels",
    ],
  },
];

// Components
interface AnimatedKPICardProps {
  data: KPIData;
  config: any;
}

// @ts-ignore
const AnimatedKPICard: React.FC<AnimatedKPICardProps> = ({ data, config }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { elementRef, triggerHover } = useAdvancedFeedback({
    visualFeedback: true,
    hapticFeedback: config.features.keyboardShortcuts,
    glow: true,
    parallax: true,
  });

  useEffect(() => {
    if (!data.animated) return;

    const duration = 2000;
    const startTime = performance.now();
    const startValue = data.previousValue;
    const endValue = data.value;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const currentValue = startValue + (endValue - startValue) * easedProgress;

      setAnimatedValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [data]);

  const formatValue = (value: number, format?: string): string => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      case "percentage":
        return `${value.toFixed(1)}%`;
      case "number":
        return new Intl.NumberFormat("en-US").format(value);
      default:
        return value.toString();
    }
  };

  const getTrendColor = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "border-red-500/50";
      case "medium":
        return "border-yellow-500/50";
      default:
        return "border-blue-500/50";
    }
  };

  return (
    <motion.div
      ref={elementRef}
      className={`glass-v2 p-6 rounded-xl border ${getPriorityColor(data.priority)} hover-lift-v2 cursor-pointer`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => {
        setIsHovered(true);
        triggerHover("hover", true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        triggerHover("hover", false);
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white/90">{data.title}</h3>
          {data.target && (
            <p className="text-sm text-white/60">
              Target: {formatValue(data.target, data.format)}
            </p>
          )}
        </div>
        <div className={`text-2xl font-bold ${getTrendColor(data.trend)}`}>
          {data.trend === "up" ? "↑" : data.trend === "down" ? "↓" : "→"}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-white mb-1">
          {formatValue(data.animated ? animatedValue : data.value, data.format)}
        </div>
        <div
          className={`flex items-center text-sm ${getTrendColor(data.trend)}`}
        >
          <span className="font-medium">
            {data.change > 0 ? "+" : ""}
            {formatValue(data.change, data.format)}
          </span>
          <span className="ml-2">
            ({data.changePercent > 0 ? "+" : ""}
            {data.changePercent}%)
          </span>
        </div>
      </div>

      {data.target && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-white/60 mb-1">
            <span>Progress to Target</span>
            <span>{Math.round((data.value / data.target) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((data.value / data.target) * 100, 100)}%`,
              }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-white/70 pt-2 border-t border-white/20"
          >
            <p>Previous: {formatValue(data.previousValue, data.format)}</p>
            <p>Category: {data.category}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface HeatmapProps {
  data: HeatmapData[];
  title: string;
}

// @ts-ignore
const ActivityHeatmap: React.FC<HeatmapProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (value: number): number => {
    return value / maxValue;
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) return "bg-white/5";
    if (intensity < 0.25) return "bg-blue-500/20";
    if (intensity < 0.5) return "bg-blue-500/40";
    if (intensity < 0.75) return "bg-blue-500/60";
    return "bg-blue-500/80";
  };

  return (
    <motion.div
      className="glass-v2 p-6 rounded-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-semibold text-white/90 mb-4">{title}</h3>

      <div className="grid grid-cols-25 gap-1 mb-4">
        <div></div> {/* Empty corner */}
        {hours.map((hour) => (
          <div key={hour} className="text-xs text-white/50 text-center">
            {hour % 6 === 0 ? hour : ""}
          </div>
        ))}
        {days.map((day) => (
          <React.Fragment key={day}>
            <div className="text-xs text-white/50 pr-2">{day}</div>
            {hours.map((hour) => {
              const cellData = data.find(
                (d) => d.day === day && d.hour === hour,
              );
              const intensity = cellData ? getIntensity(cellData.value) : 0;

              return (
                <motion.div
                  key={`${day}-${hour}`}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 ${getColor(intensity)} hover:scale-110`}
                  whileHover={{ scale: 1.2 }}
                  title={
                    cellData
                      ? `${cellData.label}: ${cellData.value}`
                      : "No data"
                  }
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Activity Intensity</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white/5 rounded-sm"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500/80 rounded-sm"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AnomalyDetectionProps {
  anomalies: AnomalyData[];
}

// @ts-ignore
const AnomalyDetectionPanel: React.FC<AnomalyDetectionProps> = ({
  anomalies,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 border-red-500/50 text-red-300";
      case "high":
        return "bg-orange-500/20 border-orange-500/50 text-orange-300";
      case "medium":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300";
      default:
        return "bg-blue-500/20 border-blue-500/50 text-blue-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "spike":
        return "📈";
      case "drop":
        return "📉";
      case "pattern":
        return "🔄";
      default:
        return "⚠️";
    }
  };

  return (
    <motion.div
      className="glass-v2 p-6 rounded-xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-semibold text-white/90 mb-4">
        Anomaly Detection
      </h3>

      <div className="space-y-3">
        {anomalies.map((anomaly, index) => (
          <motion.div
            key={anomaly.id}
            className={`p-4 rounded-lg border ${getSeverityColor(anomaly.severity)}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(anomaly.type)}</span>
                <div>
                  <h4 className="font-medium">{anomaly.description}</h4>
                  <p className="text-sm opacity-80">{anomaly.metric}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {anomaly.value} vs {anomaly.expected}
                </div>
                <div className="text-xs opacity-70">
                  {Math.round(anomaly.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            <div className="text-xs opacity-70">
              {anomaly.timestamp.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

interface PredictiveInsightsProps {
  insights: PredictiveInsight[];
}

// @ts-ignore
const PredictiveInsightsPanel: React.FC<PredictiveInsightsProps> = ({
  insights,
}) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "border-green-500/50";
      case "medium":
        return "border-yellow-500/50";
      default:
        return "border-blue-500/50";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "trend":
        return "📊";
      case "forecast":
        return "🔮";
      case "recommendation":
        return "💡";
      default:
        return "⚠️";
    }
  };

  return (
    <motion.div
      className="glass-v2 p-6 rounded-xl"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-semibold text-white/90 mb-4">
        AI-Powered Insights
      </h3>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            className={`p-4 rounded-lg border ${getImpactColor(insight.impact)}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">{getTypeIcon(insight.type)}</span>
              <div className="flex-1">
                <h4 className="font-medium text-white/90 mb-1">
                  {insight.title}
                </h4>
                <p className="text-sm text-white/70 mb-2">
                  {insight.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>
                    Confidence: {Math.round(insight.confidence * 100)}%
                  </span>
                  <span>Impact: {insight.impact}</span>
                  <span>Timeframe: {insight.timeframe}</span>
                </div>
              </div>
            </div>

            {insight.actionItems.length > 0 && (
              <div className="border-t border-white/20 pt-3">
                <p className="text-xs font-medium text-white/70 mb-2">
                  Recommended Actions:
                </p>
                <ul className="text-xs text-white/60 space-y-1">
                  {insight.actionItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Main Dashboard Component
// @ts-ignore
const EnterpriseDashboard: React.FC = () => {
  const [profile] = useState({
    userId: "user-123",
    role: "professional" as const,
    experienceLevel: "intermediate" as const,
    preferredTaskTypes: ["reporting" as const],
    usagePatterns: {
      averageSessionDuration: 1800,
      mostUsedFeatures: ["dashboard", "reports"],
      keyboardShortcutUsage: 0.6,
      mouseClickFrequency: 0.4,
      errorRate: 0.02,
    },
    accessibilityPreferences: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
    },
    uiPreferences: {
      density: "comfortable" as const,
      theme: "dark" as const,
      sidebarCollapsed: false,
      showTooltips: true,
      showKeyboardShortcuts: true,
    },
  });

  const { config, adaptToTask } = useAdaptiveUI(profile);
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize data
  useEffect(() => {
    setKpiData(generateKPIData());
    setHeatmapData(generateHeatmapData());
    setAnomalies(generateAnomalyData());
    setInsights(generatePredictiveInsights());

    // Adapt to reporting task
    adaptToTask("reporting");
  }, [adaptToTask]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time data updates
      setKpiData((prev) =>
        prev.map((kpi) => ({
          ...kpi,
          value: kpi.value + (Math.random() - 0.5) * kpi.value * 0.01,
          change: kpi.change + (Math.random() - 0.5) * 1000,
          changePercent: kpi.changePercent + (Math.random() - 0.5) * 0.5,
        })),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Enterprise Dashboard
              </h1>
              <p className="text-white/70">
                Real-time analytics and intelligent insights
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="glass-v2 px-4 py-2 rounded-lg text-white border border-white/20"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`glass-v2 px-4 py-2 rounded-lg border transition-all ${
                  autoRefresh
                    ? "bg-green-500/20 border-green-500/50 text-green-300"
                    : "border-white/20 text-white/70"
                }`}
              >
                {autoRefresh ? "🔄 Auto-refresh ON" : "⏸️ Auto-refresh OFF"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpiData.map((kpi) => (
            <motion.div key={kpi.id} variants={itemVariants}>
              <AnimatedKPICard data={kpi} config={config} />
            </motion.div>
          ))}
        </motion.div>

        {/* Analytics Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <ActivityHeatmap
              data={heatmapData}
              title="Activity Heatmap - Last 7 Days"
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <AnomalyDetectionPanel anomalies={anomalies} />
          </motion.div>

          <motion.div variants={itemVariants} className="lg:col-span-3">
            <PredictiveInsightsPanel insights={insights} />
          </motion.div>
        </motion.div>

        {/* Performance Meter */}
        <motion.div
          className="mt-8 glass-v2 p-6 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-white/90 mb-4">
            System Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "API Response", value: 98, unit: "%" },
              { label: "Database Query", value: 145, unit: "ms" },
              { label: "Page Load", value: 1.2, unit: "s" },
              { label: "Error Rate", value: 0.02, unit: "%" },
            ].map((metric, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {metric.value}
                  {metric.unit}
                </div>
                <div className="text-sm text-white/60">{metric.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnterpriseDashboard;
