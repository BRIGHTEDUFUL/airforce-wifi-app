import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Zap, Server, ChevronRight, Globe, Cpu, Database } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
}

const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Shield size={24} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            AIR FORCE KEY MANAGER
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#standalone" className="hover:text-white transition-colors">Standalone</a>
          <button 
            onClick={onEnter}
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all backdrop-blur-md"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest">
            <Zap size={12} />
            Internal Credential Management
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] max-w-4xl mx-auto">
            Secure the <span className="text-blue-500">Network</span>.<br /> 
            Command the <span className="text-slate-500">Keys</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            A standalone, air-gapped credential management system designed for high-security internal environments. Zero external dependencies. Total control.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={onEnter}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-blue-600/40 flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Enter System</span>
              <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
            <button className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-2xl font-bold text-lg transition-all">
              View Documentation
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-24 relative"
        >
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full scale-75 opacity-50" />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden aspect-video max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <div className="ml-4 h-6 w-64 bg-slate-800 rounded-md" />
            </div>
            <div className="grid grid-cols-12 gap-4 h-full">
              <div className="col-span-3 space-y-3">
                <div className="h-8 bg-blue-600/20 rounded-lg" />
                <div className="h-8 bg-slate-800 rounded-lg" />
                <div className="h-8 bg-slate-800 rounded-lg" />
                <div className="h-8 bg-slate-800 rounded-lg" />
              </div>
              <div className="col-span-9 grid grid-cols-3 gap-4 content-start">
                <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-800" />
                <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-800" />
                <div className="h-32 bg-slate-800/50 rounded-2xl border border-slate-800" />
                <div className="col-span-3 h-64 bg-slate-800/30 rounded-2xl border border-slate-800" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">Advanced Security Infrastructure</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Built from the ground up to handle sensitive network credentials with zero external exposure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Lock, title: "Encrypted Vault", desc: "Military-grade AES-256 encryption for all stored passwords and service credentials." },
            { icon: Globe, title: "Standalone Operation", desc: "Operates entirely within your local network. No external APIs, no cloud sync, no leaks." },
            { icon: Cpu, title: "Device Inventory", desc: "Comprehensive management of routers, switches, and access points across multiple locations." },
            { icon: Database, title: "SQLite Backend", desc: "Lightweight, file-based database that stays where you put it. Easy backups, zero bloat." },
            { icon: Zap, title: "Password Generator", desc: "Generate structured or random passwords that meet strict organizational policies." },
            { icon: Server, title: "Audit Logging", desc: "Immutable history of every action taken within the system for total accountability." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-blue-500/50 transition-all group"
            >
              <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-slate-900 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-sm">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <Shield size={18} className="text-blue-600" />
          AFKM System v1.0
        </div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Security Audit</a>
        </div>
        <p>© 2026 Air Force Key Manager. Internal Use Only.</p>
      </footer>
    </div>
  );
};

export default Landing;
