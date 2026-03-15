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
  User,
  Moon,
  Sun
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
    { id: 'audit', label: 'Audit Logs', icon: History, roles: ['Administrator'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'generator', label: 'Password Generator', icon: Zap },
    { id: 'users', label: 'User Management', icon: Users, roles: ['Administrator'] },
  ];

  const filteredMenu = menuItems.filter(item => !item.roles || item.roles.includes(user?.role || ''));

  return (
    <div className={cn(
      "flex flex-col h-screen transition-all duration-300 border-r",
      collapsed ? "w-20" : "w-64",
      darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-slate-800/10">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">AF</div>
            <span>Key Manager</span>
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 rounded-lg transition-all",
              activeTab === item.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            )}
          >
            <item.icon size={20} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/10 space-y-4">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold truncate max-w-[120px]">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full p-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
