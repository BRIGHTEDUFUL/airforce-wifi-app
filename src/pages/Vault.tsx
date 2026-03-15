import React, { useState, useEffect } from 'react';
import { Plus, Key, Search, Eye, EyeOff, Copy, Check, Trash2, Tag, Server } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';

const Vault: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { token, user } = useAuth();

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
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Password Vault</h1>
          <p className="text-slate-500 dark:text-slate-400">Secure encrypted storage for all service credentials.</p>
        </div>
        {user?.role !== 'Viewer' && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-amber-600/20"
          >
            <Plus size={20} />
            Add Credential
          </button>
        )}
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search by service, username, category or device..." 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.service_name}</h3>
                    <div className="flex items-center gap-2">
                      <Tag size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{item.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.device_name && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/30">
                      <Server size={12} />
                      {item.device_name}
                    </div>
                  )}
                  {user?.role !== 'Viewer' && (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Plus size={16} className="rotate-45" /> {/* Using Plus as a placeholder for Edit if needed, or just use a text button */}
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Username</span>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{item.username}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {showPasswords[item.id] ? item.password : '••••••••••••'}
                    </span>
                    <button 
                      onClick={() => setShowPasswords(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                    >
                      {showPasswords[item.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(item.password);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {item.notes && (
              <div className="md:w-48 pt-4 md:pt-0 md:pl-4 md:border-l border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Notes</span>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">{item.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Credential' : 'Add New Credential'}</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Service Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. AWS Console, Internal DB"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.service_name}
                  onChange={e => setFormData({...formData, service_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Username</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Category</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Assign Device</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
                <textarea 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-amber-500 min-h-[80px]"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shadow-lg shadow-amber-600/20"
                >
                  {editingItem ? 'Update Credential' : 'Add Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;
