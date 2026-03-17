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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700 transition-colors">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">WiFi Credentials</h1>
          <p className="text-theme-2 font-medium text-sm">Secure storage for network access points.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {networks.map((net) => (
          <div key={net.id} className="bg-surface rounded-[2rem] md:rounded-[2.5rem] border border-theme shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-emerald-200 transition-all duration-300 group">
            <div className="p-5 md:p-8 flex-1 space-y-4 md:space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Wifi size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl text-theme">{net.ssid}</h3>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-500/20 text-emerald-700 rounded-full uppercase tracking-widest mt-1 inline-block">
                      {net.security_type}
                    </span>
                  </div>
                </div>
                {canCreate && (
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingNetwork(net);
                        setFormData({ ...net });
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-500/10 rounded-xl text-theme-3 hover:text-emerald-600 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(net.id)}
                        className="p-2 hover:bg-rose-500/10 rounded-xl text-theme-3 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-theme-2 font-medium">
                  <div className="p-2 bg-surface-2 rounded-lg">
                    <MapPin size={16} className="text-theme-3" />
                  </div>
                  <span className="text-sm">{net.location}</span>
                </div>

                <div className="bg-surface-2 p-4 md:p-6 rounded-[1.5rem] border border-theme flex items-center justify-between gap-2 group/pass">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black text-theme-3 tracking-[0.2em] mb-1">Network Key</span>
                    <span className="font-mono text-base md:text-xl tracking-[0.1em] md:tracking-[0.15em] text-theme break-all">
                      {showPasswords[net.id] ? net.password : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => togglePassword(net.id)}
                      className="p-3 hover:bg-surface-2 rounded-xl text-theme-3 hover:text-theme-2 transition-all shadow-sm"
                    >
                      {showPasswords[net.id] ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(net.password, net.id)}
                      className="p-3 hover:bg-surface-2 rounded-xl text-theme-3 hover:text-emerald-600 transition-all shadow-sm"
                    >
                      {copiedId === net.id ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <p className="text-[10px] font-black text-theme-3 mb-2 uppercase tracking-[0.2em]">Assigned Assets</p>
                  <p className="text-sm text-theme font-medium">{net.assigned_devices || 'None specified'}</p>
                </div>
              </div>
            </div>
            {net.notes && (
              <div className="px-5 md:px-8 py-4 bg-surface-2 border-t border-theme text-xs text-theme-2 italic font-medium">
                <span className="font-bold text-theme-3 uppercase tracking-widest mr-2 not-italic">Note:</span>
                {net.notes}
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
                <div className="p-3 bg-emerald-500/10 text-emerald-600  rounded-2xl border border-theme">
                  <Wifi size={24} />
                </div>
                <h2 className="text-2xl font-bold text-theme tracking-tight">{editingNetwork ? 'Edit WiFi Network' : 'Add WiFi Network'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">SSID (Network Name)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-theme"
                    value={formData.ssid}
                    onChange={e => setFormData({...formData, ssid: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Password</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-mono text-theme tracking-widest"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-theme"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Security Type</label>
                    <select 
                      className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-theme appearance-none"
                      value={formData.security_type}
                      onChange={e => setFormData({...formData, security_type: e.target.value})}
                    >
                      <option>WPA2</option>
                      <option>WPA3</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Assigned Devices</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Router-01, AP-North"
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-theme"
                    value={formData.assigned_devices}
                    onChange={e => setFormData({...formData, assigned_devices: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Notes</label>
                  <textarea 
                    className="w-full p-4 bg-surface-2 rounded-2xl border border-transparent  focus:border-emerald-200  focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium text-theme min-h-[100px] resize-none"
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

