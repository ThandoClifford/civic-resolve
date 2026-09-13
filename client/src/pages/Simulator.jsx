import { useState } from 'react';
import { setDemoMode, setDemoScenario } from '../services/api';

const Simulator = () => {
  const [mode, setMode] = useState('NIGHT');
  const [status, setStatus] = useState('RUNNING');
  const [interval, setInterval] = useState(5000);
  const [log, setLog] = useState([
    'Simulator ready',
    'Telemetry stream standby'
  ]);

  const addLog = (entry) => {
    setLog((prev) => [`${new Date().toLocaleTimeString()} ${entry}`, ...prev].slice(0, 12));
  };

  const handleDayNight = async () => {
    try {
      const expected = mode === 'DAY' ? 'OFF' : 'ON';
      const response = await setDemoMode(mode);
      const state = response.data.state || {};
      addLog(`Operating mode set ${mode}; expected lamp state ${expected}; ${response.data.count || Object.keys(state.activeScenarios || {}).length} streetlights updated`);
    } catch (err) {
      addLog(`Operating mode update failed: ${err.response?.data?.message || 'unknown error'}`);
    }
  };

  const demoTrigger = async (type) => {
    addLog(`Demo trigger ${type}`);
    try {
      let scenario = '';
      if (type === 'lampFailure') {
        scenario = 'SL003_OFF';
      } else if (type === 'deviceOffline') {
        scenario = 'SL004_OFFLINE';
      } else if (type === 'lowCurrent') {
        scenario = 'SL005_LOW_CURRENT';
      } else if (type === 'clear') {
        scenario = 'RESET';
      } else if (type === 'start') {
        scenario = 'START';
      } else if (type === 'stop') {
        scenario = 'STOP';
      }

      if (scenario) {
        const response = await setDemoScenario(scenario);
        const scenarioLabel = scenario.replace('_', ' ');
        addLog(`Scenario ${scenarioLabel} applied: ${response.data.success ? 'accepted' : 'rejected'}`);
      }
    } catch (err) {
      addLog(`Scenario request failed: ${err.response?.data?.message || 'unknown error'}`);
    }
  };

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">SmartLight Demo</span>
          <h1 className="page-title">Simulator</h1>
          <p className="page-subtitle">DEMO AND TESTING ENVIRONMENT</p>
        </div>
        <div className="header-right">
          <span className="live-indicator"><span /> {status}</span>
        </div>
      </section>

      <section className="simulator-grid">
        <article className="panel-card">
          <div className="panel-title">
            <span>Operating Mode</span>
          </div>
          <div className="button-group">
            <button className={`btn btn-small ${mode === 'DAY' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('DAY')}>DAY MODE</button>
            <button className={`btn btn-small ${mode === 'NIGHT' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('NIGHT')}>NIGHT MODE</button>
          </div>
          <div className="button-group mt-4">
            <button className="btn btn-primary" onClick={handleDayNight}>Apply Mode</button>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <span>Telemetry</span>
          </div>
          <div className="telemetry-status">
            <span className="mini-label">Simulator Status</span>
            <span className="chip chip-green">{status}</span>
          </div>
          <div className="telemetry-status">
            <span className="mini-label">Telemetry Interval</span>
            <span className="chip chip-blue">{Math.round(interval / 1000)} seconds</span>
          </div>
          <div className="button-group mt-4">
            <button className="btn btn-primary" onClick={() => { setStatus('RUNNING'); addLog('Simulator started'); demoTrigger('start'); }}>Start Simulator</button>
            <button className="btn btn-secondary" onClick={() => { setStatus('STOPPED'); addLog('Simulator stopped'); demoTrigger('stop'); }}>Stop Simulator</button>
            <button className="btn btn-danger" onClick={() => { addLog('Demo reset'); demoTrigger('clear'); }}>Reset Demo</button>
          </div>
        </article>

        <article className="panel-card">
          <div className="panel-title">
            <span>DEMO FAULT SIMULATIONS</span>
          </div>
          <div className="button-group vertical">
            <button className="btn btn-danger" onClick={() => demoTrigger('lampFailure')}>Trigger SL-003 Lamp Failure</button>
            <button className="btn btn-warning" onClick={() => demoTrigger('deviceOffline')}>Trigger SL-004 Device Offline</button>
            <button className="btn btn-warning" onClick={() => demoTrigger('lowCurrent')}>Trigger SL-005 Low Current</button>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="panel-title">
          <span>Simulator Event Log</span>
        </div>
        <div className="log-list">
          {log.map((item, index) => <div className="log-row" key={index}>{item}</div>)}
        </div>
      </section>
    </div>
  );
};

export default Simulator;
