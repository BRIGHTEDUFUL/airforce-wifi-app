import React, { useState } from 'react';
import { Zap, Copy, Check, RefreshCw, ShieldCheck, Layout } from 'lucide-react';
import { generatePassword, generateStructuredPassword } from '../lib/utils';

const Generator: React.FC = () => {
  const [mode, setMode] = useState<'random' | 'structured'>('random');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Random Options
  const [length, setLength] = useState(12);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  // Structured Options
  const [location, setLocation] = useState('BASE');
  const [role, setRole] = useState('ADMIN');

  const handleGenerate = () => {
    if (mode === 'random') {
      setPassword(generatePassword(length, includeSymbols, includeNumbers));
    } else {
      setPassword(generateStructuredPassword(location, role));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Password Generator</h1>
        <p className="text-slate-500 dark:text-slate-400">Generate secure, compliant passwords for system use.</p>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setMode('random')}
            className={cn(
              "flex-1 py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              mode === 'random' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Zap size={18} />
            Random Password
          </button>
          <button 
            onClick={() => setMode('structured')}
            className={cn(
              "flex-1 py-4 font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              mode === 'structured' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Layout size={18} />
            Structured Password
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">
            <div className="w-full text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 block">Generated Password</span>
              <div className="text-3xl font-mono font-bold tracking-wider break-all min-h-[40px]">
                {password || '••••••••••••'}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleGenerate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <RefreshCw size={18} />
                Generate
              </button>
              <button 
                disabled={!password}
                onClick={copyToClipboard}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mode === 'random' ? (
              <>
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-500" />
                    Security Settings
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium">Include Symbols</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={includeSymbols}
                        onChange={e => setIncludeSymbols(e.target.checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium">Include Numbers</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={includeNumbers}
                        onChange={e => setIncludeNumbers(e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold">Password Length: {length}</h4>
                  <input 
                    type="range" 
                    min="8" 
                    max="32" 
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    value={length}
                    onChange={e => setLength(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>8 chars</span>
                    <span>16 chars</span>
                    <span>32 chars</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <h4 className="font-bold">Location Code</h4>
                  <input 
                    type="text" 
                    placeholder="e.g. DC, NY, BASE"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Used as the first segment of the password.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold">Role / Purpose</h4>
                  <input 
                    type="text" 
                    placeholder="e.g. ADMIN, WIFI, DB"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Used as the second segment of the password.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
        <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">Security Best Practices</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc pl-4">
          <li>Use structured passwords for shared infrastructure (WiFi, Routers).</li>
          <li>Use random passwords for individual service accounts.</li>
          <li>Rotate passwords every 90 days or after personnel changes.</li>
          <li>Never share passwords via unencrypted messaging channels.</li>
        </ul>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default Generator;
