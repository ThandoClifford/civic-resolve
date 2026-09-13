import { useEffect, useState, useMemo } from 'react';
import { getFaults, updateFaultStatus } from '../services/api';

const Maintenance = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const response = await getFaults();
        const all = response.data.faults || [];
        setFaults(all);
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
      setFaults(refreshed.data.faults || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update workflow');
    }
  };

  const filteredFaults = useMemo(() => {
    if (statusFilter === 'ALL') return faults.filter((f) => f.status !== 'RESOLVED');
    if (statusFilter === 'COMPLETED') return faults.filter((f) => f.status === 'RESOLVED');
    return faults.filter((f) => f.status === statusFilter);
  }, [faults, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: 0, DETECTED: 0, ACKNOWLEDGED: 0, ASSIGNED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
    faults.forEach((f) => {
      if (f.status === 'RESOLVED') counts.COMPLETED++;
      else if (counts[f.status] !== undefined) counts[f.status]++;
      counts.ALL++;
    });
    return counts;
  }, [faults]);

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading maintenance workflow...</div></div>;
  }

  if (error) {
    return <div className="page-wrap"><div className="error-card">{error}</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">Maintenance Management</span>
          <h1 className="section-header-title">Maintenance</h1>
          <p className="section-header-subtitle">Track and manage fault resolution</p>
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: 14 }}>
        <div className="filter-tabs">
          {['ALL', 'DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === 'COMPLETED' ? 'Resolved' : tab}
              {tab !== 'ALL' && <span style={{ marginLeft: 6, opacity: 0.7 }}>{statusCounts[tab] || 0}</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Operation Queue</span>
          <span className="chip chip-amber">{filteredFaults.length} tasks</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fault ID</th>
                <th>Streetlight</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaults.length === 0 ? (
                <tr><td colSpan="7"><div className="empty-state">No maintenance tasks found.</div></td></tr>
              ) : filteredFaults.map((fault) => (
                <tr key={fault._id || fault.id}>
                  <td><strong>{fault._id?.slice(-8) || 'FAULT'}</strong></td>
                  <td>{fault._id?.slice(-8) || 'FAULT'}</td>
                  <td>{fault.streetlightId}</td>
                  <td>{fault.assignedTo?.name || 'Unassigned'}</td>
                  <td><span className={`status-pill status-${fault.status}`}>{fault.status}</span></td>
                  <td>{fault.detectedAt ? new Date(fault.detectedAt).toLocaleDateString() : '--'}</td>
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
