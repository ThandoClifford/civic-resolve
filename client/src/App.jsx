import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import HotspotMap from './pages/HotspotMap';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaints from './pages/AdminComplaints';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            {isAdmin ? <Navigate to="/admin" /> : <CitizenDashboard />}
          </ProtectedRoute>
        } />
        <Route path="/submit-complaint" element={
          <ProtectedRoute>
            <SubmitComplaint />
          </ProtectedRoute>
        } />
        <Route path="/my-complaints" element={
          <ProtectedRoute>
            <MyComplaints />
          </ProtectedRoute>
        } />
        <Route path="/hotspots" element={
          <ProtectedRoute>
            <HotspotMap />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/complaints" element={
          <ProtectedRoute adminOnly>
            <AdminComplaints />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
};

export default App;