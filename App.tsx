
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import PeerList from './components/PeerList';
import ChatRoom from './components/ChatRoom';
import AdminPanel from './components/AdminPanel';
import DeploymentGuide from './components/DeploymentGuide';
import UserProfile from './components/UserProfile';
import PeerDetails from './components/PeerDetails';
import { mockBackend } from './services/mockBackend';
import { User, DeviceInfo } from './types';
import { Network, LogOut, FileText, Settings, Lock, Users, Activity, MessageSquare, ShieldCheck, UserIcon } from './components/Icons';
import { useLanguage } from './contexts/LanguageContext';

enum View {
  OVERVIEW = 'overview',
  NETWORK = 'network',
  CHAT = 'chat',
  ADMIN = 'admin',
  GUIDE = 'guide',
  PROFILE = 'profile',
  PEER_DETAILS = 'peer_details'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<View>(View.OVERVIEW);
  const [darkMode, setDarkMode] = useState(true);
  
  // Navigation State
  const [selectedPeer, setSelectedPeer] = useState<User | null>(null);

  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Language Context
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    // Initial theme setup
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('missingFields'));
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      let u: User;
      if (isRegistering) {
        u = await mockBackend.register(username, password);
      } else {
        u = await mockBackend.login(username, password);
      }
      setUser(u);
      
      // Collect device info for the database logs
      const info: DeviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown',
      };
      
      // Send info to backend to be recorded in `login_logs` table
      await mockBackend.collectDeviceInfo(u.id, info);

    } catch (err: any) {
      console.error(err);
      setError(t('authFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setError(null);
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setUsername('');
    setPassword('');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  // Callback to update local user state when profile changes
  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handlePeerClick = async (peerId: string) => {
    setLoading(true);
    try {
        const peer = await mockBackend.getUserById(peerId);
        if (peer) {
            setSelectedPeer(peer);
            setCurrentView(View.PEER_DETAILS);
        }
    } catch (e) {
        console.error("Failed to load peer details", e);
    } finally {
        setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg transition-colors duration-300 relative">
         <div className="absolute top-4 right-4 flex space-x-2">
           <button 
            onClick={toggleLanguage}
            className="px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {language === 'en' ? '中文' : 'English'}
          </button>
         </div>

        <div className="w-full max-w-md p-8 bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex justify-center mb-6 text-brand-600 dark:text-brand-500">
            <Network size={48} />
          </div>
          <h2 className="text-3xl font-bold text-center mb-2 dark:text-white">{t('appTitle')}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
            {isRegistering ? t('registerTitle') : t('loginTitle')}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('username')}</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password')}</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-brand-500/30 transition-all flex justify-center items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <span className="flex items-center">
                  {isRegistering ? <Users className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />} 
                  {isRegistering ? t('registerBtn') : t('loginBtn')}
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button 
              onClick={toggleAuthMode}
              className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-colors"
            >
              {isRegistering ? t('haveAccount') : t('noAccount')}
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
            {isRegistering ? t('agreementRegister') : t('agreementLogin')}
          </div>
        </div>
      </div>
    );
  }

  const canManageUsers = user.permissions.includes('manage_users');

  const getPageTitle = () => {
    switch(currentView) {
      case View.OVERVIEW: return t('navOverview');
      case View.NETWORK: return t('navNetwork');
      case View.CHAT: return t('navChat');
      case View.ADMIN: return t('navAdmin');
      case View.GUIDE: return t('navSetup');
      case View.PROFILE: return t('navProfile');
      case View.PEER_DETAILS: return t('userDetails');
      default: return '';
    }
  };

  // --- Sidebar Components ---
  const SidebarButton = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-colors mb-1 ${
        currentView === view
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold' 
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon size={18} className="mr-3" />
      <span className="text-sm">{label}</span>
    </button>
  );

  const SidebarGroup = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-300 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-gray-800 hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/20 rounded-lg text-brand-600 dark:text-brand-400">
             <Network size={28} />
          </div>
          <span className="text-xl font-bold dark:text-white tracking-tight">{t('appTitle')}</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {/* User Mini Profile in Sidebar */}
          <div 
             onClick={() => setCurrentView(View.PROFILE)}
             className="mx-2 mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
          >
             <div className="w-10 h-10 rounded-full bg-brand-200 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center overflow-hidden">
                {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={20} />}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user.username}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.role}</p>
             </div>
             <Settings size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <SidebarGroup title={t('navGroupNetwork')}>
            <SidebarButton view={View.OVERVIEW} icon={Activity} label={t('navOverview')} />
            <SidebarButton view={View.NETWORK} icon={Users} label={t('navNetwork')} />
            <SidebarButton view={View.CHAT} icon={MessageSquare} label={t('navChat')} />
          </SidebarGroup>

          <SidebarGroup title={t('navGroupSystem')}>
             <SidebarButton view={View.PROFILE} icon={UserIcon} label={t('navProfile')} />
             {canManageUsers && (
                <SidebarButton view={View.ADMIN} icon={ShieldCheck} label={t('navAdmin')} />
             )}
             <SidebarButton view={View.GUIDE} icon={FileText} label={t('navSetup')} />
          </SidebarGroup>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('language')}</span>
            <button 
              onClick={toggleLanguage}
              className="text-xs font-bold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {language === 'en' ? 'EN' : '中文'}
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('theme')}</span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors relative"
            >
              <div className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={16} className="mr-2" />
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen relative">
        <header className="md:hidden bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center sticky top-0 z-10">
           <div className="flex items-center space-x-2">
            <Network className="text-brand-600" />
            <span className="font-bold dark:text-white">{t('appTitle')}</span>
           </div>
           <button onClick={handleLogout} className="p-2 text-gray-600 dark:text-gray-300">
             <LogOut size={20} />
           </button>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold dark:text-white mb-2">
                {getPageTitle()}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t('welcome')}, <span className="text-brand-500 font-semibold">{user.username}</span>.
              </p>
            </div>
            
            {/* Header User Avatar (Quick Link to Profile) */}
            <div 
              onClick={() => setCurrentView(View.PROFILE)}
              className="flex items-center space-x-3 bg-white dark:bg-dark-card px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
               <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 overflow-hidden flex items-center justify-center">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : <UserIcon size={16} className="text-brand-600 dark:text-brand-400" />}
               </div>
               <span className="text-sm font-medium">{user.username}</span>
            </div>
          </div>

          <div className="min-h-[500px]">
            {currentView === View.OVERVIEW && <Dashboard user={user} />}
            {currentView === View.NETWORK && <PeerList />}
            {currentView === View.CHAT && <ChatRoom user={user} onUserClick={handlePeerClick} />}
            {currentView === View.ADMIN && canManageUsers && <AdminPanel />}
            {currentView === View.GUIDE && <DeploymentGuide />}
            {currentView === View.PROFILE && <UserProfile user={user} onUpdate={handleUserUpdate} />}
            {currentView === View.PEER_DETAILS && selectedPeer && (
                <PeerDetails peer={selectedPeer} onBack={() => setCurrentView(View.CHAT)} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;