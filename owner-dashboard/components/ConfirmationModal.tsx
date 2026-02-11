/**
 * Confirmation Modal Component
 * Safety-first modal for destructive or critical actions
 */

import React, { useState } from 'react';
import { AlertTriangle, X, Shield, Lock, Activity } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  impact: string;
  severity: 'critical' | 'warning' | 'info';
  confirmationText: string;
  actionLabel: string;
  ownerName?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  impact,
  severity,
  confirmationText,
  actionLabel,
  ownerName = 'CEO',
}) => {
  const [inputText, setInputText] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const severityConfig = {
    critical: {
      icon: AlertTriangle,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-600',
      buttonColor: 'bg-rose-600 hover:bg-rose-700',
      titleColor: 'text-rose-900',
    },
    warning: {
      icon: Shield,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
      titleColor: 'text-amber-900',
    },
    info: {
      icon: Activity,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      titleColor: 'text-blue-900',
    },
  };

  const config = severityConfig[severity];
  const Icon = config.icon;
  const canConfirm = inputText === confirmationText;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsConfirming(false);
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className={`${config.bgColor} ${config.borderColor} border-b px-6 py-4`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${config.bgColor} ${config.iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className={`text-xl font-bold ${config.titleColor}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">{description}</p>

          {/* Impact Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900">Impact Summary</span>
            </div>
            <p className="text-sm text-slate-600">{impact}</p>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              To confirm, type: <code className="bg-slate-100 px-2 py-1 rounded text-slate-900 font-mono">{confirmationText}</code>
            </label>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Type "${confirmationText}" to confirm`}
              autoFocus
            />
          </div>

          {/* Owner Identity Log */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="w-4 h-4" />
            <span>This action will be logged under owner identity: <strong>{ownerName}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming}
            className={`px-6 py-2 text-white rounded-lg font-semibold transition-all ${config.buttonColor} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
          >
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
