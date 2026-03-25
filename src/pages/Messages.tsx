import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail, Search, Trash2, Shield, Send,
  ChevronLeft, AlertCircle, X, PenSquare,
  RefreshCw, CheckCheck, Bell, Clock, Inbox
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
    bg: 'bg-rose-500',
    soft: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-200 dark:border-rose-500/20',
    icon: Shield,
    label: 'Security',
  },
  expiry: {
    bg: 'bg-amber-500',
    soft: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-200 dark:border-amber-500/20',
    icon: Clock,
    label: 'Expiry',
  },
  system: {
    bg: 'bg-blue-500',
    soft: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-200 dark:border-blue-500/20',
    icon: Mail,
    label: 'System',
  },
};

const SENDER = {
  security: 'Security Monitor',
  expiry: 'Vault Guard',
  system: 'System Admin',
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

type Filter = 'all' | 'unread' | 'security' | 'expiry' | 'system';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [showCompose, setShowCompose] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [compose, setCompose] = useState({ type: 'system', title: '', content: '' });
  const [isSending, setIsSending] = useState(false);
  const { apiFetch } = useAuth();
  const { isAdmin, isOperator } = usePermissions();

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/messages');
      const data = await res.json();
      setMessages(data);
      setSelectedId(prev => prev === null && data.length > 0 ? data[0].id : prev);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  }, [apiFetch]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markRead = async (id: number) => {
    await apiFetch(`/api/messages/${id}/read`, { method: 'PUT' });
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
    await apiFetch(`/api/messages/${id}`, { method: 'DELETE' });
    setMessages(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) { setSelectedId(null); setMobileView('list'); }
  };

  const markAllRead = async () => {
    const unread = messages.filter(m => !m.is_read);
    await Promise.all(unread.map(m => apiFetch(`/api/messages/${m.id}/read`, { method: 'PUT' })));
    setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify(compose),
      });
      setShowCompose(false);
      setCompose({ type: 'system', title: '', content: '' });
      fetchMessages();
    } catch (e) { console.error(e); }
    finally { setIsSending(false); }
  };

  const unread = messages.filter(m => !m.is_read).length;

  const filtered = messages.filter(m => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'unread' ? !m.is_read :
      m.type === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
  });

  const selected = messages.find(m => m.id === selectedId) ?? null;

  const FILTERS: { id: Filter; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all',      label: 'All',      icon: Inbox,       count: messages.length },
    { id: 'unread',   label: 'Unread',   icon: Bell,        count: unread },
    { id: 'security', label: 'Security', icon: Shield,      count: messages.filter(m => m.type === 'security').length },
    { id: 'expiry',   label: 'Expiry',   icon: AlertCircle, count: messages.filter(m => m.type === 'expiry').length },
    { id: 'system',   label: 'System',   icon: Mail,        count: messages.filter(m => m.type === 'system').length },
  ];

  return (
    <div className="flex h-full overflow-hidden bg-theme">

      {/* ══ LIST PANEL ══ */}
      <div className={cn(
        "flex flex-col w-full lg:w-[340px] xl:w-[380px] shrink-0 border-r border-theme bg-surface",
        mobileView === 'detail' && "hidden lg:flex"
      )}>

        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-theme space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-theme">Messages</h1>
              <p className="text-[11px] text-theme-3 mt-0.5">
                {unread > 0 ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} title="Mark all read"
                  className="p-1.5 rounded-lg text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                  <CheckCheck size={16} />
                </button>
              )}
              <button onClick={fetchMessages} title="Refresh"
                className="p-1.5 rounded-lg text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
              </button>
              {(isAdmin || isOperator) && (
                <button onClick={() => setShowCompose(true)} title="Compose"
                  className="p-1.5 bg-command-blue hover:bg-blue-700 text-white rounded-lg transition-all">
                  <PenSquare size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-2 rounded-lg text-sm text-theme outline-none border border-transparent focus:border-command-blue/30 transition-all placeholder:text-theme-3"
            />
          </div>

          {/* Filter tabs — no scroll, wrap gracefully */}
          <div className="flex flex-wrap gap-1">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  filter === f.id
                    ? "bg-command-blue text-white"
                    : "bg-surface-2 text-theme-2 hover:text-theme"
                )}>
                <f.icon size={11} />
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    "ml-0.5 text-[10px] font-bold px-1 rounded-full",
                    filter === f.id ? "bg-white/25 text-white" : "text-theme-3"
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-theme">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 gap-2 text-theme-3">
              <RefreshCw size={18} className="animate-spin" />
              <span className="text-xs font-medium">Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-theme-3">
              <Mail size={28} strokeWidth={1.5} />
              <p className="text-sm font-medium">No messages</p>
            </div>
          ) : filtered.map(msg => {
            const cfg = TYPE_CONFIG[msg.type];
            const isSelected = selectedId === msg.id;
            const isUnread = !msg.is_read;
            return (
              <button key={msg.id} onClick={() => handleSelect(msg.id)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-all relative",
                  isSelected
                    ? "bg-command-blue/[0.06] border-l-2 border-command-blue"
                    : "hover:bg-surface-2 border-l-2 border-transparent"
                )}>
                <div className="flex items-start gap-3">
                  {/* Icon avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    cfg.soft
                  )}>
                    <cfg.icon size={15} className={cfg.text} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className={cn(
                        "text-xs truncate",
                        isUnread ? "font-semibold text-theme" : "font-medium text-theme-2"
                      )}>
                        {SENDER[msg.type]}
                      </span>
                      <span className="text-[10px] text-theme-3 shrink-0">{timeAgo(msg.created_at)}</span>
                    </div>
                    <p className={cn(
                      "text-[13px] truncate leading-snug",
                      isUnread ? "font-semibold text-theme" : "text-theme-2"
                    )}>
                      {msg.title}
                    </p>
                    <p className="text-[11px] text-theme-3 truncate mt-0.5 leading-relaxed">
                      {msg.content.slice(0, 65)}{msg.content.length > 65 ? '…' : ''}
                    </p>
                  </div>

                  {isUnread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-command-blue shrink-0 mt-2" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ DETAIL PANEL ══ */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-theme",
        mobileView === 'list' && "hidden lg:flex"
      )}>
        {selected ? (() => {
          const cfg = TYPE_CONFIG[selected.type];
          const Icon = cfg.icon;
          return (
            <>
              {/* Detail header */}
              <div className="px-6 md:px-10 py-6 bg-surface border-b border-theme">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button onClick={() => setMobileView('list')}
                      className="lg:hidden p-1.5 rounded-lg text-theme-2 hover:bg-surface-2 transition-all shrink-0 mt-1">
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-theme leading-tight mb-2">
                        {selected.title}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
                          cfg.soft, cfg.text, cfg.border
                        )}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-theme-3">
                          {new Date(selected.created_at).toLocaleString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {!selected.is_read && (
                          <span className="text-[11px] font-semibold text-command-blue bg-command-blue/10 px-2.5 py-1 rounded-lg">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!selected.is_read && (
                      <button onClick={() => markRead(selected.id)} title="Mark as read"
                        className="p-1.5 rounded-lg text-theme-3 hover:text-command-blue hover:bg-command-blue/10 transition-all">
                        <CheckCheck size={17} />
                      </button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(selected.id)} title="Delete"
                        className="p-1.5 rounded-lg text-theme-3 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>

                {/* From row */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-surface-2 rounded-xl border border-theme">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cfg.soft)}>
                    <Icon size={13} className={cfg.text} />
                  </div>
                  <div className="text-sm min-w-0">
                    <span className="font-semibold text-theme">{SENDER[selected.type]}</span>
                    <span className="text-theme-3 mx-1.5">→</span>
                    <span className="text-theme-2">All Personnel</span>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                <div className="max-w-2xl prose-sm">
                  <p className="text-sm text-theme leading-7 whitespace-pre-line">
                    {selected.content}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 md:px-10 py-3.5 bg-surface border-t border-theme flex items-center justify-between gap-4">
                <p className="text-xs text-theme-3">
                  System messages are read-only and cannot be replied to.
                </p>
                {(isAdmin || isOperator) && (
                  <button onClick={() => setShowCompose(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-command-blue hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-all shrink-0">
                    <PenSquare size={13} />
                    New Message
                  </button>
                )}
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-14 h-14 bg-surface rounded-2xl border border-theme flex items-center justify-center">
              <Mail size={24} className="text-theme-3" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-theme mb-1">No message selected</p>
              <p className="text-xs text-theme-3 max-w-xs leading-relaxed">
                Choose a message from the list to read it here.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ══ COMPOSE MODAL ══ */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-theme shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-command-blue/10 rounded-lg">
                  <PenSquare size={15} className="text-command-blue" />
                </div>
                <h3 className="font-bold text-theme text-sm">New Message</h3>
              </div>
              <button onClick={() => setShowCompose(false)}
                className="p-1.5 rounded-lg text-theme-3 hover:text-theme hover:bg-surface-2 transition-all">
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSend} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-3 uppercase tracking-wider">Type</label>
                <select
                  value={compose.type}
                  onChange={e => setCompose({ ...compose, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm text-theme outline-none focus:border-command-blue/30 transition-all appearance-none"
                >
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="expiry">Expiry</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-3 uppercase tracking-wider">Subject</label>
                <input
                  required
                  placeholder="Enter subject..."
                  value={compose.title}
                  onChange={e => setCompose({ ...compose, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm text-theme outline-none focus:border-command-blue/30 transition-all placeholder:text-theme-3"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-theme-3 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  placeholder="Write your message..."
                  rows={5}
                  value={compose.content}
                  onChange={e => setCompose({ ...compose, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-2 border border-theme rounded-xl text-sm text-theme outline-none focus:border-command-blue/30 transition-all resize-none placeholder:text-theme-3"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="flex-1 py-2.5 rounded-xl border border-theme text-theme-2 font-semibold text-sm hover:bg-surface-2 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-command-blue hover:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {isSending ? 'Sending…' : 'Send'}
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
