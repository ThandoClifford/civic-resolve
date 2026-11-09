import { useState, useEffect } from 'react';
import { setDemoMode, setDemoScenario, getDemoState } from '../services/api';
import { getStreetlightDisplayInfo } from '../utils/streetlightColors';

const StreetlightStatusBadge = ({ streetlight }) => {
  const { color, label } = getStreetlightDisplayInfo(streetlight);
  return (
    <span className="simulator-status-dot" style={{ background: color }} title={label}>
      {label}
    </span>
  );
};

const Simulator = () => {
  const [operatingMode, setOperatingMode] = useState('NIGHT');
  const [simulatorRunning, setSimulatorRunning] = useState(false);
  const [activeScenarios, setActiveScenarios] = useState({});
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoState, setDemoState] = useState(null);

  const streetlights = ['SL-001', 'SL-002', 'SL-003', 'SL-004', 'SL-005'];

  const addLog = (entry) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${entry}`, ...prev].slice(0, 50));
  };

  const fetchDemoState = async () => {
    try {
      const response = await getDemoState();
      const state = response.data?.state || {};
      setDemoState(state);
      setOperatingMode(state.operatingMode || 'NIGHT');
      setSimulatorRunning(state.simulatorRunning || false);
      setActiveScenarios(state.scenarios || {});
    } catch (err) {
      // silent poll failure
    }
  };

  useEffect(() => {
    fetchDemoState();
    const interval = setInterval(fetchDemoState, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSetMode = async (mode) => {
    setLoading(true);
    try {
      await setDemoMode(mode);
      setOperatingMode(mode);
      addLog(`Operating mode set to ${mode}`);
    } catch (err) {
      addLog(`Operating mode update failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      await setDemoScenario('START', 'start');
      setSimulatorRunning(true);
      addLog('Simulator started');
    } catch (err) {
      addLog(`Simulator start failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await setDemoScenario('STOP', 'stop');
      setSimulatorRunning(false);
      addLog('Simulator stopped');
    } catch (err) {
      addLog(`Simulator stop failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
    setLoading(true);
    try {
      await setDemoScenario('RESET', 'reset');
      setActiveScenarios({});
      addLog('All scenarios cleared');
    } catch (err) {
      addLog(`Reset failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScenario = async (streetlightId, type) => {
    setLoading(true);
    try {
      await setDemoScenario(streetlightId, type);
      setActiveScenarios((prev) => ({
        ...prev,
        [streetlightId]: type
      }));
      addLog(`Scenario ${type} applied to ${streetlightId}`);
    } catch (err) {
      addLog(`Scenario request failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetStreetlight = async (streetlightId) => {
    setLoading(true);
    try {
      await setDemoScenario(streetlightId, 'NORMAL');
      setActiveScenarios((prev) => {
        const next = { ...prev };
        delete next[streetlightId];
        return next;
      });
      addLog(`Reset ${streetlightId}`);
    } catch (err) {
      addLog(`Reset failed: ${err.response?.data?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">SmartLight Demo</span>
          <h1 className="section-header-title">Simulator</h1>
          <p className="section-header-subtitle">Control virtual streetlights for testing and demonstration</p>
        </div>
        <div className="header-right">
          <span className="live-indicator"><span /> {simulatorRunning ? 'RUNNING' : 'STOPPED'}</span>
        </div>
      </section>

      <section className="simulator-grid">
        <article className="panel-card">
          <div className="simulator-section-title">Operating Mode</div>
          <div className="button-group">
            <button
              className={`btn btn-small ${operatingMode === 'DAY' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSetMode('DAY')}
              disabled={loading}
            >
              DAY MODE
            </button>
            <button
              className={`btn btn-small ${operatingMode === 'NIGHT' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSetMode('NIGHT')}
              disabled={loading}
            >
              NIGHT MODE
            </button>
          </div>
        </article>

        <article className="panel-card">
          <div className="simulator-section-title">Simulator Status</div>
          <div className="simulator-state-item">
            <span className="simulator-state-label">Status</span>
            <span className={`simulator-state-value ${simulatorRunning ? 'green' : 'red'}`}>
              {simulatorRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="button-group mt-4">
            <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
              {loading ? 'Applying...' : 'START'}
            </button>
            <button className="btn btn-secondary" onClick={handleStop} disabled={loading}>
              {loading ? 'Applying...' : 'STOP'}
            </button>
            <button className="btn btn-danger" onClick={handleResetAll} disabled={loading}>
              {loading ? 'Applying...' : 'RESET ALL'}
            </button>
          </div>
        </article>
      </section>

      <section className="panel-card" style={{ marginBottom: 14 }}>
        <div className="panel-title">
          <span>Fault Scenarios</span>
        </div>
        <div className="simulator-streetlight-grid">
          {streetlights.map((id) => {
            const scenarioType = activeScenarios[id];
            const scenarioBadgeClass = scenarioType
              ? scenarioType === 'LAMP_FAILURE'
                ? 'chip-red'
                : scenarioType === 'DEVICE_OFFLINE'
                  ? 'chip-gray'
                  : scenarioType === 'LOW_CURRENT'
                    ? 'chip-amber'
                    : 'chip-gray'
              : '';
            const mockStreetlight = {
              expectedLampState: operatingMode === 'DAY' ? 'OFF' : 'ON',
              currentLampState: scenarioType === 'LAMP_FAILURE' ? 'OFF' : scenarioType === 'DEVICE_OFFLINE' ? 'OFF' : operatingMode === 'DAY' ? 'OFF' : 'ON',
              deviceStatus: scenarioType === 'DEVICE_OFFLINE' ? 'OFFLINE' : 'ONLINE',
              current: scenarioType === 'LAMP_FAILURE' ? 0.02 : scenarioType === 'LOW_CURRENT' ? 0.12 : operatingMode === 'DAY' ? 0.02 : 0.5
            };
            const { color: statusColor, label: statusLabel } = getStreetlightDisplayInfo(mockStreetlight);

            return (
              <div key={id} className="simulator-streetlight-card">
                <div className="simulator-streetlight-header">
                  <span className="simulator-streetlight-id">{id}</span>
                  {scenarioBadgeClass && (
                    <span className={`simulator-scenario-badge ${scenarioBadgeClass}`}>
                      {scenarioType}
                    </span>
                  )}
                </div>
                <div className="simulator-live-status" style={{ marginBottom: 8 }}>
                  <span className="simulator-live-dot" style={{ background: statusColor }} />
                  <span className="simulator-live-label">{statusLabel}</span>
                </div>
                <div className="button-group vertical">
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleScenario(id, 'LAMP_FAILURE')}
                    disabled={loading}
                  >
                    {loading ? 'Applying...' : 'Lamp Failure'}
                  </button>
                  <button
                    className="btn btn-warning btn-small"
                    onClick={() => handleScenario(id, 'DEVICE_OFFLINE')}
                    disabled={loading}
                  >
                    {loading ? 'Applying...' : 'Device Offline'}
                  </button>
                  <button
                    className="btn btn-warning btn-small"
                    onClick={() => handleScenario(id, 'LOW_CURRENT')}
                    disabled={loading}
                  >
                    {loading ? 'Applying...' : 'Low Current'}
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleResetStreetlight(id)}
                    disabled={loading}
                  >
                    {loading ? 'Applying...' : 'Reset'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-card" style={{ marginBottom: 14 }}>
        <div className="panel-title">
          <span>Current Demo State</span>
        </div>
        <div className="simulator-state-grid" style={{ margin: 0 }}>
          <div className="simulator-state-item">
            <span className="simulator-state-label">Operating Mode</span>
            <span className="simulator-state-value">{operatingMode}</span>
          </div>
          <div className="simulator-state-item">
            <span className="simulator-state-label">Simulator</span>
            <span className={`simulator-state-value ${simulatorRunning ? 'green' : 'red'}`}>
              {simulatorRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="simulator-state-item">
            <span className="simulator-state-label">Active Scenarios</span>
            <span className="simulator-state-value">
              {Object.keys(activeScenarios).length > 0
                ? Object.entries(activeScenarios)
                    .filter(([, v]) => v)
                    .map(([id, type]) => `${id}: ${type}`)
                    .join(', ')
                : 'None'}
            </span>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Simulator Event Log</span>
        </div>
        <div className="log-list">
          {log.length === 0 && (
            <div className="log-row" style={{ color: '#94a3b8' }}>No events yet</div>
          )}
          {log.map((item, index) => (
            <div className="log-row" key={index}>{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Simulator;
