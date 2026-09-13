import { useEffect, useState } from 'react';
import { getFaults, updateFaultStatus } from '../services/api';

const Faults = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const params = {};
        if (filter !== 'All') params.status = filter;
        const response = await getFaults(params);
        setFaults(response.data.faults || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load faults');
      } finally {
        setLoading(false);
      }
    };

    fetchFaults();
  }, [filter]);

  const filteredFaults = useMemo(() => {
    let result = faults;
    if (priorityFilter !== 'All') {
      result = result.filter((f) => f.priorityLevel === priorityFilter);
    }
    return result;
  }, [faults, priorityFilter]);

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
      <section className="section-header">
        <div>
          <span className="eyebrow">SmartLight Fault Registry</span>
          <h1 className="section-header-title">Faults</h1>
          <p className="section-header-subtitle">Detected issues and their status</p>
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
          <label className="filter-label">Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="form-input compact-select">
            <option>All</option>
            <option>HIGH</option>
            <option>CRITICAL</option>
          </select>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Fault Stream</span>
          <span className="chip chip-red">{filteredFaults.length} records</span>
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
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaults.map((fault) => (
                <tr key={fault._id || fault.id}>
                  <td><strong>{fault._id?.slice(-8) || 'FAULT'}</strong></td>
                  <td>{fault.streetlightId}</td>
                  <td>{fault.streetlight?.location?.areaName || fault.streetlight?.areaName || '--'}</td>
                  <td>{fault.faultType?.replace('_', ' ')}</td>
                  <td><span className={`priority-pill priority-${String(fault.priorityLevel || '').toLowerCase()}`}>{fault.priorityLevel || '--'}</span></td>
                  <td>{fault.priorityScore ?? '--'}</td>
                  <td><span className={`status-pill status-${fault.status}`}>{fault.status}</span></td>
                  <td>{fault.detectedAt ? new Date(fault.detectedAt).toLocaleDateString() : '--'}</td>
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
