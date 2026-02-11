/**
 * Scenario Builder Wizard
 *
 * Step-by-step interface for executives to create and simulate scenarios
 * Plain-English labels, real-time risk assessment, advisory recommendations
 */

import React, { useState } from "react";
import {
  ScenarioType,
  CreateScenarioRequest,
  ScenarioResult,
  RiskLevel,
} from "../../types/forecasting";

interface ScenarioBuilderWizardProps {
  onComplete: (scenario: ScenarioResult) => void;
  onCancel: () => void;
}

type WizardStep = "type" | "config" | "review" | "results";

export const ScenarioBuilderWizard: React.FC<ScenarioBuilderWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [scenarioType, setScenarioType] = useState<ScenarioType | null>(null);
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scenarioTypes = [
    {
      type: ScenarioType.HIRING,
      name: "Hiring Decision",
      description: "Model the financial impact of hiring a new employee",
      icon: "👤",
      color: "blue",
    },
    {
      type: ScenarioType.LARGE_PURCHASE,
      name: "Major Purchase",
      description:
        "Analyze the effect of a large purchase or recurring expense",
      icon: "🛒",
      color: "purple",
    },
    {
      type: ScenarioType.REVENUE_CHANGE,
      name: "Revenue Change",
      description: "Simulate revenue growth or decline scenarios",
      icon: "📈",
      color: "green",
    },
    {
      type: ScenarioType.PAYMENT_DELAY,
      name: "Payment Delay",
      description: "Assess the impact of delayed customer payments",
      icon: "⏰",
      color: "orange",
    },
    {
      type: ScenarioType.AUTOMATION_CHANGE,
      name: "Automation Change",
      description: "Evaluate efficiency gains from automation",
      icon: "⚡",
      color: "yellow",
    },
    {
      type: ScenarioType.CUSTOM,
      name: "Custom Scenario",
      description: "Create a custom scenario with your own parameters",
      icon: "⚙️",
      color: "gray",
    },
  ];

  const handleTypeSelect = (type: ScenarioType) => {
    setScenarioType(type);
    setCurrentStep("config");
  };

  const handleConfigSubmit = () => {
    setCurrentStep("review");
  };

  const handleSimulate = async () => {
    if (!scenarioType) return;

    setIsSimulating(true);
    setError(null);

    try {
      const request: CreateScenarioRequest = {
        tenantId: "current-tenant-id", // Replace with actual tenant ID from auth context
        name: scenarioName,
        description: scenarioDescription,
        scenarioType,
        config,
      };

      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create scenario");
      }

      const data = await response.json();
      setResult(data.data);
      setCurrentStep("results");
      onComplete(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSimulating(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "type", label: "Choose Type" },
      { id: "config", label: "Configure" },
      { id: "review", label: "Review" },
      { id: "results", label: "Results" },
    ];

    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  index <= currentIndex
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm mt-2 text-gray-600">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-24 h-1 mx-4 ${
                  index < currentIndex ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderTypeSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What decision are you considering?
        </h2>
        <p className="text-gray-600">
          Choose the scenario that best matches your situation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarioTypes.map((type) => (
          <button
            key={type.type}
            onClick={() => handleTypeSelect(type.type)}
            className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {type.name}
            </h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderHiringConfig = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about the hire
        </h2>
        <p className="text-gray-600">
          We'll calculate the financial impact on your runway
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scenario Name
          </label>
          <input
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g., Hire Senior Engineer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Name or Role
          </label>
          <input
            type="text"
            value={config.employeeName || ""}
            onChange={(e) =>
              setConfig({ ...config, employeeName: e.target.value })
            }
            placeholder="e.g., Senior Software Engineer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Salary
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={config.salary || ""}
              onChange={(e) =>
                setConfig({ ...config, salary: Number(e.target.value) })
              }
              placeholder="120000"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Benefits (healthcare, 401k, etc.)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={config.benefits || ""}
              onChange={(e) =>
                setConfig({ ...config, benefits: Number(e.target.value) })
              }
              placeholder="24000"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Equipment & Setup Costs (one-time)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={config.equipment || ""}
              onChange={(e) =>
                setConfig({ ...config, equipment: Number(e.target.value) })
              }
              placeholder="5000"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ramp Period (months to full productivity)
          </label>
          <input
            type="number"
            value={config.rampMonths || ""}
            onChange={(e) =>
              setConfig({ ...config, rampMonths: Number(e.target.value) })
            }
            placeholder="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={config.startDate || ""}
            onChange={(e) =>
              setConfig({ ...config, startDate: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4 pt-6">
          <button
            onClick={() => setCurrentStep("type")}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleConfigSubmit}
            disabled={!scenarioName || !config.employeeName || !config.salary}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review your scenario
        </h2>
        <p className="text-gray-600">
          Make sure everything looks correct before we run the simulation
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-500">
            Scenario Type
          </span>
          <p className="text-lg font-semibold text-gray-900">
            {scenarioTypes.find((t) => t.type === scenarioType)?.name}
          </p>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-500">
            Scenario Name
          </span>
          <p className="text-lg font-semibold text-gray-900">{scenarioName}</p>
        </div>

        {scenarioType === ScenarioType.HIRING && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Employee
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  {config.employeeName}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Annual Salary
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  ${config.salary?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Benefits
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  ${config.benefits?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Equipment
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  ${config.equipment?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Ramp Period
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  {config.rampMonths} months
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Start Date
                </span>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(config.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="max-w-2xl mx-auto flex gap-4">
        <button
          onClick={() => setCurrentStep("config")}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSimulating ? "Simulating..." : "Run Simulation"}
        </button>
      </div>
    </div>
  );

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return "text-green-600 bg-green-50 border-green-200";
      case RiskLevel.MEDIUM:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case RiskLevel.HIGH:
        return "text-orange-600 bg-orange-50 border-orange-200";
      case RiskLevel.CRITICAL:
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Scenario Results
          </h2>
          <p className="text-gray-600">
            Here's how this decision would impact your financial position
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Risk Level Banner */}
          <div
            className={`border-2 rounded-lg p-6 ${getRiskLevelColor(result.riskLevel)}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Risk Level: {result.riskLevel}
                </h3>
                <p className="text-sm">
                  Risk Score: {result.riskScore.toFixed(0)}/100 | Success
                  Probability: {result.successProbability.toFixed(0)}%
                </p>
              </div>
              <div className="text-4xl">
                {result.riskLevel === RiskLevel.LOW && "✅"}
                {result.riskLevel === RiskLevel.MEDIUM && "⚠️"}
                {result.riskLevel === RiskLevel.HIGH && "🔶"}
                {result.riskLevel === RiskLevel.CRITICAL && "🚨"}
              </div>
            </div>
          </div>

          {/* Runway Impact */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Runway Impact
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">Baseline Runway</span>
                <p className="text-2xl font-bold text-gray-900">
                  {result.baselineRunway.toFixed(0)} days
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Projected Runway</span>
                <p className="text-2xl font-bold text-gray-900">
                  {result.projectedRunway.toFixed(0)} days
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Change</span>
                <p
                  className={`text-2xl font-bold ${result.runwayChange < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {result.runwayChange > 0 ? "+" : ""}
                  {result.runwayChange.toFixed(0)} days
                </p>
              </div>
            </div>
          </div>

          {/* Top Risk Drivers */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Risk Drivers
            </h3>
            <div className="space-y-3">
              {result.topRiskDrivers.slice(0, 3).map((driver, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {driver.factor}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {driver.description}
                      </p>
                      {driver.mitigation && (
                        <p className="text-sm text-blue-600 mt-2">
                          <strong>Mitigation:</strong> {driver.mitigation}
                        </p>
                      )}
                    </div>
                    <span
                      className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${
                        driver.impact === "high"
                          ? "bg-red-100 text-red-800"
                          : driver.impact === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {driver.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                💡 Advisory Recommendations
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                These are suggestions, not automatic actions. You remain in
                control.
              </p>
              <div className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="bg-white rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {rec.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {rec.description}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">
                          {rec.explanation}
                        </p>
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-green-600">
                            <strong>Benefit:</strong> {rec.expectedBenefit}
                          </span>
                          <span className="text-blue-600">
                            <strong>Risk Reduction:</strong> {rec.riskReduction}
                            %
                          </span>
                          <span className="text-gray-600">
                            <strong>Confidence:</strong> {rec.confidenceScore}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setCurrentStep("type");
                setScenarioType(null);
                setScenarioName("");
                setConfig({});
                setResult(null);
              }}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Create Another Scenario
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {renderStepIndicator()}

        {currentStep === "type" && renderTypeSelection()}
        {currentStep === "config" &&
          scenarioType === ScenarioType.HIRING &&
          renderHiringConfig()}
        {currentStep === "review" && renderReview()}
        {currentStep === "results" && renderResults()}
      </div>
    </div>
  );
};
