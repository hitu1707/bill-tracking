import axios from 'axios';

// In production, VITE_API_URL comes from Vercel environment variables.
// In local development, it defaults to localhost.
const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

const API = axios.create({
  baseURL,
  withCredentials: true // Crucial: passes session cookies with every request
});

export default API;