/**
 * Trial Onboarding Component
 * Guides users through activation milestones during their 14-day trial
 */

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  Upload,
  FileText,
  MessageSquare,
  Zap,
  Users,
  CreditCard,
  Gift,
  Trophy,
  ChevronRight,
} from "lucide-react";

interface Milestone {
  type: string;
  name: string;
  description: string;
  targetDay: number;
  points: number;
  isRequired: boolean;
}

interface CompletedMilestone {
  type: string;
  completedAt: string;
  points: number;
}

interface TrialState {
  userId: number;
  companyId: string;
  trialStartDate: string;
  trialEndDate: string;
  status: "active" | "expired" | "converted" | "cancelled";
  daysRemaining: number;
  completedMilestones: CompletedMilestone[];
  pendingMilestones: Milestone[];
  activationScore: number;
  activationPercentage: number;
  riskLevel: "low" | "medium" | "high";
  recommendedActions: string[];
  lastActivityDate: string;
  totalLogins: number;
  featuresUsed: string[];
}

const milestoneIcons: Record<string, React.ReactNode> = {
  account_created: <CheckCircle className="w-5 h-5" />,
  data_imported: <Upload className="w-5 h-5" />,
  first_categorization: <Sparkles className="w-5 h-5" />,
  first_invoice: <FileText className="w-5 h-5" />,
  first_report: <FileText className="w-5 h-5" />,
  ai_copilot_used: <MessageSquare className="w-5 h-5" />,
  automation_created: <Zap className="w-5 h-5" />,
  bank_connected: <CreditCard className="w-5 h-5" />,
  team_member_invited: <Users className="w-5 h-5" />,
  full_automation: <Trophy className="w-5 h-5" />,
};

const milestoneActions: Record<string, { label: string; href: string }> = {
  data_imported: { label: "Import Data", href: "/migration" },
  first_categorization: { label: "View Transactions", href: "/transactions" },
  first_invoice: { label: "Create Invoice", href: "/invoices/new" },
  first_report: { label: "Generate Report", href: "/reports" },
  ai_copilot_used: { label: "Ask AI CFO", href: "/dashboard" },
  automation_created: { label: "Create Automation", href: "/automations/new" },
  bank_connected: { label: "Connect Bank", href: "/settings/bank" },
  team_member_invited: { label: "Invite Team", href: "/settings/team" },
};

export const TrialOnboarding: React.FC = () => {
  const [trialState, setTrialState] = useState<TrialState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetchTrialState();
  }, []);

  const fetchTrialState = async () => {
    try {
      const response = await fetch("/api/trial/state", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setTrialState(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch trial state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMilestoneStatus = (
    milestoneType: string,
  ): "completed" | "current" | "pending" => {
    if (!trialState) return "pending";

    const isCompleted = trialState.completedMilestones.some(
      (m) => m.type === milestoneType,
    );
    if (isCompleted) return "completed";

    const pendingIndex = trialState.pendingMilestones.findIndex(
      (m) => m.type === milestoneType,
    );
    if (pendingIndex === 0) return "current";

    return "pending";
  };

  const getAllMilestones = (): Milestone[] => {
    if (!trialState) return [];

    const completed = trialState.completedMilestones.map((cm) => ({
      type: cm.type,
      name: getMilestoneName(cm.type),
      description: "",
      targetDay: 0,
      points: cm.points,
      isRequired: false,
    }));

    return [...completed, ...trialState.pendingMilestones];
  };

  const getMilestoneName = (type: string): string => {
    const names: Record<string, string> = {
      account_created: "Account Created",
      data_imported: "Data Imported",
      first_categorization: "AI Categorization",
      first_invoice: "First Invoice",
      first_report: "First Report",
      ai_copilot_used: "AI CFO Used",
      automation_created: "Automation Created",
      bank_connected: "Bank Connected",
      team_member_invited: "Team Invited",
      full_automation: "Full Automation",
    };
    return names[type] || type;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!trialState) return null;

  return (
    <div className="space-y-6">
      {/* Trial Status Banner */}
      <div
        className={`rounded-xl p-6 ${
          trialState.daysRemaining <= 3
            ? "bg-gradient-to-r from-red-500 to-orange-500"
            : "bg-gradient-to-r from-purple-600 to-blue-600"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">
                {trialState.daysRemaining} days left in your trial
              </span>
            </div>
            <p className="text-white/80 text-sm">
              {trialState.daysRemaining <= 3
                ? "Upgrade now to keep all your data and settings!"
                : "Complete the milestones below to get the most out of AccuBooks."}
            </p>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Activation Progress
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Complete milestones to unlock the full power of AccuBooks
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {trialState.activationPercentage}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {trialState.activationScore} points earned
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-8">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${trialState.activationPercentage}%` }}
          />
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          {getAllMilestones().map((milestone, index) => {
            const status = getMilestoneStatus(milestone.type);
            const action = milestoneActions[milestone.type];

            return (
              <div
                key={milestone.type}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  status === "completed"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : status === "current"
                      ? "bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500"
                      : "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    status === "completed"
                      ? "bg-green-500 text-white"
                      : status === "current"
                        ? "bg-purple-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                  }`}
                >
                  {status === "completed" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    milestoneIcons[milestone.type] || (
                      <Circle className="w-5 h-5" />
                    )
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        status === "completed"
                          ? "text-green-700 dark:text-green-400"
                          : status === "current"
                            ? "text-purple-700 dark:text-purple-400"
                            : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {getMilestoneName(milestone.type)}
                    </span>
                    {milestone.isRequired && (
                      <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {milestone.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-medium ${
                      status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400"
                    }`}
                  >
                    +{milestone.points} pts
                  </span>

                  {status === "current" && action && (
                    <a
                      href={action.href}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1"
                    >
                      {action.label}
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}

                  {status === "completed" && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Actions */}
      {trialState.recommendedActions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" />
            Recommended Next Steps
          </h3>
          <ul className="space-y-3">
            {trialState.recommendedActions.map((action, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-600 dark:text-gray-400"
              >
                <ArrowRight className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Upgrade to Pro
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Keep all your data and unlock unlimited AI features
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {[
                "Unlimited AI CFO queries",
                "Advanced cash flow forecasting",
                "Multi-entity support",
                "Team collaboration",
                "Priority support",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                $99
                <span className="text-lg font-normal text-gray-500">
                  /month
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or $990/year (save 17%)
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = "/checkout?plan=pro")}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade Now
              </button>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialOnboarding;
