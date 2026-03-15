import React, { useState, useEffect } from 'react';
import { Plus, Wifi, MapPin, Eye, EyeOff, Copy, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

const WiFi: React.FC = () => {
  const [networks, setNetworks] = useState<any[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<any>(null);
  const { token, user } = useAuth();

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

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WiFi Credentials</h1>
          <p className="text-slate-500 dark:text-slate-400">Secure storage for network access points.</p>
        </div>
        {user?.role !== 'Viewer' && (
          <button 
            onClick={() => {
              setEditingNetwork(null);
              setFormData({ ssid: '', password: '', location: '', assigned_devices: '', security_type: 'WPA2', notes: '' });
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus size={20} />
            Add Network
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {networks.map((net) => (
          <div key={net.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                    <Wifi size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{net.ssid}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full uppercase">
                      {net.security_type}
                    </span>
                  </div>
                </div>
                {user?.role !== 'Viewer' && (
                  <button 
                    onClick={() => {
                      setEditingNetwork(net);
                      setFormData({ ...net });
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <MapPin size={16} />
                  <span>{net.location}</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Password</span>
                    <span className="font-mono text-lg tracking-wider">
                      {showPasswords[net.id] ? net.password : '••••••••••••'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => togglePassword(net.id)}
                      className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all"
                    >
                      {showPasswords[net.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(net.password, net.id)}
                      className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all"
                    >
                      {copiedId === net.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Assigned Devices</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{net.assigned_devices || 'None specified'}</p>
                </div>
              </div>
            </div>
            {net.notes && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 italic">
                Note: {net.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{editingNetwork ? 'Edit WiFi Network' : 'Add WiFi Network'}</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">SSID (Network Name)</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.ssid}
                  onChange={e => setFormData({...formData, ssid: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Password</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Location</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Security Type</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    value={formData.security_type}
                    onChange={e => setFormData({...formData, security_type: e.target.value})}
                  >
                    <option>WPA2</option>
                    <option>WPA3</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Assigned Devices</label>
                <input 
                  type="text" 
                  placeholder="e.g. Router-01, AP-North"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  value={formData.assigned_devices}
                  onChange={e => setFormData({...formData, assigned_devices: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
                <textarea 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {editingNetwork ? 'Save Changes' : 'Add Network'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WiFi;
