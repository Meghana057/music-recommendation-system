export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';
export const HEALTH_CHECK_URL =(API_BASE_URL?.replace(/\/api\/v1$/, '') || 'http://localhost:8000') + '/health';
