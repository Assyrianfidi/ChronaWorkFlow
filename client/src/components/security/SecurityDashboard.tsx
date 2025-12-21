/**
 * Security Dashboard Component
 * Enterprise security monitoring and management interface
 */

import React, { useState, useEffect } from "react";
import EnterpriseSecurity, {
  SecurityAlert,
  SecurityEvent,
  UserSession,
} from "@/security/enterprise-security";

interface SecurityDashboardProps {
  security: EnterpriseSecurity;
  className?: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  security,
  className = "",
}) => {
  const [metrics, setMetrics] = useState(security.getSecurityMetrics());
  const [activeAlerts, setActiveAlerts] = useState(
    security.getSecurityAlerts("active"),
  );
  const [recentEvents, setRecentEvents] = useState(
    security.getSecurityEvents(),
  );
  const [activeSessions, setActiveSessions] = useState(
    security.getActiveSessions(),
  );
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(
    null,
  );
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  useEffect(() => {
    // Set up real-time updates
    const interval = setInterval(() => {
      setMetrics(security.getSecurityMetrics());
      setActiveAlerts(security.getSecurityAlerts("active"));
      setRecentEvents(security.getSecurityEvents().slice(0, 50));
      setActiveSessions(security.getActiveSessions());
    }, 5000);

    setRefreshInterval(interval);

    // Listen for security events
    const handleSecurityEvent = (e: CustomEvent) => {
      setRecentEvents((prev) => [e.detail, ...prev.slice(0, 49)]);
    };

    const handleSecurityAlert = (e: CustomEvent) => {
      setActiveAlerts((prev) => [e.detail, ...prev]);
    };

    document.addEventListener(
      "security:event",
      handleSecurityEvent as EventListener,
    );
    document.addEventListener(
      "security:alert",
      handleSecurityAlert as EventListener,
    );

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      document.removeEventListener(
        "security:event",
        handleSecurityEvent as EventListener,
      );
      document.removeEventListener(
        "security:alert",
        handleSecurityAlert as EventListener,
      );
    };
  }, [security]);

  const handleResolveAlert = (alertId: string) => {
    security.resolveAlert(alertId, "current-user");
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setSelectedAlert(null);
  };

  const handleTerminateSession = (sessionId: string) => {
    // This would call security.terminateSession
    console.log("Terminate session:", sessionId);
    setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const getSeverityColor = (
    severity: "low" | "medium" | "high" | "critical",
  ) => {
    switch (severity) {
      case "low":
        return "text-blue-600 bg-blue-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "critical":
        return "text-red-600 bg-red-100";
    }
  };

  const getEventTypeIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "login":
        return "🔑";
      case "logout":
        return "🚪";
      case "permission_denied":
        return "🚫";
      case "data_access":
        return "📊";
      case "configuration_change":
        return "⚙️";
      case "security_violation":
        return "⚠️";
      default:
        return "📋";
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={`security-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <h1>Security Dashboard</h1>
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={() => {
              setMetrics(security.getSecurityMetrics());
              setActiveAlerts(security.getSecurityAlerts("active"));
              setRecentEvents(security.getSecurityEvents().slice(0, 50));
              setActiveSessions(security.getActiveSessions());
            }}
          >
            🔄 Refresh
          </button>
          <button className="export-button">📥 Export Report</button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activeSessions}</div>
            <div className="metric-label">Active Sessions</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔒</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.lockedAccounts}</div>
            <div className="metric-label">Locked Accounts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.securityEvents}</div>
            <div className="metric-label">Total Events</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.activeAlerts}</div>
            <div className="metric-label">Active Alerts</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">❌</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.failedLogins24h}</div>
            <div className="metric-label">Failed Logins (24h)</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔍</div>
          <div className="metric-content">
            <div className="metric-value">{metrics.unusualActivity24h}</div>
            <div className="metric-label">Unusual Activity (24h)</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Active Alerts */}
        <div className="content-section">
          <div className="section-header">
            <h2>Active Alerts</h2>
            <span className="alert-count">{activeAlerts.length} active</span>
          </div>

          <div className="alerts-list">
            {activeAlerts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✅</div>
                <div className="empty-text">No active security alerts</div>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-item ${alert.severity}`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="alert-header">
                    <div className="alert-title">{alert.title}</div>
                    <div
                      className={`alert-severity ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity.toUpperCase()}
                    </div>
                  </div>
                  <div className="alert-description">{alert.description}</div>
                  <div className="alert-meta">
                    <span className="alert-time">
                      {formatTime(alert.timestamp)}
                    </span>
                    <span className="alert-users">
                      {alert.affectedUsers.length} users affected
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Events</h2>
            <span className="event-count">{recentEvents.length} recent</span>
          </div>

          <div className="events-list">
            {recentEvents.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="event-item"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="event-icon">{getEventTypeIcon(event.type)}</div>
                <div className="event-content">
                  <div className="event-title">{event.description}</div>
                  <div className="event-meta">
                    <span className="event-user">{event.userId}</span>
                    <span className="event-time">
                      {formatTime(event.timestamp)}
                    </span>
                    <span
                      className={`event-severity ${getSeverityColor(event.severity)}`}
                    >
                      {event.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="content-section">
          <div className="section-header">
            <h2>Active Sessions</h2>
            <span className="session-count">
              {activeSessions.length} active
            </span>
          </div>

          <div className="sessions-list">
            {activeSessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-user">{session.userId}</div>
                <div className="session-details">
                  <div className="session-ip">IP: {session.ipAddress}</div>
                  <div className="session-time">
                    Started: {formatTime(session.startTime)}
                  </div>
                  <div className="session-location">
                    {session.location
                      ? `${session.location.city}, ${session.location.country}`
                      : "Unknown location"}
                  </div>
                </div>
                <div className="session-actions">
                  <button
                    className="terminate-button"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Security Alert Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedAlert(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="alert-detail-header">
                <h3>{selectedAlert.title}</h3>
                <div
                  className={`alert-severity ${getSeverityColor(selectedAlert.severity)}`}
                >
                  {selectedAlert.severity.toUpperCase()}
                </div>
              </div>

              <div className="alert-detail-description">
                {selectedAlert.description}
              </div>

              <div className="alert-detail-meta">
                <div className="meta-item">
                  <strong>Time:</strong> {formatTime(selectedAlert.timestamp)}
                </div>
                <div className="meta-item">
                  <strong>Type:</strong> {selectedAlert.type.replace("_", " ")}
                </div>
                <div className="meta-item">
                  <strong>Status:</strong> {selectedAlert.status}
                </div>
                <div className="meta-item">
                  <strong>Affected Users:</strong>{" "}
                  {selectedAlert.affectedUsers.join(", ")}
                </div>
              </div>

              {selectedAlert.actions.length > 0 && (
                <div className="alert-actions">
                  <h4>Recommended Actions</h4>
                  <div className="actions-list">
                    {selectedAlert.actions.map((action, index) => (
                      <div key={index} className="action-item">
                        <div className="action-description">
                          {action.description}
                        </div>
                        <div
                          className={`action-status ${action.executed ? "executed" : "pending"}`}
                        >
                          {action.executed ? "✅ Executed" : "⏳ Pending"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="resolve-button"
                onClick={() => handleResolveAlert(selectedAlert.id)}
                disabled={selectedAlert.status === "resolved"}
              >
                {selectedAlert.status === "resolved"
                  ? "Resolved"
                  : "Resolve Alert"}
              </button>
              <button
                className="cancel-button"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Security Event Details</h2>
              <button
                className="close-button"
                onClick={() => setSelectedEvent(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="event-detail-header">
                <div className="event-icon">
                  {getEventTypeIcon(selectedEvent.type)}
                </div>
                <div className="event-detail-title">
                  <h3>{selectedEvent.description}</h3>
                  <div
                    className={`event-severity ${getSeverityColor(selectedEvent.severity)}`}
                  >
                    {selectedEvent.severity.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="event-detail-meta">
                <div className="meta-item">
                  <strong>User:</strong> {selectedEvent.userId}
                </div>
                <div className="meta-item">
                  <strong>Type:</strong> {selectedEvent.type.replace("_", " ")}
                </div>
                <div className="meta-item">
                  <strong>Time:</strong> {formatTime(selectedEvent.timestamp)}
                </div>
                <div className="meta-item">
                  <strong>IP Address:</strong> {selectedEvent.ipAddress}
                </div>
                <div className="meta-item">
                  <strong>User Agent:</strong> {selectedEvent.userAgent}
                </div>
              </div>

              {Object.keys(selectedEvent.details).length > 0 && (
                <div className="event-details">
                  <h4>Additional Details</h4>
                  <div className="details-list">
                    {Object.entries(selectedEvent.details).map(
                      ([key, value]) => (
                        <div key={key} className="detail-item">
                          <strong>{key}:</strong> {JSON.stringify(value)}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .security-dashboard {
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

        .refresh-button,
        .export-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #ddd;
          rounded-2;
          background: white;
          cursor: pointer;
          font-weight: 600;
          transition-colors duration-200;
        }

        .refresh-button:hover,
        .export-buttonhover:bg-#f0f0f0

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background: white;
          rounded-2;
          padding: 1.5rem;
          shadow-md;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-icon {
          font-size: 2rem;
          opacity: 0.7;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1;
        }

        .metric-label {
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .content-section {
          background: white;
          rounded-2;
          shadow-md;
          overflow: hidden;
        }

        .content-section:nth-child(3) {
          grid-column: 1 / -1;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          background: #fafbfc;
        }

        .section-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .alert-count,
        .event-count,
        .session-count {
          font-size: 0.875rem;
          color: #666;
          background: #f0f0f0;
          padding: 0.25rem 0.75rem;
          rounded-3;
        }

        .alerts-list,
        .events-list,
        .sessions-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #666;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 1rem;
        }

        .alert-item {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition-colors duration-200;
        }

        .alert-itemhover:bg-#f8f9fa

        .alert-item:last-child {
          border-bottom: none;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .alert-title {
          font-weight: 600;
          color: #1a1a1a;
        }

        .alert-severity {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          rounded-1;
        }

        .alert-description {
          color: #666;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .alert-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #999;
        }

        .event-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #eee;
          cursor: pointer;
          transition-colors duration-200;
        }

        .event-itemhover:bg-#f8f9fa

        .event-item:last-child {
          border-bottom: none;
        }

        .event-icon {
          font-size: 1.25rem;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .event-content {
          flex: 1;
        }

        .event-title {
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 0.25rem;
        }

        .event-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #999;
        }

        .event-severity {
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          rounded-1;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #eee;
        }

        .session-item:last-child {
          border-bottom: none;
        }

        .session-user {
          font-weight: 600;
          color: #1a1a1a;
        }

        .session-details {
          flex: 1;
          margin: 0 2rem;
        }

        .session-ip,
        .session-time,
        .session-location {
          font-size: 0.875rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .session-actions {
          display: flex;
          gap: 0.5rem;
        }

        .terminate-button {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          rounded-1;
          font-size: 0.875rem;
          cursor: pointer;
          transition-colors duration-200;
        }

        .terminate-buttonhover:bg-#c82333

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          rounded-2;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow: hidden;
          shadow-md;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          background: #fafbfc;
        }

        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          rounded-1;
        }

        .close-buttonhover:bg-#e9ecef

        .modal-body {
          padding: 1.5rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .alert-detail-header,
        .event-detail-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .alert-detail-header h3,
        .event-detail-title h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .alert-detail-description {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .alert-detail-meta,
        .event-detail-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .meta-item {
          font-size: 0.875rem;
          color: #666;
        }

        .meta-item strong {
          color: #1a1a1a;
        }

        .alert-actions {
          margin-top: 1.5rem;
        }

        .alert-actions h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8f9fa;
          rounded-2;
        }

        .action-description {
          font-size: 0.875rem;
          color: #666;
        }

        .action-status {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          rounded-1;
        }

        .action-status.executed {
          background: #d4edda;
          color: #155724;
        }

        .action-status.pending {
          background: #fff3cd;
          color: #856404;
        }

        .event-details {
          margin-top: 1.5rem;
        }

        .event-details h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1rem;
        }

        .details-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-item {
          font-size: 0.875rem;
          color: #666;
          font-family: monospace;
        }

        .detail-item strong {
          color: #1a1a1a;
          font-family: sans-serif;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #eee;
          background: #fafbfc;
        }

        .resolve-button,
        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #ddd;
          rounded-2;
          font-weight: 600;
          cursor: pointer;
          transition-colors duration-200;
        }

        .resolve-button {
          background: #28a745;
          color: white;
          border-color: #28a745;
        }

        .resolve-button:hover:not(:disabled) {
          background: #218838;
        }

        .resolve-button:disabled {
          background: #6c757d;
          border-color: #6c757d;
          cursor: not-allowed;
        }

        .cancel-button {
          background: white;
          color: #666;
        }

        .cancel-buttonhover:bg-#f0f0f0

        /* Severity Color Classes */
        .text-blue-600 {
          color: #0066cc;
        }
        .bg-blue-100 {
          background: #e6f3ff;
        }
        .text-yellow-600 {
          color: #ff9900;
        }
        .bg-yellow-100 {
          background: #fff4e6;
        }
        .text-orange-600 {
          color: #ff6600;
        }
        .bg-orange-100 {
          background: #ffe6cc;
        }
        .text-red-600 {
          color: #cc0000;
        }
        .bg-red-100 {
          background: #ffe6e6;
        }
      `}</style>
    </div>
  );
};

export default SecurityDashboard;
