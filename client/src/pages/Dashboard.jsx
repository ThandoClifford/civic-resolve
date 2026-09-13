import { useEffect, useMemo, useState } from 'react';
import { getComplaints, getStreetlights, getFaults } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const canLoadMunicipalData = ['MUNICIPAL_OFFICIAL', 'ADMIN'].includes(user?.role);
  const [complaints, setComplaints] = useState([]);
  const [streetlights, setStreetlights] = useState([]);
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [municipalDataIssue, setMunicipalDataIssue] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setMunicipalDataIssue('');
        const complaintResult = await getComplaints();
        setComplaints(complaintResult.data.complaints || []);

        if (!canLoadMunicipalData) {
          setStreetlights([]);
          setFaults([]);
          return;
        }

        const [streetlightResult, faultResult] = await Promise.allSettled([
          getStreetlights(),
          getFaults()
        ]);

        const issues = [];
        if (streetlightResult.status === 'fulfilled') {
          setStreetlights(streetlightResult.value.data.streetlights || []);
        } else {
          issues.push('Streetlight');
        }

        if (faultResult.status === 'fulfilled') {
          setFaults(faultResult.value.data.faults || []);
        } else {
          issues.push('Fault');
        }

        if (issues.length) {
          setMunicipalDataIssue(`${issues.join(' and ')} data temporarily unavailable. Dashboard complaint data remains available.`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.role]);

  const cards = useMemo(() => {
    const activeComplaints = complaints.filter((c) => c.status !== 'resolved').length;
    const cardsOut = [
      { label: 'Total Complaints', value: complaints.length, tone: 'blue', text: 'Citizen issues' },
      { label: 'Active Complaints', value: activeComplaints, tone: 'amber', text: 'Open service requests' }
    ];

    if (!canLoadMunicipalData) {
      return cardsOut;
    }

    const unresolvedFaults = faults.filter((f) => ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(f.status));
    const criticalFaults = faults.filter((f) => f.priorityLevel === 'CRITICAL' && ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(f.status));
    const onlineStreetlights = streetlights.filter((s) => s.deviceStatus === 'ONLINE').length;
    const maintenanceTasks = unresolvedFaults.length;

    return cardsOut.concat([
      { label: 'Total Streetlights', value: streetlights.length, tone: 'blue', text: 'IoT inventory' },
      { label: 'Streetlights Online', value: onlineStreetlights, tone: 'green', text: 'Operational assets' },
      { label: 'Active SmartLight Faults', value: unresolvedFaults.length, tone: 'red', text: 'Telemetry-detected' },
      { label: 'Critical Faults', value: criticalFaults.length, tone: 'red', text: 'Escalation required' },
      { label: 'Maintenance Tasks', value: maintenanceTasks, tone: 'orange', text: 'Open workflow' }
    ]);
  }, [complaints, streetlights, faults, canLoadMunicipalData]);

  const activity = useMemo(() => {
    const list = [];

    faults.slice(0, 4).forEach((fault) => {
      list.push({ type: 'Fault', detail: `${fault.streetlightId} ${fault.faultType.replace('_', ' ')} ${fault.priorityLevel}`, date: fault.detectedAt });
    });

    complaints.slice(0, 3).forEach((complaint) => {
      list.push({ type: 'Complaint', detail: `New complaint: ${complaint.title || complaint.category}`, date: complaint.createdAt || complaint.date });
    });

    return list.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now())).slice(0, 8);
  }, [complaints, faults]);

  if (loading) {
    return <div className="page-wrap"><div className="loading-card">Loading CivicResolve dashboard...</div></div>;
  }

  if (error) {
    return <div className="page-wrap"><div className="error-card">{error}</div></div>;
  }

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Operations Dashboard</span>
          <h1 className="page-title">CivicResolve Dashboard</h1>
          <p className="page-subtitle">What is happening in CivicResolve right now?</p>
        </div>
        <div className="header-right">
          <span className="live-indicator"><span /> Live</span>
        </div>
      </section>

      {municipalDataIssue && (
        <section className="page-wrap">
          <div className="error-card">{municipalDataIssue}</div>
        </section>
      )}

      <section className="summary-grid">
        {cards.map((card, index) => (
          <article className="summary-card" key={index}>
            <div className="summary-card-top">
              <span className="summary-label">{card.label}</span>
              <span className={`summary-icon tone-${card.tone}`}>↗</span>
            </div>
            <div className="summary-value">{card.value}</div>
            <div className="summary-text">{card.text}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel-card panel-span-2">
          <div className="panel-title">
            <span>Recent Activity</span>
            <span className="chip chip-blue">Unified view</span>
          </div>
          <div className="activity-list">
            {activity.length === 0 ? (
              <div className="empty-state">No recent activity recorded.</div>
            ) : activity.map((item, idx) => (
              <div className="activity-row" key={idx}>
                <span className="activity-dot" />
                <div>
                  <div className="activity-type">{item.type}</div>
                  <div className="activity-detail">{item.detail}</div>
                </div>
                <span className="activity-date">{item.date ? new Date(item.date).toLocaleDateString() : 'Today'}</span>
              </div>
            ))}
          </div>
        </article>

        {canLoadMunicipalData && (
          <article className="panel-card">
            <div className="panel-title">
              <span>SmartLight Overview</span>
              <span className="chip chip-green">Live</span>
            </div>
            <div className="mini-list">
              <div className="mini-row">
                <span className="mini-label">Network</span>
                <span className="mini-value">{streetlights.length}</span>
              </div>
              <div className="mini-row">
                <span className="mini-label">Online</span>
                <span className="mini-value green">{streetlights.filter((s) => s.deviceStatus === 'ONLINE').length}</span>
              </div>
              <div className="mini-row">
                <span className="mini-label">Faults</span>
                <span className="mini-value red">{faults.length}</span>
              </div>
              <div className="mini-row">
                <span className="mini-label">Critical</span>
                <span className="mini-value red">{faults.filter((f) => f.priorityLevel === 'CRITICAL').length}</span>
              </div>
            </div>
          </article>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
