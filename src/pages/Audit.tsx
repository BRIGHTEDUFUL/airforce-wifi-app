import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/audit', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data));
  }, [token]);

  const filteredLogs = logs.filter(log => 
    log.user_name.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase()) ||
    log.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50 dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Read-only history of all system actions and access.</p>
        </div>
        <button className="bg-white dark:bg-command-dark-card hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 px-6 py-2.5 rounded-xl border border-slate-200 dark:border-command-dark-border flex items-center gap-2 transition-all shadow-sm font-bold text-sm w-full sm:w-auto justify-center">
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-200 dark:border-command-dark-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-command-dark-border flex flex-col sm:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-command-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter logs by user, action, module or details..." 
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-transparent rounded-2xl outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="px-6 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-transparent rounded-2xl flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all">
            <Filter size={16} />
            All Modules
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500">
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">User</th>
                <th className="px-8 py-6">Action</th>
                <th className="px-8 py-6">Module</th>
                <th className="px-8 py-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-command-dark-border">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="text-sm hover:bg-white dark:hover:bg-white/5 transition-all group">
                  <td className="px-8 py-6 whitespace-nowrap text-slate-400 dark:text-slate-500 font-mono text-xs">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-900 dark:text-white">
                    {log.user_name}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      log.action.includes('Delete') ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20" :
                      log.action.includes('Add') || log.action.includes('Create') ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" :
                      "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-600 dark:text-slate-400 font-medium">
                    {log.module}
                  </td>
                  <td className="px-8 py-6 text-slate-400 dark:text-slate-500 font-medium italic max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audit;
