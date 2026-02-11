/**
 * Reports Section
 * Automated report generation and delivery
 */

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileJson,
  FileBarChart,
  ChevronRight,
  Send,
  Settings,
} from 'lucide-react';
import { ReportConfig } from '../types';

const mockReports: ReportConfig[] = [
  {
    id: '1',
    name: 'Executive Board Report',
    type: 'board',
    schedule: 'weekly',
    lastGenerated: new Date(Date.now() - 86400000),
    recipients: ['board@company.com', 'ceo@company.com'],
    format: 'pdf',
  },
  {
    id: '2',
    name: 'Financial Summary',
    type: 'executive',
    schedule: 'daily',
    lastGenerated: new Date(Date.now() - 43200000),
    recipients: ['cfo@company.com', 'finance@company.com'],
    format: 'excel',
  },
  {
    id: '3',
    name: 'Operational Metrics',
    type: 'operational',
    schedule: 'daily',
    lastGenerated: new Date(Date.now() - 64800000),
    recipients: ['cto@company.com', 'ops@company.com'],
    format: 'json',
  },
  {
    id: '4',
    name: 'Monthly Performance Review',
    type: 'executive',
    schedule: 'monthly',
    lastGenerated: new Date(Date.now() - 2592000000),
    recipients: ['executives@company.com'],
    format: 'pdf',
  },
];

const formatIcons = {
  pdf: FileText,
  excel: FileSpreadsheet,
  json: FileJson,
};

const scheduleLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  manual: 'On Demand',
};

export const ReportsSection: React.FC = () => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [emailing, setEmailing] = useState<string | null>(null);

  const generateReport = (reportId: string) => {
    setGenerating(reportId);
    // Wire to report generator
    setTimeout(() => {
      setGenerating(null);
    }, 3000);
  };

  const emailReport = (reportId: string) => {
    setEmailing(reportId);
    // Wire to email service
    setTimeout(() => {
      setEmailing(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Reports</h2>
            <p className="text-indigo-200">Automated report generation and delivery</p>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockReports.map((report) => {
          const Icon = formatIcons[report.format];
          return (
            <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{report.name}</h3>
                    <p className="text-sm text-slate-500">{scheduleLabels[report.schedule]}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium uppercase">
                  {report.format}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>Last generated: {report.lastGenerated?.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span>{report.recipients.length} recipients</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateReport(report.id)}
                  disabled={generating === report.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {generating === report.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>
                <button
                  onClick={() => emailReport(report.id)}
                  disabled={emailing === report.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 font-medium"
                >
                  {emailing === report.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Email
                    </>
                  )}
                </button>
                <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-slate-700">Board Report</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <FileBarChart className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-slate-700">Executive Summary</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Mail className="w-5 h-5 text-violet-600" />
            <span className="font-medium text-slate-700">Email Reports</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5 text-slate-600" />
            <span className="font-medium text-slate-700">Configure</span>
          </button>
        </div>
      </div>

      {/* Delivery Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Delivery Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-slate-900">Executive Board Report</p>
                <p className="text-sm text-slate-500">Delivered to 5 recipients</p>
              </div>
            </div>
            <span className="text-sm text-slate-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-slate-900">Financial Summary</p>
                <p className="text-sm text-slate-500">Delivered to 3 recipients</p>
              </div>
            </div>
            <span className="text-sm text-slate-500">6 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-slate-900">Operational Metrics</p>
                <p className="text-sm text-slate-500">1 recipient bounced</p>
              </div>
            </div>
            <span className="text-sm text-slate-500">12 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};
