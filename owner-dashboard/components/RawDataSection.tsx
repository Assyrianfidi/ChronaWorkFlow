/**
 * Raw Data Section (Advanced)
 * JSON data viewer for advanced users
 */

import React, { useState } from 'react';
import {
  FileJson,
  Database,
  Search,
  Download,
  Copy,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Terminal,
  Code,
} from 'lucide-react';

const mockData = {
  system: {
    version: "2.5.0-enterprise",
    build: "2025.02.07-1423",
    environment: "production",
    uptime: "15d 7h 32m 18s",
    health: {
      overall: "healthy",
      cpu: { usage: 42.5, cores: 32 },
      memory: { used: "64.2GB", total: "128GB", percentage: 68.2 },
      disk: { used: "1.2TB", total: "2TB", percentage: 60 }
    }
  },
  database: {
    connections: { active: 145, max: 500 },
    transactions: { perSecond: 1247, total: 89234521 },
    replication: { lag: "12ms", status: "synced" }
  },
  cache: {
    redis: { hits: 984521, misses: 1245, ratio: 0.987 },
    memory: { used: "2.1GB", peak: "2.5GB" }
  }
};

const JsonTree: React.FC<{ data: any; depth?: number; keyName?: string }> = ({ data, depth = 0, keyName }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isObject = typeof data === 'object' && data !== null;
  const isArray = Array.isArray(data);

  if (!isObject) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        {keyName && <span className="text-purple-600 font-medium">"{keyName}"</span>}
        {keyName && <span className="text-slate-400">:</span>}
        <span className={typeof data === 'string' ? 'text-green-600' : typeof data === 'number' ? 'text-blue-600' : 'text-orange-600'}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  const entries = isArray ? data.map((v: any, i: number) => [i, v]) : Object.entries(data);

  return (
    <div className="py-0.5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1 hover:bg-slate-100 rounded px-1 -mx-1"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        {keyName && <span className="text-purple-600 font-medium">"{keyName}"</span>}
        {keyName && <span className="text-slate-400">:</span>}
        <span className="text-slate-500">{isArray ? '[]' : '{}'}</span>
        <span className="text-slate-400 text-sm">{entries.length} items</span>
      </button>
      {isExpanded && (
        <div className="ml-4 border-l-2 border-slate-200 pl-2">
          {entries.map(([key, value]: [string, any]) => (
            <JsonTree key={key} data={value} depth={depth + 1} keyName={key} />
          ))}
        </div>
      )}
    </div>
  );
};

export const RawDataSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'system' | 'database' | 'cache'>('system');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(mockData[activeTab], null, 2));
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(mockData[activeTab], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Raw Data (Advanced)</h2>
            <p className="text-slate-400">JSON data viewer for debugging and integration</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['system', 'database', 'cache'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search in JSON..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={downloadJson}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* JSON Viewer */}
      <div className="bg-slate-900 rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400 font-mono">{activeTab}.json</span>
        </div>
        <div className="p-4 font-mono text-sm overflow-auto max-h-96">
          <JsonTree data={mockData[activeTab]} />
        </div>
      </div>

      {/* API Endpoints Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          API Endpoints
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">GET</span>
              <span className="text-slate-700">/api/v1/system/health</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700">Test</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">GET</span>
              <span className="text-slate-700">/api/v1/database/status</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700">Test</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">GET</span>
              <span className="text-slate-700">/api/v1/cache/metrics</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700">Test</button>
          </div>
        </div>
      </div>
    </div>
  );
};
