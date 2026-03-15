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
    <div className="flex h-full bg-command-light dark:bg-slate-950 overflow-hidden">
      {/* Mail Sidebar */}
      <div className="w-64 border-r border-navy-700 bg-navy-800 text-slate-300 flex flex-col">
        <div className="p-6">
          <button className="w-full bg-command-blue text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
            <Mail size={18} />
            Compose
          </button>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                activeFolder === folder.id 
                  ? "bg-command-blue text-white shadow-lg shadow-blue-600/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <folder.icon size={18} />
                {folder.label}
              </div>
              {folder.count > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  activeFolder === folder.id ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"
                )}>
                  {folder.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Message List */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <Clock size={18} />
            </button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <Star size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {filteredMessages.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMessages.map(msg => (
                <button 
                  key={msg.id}
                  className={cn(
                    "w-full text-left p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all flex gap-4 group relative",
                    msg.unread && "bg-blue-50/30 dark:bg-blue-900/5"
                  )}
                >
                  {msg.unread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                  )}
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-sm", msg.unread ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                          {msg.sender}
                        </span>
                        {msg.priority && (
                          <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase rounded tracking-tighter">
                            Priority
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{msg.time}</span>
                    </div>
                    <h4 className={cn("text-sm truncate", msg.unread ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-700 dark:text-slate-300")}>
                      {msg.subject}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-relaxed">
                      {msg.preview}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full">
                <Mail size={48} className="opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">No messages found</p>
            </div>
          )}
        </div>
      </div>

      {/* Message Preview (Hidden on small screens) */}
      <div className="hidden xl:flex w-96 border-l border-slate-200 dark:border-slate-800 flex-col bg-slate-50 dark:bg-slate-900/50">
        <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-6">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center text-blue-600">
            <Shield size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure Communications</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Select a message from the list to view its contents. All communications are encrypted end-to-end.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
