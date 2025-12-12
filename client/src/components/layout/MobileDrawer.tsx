import React from "react";
import { X, Search, Home, FileText, Users, Settings } from "lucide-react";
import { cn } from '../../lib/utils.js';

type MobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  user?: { name?: string; email?: string };
  onLogout?: () => void;
};

export default function MobileDrawer({
  open,
  onClose,
  user,
  onLogout,
}: MobileDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-surface2 border-l border-border-gray shadow-elevated p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-black">Menu</div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-surface1/60"
          >
            <X className="w-5 h-5 text-black/80" />
          </button>
        </div>

        <div className="mb-4">
          <label className="relative block">
            <span className="sr-only">Search</span>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-black/50" />
            </span>
            <input
              className="w-full bg-surface1 border border-border-gray rounded-full py-2 px-10 text-black placeholder:opacity-50"
              placeholder="Search..."
            />
          </label>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface1 transition"
            href="/dashboard"
          >
            <Home className="w-4 h-4" /> <span>Dashboard</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface1 transition"
            href="/reports"
          >
            <FileText className="w-4 h-4" /> <span>Reports</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface1 transition"
            href="/users"
          >
            <Users className="w-4 h-4" /> <span>Users</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface1 transition"
            href="/settings"
          >
            <Settings className="w-4 h-4" /> <span>Settings</span>
          </a>
        </nav>

        <div className="pt-4 border-t border-border-gray mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-black">
                {user?.name ?? "Account"}
              </div>
              <div className="text-xs opacity-70 truncate">
                {user?.email ?? ""}
              </div>
            </div>
          </div>

          <button
            className="w-full text-left px-3 py-2 rounded-md hover:bg-surface1 transition"
            onClick={() => {
              onClose();
              onLogout?.();
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
    </div>
  );
}
