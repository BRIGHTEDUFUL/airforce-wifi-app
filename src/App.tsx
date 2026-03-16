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
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} darkMode={darkMode} setDarkMode={setDarkMode} />;
      case 'devices': return <Devices darkMode={darkMode} />;
      case 'wifi': return <WiFi darkMode={darkMode} />;
      case 'vault': return <Vault darkMode={darkMode} />;
      case 'notes': return <Notes darkMode={darkMode} />;
      case 'messages': return <Messages darkMode={darkMode} />;
      case 'audit': return <Audit darkMode={darkMode} />;
      case 'analytics': return <Analytics darkMode={darkMode} />;
      case 'generator': return <Generator darkMode={darkMode} />;
      case 'users': return <Users darkMode={darkMode} />;
      default: return <Dashboard darkMode={darkMode} setDarkMode={setDarkMode} />;
    }
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 transition-colors">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />
      <main className="flex-1 overflow-y-auto">
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
