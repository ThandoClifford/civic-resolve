import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ComplaintDetails from '../components/ComplaintDetails';

const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.category) params.append('category', filter.category);
      if (filter.priority) params.append('priority', filter.priority);
      
      const response = await api.get(`/complaints/my?${params.toString()}`);
      setComplaints(response.data.complaints);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter({ ...filter, [key]: value });
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

  const clearFilters = () => {
    setFilter({ status: '', category: '', priority: '' });
  };

  const hasActiveFilters = filter.status || filter.category || filter.priority;

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint._id);
    setDetailsOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">My Complaints</h1>
          <p className="page-subtitle">View and manage all your submitted complaints</p>
        </div>
        <Link to="/submit-complaint" className="btn btn-primary mt-4 md:mt-0">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </span>
        </Link>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="form-label">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input max-w-[200px]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="form-label">Category</label>
            <select
              value={filter.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input max-w-[200px]"
            >
              <option value="">All Categories</option>
              <option value="Illegal Dumping">Illegal Dumping</option>
              <option value="Water Leak">Water Leak</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Electricity Fault">Electricity Fault</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input max-w-[150px]"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner w-8 h-8"></div>
        </div>
      ) : error ? (
        <div className="card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Error Loading Complaints</h3>
            <p className="text-slate-500 mb-4">{error}</p>
            <button onClick={fetchComplaints} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="card p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No complaints found</h3>
            <p className="text-slate-500 mb-4">
              No complaints match your filters. Try adjusting or submit a new complaint.
            </p>
            <Link to="/submit-complaint" className="btn btn-primary">
              Submit Complaint
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-slate-500 mb-4">
            Showing {complaints.length} {complaints.length === 1 ? 'complaint' : 'complaints'}
          </div>
          
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div 
                key={complaint._id} 
                className="card p-6 cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => openDetails(complaint)}
              >
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <h3 className="text-lg font-semibold text-slate-800">{complaint.title}</h3>
                      <span className={getStatusClass(complaint.status)}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                      <span className={getPriorityClass(complaint.priority)}>
                        {complaint.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3 line-clamp-2">{complaint.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <span>📁</span> {complaint.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📍</span> {complaint.address || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📅</span> {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {complaint.imageUrl && (
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={complaint.imageUrl}
                        alt={complaint.title}
                        className="w-full h-full object-cover rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Full Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ComplaintDetails
        complaintId={selectedComplaint}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedComplaint(null);
        }}
        isAdmin={false}
      />
    </div>
  );
};

export default MyComplaints;