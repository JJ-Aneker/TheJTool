// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default {
  apiUrl: API_BASE_URL,
  endpoints: {
    upload: `${API_BASE_URL}/api/upload`,
    analyze: `${API_BASE_URL}/api/analyze`,
    generate: `${API_BASE_URL}/api/generate`,
    quotes: `${API_BASE_URL}/api/quotes`,
    knowledge: `${API_BASE_URL}/api/knowledge`
  }
};
