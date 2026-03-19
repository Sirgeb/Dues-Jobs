import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Menu,
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
      {/* Mobile Header */}
      <header className='mobile-header'>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className='btn btn-ghost'
          >
            <Menu size={24} />
          </button>
          <div className='mobile-logo-text'>DuesJobs</div>
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
          <div className='sidebar-icon-wrapper'>
            <Briefcase size={20} color='white' />
          </div>
          <span>DuesJobs</span>
        </div>

        <nav className='sidebar-nav'>
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

        <div className='text-xs user-email-display'>{user?.email}</div>
        <div className='sidebar-footer'>
          <button onClick={signOut} className='nav-link signout-button'>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className='main-content'>
        <Outlet />
      </main>
    </div>
  );
}
