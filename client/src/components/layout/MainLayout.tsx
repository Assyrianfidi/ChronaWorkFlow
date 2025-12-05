import * as React from "react"
import { Outlet } from "react-router-dom"
import { EnterpriseSidebar } from "./EnterpriseSidebar"
import { EnterpriseHeader } from "./EnterpriseHeader"
import { cn } from "../../lib/utils"
import { useAuth } from "../../contexts/AuthContext"

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
  user?: {
    name: string
    email: string
    avatar?: string
    role: string
  }
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, className, user }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const { user: authUser } = useAuth()
  const [isMobile, setIsMobile] = React.useState(false)

  // Use the user from props or fallback to auth user
  const currentUser = user || authUser

  // Handle responsive behavior
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <EnterpriseSidebar 
          isOpen={sidebarOpen} 
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <EnterpriseHeader 
            user={currentUser ? {
              name: currentUser.name,
              email: currentUser.email,
              avatar: currentUser.avatar,
              role: currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)
            } : undefined}
            onSidebarToggle={handleSidebarToggle}
            sidebarOpen={sidebarOpen}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export { MainLayout }
