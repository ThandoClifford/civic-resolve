import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import api from '../services/api';

const FALLBACK_CENTER = [-26.2041, 28.0473];

const priorityColors = {
  critical: '#7f1d1d',
  high: '#dc2626',
  medium: '#f59e0b',
  low: '#16a34a'
};

const getPriorityKey = (complaint) => {
  const value = (complaint.priorityLevel || complaint.priority || 'low').toString().toLowerCase();
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'low';
};

const complaintHasCoordinates = (complaint) => {
  const lat = complaint?.location?.coordinates?.latitude;
  const lng = complaint?.location?.coordinates?.longitude;
  return Number.isFinite(lat) && Number.isFinite(lng);
};

const formatStatus = (status) => {
  if (!status) return 'Unknown';
  return status.replace('_', ' ');
};

function MapAutoBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      map.setView(FALLBACK_CENTER, 12);
      return;
    }

    const bounds = points.map((point) => [point.lat, point.lng]);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

const IssueMap = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/complaints');
        setComplaints(response.data.complaints || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load issue locations');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const points = useMemo(() => {
    return complaints
      .filter(complaintHasCoordinates)
      .map((complaint) => ({
        id: complaint._id,
        title: complaint.title,
        category: complaint.category,
        status: complaint.status,
        priority: getPriorityKey(complaint),
        priorityScore: complaint.priorityScore,
        areaName: complaint?.location?.areaName || 'Unknown area',
        lat: complaint.location.coordinates.latitude,
        lng: complaint.location.coordinates.longitude
      }));
  }, [complaints]);

  const counts = useMemo(() => {
    return points.reduce(
      (acc, point) => {
        acc[point.priority] += 1;
        return acc;
      },
      { critical: 0, high: 0, medium: 0, low: 0 }
    );
  }, [points]);

  return (
    <div className="relative w-full h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] bg-slate-900">
      {loading ? (
        <div className="h-full flex items-center justify-center text-white text-lg">Loading issue map...</div>
      ) : error ? (
        <div className="h-full flex items-center justify-center px-6">
          <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-lg">{error}</div>
        </div>
      ) : (
        <>
          <MapContainer
            center={FALLBACK_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapAutoBounds points={points} />

            {points.map((point) => (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={8}
                pathOptions={{
                  color: '#0f172a',
                  weight: 1,
                  fillColor: priorityColors[point.priority],
                  fillOpacity: 0.9
                }}
              >
                <Popup>
                  <div className="space-y-1 min-w-48">
                    <div className="font-semibold text-slate-800">{point.title}</div>
                    <div className="text-sm text-slate-600">{point.category}</div>
                    <div className="text-sm text-slate-600">Area: {point.areaName}</div>
                    <div className="text-sm text-slate-600">Status: {formatStatus(point.status)}</div>
                    <div className="text-sm text-slate-700 font-medium capitalize">
                      Priority: {point.priority}
                      {Number.isFinite(point.priorityScore) ? ` (${point.priorityScore}/100)` : ''}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>

          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-4 py-3 w-64">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">Issue Location Map</h2>
            <p className="text-xs text-slate-600 mb-3">Each dot is an issue. Color indicates priority.</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: priorityColors.critical }} />
                  <span>Critical</span>
                </div>
                <span className="font-semibold text-slate-700">{counts.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: priorityColors.high }} />
                  <span>High</span>
                </div>
                <span className="font-semibold text-slate-700">{counts.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: priorityColors.medium }} />
                  <span>Medium</span>
                </div>
                <span className="font-semibold text-slate-700">{counts.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: priorityColors.low }} />
                  <span>Low</span>
                </div>
                <span className="font-semibold text-slate-700">{counts.low}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
              Showing {points.length} mapped issue{points.length === 1 ? '' : 's'}.
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IssueMap;
