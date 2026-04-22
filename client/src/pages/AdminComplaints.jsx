import { useEffect, useState } from 'react';
import api from '../services/api';
import ComplaintDetails from '../components/ComplaintDetails';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ 
    status: '', 
    category: '', 
    priority: '', 
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1 
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 });
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
      if (filter.search) params.append('search', filter.search);
      params.append('sortBy', filter.sortBy);
      params.append('sortOrder', filter.sortOrder);
      params.append('page', filter.page);
      params.append('limit', pagination.limit);
      
      const response = await api.get(`/complaints?${params.toString()}`);
      setComplaints(response.data.complaints);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter({ ...filter, [key]: value, page: 1 });
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/complaints/${id}/status`, { status: newStatus });
      setComplaints(prev => prev.map(c => 
        c._id === id ? { ...c, status: newStatus } : c
      ));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handlePriorityUpdate = async (id, newPriority) => {
    try {
      await api.put(`/complaints/${id}/status`, { priority: newPriority });
      setComplaints(prev => prev.map(c => 
        c._id === id ? { ...c, priority: newPriority } : c
      ));
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setFilter({ ...filter, page: newPage });
  };

  const clearFilters = () => {
    setFilter({
      status: '',
      category: '',
      priority: '',
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1
    });
  };

  const openDetails = (complaint) => {
    setSelectedComplaint(complaint._id);
    setDetailsOpen(true);
  };

  const hasActiveFilters = filter.status || filter.category || filter.priority || filter.search;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1 className="page-title">Manage Complaints</h1>
        <p className="page-subtitle">Update status, priority, and manage all complaints</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="form-label">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search title, description, or address..."
              className="input"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input min-w-[150px]"
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
              className="input min-w-[150px]"
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
              className="input min-w-[120px]"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="form-label">Sort By</label>
            <select
              value={filter.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input min-w-[140px]"
            >
              <option value="createdAt">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
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
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No complaints found
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr key={complaint._id} className="cursor-pointer" onClick={() => openDetails(complaint)}>
                      <td className="font-medium text-slate-800 max-w-[200px] truncate">
                        {complaint.title}
                      </td>
                      <td className="text-slate-600">{complaint.category}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusUpdate(complaint._id, e.target.value)}
                          className="input max-w-[150px] text-sm py-2"
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          value={complaint.priority}
                          onChange={(e) => handlePriorityUpdate(complaint._id, e.target.value)}
                          className="input max-w-[120px] text-sm py-2"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>
                      <td className="text-slate-600">
                        {complaint.reportedBy?.fullName || 'N/A'}
                      </td>
                      <td className="text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetails(complaint)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            View Details
                          </button>
                          {complaint.imageUrl && (
                            <a
                              href={complaint.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Image
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 0 && (
            <div className="flex justify-between items-center mt-4 p-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} complaints
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(filter.page - 1)}
                  disabled={filter.page === 1}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-sm text-slate-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(filter.page + 1)}
                  disabled={filter.page >= pagination.pages}
                  className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ComplaintDetails
        complaintId={selectedComplaint}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedComplaint(null);
        }}
        isAdmin={true}
        onUpdate={fetchComplaints}
      />
    </div>
  );
};

export default AdminComplaints;