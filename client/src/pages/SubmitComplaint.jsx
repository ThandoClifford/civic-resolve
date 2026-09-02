import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationPicker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    }
  });
  return position ? <Marker position={position} icon={customIcon} /> : null;
}

const SubmitComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Illegal Dumping',
    areaName: '',
    safetyRisk: 'none',
    environmentalImpact: 'none',
    peopleAffected: 0,
    locationSensitivity: 'normal_residential'
  });
  const [imageUrl, setImageUrl] = useState('');
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const categories = ['Illegal Dumping', 'Water Leak', 'Road Damage', 'Electricity Fault', 'Other'];
  const safetyRiskOptions = ['none', 'low', 'medium', 'high', 'critical'];
  const environmentalImpactOptions = ['none', 'low', 'medium', 'high'];
  const locationSensitivityOptions = [
    { value: 'normal_residential', label: 'Normal residential area' },
    { value: 'business_commercial', label: 'Business/commercial area' },
    { value: 'public_transport_area', label: 'Public transport area' },
    { value: 'high_density_public_area', label: 'High-density public area' },
    { value: 'school', label: 'School' },
    { value: 'hospital', label: 'Hospital' }
  ];
  const canSubmitComplaint = isAuthenticated && user?.role === 'CITIZEN';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!canSubmitComplaint) {
      setError('Please log in as a citizen to report an issue');
      return;
    }

    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    setLoading(true);

    try {
      const complaintData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        safetyRisk: formData.safetyRisk,
        environmentalImpact: formData.environmentalImpact,
        peopleAffected: Number(formData.peopleAffected),
        locationSensitivity: formData.locationSensitivity,
        location: {
          areaName: formData.areaName,
          coordinates: {
            latitude: position.lat,
            longitude: position.lng
          }
        }
      };

      // Add image if URL provided
      if (imageUrl.trim()) {
        complaintData.images = [{ url: imageUrl.trim(), uploadedAt: new Date() }];
      }

      const response = await api.post('/complaints', complaintData);

      setSubmittedComplaint(response.data.complaint);
      setSuccess(true);
      setTimeout(() => {
        navigate('/complaints');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setPosition({ lat: 40.7128, lng: -74.006 });
        }
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Report an Issue</h1>
        <p className="text-slate-600">Share a municipal service issue for review and follow-up</p>
      </div>

      {authLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 text-slate-600">Checking your session...</div>
      ) : !canSubmitComplaint ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-xl mb-6">
          <div className="font-semibold mb-1">Log in to report an issue</div>
          <div className="text-sm">
            Only authenticated citizens can create complaints. <Link to="/login" className="font-medium underline">Go to login</Link>.
          </div>
        </div>
      ) : null}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-semibold">Complaint submitted successfully!</div>
            <div className="text-sm text-green-600">
              {submittedComplaint?.priorityLevel
                ? `${submittedComplaint.priorityLevel} — ${submittedComplaint.priorityScore}/100`
                : 'Priority was calculated successfully.'}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${!canSubmitComplaint ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief title for the complaint"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the issue in detail..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Safety risk</label>
            <select
              name="safetyRisk"
              value={formData.safetyRisk}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              {safetyRiskOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Environmental impact</label>
            <select
              name="environmentalImpact"
              value={formData.environmentalImpact}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              {environmentalImpactOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Approx. people affected</label>
            <input
              type="number"
              name="peopleAffected"
              min="0"
              value={formData.peopleAffected}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location sensitivity</label>
            <select
              name="locationSensitivity"
              value={formData.locationSensitivity}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            >
              {locationSensitivityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Area / Neighborhood</label>
            <input
              type="text"
              name="areaName"
              value={formData.areaName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Downtown, West Side"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image URL (optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-organization.org/photo.jpg"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Location on Map *</label>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                📍 Use My Location
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Click on the map to set the complaint location</p>
            <div className="h-72 rounded-lg overflow-hidden border border-slate-300">
              <MapContainer
                center={position || [40.7128, -74.006]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker position={position} setPosition={setPosition} />
              </MapContainer>
            </div>
            {position && (
              <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmitComplaint}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Issue
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitComplaint;
