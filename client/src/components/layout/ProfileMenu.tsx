import React from "react";
import { User, Settings, CreditCard, LogOut } from "lucide-react";
// @ts-ignore
import { cn } from '../../lib/utils.js.js';

type ProfileMenuProps = {
  user?: { name?: string; email?: string; avatar?: string };
  onLogout?: () => void;
};

export default function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((s) => !s);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="flex items-center gap-2 p-1 rounded-full hover:shadow-elevated transition"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white">
          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
        </div>
        <div className="hidden sm:flex flex-col leading-tight text-left">
          <span className="text-sm font-medium text-black">
            {user?.name ?? "Account"}
          </span>
          <span className="text-xs opacity-70 truncate">
            {user?.email ?? ""}
          </span>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2 w-56 bg-surface2 border border-border-gray rounded-xl shadow-soft p-2 z-70"
        >
          <div className="px-3 py-2 border-b border-border-gray">
            <div className="text-sm font-semibold text-black">
              {user?.name ?? "Account"}
            </div>
            <div className="text-xs opacity-70 truncate">
              {user?.email ?? ""}
            </div>
          </div>

          <div className="py-2">
            <button
              className="w-full text-left px-3 py-2 rounded-md hover:bg-surface1 transition"
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-black/70" />
                <span className="text-sm">Profile</span>
              </div>
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-md hover:bg-surface1 transition"
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-black/70" />
                <span className="text-sm">Settings</span>
              </div>
            </button>

            <button
              className="w-full text-left px-3 py-2 rounded-md hover:bg-surface1 transition"
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-black/70" />
                <span className="text-sm">Billing</span>
              </div>
            </button>
          </div>

          <div className="px-3 py-2 border-t border-border-gray">
            <button
              className="w-full text-left px-3 py-2 rounded-md text-rose-600 hover:bg-rose-50 transition"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign out</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
