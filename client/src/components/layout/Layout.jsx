import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Briefcase,
} from 'lucide-react';

export default function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/history', label: 'History', icon: History },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className='app-container'>
      {/* Mobile Header (Visible only on small screens) */}
      <header className='mobile-header'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='btn btn-ghost'
          >
            <Menu size={24} />
          </button>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>DuesJobs</div>
        </div>
      </header>

      {/* Sidebar Overlay (Mobile) */}
      {mobileMenuOpen && (
        <div
          className='sidebar-overlay'
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className='sidebar-logo'>
          <div
            style={{
              background: 'var(--brand)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            <Briefcase size={20} color='white' />
          </div>
          <span>DuesJobs</span>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div
            className='text-xs'
            style={{
              paddingLeft: '0.75rem',
              marginTop: '0.5rem',
              color: '#8B949E',
            }}
          >
            {user?.email}
          </div>
          <button
            onClick={signOut}
            className='nav-link hover:cursor-pointer'
            style={{
              width: '100%',
              color: 'var(--text-muted)',
              justifyContent: 'flex-start',
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className='main-content'>
        <Outlet />
      </main>
    </div>
  );
}
