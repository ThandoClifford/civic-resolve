import { useEffect, useMemo, useState } from 'react';
import { getFaults, updateFaultStatus } from '../services/api';

const ACTIVE_STATUSES = ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'];

const Faults = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Active');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const params = {};
        if (filter !== 'Active' && filter !== 'All') {
          params.status = filter;
        }
        const response = await getFaults(Object.keys(params).length ? params : undefined);
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
    if (filter === 'Active') {
      result = result.filter((f) => ACTIVE_STATUSES.includes(f.status));
    } else if (filter !== 'All') {
      result = result.filter((f) => f.status === filter);
    }
    if (priorityFilter !== 'All') {
      result = result.filter((f) => f.priorityLevel === priorityFilter);
    }
    return result;
  }, [faults, filter, priorityFilter]);

  const summary = useMemo(() => {
    const activeFaults = faults.filter((f) => ACTIVE_STATUSES.includes(f.status));
    const critical = activeFaults.filter((f) => f.priorityLevel === 'CRITICAL').length;
    const today = new Date().toDateString();
    const resolvedToday = faults.filter((f) => {
      if (f.status !== 'RESOLVED') return false;
      const resolvedDate = f.resolvedAt || f.lastDetectedAt || f.updatedAt;
      return resolvedDate ? new Date(resolvedDate).toDateString() === today : false;
    }).length;
    return {
      active: activeFaults.length,
      resolvedToday,
      critical,
      total: faults.length
    };
  }, [faults]);

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
          <p className="section-header-subtitle">Central fault management and resolution</p>
        </div>
        <div className="page-controls">
          <label className="filter-label">Status</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input compact-select">
            <option>Active</option>
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

      <section className="summary-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))' }}>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Active Faults</span>
            <span className="summary-icon tone-red">⚠</span>
          </div>
          <div className="summary-value red">{summary.active}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Resolved Today</span>
            <span className="summary-icon tone-green">✓</span>
          </div>
          <div className="summary-value green">{summary.resolvedToday}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Critical</span>
            <span className="summary-icon tone-red">▲</span>
          </div>
          <div className="summary-value red">{summary.critical}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Total Records</span>
            <span className="summary-icon tone-blue">◉</span>
          </div>
          <div className="summary-value">{summary.total}</div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Fault Registry</span>
          <span className="chip chip-red">{filteredFaults.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fault ID</th>
                <th>Streetlight</th>
                <th>Location</th>
                <th>Fault Type</th>
                <th>Priority</th>
                <th>Score</th>
                <th>Detections</th>
                <th>Status</th>
                <th>Detected</th>
                <th>Last Detected</th>
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
                  <td>{fault.occurrenceCount ?? 1}</td>
                  <td><span className={`status-pill status-${fault.status}`}>{fault.status}</span></td>
                  <td>{fault.detectedAt ? new Date(fault.detectedAt).toLocaleDateString() : '--'}</td>
                  <td>{fault.lastDetectedAt ? new Date(fault.lastDetectedAt).toLocaleDateString() : '--'}</td>
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
