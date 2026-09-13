import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civicresolve-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Complaint CRUD endpoints
export const getComplaints = (params) => api.get('/complaints', { params });
export const getComplaintById = (id) => api.get(`/complaints/${id}`);
export const createComplaint = (data) => api.post('/complaints', data);
export const updateComplaint = (id, data) => api.put(`/complaints/${id}`, data);
export const deleteComplaint = (id) => api.delete(`/complaints/${id}`);

// Array operations
export const addUpdate = (id, data) => api.post(`/complaints/${id}/updates`, data);
export const addImage = (id, data) => api.post(`/complaints/${id}/images`, data);

// Aggregation reports endpoints
export const getReportsCategory = () => api.get('/reports/category');
export const getReportsArea = () => api.get('/reports/area');
export const getReportsHighPriority = () => api.get('/reports/high-priority');
export const getReportsMonthlyTrend = () => api.get('/reports/monthly-trend');
export const getReportsHotspots = () => api.get('/reports/hotspots');
export const getReportsStatus = () => api.get('/reports/status');
export const getReportsPriority = () => api.get('/reports/priority');

export const getStreetlights = () => api.get('/streetlights');
export const getFaults = (params) => api.get('/faults', { params });
export const updateFaultStatus = (id, data) => api.patch(`/faults/${id}/status`, data);

export const setDemoMode = (mode) => api.post('/demo/mode', { mode });
export const setDemoScenario = (scenario) => api.post('/demo/scenario', { scenario });

export default api;
