import React, { useState, useEffect } from 'react';
import { Shield, Wifi, Key, AlertTriangle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatDate } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data));
  }, [token]);

  if (!stats) return <div className="p-8">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Devices', value: stats.totalDevices, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'WiFi Networks', value: stats.totalWifi, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Stored Credentials', value: stats.totalCredentials, icon: Key, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Active Alerts', value: stats.alerts.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400">System status and credential statistics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Activity Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Mon', actions: 12 },
                { name: 'Tue', actions: 19 },
                { name: 'Wed', actions: 15 },
                { name: 'Thu', actions: 22 },
                { name: 'Fri', actions: 30 },
                { name: 'Sat', actions: 8 },
                { name: 'Sun', actions: 5 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="actions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Recent Activity
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {stats.recentLogs.map((log: any) => (
              <div key={log.id} className="flex gap-3 text-sm border-l-2 border-blue-500 pl-3 py-1">
                <div className="flex-1">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{log.user_name} • {log.module}</p>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Security Alerts & Notifications</h3>
        <div className="space-y-3">
          {stats.alerts.length > 0 ? stats.alerts.map((alert: any) => (
            <div key={alert.id} className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 flex items-start gap-3">
              <AlertTriangle className="text-rose-600 mt-0.5" size={18} />
              <div>
                <p className="font-semibold text-rose-900 dark:text-rose-200 text-sm">{alert.title}</p>
                <p className="text-rose-700 dark:text-rose-300 text-xs">{alert.content}</p>
              </div>
            </div>
          )) : (
            <p className="text-slate-500 text-sm italic">No active security alerts.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
