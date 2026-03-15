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
      "flex flex-col h-full transition-all duration-300 border-r border-navy-700 relative z-20 bg-navy-800 text-slate-300 shadow-2xl",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* Sidebar Header with Crest */}
      <div className="p-6 flex flex-col items-center gap-4 border-b border-navy-700/50 bg-navy-900/20">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/5 p-2 border border-white/10 shadow-inner group cursor-pointer">
          <div className="absolute inset-0 bg-command-blue/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Crest_of_the_Ghana_Air_Force.svg/1200px-Crest_of_the_Ghana_Air_Force.svg.png" 
            alt="Crest"
            className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        </div>
        {!collapsed && (
          <div className="text-center animate-in fade-in slide-in-from-top-2 duration-500">
            <h2 className="text-sm font-bold text-white tracking-tight">Air Force Key Manager</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghana Air Force</p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
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
                  : "hover:bg-white/5 text-slate-400 hover:text-slate-200"
              )}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              )}
              <item.icon size={20} className={cn("relative z-10 transition-transform group-hover:scale-110", activeTab === item.id ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
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

      <div className="p-4 space-y-3 border-t border-navy-700/50 bg-navy-900/40">
        {!collapsed && (
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">System Controls</p>
        )}
        
        {/* User Profile Section */}
        {!collapsed && (
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 mb-4 group hover:bg-white/10 transition-all cursor-pointer relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-command-blue flex items-center justify-center text-white font-bold text-lg shadow-inner group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">{user?.email || 'bright@123.airforce.com'}</span>
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
              "flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-slate-200 group",
              collapsed && "justify-center"
            )}
          >
            {darkMode ? <Sun size={18} className="group-hover:rotate-90 transition-transform duration-700" /> : <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-700" />}
            {!collapsed && <span className="text-sm font-bold tracking-tight">Dark Mode</span>}
          </button>

          {/* Collapse Toggle */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/5 transition-all text-slate-400 hover:text-slate-200 group",
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
