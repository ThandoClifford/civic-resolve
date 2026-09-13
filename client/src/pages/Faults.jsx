import { useEffect, useState } from 'react';
import { getFaults, updateFaultStatus } from '../services/api';

const Faults = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const response = await getFaults({ status: filter === 'All' ? '' : filter });
        setFaults(response.data.faults || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load faults');
      } finally {
        setLoading(false);
      }
    };

    fetchFaults();
  }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await updateFaultStatus(id, { status });
      const response = await getFaults();
      setFaults(response.data.faults || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fault status');
    }
  };

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading SmartLight faults...</div></div>;
  }

  if (error) {
    return <div className="page-wrap"><div className="error-card">{error}</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">SmartLight Fault Registry</span>
          <h1 className="page-title">Faults</h1>
          <p className="page-subtitle">Automatically detected IoT telemetry issues</p>
        </div>
        <div className="page-controls">
          <label className="filter-label">Status</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input compact-select">
            <option>All</option>
            <option>DETECTED</option>
            <option>ACKNOWLEDGED</option>
            <option>ASSIGNED</option>
            <option>IN_PROGRESS</option>
            <option>RESOLVED</option>
          </select>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Fault Stream</span>
          <span className="chip chip-red">{faults.length} active</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fault ID</th>
                <th>Streetlight</th>
                <th>Area</th>
                <th>Fault Type</th>
                <th>Priority</th>
                <th>Score</th>
                <th>Status</th>
                <th>Detected At</th>
                <th>Occurrences</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {faults.map((fault) => (
                <tr key={fault._id || fault.id}>
                  <td><strong>{fault._id?.slice(-8) || 'FAULT'}</strong></td>
                  <td>{fault.streetlightId}</td>
                  <td>{fault.streetlight?.location?.areaName || fault.streetlight?.areaName || '--'}</td>
                  <td>{fault.faultType?.replace('_', ' ')}</td>
                  <td><span className={`priority-pill priority-${String(fault.priorityLevel || '').toLowerCase()}`}>{fault.priorityLevel || '--'}</span></td>
                  <td>{fault.priorityScore ?? '--'}</td>
                  <td><span className={`status-pill status-${fault.status}`}>{fault.status}</span></td>
                  <td>{fault.detectedAt ? new Date(fault.detectedAt).toLocaleString() : '--'}</td>
                  <td>{fault.occurrenceCount ?? 1}</td>
                  <td>
                    <div className="row-actions">
                      {fault.status !== 'RESOLVED' && 
                        <button className="btn btn-small btn-primary" onClick={() => updateStatus(fault._id, 'RESOLVED')}>Resolve</button>
                      }
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

export default Faults;
