/**
 * Team & Operations Component
 * Server monitoring, one-click actions, workflow automation
 */

import React, { useState, useEffect } from 'react';
import { Server, Database, Activity, Play, PauseCircle, RotateCcw, RefreshCw, Save, Terminal, CheckCircle, AlertTriangle, Clock, Cpu, HardDrive } from 'lucide-react';
import { Card, Button, ProgressBar, StatusBadge } from './common';

export const TeamOperations: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState({
    backend: { status: 'operational', responseTime: 45 },
    database: { status: 'connected', connections: 42, queriesPerSecond: 156 },
    redis: { status: 'connected', memoryUsage: '256MB', hitRate: 94.5 },
    cpu: 32,
    memory: 58,
    disk: 67
  });

  const [logs, setLogs] = useState([
    { time: '14:30:15', level: 'INFO', message: 'Server started on port 5000' },
    { time: '14:30:16', level: 'DB', message: 'Connected to PostgreSQL' },
    { time: '14:30:17', level: 'CACHE', message: 'Redis cache connected' },
    { time: '14:35:22', level: 'WARN', message: 'High memory usage detected (78%)' },
    { time: '14:42:10', level: 'ERROR', message: 'Failed login attempt: john@acme.com' },
  ]);

  const [isRestarting, setIsRestarting] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        backend: { ...prev.backend, responseTime: Math.floor(Math.random() * 50) + 20 },
        database: { ...prev.database, queriesPerSecond: Math.floor(Math.random() * 50) + 130 },
        cpu: Math.floor(Math.random() * 30) + 20,
        memory: Math.floor(Math.random() * 20) + 45,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => {
      setIsRestarting(false);
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Server restarted successfully' }, ...prev]);
    }, 3000);
  };

  const handleRebuild = () => {
    setIsRebuilding(true);
    setTimeout(() => {
      setIsRebuilding(false);
      setLogs(prev => [{ time: new Date().toLocaleTimeString(), level: 'BUILD', message: 'Frontend rebuilt successfully' }, ...prev]);
    }, 5000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'DB': return 'text-blue-400';
      case 'CACHE': return 'text-purple-400';
      case 'BUILD': return 'text-green-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Server className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Backend</p>
              <StatusBadge status="operational" size="sm" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{systemStatus.backend.responseTime}ms response</p>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <StatusBadge status="connected" size="sm" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{systemStatus.database.connections} connections</p>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Redis</p>
              <StatusBadge status="connected" size="sm" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{systemStatus.redis.hitRate}% hit rate</p>
        </Card>

        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="text-sm font-semibold">15d 7h 32m</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">99.9% availability</p>
        </Card>
      </div>

      {/* Resource Usage */}
      <Card title="System Resources">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">CPU Usage</span>
              <span className="text-sm text-gray-500 ml-auto">{systemStatus.cpu}%</span>
            </div>
            <ProgressBar value={systemStatus.cpu} max={100} color={systemStatus.cpu > 80 ? 'red' : systemStatus.cpu > 60 ? 'yellow' : 'green'} showLabel={false} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Memory Usage</span>
              <span className="text-sm text-gray-500 ml-auto">{systemStatus.memory}%</span>
            </div>
            <ProgressBar value={systemStatus.memory} max={100} color={systemStatus.memory > 80 ? 'red' : systemStatus.memory > 60 ? 'yellow' : 'green'} showLabel={false} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Disk Usage</span>
              <span className="text-sm text-gray-500 ml-auto">{systemStatus.disk}%</span>
            </div>
            <ProgressBar value={systemStatus.disk} max={100} color={systemStatus.disk > 80 ? 'red' : systemStatus.disk > 60 ? 'yellow' : 'green'} showLabel={false} />
          </div>
        </div>
      </Card>

      {/* One-Click Actions */}
      <Card title="System Operations">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors flex flex-col items-center gap-2"
            onClick={() => setLogs(prev => [{ time: new Date().toLocaleTimeString(), level: 'INFO', message: 'Server started' }, ...prev])}
          >
            <Play className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium">Start Server</span>
          </button>
          <button className="p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex flex-col items-center gap-2">
            <PauseCircle className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium">Stop Server</span>
          </button>
          <button 
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-2"
            onClick={handleRestart}
            disabled={isRestarting}
          >
            <RotateCcw className={`w-6 h-6 text-blue-600 ${isRestarting ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{isRestarting ? 'Restarting...' : 'Restart'}</span>
          </button>
          <button 
            className="p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors flex flex-col items-center gap-2"
            onClick={handleRebuild}
            disabled={isRebuilding}
          >
            <RefreshCw className={`w-6 h-6 text-purple-600 ${isRebuilding ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">{isRebuilding ? 'Building...' : 'Rebuild Frontend'}</span>
          </button>
        </div>
      </Card>

      {/* Server Logs */}
      <Card title="Live Server Logs" action={<span className="text-xs text-gray-500">Auto-refreshing</span>}>
        <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="flex gap-3 py-1">
              <span className="text-gray-500">{log.time}</span>
              <span className={getLevelColor(log.level)}>[{log.level}]</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="secondary" onClick={() => setLogs([])}>Clear Logs</Button>
          <Button size="sm" variant="secondary">Download</Button>
          <Button size="sm" variant="primary">View Full Logs</Button>
        </div>
      </Card>
    </div>
  );
};
