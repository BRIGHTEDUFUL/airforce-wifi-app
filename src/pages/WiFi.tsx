import React, { useState, useEffect } from 'react';
import { Plus, Wifi, MapPin, Eye, EyeOff, Copy, Check, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn } from '../lib/utils';

const WiFi: React.FC = () => {
  const [networks, setNetworks] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const { token } = useAuth();
  const { canCreate, canDelete } = usePermissions();

  const [formData, setFormData] = useState({
    ssid: '',
    password: '',
    location: '',
    assigned_devices: '',
    security_type: 'WPA2',
    notes: ''
  });

  const fetchWifi = () => {
    fetch('/api/wifi', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNetworks(data));
  };

  useEffect(() => {
    fetchWifi();
  }, [token]);

  const togglePassword = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingNetwork ? 'PUT' : 'POST';
    const url = editingNetwork ? `/api/wifi/${editingNetwork.id}` : '/api/wifi';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    }).then(() => {
      fetchWifi();
      setIsModalOpen(false);
      setEditingNetwork(null);
      setFormData({ ssid: '', password: '', location: '', assigned_devices: '', security_type: 'WPA2', notes: '' });
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this network?')) return;
    fetch(`/api/wifi/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => fetchWifi());
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-slate-50 dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700 transition-colors">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">WiFi Credentials</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Secure storage for network access points.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => {
              setEditingNetwork(null);
              setFormData({ ssid: '', password: '', location: '', assigned_devices: '', security_type: 'WPA2', notes: '' });
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 font-bold text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add Network
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {networks.map((net) => (
          <div key={net.id} className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-200 dark:border-command-dark-border shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="p-8 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                    <Wifi size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-slate-900 dark:text-white">{net.ssid}</h3>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full uppercase tracking-widest mt-1 inline-block">
                      {net.security_type}
                    </span>
                  </div>
                </div>
                {canCreate && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingNetwork(net);
                        setFormData({ ...net });
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(net.id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <MapPin size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="text-sm">{net.location}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between group/pass">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-1">Network Key</span>
                    <span className="font-mono text-xl tracking-[0.15em] text-slate-700 dark:text-slate-300">
                      {showPasswords[net.id] ? net.password : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => togglePassword(net.id)}
                      className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm"
                    >
                      {showPasswords[net.id] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(net.password, net.id)}
                      className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
                    >
                      {copiedId === net.id ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em]">Assigned Assets</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{net.assigned_devices || 'None specified'}</p>
                </div>
              </div>
            </div>
            {net.notes && (
              <div className="px-8 py-4 bg-slate-50 dark:bg-black/20 border-t border-slate-200 dark:border-command-dark-border text-xs text-slate-500 dark:text-slate-400 italic font-medium">
                <span className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2 not-italic">Note:</span>
                {net.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-200 dark:border-command-dark-border w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-slate-100 dark:border-transparent">
                  <Wifi size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{editingNetwork ? 'Edit WiFi Network' : 'Add WiFi Network'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">SSID (Network Name)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                    value={formData.ssid}
                    onChange={e => setFormData({...formData, ssid: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Password</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-mono text-slate-700 dark:text-white tracking-widest"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Security Type</label>
                    <select 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white appearance-none"
                      value={formData.security_type}
                      onChange={e => setFormData({...formData, security_type: e.target.value})}
                    >
                      <option>WPA2</option>
                      <option>WPA3</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Assigned Devices</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Router-01, AP-North"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                    value={formData.assigned_devices}
                    onChange={e => setFormData({...formData, assigned_devices: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Notes</label>
                  <textarea 
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-emerald-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white min-h-[100px] resize-none"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/20"
                  >
                    {editingNetwork ? 'Save Changes' : 'Add Network'}
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

export default WiFi;
