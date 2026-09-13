import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import SubmitComplaint from './pages/SubmitComplaint';
import ViewComplaints from './pages/ViewComplaints';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import IssueMap from './pages/IssueMap';
import SmartLightDashboard from './pages/SmartLightDashboard';
import Streetlights from './pages/Streetlights';
import Faults from './pages/Faults';
import Maintenance from './pages/Maintenance';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';

const RoleRoute = ({ allowedRoles, element }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading CivicResolve...</div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return element;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<Landing />} />

      <Route
        path="/*"
        element={
          <AppShell>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/submit" element={<SubmitComplaint />} />
                <Route path="/complaints" element={<ViewComplaints />} />
                <Route path="/issue-map" element={<IssueMap />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/smartlight" element={<RoleRoute allowedRoles={['MUNICIPAL_OFFICIAL', 'ADMIN']} element={<SmartLightDashboard />} />} />
                <Route path="/streetlights" element={<RoleRoute allowedRoles={['MUNICIPAL_OFFICIAL', 'ADMIN']} element={<Streetlights />} />} />
                <Route path="/faults" element={<RoleRoute allowedRoles={['MUNICIPAL_OFFICIAL', 'ADMIN']} element={<Faults />} />} />
                <Route path="/maintenance" element={<RoleRoute allowedRoles={['MUNICIPAL_OFFICIAL', 'ADMIN']} element={<Maintenance />} />} />
                <Route path="/simulator" element={<RoleRoute allowedRoles={['MUNICIPAL_OFFICIAL', 'ADMIN']} element={<Simulator />} />} />
                <Route path="/settings" element={<RoleRoute allowedRoles={['ADMIN']} element={<Settings />} />} />
                <Route path="/pots" element={<Landing />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </AppShell>
        }
      />
    </Routes>
  );
};

export default App;
