/**
 * QuickBooks Migration Component
 * Import QBO/IIF files with progress tracking and AI categorization
 */

import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Download,
  Sparkles,
  Clock,
  Database,
  Users,
  Receipt,
} from 'lucide-react';

interface MigrationStatus {
  migrationId: string;
  status: 'pending' | 'parsing' | 'mapping' | 'importing' | 'categorizing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  itemsProcessed: number;
  totalItems: number;
  errors: Array<{ type: string; message: string }>;
}

interface MigrationResult {
  success: boolean;
  migrationId: string;
  durationMinutes: number;
  summary: {
    accountsImported: number;
    transactionsImported: number;
    customersImported: number;
    vendorsImported: number;
    invoicesImported: number;
    categorizedTransactions: number;
    categorizationAccuracy: number;
  };
  errors: Array<{ type: string; message: string }>;
  warnings: string[];
}

const supportedFormats = [
  { ext: '.qbo', name: 'QuickBooks Online', description: 'OFX format from QuickBooks Online or banks' },
  { ext: '.ofx', name: 'Open Financial Exchange', description: 'Standard bank export format' },
  { ext: '.qfx', name: 'Quicken Financial Exchange', description: 'Quicken export format' },
  { ext: '.iif', name: 'Intuit Interchange Format', description: 'QuickBooks Desktop export' },
];

export const QuickBooksMigration: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    const isValid = supportedFormats.some(f => f.ext === ext);
    
    if (!isValid) {
      setError(`Invalid file type. Supported formats: ${supportedFormats.map(f => f.ext).join(', ')}`);
      return;
    }

    setFile(file);
    setError(null);
    setResult(null);
    setStatus(null);
  };

  const startMigration = async () => {
    if (!file) return;

    setError(null);
    setStatus({
      migrationId: '',
      status: 'pending',
      progress: 0,
      currentStep: 'Preparing upload...',
      itemsProcessed: 0,
      totalItems: 0,
      errors: [],
    });

    const formData = new FormData();
    formData.append('file', file);

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    const endpoint = ext === '.iif' ? '/api/migration/iif' : '/api/migration/qbo';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setStatus({
          migrationId: data.data.migrationId,
          status: 'completed',
          progress: 100,
          currentStep: 'Migration complete!',
          itemsProcessed: data.data.summary.transactionsImported,
          totalItems: data.data.summary.transactionsImported,
          errors: data.data.errors,
        });
      } else {
        setError(data.error || 'Migration failed');
        setStatus(prev => prev ? { ...prev, status: 'failed' } : null);
      }
    } catch (err) {
      setError('Failed to connect to server');
      setStatus(prev => prev ? { ...prev, status: 'failed' } : null);
    }
  };

  const resetMigration = () => {
    setFile(null);
    setStatus(null);
    setResult(null);
    setError(null);
  };

  const getStatusIcon = () => {
    if (!status) return null;
    
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card">
      {/* Header */}
      <div className="text-center mb-8 bg-card">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Import from QuickBooks
        </h1>
        <p className="text-muted-foreground">
          Migrate your data in under 15 minutes with AI-powered categorization
        </p>
      </div>

      {!status && !result && (
        <>
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10'
              : file ? 'border-success bg-success/10'
                : 'border-border hover:border-primary'}`}
          >
            {file ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-success" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={startMigration}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Start Migration
                  </button>
                  <button
                    onClick={resetMigration}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  accept=".qbo,.ofx,.qfx,.iif"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Select File
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Supported Formats */}
          <div className="mt-8 bg-card rounded-xl shadow-soft p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Supported Formats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedFormats.map((format) => (
                <div
                  key={format.ext}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                >
                  <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">
                      {format.name} ({format.ext})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                AI Categorization
              </h4>
              <p className="text-sm text-muted-foreground">
                Automatically categorize transactions with 95% accuracy
              </p>
            </div>
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                15-Minute Migration
              </h4>
              <p className="text-sm text-muted-foreground">
                Complete your migration quickly with smart data mapping
              </p>
            </div>
            <div className="bg-card rounded-xl shadow-soft p-6 text-center">
              <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">
                Complete Import
              </h4>
              <p className="text-sm text-muted-foreground">
                Accounts, transactions, customers, and invoices
              </p>
            </div>
          </div>
        </>
      )}

      {/* Progress */}
      {status && status.status !== 'completed' && status.status !== 'failed' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {status.currentStep}
          </h3>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {status.itemsProcessed} / {status.totalItems} items processed
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
            {getStatusIcon()}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
              {result.success ? 'Migration Complete!' : 'Migration Failed'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {result.success
                ? `Completed in ${result.durationMinutes.toFixed(1)} minutes`
                : 'Please check the errors below and try again'}
            </p>

            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <Database className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.summary.accountsImported}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Accounts</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <Receipt className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.summary.transactionsImported}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Transactions</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.summary.customersImported}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Customers</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(result.summary.categorizationAccuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">AI Accuracy</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={resetMigration}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <h4 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Errors ({result.errors.length})
              </h4>
              <ul className="space-y-2">
                {result.errors.map((err, index) => (
                  <li key={index} className="text-sm text-red-600 dark:text-red-400">
                    [{err.type}] {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Warnings ({result.warnings.length})
              </h4>
              <ul className="space-y-2">
                {result.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-600 dark:text-amber-400">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickBooksMigration;
