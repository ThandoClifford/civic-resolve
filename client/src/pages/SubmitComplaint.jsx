import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api from '../services/api';

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
    address: '',
    priority: 'medium'
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const categories = ['Illegal Dumping', 'Water Leak', 'Road Damage', 'Electricity Fault', 'Other'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!position) {
      setError('Please select a location on the map');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('latitude', position.lat);
      formDataToSend.append('longitude', position.lng);
      if (image) {
        formDataToSend.append('image', image);
      }

      await api.post('/complaints', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-complaints');
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1 className="page-title">Submit a Complaint</h1>
        <p className="page-subtitle">Report an issue in your community</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <div className="font-semibold">Complaint submitted successfully!</div>
            <div className="text-sm text-green-600">Redirecting to your complaints...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6">
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            placeholder="Brief title for the complaint"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="input"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input"
            placeholder="Describe the issue in detail..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Address / Area</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="input"
            placeholder="Street address or area description"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
          >
            <option value="low">Low - Minor issue</option>
            <option value="medium">Medium - Needs attention</option>
            <option value="high">High - Urgent</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Image (optional)</label>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📷</div>
                <div className="text-slate-600">
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload an image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-sm text-slate-400">PNG, JPG, GIF up to 10MB</div>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <div className="flex justify-between items-center mb-2">
            <label className="form-label mb-0">Location</label>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use My Current Location
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-3">Click on the map to pin the location of the issue</p>
          <div className="h-72 rounded-lg overflow-hidden border border-slate-200">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary py-4 text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="spinner w-5 h-5"></div>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Submit Complaint
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SubmitComplaint;