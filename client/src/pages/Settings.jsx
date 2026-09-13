import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { setDemoMode } from '../services/api';

const Settings = () => {
  const [mode, setMode] = useState('NIGHT');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [systemInfo, setSystemInfo] = useState({
    backend: 'Checking...',
    streetlights: '--',
    activeFaults: '--'
  });

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const [healthRes, slRes, faultRes] = await Promise.allSettled([
          fetch('/api/health').then((r) => r.json()),
          api.get('/streetlights').then((r) => r.data),
          api.get('/faults').then((r) => r.data)
        ]);

        setSystemInfo({
          backend: healthRes.status === 'fulfilled' ? (healthRes.value.status === 'ok' ? 'Online' : 'Degraded') : 'Unreachable',
          streetlights: slRes.status === 'fulfilled' ? (slRes.value?.streetlights?.length ?? '--') : '--',
          activeFaults: faultRes.status === 'fulfilled' ? (faultRes.value?.faults?.length ?? '--') : '--'
        });
      } catch {
        setSystemInfo({ backend: 'Unreachable', streetlights: '--', activeFaults: '--' });
      }
    };

    fetchSystemInfo();
  }, []);

  const handleModeChange = async (newMode) => {
    setSaving(true);
    setStatusMessage('');
    try {
      const response = await setDemoMode(newMode);
      if (response.data.success) {
        setMode(newMode);
        setStatusMessage(`Operating mode updated to ${newMode}`);
      } else {
        setStatusMessage(response.data.message || 'Failed to update mode');
      }
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to update mode');
    } finally {
      setSaving(false);
    }
  };

  const alertSettings = useMemo(() => [
    { label: 'HIGH alerts', value: 'Enabled' },
    { label: 'CRITICAL alerts', value: 'Enabled' },
    { label: 'Duplicate alert prevention', value: 'Enabled' }
  ], []);

  const escalationSettings = useMemo(() => [
    { label: 'Critical escalation', value: 'Enabled' },
    { label: 'Escalation delay', value: '60 seconds' },
    { label: 'Target role', value: 'ADMIN' }
  ], []);

  return (
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">Configuration</span>
          <h1 className="section-header-title">Settings</h1>
          <p className="section-header-subtitle">Configure SmartLight demonstration and operational preferences</p>
        </div>
      </section>

      <section className="summary-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))', marginBottom: 16 }}>
        <article className="summary-card">
          <div className="summary-label">Backend</div>
          <div className={`summary-value ${systemInfo.backend === 'Online' ? 'green' : 'red'}`} style={{ fontSize: 20 }}>{systemInfo.backend}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Streetlights</div>
          <div className="summary-value">{systemInfo.streetlights}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Active Faults</div>
          <div className="summary-value">{systemInfo.activeFaults}</div>
        </article>
        <article className="summary-card">
          <div className="summary-label">Operating Mode</div>
          <div className="summary-value" style={{ fontSize: 20 }}>{mode}</div>
        </article>
      </section>

      <section className="panel-card" style={{ marginBottom: 14 }}>
        <div className="panel-title">
          <span>SmartLight Operating Mode</span>
        </div>
        <div className="simulator-state-grid">
          <div className="simulator-state-item">
            <span className="simulator-state-label">Current Mode</span>
            <span className={`simulator-state-value ${mode === 'NIGHT' ? 'green' : 'blue'}`}>{mode}</span>
          </div>
          <div className="simulator-state-item">
            <span className="simulator-state-label">Expected Lamp State</span>
            <span className="simulator-state-value">{mode === 'DAY' ? 'OFF' : 'ON'}</span>
          </div>
          <div className="simulator-state-item" style={{ borderBottom: 'none' }}>
            <span className="simulator-state-label">Change Mode</span>
            <div className="button-group">
              <button className={`btn btn-small ${mode === 'DAY' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleModeChange('DAY')} disabled={saving}>
                DAY MODE
              </button>
              <button className={`btn btn-small ${mode === 'NIGHT' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleModeChange('NIGHT')} disabled={saving}>
                NIGHT MODE
              </button>
            </div>
          </div>
        </div>
        {statusMessage && (
          <div className="mt-3 text-xs text-slate-600">{statusMessage}</div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <section className="panel-card">
          <div className="panel-title">
            <span>Simulator</span>
          </div>
          <div className="simulator-state-grid" style={{ margin: 0 }}>
            <div className="simulator-state-item">
              <span className="simulator-state-label">Simulator Status</span>
              <span className="simulator-state-value green">RUNNING</span>
            </div>
            <div className="simulator-state-item">
              <span className="simulator-state-label">Telemetry Interval</span>
              <span className="simulator-state-value">5 seconds</span>
            </div>
            <div className="simulator-state-item" style={{ borderBottom: 'none' }}>
              <span className="simulator-state-label">Interval Config</span>
              <span className="simulator-state-value gray">READ ONLY</span>
            </div>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-title">
            <span>Fault Alerts</span>
          </div>
          <div className="simulator-state-grid" style={{ margin: 0 }}>
            {alertSettings.map((item) => (
              <div className="simulator-state-item" key={item.label}>
                <span className="simulator-state-label">{item.label}</span>
                <span className="simulator-state-value green">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-title">
            <span>Critical Escalation</span>
          </div>
          <div className="simulator-state-grid" style={{ margin: 0 }}>
            {escalationSettings.map((item) => (
              <div className="simulator-state-item" key={item.label}>
                <span className="simulator-state-label">{item.label}</span>
                <span className="simulator-state-value">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
