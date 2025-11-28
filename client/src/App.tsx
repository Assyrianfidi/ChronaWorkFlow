import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth-store';
import { ThemeProvider } from './components/ThemeProvider';
import { Layout } from './components/Layout';
import router from './routes';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { AdaptiveLayoutEngine } from './components/adaptive/AdaptiveLayoutEngine';
import { UserExperienceModeProvider } from './components/adaptive/UserExperienceMode.tsx';
import { UIPerformanceEngine } from './components/adaptive/UI-Performance-Engine.tsx';
import { NotificationSystem } from './components/adaptive/NotificationSystem';
import { AccessibilityProvider } from './components/adaptive/AccessibilityModes';
import { InteractionEngine } from './components/interaction/InteractionEngine.tsx';
import { WorkflowManager } from './components/interaction/WorkflowManager.tsx';
import { PredictiveAssistant } from './components/interaction/PredictiveAssistant.tsx';
import { ErrorRecoveryUI } from './components/interaction/ErrorRecoveryUI.tsx';
import { AnalyticsEngine } from './components/analytics/AnalyticsEngine';
import { BusinessIntelligence } from './components/analytics/BusinessIntelligence';
import { AutomationEngine } from './components/automation/AutomationEngine';
import { EnterpriseAPIGateway } from './components/integration/EnterpriseAPIGateway';
import { GraphQLServer } from './components/integration/GraphQLServer';
import { ThirdPartyIntegrations } from './components/integration/ThirdPartyIntegrations';
import { WebhookManager } from './components/integration/WebhookManager';
import './styles/globals.css';

// Extend the ImportMeta interface to include Vite's env variables
interface ImportMetaEnv {
  VITE_API_URL?: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check if user is already authenticated on initial load
    checkAuth();

    // Check API health
    const checkApiHealth = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/health`);
        console.log('API Health Status:', response.status);
      } catch (error) {
        console.error('API Health Check Failed:', error);
      }
    };

    checkApiHealth();
  }, [checkAuth]);

  return (
    <WebhookManager>
      <ThirdPartyIntegrations>
        <GraphQLServer>
          <EnterpriseAPIGateway>
            <AutomationEngine>
              <BusinessIntelligence>
                <AnalyticsEngine>
                  <ErrorRecoveryUI>
                    <PredictiveAssistant>
                      <WorkflowManager>
                        <InteractionEngine>
                          <AccessibilityProvider>
                            <NotificationSystem>
                              <UIPerformanceEngine>
                                <AdaptiveLayoutEngine>
                                  <UserExperienceModeProvider>
                                    <ThemeProvider>
                                      <ErrorBoundary>
                                        <Layout>
                                          <RouterProvider router={router} />
                                        </Layout>
                                        <ToastContainer />
                                      </ErrorBoundary>
                                    </ThemeProvider>
                                  </UserExperienceModeProvider>
                                </AdaptiveLayoutEngine>
                              </UIPerformanceEngine>
                            </NotificationSystem>
                          </AccessibilityProvider>
                        </InteractionEngine>
                      </WorkflowManager>
                    </PredictiveAssistant>
                  </ErrorRecoveryUI>
                </AnalyticsEngine>
              </BusinessIntelligence>
            </AutomationEngine>
          </EnterpriseAPIGateway>
        </GraphQLServer>
      </ThirdPartyIntegrations>
    </WebhookManager>
  );
}

export default App;
