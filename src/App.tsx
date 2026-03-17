import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
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

  if (!isAuthenticated) {
    if (view === 'landing') return <Landing onEnter={() => setView('login')} />;
    return <Login onBack={() => setView('landing')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <Dashboard setActiveTab={setActiveTab} />;
      case 'devices':    return <Devices />;
      case 'wifi':       return <WiFi />;
      case 'vault':      return <Vault />;
      case 'notes':      return <Notes />;
      case 'messages':   return <Messages />;
      case 'audit':      return <Audit />;
      case 'analytics':  return <Analytics />;
      case 'generator':  return <Generator />;
      case 'users':      return <Users />;
      default:           return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-theme text-theme transition-colors duration-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 min-h-0 flex flex-col pt-14 md:pt-0 bg-theme overflow-hidden">
        <div className={activeTab === 'messages' ? 'flex-1 min-h-0 overflow-hidden' : 'flex-1 overflow-y-auto'}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
