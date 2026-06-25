import React from 'react';
import { 
  Database, 
  Package, 
  History, 
  UserSquare2, 
  FileBox, 
  Settings,
  CircleDot,
  ChevronDown,
  LayoutDashboard,
  Users,
  HardHat,
  Send,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

const Navbar = ({ onOpenTab, activeTabId, user }) => {
  const menus = [
    {
      title: 'Masters',
      items: [
        { id: 'suppliers', label: 'Suppliers Registry', icon: UserSquare2, desc: 'Manage vendor details' },
        { id: 'clients', label: 'Client Registry', icon: Users, desc: 'Manage buyer details' },
        { id: 'workers', label: 'Karigars / Workers', icon: HardHat, desc: 'Manage factory workers' },
        { id: 'materials', label: 'Raw Materials', icon: FileBox, desc: 'Track material types' },
        { id: 'products', label: 'Product Catalog', icon: Package, desc: 'Product configurations' },
      ]
    },
    {
      title: 'Store',
      items: [
        { id: 'inward', label: 'Material Inward', icon: CircleDot, desc: 'Receive raw materials' },
        { id: 'issue', label: 'Issue to Factory', icon: Send, desc: 'Issue material to karigars' },
      ]
    },
    {
      title: 'Factory',
      items: [
        { id: 'production', label: 'Production Entry', icon: Database, desc: 'Daily line production' },
        { id: 'loss', label: 'Material Loss', icon: AlertTriangle, desc: 'Record factory wastage' },
        { id: 'history', label: 'Production History', icon: History, desc: 'View past logs' },
      ]
    },
    {
      title: 'Sales',
      items: [
        { id: 'outward', label: 'Outward / Sales', icon: ArrowUpRight, desc: 'Manage sales & dispatch' },
      ]
    }
  ];

  const handleLogoClick = () => {
    onOpenTab('suppliers');
  };

  return (
    <nav className="navbar">
      {/* Branding Removed */}

      <div className="nav-menu">
        {menus.map((menu) => (
          <div key={menu.title} className="nav-item">
            <div className={`nav-link ${menu.items.some(i => i.id === activeTabId) ? 'active' : ''}`}>
              {menu.title}
              <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </div>
            
            <div className="nav-dropdown">
              <p style={{ 
                fontSize: '0.65rem', 
                fontWeight: 700, 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.4rem',
                padding: '0 0.7rem'
              }}>
                {menu.title} MODULES
              </p>
              {menu.items.map((item) => (
                <button
                  key={item.id}
                  className={`dropdown-item ${activeTabId === item.id ? 'active' : ''}`}
                  onClick={() => onOpenTab(item.id)}
                >
                  <div className="dropdown-item-icon">
                    <item.icon size={14} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user?.username}</div>
           <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
        
        {user?.role === 'ADMIN' && (
          <button 
            className="btn btn-secondary" 
            onClick={() => onOpenTab('settings')} 
            style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px' }} 
            title="Admin Settings"
          >
            <Settings size={18} />
          </button>
        )}
        
        <button className="btn btn-secondary" onClick={() => {
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user');
          window.location.reload();
        }} style={{ padding: '0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#ff3b30' }}>
          Log Out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
