const appName = import.meta.env.VITE_APP_NAME || 'RiverX App';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

window.__APP_CONFIG__ = {
  appName,
  apiBaseUrl
};

document.title = appName;
