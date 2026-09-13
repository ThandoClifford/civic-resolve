import { useEffect, useMemo, useState } from 'react';
import { getStreetlights } from '../services/api';

const Streetlights = () => {
  const [streetlights, setStreetlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStreetlights = async () => {
      try {
        const response = await getStreetlights();
        setStreetlights(response.data.streetlights || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load streetlights');
      } finally {
        setLoading(false);
      }
    };

    fetchStreetlights();
  }, []);

  const summaries = useMemo(() => {
    return {
      total: streetlights.length,
      online: streetlights.filter((s) => s.deviceStatus === 'ONLINE').length,
      warning: streetlights.filter((s) => s.deviceStatus === 'WARNING').length,
      fault: streetlights.filter((s) => s.deviceStatus === 'FAULT').length,
      offline: streetlights.filter((s) => s.deviceStatus === 'OFFLINE').length
    };
  }, [streetlights]);

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading streetlights...</div></div>;
  }

  if (error) {
    return <div className="page-wrap"><div className="error-card">{error}</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">Infrastructure</span>
          <h1 className="section-header-title">Streetlights</h1>
          <p className="section-header-subtitle">View and manage all streetlights</p>
        </div>
      </section>

      <section className="summary-grid compact-grid">
        <article className="summary-card"><div className="summary-label">Total</div><div className="summary-value">{summaries.total}</div></article>
        <article className="summary-card"><div className="summary-label">Online</div><div className="summary-value green">{summaries.online}</div></article>
        <article className="summary-card"><div className="summary-label">Warning</div><div className="summary-value amber">{summaries.warning}</div></article>
        <article className="summary-card"><div className="summary-label">Fault</div><div className="summary-value red">{summaries.fault}</div></article>
        <article className="summary-card"><div className="summary-label">Offline</div><div className="summary-value gray">{summaries.offline}</div></article>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Streetlight Inventory</span>
          <span className="chip chip-blue">{streetlights.length} records</span>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Area</th>
                <th>Installation Type</th>
                <th>Expected State</th>
                <th>Actual State</th>
                <th>Current</th>
                <th>Voltage</th>
                <th>Signal</th>
                <th>Device Status</th>
                <th>Last Seen</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {streetlights.map((sl) => (
                <tr key={sl._id || sl.streetlightId}>
                  <td><strong>{sl.streetlightId}</strong></td>
                  <td>{sl.name || '--'}</td>
                  <td>{sl.location?.areaName || '--'}</td>
                  <td>{sl.installationType?.replace('_', ' ') || '--'}</td>
                  <td>{sl.expectedLampState || '--'}</td>
                  <td>{sl.currentLampState || '--'}</td>
                  <td>{sl.current ?? '--'}A</td>
                  <td>{sl.voltage ?? '--'}V</td>
                  <td>{sl.deviceStatus === 'ONLINE' ? 'ONLINE' : sl.deviceStatus}</td>
                  <td><span className={`status-pill status-${sl.deviceStatus}`}>{sl.deviceStatus || 'UNKNOWN'}</span></td>
                  <td>{sl.lastSeen ? new Date(sl.lastSeen).toLocaleString() : 'Never'}</td>
                  <td><button className="btn btn-primary btn-small">Inspect</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Streetlights;
