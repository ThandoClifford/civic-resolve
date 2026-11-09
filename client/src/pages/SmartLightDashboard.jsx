import { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import { useSmartLightSocket } from '../hooks/useSmartLightSocket';
import { getStreetlights, getFaults } from '../services/api';
import { getStreetlightDisplayInfo } from '../utils/streetlightColors';

const STATUS_COLORS = {
  ONLINE: '#16a34a',
  WARNING: '#f59e0b',
  FAULT: '#dc2626',
  OFFLINE: '#475569'
};

const PRIORITY_COLORS = {
  CRITICAL: '#7f1d1d',
  HIGH: '#dc2626',
  MEDIUM: '#f59e0b',
  LOW: '#16a34a'
};

const FALLBACK_CENTER = [-26.1865, 28.0045];

function MapAutoBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(FALLBACK_CENTER, 14);
      return;
    }

    const bounds = points.map((point) => [point.lat, point.lng]);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Never';
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffSeconds < 10) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  return date.toLocaleString();
};

const SmartLightDashboard = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('civicresolve-token');
  const isOfficial = user?.role === 'MUNICIPAL_OFFICIAL' || user?.role === 'ADMIN';

  const [streetlights, setStreetlights] = useState([]);
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [escalations, setEscalations] = useState([]);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(''), 4000);
  }, []);

  const handleAlert = useCallback((data) => {
    setAlerts((prev) => [data, ...prev].slice(0, 50));
    showToast(data.message);
  }, [showToast]);

  const handleEscalation = useCallback((data) => {
    setEscalations((prev) => [data, ...prev].slice(0, 50));
    showToast(data.message);
  }, [showToast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [slRes, faultRes] = await Promise.all([
        getStreetlights(),
        getFaults()
      ]);

      setStreetlights(slRes.data.streetlights || []);
      const allFaults = faultRes.data.faults || [];
      const unresolvedStatuses = ['DETECTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'];
      setFaults(allFaults.filter((f) => unresolvedStatuses.includes(f.status)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOfficial) {
      fetchData();
    }
  }, [isOfficial, fetchData]);

  useSmartLightSocket(token, {
    onStreetlightUpdated: (data) => {
      setStreetlights((prev) =>
        prev.map((sl) => (sl.streetlightId === data.streetlightId ? { ...sl, ...data } : sl))
      );
    },
    onFaultNew: (data) => {
      setFaults((prev) => {
        if (prev.some((f) => (f._id || f.id) === data.id)) {
          return prev;
        }
        showToast(`New fault detected: ${data.streetlightId} — ${data.faultType}`);
        return [data, ...prev];
      });
    },
    onFaultUpdated: (data) => {
      setFaults((prev) => {
        const exists = prev.some((f) => (f._id || f.id) === data.id);
        if (!exists) {
          return [data, ...prev];
        }
        return prev.map((f) => ((f._id || f.id) === data.id ? data : f));
      });
    },
    onFaultResolved: (data) => {
      setFaults((prev) => prev.filter((f) => (f._id || f.id) !== data.id));
    },
    onAlert: (data) => {
      handleAlert(data);
    },
    onEscalation: (data) => {
      handleEscalation(data);
    },
    onConnect: () => setSocketConnected(true),
    onDisconnect: () => setSocketConnected(false)
  });

  const filteredStreetlights = useMemo(() => {
    if (statusFilter === 'ALL') return streetlights;
    return streetlights.filter((sl) => sl.deviceStatus === statusFilter);
  }, [streetlights, statusFilter]);

  const mapPoints = useMemo(() => {
    return streetlights
      .filter((sl) => Number.isFinite(sl.location?.coordinates?.latitude) && Number.isFinite(sl.location?.coordinates?.longitude))
      .map((sl) => {
        const displayInfo = getStreetlightDisplayInfo(sl);

        return {
          id: sl._id || sl.streetlightId,
          streetlightId: sl.streetlightId,
          name: sl.name,
          areaName: sl.location?.areaName || 'Unknown area',
          installationType: sl.installationType,
          currentLampState: sl.currentLampState,
          deviceStatus: sl.deviceStatus,
          voltage: sl.voltage,
          current: sl.current,
          lastSeen: sl.lastSeen,
          lat: sl.location.coordinates.latitude,
          lng: sl.location.coordinates.longitude,
          displayColor: displayInfo.color,
          displayLabel: displayInfo.label
        };
      });
  }, [streetlights]);

  const operationalCount = streetlights.filter((sl) => sl.deviceStatus === 'ONLINE').length;
  const attentionCount = streetlights.filter((sl) => sl.deviceStatus === 'WARNING' || sl.deviceStatus === 'FAULT').length;
  const offlineCount = streetlights.filter((sl) => sl.deviceStatus === 'OFFLINE').length;
  const criticalCount = faults.filter((f) => f.priorityLevel === 'CRITICAL').length;

  if (!isOfficial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          You do not have permission to access the SmartLight dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-slate-700">Loading SmartLight dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <section className="section-header">
        <div>
          <span className="eyebrow">SmartLight Monitoring</span>
          <h1 className="section-header-title">SmartLight</h1>
          <p className="section-header-subtitle">Real-time IoT streetlight monitoring and control</p>
        </div>
        <div className="page-controls">
          <span className="filter-label">Operating Mode</span>
          <select value="NIGHT" className="form-input compact-select">
            <option>DAY</option>
            <option>NIGHT</option>
          </select>
        </div>
      </section>

      <section className="summary-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))' }}>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Total Devices</span>
            <span className="summary-icon tone-blue">◉</span>
          </div>
          <div className="summary-value">{streetlights.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Online</span>
            <span className="summary-icon tone-green">●</span>
          </div>
          <div className="summary-value green">{operationalCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Active Faults</span>
            <span className="summary-icon tone-red">⚠</span>
          </div>
          <div className="summary-value red">{attentionCount + offlineCount}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-top">
            <span className="summary-label">Critical</span>
            <span className="summary-icon tone-red">▲</span>
          </div>
          <div className="summary-value red">{criticalCount}</div>
        </div>
      </section>

      {alerts.length > 0 && (
        <section className="panel-card" style={{ marginBottom: 14 }}>
          <div className="panel-title">
            <span>Active Alerts</span>
            <span className="chip chip-red">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => {
              const isCritical = alert.priorityLevel === 'CRITICAL';
              return (
                <div key={`${alert.faultId}-${alert.createdAt}-${index}`} className={`rounded-lg border p-3 ${isCritical ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-900">{alert.streetlightId}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded text-white ${isCritical ? 'bg-red-600' : 'bg-amber-600'}`}>
                      {alert.priorityLevel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mb-1">{alert.streetlightName} • {alert.areaName}</div>
                  <div className="text-xs text-slate-700 font-medium mb-1">{alert.faultType?.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-500">Score: {alert.priorityScore ?? '--'}/100 • {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 panel-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Live Map</h2>
            <div className="map-legend">
              <span><span className="map-legend-dot" style={{ background: '#7dd3fc' }} />Day mode normal</span>
              <span><span className="map-legend-dot" style={{ background: '#16a34a' }} />Night mode normal</span>
              <span><span className="map-legend-dot" style={{ background: '#dc2626' }} />Lamp failure</span>
              <span><span className="map-legend-dot" style={{ background: '#475569' }} />Device offline</span>
              <span><span className="map-legend-dot" style={{ background: '#f59e0b' }} />Low current</span>
            </div>
          </div>
          <div className="relative w-full" style={{ height: '26rem' }}>
            <MapContainer center={FALLBACK_CENTER} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapAutoBounds points={mapPoints} />
              {mapPoints.map((point) => (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={8}
                  pathOptions={{
                    color: '#0f172a',
                    weight: 1,
                    fillColor: point.displayColor || '#475569',
                    fillOpacity: 0.9
                  }}
                >
                  <Popup>
                    <div className="space-y-1 min-w-48">
                      <div className="font-semibold text-slate-800">{point.streetlightId}</div>
                      <div className="text-sm text-slate-600">{point.name}</div>
                      <div className="text-sm text-slate-600">Area: {point.areaName}</div>
                      <div className="text-sm text-slate-600">Type: {point.installationType?.replace('_', ' ')}</div>
                      <div className="text-sm text-slate-600">Status: {point.deviceStatus}</div>
                      <div className="text-sm text-slate-600">Lamp: {point.currentLampState}</div>
                      <div className="text-sm text-slate-600">Voltage: {point.voltage ?? '--'}V</div>
                      <div className="text-sm text-slate-600">Current: {point.current ?? '--'}A</div>
                      <div className="text-sm text-slate-600">Last Seen: {formatLastSeen(point.lastSeen)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

      </div>

      <div className="panel-card">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Streetlight Status</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-2 py-1"
          >
            <option value="ALL">All</option>
            <option value="ONLINE">Online</option>
            <option value="WARNING">Warning</option>
            <option value="FAULT">Fault</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          {filteredStreetlights.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No streetlight data available.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Area</th>
                  <th>Lamp</th>
                  <th>Status</th>
                  <th>Voltage</th>
                  <th>Current</th>
                  <th>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {filteredStreetlights.map((sl) => (
                  <tr key={sl._id || sl.streetlightId}>
                    <td className="font-medium text-slate-900">{sl.streetlightId}</td>
                    <td>{sl.name || '--'}</td>
                    <td>{sl.location?.areaName || '--'}</td>
                    <td>{sl.currentLampState || '--'}</td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          background: STATUS_COLORS[sl.deviceStatus] || '#475569',
                          color: '#fff'
                        }}
                      >
                        {sl.deviceStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{sl.voltage ?? '--'}V</td>
                    <td>{sl.current ?? '--'}A</td>
                    <td>{formatLastSeen(sl.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>


      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
};

export default SmartLightDashboard;
