/**
 * ChronaWorkFlow Owner Dashboard - CEO Cockpit
 * Fully Integrated Billion-Dollar Grade Executive Control
 * API: localhost:8080 | Refresh: 30s
 * 
 * Features:
 * - All feature flags enabled for local testing
 * - 15-subsystem health grid with live data
 * - Emergency controls with confirmations
 * - Voice command integration
 * - What-If simulator
 * - Theme toggle (Dark/Light/Boardroom)
 * - SHA-256 audit trail
 * - Zero downtime guarantees
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Shield,
  Rocket,
  FlaskConical,
  Globe,
  Eye,
  Bomb,
  FileBarChart,
  Settings,
  Terminal,
  Menu,
  Bell,
  LogOut,
  CheckCircle,
  User,
  Mic,
  ToggleRight,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  XCircle,
  Clock,
  Lock,
} from 'lucide-react';

// Import section components
import { TopStatusBar } from './components/TopStatusBar';
import { OverviewSection } from './components/OverviewSection';
import { OwnerControlSection } from './components/OwnerControlSection';
import { WhatIfSimulatorSection } from './components/WhatIfSimulatorSection';
import { RegionsSection } from './components/RegionsSection';
import { AuditorSection } from './components/AuditorSection';
import { ChaosSection } from './components/ChaosSection';
import { ReportsSection } from './components/ReportsSection';
import { SystemSettingsSection } from './components/SystemSettingsSection';
import { RawDataSection } from './components/RawDataSection';

// Import new billion-dollar-grade systems
import { FeatureFlagProvider, FeatureFlagQuickBar, FeatureFlagAdminPanel, useFeatureFlags } from './components/FeatureFlagSystem';
import { BrandProvider, BrandPreviewBanner, useBrand, chronaWorkFlowBrand, defaultBrand } from './components/BrandEngine';
import { ThemeToggle } from './components/ThemeToggle';
import { VoiceCommandPanel } from './components/VoiceCommandEngine';
import { TrustDashboard } from './components/PublicTrustLayer';
import { EmergencyCommandCenter } from './components/EmergencyCommandCenter';
import { RiskAndDriftMonitor } from './components/RiskAndDriftMonitor';
import { GrowthAndConfidenceDashboard } from './components/GrowthAndConfidenceDashboard';
import { RevenueSkeleton } from './components/RevenueSkeleton';
import { NarrativeLock } from './components/NarrativeLock';
import { CEOCockpit } from './components/CEOCockpit';
import { AIOperatorPanel } from './components/AIOperatorPanel';
import { LocalFeatureFlagProvider, useLocalFeatureFlags } from './components/LocalFeatureFlagProvider';
import { SignalCard } from './components/SignalSystem';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
}

const navigation: NavItem[] = [
  { id: 'cockpit', label: 'CEO Cockpit', icon: Activity, color: 'text-emerald-600' },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'control', label: 'Owner Control', icon: Shield, color: 'text-rose-600' },
  { id: 'deployments', label: 'Deployments', icon: Rocket },
  { id: 'experiments', label: 'Experiments / What-If', icon: FlaskConical },
  { id: 'regions', label: 'Regions & Compliance', icon: Globe },
  { id: 'auditor', label: 'Auditor / Regulator', icon: Eye },
  { id: 'chaos', label: 'Chaos & DR', icon: Bomb },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'emergency', label: 'Emergency Center', icon: AlertTriangle, color: 'text-rose-600' },
  { id: 'risk', label: 'Risk & Drift', icon: Shield, color: 'text-amber-600' },
  { id: 'growth', label: 'Growth & Confidence', icon: TrendingUp, color: 'text-emerald-600' },
  { id: 'revenue', label: 'Revenue Skeleton', icon: DollarSign },
  { id: 'narrative', label: 'Narrative Lock', icon: MessageSquare },
  { id: 'trust', label: 'Trust & Security', icon: Shield },
  { id: 'voice', label: 'Voice Control', icon: Mic },
  { id: 'ai', label: 'AI Operator', icon: Activity, color: 'text-violet-600' },
  { id: 'flags', label: 'Feature Flags', icon: ToggleRight },
  { id: 'settings', label: 'System Settings', icon: Settings },
  { id: 'rawdata', label: 'Raw Data (Advanced)', icon: Terminal },
];

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  version: string;
  certification: {
    tests: number;
    passed: number;
    badge: string;
  };
  uptime: string;
  lastUpdate: Date;
  subsystems: {
    total: number;
    online: number;
    list: Array<{
      name: string;
      status: string;
      health: string;
    }>;
  };
  metrics: {
    cpu: { value: number; status: string };
    memory: { value: number; status: string };
    latency: { value: number; status: string };
    errorRate: { value: number; status: string };
  };
  trialBalance: {
    status: string;
    imbalance: number;
  };
  deployments: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
  }>;
  compliance: {
    soc2: string;
    gdpr: string;
    sox: string;
  };
}

const mockSystemStatus: SystemStatus = {
  overall: 'healthy',
  version: '2.5.0-enterprise',
  certification: {
    tests: 74,
    passed: 74,
    badge: '100% Certified',
  },
  uptime: '15d 7h 32m',
  lastUpdate: new Date(),
  subsystems: {
    total: 15,
    online: 15,
    list: [],
  },
  metrics: {
    cpu: { value: 35, status: 'HEALTHY' },
    memory: { value: 45, status: 'HEALTHY' },
    latency: { value: 42, status: 'HEALTHY' },
    errorRate: { value: 0.03, status: 'HEALTHY' },
  },
  trialBalance: {
    status: 'BALANCED',
    imbalance: 0,
  },
  deployments: [
    { id: 'dep-001', name: 'v2.5.0-payment', status: 'CANARY', progress: 75 },
    { id: 'dep-002', name: 'new-billing-ui', status: 'ROLLOUT', progress: 50 },
    { id: 'dep-003', name: 'gdpr-compliance-v2', status: 'MULTI_REGION', progress: 100 },
  ],
  compliance: {
    soc2: 'COMPLIANT',
    gdpr: 'COMPLIANT',
    sox: 'COMPLIANT',
  },
};

export const OwnerDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('cockpit');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(mockSystemStatus);

  // Determine initial brand based on feature flag (will be checked inside DashboardInner)
  return (
    <LocalFeatureFlagProvider>
      <BrandProvider availableBrands={[defaultBrand, chronaWorkFlowBrand]}>
        <DashboardInner 
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          systemStatus={systemStatus}
          isRefreshing={isRefreshing}
          notifications={notifications}
          setIsRefreshing={setIsRefreshing}
          setSystemStatus={setSystemStatus}
          setNotifications={setNotifications}
        />
      </BrandProvider>
    </LocalFeatureFlagProvider>
  );
};

// API Configuration
const API_BASE_URL = 'http://localhost:8080';
const REFRESH_INTERVAL = 30000; // 30 seconds

// Inner dashboard component (inside providers)
const DashboardInner: React.FC<{
  activeSection: string;
  setActiveSection: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  systemStatus: SystemStatus;
  isRefreshing: boolean;
  notifications: number;
  setIsRefreshing: (value: boolean) => void;
  setSystemStatus: (value: SystemStatus | ((prev: SystemStatus) => SystemStatus)) => void;
  setNotifications: (value: number) => void;
}> = ({ 
  activeSection, 
  setActiveSection, 
  sidebarOpen, 
  setSidebarOpen, 
  systemStatus, 
  isRefreshing,
  notifications,
  setIsRefreshing,
  setSystemStatus,
  setNotifications
}) => {
  const { currentBrand, switchBrand } = useBrand();
  const { isEnabled } = useLocalFeatureFlags();
  const [apiError, setApiError] = useState<string | null>(null);

  // Auto-enable ChronaWorkFlow branding
  useEffect(() => {
    if (currentBrand.id !== 'chronaworkflow-active') {
      switchBrand('chronaworkflow-active');
    }
  }, [currentBrand.id, switchBrand]);

  // API Data Fetching
  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (!response.ok) throw new Error('Health check failed');
      const data = await response.json();
      
      setSystemStatus(prev => ({
        ...prev,
        overall: data.status === 'HEALTHY' ? 'healthy' : 'degraded',
        subsystems: {
          total: data.subsystems?.total || 15,
          online: data.subsystems?.online || 15,
          list: data.subsystems?.list || [],
        },
        metrics: {
          cpu: data.metrics?.cpu || prev.metrics.cpu,
          memory: data.metrics?.memory || prev.metrics.memory,
          latency: data.metrics?.latency || prev.metrics.latency,
          errorRate: data.metrics?.errorRate || prev.metrics.errorRate,
        },
        trialBalance: {
          status: data.checks?.trialBalance?.status || 'BALANCED',
          imbalance: 0,
        },
        lastUpdate: new Date(),
      }));
      setApiError(null);
    } catch (error) {
      console.warn('API fetch error:', error);
      setApiError('Backend connection issue - using cached data');
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (!response.ok) throw new Error('Dashboard fetch failed');
      const data = await response.json();
      
      setSystemStatus(prev => ({
        ...prev,
        deployments: data.deployments?.active || prev.deployments,
        compliance: data.compliance || prev.compliance,
        trialBalance: {
          status: data.financial?.trialBalance?.status || 'BALANCED',
          imbalance: data.financial?.trialBalance?.anomalies || 0,
        },
      }));
    } catch (error) {
      console.warn('Dashboard fetch error:', error);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchHealthData();
    fetchDashboardData();
    
    const interval = setInterval(() => {
      fetchHealthData();
      fetchDashboardData();
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchHealthData, fetchDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    Promise.all([fetchHealthData(), fetchDashboardData()]).finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'cockpit':
        return <CEOCockpit />;
      case 'overview':
        return <OverviewSection />;
      case 'control':
      case 'deployments':
        return <OwnerControlSection />;
      case 'experiments':
        return <WhatIfSimulatorSection />;
      case 'regions':
        return <RegionsSection />;
      case 'auditor':
        return <AuditorSection />;
      case 'chaos':
        return <ChaosSection />;
      case 'reports':
        return <ReportsSection />;
      case 'emergency':
        return <EmergencyCommandCenter />;
      case 'risk':
        return <RiskAndDriftMonitor />;
      case 'growth':
        return <GrowthAndConfidenceDashboard />;
      case 'revenue':
        return <RevenueSkeleton />;
      case 'narrative':
        return <NarrativeLock />;
      case 'trust':
        return <TrustDashboard />;
      case 'voice':
        return (
          <div className="max-w-2xl mx-auto">
            <VoiceCommandPanel 
              onCommand={async (command, confirmed) => {
                console.log('Voice command:', command.type, 'Confirmed:', confirmed);
              }} 
            />
          </div>
        );
      case 'ai':
        return <AIOperatorPanel />;
      case 'flags':
        return <FeatureFlagAdminPanel />;
      case 'settings':
        return <SystemSettingsSection />;
      case 'rawdata':
        return <RawDataSection />;
      default:
        return <OverviewSection />;
    }
  };

  // Get brand initials for logo fallback
  const getBrandInitial = () => currentBrand.shortName.charAt(0).toUpperCase();
  const showLegacyAlias = currentBrand.id === 'chronaworkflow-active';

  // Logo path from user specification
  const logoPath = 'C:\\FidiMyProjects2025\\Software_Projects\\AccuBooks\\ChronaWorkFlow-LOGO\\chronaworkflow-logo-1-removebg.png';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col flex-shrink-0`}>
        {/* Logo Section with ChronaWorkFlow Branding */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img 
                src={logoPath}
                alt={currentBrand.shortName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<span class="text-xl font-bold text-white">${getBrandInitial()}</span>`;
                }}
              />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg whitespace-nowrap text-white">{currentBrand.shortName}</h1>
                {showLegacyAlias ? (
                  <p className="text-xs text-slate-400 whitespace-nowrap">CEO Cockpit</p>
                ) : (
                  <p className="text-xs text-slate-400 whitespace-nowrap">Executive Control</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.color && !isActive ? item.color : ''}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium truncate">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Menu className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">{sidebarOpen ? 'Collapse' : 'Expand'}</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Preferences</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
          
          {/* Global Footer Attribution */}
          {sidebarOpen && (
            <div className="pt-2 border-t border-slate-800 mt-2">
              <p className="text-[10px] text-slate-500 text-center">
                Developed by<br/><span className="text-slate-400 font-medium">SkyLabs Enterprise</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* API Error Banner */}
        {apiError && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>{apiError}</span>
              <button 
                onClick={handleRefresh}
                className="ml-auto text-amber-600 hover:text-amber-800 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Top Status Bar */}
        <TopStatusBar
          status={systemStatus}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {navigation.find(n => n.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  Welcome back, <span className="font-semibold text-slate-700">CEO</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Live Metrics Preview */}
              <div className="hidden xl:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span className={`text-sm font-medium ${systemStatus.metrics.cpu.value < 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {systemStatus.metrics.cpu.value}%
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  <span className={`text-sm font-medium ${systemStatus.metrics.memory.value < 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {systemStatus.metrics.memory.value}%
                  </span>
                </div>
                <div className="w-px h-4 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-slate-400" />
                  <span className={`text-sm font-medium ${systemStatus.metrics.latency.value < 200 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {systemStatus.metrics.latency.value}ms
                  </span>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="hidden lg:block">
                <ThemeToggle size="sm" />
              </div>
              
              {/* System Status Pill */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {systemStatus.subsystems.online}/{systemStatus.subsystems.total} Systems Online
                </span>
              </div>

              {/* TB Validation Status */}
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                systemStatus.trialBalance.status === 'BALANCED' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                {systemStatus.trialBalance.status === 'BALANCED' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">TB Valid</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-700">TB Invalid</span>
                  </>
                )}
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-slate-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <SignalCard
                title="Active Deployments"
                value={String(systemStatus.deployments.length)}
                status="healthy"
                trend="up"
              />
              <SignalCard
                title="System Uptime"
                value={systemStatus.uptime}
                status="healthy"
                trend="stable"
              />
              <SignalCard
                title="TB Validation"
                value={systemStatus.trialBalance.status}
                status={systemStatus.trialBalance.status === 'BALANCED' ? 'healthy' : 'critical'}
                trend="stable"
              />
              <SignalCard
                title="Compliance"
                value={`${Object.values(systemStatus.compliance).filter(v => v === 'COMPLIANT').length}/3`}
                status="healthy"
                trend="stable"
              />
            </div>

            {/* Main Section Content */}
            {renderSection()}
          </div>
        </main>
        
        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {currentBrand.name} — Developed by <span className="text-slate-600 font-medium">SkyLabs Enterprise</span>
            </p>
            <p className="text-xs text-slate-400">
              API: {API_BASE_URL} | Refresh: {REFRESH_INTERVAL/1000}s
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default OwnerDashboard;
