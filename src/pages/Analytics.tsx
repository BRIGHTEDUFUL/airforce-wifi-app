import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Shield, Wifi, Key, Users, Activity, PieChart as PieIcon, UserCheck } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsProps {
  darkMode?: boolean;
}

const Analytics: React.FC<AnalyticsProps> = ({ darkMode }) => {
  const [stats, setStats] = useState<any>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data));
  }, [token]);

  if (!stats) return <div className="p-8 dark:text-white">Loading analytics...</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const chartTextColor = darkMode ? '#94a3b8' : '#64748b';
  const chartGridColor = darkMode ? '#1e293b' : '#e2e8f0';
  const chartTooltipBg = darkMode ? '#0f172a' : '#ffffff';
  const chartTooltipBorder = darkMode ? '#1e293b' : '#f1f5f9';
  const chartTooltipLabel = darkMode ? '#f8fafc' : '#0f172a';

  return (
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">System Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed metrics and data distribution across all modules.</p>
      </header>

      {/* Top Row: Activity Trend */}
      <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
          <div className="p-2 bg-command-blue/10 dark:bg-command-blue/20 rounded-xl">
            <Activity size={18} className="text-command-blue" />
          </div>
          Daily System Activity (Last 7 Days)
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyActivity.length > 0 ? stats.dailyActivity : [{name: 'No Data', value: 0}]}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: chartTextColor, fontWeight: 600}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: chartTextColor, fontWeight: 600}} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                labelStyle={{ fontWeight: 800, color: chartTooltipLabel, marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Device Distribution */}
        <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-emerald-500/10 rounded-xl border border-slate-100 dark:border-transparent">
              <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            Device Type Distribution
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.deviceTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100} 
                  tick={{fontSize: 11, fill: chartTextColor, fontWeight: 600}} 
                />
                <Tooltip 
                  cursor={{fill: darkMode ? '#ffffff05' : '#f8fafc'}}
                  contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vault Categories */}
        <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-amber-500/10 rounded-xl border border-slate-100 dark:border-transparent">
              <Key size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            Credential Categories
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.vaultCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.vaultCategories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Activity Leaderboard */}
        <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-indigo-500/10 rounded-xl border border-slate-100 dark:border-transparent">
              <UserCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            Top Active Users
          </h3>
          <div className="space-y-6">
            {stats.topUsers.map((user: any, i: number) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{user.name}</span>
                  <span className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">{user.value} actions</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${(user.value / stats.topUsers[0].value) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.topUsers.length === 0 && <p className="text-slate-400 dark:text-slate-500 text-sm italic font-medium">No user activity recorded yet.</p>}
          </div>
        </div>

        {/* Module Activity Radar */}
        <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-rose-500/10 rounded-xl border border-slate-100 dark:border-transparent">
              <BarChart3 size={18} className="text-rose-600 dark:text-rose-400" />
            </div>
            Module Usage Intensity
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.moduleActivity}>
                <PolarGrid stroke={chartGridColor} />
                <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fill: chartTextColor, fontWeight: 700}} />
                <PolarRadiusAxis hide />
                <Radar
                  name="Activity"
                  dataKey="value"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: chartTooltipBg, border: `1px solid ${chartTooltipBorder}`, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* System Health Metrics */}
      <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8">System Health & Resource Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Database Storage</span>
              <span className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">1.2 MB / 100 MB</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-command-blue rounded-full w-[1.2%]"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">API Response Time</span>
              <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">45ms (Optimal)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[15%]"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Encryption Load</span>
              <span className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest">Low</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full w-[8%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
