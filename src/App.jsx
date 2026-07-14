import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TabBar from './components/TabBar';
import TitleBar from './components/TitleBar';
import Masters from './pages/Masters';
import Production from './pages/Production';
import History from './pages/History';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import OutstandingReport from './pages/OutstandingReport';
import { fetchAllData, subscribeDB, logOut } from './data/db';
import { TAB_REGISTRY } from './data/registry';
import Dashboard from './pages/Dashboard';

function App() {
  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window'); // 'login' or 'main' or null (web)

  const [user, setUser] = useState(() => {
    // Electron login window should never auto-login to render dashboard here
    if (windowType === 'login') {
      return null;
    }

    // sessionStorage: web preview / same window
    // localStorage: Electron main window after login (different window from login window)
    const fromSession = sessionStorage.getItem('user');
    if (fromSession) return JSON.parse(fromSession);

    const fromLocal = localStorage.getItem('auth_user');
    if (fromLocal) {
      // Copy to sessionStorage so rest of app works normally
      sessionStorage.setItem('user', fromLocal);
      sessionStorage.setItem('auth_token', localStorage.getItem('auth_token') || 'offline-token-12345');
      return JSON.parse(fromLocal);
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (windowType === 'login') return false;
    return !!(sessionStorage.getItem('user') || localStorage.getItem('auth_user'));
  });
  const [_dbTick, setDbTick] = useState(0);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [activeTabId, setActiveTabId] = useState(() => {
    const saved = localStorage.getItem('active_tab_id');
    return (saved && TAB_REGISTRY[saved]) ? saved : 'dashboard';
  });

  const [tabIds, setTabIds] = useState(() => {
    const saved = localStorage.getItem('open_tabs_ids');
    try {
      const parsed = saved ? JSON.parse(saved) : [];
      const filtered = parsed.filter(id => TAB_REGISTRY[id]);
      // FORCE: Always ensure the activeTabId is in the list
      if (!filtered.includes(activeTabId)) {
        filtered.push(activeTabId);
      }
      return filtered;
    } catch {
      return ['dashboard'];
    }
  });

  // Auto-login / session redirect if already logged in when Electron login window is opened
  useEffect(() => {
    if (windowType === 'login') {
      const fromLocal = localStorage.getItem('auth_user');
      if (fromLocal && window.electronAPI?.loginSuccess) {
        window.electronAPI.loginSuccess();
      }
    }
  }, [windowType]);

  useEffect(() => {
    if (user) {
      fetchAllData().then(() => setLoading(false));
      
      const unsubscribe = subscribeDB(() => {
        setDbTick(prev => prev + 1);
      });
      return unsubscribe;
    }
  }, [user]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('open_tabs_ids', JSON.stringify(tabIds));
    localStorage.setItem('active_tab_id', activeTabId);
  }, [tabIds, activeTabId]);

  if (!user) {
    return (
      <Auth onLogin={(u) => {
        setLoading(true);
        setUser(u);
      }} />
    );
  }


  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TitleBar user={user} />
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <h2>Syncing with Cloud...</h2>
        </div>
      </div>
    );
  }

  const openTab = (id) => {
    if (!tabIds.includes(id)) {
      setTabIds([...tabIds, id]);
    }
    setActiveTabId(id);
  };

  const closeTab = (id) => {
    setTabIds(prev => {
      const newTabs = prev.filter(t => t !== id);
      if (activeTabId === id) {
        if (newTabs.length > 0) {
          setActiveTabId(newTabs[newTabs.length - 1]);
        } else {
          setActiveTabId('dashboard');
          return ['dashboard'];
        }
      }
      return newTabs;
    });
  };

  const renderContent = () => {
    const currentType = TAB_REGISTRY[activeTabId] ? activeTabId : 'dashboard';

    switch (currentType) {
      case 'dashboard':
        return <Dashboard />;
      case 'suppliers':
      case 'clients':
      case 'workers':
      case 'materials':
      case 'products':
        return <Masters key={currentType} activeTab={currentType} />;
      case 'inward':
      case 'issue':
      case 'production':
      case 'loss':
      case 'outward':
      case 'billing':
      case 'payments':
        return <Production key={currentType} activeTab={currentType} />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      case 'outstanding':
        return <OutstandingReport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TitleBar user={user} />
      <Navbar 
        onOpenTab={openTab} 
        activeTabId={activeTabId} 
        user={user} 
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={logOut} 
      />
      
      <TabBar 
        tabIds={tabIds} 
        activeTabId={activeTabId} 
        onSelect={setActiveTabId} 
        onClose={closeTab} 
      />
      
      <main style={{ 
        flex: 1, 
        overflowY: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        padding: '1.2rem 1.5rem'
      }}>
        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;

