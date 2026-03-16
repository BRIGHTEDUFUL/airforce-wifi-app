import React, { useState, useEffect } from 'react';
import { Zap, Copy, Check, RefreshCw, ShieldCheck, Layout, Save, Server } from 'lucide-react';
import { generatePassword, generateStructuredPassword } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const Generator: React.FC = () => {
  const [mode, setMode] = useState<'random' | 'structured'>('random');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Random Options
  const [length, setLength] = useState(12);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  // Structured Options
  const [location, setLocation] = useState('BASE');
  const [role, setRole] = useState('ADMIN');

  // Save Options
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [serviceName, setServiceName] = useState('');
  const [username, setUsername] = useState('admin');
  const { token } = useAuth();

  useEffect(() => {
    fetch('/api/devices', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setDevices(data));
  }, [token]);

  const handleGenerate = () => {
    if (mode === 'random') {
      setPassword(generatePassword(length, includeSymbols, includeNumbers));
    } else {
      setPassword(generateStructuredPassword(location, role));
    }
    setSaveSuccess(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          service_name: serviceName || (selectedDevice ? `Device: ${devices.find(d => d.id === parseInt(selectedDevice))?.device_name}` : 'Generated Password'),
          username: username,
          password: password,
          category: mode === 'random' ? 'Application' : 'Network',
          device_id: selectedDevice ? parseInt(selectedDevice) : null,
          notes: `Generated via system tool on ${new Date().toLocaleString()}`
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-white dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Password Generator</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Generate secure, compliant passwords and assign them to infrastructure.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-50 dark:border-command-dark-border">
              <button 
                onClick={() => setMode('random')}
                className={cn(
                  "flex-1 py-5 font-bold text-sm flex items-center justify-center gap-3 transition-all",
                  mode === 'random' ? "bg-command-blue/5 dark:bg-command-blue/10 text-command-blue border-b-2 border-command-blue" : "text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-white/5"
                )}
              >
                <Zap size={18} />
                Random Password
              </button>
              <button 
                onClick={() => setMode('structured')}
                className={cn(
                  "flex-1 py-5 font-bold text-sm flex items-center justify-center gap-3 transition-all",
                  mode === 'structured' ? "bg-command-blue/5 dark:bg-command-blue/10 text-command-blue border-b-2 border-command-blue" : "text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-white/5"
                )}
              >
                <Layout size={18} />
                Structured Password
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-command-dark-border flex flex-col items-center gap-6">
                <div className="w-full text-center">
                  <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-3 block">Generated Password</span>
                  <div className="text-4xl font-mono font-bold tracking-widest break-all min-h-[48px] text-slate-900 dark:text-white">
                    {password || '••••••••••••'}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={handleGenerate}
                    className="bg-command-blue hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-command-blue/20"
                  >
                    <RefreshCw size={18} />
                    Generate
                  </button>
                  <button 
                    disabled={!password}
                    onClick={copyToClipboard}
                    className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-command-dark-border hover:bg-white dark:hover:bg-white/5 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-slate-700 dark:text-slate-300"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {mode === 'random' ? (
                  <>
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck size={18} className="text-command-blue" />
                        Security Settings
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-command-dark-border bg-white dark:bg-slate-900/30">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Include Symbols</span>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-command-blue focus:ring-command-blue transition-all"
                            checked={includeSymbols}
                            onChange={e => setIncludeSymbols(e.target.checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-command-dark-border bg-white dark:bg-slate-900/30">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Include Numbers</span>
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-command-blue focus:ring-command-blue transition-all"
                            checked={includeNumbers}
                            onChange={e => setIncludeNumbers(e.target.checked)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="font-bold text-slate-900 dark:text-white">Password Length: <span className="text-command-blue">{length}</span></h4>
                      <div className="px-2">
                        <input 
                          type="range" 
                          min="8" 
                          max="32" 
                          className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-command-blue"
                          value={length}
                          onChange={e => setLength(parseInt(e.target.value))}
                        />
                        <div className="flex justify-between mt-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <span>8 chars</span>
                          <span>16 chars</span>
                          <span>32 chars</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Location Code</h4>
                      <input 
                        type="text" 
                        placeholder="e.g. DC, NY, BASE"
                        className="w-full p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-transparent outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all uppercase font-bold text-sm text-slate-700 dark:text-slate-200"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Used as the first segment of the password.</p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white">Role / Purpose</h4>
                      <input 
                        type="text" 
                        placeholder="e.g. ADMIN, WIFI, DB"
                        className="w-full p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-transparent outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all uppercase font-bold text-sm text-slate-700 dark:text-slate-200"
                        value={role}
                        onChange={e => setRole(e.target.value)}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Used as the second segment of the password.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-command-dark-card p-8 rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-8">
              <div className="p-2 bg-command-blue/10 dark:bg-command-blue/20 rounded-xl">
                <Save size={18} className="text-command-blue" />
              </div>
              Save & Assign
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">Assign to Device</label>
                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-command-blue transition-colors" size={16} />
                  <select 
                    className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900/50 rounded-2xl border border-transparent outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-bold text-slate-700 dark:text-slate-200 appearance-none"
                    value={selectedDevice}
                    onChange={e => setSelectedDevice(e.target.value)}
                  >
                    <option value="" className="dark:bg-slate-900">No Device (Vault Only)</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id} className="dark:bg-slate-900">{d.device_name} ({d.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">Service Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. AWS Root, Admin Panel"
                  className="w-full px-5 py-3.5 bg-white dark:bg-slate-900/50 rounded-2xl border border-transparent outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-1">Username</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3.5 bg-white dark:bg-slate-900/50 rounded-2xl border border-transparent outline-none focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 transition-all text-sm font-bold text-slate-700 dark:text-slate-200"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={!password || isSaving}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 mt-6 shadow-lg shadow-slate-900/10"
              >
                {isSaving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : saveSuccess ? (
                  <Check size={18} className="text-emerald-400" />
                ) : (
                  <Save size={18} />
                )}
                {saveSuccess ? 'Saved to Vault!' : 'Save to Vault'}
              </button>
            </form>
          </div>

          <div className="bg-command-blue/5 dark:bg-command-blue/10 p-8 rounded-[2.5rem] border border-command-blue/10 dark:border-command-blue/20">
            <h4 className="font-bold text-command-blue mb-4 flex items-center gap-2">
              <ShieldCheck size={18} />
              Security Best Practices
            </h4>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-3 font-medium">
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-command-blue mt-1.5 shrink-0" />
                <span>Use structured passwords for shared infrastructure.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-command-blue mt-1.5 shrink-0" />
                <span>Use random passwords for individual service accounts.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-command-blue mt-1.5 shrink-0" />
                <span>Rotate passwords every 90 days or after personnel changes.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-command-blue mt-1.5 shrink-0" />
                <span>Never share passwords via unencrypted channels.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default Generator;
