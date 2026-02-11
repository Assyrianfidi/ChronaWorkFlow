import React from "react";
import { User, Settings, CreditCard, LogOut } from "lucide-react";

type ProfileMenuProps = {
  user?: { name?: string; email?: string; avatar?: string };
  onLogout?: () => void;
};

export default function ProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen((s) => !s);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>(
          "button,[href],[tabindex]:not([tabindex='-1'])",
        )
        ?.focus();
    });
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        ref={buttonRef}
        onClick={toggle}
        className="flex items-center gap-2 p-1 rounded-full hover:shadow-elevated transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="profile-menu"
      >
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
        </div>
        <div className="hidden sm:flex flex-col leading-tight text-left">
          <span className="text-sm font-medium text-foreground">
            {user?.name ?? "Account"}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {user?.email ?? ""}
          </span>
        </div>
      </button>

      {open && (
        <div
          ref={menuRef}
          id="profile-menu"
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground border border-border rounded-xl shadow-soft p-2 z-70"
        >
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-semibold text-foreground">
              {user?.name ?? "Account"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.email ?? ""}
            </div>
          </div>

          <div className="py-2">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Profile</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Settings</span>
              </div>
            </button>

            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Billing</span>
              </div>
            </button>
          </div>

          <div className="px-3 py-2 border-t border-border">
            <button
              type="button"
              className="w-full text-left px-3 py-2 rounded-md text-destructive hover:bg-destructive/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background"
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
