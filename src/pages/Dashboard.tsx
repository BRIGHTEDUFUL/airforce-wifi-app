import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Wifi, 
  Key, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Fingerprint,
  Activity,
  Plus,
  History,
  Lock,
  ChevronRight,
  Monitor,
  Zap,
  Mail
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/utils';

interface DashboardProps {
  setActiveTab?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab = () => {} }) => {
  const { isDark, theme, setTheme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const { token, user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (!stats) return (
    <div className="flex items-center justify-center h-full bg-theme transition-colors">
      <div className="flex flex-col items-center gap-4">
        <RefreshCw className="w-8 h-8 text-command-blue animate-spin" />
        <p className="text-sm font-bold text-theme-2 uppercase tracking-widest">Loading WiFi Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700 transition-colors">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">WiFi Management Dashboard</h1>
          <p className="text-theme-2 font-medium text-sm md:text-base">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchStats}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-theme shadow-sm hover:bg-surface-2 transition-all text-sm font-bold text-theme disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

        </div>
      </header>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-r from-blue-800 to-blue-500 p-6 md:p-10 text-white shadow-2xl shadow-blue-600/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0] || 'User'}!
              </h2>
              <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center gap-2">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">{user?.role || 'Administrator'}</span>
              </div>
            </div>
            <p className="text-blue-100 text-sm md:text-lg font-medium opacity-80">
              Network security overview — {stats.totalDevices} devices monitored, {stats.totalWifi} active credentials
            </p>
          </div>
          <div className="flex flex-row md:flex-col md:items-end items-center gap-4 md:gap-2">
            <div className="flex items-center gap-2 text-xl md:text-2xl font-bold tracking-tighter">
              <Clock size={20} className="text-blue-200" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">System operational</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Authentication', status: 'Active', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Authorization', status: 'Admin', icon: Fingerprint, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Monitoring', status: `${stats.recentLogs.length} events`, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((card, i) => (
          <div key={i} className="bg-surface p-6 rounded-3xl border border-theme shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-2xl", card.bg, card.color)}>
                <card.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-theme-3 uppercase tracking-widest">{card.label}</p>
                <p className="text-sm font-bold text-theme">Secure system access</p>
              </div>
            </div>
            <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", card.bg, card.color)}>
              {card.status}
            </div>
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Devices', value: stats.totalDevices, icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active Credentials', value: stats.totalCredentials, icon: Key, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Expiring Soon', value: stats.alerts.filter((a: any) => a.title.includes('Expiry')).length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Expired', value: 0, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((card, i) => (
          <div key={i} className="bg-surface p-8 rounded-[2rem] border border-theme shadow-sm space-y-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-theme-3 uppercase tracking-[0.2em]">{card.label}</p>
              <div className={cn("p-3 rounded-2xl", card.bg, card.color)}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-5xl font-bold text-theme tracking-tighter">{card.value}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-theme-3 uppercase">
                <Activity size={12} />
                {card.label === 'Total Devices' ? 'Registered' : card.label === 'Active Credentials' ? 'In use' : card.label === 'Expiring Soon' ? 'Within 7 days' : 'Need rotation'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-surface p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-theme shadow-sm space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-surface-2 text-blue-600 rounded-2xl border border-theme">
              <Zap size={20} />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-theme tracking-tight">Quick Actions</h3>
          </div>
          <button className="text-xs font-bold text-command-blue uppercase tracking-widest hover:underline">View All</button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          {[
            { id: 'devices', label: 'Add Device', desc: 'Register new hardware', icon: Plus, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            { id: 'generator', label: 'Gen Password', desc: 'Create secure keys', icon: Key, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            { id: 'wifi', label: 'WiFi Access', desc: 'Manage credentials', icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
            { id: 'vault', label: 'Secure Vault', desc: 'Encrypted storage', icon: Lock, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
            { id: 'audit', label: 'Audit Logs', desc: 'System history', icon: History, color: 'text-slate-600', bg: 'bg-surface-2' },
            { id: 'messages', label: 'Messages', desc: 'System alerts', icon: Mail, color: 'text-rose-600', bg: 'bg-rose-500/10' },
          ].map((action, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(action.id)}
              className="flex flex-col items-center text-center gap-2 md:gap-3 p-4 md:p-6 rounded-2xl border border-theme hover:border-blue-200 hover:bg-surface-2 transition-all group"
            >
              <div className={cn("p-3 md:p-4 rounded-2xl transition-all group-hover:scale-110 group-hover:shadow-lg", action.bg, action.color)}>
                <action.icon size={20} />
              </div>
              <div className="space-y-0.5 md:space-y-1">
                <p className="text-xs md:text-sm font-bold text-theme">{action.label}</p>
                <p className="text-[10px] font-medium text-theme-2 leading-tight hidden sm:block">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

