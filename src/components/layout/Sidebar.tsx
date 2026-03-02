import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import hSRLogo from '@/assets/HUNESION_Huni.png';
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Target,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Building2,
    Package,
    Users,
    ChevronDown,
    ChevronUp,
    Factory
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleCollapse }) => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const navItems = [
        { path: '/', label: '대시보드', icon: LayoutDashboard },
        { path: '/product-reports', label: '제품별 보고서', icon: Package },
        { path: '/reports', label: '부문별 보고서', icon: BarChart3 },
        { path: '/industry-group-reports', label: '산업군별 보고서', icon: Factory },
        { path: '/achievement', label: '달성율', icon: Target },
    ];

    const adminItems = [
        { path: '/admin/divisions', label: '영업부문 관리', icon: Building2 },
        { path: '/admin/industry-groups', label: '산업군 관리', icon: Factory },
        { path: '/admin/products', label: '제품 마스터 관리', icon: Package },
        { path: '/admin/users', label: '사용자 관리', icon: Users },
        { path: '/admin/targets', label: '목표 관리', icon: Target },
        { path: '/admin/product-group-targets', label: '제품군별 목표', icon: Target },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside
            className={`${isCollapsed ? 'w-20' : 'w-72'
                } bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col h-screen z-20 sticky top-0 shadow-lg`}
        >
            {/* Header / Logo */}
            <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0 relative">
                <div className={`flex items-center gap-3 overflow-hidden w-full ${isCollapsed ? 'justify-center' : ''}`}>
                    <img src={hSRLogo} alt="HSR Logo" className="w-8 h-8 object-contain shrink-0" />
                    {!isCollapsed && (
                        <span className="font-bold text-lg text-slate-800 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                            HSR(Huni Sales Report)
                        </span>
                    )}
                </div>

                <button
                    onClick={toggleCollapse}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 p-1.5 rounded-full shadow-md hover:bg-slate-50 text-slate-500 transition-colors z-50"
                    title={isCollapsed ? "펼치기" : "접기"}
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {/* Main Menu */}
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`
                        }
                    >
                        <item.icon
                            className={`w-5 h-5 ${isActive(item.path) ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                                }`}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}

                {/* Settings Section (Visible to All) */}
                <div className="pt-2">
                    {!isCollapsed ? (
                        <div>
                            <button
                                onClick={() => setIsAdminOpen(!isAdminOpen)}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                                    <span>설정</span>
                                </div>
                                {isAdminOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {isAdminOpen && (
                                <div className="mt-1 ml-4 space-y-1 border-l-2 border-slate-100 pl-2">
                                    {/* Data Management (All Users) */}
                                    <NavLink
                                        to="/input"
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                ? 'bg-slate-100 text-slate-900 font-medium'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`
                                        }
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>데이터 관리</span>
                                    </NavLink>

                                    {/* Admin Only Items */}
                                    {isAdmin && (
                                        <>
                                            <div className="my-2 border-t border-slate-100" />
                                            {adminItems.map((item) => (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                                            ? 'bg-slate-100 text-slate-900 font-medium'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                        }`
                                                    }
                                                >
                                                    <item.icon className="w-4 h-4" />
                                                    <span>{item.label}</span>
                                                </NavLink>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => toggleCollapse()} // Open sidebar to show settings
                            className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                            title="설정"
                        >
                            <Settings className="w-5 h-5 text-slate-400" />
                        </button>
                    )}
                </div>
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-100">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                {user?.displayName?.[0] || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 leading-none">
                                    {user?.displayName || '사용자'}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">{user?.divisionName || '소속 미정'}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="로그아웃"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold" title={user?.displayName}>
                            {user?.displayName?.[0] || 'U'}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="로그아웃"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};
