import * as React from "react"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Menu,
  ChevronDown,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface UserMenuProps {
  user: {
    name: string
    email: string
    avatar?: string
    role: string
  }
}

const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const { logout } = useAuth()
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      accountant: 'bg-green-100 text-green-800',
      auditor: 'bg-orange-100 text-orange-800',
      user: 'bg-gray-100 text-gray-800',
    }
    return colors[role as keyof typeof colors] || colors.user
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
        
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-scale-in">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1",
              getRoleColor(user.role)
            )}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface NotificationItemProps {
  id: string
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  title, 
  message, 
  time, 
  type, 
  read 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className={cn(
      "p-3 hover:bg-gray-50 transition-colors cursor-pointer",
      !read && "bg-blue-50 border-l-4 border-primary-500"
    )}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500 truncate">{message}</p>
          <p className="text-xs text-gray-400 mt-1">{time}</p>
        </div>
      </div>
    </div>
  )
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const notificationRef = React.useRef<HTMLDivElement>(null)

  const notifications: NotificationItemProps[] = [
    {
      id: '1',
      title: 'New Invoice Created',
      message: 'Invoice #1234 has been created for ABC Corp',
      time: '2 minutes ago',
      type: 'success',
      read: false,
    },
    {
      id: '2',
      title: 'Payment Received',
      message: 'Payment of $1,234 received from XYZ Inc',
      time: '1 hour ago',
      type: 'success',
      read: false,
    },
    {
      id: '3',
      title: 'System Update',
      message: 'Scheduled maintenance tonight at 11 PM',
      time: '3 hours ago',
      type: 'warning',
      read: true,
    },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button className="text-xs text-primary-600 hover:text-primary-700 transition-colors">
              Mark all as read
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <NotificationItem key={notification.id} {...notification} />
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <button className="text-xs text-primary-600 hover:text-primary-700 transition-colors">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface EnterpriseHeaderProps {
  user?: {
    name: string
    email: string
    avatar?: string
    role: string
  }
  onSidebarToggle: () => void
  sidebarOpen: boolean
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({ 
  user, 
  onSidebarToggle,
  sidebarOpen 
}) => {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search logic here
    console.log("Searching for:", searchQuery)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onSidebarToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices, customers, transactions..."
                className="w-80 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Help */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Menu */}
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  )
}
