import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/submit', label: 'Report an Issue' },
    { to: '/complaints', label: 'Issues' },
    ...(user?.role === 'ADMIN' ? [{ to: '/reports', label: 'Analytics' }] : []),
    ...(user?.role === 'MUNICIPAL_OFFICIAL' || user?.role === 'ADMIN'
      ? [{ to: '/smartlight', label: 'SmartLight' }]
      : [])
  ];

  return (
    <nav className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">
                🏛️
              </span>
              <span className="hidden md:inline">CivicResolve</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="text-sm text-slate-400">
                  {user?.name || 'Account'} • {user?.role?.replace('_', ' ') || 'User'}
                </div>
                <button
                  onClick={() => logout()}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-700 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2 rounded text-sm ${
                isActive(item.to) ? 'text-white' : 'text-slate-400'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
