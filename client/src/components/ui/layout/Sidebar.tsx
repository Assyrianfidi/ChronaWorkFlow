import React, { useState } from 'react';
// @ts-ignore
import * as React from "react";
import type { ReactNode } from "react";
import {
  HomeIcon,
  ChartBarIcon,
  DocumentIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

interface NavItemConfig {
  name: string;
  icon: ReactNode;
  path: string;
}

const navItems: NavItemConfig[] = [
  {
    name: "Dashboard",
    icon: <HomeIcon className="w-5 h-5" />,
    path: "/dashboard",
  },
  {
    name: "Inventory",
    icon: <ChartBarIcon className="w-5 h-5" />,
    path: "/inventory",
  },
  {
    name: "Accounts",
    icon: <DocumentIcon className="w-5 h-5" />,
    path: "/accounts",
  },
  {
    name: "Customers",
    icon: <DocumentIcon className="w-5 h-5" />,
    path: "/customers",
  },
  {
    name: "Vendors",
    icon: <DocumentIcon className="w-5 h-5" />,
    path: "/vendors",
  },
  {
    name: "Transactions",
    icon: <ChartBarIcon className="w-5 h-5" />,
    path: "/transactions",
  },
  {
    name: "Reports",
    icon: <DocumentIcon className="w-5 h-5" />,
    path: "/reports",
  },
  {
    name: "Notifications",
    icon: <BellIcon className="w-5 h-5" />,
    path: "/notifications",
  },
  {
    name: "Audit Logs",
    icon: <ChartBarIcon className="w-5 h-5" />,
    path: "/audit-logs",
  },
  {
    name: "Settings",
    icon: <DocumentIcon className="w-5 h-5" />,
    path: "/settings",
  },
];

export function Sidebar({
  isCollapsed,
  onToggle,
  activePath,
  onNavigate,
}: SidebarProps) {
  const [activeItem, setActiveItem] = React.useState<string>("Dashboard");

  return (
    <aside
      className={
        "bg-surface2 border-r border-border-gray shadow-soft flex flex-col transition-all duration-300 " +
        (isCollapsed ? "w-20" : "w-64")
      }
      aria-label="Primary sidebar navigation"
    >
      <button
        type="button"
        onClick={onToggle}
        className="self-end m-2 rounded-full bg-surface1 border border-border-gray text-black/70 shadow-soft hover:shadow-elevated transition-shadow duration-200 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-navy focus-visible:ring-offset-2 focus-visible:ring-offset-surface2"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
        aria-controls="main-sidebar-nav"
      >
        {isCollapsed ? "▶" : "◀"}
      </button>

      <nav
        id="main-sidebar-nav"
        role="navigation"
        aria-label="Primary"
        className="flex-1 flex flex-col gap-3 px-3 py-4"
      >
        {isCollapsed ? (
          <>
            <div
              className="w-full mb-3 bg-surface2 border border-border-gray rounded-xl shadow-soft p-3 flex flex-col items-center gap-3"
              aria-label="sidebar condensed metrics"
            >
              <div
                className="flex flex-col items-center gap-1"
                title="Unread notifications"
              >
                <BellIcon className="w-5 h-5 text-black/70" />
                <span className="text-sm font-medium text-black">3</span>
              </div>
              <div
                className="flex flex-col items-center gap-1"
                title="Account setup completion"
              >
                <ChartBarIcon className="w-5 h-5 text-black/70" />
                <span className="text-xs text-black/70">72% ready</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              {navItems.map((item) => {
                const isActive = activePath
                  ? activePath.startsWith(item.path)
                  : activeItem === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    title={item.name}
                    onClick={() => {
                      setActiveItem(item.name);
                      if (onNavigate) onNavigate(item.path);
                    }}
                    className={
                      "p-2 rounded-xl border border-border-gray bg-surface1 text-black/70 shadow-soft " +
                      "hover:shadow-elevated transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-navy focus-visible:ring-offset-2 focus-visible:ring-offset-surface2 " +
                      (isActive ? "ring-2 ring-black/40" : "")
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.icon}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePath
                ? activePath.startsWith(item.path)
                : activeItem === item.name;
              return (
                <li key={item.name}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(item.name);
                      if (onNavigate) onNavigate(item.path);
                    }}
                    className={
                      "w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl border border-border-gray " +
                      "transition-all duration-200 shadow-soft hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enterprise-navy focus-visible:ring-offset-2 focus-visible:ring-offset-surface2 " +
                      (isActive
                        ? "bg-surface1 text-black"
                        : "bg-surface2 text-black/70 hover:bg-surface1")
                    }
                    aria-current={isActive ? "page" : undefined}
                  >
                    {/* left accent pillar */}
                    <span
                      className={
                        "h-8 w-1 rounded-full transition-all duration-200 " +
                        (isActive ? "bg-black/70" : "bg-transparent")
                      }
                    />
                    <span className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
