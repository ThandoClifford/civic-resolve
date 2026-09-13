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
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">Citizen Services</span>
          <h1 className="section-header-title">Complaints</h1>
          <p className="section-header-subtitle">Manage and track community complaints</p>
        </div>
        <div className="page-controls">
          <button className="btn btn-primary">+ New Complaint</button>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: 14 }}>
        <div className="filter-tabs">
          {['All', 'Open', 'In Progress', 'Resolved'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter.status === (tab === 'All' ? '' : tab.toLowerCase().replace(' ', '_')) ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', tab === 'All' ? '' : tab.toLowerCase().replace(' ', '_'))}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Complaint Register</span>
          <span className="chip chip-blue">{complaints.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint, idx) => (
                <tr key={complaint._id}>
                  <td>{idx + 1}</td>
                  <td>{complaint.title || complaint.category}</td>
                  <td>{complaint.category}</td>
                  <td>{complaint.location?.areaName || '--'}</td>
                  <td><span className={`status-pill status-${complaint.status?.toUpperCase?.() || 'PENDING'}`}>{complaint.status?.replace('_', ' ')}</span></td>
                  <td>{complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '--'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-small btn-secondary" onClick={() => openModal(complaint)}>View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
