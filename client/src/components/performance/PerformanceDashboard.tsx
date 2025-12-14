/**
 * Performance Dashboard Component
 * Real-time performance monitoring and optimization interface
 */

import React, { useState, useEffect } from "react";
import PerformanceEngine, {
  PerformanceReport,
  PerformanceMetrics,
} from "@/../../performance/performance-engine";

interface PerformanceDashboardProps {
  engine: PerformanceEngine;
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  engine,
  className = "",
}) => {
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics>(
    engine.getCurrentMetrics(),
  );
  const [latestReport, setLatestReport] = useState<PerformanceReport | null>(
    engine.getLatestReport(),
  );
  const [historicalReports, setHistoricalReports] = useState<
    PerformanceReport[]
  >(engine.getHistoricalReports());
  const [averageMetrics, setAverageMetrics] =
    useState<PerformanceMetrics | null>(engine.getAverageMetrics());
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    // Set up real-time updates
    const interval = setInterval(() => {
      setCurrentMetrics(engine.getCurrentMetrics());
      setLatestReport(engine.getLatestReport());
      setHistoricalReports(engine.getHistoricalReports());
      setAverageMetrics(engine.getAverageMetrics());
    }, 2000);

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [engine]);

  const handleOptimizePerformance = () => {
    setIsOptimizing(true);
    engine.startOptimization();
    engine.optimizeImages();

    setTimeout(() => {
      setIsOptimizing(false);
    }, 2000);
  };

  const handleEnablePerformanceMode = () => {
    engine.enablePerformanceMode();
    setCurrentMetrics(engine.getCurrentMetrics());
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    if (score >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case "A":
        return "bg-green-100 text-green-800";
      case "B":
        return "bg-yellow-100 text-yellow-800";
      case "C":
        return "bg-orange-100 text-orange-800";
      case "D":
        return "bg-red-100 text-red-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const getMetricStatus = (
    value: number,
    threshold: number,
  ): "good" | "warning" | "critical" => {
    if (value <= threshold) return "good";
    if (value <= threshold * 1.5) return "warning";
    return "critical";
  };

  const getMetricStatusColor = (
    status: "good" | "warning" | "critical",
  ): string => {
    switch (status) {
      case "good":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  const thresholds = engine.getConfig().thresholds;

  return (
    <div className={`performance-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h1>Performance Dashboard</h1>
        <div className="header-actions">
          <button
            className={`optimize-button ${isOptimizing ? "optimizing" : ""}`}
            onClick={handleOptimizePerformance}
            disabled={isOptimizing}
          >
            {isOptimizing ? "⚡ Optimizing..." : "🚀 Optimize Performance"}
          </button>
          <button
            className="performance-mode-button"
            onClick={handleEnablePerformanceMode}
          >
            ⚡ Enable Performance Mode
          </button>
          <button
            className="refresh-button"
            onClick={() => {
              setCurrentMetrics(engine.getCurrentMetrics());
              setLatestReport(engine.getLatestReport());
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Performance Score */}
      {latestReport && (
        <div className="score-section">
          <div className="score-card">
            <div className="score-circle">
              <div
                className={`score-value ${getScoreColor(latestReport.score)}`}
              >
                {latestReport.score.toFixed(0)}
              </div>
              <div className="score-max">/ 100</div>
            </div>
            <div className="score-details">
              <h2>Performance Score</h2>
              <div
                className={`grade-badge ${getGradeColor(latestReport.grade)}`}
              >
                Grade {latestReport.grade}
              </div>
              <div className="score-timestamp">
                Last updated: {latestReport.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="core-web-vitals">
            <h3>Core Web Vitals</h3>
            <div className="vitals-grid">
              <div className="vital-item">
                <div className="vital-name">FCP</div>
                <div
                  className={`vital-value ${getMetricStatusColor(
                    getMetricStatus(
                      currentMetrics.firstContentfulPaint,
                      thresholds.firstContentfulPaint,
                    ),
                  )}`}
                >
                  {formatTime(currentMetrics.firstContentfulPaint)}
                </div>
                <div className="vital-threshold">
                  ≤ {formatTime(thresholds.firstContentfulPaint)}
                </div>
              </div>
              <div className="vital-item">
                <div className="vital-name">LCP</div>
                <div
                  className={`vital-value ${getMetricStatusColor(
                    getMetricStatus(
                      currentMetrics.largestContentfulPaint,
                      thresholds.largestContentfulPaint,
                    ),
                  )}`}
                >
                  {formatTime(currentMetrics.largestContentfulPaint)}
                </div>
                <div className="vital-threshold">
                  ≤ {formatTime(thresholds.largestContentfulPaint)}
                </div>
              </div>
              <div className="vital-item">
                <div className="vital-name">FID</div>
                <div
                  className={`vital-value ${getMetricStatusColor(
                    getMetricStatus(
                      currentMetrics.firstInputDelay,
                      thresholds.firstInputDelay,
                    ),
                  )}`}
                >
                  {formatTime(currentMetrics.firstInputDelay)}
                </div>
                <div className="vital-threshold">
                  ≤ {formatTime(thresholds.firstInputDelay)}
                </div>
              </div>
              <div className="vital-item">
                <div className="vital-name">CLS</div>
                <div
                  className={`vital-value ${getMetricStatusColor(
                    getMetricStatus(
                      currentMetrics.cumulativeLayoutShift * 1000,
                      thresholds.cumulativeLayoutShift * 1000,
                    ),
                  )}`}
                >
                  {currentMetrics.cumulativeLayoutShift.toFixed(3)}
                </div>
                <div className="vital-threshold">
                  ≤ {thresholds.cumulativeLayoutShift}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <h3>Page Load Time</h3>
            <div
              className={`metric-status ${getMetricStatusColor(
                getMetricStatus(
                  currentMetrics.pageLoadTime,
                  thresholds.pageLoadTime,
                ),
              )}`}
            >
              {getMetricStatus(
                currentMetrics.pageLoadTime,
                thresholds.pageLoadTime,
              )}
            </div>
          </div>
          <div className="metric-value">
            {formatTime(currentMetrics.pageLoadTime)}
          </div>
          <div className="metric-threshold">
            Target: ≤ {formatTime(thresholds.pageLoadTime)}
          </div>
          {averageMetrics && (
            <div className="metric-average">
              Average: {formatTime(averageMetrics.pageLoadTime)}
            </div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Time to Interactive</h3>
            <div
              className={`metric-status ${getMetricStatusColor(
                getMetricStatus(
                  currentMetrics.timeToInteractive,
                  thresholds.timeToInteractive,
                ),
              )}`}
            >
              {getMetricStatus(
                currentMetrics.timeToInteractive,
                thresholds.timeToInteractive,
              )}
            </div>
          </div>
          <div className="metric-value">
            {formatTime(currentMetrics.timeToInteractive)}
          </div>
          <div className="metric-threshold">
            Target: ≤ {formatTime(thresholds.timeToInteractive)}
          </div>
          {averageMetrics && (
            <div className="metric-average">
              Average: {formatTime(averageMetrics.timeToInteractive)}
            </div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>API Response Time</h3>
            <div
              className={`metric-status ${getMetricStatusColor(
                getMetricStatus(
                  currentMetrics.apiResponseTime,
                  thresholds.apiResponseTime,
                ),
              )}`}
            >
              {getMetricStatus(
                currentMetrics.apiResponseTime,
                thresholds.apiResponseTime,
              )}
            </div>
          </div>
          <div className="metric-value">
            {formatTime(currentMetrics.apiResponseTime)}
          </div>
          <div className="metric-threshold">
            Target: ≤ {formatTime(thresholds.apiResponseTime)}
          </div>
          {averageMetrics && (
            <div className="metric-average">
              Average: {formatTime(averageMetrics.apiResponseTime)}
            </div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Bundle Size</h3>
            <div className="metric-status text-blue-600">
              {currentMetrics.bundleSize < engine.getConfig().budget.bundleSize
                ? "good"
                : "warning"}
            </div>
          </div>
          <div className="metric-value">
            {formatBytes(currentMetrics.bundleSize)}
          </div>
          <div className="metric-threshold">
            Budget: ≤ {formatBytes(engine.getConfig().budget.bundleSize)}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Memory Usage</h3>
            <div
              className={`metric-status ${currentMetrics.memoryUsage > 50 * 1024 * 1024 ? "text-red-600" : "text-green-600"}`}
            >
              {currentMetrics.memoryUsage > 50 * 1024 * 1024
                ? "high"
                : "normal"}
            </div>
          </div>
          <div className="metric-value">
            {formatBytes(currentMetrics.memoryUsage)}
          </div>
          <div className="metric-threshold">Recommended: ≤ 50MB</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <h3>Perceived Performance</h3>
            <div
              className={`metric-status ${getScoreColor(currentMetrics.perceivedPerformance)}`}
            >
              {currentMetrics.perceivedPerformance >= 80 ? "excellent" : "good"}
            </div>
          </div>
          <div className="metric-value">
            {currentMetrics.perceivedPerformance.toFixed(0)}%
          </div>
          <div className="metric-threshold">Target: ≥ 80%</div>
        </div>
      </div>

      {/* Recommendations */}
      {latestReport && latestReport.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h2>Performance Recommendations</h2>
          <div className="recommendations-list">
            {latestReport.recommendations.slice(0, 5).map((rec, index) => (
              <div key={index} className={`recommendation-item ${rec.type}`}>
                <div className="recommendation-header">
                  <h3>{rec.title}</h3>
                  <div className="recommendation-meta">
                    <span className={`impact ${rec.impact}`}>
                      {rec.impact} impact
                    </span>
                    <span className={`effort ${rec.effort}`}>
                      {rec.effort} effort
                    </span>
                  </div>
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <div className="recommendation-implementation">
                  <strong>Implementation:</strong> {rec.implementation}
                </div>
                {rec.resources.length > 0 && (
                  <div className="recommendation-resources">
                    <strong>Resources:</strong>
                    <ul>
                      {rec.resources.map((resource, i) => (
                        <li key={i}>
                          <a
                            href={resource}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {resource}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Violations */}
      {latestReport && latestReport.violations.length > 0 && (
        <div className="violations-section">
          <h2>Performance Violations</h2>
          <div className="violations-list">
            {latestReport.violations.map((violation, index) => (
              <div
                key={index}
                className={`violation-item ${violation.severity}`}
              >
                <div className="violation-header">
                  <h3>
                    {violation.metric
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())}
                  </h3>
                  <div className={`violation-severity ${violation.severity}`}>
                    {violation.severity.toUpperCase()}
                  </div>
                </div>
                <p className="violation-description">{violation.description}</p>
                <div className="violation-details">
                  <span>Actual: {formatTime(violation.actual)}</span>
                  <span>Threshold: {formatTime(violation.threshold)}</span>
                  <span>
                    Over by:{" "}
                    {formatTime(violation.actual - violation.threshold)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Performance */}
      {historicalReports.length > 1 && (
        <div className="historical-section">
          <h2>Historical Performance</h2>
          <div className="historical-chart">
            <div className="chart-container">
              <h3>Performance Score Over Time</h3>
              <div className="chart-data">
                {historicalReports.slice(-10).map((report, index) => (
                  <div key={index} className="chart-point">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${report.score}%`,
                        backgroundColor:
                          report.score >= 90
                            ? "#10b981"
                            : report.score >= 80
                              ? "#f59e0b"
                              : report.score >= 70
                                ? "#f97316"
                                : "#ef4444",
                      }}
                    ></div>
                    <div className="chart-label">
                      {report.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="chart-value">{report.score.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-dashboard {
          padding: 2rem;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .optimize-button,
        .performance-mode-button,
        .refresh-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .optimize-button:hover,
        .performance-mode-button:hover,
        .refresh-button:hover {
          background: #f0f0f0;
        }

        .optimize-button.optimizing {
          background: #10b981;
          color: white;
          border-color: #10b981;
        }

        .optimize-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .score-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .score-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .score-circle {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #10b981 0deg,
            #10b981 calc(var(--score) * 3.6deg),
            #e5e7eb calc(var(--score) * 3.6deg),
            #e5e7eb 360deg
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-circle::before {
          content: "";
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: white;
        }

        .score-value {
          font-size: 2rem;
          font-weight: 700;
          z-index: 1;
        }

        .score-max {
          font-size: 0.875rem;
          color: #666;
          z-index: 1;
        }

        .score-details h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .grade-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .score-timestamp {
          font-size: 0.875rem;
          color: #666;
        }

        .core-web-vitals {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .core-web-vitals h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
        }

        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .vital-item {
          text-align: center;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .vital-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .vital-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .vital-threshold {
          font-size: 0.75rem;
          color: #999;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .metric-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .metric-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .metric-threshold,
        .metric-average {
          font-size: 0.875rem;
          color: #666;
        }

        .recommendations-section,
        .violations-section,
        .historical-section {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 2rem;
        }

        .recommendations-section h2,
        .violations-section h2,
        .historical-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
        }

        .recommendations-list,
        .violations-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .recommendation-item,
        .violation-item {
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .recommendation-item.critical {
          background: #fef2f2;
          border-left-color: #dc2626;
        }

        .recommendation-item.warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }

        .recommendation-item.info {
          background: #f0f9ff;
          border-left-color: #3b82f6;
        }

        .violation-item.critical {
          background: #fef2f2;
          border-left-color: #dc2626;
        }

        .violation-item.warning {
          background: #fffbeb;
          border-left-color: #f59e0b;
        }

        .recommendation-header,
        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .recommendation-header h3,
        .violation-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .recommendation-meta {
          display: flex;
          gap: 0.5rem;
        }

        .impact,
        .effort {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .impact.high {
          background: #dc2626;
          color: white;
        }

        .impact.medium {
          background: #f59e0b;
          color: white;
        }

        .impact.low {
          background: #10b981;
          color: white;
        }

        .effort.high {
          background: #6b7280;
          color: white;
        }

        .effort.medium {
          background: #8b5cf6;
          color: white;
        }

        .effort.low {
          background: #06b6d4;
          color: white;
        }

        .recommendation-description,
        .violation-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .recommendation-implementation {
          font-size: 0.875rem;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .recommendation-resources {
          font-size: 0.875rem;
        }

        .recommendation-resources ul {
          margin: 0.5rem 0 0 1rem;
        }

        .recommendation-resources a {
          color: #3b82f6;
          text-decoration: none;
        }

        .recommendation-resources a:hover {
          text-decoration: underline;
        }

        .violation-details {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #666;
        }

        .violation-severity {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .violation-severity.critical {
          background: #dc2626;
          color: white;
        }

        .violation-severity.warning {
          background: #f59e0b;
          color: white;
        }

        .historical-chart {
          margin-top: 1.5rem;
        }

        .chart-container {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .chart-container h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .chart-data {
          display: flex;
          align-items: end;
          gap: 1rem;
          height: 200px;
        }

        .chart-point {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: end;
        }

        .chart-bar {
          width: 100%;
          min-height: 10px;
          border-radius: 4px 4px 0 0;
          transition: height 0.3s ease;
        }

        .chart-label {
          font-size: 0.75rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .chart-value {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        /* Status colors */
        .text-green-600 {
          color: #10b981;
        }
        .text-yellow-600 {
          color: #f59e0b;
        }
        .text-orange-600 {
          color: #f97316;
        }
        .text-red-600 {
          color: #ef4444;
        }
        .text-blue-600 {
          color: #3b82f6;
        }

        /* Grade colors */
        .bg-green-100 {
          background: #dcfce7;
        }
        .text-green-800 {
          color: #166534;
        }
        .bg-yellow-100 {
          background: #fef3c7;
        }
        .text-yellow-800 {
          color: #92400e;
        }
        .bg-orange-100 {
          background: #fed7aa;
        }
        .text-orange-800 {
          color: #9a3412;
        }
        .bg-red-100 {
          background: #fee2e2;
        }
        .text-red-800 {
          color: #991b1b;
        }
      `}</style>
    </div>
  );
};

export default PerformanceDashboard;
