import axios from 'axios';

// Get base URL from environment or default to local hostname
let rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

// Automatically ensure /api is at the end
if (!rawUrl.endsWith('/api') && !rawUrl.endsWith('/api/')) {
  rawUrl = rawUrl.replace(/\/+$/, '') + '/api';
}

const API = axios.create({
  baseURL: rawUrl,
  withCredentials: true // Passes session cookies across domains
});

export default API;