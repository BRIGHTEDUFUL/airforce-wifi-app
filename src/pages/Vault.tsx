import React, { useState, useEffect } from 'react';
import { Plus, Key, Search, Eye, EyeOff, Copy, Check, Trash2, Tag, Server, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn, formatDate } from '../lib/utils';

const Vault: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { token } = useAuth();
  const { canCreate, canDelete, canViewPasswords } = usePermissions();

  const [formData, setFormData] = useState({
    service_name: '',
    username: '',
    password: '',
    category: 'Network',
    notes: '',
    device_id: ''
  });

  const fetchVault = () => {
    fetch('/api/vault', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to fetch vault:', err));
  };

  const fetchDevices = () => {
    fetch('/api/devices', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDevices(data))
      .catch(err => console.error('Failed to fetch devices:', err));
  };

  useEffect(() => {
    fetchVault();
    fetchDevices();
  }, [token]);

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        service_name: item.service_name,
        username: item.username,
        password: item.password,
        category: item.category,
        notes: item.notes || '',
        device_id: item.device_id?.toString() || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ service_name: '', username: '', password: '', category: 'Network', notes: '', device_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/vault/${editingItem.id}` : '/api/vault';
    const method = editingItem ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        device_id: formData.device_id ? parseInt(formData.device_id) : null
      })
    }).then(() => {
      fetchVault();
      setIsModalOpen(false);
      setFormData({ service_name: '', username: '', password: '', category: 'Network', notes: '', device_id: '' });
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this credential? This action cannot be undone.')) return;
    
    fetch(`/api/vault/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => fetchVault());
  };

  const filteredItems = items.filter(item => 
    item.service_name.toLowerCase().includes(search.toLowerCase()) ||
    item.username.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.device_name && item.device_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700 transition-colors">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">Password Vault</h1>
          <p className="text-theme-2 font-medium text-sm">Secure encrypted storage for all service credentials.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20 font-bold text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add Credential
          </button>
        )}
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-amber-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by service, username, category or device..." 
          className="w-full pl-12 pr-4 py-4 bg-surface border border-theme rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm "
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!canViewPasswords && (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-bold">
          <Key size={16} />
          Passwords are hidden for your role. Contact an Administrator or Operator to view credentials.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-surface rounded-[2rem] md:rounded-[2.5rem] border border-theme shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-amber-200 transition-all duration-300 group">
            <div className="p-5 md:p-8 flex-1 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-amber-500/10 text-amber-600  rounded-2xl group-hover:scale-110 transition-transform border border-theme">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-theme">{item.service_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag size={12} className="text-theme-3" />
                      <span className="text-[10px] font-black text-theme-3 uppercase tracking-widest">{item.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.device_name && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50  text-blue-600  rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 ">
                      <Server size={12} />
                      {item.device_name}
                    </div>
                  )}
                  {canCreate && (
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 hover:bg-amber-50  rounded-xl text-slate-400 hover:text-amber-600  transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-rose-50  rounded-xl text-slate-400 hover:text-rose-600  transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-theme-3 tracking-[0.2em]">Username</span>
                  <p className="font-bold text-theme">{item.username}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-theme-3 tracking-[0.2em]">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg text-theme tracking-wider">
                      {showPasswords[item.id] ? item.password : '••••••••••••'}
                    </span>
                    <button 
                      onClick={() => setShowPasswords(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="p-2 hover:bg-surface-2 rounded-lg text-slate-400 hover:text-slate-600  transition-all"
                    >
                      {showPasswords[item.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.password);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-2 hover:bg-surface-2 rounded-lg text-slate-400 hover:text-amber-600  transition-all"
                    >
                      {copiedId === item.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {item.notes && (
              <div className="p-5 md:p-6 bg-surface-2 border-t border-theme">
                <span className="text-[10px] uppercase font-black text-theme-3 tracking-[0.2em] mb-2 block">Notes</span>
                <p className="text-xs text-theme-2 font-medium leading-relaxed line-clamp-3">{item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-surface rounded-[2.5rem] border border-theme w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 md:p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-600  rounded-2xl border border-theme">
                  <Key size={24} />
                </div>
                <h2 className="text-2xl font-bold text-theme tracking-tight">{editingItem ? 'Edit Credential' : 'Add New Credential'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Service Name</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. AWS Console, Internal DB"
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-slate-200  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-theme"
                    value={formData.service_name}
                    onChange={e => setFormData({...formData, service_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Username</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-slate-200  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-theme"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Password</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-mono text-theme tracking-widest"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-slate-200  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-theme appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option>Network</option>
                      <option>Database</option>
                      <option>Cloud</option>
                      <option>Application</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Assign Device</label>
                    <select 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-slate-200  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-theme appearance-none"
                      value={formData.device_id}
                      onChange={e => setFormData({...formData, device_id: e.target.value})}
                    >
                      <option value="">None</option>
                      {devices.map(d => (
                        <option key={d.id} value={d.id}>{d.device_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Notes</label>
                  <textarea 
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-slate-200  focus:border-amber-200  focus:ring-4 focus:ring-amber-500/5 outline-none transition-all font-medium text-theme min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-theme text-theme-2 font-bold hover:bg-surface-2 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-lg shadow-amber-600/20"
                  >
                    {editingItem ? 'Update Credential' : 'Add Credential'}
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

export default Vault;

