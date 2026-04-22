import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const fetchMyComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/complaints/my');
      const data = response.data.complaints;
      setComplaints(data.slice(0, 5));
      
      const pending = data.filter(c => c.status !== 'resolved').length;
      const resolved = data.filter(c => c.status === 'resolved').length;
      setStats({ pending, resolved, total: data.length });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-badge status-pending',
      under_review: 'status-badge status-under_review',
      in_progress: 'status-badge status-in_progress',
      resolved: 'status-badge status-resolved'
    };
    return classes[status] || '';
  };

  const getPriorityClass = (priority) => {
    const classes = {
      low: 'status-badge-lowercase priority-low',
      medium: 'status-badge-lowercase priority-medium',
      high: 'status-badge-lowercase priority-high'
    };
    return classes[priority] || '';
  };

  const quickActions = [
    {
      to: '/submit-complaint',
      icon: '📝',
      title: 'Submit Complaint',
      description: 'Report a new issue',
      color: 'blue'
    },
    {
      to: '/my-complaints',
      icon: '📋',
      title: 'My Complaints',
      description: 'View all your reports',
      color: 'emerald'
    },
    {
      to: '/hotspots',
      icon: '🗺️',
      title: 'Hotspot Map',
      description: 'View illegal dumping areas',
      color: 'red'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Manage your complaints and report new issues</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link to="/submit-complaint" className="stat-card group hover:border-blue-300 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon bg-blue-100 group-hover:bg-blue-200 transition-colors">
              📝
            </div>
            <div>
              <div className="stat-card-value text-blue-600">{stats.total}</div>
              <div className="stat-card-label">Total Complaints</div>
            </div>
          </div>
        </Link>

        <Link to="/my-complaints" className="stat-card group hover:border-amber-300 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon bg-amber-100 group-hover:bg-amber-200 transition-colors">
              ⏳
            </div>
            <div>
              <div className="stat-card-value text-amber-600">{stats.pending}</div>
              <div className="stat-card-label">Pending</div>
            </div>
          </div>
        </Link>

        <Link to="/hotspots" className="stat-card group hover:border-emerald-300 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="stat-card-icon bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
              ✅
            </div>
            <div>
              <div className="stat-card-value text-emerald-600">{stats.resolved}</div>
              <div className="stat-card-label">Resolved</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="quick-action-card"
          >
            <div className="quick-action-card-icon">{action.icon}</div>
            <div className="quick-action-card-title">{action.title}</div>
            <div className="quick-action-card-description">{action.description}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Recent Complaints</h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchMyComplaints}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
            <Link to="/my-complaints" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View All →
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Complaints</h3>
            <p className="text-slate-500 mb-4">{error}</p>
            <button onClick={fetchMyComplaints} className="btn btn-primary">
              Try Again
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No complaints yet</h3>
            <p className="text-slate-500 mb-4">
              Submit your first complaint to start reporting issues in your community.
            </p>
            <Link to="/submit-complaint" className="btn btn-primary">
              Submit Complaint
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint._id}>
                    <td className="font-medium text-slate-800">{complaint.title}</td>
                    <td className="text-slate-600">{complaint.category}</td>
                    <td>
                      <span className={getStatusClass(complaint.status)}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityClass(complaint.priority)}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;