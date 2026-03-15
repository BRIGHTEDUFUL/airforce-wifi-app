import React, { useState } from 'react';
import { Mail, Search, Trash2, Archive, Star, Clock, User, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

const Messages: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [search, setSearch] = useState('');

  const messages = [
    { id: 1, sender: 'System Admin', subject: 'Security Policy Update', preview: 'The network rotation policy has been updated for Q2...', time: '10:45 AM', folder: 'inbox', unread: true, priority: true },
    { id: 2, sender: 'Network Monitor', subject: 'New Device Detected', preview: 'A new workstation (WS-442) has been registered in Sector 7...', time: '09:12 AM', folder: 'inbox', unread: false, priority: false },
    { id: 3, sender: 'Vault Guard', subject: 'Credential Expiry Warning', preview: '3 credentials in the Secure Vault are set to expire within 48 hours...', time: 'Yesterday', folder: 'inbox', unread: true, priority: true },
    { id: 4, sender: 'Command Center', subject: 'Maintenance Schedule', preview: 'Scheduled maintenance for the primary gateway is set for Sunday...', time: 'Yesterday', folder: 'archive', unread: false, priority: false },
  ];

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Mail, count: 3 },
    { id: 'starred', label: 'Starred', icon: Star, count: 0 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 12 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  const filteredMessages = messages.filter(m => 
    m.folder === activeFolder && 
    (m.sender.toLowerCase().includes(search.toLowerCase()) || 
     m.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-full bg-command-light dark:bg-command-dark-bg overflow-hidden animate-in fade-in duration-700">
      {/* Mail Sidebar */}
      <div className="w-72 border-r border-slate-100 dark:border-command-dark-border bg-white dark:bg-command-dark-card flex flex-col">
        <div className="p-8">
          <button className="w-full bg-command-blue text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-command-blue/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
            <Mail size={18} />
            Compose
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={cn(
                "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all text-sm font-bold",
                activeFolder === folder.id 
                  ? "bg-command-blue/5 dark:bg-command-blue/10 text-command-blue" 
                  : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <div className="flex items-center gap-4">
                <folder.icon size={18} className={cn(activeFolder === folder.id ? "text-command-blue" : "text-slate-400 dark:text-slate-500")} />
                {folder.label}
              </div>
              {folder.count > 0 && (
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest",
                  activeFolder === folder.id ? "bg-command-blue text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                )}>
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Message List */}
      <div className="flex-1 flex flex-col min-w-0 bg-command-light dark:bg-command-dark-bg">
        <header className="h-24 border-b border-slate-50 dark:border-command-dark-border flex items-center px-8 gap-6 bg-white dark:bg-command-dark-card">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-command-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent rounded-2xl outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-medium text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 transition-all">
              <Clock size={18} />
            </button>
            <button className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 transition-all">
              <Star size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {filteredMessages.length > 0 ? (
            <div className="space-y-4">
              {filteredMessages.map(msg => (
                <button 
                  key={msg.id}
                  className={cn(
                    "w-full text-left p-6 bg-white dark:bg-command-dark-card rounded-[2rem] border border-slate-100 dark:border-command-dark-border hover:border-command-blue/20 dark:hover:border-command-blue/40 hover:shadow-md transition-all flex gap-6 group relative",
                    msg.unread && "ring-2 ring-command-blue/5 dark:ring-command-blue/20"
                  )}
                >
                  {msg.unread && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-command-blue" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 group-hover:bg-command-blue/5 dark:group-hover:bg-command-blue/20 group-hover:text-command-blue transition-colors">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold text-sm", msg.unread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                          {msg.sender}
                        </span>
                        {msg.priority && (
                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase rounded-lg tracking-widest border border-rose-100 dark:border-rose-900/40">
                            Priority
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{msg.time}</span>
                    </div>
                    <h4 className={cn("text-sm truncate", msg.unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300")}>
                      {msg.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed font-medium">
                      {msg.preview}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-6">
              <div className="p-10 bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
                <Mail size={48} className="text-slate-200 dark:text-slate-800" />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">No messages found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Preview (Hidden on small screens) */}
      <div className="hidden xl:flex w-[28rem] border-l border-slate-50 dark:border-command-dark-border flex-col bg-white dark:bg-command-dark-card">
        <div className="p-12 flex flex-col items-center justify-center h-full text-center space-y-8">
          <div className="w-32 h-32 bg-command-blue/5 dark:bg-command-blue/20 rounded-[2.5rem] flex items-center justify-center text-command-blue shadow-inner">
            <Shield size={56} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Secure Communications</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-xs">
              Select a message from the list to view its contents. All communications are encrypted end-to-end using military-grade protocols.
            </p>
          </div>
          <div className="pt-8 w-full border-t border-slate-50 dark:border-command-dark-border">
            <div className="flex justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
              <div className="w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
