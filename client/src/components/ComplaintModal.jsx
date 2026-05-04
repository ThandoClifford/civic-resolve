import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';

const ComplaintModal = ({ complaint, isOpen, onClose, onUpdate }) => {
  const [current, setCurrent] = useState(complaint);
  const [loading, setLoading] = useState(false);
  const [newUpdateComment, setNewUpdateComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    setCurrent(complaint);
  }, [complaint]);

  const handleStatusChange = async (e) => {
    const status = e.target.value;
    setNewStatus(status);
  };

  const applyStatus = async () => {
    if (!newStatus) return;
    setLoading(true);
    try {
      await api.put(`/complaints/${current._id}`, { status: newStatus });
      await refreshComplaint();
      setNewStatus('');
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const addUpdate = async () => {
    if (!newUpdateComment.trim()) return;
    setLoading(true);
    try {
      await api.post(`/complaints/${current._id}/updates`, {
        comment: newUpdateComment,
        status: current.status
      });
      setNewUpdateComment('');
      await refreshComplaint();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to add update');
    } finally {
      setLoading(false);
    }
  };

  const addImage = async () => {
    if (!newImageUrl.trim()) return;
    setLoading(true);
    try {
      await api.post(`/complaints/${current._id}/images`, { url: newImageUrl.trim() });
      setNewImageUrl('');
      await refreshComplaint();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to add image');
    } finally {
      setLoading(false);
    }
  };

  const refreshComplaint = async () => {
    const res = await api.get(`/complaints/${current._id}`);
    setCurrent(res.data.complaint);
  };

  if (!isOpen) return null;

  const getStatusClass = (status) => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityClass = (priority) => {
    const classes = {
      low: 'bg-emerald-100 text-emerald-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-red-100 text-red-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Complaint Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {current ? (
            <>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{current.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getStatusClass(current.status)}`}>
                    {current.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityClass(current.priority)}`}>
                    {current.priority}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {current.category}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-600 mb-1">Description</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{current.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-1">Location</h4>
                  <p className="text-slate-700 flex items-center gap-2">
                    <span>📍</span> {current.location?.areaName || 'Not specified'}
                  </p>
                  {current.location?.coordinates && (
                    <p className="text-sm text-slate-500 mt-1">
                      Lat: {current.location.coordinates.latitude.toFixed(6)}, Lng: {current.location.coordinates.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-1">Assigned Team</h4>
                  <p className="text-slate-700">
                    {current.assignedTeam?.name || 'Not assigned'}
                  </p>
                  {current.assignedTeam?.members?.length > 0 && (
                    <p className="text-sm text-slate-500">
                      Members: {current.assignedTeam.members.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-1">Created</h4>
                  <p className="text-slate-700">{new Date(current.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-1">Last Updated</h4>
                  <p className="text-slate-700">{new Date(current.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Images */}
              {current.images && current.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">Images ({current.images.length})</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {current.images.map((img, idx) => (
                      <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={img.url} alt={`Complaint ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                        <p className="text-xs text-slate-500 mt-1 truncate">{new Date(img.uploadedAt).toLocaleDateString()}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Update History */}
              {current.updates && current.updates.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 mb-3">Update History ({current.updates.length})</h4>
                  <div className="space-y-3">
                    {current.updates.map((update, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-50 rounded-r-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusClass(update.status)}`}>
                            {update.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-slate-500">
                            {new Date(update.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        {update.comment && <p className="text-slate-700">{update.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Update Form */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Add Update</h4>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      value={newStatus}
                      onChange={handleStatusChange}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                    >
                      <option value="">Set Status</option>
                      <option value="pending">Pending</option>
                      <option value="under_review">Under Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <button
                      onClick={applyStatus}
                      disabled={loading || !newStatus}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Update Status
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUpdateComment}
                      onChange={(e) => setNewUpdateComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                    />
                    <button
                      onClick={addUpdate}
                      disabled={loading || !newUpdateComment.trim()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Image URL */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-semibold text-slate-600 mb-3">Add Image URL</h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300"
                  />
                  <button
                    onClick={addImage}
                    disabled={loading || !newImageUrl.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-500 py-8">Loading...</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ComplaintModal;
