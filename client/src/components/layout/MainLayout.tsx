import * as React from "react"
import { TopNavigation } from "./TopNavigation"
import { SideNavigation } from "./SideNavigation"
import { cn } from "../../lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

const MainLayout = React.forwardRef<HTMLDivElement, MainLayoutProps>(
  ({ children, className }, ref) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(true)
    const [activeNav, setActiveNav] = React.useState("dashboard")

    const handleSidebarToggle = () => {
      setSidebarOpen(!sidebarOpen)
    }

    const handleNavItemClick = (item: any) => {
      setActiveNav(item.id)
      // Handle navigation logic here
      console.log("Navigating to:", item.href)
    }

    return (
      <div ref={ref} className={cn("min-h-screen bg-background", className)}>
        {/* Top Navigation */}
        <TopNavigation
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
        />

        {/* Side Navigation */}
        <SideNavigation
          open={sidebarOpen}
          activeItem={activeNav}
          onItemClick={handleNavItemClick}
        />

        {/* Main Content */}
        <main
          className={cn(
            "transition-all duration-300 pt-16",
            sidebarOpen ? "ml-64" : "ml-0"
          )}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    )
  }
)
MainLayout.displayName = "MainLayout"

export { MainLayout }
