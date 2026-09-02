import { useEffect, useState } from 'react';
import api from '../services/api';
import ComplaintModal from '../components/ComplaintModal';
import { useAuth } from '../context/AuthContext';

const ViewComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '', priority: '' });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      if (filter.priority) params.priority = filter.priority;

      const response = await api.get('/complaints', { params });
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

  const clearFilters = () => {
    setFilter({ status: '', category: '', priority: '' });
  };

  const canDeleteComplaints = isAuthenticated && user?.role === 'ADMIN';

  const openModal = (complaint) => {
    setSelectedComplaint(complaint);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedComplaint(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      setComplaints(complaints.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete complaint');
    }
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      low: 'bg-emerald-100 text-emerald-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-red-100 text-red-800',
      critical: 'bg-fuchsia-100 text-fuchsia-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  };

  const hasActiveFilters = filter.status || filter.category || filter.priority;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">All Issues</h1>
        <p className="text-slate-600">Review and manage municipal service issues</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Illegal Dumping">Illegal Dumping</option>
              <option value="Water Leak">Water Leak</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Electricity Fault">Electricity Fault</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p>{error}</p>
          <button onClick={fetchComplaints} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
            Try Again
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-6xl mb-4">📭</p>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No issues found</h3>
          <p className="text-slate-500 mb-4">No issues match your filters.</p>
          <button onClick={clearFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <div
              key={complaint._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => openModal(complaint)}
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-800">{complaint.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusBadgeClass(complaint.status)}`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityBadgeClass((complaint.priorityLevel || complaint.priority || 'low').toLowerCase())}`}>
                      {(complaint.priorityLevel || complaint.priority || 'low').toLowerCase()}
                    </span>
                    {complaint.priorityScore !== null && complaint.priorityScore !== undefined && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {complaint.priorityScore}/100
                      </span>
                    )}
                    {complaint.priorityLevel && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {complaint.priorityLevel}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      {complaint.category}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-3 line-clamp-2">{complaint.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>📍 {complaint.location?.areaName || 'Unknown area'}</span>
                    <span>📅 {new Date(complaint.createdAt).toLocaleDateString()}</span>
                    {complaint.images?.length > 0 && (
                      <span>📷 {complaint.images.length} image(s)</span>
                    )}
                    {complaint.updates?.length > 0 && (
                      <span>🔄 {complaint.updates.length} update(s)</span>
                    )}
                  </div>
                </div>
                {canDeleteComplaints && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(complaint._id); }}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ComplaintModal
        complaint={selectedComplaint}
        isOpen={modalOpen}
        onClose={closeModal}
        onUpdate={fetchComplaints}
      />
    </div>
  );
};

export default ViewComplaints;
