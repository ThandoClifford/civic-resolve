import { useState, useEffect } from 'react';
import Modal, { LoadingSpinner, ErrorMessage } from './Modal';
import api from '../services/api';

const ComplaintDetails = ({ complaintId, isOpen, onClose, isAdmin = false, onUpdate }) => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && complaintId) {
      fetchComplaint();
    }
  }, [isOpen, complaintId]);

  const fetchComplaint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/complaints/${complaintId}`);
      setComplaint(response.data.complaint);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      const response = await api.put(`/complaints/${complaintId}/status`, { status: newStatus });
      setComplaint(response.data.complaint);
      setSuccessMsg(`Status updated to ${newStatus.replace('_', ' ')}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityUpdate = async (newPriority) => {
    setUpdating(true);
    try {
      const response = await api.put(`/complaints/${complaintId}/status`, { priority: newPriority });
      setComplaint(response.data.complaint);
      setSuccessMsg(`Priority updated to ${newPriority}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdating(false);
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
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high'
    };
    return classes[priority] || '';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complaint Details" size="lg">
      {loading ? (
        <LoadingSpinner text="Loading complaint details..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchComplaint} />
      ) : complaint ? (
        <div className="space-y-6">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <span>✅</span> {successMsg}
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{complaint.title}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={getStatusClass(complaint.status)}>
                {complaint.status.replace('_', ' ')}
              </span>
              <span className={`status-badge-lowercase ${getPriorityClass(complaint.priority)}`}>
                {complaint.priority} priority
              </span>
              <span className="status-badge bg-slate-100 text-slate-700">
                {complaint.category}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Description</h4>
            <p className="text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {complaint.address && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Location</h4>
              <div className="flex items-center gap-2 text-slate-700">
                <span>📍</span>
                {complaint.address}
              </div>
              {complaint.latitude && complaint.longitude && (
                <p className="text-sm text-slate-500 mt-1">
                  Coordinates: {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                </p>
              )}
            </div>
          )}

          {complaint.imageUrl && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Image</h4>
              <a
                href={complaint.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full max-w-md"
              >
                <img
                  src={complaint.imageUrl}
                  alt={complaint.title}
                  className="w-full rounded-lg border border-slate-200"
                />
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">Reported By</h4>
              <p className="text-slate-700">{complaint.reportedBy?.fullName || 'N/A'}</p>
              <p className="text-sm text-slate-500">{complaint.reportedBy?.email}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">Assigned To</h4>
              <p className="text-slate-700">
                {complaint.assignedTo?.fullName || 'Not assigned'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">Created</h4>
              <p className="text-slate-700">{formatDate(complaint.createdAt)}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-1">Resolved</h4>
              <p className="text-slate-700">{formatDate(complaint.resolvedAt)}</p>
            </div>
          </div>

          {isAdmin && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-semibold text-slate-600 mb-3">Admin Actions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={complaint.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className="input"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={complaint.priority}
                    onChange={(e) => handlePriorityUpdate(e.target.value)}
                    disabled={updating}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default ComplaintDetails;