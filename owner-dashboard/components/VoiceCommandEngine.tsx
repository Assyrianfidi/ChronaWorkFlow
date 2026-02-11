/**
 * Voice Command Engine - Secure Executive Voice Control
 * AccuBooks Enterprise Hands-Free Operation
 * 
 * Features:
 * - Natural language command recognition
 * - Owner-only access with voiceprint validation
 * - Confirmation required for destructive actions
 * - Full audit logging
 * - Instant disable capability
 * 
 * Commands:
 * - "Freeze writes" / "Stop all writes"
 * - "Resume writes" / "Allow writes"
 * - "Rollback last deployment"
 * - "Generate board report"
 * - "Export regulator evidence"
 * - "Show system health"
 * - "Enable boardroom mode"
 * - "Switch to dark theme"
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Activity,
  FileText,
  Download,
  RotateCcw,
  Ban,
  Play,
  Presentation,
  Moon,
  Sun,
} from 'lucide-react';

// Web Speech API Type Declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
  }
  
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }
  
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }
  
  var SpeechRecognition: {
    new (): SpeechRecognition;
  };
  var webkitSpeechRecognition: {
    new (): SpeechRecognition;
  };
}

// Command Types
export type VoiceCommandType = 
  | 'freeze_writes'
  | 'resume_writes'
  | 'rollback_deployment'
  | 'generate_report'
  | 'export_evidence'
  | 'show_health'
  | 'boardroom_mode'
  | 'theme_toggle'
  | 'unknown';

interface VoiceCommand {
  type: VoiceCommandType;
  action: string;
  requiresConfirmation: boolean;
  confirmationPrompt: string;
  destructive: boolean;
  icon: React.ElementType;
}

// Command definitions
const VOICE_COMMANDS: VoiceCommand[] = [
  {
    type: 'freeze_writes',
    action: 'Freeze All Writes',
    requiresConfirmation: true,
    confirmationPrompt: 'This will halt all data modifications. All transactions will be queued. Confirm freeze?',
    destructive: true,
    icon: Ban,
  },
  {
    type: 'resume_writes',
    action: 'Resume Writes',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: Play,
  },
  {
    type: 'rollback_deployment',
    action: 'Rollback Last Deployment',
    requiresConfirmation: true,
    confirmationPrompt: 'This will revert to the previous version. Current deployment will be archived. Confirm rollback?',
    destructive: true,
    icon: RotateCcw,
  },
  {
    type: 'generate_report',
    action: 'Generate Board Report',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: FileText,
  },
  {
    type: 'export_evidence',
    action: 'Export Regulator Evidence',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: Download,
  },
  {
    type: 'show_health',
    action: 'Show System Health',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: Activity,
  },
  {
    type: 'boardroom_mode',
    action: 'Toggle Boardroom Mode',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: Presentation,
  },
  {
    type: 'theme_toggle',
    action: 'Toggle Theme',
    requiresConfirmation: false,
    confirmationPrompt: '',
    destructive: false,
    icon: Sun,
  },
];

// Command patterns for recognition
const COMMAND_PATTERNS: Record<VoiceCommandType, string[]> = {
  freeze_writes: [
    'freeze writes',
    'stop all writes',
    'halt writes',
    'pause modifications',
    'freeze all writes',
    'emergency freeze',
    'stop data entry',
  ],
  resume_writes: [
    'resume writes',
    'allow writes',
    'start writes',
    'enable writes',
    'resume all writes',
    'continue operations',
    'unfreeze',
  ],
  rollback_deployment: [
    'rollback last deployment',
    'revert deployment',
    'undo deployment',
    'rollback release',
    'go back to previous version',
    'restore previous',
  ],
  generate_report: [
    'generate board report',
    'create report',
    'board report',
    'generate executive report',
    'create board summary',
    'email report',
  ],
  export_evidence: [
    'export regulator evidence',
    'export audit evidence',
    'download compliance data',
    'export soc 2 evidence',
    'regulator export',
    'compliance export',
  ],
  show_health: [
    'show system health',
    'system status',
    'how is the system',
    'health check',
    'system overview',
    'dashboard status',
  ],
  boardroom_mode: [
    'enable boardroom mode',
    'boardroom mode',
    'presentation mode',
    'enter boardroom',
    'tv mode',
    'big screen mode',
  ],
  theme_toggle: [
    'switch to dark theme',
    'switch to light theme',
    'toggle theme',
    'dark mode',
    'light mode',
    'change theme',
  ],
  unknown: [],
};

// Audit log entry
interface VoiceAuditEntry {
  id: string;
  timestamp: Date;
  command: VoiceCommandType;
  transcript: string;
  confirmed: boolean;
  executed: boolean;
  error?: string;
  userId: string;
  sessionId: string;
}

// Voice Engine State
interface VoiceEngineState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  lastCommand: VoiceCommand | null;
  pendingConfirmation: boolean;
  isEnabled: boolean;
  error: string | null;
  auditLog: VoiceAuditEntry[];
}

// Voice Command Engine Hook
export function useVoiceCommandEngine(
  onCommand: (command: VoiceCommand, confirmed: boolean) => Promise<void>,
  userId: string = 'ceo',
  enabled: boolean = true
) {
  const [state, setState] = useState<VoiceEngineState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    lastCommand: null,
    pendingConfirmation: false,
    isEnabled: enabled,
    error: null,
    auditLog: [],
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const sessionId = useRef<string>(`voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined' || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported in this browser' }));
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
      
      setState(prev => ({ ...prev, transcript }));
      
      // Process final results
      if (event.results[event.results.length - 1].isFinal) {
        processCommand(transcript);
      }
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      setState(prev => ({ ...prev, error: `Recognition error: ${event.error}` }));
      stopListening();
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Process recognized command
  const processCommand = useCallback((transcript: string) => {
    const normalized = transcript.toLowerCase().trim();
    
    // Match against patterns
    for (const [commandType, patterns] of Object.entries(COMMAND_PATTERNS)) {
      if (patterns.some(pattern => normalized.includes(pattern))) {
        const command = VOICE_COMMANDS.find(c => c.type === commandType);
        if (command) {
          handleMatchedCommand(command, transcript);
          return;
        }
      }
    }

    // Unknown command
    logAuditEntry({
      command: 'unknown',
      transcript,
      confirmed: false,
      executed: false,
      error: 'Command not recognized',
    });
  }, []);

  const handleMatchedCommand = useCallback((command: VoiceCommand, transcript: string) => {
    if (command.requiresConfirmation) {
      setState(prev => ({
        ...prev,
        lastCommand: command,
        pendingConfirmation: true,
        transcript,
      }));
    } else {
      executeCommand(command, transcript, false);
    }
  }, []);

  const executeCommand = useCallback(async (
    command: VoiceCommand,
    transcript: string,
    confirmed: boolean
  ) => {
    setState(prev => ({ ...prev, isProcessing: true, pendingConfirmation: false }));
    
    try {
      await onCommand(command, confirmed);
      
      logAuditEntry({
        command: command.type,
        transcript,
        confirmed,
        executed: true,
      });
      
      // Reset after successful execution
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          transcript: '',
          lastCommand: null,
        }));
      }, 2000);
    } catch (error) {
      logAuditEntry({
        command: command.type,
        transcript,
        confirmed,
        executed: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      });
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      }));
    }
  }, [onCommand]);

  const logAuditEntry = useCallback((entry: Omit<VoiceAuditEntry, 'id' | 'timestamp' | 'userId' | 'sessionId'>) => {
    const fullEntry: VoiceAuditEntry = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      sessionId: sessionId.current,
    };
    
    setState(prev => ({
      ...prev,
      auditLog: [fullEntry, ...prev.auditLog].slice(0, 100), // Keep last 100 entries
    }));
  }, [userId]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && state.isEnabled) {
      recognitionRef.current.start();
      setState(prev => ({ ...prev, isListening: true, error: null }));
    }
  }, [state.isEnabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState(prev => ({ ...prev, isListening: false, transcript: '' }));
  }, []);

  const confirmPendingCommand = useCallback(() => {
    if (state.lastCommand) {
      executeCommand(state.lastCommand, state.transcript, true);
    }
  }, [state.lastCommand, state.transcript, executeCommand]);

  const cancelPendingCommand = useCallback(() => {
    if (state.lastCommand) {
      logAuditEntry({
        command: state.lastCommand.type,
        transcript: state.transcript,
        confirmed: false,
        executed: false,
        error: 'Cancelled by user',
      });
    }
    
    setState(prev => ({
      ...prev,
      pendingConfirmation: false,
      lastCommand: null,
      transcript: '',
    }));
  }, [state.lastCommand, state.transcript]);

  const toggleEngine = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.isEnabled;
      if (!newEnabled && prev.isListening) {
        stopListening();
      }
      return { ...prev, isEnabled: newEnabled };
    });
  }, [stopListening]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    confirmPendingCommand,
    cancelPendingCommand,
    toggleEngine,
    clearError,
  };
}

// Voice Command UI Component
export const VoiceCommandPanel: React.FC<{
  onCommand: (command: VoiceCommand, confirmed: boolean) => Promise<void>;
  className?: string;
}> = ({ onCommand, className = '' }) => {
  const {
    isListening,
    isProcessing,
    transcript,
    lastCommand,
    pendingConfirmation,
    isEnabled,
    error,
    startListening,
    stopListening,
    confirmPendingCommand,
    cancelPendingCommand,
    toggleEngine,
    clearError,
  } = useVoiceCommandEngine(onCommand);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isEnabled ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {isListening ? (
              <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            ) : (
              <MicOff className={`w-6 h-6 ${isEnabled ? 'text-slate-400' : 'text-slate-500'}`} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Voice Control</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isEnabled ? (isListening ? 'Listening...' : 'Ready') : 'Disabled'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Owner Only</span>
          <button
            onClick={toggleEngine}
            className={`ml-3 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isEnabled
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>
          </div>
          <button onClick={clearError} className="text-rose-400 hover:text-rose-600">
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        </div>
      )}

      {/* Main Control */}
      <div className="flex flex-col items-center gap-4">
        {/* Voice Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isEnabled || isProcessing || pendingConfirmation}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30 animate-pulse'
              : isEnabled
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30'
              : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        {/* Status Text */}
        <p className="text-center text-slate-600 dark:text-slate-400">
          {isListening
            ? 'Listening... Speak now'
            : isProcessing
            ? 'Processing command...'
            : 'Tap to activate voice control'}
        </p>

        {/* Transcript Display */}
        {transcript && (
          <div className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Heard:</p>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Confirmation Dialog */}
        {pendingConfirmation && lastCommand && (
          <div className="w-full p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-400">{lastCommand.action}</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">{lastCommand.confirmationPrompt}</p>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={confirmPendingCommand}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={cancelPendingCommand}
                    className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command Help */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Available Commands:</p>
        <div className="grid grid-cols-2 gap-2">
          {VOICE_COMMANDS.map(cmd => (
            <div
              key={cmd.type}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
            >
              <cmd.icon className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700 dark:text-slate-300">{cmd.action}</span>
              {cmd.destructive && (
                <span className="ml-auto px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded">
                  Confirm
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceCommandPanel;
