import React from "react";
import { X, Search, Home, FileText, Users, Settings } from "lucide-react";

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
  const dialogRef = React.useRef<HTMLElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])",
      );
      first?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])",
        ) ?? [],
      ).filter((el) => {
        if (el.hasAttribute("disabled")) return false;
        if (el.getAttribute("aria-disabled") === "true") return false;
        return el.tabIndex !== -1;
      });

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (!active || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (open) return;
    previousFocusRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />

      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-card text-card-foreground border-l border-border shadow-elevated p-4 flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold text-foreground">Menu</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4">
          <label className="relative block">
            <span className="sr-only">Search</span>
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-muted-foreground" />
            </span>

            <label htmlFor="input-jvpcz4hlo" className="sr-only">
              Field
            </label>
            <input
              id="input-jvpcz4hlo"
              className="w-full bg-background border border-input rounded-full py-2 px-10 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              placeholder="Search..."
            />
          </label>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto">
          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition"
            href="/dashboard"
          >
            <Home className="w-4 h-4" /> <span>Dashboard</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition"
            href="/reports"
          >
            <FileText className="w-4 h-4" /> <span>Reports</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition"
            href="/users"
          >
            <Users className="w-4 h-4" /> <span>Users</span>
          </a>

          <a
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition"
            href="/settings"
          >
            <Settings className="w-4 h-4" /> <span>Settings</span>
          </a>
        </nav>

        <div className="pt-4 border-t border-border mt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">
                {user?.name ?? "Account"}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email ?? ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition"
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
