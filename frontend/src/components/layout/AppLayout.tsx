import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} ${isSidebarCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 fixed lg:relative h-full z-30 lg:z-auto`}>
        <div className={`${isSidebarCollapsed ? 'lg:block' : 'block'} ${isSidebarCollapsed ? 'hidden' : ''}`}>
          <Sidebar />
        </div>
      </div>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Top bar */}
        <TopBar 
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default AppLayout;
