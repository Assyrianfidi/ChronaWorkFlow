/**
 * Integrations Management Component
 * Stripe, QuickBooks, SendGrid, Twilio, Slack integration status
 */

import React, { useState } from 'react';
import { CreditCard, Mail, MessageSquare, BookOpen, Cloud, Slack, CheckCircle, XCircle, AlertCircle, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { Card, Button, StatusBadge } from './common';
import { mockIntegrations } from '../data';

export const IntegrationsPanel: React.FC = () => {
  const [integrations, setIntegrations] = useState(mockIntegrations);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (name: string) => {
    setSyncing(name);
    setTimeout(() => {
      setSyncing(null);
      setIntegrations(prev => prev.map(i => 
        i.name === name ? { ...i, lastSync: new Date().toLocaleString() } : i
      ));
    }, 2000);
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Stripe': return <CreditCard className="w-6 h-6" />;
      case 'SendGrid': return <Mail className="w-6 h-6" />;
      case 'Twilio': return <MessageSquare className="w-6 h-6" />;
      case 'Slack': return <Slack className="w-6 h-6" />;
      case 'QuickBooks': return <BookOpen className="w-6 h-6" />;
      case 'AWS S3': return <Cloud className="w-6 h-6" />;
      default: return <ExternalLink className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const connected = integrations.filter(i => i.status === 'connected').length;
  const total = integrations.length;

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Integrations</h2>
            <p className="text-indigo-100">Connect your business tools</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{connected}/{total}</p>
            <p className="text-sm text-indigo-100">Connected</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500" 
              style={{ width: `${(connected / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.name} className={`!p-4 ${getStatusColor(integration.status)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {getIcon(integration.name)}
                </div>
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <StatusBadge status={integration.status} size="sm" />
                </div>
              </div>
              <div className="flex gap-1">
                {integration.status === 'connected' && (
                  <button 
                    onClick={() => handleSync(integration.name)}
                    disabled={syncing === integration.name}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title="Sync"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing === integration.name ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button className="p-2 hover:bg-white/50 rounded-lg transition-colors" title="Settings">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-xs text-gray-500">
                {integration.lastSync ? `Last sync: ${integration.lastSync}` : 'Never synced'}
              </p>
            </div>
            {integration.status === 'disconnected' && (
              <Button size="sm" variant="primary" className="w-full mt-3">
                Connect
              </Button>
            )}
            {integration.status === 'pending' && (
              <Button size="sm" variant="secondary" className="w-full mt-3">
                Complete Setup
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Webhook & API Section */}
      <Card title="API & Webhooks">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Webhook Endpoint</h4>
              <StatusBadge status="active" size="sm" />
            </div>
            <code className="block p-2 bg-gray-900 text-green-400 rounded text-sm font-mono">
              https://api.accubooks.com/webhooks/v1/events
            </code>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">API Rate Limits</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requests / minute</span>
                  <span className="font-medium">1,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current usage</span>
                  <span className="font-medium text-green-600">342 (34%)</span>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Recent Events</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">customer.created - 2 min ago</p>
                <p className="text-gray-600">invoice.paid - 15 min ago</p>
                <p className="text-gray-600">subscription.updated - 1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
