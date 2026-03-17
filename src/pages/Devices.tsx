import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Server, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn, formatDate } from '../lib/utils';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const { token } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();

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
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700 transition-colors">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">Device Management</h1>
          <p className="text-theme-2 font-medium text-sm">Inventory of all network hardware and workstations.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => {
              setEditingDevice(null);
              setFormData({ device_name: '', device_type: 'Router', location: '', ip_address: '', installation: '', notes: '' });
              setIsModalOpen(true);
            }}
            className="bg-command-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={20} />
            Add Device
          </button>
        )}
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-command-blue transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search by name, location or IP..." 
          className="w-full pl-12 pr-4 py-4 bg-surface border border-theme rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-theme"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDevices.map((device) => (
          <div key={device.id} className="bg-surface rounded-[2rem] border border-theme shadow-sm overflow-hidden group hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Server size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-theme">{device.device_name}</h3>
                    <span className="text-[10px] font-black px-2.5 py-1 bg-surface-2 rounded-full text-theme-2 uppercase tracking-widest mt-1 inline-block">
                      {device.device_type}
                    </span>
                  </div>
                </div>
                {canCreate && (
                  <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => {
                        setEditingDevice(device);
                        setFormData({ ...device });
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-blue-500/10 rounded-xl text-theme-3 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(device.id)}
                        className="p-2 hover:bg-rose-500/10 rounded-xl text-theme-3 hover:text-rose-600 transition-colors"
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
                  <span className="text-sm">{device.location}</span>
                </div>
                <div className="flex items-center gap-3 text-theme-2 font-medium">
                  <div className="p-2 bg-surface-2 rounded-lg">
                    <Info size={16} className="text-theme-3" />
                  </div>
                  <span className="text-sm">IP: {device.ip_address || 'N/A'}</span>
                </div>
                
                <div className="pt-6 border-t border-slate-50 ">
                  <p className="text-[10px] font-black text-theme-3 mb-2 uppercase tracking-[0.2em]">Installation Details</p>
                  <p className="text-sm text-slate-700  font-medium leading-relaxed">{device.installation}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-4 bg-surface-2 border-t border-theme text-[10px] font-bold text-theme-3 flex justify-between uppercase tracking-widest">
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
          <div className="bg-surface rounded-[2.5rem] border border-theme w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 md:p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-bold text-theme tracking-tight">{editingDevice ? 'Edit Device' : 'Add New Device'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Device Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium"
                      value={formData.device_name}
                      onChange={e => setFormData({...formData, device_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Type</label>
                    <select 
                      className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium appearance-none"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Location</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">IP Address</label>
                    <input 
                      type="text" 
                      className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium"
                      value={formData.ip_address}
                      onChange={e => setFormData({...formData, ip_address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Installation Details</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium"
                    value={formData.installation}
                    onChange={e => setFormData({...formData, installation: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Notes</label>
                  <textarea 
                    className="w-full p-4 input-theme rounded-2xl focus:ring-4 focus:ring-blue-500/5 font-medium min-h-[120px] resize-none"
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

