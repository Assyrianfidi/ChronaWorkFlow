import React, { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Info, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  inputs: Record<string, number | string>;
  output: number | string;
  explanation?: string;
}

interface CalculationExplainerProps {
  title: string;
  finalResult: number | string;
  resultUnit?: string;
  formula: string;
  steps: CalculationStep[];
  assumptions?: Array<{
    key: string;
    value: number | string;
    description: string;
  }>;
  className?: string;
}

export const CalculationExplainer: React.FC<CalculationExplainerProps> = ({
  title,
  finalResult,
  resultUnit = '',
  formula,
  steps,
  assumptions,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return value;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
            aria-expanded={isExpanded}
            aria-controls="calculation-details"
          >
            {isExpanded ? (
              <>
                Hide details
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Show how this was calculated
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Final Result */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 mb-1">Final Result</p>
          <p className="text-3xl font-bold text-blue-900">
            {formatValue(finalResult)} {resultUnit}
          </p>
          <code className="text-xs text-blue-700 mt-2 block">
            Formula: {formula}
          </code>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div id="calculation-details" className="space-y-6">
            {/* Assumptions */}
            {assumptions && assumptions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-600" aria-hidden="true" />
                  Key Assumptions
                </h4>
                <div className="space-y-2">
                  {assumptions.map((assumption, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {assumption.key.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatValue(assumption.value)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {assumption.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculation Steps */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Calculation Steps
              </h4>
              <ol className="space-y-3" aria-label="Calculation steps">
                {steps.map((step) => (
                  <li
                    key={step.step}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleStep(step.step)}
                      className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={expandedSteps.has(step.step)}
                      aria-controls={`step-${step.step}-details`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                              {step.step}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {step.description}
                            </span>
                          </div>
                          <code className="text-xs text-gray-600 ml-8 block">
                            {step.formula}
                          </code>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            = {formatValue(step.output)}
                          </span>
                          {expandedSteps.has(step.step) ? (
                            <ChevronUp
                              className="w-4 h-4 text-gray-400"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronDown
                              className="w-4 h-4 text-gray-400"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {expandedSteps.has(step.step) && (
                      <div
                        id={`step-${step.step}-details`}
                        className="px-4 pb-4 bg-gray-50 border-t border-gray-200"
                      >
                        {/* Inputs */}
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Inputs:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(step.inputs).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                              >
                                <span className="text-xs text-gray-600">
                                  {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="text-xs font-medium text-gray-900">
                                  {formatValue(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explanation */}
                        {step.explanation && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-900">
                              {step.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {/* Trust Statement */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                Why you can trust this calculation
              </h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    All calculations use deterministic math - no hidden algorithms
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Every step is shown with inputs, formulas, and outputs
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    You can verify the math yourself using the formulas provided
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    All assumptions are clearly stated and can be adjusted
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalculationExplainer;
