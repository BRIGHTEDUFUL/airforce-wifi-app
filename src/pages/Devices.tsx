import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Server, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    device_name: '',
    device_type: 'Router',
    location: '',
    ip_address: '',
    installation: '',
    notes: ''
  });

  const fetchDevices = () => {
    fetch('/api/devices', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDevices(data));
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDevice ? 'PUT' : 'POST';
    const url = editingDevice ? `/api/devices/${editingDevice.id}` : '/api/devices';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    }).then(() => {
      fetchDevices();
      setIsModalOpen(false);
      setEditingDevice(null);
      setFormData({ device_name: '', device_type: 'Router', location: '', ip_address: '', installation: '', notes: '' });
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(() => fetchDevices());
    }
  };

  const filteredDevices = devices.filter(d => 
    d.device_name.toLowerCase().includes(search.toLowerCase()) ||
    d.location.toLowerCase().includes(search.toLowerCase()) ||
    d.ip_address?.includes(search)
  );

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700 transition-colors">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Device Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Inventory of all network hardware and workstations.</p>
        </div>
        {user?.role !== 'Viewer' && (
          <button 
            onClick={() => {
              setEditingDevice(null);
              setFormData({ device_name: '', device_type: 'Router', location: '', ip_address: '', installation: '', notes: '' });
              setIsModalOpen(true);
            }}
            className="bg-command-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm"
          >
            <Plus size={20} />
            Add Device
          </button>
        )}
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-command-blue transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, location or IP..." 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-command-dark-card border border-slate-200 dark:border-command-dark-border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDevices.map((device) => (
          <div key={device.id} className="bg-white dark:bg-command-dark-card rounded-[2rem] border border-slate-100 dark:border-command-dark-border shadow-sm overflow-hidden group hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500/50 transition-all duration-300">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                    <Server size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{device.device_name}</h3>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 inline-block">
                      {device.device_type}
                    </span>
                  </div>
                </div>
                {user?.role !== 'Viewer' && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingDevice(device);
                        setFormData({ ...device });
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    {user?.role === 'Administrator' && (
                      <button 
                        onClick={() => handleDelete(device.id)}
                        className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
                  <span className="text-sm">{device.location}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                    <Info size={16} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="text-sm">IP: {device.ip_address || 'N/A'}</span>
                </div>
                
                <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-[0.2em]">Installation Details</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{device.installation}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-white dark:bg-black/20 border-t border-slate-100 dark:border-command-dark-border text-[10px] font-bold text-slate-400 dark:text-slate-500 flex justify-between uppercase tracking-widest">
              <span>Registered: {formatDate(device.created_at)}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-slate-100 dark:border-transparent">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Device Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                      value={formData.device_name}
                      onChange={e => setFormData({...formData, device_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Type</label>
                    <select 
                      className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white appearance-none"
                      value={formData.device_type}
                      onChange={e => setFormData({...formData, device_type: e.target.value})}
                    >
                      <option>Router</option>
                      <option>Switch</option>
                      <option>Access Point</option>
                      <option>Workstation</option>
                      <option>Server</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">IP Address</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                      value={formData.ip_address}
                      onChange={e => setFormData({...formData, ip_address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Installation Details</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white"
                    value={formData.installation}
                    onChange={e => setFormData({...formData, installation: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Notes</label>
                  <textarea 
                    className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-transparent dark:border-slate-800 focus:border-blue-200 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium text-slate-700 dark:text-white min-h-[120px] resize-none"
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
                    className="flex-1 px-6 py-4 rounded-2xl bg-command-blue hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    {editingDevice ? 'Save Changes' : 'Add Device'}
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

export default Devices;
