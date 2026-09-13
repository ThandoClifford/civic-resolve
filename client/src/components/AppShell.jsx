import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppShell = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const nav = [
    { to: '/', label: 'Dashboard', icon: '▦' },
    { to: '/complaints', label: 'Complaints', icon: '✎' },
    { to: '/smartlight', label: 'SmartLight', icon: '☼' },
    { to: '/streetlights', label: 'Streetlights', icon: '◉' },
    { to: '/faults', label: 'Faults', icon: '⚠' },
    { to: '/maintenance', label: 'Maintenance', icon: '✓' },
    { to: '/simulator', label: 'Simulator', icon: '⟳' },
    { to: '/pots', label: 'POTS', icon: '⌕' },
    { to: '/users', label: 'Users', icon: '♙' },
    { to: '/settings', label: 'Settings', icon: '⚙' }
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-panel">
          <Link className="brand" to="/">
            <span className="brand-mark">✦</span>
            <span className="brand-copy">
              <span className="brand-name">CivicResolve</span>
              <span className="brand-subtitle">Municipal Operations</span>
            </span>
          </Link>
        </div>

        <div className="nav-title">Operations</div>
        <nav className="nav-list">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{(user?.name || 'C').slice(0, 1).toUpperCase()}</div>
            <div className="user-meta">
              <div className="user-name">{user?.name || 'Guest'}</div>
              <div className="user-role">{user?.role || 'CITIZEN'}</div>
            </div>
          </div>
          {isAuthenticated ? (
            <button className="logout-button" onClick={logout}>Logout</button>
          ) : (
            <Link className="login-button" to="/login">Login</Link>
          )}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">{location.pathname.replace('/', '') || 'Dashboard'}</span>
          </div>
          <div className="topbar-right">
            <button className="icon-button">🔔</button>
            <span className="role-badge">{user?.role || 'CITIZEN'}</span>
            <span className="clock">{new Date().toLocaleDateString()}</span>
          </div>
        </header>
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
};

export default AppShell;
