import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ScaleControl } from 'react-leaflet';
import api from '../services/api';

const HotspotMap = () => {
  const [hotspots, setHotspots] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [includeResolved, setIncludeResolved] = useState(false);

  useEffect(() => {
    fetchHotspots();
  }, [includeResolved]);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('includeResolved', includeResolved.toString());
      
      const response = await api.get(`/analytics/hotspots?${params.toString()}`);
      setHotspots(response.data.hotspots);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    const colors = {
      high: '#ef4444',
      medium: '#f97316',
      low: '#22c55e'
    };
    return colors[riskLevel] || '#22c55e';
  };

  const getRiskRadius = (count) => {
    if (count >= 5) return 45;
    if (count >= 3) return 35;
    return 25;
  };

  const highRiskCount = hotspots.filter(h => h.riskLevel === 'high').length;
  const mediumRiskCount = hotspots.filter(h => h.riskLevel === 'medium').length;
  const lowRiskCount = hotspots.filter(h => h.riskLevel === 'low').length;

  const legendItems = [
    { level: 'high', label: 'High Risk', description: '5+ reports', color: '#ef4444' },
    { level: 'medium', label: 'Medium Risk', description: '3-4 reports', color: '#f97316' },
    { level: 'low', label: 'Low Risk', description: '1-2 reports', color: '#22c55e' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Illegal Dumping Hotspots</h1>
          <p className="page-subtitle">Interactive map showing areas with multiple illegal dumping reports</p>
        </div>
        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeResolved}
              onChange={(e) => setIncludeResolved(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600">Include Resolved</span>
          </label>
          <button 
            onClick={fetchHotspots}
            className="btn btn-secondary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.582 0a8.002 8.002 0 011.582 0M4 20h16m-8-8V4m0 0L12 8m4-4l4 4" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{summary?.hotspots || hotspots.length}</div>
              <div className="text-sm text-slate-500">Total Hotspots</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{highRiskCount}</div>
              <div className="text-sm text-slate-500">High Risk Areas</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{mediumRiskCount}</div>
              <div className="text-sm text-slate-500">Medium Risk</div>
            </div>
          </div>
        </div>
        <div className="stat-card border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{lowRiskCount}</div>
              <div className="text-sm text-slate-500">Low Risk</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Hotspot Map</h3>
              <div className="legend p-3 rounded-lg bg-slate-50">
                <div className="text-xs font-medium text-slate-600 mb-2">LEGEND</div>
                <div className="space-y-1.5">
                  {legendItems.map((item) => (
                    <div key={item.level} className="legend-item">
                      <div 
                        className="legend-color" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-slate-700">
                        {item.label} <span className="text-slate-400">({item.description})</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-[500px] rounded-lg overflow-hidden border border-slate-200">
              <MapContainer
                center={[40.7128, -74.006]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
              >
                <ScaleControl position="bottomright" />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hotspots.map((hotspot) => (
                  <CircleMarker
                    key={hotspot.id}
                    center={[hotspot.latitude, hotspot.longitude]}
                    radius={getRiskRadius(hotspot.count)}
                    pathOptions={{
                      fillColor: getRiskColor(hotspot.riskLevel),
                      fillOpacity: 0.5,
                      color: getRiskColor(hotspot.riskLevel),
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[150px]">
                        <div className="font-bold text-slate-800 mb-2">
                          {hotspot.address || 'Unknown Location'}
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <div className="flex justify-between">
                            <span>Reports:</span>
                            <span className="font-semibold">{hotspot.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>High Priority:</span>
                            <span className="font-semibold">{hotspot.highPriorityCount || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Risk Level:</span>
                            <span className={`
                              font-semibold px-2 py-0.5 rounded text-xs
                              ${hotspot.riskLevel === 'high' ? 'bg-red-100 text-red-800' : ''}
                              ${hotspot.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' : ''}
                              ${hotspot.riskLevel === 'low' ? 'bg-green-100 text-green-800' : ''}
                            `}>
                              {hotspot.riskLevel.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Click on markers to view detailed information
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-800">Top Hotspot Areas</h3>
            <p className="text-sm text-slate-500">Ranked by report count</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : hotspots.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <div className="empty-state-title">No hotspots found</div>
              <div className="empty-state-description">
                No illegal dumping reports have been submitted yet.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {hotspots.slice(0, 15).map((hotspot, index) => (
                <div
                  key={hotspot.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {hotspot.address || `Location ${index + 1}`}
                        </div>
                        <div className="text-sm text-slate-500">
                          {hotspot.count} {hotspot.count === 1 ? 'report' : 'reports'}
                          {hotspot.highPriorityCount > 0 && ` (${hotspot.highPriorityCount} high priority)`}
                        </div>
                      </div>
                    </div>
                    <span className={`
                      px-2.5 py-1 rounded-full text-xs font-medium
                      ${hotspot.riskLevel === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${hotspot.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' : ''}
                      ${hotspot.riskLevel === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {hotspot.riskLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotspotMap;