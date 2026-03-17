import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { APP_CREST_URL, APP_FULL_NAME } from '../constants';

interface LoginProps {
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) { login(data.token, data.user); }
      else { setError(data.message || 'Login failed'); }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme flex items-center justify-center p-6 animate-in fade-in duration-700 transition-colors">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-6">
          {onBack && (
            <button onClick={onBack}
              className="absolute top-10 left-10 flex items-center gap-3 text-theme-2 hover:text-command-blue transition-all group">
              <div className="p-2 bg-surface rounded-xl shadow-sm group-hover:shadow-md transition-all border border-theme">
                <ArrowLeft size={20} />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">Back to Home</span>
            </button>
          )}
          <div className="relative inline-block group">
            <div className="absolute -inset-4 bg-command-blue/10 rounded-[2rem] blur-2xl group-hover:bg-command-blue/20 transition-all duration-500" />
            <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-400 to-blue-900 shadow-2xl flex items-center justify-center border border-theme p-4 overflow-hidden">
              <img src={APP_CREST_URL} alt="Crest"
                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                referrerPolicy="no-referrer" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-theme uppercase">
              Portal <span className="text-command-blue">Login</span>
            </h1>
            <p className="text-xs font-black text-theme-3 uppercase tracking-[0.3em]">{APP_FULL_NAME}</p>
          </div>
        </div>

        <div className="bg-surface p-10 rounded-[2.5rem] border border-theme shadow-2xl shadow-command-blue/5">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-4 text-rose-600 text-sm font-bold animate-in slide-in-from-top-2">
                <div className="p-2 bg-surface rounded-lg shadow-sm">
                  <AlertCircle size={18} />
                </div>
                {error}
              </div>
            )}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-theme-3 tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-command-blue transition-colors" size={20} />
                <input required type="email" placeholder="admin@airforce.mil"
                  className="w-full pl-12 pr-4 py-4 input-theme rounded-2xl text-sm font-bold"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-theme-3 tracking-[0.2em] ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-command-blue transition-colors" size={20} />
                <input required type="password" placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 input-theme rounded-2xl text-sm font-bold"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="group relative w-full py-5 bg-command-blue hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-command-blue/20 disabled:opacity-50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-border-theme" />
            <p className="text-[10px] font-black text-theme-3 uppercase tracking-[0.3em]">Secure Terminal</p>
            <div className="h-[1px] w-12 bg-border-theme" />
          </div>
          <p className="text-[10px] text-theme-3 font-bold uppercase tracking-widest leading-relaxed">
            Classified System • Authorized Personnel Only<br/>
            All activities are monitored and logged
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
