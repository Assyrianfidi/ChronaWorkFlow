/**
 * Security & Compliance Component
 * Security scoreboard, threats, audit controls, AI risk assessment
 */

import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Eye, FileText, CheckCircle, AlertTriangle, XCircle, Search, UserX, Scan, Bell } from 'lucide-react';
import { Card, Button, StatusBadge, ProgressBar } from './common';
import { mockSecurityEvents } from '../data';

export const SecurityDashboard: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [auditRunning, setAuditRunning] = useState(false);

  // Security metrics
  const securityScore = 87;
  const activeThreats = 3;
  const failedLogins = 12;
  const blockedAttacks = 156;
  const mfaEnabled = 85; // percentage

  const handleSecurityScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 3000);
  };

  const handleAudit = () => {
    setAuditRunning(true);
    setTimeout(() => {
      setAuditRunning(false);
    }, 5000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Security Score */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Security Score</p>
              <p className="text-4xl font-bold mt-1">{securityScore}/100</p>
              <p className="text-sm mt-2 opacity-90">Excellent</p>
            </div>
            <ShieldCheck className="w-16 h-16 opacity-30" />
          </div>
          <div className="mt-4">
            <ProgressBar value={securityScore} max={100} color="green" showLabel={false} />
          </div>
        </div>

        {/* Active Threats */}
        <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Threats</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{activeThreats}</p>
              <p className="text-sm text-gray-400 mt-1">Medium priority</p>
            </div>
            <div className="p-4 bg-red-50 rounded-full">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Failed Logins */}
        <div className="bg-white rounded-2xl p-6 border border-yellow-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Failed Logins (24h)</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{failedLogins}</p>
              <p className="text-sm text-gray-400 mt-1">2 IPs blocked</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-full">
              <UserX className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Security Services Status */}
      <Card title="Security Services">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Firewall', status: 'active', icon: Shield },
            { name: 'DDoS Protection', status: 'active', icon: ShieldCheck },
            { name: 'Intrusion Detection', status: 'active', icon: Eye },
            { name: 'WAF', status: 'active', icon: Lock },
            { name: 'Rate Limiting', status: 'active', icon: AlertTriangle },
            { name: 'Bot Detection', status: 'active', icon: Scan },
            { name: 'SSL/TLS', status: 'active', icon: Lock },
            { name: 'Audit Logging', status: 'active', icon: FileText },
          ].map((service) => (
            <div key={service.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <service.icon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">{service.name}</p>
                <StatusBadge status="active" size="sm" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events */}
        <Card title="Recent Security Events" action={
          <Button size="sm" variant="primary" onClick={handleSecurityScan} loading={scanning}>
            <Scan className="w-4 h-4 mr-1" />
            {scanning ? 'Scanning...' : 'Run Scan'}
          </Button>
        }>
          <div className="space-y-3">
            {mockSecurityEvents.map((event) => (
              <div key={event.id} className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {event.severity === 'high' || event.severity === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{event.type}</p>
                      <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{event.timestamp}</span>
                        {event.ip && <span>IP: {event.ip}</span>}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={event.severity} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance & Controls */}
        <Card title="Audit & Compliance" action={
          <Button size="sm" variant="primary" onClick={handleAudit} loading={auditRunning}>
            <FileText className="w-4 h-4 mr-1" />
            {auditRunning ? 'Running...' : 'Start Audit'}
          </Button>
        }>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">MFA Enrollment</span>
                <span className="text-sm text-gray-500">{mfaEnabled}%</span>
              </div>
              <ProgressBar value={mfaEnabled} max={100} color={mfaEnabled > 80 ? 'green' : 'yellow'} showLabel={false} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Password Strength</span>
                <span className="text-sm text-gray-500">92%</span>
              </div>
              <ProgressBar value={92} max={100} color="green" showLabel={false} />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Data Encryption</span>
                <span className="text-sm text-gray-500">100%</span>
              </div>
              <ProgressBar value={100} max={100} color="green" showLabel={false} />
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-900 text-sm">AI Risk Assessment</h4>
              <p className="text-sm text-blue-700 mt-1">
                Overall security posture is strong. Recommend enabling MFA for remaining 15% of users and reviewing failed login patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">GDPR Compliant</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">SOC 2 Ready</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
