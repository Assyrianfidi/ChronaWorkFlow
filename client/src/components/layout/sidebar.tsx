import { Link, useLocation } from "wouter";
import { FileText, BarChart3, Users, Clock, Building, FolderOpen, File, LogOut, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Time Tracking", href: "/time-tracking", icon: Clock },
  { name: "Worker Map", href: "/worker-map", icon: MapPin },
  { name: "Clients", href: "/clients", icon: Building },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Invoices", href: "/invoices", icon: File },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Chrona Workflow</h1>
            <p className="text-sm text-slate-500">Business Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-100 cursor-pointer group">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || undefined} alt="User Profile" />
            <AvatarFallback className="bg-slate-200 text-slate-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-slate-500 truncate">{user?.role || "Admin"}</p>
          </div>
          <button
            onClick={async () => {
              try {
                // Clear client-side data first
                localStorage.clear();
                sessionStorage.clear();
                // Then redirect to logout endpoint
                window.location.href = "/api/logout";
              } catch (error) {
                console.error("Logout error:", error);
                window.location.href = "/api/logout";
              }
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
