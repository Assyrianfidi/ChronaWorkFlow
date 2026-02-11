/**
 * Auditor / Regulator Section
 * Read-only dashboard for compliance and audit
 */

import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Clock,
  Download,
  Eye,
  Lock,
  CheckCircle,
  Calendar,
  User,
  ChevronRight,
  Key,
  AlertTriangle,
  Database,
  BookOpen,
  Receipt,
  Scale,
} from 'lucide-react';
import { AuditEvidence } from '../types';

const mockLedgerSnapshots = [
  { id: '1', date: new Date(), type: 'Trial Balance', status: 'balanced', entries: 15234, hash: '0x7a3f...9e2d' },
  { id: '2', date: new Date(Date.now() - 86400000), type: 'General Ledger', status: 'balanced', entries: 45231, hash: '0x8b4c...1f3a' },
  { id: '3', date: new Date(Date.now() - 172800000), type: 'Accounts Payable', status: 'balanced', entries: 8921, hash: '0x9d5e...2b4c' },
];

const mockAuditLog = [
  { id: '1', timestamp: new Date(), action: 'Journal Entry Posted', user: 'Sarah Chen', details: 'JE-2025-001: $5,000 to Office Expenses', severity: 'normal' },
  { id: '2', timestamp: new Date(Date.now() - 3600000), action: 'User Login', user: 'Mike Johnson', details: 'Admin access from 192.168.1.45', severity: 'normal' },
  { id: '3', timestamp: new Date(Date.now() - 7200000), action: 'System Backup', user: 'System', details: 'Automated daily backup completed', severity: 'normal' },
  { id: '4', timestamp: new Date(Date.now() - 14400000), action: 'Data Export', user: 'Emily Davis', details: 'Financial reports exported to Excel', severity: 'warning' },
];

const auditReports = [
  { id: 'soc2', name: 'SOC 2 Type II', description: 'Security and availability controls', lastGenerated: new Date(Date.now() - 604800000), status: 'ready', icon: Shield },
  { id: 'cpa', name: 'CPA Audit Report', description: 'Financial statement audit', lastGenerated: new Date(Date.now() - 2592000000), status: 'ready', icon: Scale },
  { id: 'tax', name: 'Tax Authority Report', description: 'IRS compliance documentation', lastGenerated: new Date(Date.now() - 1209600000), status: 'ready', icon: Receipt },
  { id: 'gdpr', name: 'GDPR Compliance', description: 'Data protection audit trail', lastGenerated: new Date(Date.now() - 7776000000), status: 'expired', icon: Database },
];

export const AuditorSection: React.FC = () => {
  const [tokenExpiry, setTokenExpiry] = useState('24h');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const generateToken = () => {
    const token = `AUDIT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    setGeneratedToken(token);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Auditor / Regulator Mode</h2>
            <p className="text-slate-300">Read-only access for compliance verification</p>
          </div>
        </div>
      </div>

      {/* Ledger Snapshots */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Ledger Snapshots
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {mockLedgerSnapshots.map((snapshot) => (
            <div key={snapshot.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{snapshot.type}</p>
                  <p className="text-sm text-slate-500">{snapshot.entries.toLocaleString()} entries • Hash: {snapshot.hash}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">{snapshot.date.toLocaleString()}</span>
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trial Balance Viewer */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            Trial Balance Viewer
          </h3>
          <div className="flex gap-2">
            <select className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
              <option>Current Period</option>
              <option>Q4 2025</option>
              <option>Q3 2025</option>
            </select>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">
              <Eye className="w-4 h-4" />
              View Full Report
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-sm text-emerald-600 mb-1">Total Debits</p>
            <p className="text-2xl font-bold text-emerald-700">$2,847,293.00</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-sm text-emerald-600 mb-1">Total Credits</p>
            <p className="text-2xl font-bold text-emerald-700">$2,847,293.00</p>
          </div>
          <div className="bg-emerald-100 border-2 border-emerald-300 rounded-xl p-4 text-center">
            <p className="text-sm text-emerald-700 mb-1">Balance Status</p>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <span className="text-xl font-bold text-emerald-700">Balanced</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Audit Log Timeline
        </h3>
        <div className="space-y-4">
          {mockAuditLog.map((log, index) => (
            <div key={log.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${log.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                {index < mockAuditLog.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{log.action}</p>
                    <p className="text-sm text-slate-500">{log.details}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{log.user}</p>
                    <p className="text-xs text-slate-400">{log.timestamp.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Evidence Export
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {auditReports.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    report.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {report.status}
                  </span>
                </div>
                <p className="font-medium text-slate-900">{report.name}</p>
                <p className="text-sm text-slate-500 mb-3">{report.description}</p>
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time-Scoped Access Token */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Generate Auditor Access Token
        </h3>
        <div className="flex gap-4 mb-4">
          <select
            value={tokenExpiry}
            onChange={(e) => setTokenExpiry(e.target.value)}
            className="px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
          <button
            onClick={generateToken}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
          >
            Generate Token
          </button>
        </div>
        {generatedToken && (
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-700 mb-2">Generated Token (copy immediately):</p>
            <code className="block bg-slate-100 px-3 py-2 rounded font-mono text-sm break-all">{generatedToken}</code>
            <p className="text-xs text-amber-600 mt-2">Expires in {tokenExpiry}</p>
          </div>
        )}
      </div>
    </div>
  );
};
