import React, { useEffect, useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  TrendingDown,
  Calendar,
} from 'lucide-react';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface RiskItem {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  category: string;
  impact: string;
  likelihood: string;
  mitigationSteps?: string[];
  detectedAt: string;
  resolvedAt?: string;
  status: 'ACTIVE' | 'MONITORING' | 'RESOLVED';
}

interface RiskTimelineProps {
  tenantId?: string;
  showResolved?: boolean;
  className?: string;
}

export const RiskTimeline: React.FC<RiskTimelineProps> = ({
  tenantId,
  showResolved = false,
  className = '',
}) => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/risks', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch risks');
        }

        const data = await response.json();
        setRisks(data);
      } catch (err) {
        console.error('Error fetching risks:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, [tenantId]);

  const getRiskConfig = (
    level: RiskLevel
  ): {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  } => {
    switch (level) {
      case 'CRITICAL':
        return {
          icon: <XCircle className="w-5 h-5" aria-hidden="true" />,
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          label: 'Critical Risk',
        };
      case 'HIGH':
        return {
          icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          label: 'High Risk',
        };
      case 'MEDIUM':
        return {
          icon: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          label: 'Medium Risk',
        };
      case 'LOW':
        return {
          icon: <Info className="w-5 h-5" aria-hidden="true" />,
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          label: 'Low Risk',
        };
    }
  };

  const getStatusConfig = (
    status: string
  ): {
    icon: React.ReactNode;
    color: string;
    label: string;
  } => {
    switch (status) {
      case 'RESOLVED':
        return {
          icon: <CheckCircle className="w-4 h-4" aria-hidden="true" />,
          color: 'text-green-700',
          label: 'Resolved',
        };
      case 'MONITORING':
        return {
          icon: <TrendingDown className="w-4 h-4" aria-hidden="true" />,
          color: 'text-blue-700',
          label: 'Monitoring',
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
          color: 'text-red-700',
          label: 'Active',
        };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const filteredRisks = showResolved
    ? risks
    : risks.filter((risk) => risk.status !== 'RESOLVED');

  if (loading) {
    return (
      <div className={className}>
        <LoadingState label="Loading risk timeline..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<AlertCircle className="w-6 h-6" />}
            title="Unable to load risks"
            description={error}
          />
        </CardContent>
      </Card>
    );
  }

  if (filteredRisks.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <EmptyState
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            title="No active risks detected"
            description="Your financial position looks healthy. We'll notify you if any risks are identified."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Risk Timeline</CardTitle>
          <CardDescription>
            Identified financial risks and their current status
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"
              aria-hidden="true"
            />

            {/* Risk Items */}
            <div className="space-y-6">
              {filteredRisks.map((risk, index) => {
                const riskConfig = getRiskConfig(risk.level);
                const statusConfig = getStatusConfig(risk.status);

                return (
                  <article
                    key={risk.id}
                    className="relative pl-14"
                    aria-labelledby={`risk-${risk.id}-title`}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`absolute left-3 top-1 w-6 h-6 rounded-full border-2 ${riskConfig.bgColor} ${riskConfig.borderColor} flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <div className={`${riskConfig.color}`}>
                        {riskConfig.icon}
                      </div>
                    </div>

                    {/* Risk Card */}
                    <div
                      className={`p-4 rounded-lg border-2 ${riskConfig.borderColor} ${riskConfig.bgColor}`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3
                            id={`risk-${risk.id}-title`}
                            className={`text-lg font-semibold ${riskConfig.color}`}
                          >
                            {risk.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {risk.category}
                            </Badge>
                            <span
                              className={`flex items-center gap-1 text-xs font-medium ${statusConfig.color}`}
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <Badge
                            variant={
                              risk.level === 'CRITICAL' || risk.level === 'HIGH'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {riskConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-3">
                        {risk.description}
                      </p>

                      {/* Impact & Likelihood */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Impact
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {risk.impact}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Likelihood
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {risk.likelihood}
                          </p>
                        </div>
                      </div>

                      {/* Mitigation Steps */}
                      {risk.mitigationSteps && risk.mitigationSteps.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-600 mb-2">
                            Recommended Actions:
                          </p>
                          <ul className="space-y-1">
                            {risk.mitigationSteps.map((step, stepIndex) => (
                              <li
                                key={stepIndex}
                                className="text-sm text-gray-700 flex items-start"
                              >
                                <span className="mr-2">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 pt-3 border-t border-gray-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" aria-hidden="true" />
                          Detected: {formatDate(risk.detectedAt)}
                        </span>
                        {risk.resolvedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" aria-hidden="true" />
                            Resolved: {formatDate(risk.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Risk Level Guide
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as RiskLevel[]).map(
                (level) => {
                  const config = getRiskConfig(level);
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <div className={config.color}>{config.icon}</div>
                      <span className="text-sm text-gray-700">
                        {config.label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskTimeline;
