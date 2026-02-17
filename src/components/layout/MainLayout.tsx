import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export default function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <main className="flex-1 overflow-auto relative flex flex-col w-full transition-all duration-300">
                <div className="flex-1 p-4 md:p-8 w-full max-w-[1600px] mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
