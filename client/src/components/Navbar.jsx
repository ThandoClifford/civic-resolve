import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const citizenNavItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/submit-complaint', label: 'Submit' },
    { to: '/my-complaints', label: 'My Complaints' },
    { to: '/hotspots', label: 'Hotspots' }
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/complaints', label: 'Complaints' }
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">
                🏛️
              </span>
              <span className="hidden md:inline">Municipal</span>
            </Link>
            
            {isAuthenticated && (
              <div className="hidden md:flex items-center gap-1">
                {isAdmin ? (
                  adminNavItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link ${isActive(item.to) ? 'nav-link-active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))
                ) : (
                  citizenNavItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`nav-link ${isActive(item.to) ? 'nav-link-active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-sm">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-sm font-medium">{user?.fullName}</div>
                    <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;