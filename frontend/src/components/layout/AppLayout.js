import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
const AppLayout = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    return (_jsxs("div", { className: "h-screen flex bg-gray-100", children: [_jsx("div", { className: `${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} ${isSidebarCollapsed ? 'w-0' : 'w-64'} transition-all duration-300 fixed lg:relative h-full z-30 lg:z-auto`, children: _jsx("div", { className: `${isSidebarCollapsed ? 'lg:block' : 'block'} ${isSidebarCollapsed ? 'hidden' : ''}`, children: _jsx(Sidebar, {}) }) }), _jsxs("div", { className: `flex-1 flex flex-col overflow-hidden ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`, children: [_jsx(TopBar, { onToggleSidebar: toggleSidebar, isSidebarCollapsed: isSidebarCollapsed }), _jsx("main", { className: "flex-1 overflow-x-hidden overflow-y-auto bg-gray-50", children: _jsx("div", { className: "container mx-auto px-6 py-8", children: children }) })] }), !isSidebarCollapsed && (_jsx("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden", onClick: toggleSidebar }))] }));
};
export default AppLayout;
