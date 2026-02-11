/**
 * System Health Gauge Component
 * Visual gauge for CPU, Memory, and other metrics
 */

import React from 'react';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  icon: 'cpu' | 'memory' | 'latency' | 'error';
  unit?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export const SystemHealthGauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  label,
  icon,
  unit = '%',
  warningThreshold = 70,
  criticalThreshold = 90,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = (p: number) => {
    if (p >= criticalThreshold) return { stroke: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-600' };
    if (p >= warningThreshold) return { stroke: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-600' };
    return { stroke: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-600' };
  };

  const colors = getColor(percentage);

  const IconMap = {
    cpu: Cpu,
    memory: HardDrive,
    latency: Wifi,
    error: Activity,
  };

  const Icon = IconMap[icon];

  // Calculate SVG circle properties
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`${colors.bg} rounded-xl p-4 flex items-center gap-4`}>
      {/* SVG Gauge */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Value circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
      </div>

      {/* Label and Value */}
      <div className="flex-1">
        <p className="text-sm text-slate-600 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${colors.text}`}>
          {value.toFixed(1)}{unit}
        </p>
        <p className="text-xs text-slate-400">
          {percentage >= criticalThreshold ? 'Critical' : percentage >= warningThreshold ? 'Warning' : 'Healthy'}
        </p>
      </div>
    </div>
  );
};

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  threshold?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 40,
  color = '#3b82f6',
  threshold,
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const thresholdY = threshold !== undefined
    ? height - ((threshold - min) / range) * height
    : null;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Threshold line */}
      {thresholdY !== null && (
        <line
          x1="0"
          y1={thresholdY}
          x2={width}
          y2={thresholdY}
          stroke="#f43f5e"
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      )}
      {/* Sparkline path */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
};
