import { useEffect, useState } from 'react';
import { getFaults, updateFaultStatus } from '../services/api';

const Maintenance = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const response = await getFaults();
        setFaults((response.data.faults || []).filter((f) => f.status !== 'RESOLVED'));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load maintenance stream');
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, []);

  const moveStatus = async (id, status) => {
    try {
      const response = await updateFaultStatus(id, { status });
      const refreshed = await getFaults();
      setFaults((refreshed.data.faults || []).filter((f) => f.status !== 'RESOLVED'));
      setFaults((prev) => prev.map((f) => (f._id === id ? response.data.fault : f)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workflow');
    }
  };

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading maintenance workflow...</div></div>;
  }

  if (error) {
    return <div className="page-wrap"><div className="error-card">{error}</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Maintenance Workflow</span>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">DETECTED → ACKNOWLEDGED → ASSIGNED → IN_PROGRESS → RESOLVED</p>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Operation Queue</span>
          <span className="chip chip-amber">{faults.length} tasks</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Streetlight</th>
                <th>Fault</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Official</th>
                <th>Detected</th>
                <th>Last Activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faults.length === 0 ? (
                <tr><td colSpan="8"><div className="empty-state">No maintenance tasks in progress.</div></td></tr>
              ) : faults.map((fault) => (
                <tr key={fault._id || fault.id}>
                  <td><strong>{fault.streetlightId}</strong></td>
                  <td>{fault.faultType?.replace('_', ' ')}</td>
                  <td><span className={`priority-pill priority-${String(fault.priorityLevel || '').toLowerCase()}`}>{fault.priorityLevel}</span></td>
                  <td><span className={`status-pill status-${fault.status}`}>{fault.status}</span></td>
                  <td>{fault.assignedTo?.name || 'Unassigned'}</td>
                  <td>{fault.detectedAt ? new Date(fault.detectedAt).toLocaleDateString() : '--'}</td>
                  <td>{fault.activity?.[fault.activity.length - 1]?.action || 'No activity history'}</td>
                  <td>
                    <div className="row-actions">
                      {fault.status !== 'RESOLVED' && (
                        <select className="form-input compact-select small-select" value={fault.status} onChange={(e) => moveStatus(fault._id, e.target.value)}>
                          <option>DETECTED</option>
                          <option>ACKNOWLEDGED</option>
                          <option>ASSIGNED</option>
                          <option>IN_PROGRESS</option>
                          <option>RESOLVED</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Maintenance;
