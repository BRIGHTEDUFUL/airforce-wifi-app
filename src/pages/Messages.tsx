import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Search, Trash2, Shield, Send, Inbox,
  ChevronLeft, AlertCircle, X, PenSquare,
  RefreshCw, CheckCheck, Bell, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
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
  security: {
    color: 'bg-rose-500',
    label: 'Security',
    badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    icon: Shield,
  },
  expiry: {
    color: 'bg-amber-500',
    label: 'Expiry',
    badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: Clock,
  },
  system: {
    color: 'bg-blue-500',
    label: 'System',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: Mail,
  },
};

const SENDER_MAP = {
  security: 'Security Monitor',
  expiry: 'Vault Guard',
  system: 'System Admin',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type Filter = 'all' | 'unread' | 'security' | 'expiry' | 'system';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [compose, setCompose] = useState({ type: 'system', title: '', content: '' });
  const [isSending, setIsSending] = useState(false);
  const { token } = useAuth();
  const { isAdmin, isOperator } = usePermissions();

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data);
      setSelectedId(prev => (prev === null && data.length > 0) ? data[0].id : prev);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

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
    await Promise.all(unread.map(m =>
      fetch(`/api/messages/${m.id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    ));
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
        body: JSON.stringify(compose),
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
    const q = search.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const selected = messages.find(m => m.id === selectedId) ?? null;
  const unreadCount = messages.filter(m => !m.is_read).length;

  const filters: { id: Filter; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all',      label: 'All',      icon: Inbox,       count: messages.length },
    { id: 'unread',   label: 'Unread',   icon: Bell,        count: unreadCount },
    { id: 'security', label: 'Security', icon: Shield,      count: messages.filter(m => m.type === 'security').length },
    { id: 'expiry',   label: 'Expiry',   icon: AlertCircle, count: messages.filter(m => m.type === 'expiry').length },
    { id: 'system',   label: 'System',   icon: Mail,        count: messages.filter(m => m.type === 'system').length },
  ];

  return (
    <div className="flex h-full bg-theme overflow-hidden">

      {/* ── LIST PANEL ── */}
      <div className={cn(
        "flex flex-col w-full lg:w-[360px] xl:w-[400px] border-r border-theme shrink-0 bg-surface",
        mobileView === 'detail' && "hidden lg:flex"
      )}>

        {/* List header */}
        <div className="px-5 pt-6 pb-4 border-b border-theme space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-theme tracking-tight">Messages</h1>
              <p className="text-xs text-theme-3 font-medium mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all read"
                  className="p-2 rounded-xl text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                  <CheckCheck size={17} />
                </button>
              )}
              <button onClick={fetchMessages} title="Refresh"
                className="p-2 rounded-xl text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
              {(isAdmin || isOperator) && (
                <button onClick={() => setShowCompose(true)} title="Compose"
                  className="p-2 bg-command-blue hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all">
                  <PenSquare size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-3" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-2 rounded-xl text-sm text-theme font-medium outline-none border border-transparent focus:border-command-blue/20 transition-all placeholder:text-theme-3"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {filters.map(f => (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0",
                  activeFilter === f.id
                    ? "bg-command-blue text-white shadow-sm"
                    : "bg-surface-2 text-theme-2 hover:text-theme"
                )}>
                <f.icon size={12} />
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    activeFilter === f.id ? "bg-white/20" : "bg-surface text-theme-3"
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-theme-3">
              <RefreshCw size={22} className="animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-theme-3 p-8">
              <Mail size={32} strokeWidth={1.5} />
              <p className="text-sm font-semibold">No messages found</p>
            </div>
          ) : (
            <div className="divide-y divide-theme">
              {filtered.map(msg => {
                const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.system;
                const isSelected = selectedId === msg.id;
                const isUnread = !msg.is_read;
                return (
                  <button
                    key={msg.id}
                    onClick={() => handleSelect(msg.id)}
                    className={cn(
                      "w-full text-left px-5 py-4 transition-all relative",
                      isSelected
                        ? "bg-command-blue/5 border-l-[3px] border-command-blue"
                        : "hover:bg-surface-2 border-l-[3px] border-transparent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 mt-0.5",
                        cfg.color
                      )}>
                        <cfg.icon size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Row 1: sender + time */}
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={cn(
                            "text-xs truncate",
                            isUnread ? "font-bold text-theme" : "font-medium text-theme-2"
                          )}>
                            {SENDER_MAP[msg.type]}
                          </span>
                          <span className="text-[10px] text-theme-3 shrink-0 font-medium">
                            {timeAgo(msg.created_at)}
                          </span>
                        </div>

                        {/* Row 2: title */}
                        <p className={cn(
                          "text-sm truncate leading-snug",
                          isUnread ? "font-semibold text-theme" : "font-normal text-theme-2"
                        )}>
                          {msg.title}
                        </p>

                        {/* Row 3: preview */}
                        <p className="text-xs text-theme-3 truncate mt-0.5 font-normal leading-relaxed">
                          {msg.content.slice(0, 72)}{msg.content.length > 72 ? '…' : ''}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-command-blue shrink-0 mt-1.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── DETAIL PANEL ── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-theme",
        mobileView === 'list' && "hidden lg:flex"
      )}>
        {selected ? (() => {
          const cfg = TYPE_CONFIG[selected.type] || TYPE_CONFIG.system;
          const SenderIcon = cfg.icon;
          return (
            <>
              {/* Detail header */}
              <div className="px-6 md:px-10 py-6 bg-surface border-b border-theme">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button onClick={() => setMobileView('list')}
                      className="lg:hidden p-2 rounded-xl text-theme-2 hover:bg-surface-2 transition-all shrink-0 mt-0.5">
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-theme leading-tight mb-3">
                        {selected.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                          cfg.badge
                        )}>
                          <SenderIcon size={11} />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-theme-3 font-medium">
                          {new Date(selected.created_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {!selected.is_read && (
                          <span className="text-[11px] font-bold text-command-blue bg-command-blue/10 px-2.5 py-1 rounded-lg">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!selected.is_read && (
                      <button onClick={() => markRead(selected.id)} title="Mark as read"
                        className="p-2 rounded-xl text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                        <CheckCheck size={18} />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(selected.id)} title="Delete"
                        className="p-2 rounded-xl text-theme-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* From / To row */}
                <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-surface-2 rounded-xl border border-theme">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0",
                    cfg.color
                  )}>
                    <SenderIcon size={15} />
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-semibold text-theme">{SENDER_MAP[selected.type]}</span>
                    <span className="text-theme-3 mx-2">→</span>
                    <span className="text-theme-2">All Personnel</span>
                  </div>
                </div>
              </div>

              {/* Message body */}
              <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                <div className="max-w-2xl">
                  <p className="text-sm text-theme leading-7 font-normal whitespace-pre-line">
                    {selected.content}
                  </p>
                </div>
              </div>

              {/* Footer bar */}
              <div className="px-6 md:px-10 py-4 bg-surface border-t border-theme flex items-center justify-between gap-4">
                <p className="text-xs text-theme-3 font-medium">
                  System messages are read-only and cannot be replied to.
                </p>
                {(isAdmin || isOperator) && (
                  <button onClick={() => setShowCompose(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-command-blue hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm shadow-command-blue/20 shrink-0">
                    <PenSquare size={14} />
                    New Message
                  </button>
                )}
              </div>
            </>
          );
        })() : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center p-8">
            <div className="w-16 h-16 bg-surface rounded-2xl border border-theme flex items-center justify-center">
              <Mail size={28} className="text-theme-3" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-semibold text-theme mb-1">No message selected</p>
              <p className="text-sm text-theme-3 max-w-xs leading-relaxed">
                Select a message from the list to read it here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── COMPOSE MODAL ── */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-theme shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-command-blue/10 rounded-lg">
                  <PenSquare size={16} className="text-command-blue" />
                </div>
                <h3 className="font-bold text-theme text-sm">New System Message</h3>
              </div>
              <button onClick={() => setShowCompose(false)}
                className="p-2 rounded-xl text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-2 uppercase tracking-wider">Type</label>
                <select
                  value={compose.type}
                  onChange={e => setCompose({ ...compose, type: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm font-medium text-theme outline-none focus:border-command-blue/30 transition-all appearance-none"
                >
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="expiry">Expiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-2 uppercase tracking-wider">Subject</label>
                <input
                  required
                  placeholder="Enter message subject..."
                  value={compose.title}
                  onChange={e => setCompose({ ...compose, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm text-theme outline-none focus:border-command-blue/30 transition-all placeholder:text-theme-3"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-theme-2 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  placeholder="Write your message..."
                  rows={5}
                  value={compose.content}
                  onChange={e => setCompose({ ...compose, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm text-theme outline-none focus:border-command-blue/30 transition-all resize-none placeholder:text-theme-3"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="flex-1 py-2.5 rounded-xl border border-theme text-theme-2 font-semibold text-sm hover:bg-surface-2 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-command-blue hover:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                  {isSending ? 'Sending…' : 'Send Message'}
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
