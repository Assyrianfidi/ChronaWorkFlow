/**
 * System Settings Section
 * Configuration and system preferences
 */

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Server,
  Users,
  Lock,
  Mail,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Globe,
  Clock,
  FileText,
  Key,
} from 'lucide-react';

export const SystemSettingsSection: React.FC = () => {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    slackAlerts: true,
    smsCritical: false,
  });

  const [security, setSecurity] = useState({
    mfaRequired: true,
    sessionTimeout: 30,
    ipWhitelist: false,
  });

  const [maintenance, setMaintenance] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    maintenanceWindow: '02:00-04:00',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">System Settings</h2>
            <p className="text-slate-300">Configure system preferences and policies</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Email Alerts</p>
              <p className="text-sm text-slate-500">Receive system alerts via email</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.emailAlerts ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.emailAlerts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Slack Alerts</p>
              <p className="text-sm text-slate-500">Send alerts to Slack channel</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, slackAlerts: !prev.slackAlerts }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.slackAlerts ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.slackAlerts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">SMS Critical Alerts</p>
              <p className="text-sm text-slate-500">Get SMS for critical issues</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, smsCritical: !prev.smsCritical }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications.smsCritical ? 'bg-blue-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                notifications.smsCritical ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Require MFA</p>
              <p className="text-sm text-slate-500">Enforce two-factor authentication</p>
            </div>
            <button
              onClick={() => setSecurity(prev => ({ ...prev, mfaRequired: !prev.mfaRequired }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                security.mfaRequired ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                security.mfaRequired ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-slate-900">Session Timeout</p>
                <p className="text-sm text-slate-500">Auto-logout after inactivity</p>
              </div>
              <span className="text-sm font-medium text-slate-900">{security.sessionTimeout} minutes</span>
            </div>
            <input
              type="range"
              min="5"
              max="120"
              value={security.sessionTimeout}
              onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Maintenance Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-600" />
          Maintenance & Backup
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">Auto Backup</p>
              <p className="text-sm text-slate-500">Scheduled automatic backups</p>
            </div>
            <button
              onClick={() => setMaintenance(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                maintenance.autoBackup ? 'bg-violet-500' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                maintenance.autoBackup ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <label className="block text-sm font-medium text-slate-700 mb-2">Backup Frequency</label>
            <select
              value={maintenance.backupFrequency}
              onChange={(e) => setMaintenance(prev => ({ ...prev, backupFrequency: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
