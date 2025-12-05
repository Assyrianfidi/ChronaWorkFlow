import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"
import {
  LayoutDashboard,
  FileText,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Receipt,
  Building,
  Shield,
  Calculator,
  FileSpreadsheet,
  Archive,
  Bell,
  HelpCircle,
} from "lucide-react"

interface SidebarItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  to: string
  badge?: string | number
  collapsed?: boolean
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  to, 
  badge, 
  collapsed 
}) => {
  const location = useLocation()
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <NavLink
      to={to}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        "hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        isActive 
          ? "bg-primary-600 text-white shadow-sm" 
          : "text-gray-300 hover:text-white"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-transform duration-200",
        "group-hover:scale-110",
        isActive && "scale-110"
      )} />
      {!collapsed && (
        <>
          <span className="font-medium truncate">{label}</span>
          {badge && (
            <span className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

interface SidebarSectionProps {
  title: string
  children: React.ReactNode
  collapsed?: boolean
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, collapsed }) => {
  return (
    <div className="space-y-2">
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

interface EnterpriseSidebarProps {
  isOpen: boolean
  onToggle: () => void
  className?: string
}

export const EnterpriseSidebar: React.FC<EnterpriseSidebarProps> = ({ 
  isOpen, 
  onToggle, 
  className 
}) => {
  const { user, logout } = useAuth()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        onToggle() // Auto-close on mobile
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [onToggle])

  const getNavigationItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
      { icon: FileText, label: "Invoices", to: "/invoices", badge: "12" },
      { icon: Users, label: "Customers", to: "/customers" },
      { icon: CreditCard, label: "Transactions", to: "/transactions" },
      { icon: Receipt, label: "Reports", to: "/reports" },
    ]

    const roleBasedItems = {
      admin: [
        { icon: Shield, label: "Admin", to: "/admin" },
        { icon: Building, label: "Companies", to: "/companies" },
        { icon: Archive, label: "Audit Logs", to: "/audit" },
      ],
      manager: [
        { icon: Users, label: "Team", to: "/team" },
        { icon: Calculator, label: "Payroll", to: "/payroll" },
        { icon: FileSpreadsheet, label: "Reconciliation", to: "/reconciliation" },
      ],
      accountant: [
        { icon: Calculator, label: "Accounting", to: "/accounting" },
        { icon: FileSpreadsheet, label: "Ledger", to: "/ledger" },
        { icon: TrendingUp, label: "Analytics", to: "/analytics" },
      ],
      auditor: [
        { icon: Shield, label: "Audit", to: "/audit" },
        { icon: FileText, label: "Compliance", to: "/compliance" },
        { icon: BarChart3, label: "Risk Analysis", to: "/risk" },
      ],
    }

    const additionalItems = roleBasedItems[user?.role as keyof typeof roleBasedItems] || []
    
    return [...baseItems, ...additionalItems]
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-700 z-50",
        "transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-16",
        isMobile && !isOpen && "-translate-x-full",
        "lg:translate-x-0",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {isOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">AccuBooks</h1>
                <p className="text-xs text-gray-400">Enterprise</p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <SidebarSection title="Main" collapsed={!isOpen}>
            {navigationItems.slice(0, 5).map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                badge={item.badge}
                collapsed={!isOpen}
              />
            ))}
          </SidebarSection>

          {/* Role-Based Navigation */}
          {navigationItems.length > 5 && (
            <SidebarSection title="Advanced" collapsed={!isOpen}>
              {navigationItems.slice(5).map((item) => (
                <SidebarItem
                  key={item.to}
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  collapsed={!isOpen}
                />
              ))}
            </SidebarSection>
          )}

          {/* Support */}
          <SidebarSection title="Support" collapsed={!isOpen}>
            <SidebarItem
              icon={Bell}
              label="Notifications"
              to="/notifications"
              badge="3"
              collapsed={!isOpen}
            />
            <SidebarItem
              icon={HelpCircle}
              label="Help Center"
              to="/help"
              collapsed={!isOpen}
            />
          </SidebarSection>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          {isOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {}}
                  className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => {}}
                className="w-full p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={logout}
                className="w-full p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
