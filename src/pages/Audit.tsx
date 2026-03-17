import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';

const Audit: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/audit', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data));
  }, [token]);

  const modules = ['All', ...Array.from(new Set(logs.map(l => l.module)))];

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase()) ||
      log.details?.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === 'All' || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Module', 'Details'];
    const rows = filteredLogs.map(log => [
      formatDate(log.timestamp),
      log.user_name,
      log.action,
      log.module,
      log.details || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">Audit Logs</h1>
          <p className="text-theme-2 font-medium text-sm">Read-only history of all system actions and access.</p>
        </div>
        <button onClick={handleExportCSV} className="bg-surface hover:bg-surface-2 text-theme px-6 py-2.5 rounded-xl border border-theme flex items-center gap-2 transition-all shadow-sm font-bold text-sm w-full sm:w-auto justify-center">
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <div className="bg-surface rounded-[2.5rem] border border-theme shadow-sm overflow-hidden">
        <div className="p-6 border-b border-theme flex flex-col sm:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-command-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Filter logs by user, action, module or details..." 
              className="w-full pl-12 pr-4 py-3 bg-surface-2 border border-theme rounded-2xl outline-none focus:border-command-blue/20  focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-medium text-theme"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 pointer-events-none" />
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="pl-10 pr-6 py-3 bg-surface-2 border border-theme rounded-2xl text-sm font-bold text-theme-2 outline-none focus:border-command-blue/20 transition-all appearance-none cursor-pointer"
            >
              {modules.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2/50 text-[10px] uppercase tracking-[0.2em] font-black text-theme-3">
                <th className="px-4 md:px-8 py-4 md:py-6">Timestamp</th>
                <th className="px-4 md:px-8 py-4 md:py-6">User</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Action</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Module</th>
                <th className="px-4 md:px-8 py-4 md:py-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="text-sm hover:bg-surface-2 transition-all group">
                  <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-theme-3 font-mono text-xs">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-theme">
                    {log.user_name}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      log.action.includes('Delete') ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                      log.action.includes('Add') || log.action.includes('Create') ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                      "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-theme-2 font-medium">
                    {log.module}
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-theme-3 font-medium italic max-w-xs truncate">
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

