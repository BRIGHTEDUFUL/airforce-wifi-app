import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  Wifi, 
  Key, 
  FileText, 
  History, 
  BarChart3, 
  Zap, 
  Users, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Moon,
  Sun,
  Mail
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { APP_CREST_URL, APP_NAME } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, darkMode, setDarkMode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devices', label: 'Devices', icon: Shield },
    { id: 'wifi', label: 'WiFi Passwords', icon: Wifi },
    { id: 'vault', label: 'Password Vault', icon: Key },
    { id: 'notes', label: 'Secure Notes', icon: FileText },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'generator', label: 'Password Gen', icon: Zap },
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['Administrator'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['Administrator'] },
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className={cn(
      "flex flex-col h-full transition-all duration-300 border-r relative z-20 shadow-2xl transition-colors",
      darkMode 
        ? "bg-command-dark-card border-command-dark-border text-slate-300" 
        : "bg-white border-slate-200 text-slate-600",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Sidebar Header with Crest */}
      <div className={cn(
        "p-6 flex flex-col items-center gap-4 border-b transition-colors",
        darkMode ? "border-command-dark-border bg-black/20" : "border-slate-100 bg-white"
      )}>
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-blue-900 p-2 border border-white/10 shadow-inner group cursor-pointer">
          <div className="absolute inset-0 bg-command-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src={APP_CREST_URL} 
            alt="Crest"
            className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
            referrerPolicy="no-referrer"
          />
        </div>
        {!collapsed && (
          <div className="text-center animate-in fade-in slide-in-from-top-2 duration-500">
            <h2 className={cn("text-sm font-bold tracking-tight", darkMode ? "text-white" : "text-slate-900")}>{APP_NAME} Management</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghana Air Force HQ</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar bg-white dark:bg-transparent">
        {!collapsed && (
          <div className="px-6 mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Admin Navigation</p>
          </div>
        )}
        <nav className="px-3 space-y-1.5">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-all group relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-command-blue text-white shadow-lg shadow-blue-600/30" 
                  : cn("hover:bg-slate-50 text-slate-400 hover:text-slate-900", darkMode && "hover:bg-white/5 hover:text-slate-200")
              )}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              )}
              <item.icon size={20} className={cn("relative z-10 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-slate-900")} />
              {!collapsed && <span className="font-bold text-sm relative z-10 tracking-tight">{item.label}</span>}
              {activeTab === item.id && !collapsed && (
                <div className="ml-auto relative z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className={cn(
        "p-4 space-y-3 border-t transition-colors",
        darkMode ? "border-command-dark-border bg-black/20" : "border-slate-100 bg-white"
      )}>
        {!collapsed && (
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">System Controls</p>
        )}
        
        {/* User Profile Section */}
        {!collapsed && (
          <div className={cn(
            "rounded-2xl p-3 border mb-4 group transition-all cursor-pointer relative overflow-hidden",
            darkMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-100 hover:bg-slate-50"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-command-blue flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={cn("text-xs font-bold truncate", darkMode ? "text-white" : "text-slate-900")}>{user?.email || 'bright@123.airforce.com'}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                    {user?.role || 'Administrator'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {/* Theme Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl transition-all group",
              darkMode ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              collapsed && "justify-center"
            )}
          >
            {darkMode ? <Sun size={18} className="group-hover:rotate-90 transition-transform duration-700" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-700" />}
            {!collapsed && <span className="text-sm font-bold tracking-tight">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Collapse Toggle */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl transition-all group",
              darkMode ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />}
            {!collapsed && <span className="text-sm font-bold tracking-tight">Collapse Sidebar</span>}
          </button>
          
          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all group",
              collapsed && "justify-center"
            )}
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            {!collapsed && <span className="text-sm font-bold tracking-tight">Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
