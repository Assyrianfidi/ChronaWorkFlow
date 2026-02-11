/**
 * Public Trust Layer - External Trust Visibility
 * Public Status Page, Trust Dashboard, Compliance Badges
 * 
 * Zero customer data exposure - Read-only sanitized metrics
 */

import React from 'react';
import {
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
  Server,
  Database,
  Globe,
  FileCheck,
  Lock,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { StatusIndicator, TrendIndicator, ConfidenceMeter, SignalCard, SignalGrid } from './SignalSystem';
import { useBrand } from './BrandEngine';

// Status Types
export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  uptime: number; // Percentage
  lastIncident?: Date;
  responseTime: number; // ms
}

export interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'critical' | 'major' | 'minor';
  startedAt: Date;
  resolvedAt?: Date;
  affectedServices: string[];
  description: string;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  timestamp: Date;
  message: string;
  status: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  affectedServices: string[];
  description: string;
}

export interface ComplianceBadge {
  type: 'soc2' | 'pci' | 'gdpr' | 'iso27001' | 'hipaa';
  name: string;
  status: 'active' | 'pending' | 'expired';
  certifiedAt: Date;
  expiresAt: Date;
  auditor: string;
  evidenceHash: string;
  lastVerified: Date;
}

export interface TrustMetrics {
  uptime30d: number;
  uptime90d: number;
  uptimeYtd: number;
  totalIncidents: number;
  avgResolutionTime: number; // minutes
  securityScore: number;
  complianceScore: number;
  dataProtectionScore: number;
}

// Mock Data
const mockServices: ServiceStatus[] = [
  { name: 'Core Platform', status: 'operational', uptime: 99.99, responseTime: 124 },
  { name: 'API', status: 'operational', uptime: 99.98, responseTime: 89 },
  { name: 'Authentication', status: 'operational', uptime: 100, responseTime: 45 },
  { name: 'Database', status: 'operational', uptime: 99.99, responseTime: 12 },
  { name: 'File Storage', status: 'operational', uptime: 99.97, responseTime: 234 },
  { name: 'Email Delivery', status: 'operational', uptime: 99.95, responseTime: 567 },
];

const mockIncidents: Incident[] = [
  {
    id: 'INC-2025-001',
    title: 'Elevated API Latency',
    status: 'resolved',
    severity: 'minor',
    startedAt: new Date('2025-02-01T14:30:00Z'),
    resolvedAt: new Date('2025-02-01T15:15:00Z'),
    affectedServices: ['API'],
    description: 'Increased response times on API endpoints due to database query optimization.',
    updates: [
      { timestamp: new Date('2025-02-01T14:30:00Z'), message: 'Investigating elevated API latency', status: 'investigating' },
      { timestamp: new Date('2025-02-01T15:00:00Z'), message: 'Identified root cause: query optimization in progress', status: 'identified' },
      { timestamp: new Date('2025-02-01T15:15:00Z'), message: 'Resolved - performance restored', status: 'resolved' },
    ],
  },
];

const mockMaintenance: MaintenanceWindow[] = [
  {
    id: 'MAINT-2025-001',
    title: 'Scheduled Database Maintenance',
    scheduledStart: new Date('2025-02-15T02:00:00Z'),
    scheduledEnd: new Date('2025-02-15T04:00:00Z'),
    affectedServices: ['Database', 'Core Platform'],
    description: 'Routine database optimization and index rebuilds.',
  },
];

const mockComplianceBadges: ComplianceBadge[] = [
  {
    type: 'soc2',
    name: 'SOC 2 Type II',
    status: 'active',
    certifiedAt: new Date('2024-06-01'),
    expiresAt: new Date('2025-06-01'),
    auditor: 'EY',
    evidenceHash: 'sha256:a1b2c3d4...',
    lastVerified: new Date(),
  },
  {
    type: 'gdpr',
    name: 'GDPR Compliant',
    status: 'active',
    certifiedAt: new Date('2024-01-01'),
    expiresAt: new Date('2026-01-01'),
    auditor: 'Internal',
    evidenceHash: 'sha256:e5f6g7h8...',
    lastVerified: new Date(),
  },
  {
    type: 'pci',
    name: 'PCI DSS Level 1',
    status: 'active',
    certifiedAt: new Date('2024-09-01'),
    expiresAt: new Date('2025-09-01'),
    auditor: 'Coalfire',
    evidenceHash: 'sha256:i9j0k1l2...',
    lastVerified: new Date(),
  },
];

const mockTrustMetrics: TrustMetrics = {
  uptime30d: 99.99,
  uptime90d: 99.98,
  uptimeYtd: 99.97,
  totalIncidents: 2,
  avgResolutionTime: 28,
  securityScore: 98,
  complianceScore: 100,
  dataProtectionScore: 99,
};

