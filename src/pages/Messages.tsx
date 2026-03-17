import React, { useState, useEffect } from 'react';
import {
  Mail, Search, Trash2, Archive, Star, Shield, Send, Inbox,
  ChevronLeft, AlertCircle, X, Reply, Forward, MoreHorizontal,
  RefreshCw, CheckCheck, Bell
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

interface Message {
  id: number;
  type: 'security' | 'expiry' | 'system';
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}

const TYPE_CONFIG = {
  security: { color: 'bg-rose-500',    initials: 'SEC', label: 'Security',  badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  expiry:   { color: 'bg-amber-500',   initials: 'EXP', label: 'Expiry',    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  system:   { color: 'bg-blue-500',    initials: 'SYS', label: 'System',    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

const SENDER_MAP = {
  security: 'Security Monitor',
  expiry:   'Vault Guard',
  system:   'System Admin',
};

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'security' | 'expiry' | 'system'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [compose, setCompose] = useState({ type: 'system', title: '', content: '' });
  const [isSending, setIsSending] = useState(false);
  const { token, user } = useAuth();
  const { isAdmin, isOperator } = usePermissions();

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [token]);

  const markRead = async (id: number) => {
    await fetch(`/api/messages/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
  };

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileView('detail');
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.is_read) markRead(id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this message?')) return;
    await fetch(`/api/messages/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) { setSelectedId(null); setMobileView('list'); }
  };

  const handleMarkAllRead = async () => {
    const unread = messages.filter(m => !m.is_read);
    await Promise.all(unread.map(m => fetch(`/api/messages/${m.id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })));
    setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compose.title || !compose.content) return;
    setIsSending(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(compose)
      });
      setShowCompose(false);
      setCompose({ type: 'system', title: '', content: '' });
      fetchMessages();
    } catch (e) { console.error(e); }
    finally { setIsSending(false); }
  };

  const filtered = messages.filter(m => {
    const matchFilter =
      activeFilter === 'all' ? true :
      activeFilter === 'unread' ? !m.is_read :
      m.type === activeFilter;
    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const selected = messages.find(m => m.id === selectedId) ?? null;
  const unreadCount = messages.filter(m => !m.is_read).length;

  const filters = [
    { id: 'all',      label: 'All',      icon: Inbox,  count: messages.length },
    { id: 'unread',   label: 'Unread',   icon: Bell,   count: unreadCount },
    { id: 'security', label: 'Security', icon: Shield, count: messages.filter(m => m.type === 'security').length },
    { id: 'expiry',   label: 'Expiry',   icon: AlertCircle, count: messages.filter(m => m.type === 'expiry').length },
    { id: 'system',   label: 'System',   icon: Mail,   count: messages.filter(m => m.type === 'system').length },
  ] as const;

  return (
    <div className="flex h-full bg-theme overflow-hidden animate-in fade-in duration-500">

      {/* ── Left: Nav Panel ── */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 border-r border-theme bg-surface shrink-0">
        <div className="p-5 border-b border-theme">
          <h2 className="text-xs font-black text-theme-3 uppercase tracking-[0.2em] mb-4">Messages</h2>
          {(isAdmin || isOperator) && (
            <button
              onClick={() => setShowCompose(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-command-blue hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-command-blue/20 transition-all"
            >
              <Send size={14} />
              Compose
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeFilter === f.id
                  ? "bg-command-blue/10 text-command-blue"
                  : "text-theme-2 hover:bg-surface-2 hover:text-theme"
              )}
            >
              <div className="flex items-center gap-3">
                <f.icon size={16} />
                {f.label}
              </div>
              {f.count > 0 && (
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center",
                  activeFilter === f.id ? "bg-command-blue text-white" : "bg-surface-2 text-theme-3"
                )}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-theme">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-2">
            <div className="w-8 h-8 rounded-full bg-command-blue flex items-center justify-center text-white text-xs font-black shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-theme truncate">{user?.name}</p>
              <p className="text-[10px] text-theme-3 font-medium truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Middle: Message List ── */}
      <div className={cn(
        "flex flex-col w-full lg:w-80 xl:w-96 border-r border-theme shrink-0 bg-theme",
        mobileView === 'detail' && "hidden lg:flex"
      )}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-theme space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-theme capitalize">{activeFilter === 'all' ? 'All Messages' : activeFilter}</h1>
              {unreadCount > 0 && (
                <p className="text-[10px] font-bold text-command-blue uppercase tracking-widest">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all read"
                  className="p-2 rounded-xl text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                  <CheckCheck size={16} />
                </button>
              )}
              <button onClick={fetchMessages} title="Refresh"
                className="p-2 rounded-xl text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
              {(isAdmin || isOperator) && (
                <button onClick={() => setShowCompose(true)}
                  className="lg:hidden p-2 bg-command-blue text-white rounded-xl shadow-md">
                  <Send size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-command-blue transition-colors" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-transparent rounded-xl text-sm font-medium text-theme outline-none focus:border-command-blue/20 transition-all"
            />
          </div>

          {/* Mobile filter tabs */}
          <div className="lg:hidden flex gap-1 overflow-x-auto pb-0.5">
            {filters.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all shrink-0",
                  activeFilter === f.id ? "bg-command-blue text-white" : "text-theme-2 bg-surface-2"
                )}>
                <f.icon size={11} />
                {f.label}
                {f.count > 0 && <span className="opacity-70">{f.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-theme">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-theme-3">
              <RefreshCw size={24} className="animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-theme-3 p-8">
              <Mail size={36} strokeWidth={1.5} />
              <p className="text-sm font-bold uppercase tracking-widest">No messages</p>
            </div>
          ) : filtered.map(msg => {
            const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.system;
            return (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg.id)}
                className={cn(
                  "w-full text-left px-4 py-3.5 transition-all group relative",
                  selectedId === msg.id ? "bg-command-blue/5 border-l-2 border-command-blue" : "hover:bg-surface-2 border-l-2 border-transparent"
                )}
              >
                {!msg.is_read && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-command-blue" />
                )}
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5", cfg.color)}>
                    {cfg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("text-xs truncate", !msg.is_read ? "font-black text-theme" : "font-semibold text-theme-2")}>
                        {SENDER_MAP[msg.type]}
                      </span>
                      <span className="text-[10px] font-bold text-theme-3 shrink-0 ml-2">
                        {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate mb-1", !msg.is_read ? "font-bold text-theme" : "font-medium text-theme-2")}>
                      {msg.title}
                    </p>
                    <p className="text-[11px] text-theme-3 truncate font-medium">
                      {msg.content.slice(0, 80)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", cfg.badge)}>
                        {cfg.label}
                      </span>
                      {!msg.is_read && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-command-blue">New</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Message Detail ── */}
      <div className={cn("flex-1 flex flex-col min-w-0 bg-theme", mobileView === 'list' && "hidden lg:flex")}>
        {selected ? (() => {
          const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.system;
          return (
            <>
              {/* Detail Header */}
              <div className="px-5 md:px-8 py-5 bg-surface border-b border-theme">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button onClick={() => setMobileView('list')}
                      className="lg:hidden p-2 rounded-xl text-theme-2 hover:bg-surface-2 transition-all shrink-0">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base md:text-lg font-black text-theme mb-2 leading-tight">{selected.title}</h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", cfg.badge)}>
                          {cfg.label}
                        </span>
                        {!selected.is_read && (
                          <span className="text-[10px] font-black uppercase tracking-widest text-command-blue bg-command-blue/10 px-2.5 py-1 rounded-full">
                            Unread
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-theme-3 uppercase tracking-widest">
                          {formatDate(selected.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!selected.is_read && (
                      <button onClick={() => markRead(selected.id)} title="Mark as read"
                        className="p-2 rounded-xl text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                        <CheckCheck size={17} />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(selected.id)} title="Delete"
                        className="p-2 rounded-xl text-theme-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={17} />
                      </button>
                    )}
                    <button className="p-2 rounded-xl text-theme-3 hover:text-theme-2 hover:bg-surface-2 transition-all">
                      <MoreHorizontal size={17} />
                    </button>
                  </div>
                </div>

                {/* Sender info */}
                <div className="flex items-center gap-3 p-3 bg-surface-2 rounded-2xl">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-xs shrink-0", cfg.color)}>
                    {cfg.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-theme text-sm">{SENDER_MAP[selected.type]}</p>
                    <p className="text-[11px] text-theme-3 font-medium">system@airforce.mil → {user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8">
                <div className="max-w-2xl">
                  <div className="bg-surface rounded-3xl border border-theme p-6 md:p-8 shadow-sm">
                    <p className="text-sm text-theme leading-relaxed font-medium whitespace-pre-line">
                      {selected.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reply bar */}
              <div className="px-5 md:px-8 py-4 bg-surface border-t border-theme">
                <div className="flex items-center gap-3 max-w-2xl">
                  <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-surface-2 border border-theme rounded-2xl cursor-not-allowed opacity-60">
                    <Reply size={15} className="text-theme-3 shrink-0" />
                    <span className="text-sm text-theme-3 font-medium">System messages are read-only</span>
                  </div>
                  {(isAdmin || isOperator) && (
                    <button onClick={() => setShowCompose(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-command-blue hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-command-blue/20">
                      <Forward size={15} />
                      New
                    </button>
                  )}
                </div>
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
            <div className="w-20 h-20 bg-command-blue/5 rounded-[2rem] flex items-center justify-center">
              <Shield size={36} className="text-command-blue/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-theme">Select a message</h3>
              <p className="text-sm text-theme-3 font-medium max-w-xs leading-relaxed">
                All system communications are logged and monitored.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Compose Modal ── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface rounded-[2rem] border border-theme shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
              <h3 className="font-black text-theme text-sm uppercase tracking-widest">New System Message</h3>
              <button onClick={() => setShowCompose(false)}
                className="p-2 rounded-xl text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest">Type</label>
                <select
                  value={compose.type}
                  onChange={e => setCompose({ ...compose, type: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-2 border border-theme rounded-xl text-sm font-bold text-theme outline-none focus:border-command-blue/30 transition-all appearance-none"
                >
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="expiry">Expiry</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest">Subject</label>
                <input
                  required
                  placeholder="Message subject..."
                  value={compose.title}
                  onChange={e => setCompose({ ...compose, title: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-2 border border-theme rounded-xl text-sm font-medium text-theme outline-none focus:border-command-blue/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest">Content</label>
                <textarea
                  required
                  placeholder="Write your message..."
                  rows={5}
                  value={compose.content}
                  onChange={e => setCompose({ ...compose, content: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-2 border border-theme rounded-xl text-sm font-medium text-theme outline-none focus:border-command-blue/30 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="flex-1 py-3 rounded-xl border border-theme text-theme-2 font-bold text-sm hover:bg-surface-2 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSending}
                  className="flex-1 py-3 rounded-xl bg-command-blue hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-command-blue/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
