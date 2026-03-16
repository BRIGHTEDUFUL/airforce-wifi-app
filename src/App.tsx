import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import WiFi from './pages/WiFi';
import Vault from './pages/Vault';
import Notes from './pages/Notes';
import Messages from './pages/Messages';
import Audit from './pages/Audit';
import Analytics from './pages/Analytics';
import Generator from './pages/Generator';
import Users from './pages/Users';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [view, setView] = useState<'landing' | 'login'>('landing');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('afkm_dark') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('afkm_dark', darkMode.toString());
  }, [darkMode]);

  if (!isAuthenticated) {
    if (view === 'landing') {
      return <Landing onEnter={() => setView('login')} />;
    }
    return <Login onBack={() => setView('landing')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} />;
      case 'devices':    return <Devices />;
      case 'wifi':       return <WiFi />;
      case 'vault':      return <Vault />;
      case 'notes':      return <Notes />;
      case 'messages':   return <Messages />;
      case 'audit':      return <Audit />;
      case 'analytics':  return <Analytics darkMode={darkMode} />;
      case 'generator':  return <Generator />;
      case 'users':      return <Users />;
      default:           return <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-command-dark-bg text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