// Public Status Page Component
export const PublicStatusPage: React.FC = () => {
  const { currentBrand } = useBrand();
  
  const overallStatus = mockServices.every(s => s.status === 'operational') ? 'operational' : 'degraded';
  const config = {
    operational: { color: 'bg-emerald-500', text: 'All Systems Operational', icon: CheckCircle },
    degraded: { color: 'bg-amber-500', text: 'Some Services Degraded', icon: AlertTriangle },
    outage: { color: 'bg-rose-500', text: 'Service Outage', icon: AlertTriangle },
  }[overallStatus];
  const Icon = config.icon;

  // Get brand initial for fallback
  const brandInitial = currentBrand.shortName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src={currentBrand.logo.light} 
                  alt={currentBrand.shortName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span className="text-white font-bold text-xl">{brandInitial}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{currentBrand.shortName} Status</h1>
                <p className="text-sm text-slate-500">Enterprise System Status</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <a href="/" className="text-blue-600 hover:underline flex items-center gap-1">
                Back to App <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Overall Status */}
        <div className={`rounded-2xl p-8 mb-8 ${overallStatus === 'operational' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${config.color} rounded-2xl flex items-center justify-center`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{config.text}</h2>
              <p className="text-slate-600 mt-1">
                {mockServices.filter(s => s.status === 'operational').length} of {mockServices.length} services operational
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Service Status</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {mockServices.map(service => (
              <div key={service.name} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-slate-400" />
                  <span className="font-medium text-slate-900">{service.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-slate-500">{service.uptime}% uptime</span>
                  <span className="text-sm text-slate-500">{service.responseTime}ms</span>
                  <StatusIndicator 
                    status={service.status === 'operational' ? 'healthy' : service.status === 'degraded' ? 'degraded' : 'critical'} 
                    size="sm" 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Incidents */}
        {mockIncidents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Recent Incidents</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {mockIncidents.map(incident => (
                <div key={incident.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-slate-900">{incident.title}</h4>
                      <p className="text-sm text-slate-500 mt-1">
                        {incident.affectedServices.join(', ')} • {incident.status}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      incident.severity === 'critical' ? 'bg-rose-100 text-rose-700' :
                      incident.severity === 'major' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{incident.description}</p>
                  {incident.resolvedAt && (
                    <p className="text-sm text-slate-500 mt-2">
                      Resolved: {incident.resolvedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance */}
        {mockMaintenance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-8">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Scheduled Maintenance</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {mockMaintenance.map(maint => (
                <div key={maint.id} className="px-6 py-4">
                  <h4 className="font-medium text-slate-900">{maint.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    {maint.scheduledStart.toLocaleString()} - {maint.scheduledEnd.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{maint.description}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Affected: {maint.affectedServices.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uptime History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Uptime History</h3>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-900">{mockTrustMetrics.uptime30d}%</p>
                <p className="text-sm text-slate-500 mt-1">30 Days</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-900">{mockTrustMetrics.uptime90d}%</p>
                <p className="text-sm text-slate-500 mt-1">90 Days</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-900">{mockTrustMetrics.uptimeYtd}%</p>
                <p className="text-sm text-slate-500 mt-1">Year to Date</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-slate-500">
          <p>{currentBrand.legal.copyright} • <a href="/trust" className="text-blue-600 hover:underline">Trust Center</a></p>
          <p className="mt-2 text-xs">Developed by SkyLabs Enterprise</p>
        </div>
      </footer>
    </div>
  );
};

// Customer Trust Dashboard
export const TrustDashboard: React.FC = () => {
  const { currentBrand } = useBrand();
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Trust & Security</h2>
        <p className="text-slate-600 mt-1">Our commitment to protecting your data</p>
        <p className="text-xs text-slate-400 mt-2">{currentBrand.name} — Developed by SkyLabs Enterprise</p>
      </div>

      <SignalGrid columns={3} className="mb-6">
        <SignalCard
          title="Security Score"
          status="healthy"
          value={`${mockTrustMetrics.securityScore}/100`}
          subtitle="Continuous security monitoring"
          confidence="high"
        />
        <SignalCard
          title="Compliance"
          status="healthy"
          value={`${mockTrustMetrics.complianceScore}%`}
          subtitle="All certifications active"
          confidence="high"
        />
        <SignalCard
          title="Data Protection"
          status="healthy"
          value={`${mockTrustMetrics.dataProtectionScore}%`}
          subtitle="Encryption & backup verified"
          confidence="high"
        />
      </SignalGrid>

      {/* Compliance Badges */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Compliance Certifications</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockComplianceBadges.map(badge => (
              <div key={badge.type} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900">{badge.name}</h4>
                  <p className="text-sm text-slate-500">Auditor: {badge.auditor}</p>
                  <p className="text-sm text-slate-500">
                    Expires: {badge.expiresAt.toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusIndicator 
                      status={badge.status === 'active' ? 'healthy' : badge.status === 'pending' ? 'degraded' : 'critical'} 
                      size="sm" 
                    />
                    <span className="text-xs text-slate-400 font-mono">
                      {badge.evidenceHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Measures */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Security Measures</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Lock, title: 'End-to-End Encryption', desc: 'AES-256 encryption at rest and in transit' },
              { icon: Shield, title: 'SOC 2 Type II Certified', desc: 'Independent audit every 12 months' },
              { icon: Database, title: 'Automated Backups', desc: 'Point-in-time recovery with 1-hour RPO' },
              { icon: Users, title: 'Access Controls', desc: 'Role-based access with MFA required' },
              { icon: Globe, title: 'Global Compliance', desc: 'GDPR, PCI DSS, and regional compliance' },
              { icon: TrendingUp, title: '99.99% Uptime SLA', desc: 'Guaranteed availability with credits' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Compliance Badge Component
export const ComplianceBadgeStrip: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {mockComplianceBadges.map(badge => (
        <div 
          key={badge.type}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm"
          title={`${badge.name} - Verified ${badge.lastVerified.toLocaleDateString()}`}
        >
          <FileCheck className={`w-4 h-4 ${
            badge.status === 'active' ? 'text-emerald-500' : 
            badge.status === 'pending' ? 'text-amber-500' : 'text-rose-500'
          }`} />
          <span className="text-sm font-medium text-slate-700">{badge.name}</span>
          <span className="text-xs text-slate-400">
            {badge.expiresAt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default { PublicStatusPage, TrustDashboard, ComplianceBadgeStrip };
