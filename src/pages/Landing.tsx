import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Zap, Wifi, Globe, Server, ChevronRight, Fingerprint, Activity } from 'lucide-react';
import { APP_CREST_URL, APP_FULL_NAME } from '../constants';

interface LandingProps {
  onEnter: () => void;
}

const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500/10 overflow-hidden relative flex flex-col items-center justify-center px-4">
      {/* Background Grid & Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:60px_60px] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />
        
        {/* Animated Scanning Line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)] z-0"
        />

        {/* Floating Icons */}
        <Shield className="absolute top-[10%] left-[15%] w-32 h-32 text-blue-500/5 -rotate-12 blur-sm" />
        <Lock className="absolute bottom-[15%] right-[10%] w-48 h-48 text-blue-500/5 rotate-12 blur-sm" />
      </div>

      <div className="relative z-10 max-w-5xl w-full flex flex-col items-center">
        {/* Top Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 mb-16"
        >
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/10 rounded-[2.5rem] blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-2 border-slate-100 p-1 bg-gradient-to-br from-blue-400 to-blue-900 shadow-2xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center p-4">
                <img 
                  src={APP_CREST_URL} 
                  alt="Ghana Air Force Crest"
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/5 border border-blue-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                HQ Network Operations
              </span>
            </div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">Ghana Air Force Headquarters</h2>
          </div>
        </motion.div>

        {/* Main Title Section */}
        <div className="text-center space-y-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-none">
              WiFi <span className="text-blue-600">Portal</span>
            </h1>
            <p className="text-xl md:text-2xl font-bold text-slate-400 uppercase tracking-[0.2em]">
              Secure Access Management
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 py-6 border-y border-slate-100"
          >
            {[
              { label: 'Network', value: 'GAF-HQ-SECURE' },
              { label: 'Status', value: 'Operational' },
              { label: 'Support', value: 'IT Desk' }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Action Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="w-full max-w-md"
        >
          <button 
            onClick={onEnter}
            className="group relative w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-[0_20px_50px_rgba(37,99,235,0.2)] flex items-center justify-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Fingerprint size={28} className="group-hover:scale-110 transition-transform" />
            <span className="tracking-widest">ENTER PORTAL</span>
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">TLS 1.3</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active Monitoring</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer System Info */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Nodes Operational</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Terminal ID</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AF-DX-2026-03-15</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
