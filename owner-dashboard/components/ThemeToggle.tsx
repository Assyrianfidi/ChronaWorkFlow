/**
 * Theme Toggle Component
 * Executive theme switcher with Light/Dark/Auto + Boardroom Mode
 */

import React from 'react';
import { Sun, Moon, Monitor, Presentation, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme, ThemeMode, ViewMode } from './ThemeSystem';

interface ThemeToggleProps {
  showBoardroomToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showBoardroomToggle = true,
  size = 'md',
  className = '',
}) => {
  const { theme, viewMode, setTheme, toggleBoardroomMode, isDark, isBoardroom } = useTheme();

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const ThemeButton: React.FC<{
    mode: ThemeMode;
    icon: React.ElementType;
    label: string;
  }> = ({ mode, icon: Icon, label }) => {
    const isActive = theme === mode;
    return (
      <button
        onClick={() => setTheme(mode)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        } ${sizeClasses[size]}`}
        title={label}
      >
        <Icon className={iconSizes[size]} />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Theme Mode Toggles */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        <ThemeButton mode="light" icon={Sun} label="Light" />
        <ThemeButton mode="dark" icon={Moon} label="Dark" />
        <ThemeButton mode="auto" icon={Monitor} label="Auto" />
      </div>

      {/* Boardroom Mode Toggle */}
      {showBoardroomToggle && (
        <button
          onClick={toggleBoardroomMode}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
            isBoardroom
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          } ${sizeClasses[size]}`}
          title={isBoardroom ? 'Exit Boardroom Mode' : 'Enter Boardroom Mode'}
        >
          {isBoardroom ? (
            <>
              <Minimize2 className={iconSizes[size]} />
              <span className="font-medium">Standard</span>
            </>
          ) : (
            <>
              <Presentation className={iconSizes[size]} />
              <span className="font-medium">Boardroom</span>
            </>
          )}
        </button>
      )}

      {/* Current Status Indicator */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            theme === 'auto' ? 'bg-blue-500' : isDark ? 'bg-indigo-500' : 'bg-amber-500'
          }`}
        />
        {theme === 'auto' ? 'Auto' : isDark ? 'Dark' : 'Light'}
      </div>
    </div>
  );
};

export default ThemeToggle;
