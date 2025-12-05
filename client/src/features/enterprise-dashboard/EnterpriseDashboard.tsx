import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { DashboardLayout } from './components/DashboardLayout';
import { KpiGrid } from './components/KpiGrid';
import { DrilldownViewer } from './components/DrilldownViewer';
import { WorkflowInbox } from './workflows/WorkflowInbox';
import { useDashboardConfig } from './hooks/useDashboardConfig';
import { DashboardProvider } from './context/DashboardContext';
import { PredictiveInsights } from './components/PredictiveInsights';
import { EntitySelector } from './components/EntitySelector';
import { useEntityContext } from './context/EntityContext';

type DashboardView = 'overview' | 'analytics' | 'workflows' | 'reports';

export const EnterpriseDashboard: React.FC = () => {
  const { user } = useUser();
  const { currentEntity, setCurrentEntity, availableEntities } = useEntityContext();
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const { config, loading, error } = useDashboardConfig(user?.role);
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null);

  if (loading) return <div>Loading dashboard configuration...</div>;
  if (error) return <div>Error loading dashboard: {error.message}</div>;

  const handleKpiClick = (kpiId: string) => {
    setSelectedKpi(kpiId);
    setActiveView('analytics');
  };

  return (
    <DashboardProvider>
      <div className="enterprise-dashboard">
        <DashboardLayout
          header={
            <div className="flex items-center justify-between p-4 bg-white border-b">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold">
                  {user?.role} Dashboard
                </h1>
                <EntitySelector 
                  entities={availableEntities}
                  selectedEntity={currentEntity}
                  onSelect={setCurrentEntity}
                />
              </div>
              <nav className="flex space-x-4">
                {['overview', 'analytics', 'workflows', 'reports'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveView(view as DashboardView)}
                    className={`px-3 py-1 rounded-md ${
                      activeView === view
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
          }
          sidebar={
            <div className="p-4 bg-gray-50 h-full">
              <WorkflowInbox />
            </div>
          }
          main={
            <div className="p-6">
              {activeView === 'overview' && (
                <>
                  <KpiGrid 
                    kpis={config.kpis} 
                    onKpiClick={handleKpiClick} 
                  />
                  <PredictiveInsights />
                </>
              )}
              {activeView === 'analytics' && selectedKpi && (
                <DrilldownViewer kpiId={selectedKpi} />
              )}
              {activeView === 'workflows' && (
                <div>Workflow Management UI</div>
              )}
              {activeView === 'reports' && (
                <div>Custom Reports UI</div>
              )}
            </div>
          }
        />
      </div>
    </DashboardProvider>
  );
};
