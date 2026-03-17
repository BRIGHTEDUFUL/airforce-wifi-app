import React, { useState } from 'react';
import { 
  LayoutDashboard, Shield, Wifi, Key, FileText, History, BarChart3, 
  Zap, Users, LogOut, ChevronLeft, ChevronRight, Moon, Sun, Monitor,
  Mail, Menu, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { usePermissions } from '../hooks/usePermissions';
import { cn } from '../lib/utils';
import { APP_CREST_URL, APP_NAME } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, isDark, setTheme } = useTheme();
  const { isAdmin, isOperator, canManageUsers, canViewAudit } = usePermissions();

  const roleBadge = isAdmin
    ? { label: 'Administrator', cls: 'bg-rose-500/10 border-rose-500/20 text-rose-500' }
    : isOperator
    ? { label: 'Operator', cls: 'bg-blue-500/10 border-blue-500/20 text-blue-500' }
    : { label: 'Viewer', cls: 'bg-slate-500/10 border-slate-500/20 text-slate-500' };

  function isViewer() { return !isAdmin && !isOperator; }

  const menuItems = [
    { id: 'dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'devices',    label: 'Devices',         icon: Shield },
    { id: 'wifi',       label: 'WiFi Passwords',  icon: Wifi },
    { id: 'vault',      label: 'Password Vault',  icon: Key },
    { id: 'notes',      label: 'Secure Notes',    icon: FileText },
    { id: 'messages',   label: 'Messages',        icon: Mail },
    { id: 'analytics',  label: 'Analytics',       icon: BarChart3 },
    { id: 'generator',  label: 'Password Gen',    icon: Zap, show: !isViewer() },
    { id: 'audit',      label: 'Audit Logs',      icon: History, show: canViewAudit },
    { id: 'users',      label: 'User Management', icon: Users,   show: canManageUsers },
  ];

  const filteredMenu = menuItems.filter(item => item.show === undefined || item.show);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  // Three-way theme toggle: light → system → dark → light
  const cycleTheme = () => {
    if (theme === 'light') setTheme('system');
    else if (theme === 'system') setTheme('dark');
    else setTheme('light');
  };

  const themeIcon = theme === 'dark' ? <Moon size={18} className="group-hover:-rotate-12 transition-transform duration-700" />
    : theme === 'light' ? <Sun size={18} className="group-hover:rotate-90 transition-transform duration-700" />
    : <Monitor size={18} className="group-hover:scale-110 transition-transform duration-300" />;

  const themeLabel = theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'System Theme';

  const sidebarContent = (isMobile = false) => (
    <div className={cn(
      "flex flex-col h-full transition-all duration-[250ms] border-r relative z-20 shadow-2xl",
      isDark
        ? "bg-command-dark-card border-command-dark-border text-slate-300"
        : "bg-white border-slate-200 text-slate-600",
      !isMobile && (collapsed ? "w-20" : "w-64"),
      isMobile && "w-72"
    )}>
      {/* Header */}
      <div className={cn(
        "p-6 flex flex-col items-center gap-4 border-b transition-colors duration-[250ms]",
        isDark ? "border-command-dark-border bg-black/20" : "border-slate-100 bg-white"
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
        {(!collapsed || isMobile) && (
          <div className="text-center animate-in fade-in slide-in-from-top-2 duration-500">
            <h2 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{APP_NAME} Management</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ghana Air Force HQ</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        {(!collapsed || isMobile) && (
          <div className="px-6 mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {isAdmin ? 'Admin Navigation' : isOperator ? 'Operator Navigation' : 'Viewer Navigation'}
            </p>
          </div>
        )}
        <nav className="px-3 space-y-1.5">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-all group relative overflow-hidden",
                activeTab === item.id
                  ? "bg-command-blue text-white shadow-lg shadow-blue-600/30"
                  : cn("hover:bg-slate-50 text-slate-500 hover:text-slate-900", isDark && "hover:bg-white/5 text-slate-400 hover:text-slate-200")
              )}
            >
              {activeTab === item.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
              )}
              <item.icon size={20} className={cn(
                "relative z-10 transition-transform group-hover:scale-110",
                activeTab === item.id ? "text-white" : isDark ? "text-slate-400 group-hover:text-slate-200" : "text-slate-400 group-hover:text-slate-700"
              )} />
              {(!collapsed || isMobile) && <span className="font-bold text-sm relative z-10 tracking-tight">{item.label}</span>}
              {activeTab === item.id && (!collapsed || isMobile) && (
                <div className="ml-auto relative z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className={cn(
        "p-4 space-y-3 border-t transition-colors",
        isDark ? "border-command-dark-border bg-black/20" : "border-slate-100 bg-white"
      )}>
        {(!collapsed || isMobile) && (
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">System Controls</p>
        )}

        {(!collapsed || isMobile) && (
          <div className={cn(
            "rounded-2xl p-3 border mb-4 group transition-all cursor-pointer relative overflow-hidden",
            isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-100 hover:bg-slate-50"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-command-blue flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-slate-900")}>{user?.email}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={cn("px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-tighter", roleBadge.cls)}>
                    {roleBadge.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {/* Theme toggle pill */}
          {(!collapsed || isMobile) ? (
            <div className={cn(
              "flex items-center rounded-xl p-1 mb-1",
              isDark ? "bg-white/5" : "bg-slate-100"
            )}>
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  !isDark
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <Sun size={13} />
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                  isDark
                    ? "bg-command-blue text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                )}
              >
                <Moon size={13} />
                Dark
              </button>
            </div>
          ) : (
            <button
              onClick={cycleTheme}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-all group justify-center",
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              {themeIcon}
            </button>
          )}

          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center gap-3 w-full p-3 rounded-xl transition-all group",
                isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
                collapsed && "justify-center"
              )}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />}
              {!collapsed && <span className="text-sm font-bold tracking-tight">Collapse Sidebar</span>}
            </button>
          )}

          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 w-full p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all group",
              (collapsed && !isMobile) && "justify-center"
            )}
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            {(!collapsed || isMobile) && <span className="text-sm font-bold tracking-tight">Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b shadow-sm",
        isDark ? "bg-command-dark-card border-command-dark-border" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-blue-400 to-blue-900 p-1">
            <img src={APP_CREST_URL} alt="Crest" className="w-full h-full object-contain" />
          </div>
          <span className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{APP_NAME}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className={cn("p-2 rounded-xl transition-all", isDark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100")}
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        {sidebarContent(false)}
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full">
            {sidebarContent(true)}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-48px] p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg text-slate-600 dark:text-slate-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
