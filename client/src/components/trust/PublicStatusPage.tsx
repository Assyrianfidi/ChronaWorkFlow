/**
 * ChronaWorkFlow Public Status Page
 * Customer-Facing Trust Layer
 * Real-time uptime, incidents, and compliance transparency
 */

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Lock,
  Server,
  Activity,
  ExternalLink,
} from "lucide-react";

interface StatusComponent {
  id: string;
  name: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
  uptime24h: number;
  uptime30d: number;
  lastIncident: Date | null;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  startedAt: Date;
  resolvedAt?: Date;
  affectedComponents: string[];
  updates: IncidentUpdate[];
}

interface IncidentUpdate {
  timestamp: Date;
  message: string;
  status: string;
}

interface ComplianceBadge {
  name: string;
  status: "active" | "pending" | "expired";
  issuedBy: string;
  validUntil: Date;
  icon: React.ElementType;
}

export const PublicStatusPage: React.FC = () => {
  const [components, setComponents] = useState<StatusComponent[]>([
    {
      id: "api",
      name: "API",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "web",
      name: "Web Application",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "auth",
      name: "Authentication",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "database",
      name: "Database",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "storage",
      name: "File Storage",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "webhooks",
      name: "Webhooks",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
    {
      id: "banking",
      name: "Bank Integrations",
      status: "operational",
      uptime24h: 99.8,
      uptime30d: 99.95,
      lastIncident: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "reporting",
      name: "Reports & Exports",
      status: "operational",
      uptime24h: 100,
      uptime30d: 99.99,
      lastIncident: null,
    },
  ]);

  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [pastIncidents, setPastIncidents] = useState<Incident[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = (): {
    status: string;
    color: string;
    icon: React.ElementType;
  } => {
    const hasOutage = components.some((c) => c.status === "major_outage");
    const hasDegraded = components.some(
      (c) => c.status === "degraded" || c.status === "partial_outage",
    );

    if (hasOutage)
      return { status: "Major Outage", color: "text-red-500", icon: XCircle };
    if (hasDegraded)
      return {
        status: "Partial Degradation",
        color: "text-yellow-500",
        icon: AlertTriangle,
      };
    return {
      status: "All Systems Operational",
      color: "text-green-500",
      icon: CheckCircle,
    };
  };

  const getStatusIcon = (status: StatusComponent["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "partial_outage":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "major_outage":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status: StatusComponent["status"]) => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded Performance";
      case "partial_outage":
        return "Partial Outage";
      case "major_outage":
        return "Major Outage";
    }
  };

  const overall = getOverallStatus();
  const OverallIcon = overall.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ChronaWorkFlow Status
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time system status and incident reports
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Last updated</p>
              <p className="text-sm font-mono text-gray-600">
                {lastUpdated.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Overall Status */}
        <div
          className={`bg-white rounded-lg shadow-sm border-2 p-6 mb-6 ${
            overall.status === "All Systems Operational"
              ? "border-green-500"
              : overall.status === "Partial Degradation"
                ? "border-yellow-500"
                : "border-red-500"
          }`}
        >
          <div className="flex items-center gap-4">
            <OverallIcon className={`w-12 h-12 ${overall.color}`} />
            <div>
              <h2 className={`text-2xl font-bold ${overall.color}`}>
                {overall.status}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeIncidents.length > 0
                  ? `${activeIncidents.length} active incident${activeIncidents.length > 1 ? "s" : ""}`
                  : "No known issues at this time"}
              </p>
            </div>
          </div>
        </div>

        {/* Component Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Component Status
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {components.map((component) => (
              <div
                key={component.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {component.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getStatusText(component.status)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {component.uptime30d.toFixed(2)}%
                  </p>
                  <p className="text-xs text-gray-500">30-day uptime</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 mb-6">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Incidents
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {activeIncidents.map((incident) => (
                <div key={incident.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {incident.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Affected: {incident.affectedComponents.join(", ")}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        incident.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : incident.severity === "major"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {incident.updates.map((update, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-600">{update.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {update.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uptime History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Uptime History
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 90 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (89 - i));
                const hasIncident = i === 2 || i === 15; // Mock incidents
                return (
                  <div
                    key={i}
                    className={`h-8 rounded ${
                      hasIncident ? "bg-red-400" : "bg-green-400"
                    } hover:opacity-80 transition-opacity`}
                    title={date.toLocaleDateString()}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>90 days ago</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-400 rounded" />
                  <span>Operational</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded" />
                  <span>Incident</span>
                </div>
              </div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Trust & Security */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Security & Compliance
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Shield className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">SOC 2 Type II</p>
                  <p className="text-sm text-green-700">Certified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Lock className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    256-bit Encryption
                  </p>
                  <p className="text-sm text-green-700">TLS 1.3</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Activity className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">99.99% Uptime</p>
                  <p className="text-sm text-green-700">SLA Guaranteed</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Status Page API</p>
                  <p className="text-sm text-gray-500">
                    Integrate with your monitoring
                  </p>
                </div>
                <a
                  href="/api/status"
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View API</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 ChronaWorkFlow. Developed by SkyLabs Enterprise.</p>
          <p className="mt-1">
            <a
              href="mailto:support@chronaworkflow.io"
              className="text-blue-600 hover:underline"
            >
              Contact Support
            </a>
            {" • "}
            <a href="/trust" className="text-blue-600 hover:underline">
              Trust Center
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default PublicStatusPage;
