const PROD_API_BASE = 'https://powersense-2-9w2e.onrender.com/api';
const LOCAL_API_BASE = 'http://localhost:5000/api';

const isLocalHost = (hostname) => {
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return LOCAL_API_BASE;
  }

  return PROD_API_BASE;
};

export const getApiRootUrl = () => {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
};
