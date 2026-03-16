import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Mail, User, ShieldCheck, ShieldAlert, ShieldQuestion, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn, formatDate } from '../lib/utils';

const ROLE_CONFIG = {
  Administrator: { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', label: 'Admin' },
  Operator:      { icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20', label: 'Operator' },
  Viewer:        { icon: ShieldQuestion, color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', label: 'Viewer' },
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const { token, user: currentUser } = useAuth();
  const { canManageUsers } = usePermissions();

  const [formData, setFormData] = useState({ name: '', email: '', role: 'Viewer', password: '' });

  const fetchUsers = () => {
    fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(formData)
    }).then(res => {
      if (res.ok) { fetchUsers(); setIsModalOpen(false); setFormData({ name: '', email: '', role: 'Viewer', password: '' }); }
      else alert('Failed to create user. Email might already exist.');
    });
  };

  const handleDelete = (id: number) => {
    if (id === currentUser?.id) { alert('You cannot delete your own account.'); return; }
    if (window.confirm('Delete this user?')) {
      fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(() => fetchUsers());
    }
  };

  const handleRoleUpdate = (id: number) => {
    fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ role: editingRole })
    }).then(res => {
      if (res.ok) { fetchUsers(); setEditingRoleId(null); }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50 dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Control system access and assign roles.</p>
        </div>
        {canManageUsers && (
          <button onClick={() => setIsModalOpen(true)}
            className="bg-command-blue hover:bg-command-blue/90 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-command-blue/20 font-bold text-sm w-full sm:w-auto justify-center">
            <Plus size={20} /> Create User
          </button>
        )}
      </header>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <div key={role} className={cn('flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold', cfg.bg, cfg.border, cfg.color)}>
            <cfg.icon size={16} />
            <span>{role}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
              {role === 'Administrator' ? '— Full access' : role === 'Operator' ? '— Read + Write' : '— Read only'}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 dark:text-slate-500">
                <th className="px-8 py-6">User</th>
                <th className="px-8 py-6">Email</th>
                <th className="px-8 py-6">Role</th>
                <th className="px-8 py-6">Created At</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-command-dark-border">
              {users.map((u) => {
                const cfg = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.Viewer;
                const isEditingThis = editingRoleId === u.id;
                return (
                  <tr key={u.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform', cfg.bg)}>
                          <User size={20} className={cfg.color} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-white text-base">{u.name}</span>
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] font-black text-command-blue uppercase tracking-widest mt-0.5">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400 dark:text-slate-500" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isEditingThis ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole}
                            onChange={e => setEditingRole(e.target.value)}
                            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                          >
                            <option>Administrator</option>
                            <option>Operator</option>
                            <option>Viewer</option>
                          </select>
                          <button onClick={() => handleRoleUpdate(u.id)} className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingRoleId(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase tracking-widest', cfg.bg, cfg.border, cfg.color)}>
                            <cfg.icon size={13} />
                            {cfg.label}
                          </div>
                          {canManageUsers && u.id !== currentUser?.id && (
                            <button
                              onClick={() => { setEditingRoleId(u.id); setEditingRole(u.role); }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                              title="Change role"
                            >
                              <Edit2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-slate-400 dark:text-slate-500 font-medium text-xs">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-8 py-6 text-right">
                      {canManageUsers && (
                        <button
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleDelete(u.id)}
                          className="p-3 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-command-blue/5 dark:bg-command-blue/10 text-command-blue rounded-2xl">
                  <Users size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create New User</h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Full Name</label>
                  <input required type="text" placeholder="Enter full name"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Email Address</label>
                  <input required type="email" placeholder="user@airforce.mil"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Role</label>
                  <select className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option>Administrator</option>
                    <option>Operator</option>
                    <option>Viewer</option>
                  </select>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1 font-medium">
                    {formData.role === 'Administrator' ? 'Full access — can manage users, delete records, view audit logs.' :
                     formData.role === 'Operator' ? 'Can add and edit records but cannot delete or manage users.' :
                     'Read-only access. Cannot see passwords or make changes.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Password</label>
                  <input required type="password" placeholder="••••••••"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-command-dark-border text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-command-blue hover:bg-command-blue/90 text-white font-bold transition-all shadow-lg shadow-command-blue/20">
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
