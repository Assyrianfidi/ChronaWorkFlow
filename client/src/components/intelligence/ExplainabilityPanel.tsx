/**
 * Explainability Panel - Critical Trust Feature
 * 
 * Shows transparent, plain-English explanations for every insight
 */

import React from 'react';
import { SmartInsight } from '../../types/intelligence';
import { X, TrendingUp, Database, Calendar, Target, Info, Lightbulb } from 'lucide-react';

interface ExplainabilityPanelProps {
  insight: SmartInsight;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  insight,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { metadata, explanation, confidence, relatedEntities } = insight;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Info className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              How We Detected This
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close explainability panel"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Why This Matters */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Why This Matters</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{explanation}</p>
          </section>

          {/* Data Sources */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Data Sources</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <ul className="space-y-2">
                {relatedEntities.map((entity, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span className="text-gray-700">
                      {entity.type}: {entity.name || entity.id}
                    </span>
                  </li>
                ))}
                {relatedEntities.length === 0 && (
                  <li className="text-gray-600">All transaction and account data</li>
                )}
              </ul>
            </div>
          </section>

          {/* Time Window */}
          {metadata.timeRange && (
            <section>
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Time Window Analyzed</h3>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-700">
                  {new Date(metadata.timeRange.start).toLocaleDateString()} -{' '}
                  {new Date(metadata.timeRange.end).toLocaleDateString()}
                </p>
                {metadata.sampleSize && (
                  <p className="text-sm text-gray-600 mt-2">
                    Based on {metadata.sampleSize} data points
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Baseline Comparison */}
          {metadata.baseline !== undefined && metadata.current !== undefined && (
            <section>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Baseline Comparison</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Baseline (Average)</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${metadata.baseline.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Value</span>
                  <span className="text-lg font-semibold text-gray-900">
                    ${metadata.current.toLocaleString()}
                  </span>
                </div>
                {metadata.change !== undefined && (
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Change</span>
                    <span
                      className={`text-lg font-semibold ${
                        metadata.change > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {metadata.change > 0 ? '+' : ''}
                      ${metadata.change.toLocaleString()} (
                      {metadata.changePercentage?.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Calculation Details */}
          {metadata.calculation && (
            <section>
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Calculation</h3>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <code className="text-sm text-indigo-900 font-mono">
                  {metadata.calculation}
                </code>
              </div>
            </section>
          )}

          {/* Confidence Score */}
          <section>
            <div className="flex items-center space-x-2 mb-3">
              <Target className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confidence Score</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">
                  {(confidence * 100).toFixed(0)}% confident
                </span>
                <span className="text-sm text-gray-500">
                  {confidence >= 0.9
                    ? 'Very High'
                    : confidence >= 0.7
                    ? 'High'
                    : confidence >= 0.5
                    ? 'Medium'
                    : 'Low'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    confidence >= 0.9
                      ? 'bg-green-600'
                      : confidence >= 0.7
                      ? 'bg-blue-600'
                      : confidence >= 0.5
                      ? 'bg-yellow-600'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                This score reflects the statistical reliability of this insight based on data
                quality, sample size, and historical patterns.
              </p>
            </div>
          </section>

          {/* Plain English Summary */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-l-4 border-blue-600">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">In Plain English</h3>
            <p className="text-gray-700 leading-relaxed">
              {insight.description}
            </p>
          </section>

          {/* No Black Box Disclaimer */}
          <section className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong>Transparency Guarantee:</strong> This insight is based on rule-based
              analysis and statistical methods. No opaque AI or machine learning was used.
              All calculations are auditable and explainable.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
