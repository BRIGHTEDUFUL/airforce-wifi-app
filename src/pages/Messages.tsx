import React, { useState } from 'react';
import { Mail, Search, Trash2, Archive, Star, Clock, User, Shield, Send, Inbox, ChevronRight, AlertCircle, X, Reply, Forward, MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

const messages = [
  {
    id: 1,
    sender: 'System Admin',
    initials: 'SA',
    color: 'bg-rose-500',
    subject: 'Security Policy Update',
    preview: 'The network rotation policy has been updated for Q2. All administrators are required to review and acknowledge the new procedures before end of week.',
    body: 'The network rotation policy has been updated for Q2. All administrators are required to review and acknowledge the new procedures before end of week.\n\nKey changes include:\n• WiFi credential rotation every 60 days (down from 90)\n• Mandatory 2FA for all admin accounts\n• New device registration requires dual approval\n\nPlease confirm receipt by replying to this message.',
    time: '10:45 AM',
    date: 'Today',
    folder: 'inbox',
    unread: true,
    priority: true,
    starred: false,
  },
  {
    id: 2,
    sender: 'Network Monitor',
    initials: 'NM',
    color: 'bg-blue-500',
    subject: 'New Device Detected',
    preview: 'A new workstation (WS-442) has been registered in Sector 7. Verification pending from the duty officer.',
    body: 'A new workstation (WS-442) has been registered in Sector 7. Verification pending from the duty officer.\n\nDevice Details:\n• Hostname: WS-442\n• MAC: 00:1A:2B:3C:4D:5E\n• Location: Sector 7, Room 204\n• Registered by: Operator Mensah\n\nPlease verify and approve or reject this registration.',
    time: '09:12 AM',
    date: 'Today',
    folder: 'inbox',
    unread: false,
    priority: false,
    starred: true,
  },
  {
    id: 3,
    sender: 'Vault Guard',
    initials: 'VG',
    color: 'bg-amber-500',
    subject: 'Credential Expiry Warning',
    preview: '3 credentials in the Secure Vault are set to expire within 48 hours. Immediate rotation is recommended.',
    body: '3 credentials in the Secure Vault are set to expire within 48 hours. Immediate rotation is recommended.\n\nAffected credentials:\n1. AWS Root Account — expires in 24h\n2. Internal DB Admin — expires in 36h\n3. VPN Gateway Key — expires in 48h\n\nNavigate to the Password Vault to rotate these credentials.',
    time: 'Yesterday',
    date: 'Yesterday',
    folder: 'inbox',
    unread: true,
    priority: true,
    starred: false,
  },
  {
    id: 4,
    sender: 'Command Center',
    initials: 'CC',
    color: 'bg-emerald-500',
    subject: 'Maintenance Schedule',
    preview: 'Scheduled maintenance for the primary gateway is set for Sunday 02:00–04:00 hrs. Expect brief service interruptions.',
    body: 'Scheduled maintenance for the primary gateway is set for Sunday 02:00–04:00 hrs. Expect brief service interruptions.\n\nMaintenance window: Sunday 02:00 – 04:00 hrs\nAffected systems: Primary Gateway, DNS Resolver, DHCP Server\n\nAll non-essential services will be suspended during this window. Emergency protocols remain active.',
    time: 'Mon',
    date: 'Monday',
    folder: 'archive',
    unread: false,
    priority: false,
    starred: false,
  },
];

const folders = [
  { id: 'inbox',   label: 'Inbox',   icon: Inbox,   count: 2 },
  { id: 'starred', label: 'Starred', icon: Star,    count: 1 },
  { id: 'sent',    label: 'Sent',    icon: Send,    count: 0 },
  { id: 'archive', label: 'Archive', icon: Archive, count: 1 },
  { id: 'trash',   label: 'Trash',   icon: Trash2,  count: 0 },
];

const Messages: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(1);
  const [showCompose, setShowCompose] = useState(false);

  const filtered = messages.filter(m => {
    if (activeFolder === 'starred') return m.starred;
    return m.folder === activeFolder &&
      (m.sender.toLowerCase().includes(search.toLowerCase()) ||
       m.subject.toLowerCase().includes(search.toLowerCase()));
  });

  const selected = messages.find(m => m.id === selectedId) ?? null;
  const unreadCount = messages.filter(m => m.folder === 'inbox' && m.unread).length;

  return (
    <div className="flex h-full bg-white dark:bg-command-dark-bg overflow-hidden animate-in fade-in duration-500">

      {/* ── Left: Folder Nav ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-100 dark:border-command-dark-border bg-white dark:bg-command-dark-card shrink-0">
        <div className="p-6">
          <button
            onClick={() => setShowCompose(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-command-blue hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-command-blue/20 transition-all"
          >
            <Mail size={16} />
            Compose
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFolder(f.id); setSelectedId(null); }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeFolder === f.id
                  ? "bg-command-blue/5 dark:bg-command-blue/10 text-command-blue"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <div className="flex items-center gap-3">
                <f.icon size={17} />
                {f.label}
              </div>
              {f.count > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full",
                  activeFolder === f.id
                    ? "bg-command-blue text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-command-dark-border">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-full bg-command-blue flex items-center justify-center text-white text-xs font-black">SA</div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">System Admin</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">admin@airforce.mil</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Middle: Message List ── */}
      <div className="flex flex-col w-full lg:w-80 xl:w-96 border-r border-slate-100 dark:border-command-dark-border shrink-0 bg-white dark:bg-command-dark-bg">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 border-b border-slate-100 dark:border-command-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize">{activeFolder}</h1>
              {unreadCount > 0 && activeFolder === 'inbox' && (
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{unreadCount} unread</p>
              )}
            </div>
            {/* Mobile compose */}
            <button
              onClick={() => setShowCompose(true)}
              className="lg:hidden p-2.5 bg-command-blue text-white rounded-xl shadow-md"
            >
              <Mail size={16} />
            </button>
          </div>
          <div className="relative group">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-command-blue transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Mobile folder tabs */}
        <div className="lg:hidden flex gap-1 px-4 py-3 border-b border-slate-100 dark:border-command-dark-border overflow-x-auto">
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => { setActiveFolder(f.id); setSelectedId(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                activeFolder === f.id
                  ? "bg-command-blue text-white"
                  : "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5"
              )}
            >
              <f.icon size={12} />
              {f.label}
              {f.count > 0 && <span className="ml-0.5 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-command-dark-border">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 dark:text-slate-600 p-8">
              <Mail size={40} strokeWidth={1.5} />
              <p className="text-sm font-bold uppercase tracking-widest">No messages</p>
            </div>
          ) : filtered.map(msg => (
            <button
              key={msg.id}
              onClick={() => setSelectedId(msg.id)}
              className={cn(
                "w-full text-left px-5 py-4 transition-all group relative",
                selectedId === msg.id
                  ? "bg-command-blue/5 dark:bg-command-blue/10"
                  : "hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              {msg.unread && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-command-blue" />
              )}
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5", msg.color)}>
                  {msg.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-sm truncate", msg.unread ? "font-black text-slate-900 dark:text-white" : "font-semibold text-slate-600 dark:text-slate-400")}>
                      {msg.sender}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 ml-2">{msg.time}</span>
                  </div>
                  <p className={cn("text-xs truncate mb-1", msg.unread ? "font-bold text-slate-800 dark:text-slate-200" : "font-medium text-slate-600 dark:text-slate-400")}>
                    {msg.subject}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-medium leading-relaxed">
                    {msg.preview}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {msg.priority && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
                        <AlertCircle size={9} />
                        Priority
                      </span>
                    )}
                    {msg.starred && (
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Message Detail ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-command-dark-bg">
        {selected ? (
          <>
            {/* Detail Header */}
            <div className="px-8 py-6 bg-white dark:bg-command-dark-card border-b border-slate-100 dark:border-command-dark-border">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{selected.subject}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    {selected.priority && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-100 dark:border-rose-500/20">
                        <AlertCircle size={11} />
                        Priority
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{selected.date} · {selected.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all">
                    <Star size={18} className={selected.starred ? "fill-amber-400 text-amber-400" : ""} />
                  </button>
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    <Archive size={18} />
                  </button>
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                    <Trash2 size={18} />
                  </button>
                  <button className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {/* Sender info */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0", selected.color)}>
                  {selected.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 dark:text-white text-sm">{selected.sender}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">system@airforce.mil · To: admin@airforce.mil</p>
                </div>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-2xl">
                <div className="bg-white dark:bg-command-dark-card rounded-3xl border border-slate-100 dark:border-command-dark-border p-8 shadow-sm">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                    {selected.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Reply bar */}
            <div className="px-8 py-5 bg-white dark:bg-command-dark-card border-t border-slate-100 dark:border-command-dark-border">
              <div className="flex items-center gap-3 max-w-2xl">
                <div className="flex-1 flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-command-dark-border rounded-2xl cursor-text hover:border-command-blue/30 transition-all">
                  <Reply size={16} className="text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">Reply to {selected.sender}...</span>
                </div>
                <button className="flex items-center gap-2 px-5 py-3 bg-command-blue hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-command-blue/20">
                  <Forward size={16} />
                  Forward
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-24 h-24 bg-command-blue/5 dark:bg-command-blue/10 rounded-[2rem] flex items-center justify-center">
              <Shield size={40} className="text-command-blue/40" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-700 dark:text-slate-300">Select a message</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-xs leading-relaxed">
                All communications are encrypted end-to-end using military-grade protocols.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose Modal ── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-command-dark-card rounded-[2rem] border border-slate-100 dark:border-command-dark-border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-command-dark-border">
              <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">New Message</h3>
              <button onClick={() => setShowCompose(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input placeholder="To" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-command-dark-border rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-command-blue/30 transition-all" />
              <input placeholder="Subject" className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-command-dark-border rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-command-blue/30 transition-all" />
              <textarea placeholder="Write your message..." rows={6} className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-command-dark-border rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-command-blue/30 transition-all resize-none" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCompose(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-command-dark-border text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button className="flex-1 py-3 rounded-xl bg-command-blue hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-command-blue/20 flex items-center justify-center gap-2">
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
