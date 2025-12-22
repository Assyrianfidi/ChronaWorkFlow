import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  FileText,
  RefreshCw,
  Upload,
  XCircle,
} from 'lucide-react';

import Button from '@/components/ui/Button';

type MigrationPhase = 'pending' | 'importing' | 'completed' | 'failed';

type MigrationStatus = {
  status: MigrationPhase;
  progress: number;
  currentStep: string;
  itemsProcessed: number;
  totalItems: number;
};

type MigrationResult = {
  success: boolean;
  durationMinutes: number;
  summary: {
    accountsImported: number;
    transactionsImported: number;
    customersImported: number;
    vendorsImported: number;
    invoicesImported: number;
    categorizationAccuracy: number;
  };
  errors: Array<{ type: string; message: string }>;
  warnings: string[];
};

const SUPPORTED_EXTS = ['.qbo', '.ofx', '.qfx', '.iif'] as const;

export const QuickBooksMigration: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = useMemo(() => SUPPORTED_EXTS.join(','), []);

  const validateAndSetFile = useCallback((nextFile: File) => {
    const ext = nextFile.name.toLowerCase().slice(nextFile.name.lastIndexOf('.'));
    if (!SUPPORTED_EXTS.includes(ext as (typeof SUPPORTED_EXTS)[number])) {
      setError(`Invalid file type. Supported formats: ${SUPPORTED_EXTS.join(', ')}`);
      return;
    }

    setFile(nextFile);
    setError(null);
    setResult(null);
    setStatus(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) validateAndSetFile(dropped);
    },
    [validateAndSetFile],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const reset = () => {
    setFile(null);
    setStatus(null);
    setResult(null);
    setError(null);
  };

  const startMigration = async () => {
    if (!file) return;

    setError(null);
    setStatus({
      status: 'pending',
      progress: 0,
      currentStep: 'Preparing upload…',
      itemsProcessed: 0,
      totalItems: 0,
    });

    const formData = new FormData();
    formData.append('file', file);

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    const endpoint = ext === '.iif' ? '/api/migration/iif' : '/api/migration/qbo';

    try {
      setStatus({
        status: 'importing',
        progress: 35,
        currentStep: 'Uploading and importing…',
        itemsProcessed: 0,
        totalItems: 0,
      });

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
          status: 'completed',
          progress: 100,
          currentStep: 'Migration complete',
          itemsProcessed: data.data.summary.transactionsImported,
          totalItems: data.data.summary.transactionsImported,
        });
      } else {
        setError(data.error || 'Migration failed');
        setStatus((prev) =>
          prev ? { ...prev, status: 'failed', currentStep: 'Migration failed' } : null,
        );
      }
    } catch {
      setError('Failed to connect to server');
      setStatus((prev) =>
        prev ? { ...prev, status: 'failed', currentStep: 'Migration failed' } : null,
      );
    }
  };

  const uploadSurface = useMemo(() => {
    if (isDragging) return 'border-primary bg-muted/60';
    if (file) return 'border-primary bg-muted';
    return 'border-border bg-card hover:bg-muted/30';
  }, [file, isDragging]);

  if (status && status.status !== 'completed' && status.status !== 'failed') {
    return (
      <div className="rounded-xl border border-border bg-card shadow-soft p-8 text-center">
        <RefreshCw className="h-12 w-12 text-primary animate-spin mx-auto" />
        <div className="mt-4 text-lg font-semibold text-foreground">{status.currentStep}</div>
        <div className="mt-6 h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-3 bg-primary transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{status.progress}%</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card shadow-soft p-8 text-center">
          {result.success ? (
            <CheckCircle className="h-14 w-14 text-primary mx-auto" />
          ) : (
            <XCircle className="h-14 w-14 text-destructive mx-auto" />
          )}
          <div className="mt-4 text-2xl font-semibold text-foreground">
            {result.success ? 'Migration Complete' : 'Migration Failed'}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {result.success
              ? `Completed in ${result.durationMinutes.toFixed(1)} minutes`
              : 'Please review errors and try again'}
          </div>

          {result.success && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="text-2xl font-semibold text-foreground">
                  {result.summary.accountsImported}
                </div>
                <div className="text-sm text-muted-foreground">Accounts</div>
              </div>
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="text-2xl font-semibold text-foreground">
                  {result.summary.transactionsImported}
                </div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="text-2xl font-semibold text-foreground">
                  {result.summary.customersImported}
                </div>
                <div className="text-sm text-muted-foreground">Customers</div>
              </div>
              <div className="rounded-lg border border-border bg-muted p-4">
                <div className="text-2xl font-semibold text-foreground">
                  {(result.summary.categorizationAccuracy * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">AI Accuracy</div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              Import Another File
            </Button>
          </div>
        </div>

        {result.errors?.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-soft p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Errors ({result.errors.length})
            </div>
            <ul className="mt-3 space-y-2">
              {result.errors.map((e, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  [{e.type}] {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.warnings?.length > 0 && (
          <div className="rounded-xl border border-border bg-card shadow-soft p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Warnings ({result.warnings.length})
            </div>
            <ul className="mt-3 space-y-2">
              {result.warnings.map((w, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-8 transition-colors ${uploadSurface}`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full border border-border bg-muted flex items-center justify-center">
            {file ? (
              <FileText className="h-7 w-7 text-foreground" />
            ) : (
              <Upload className="h-7 w-7 text-muted-foreground" />
            )}
          </div>

          {file ? (
            <div className="space-y-1">
              <div className="text-base font-semibold text-foreground">{file.name}</div>
              <div className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-base font-semibold text-foreground">
                Drag and drop your file here
              </div>
              <div className="text-sm text-muted-foreground">or click to browse</div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            {file ? (
              <>
                <Button type="button" onClick={startMigration}>
                  <Upload className="h-4 w-4" />
                  Start Migration
                </Button>
                <Button type="button" variant="outline" onClick={reset}>
                  Choose Different File
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  inputRef.current?.click();
                }}
              >
                Select File
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-2 rounded-lg border border-border bg-card p-3 w-full">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm text-foreground">{error}</div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Supported: {SUPPORTED_EXTS.join(', ')}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-soft p-6">
        <div className="text-base font-semibold text-foreground">Supported Formats</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {SUPPORTED_EXTS.map((ext) => (
            <div key={ext} className="rounded-lg border border-border bg-muted p-3">
              <div className="text-sm font-semibold text-foreground">{ext}</div>
              <div className="text-sm text-muted-foreground">
                Export from QuickBooks or your bank and upload here.
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickBooksMigration;
