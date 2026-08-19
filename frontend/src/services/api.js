import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// Track if we're refreshing token to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue = [];

// Function to get session ID from cookie
const getSessionIdFromCookie = () => {
  try {
    const name = 'sessionId=';
    const decodedCookie = decodeURIComponent(document.cookie || '');
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (error) {
    console.error('Error parsing sessionId cookie:', error);
  }
  return '';
};

// Function to get token from cookie
const getTokenFromCookie = () => {
  try {
    const name = 'token=';
    const decodedCookie = decodeURIComponent(document.cookie || '');
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (error) {
    console.error('Error parsing token cookie:', error);
  }
  // Fallback to localStorage for backward compatibility
  try {
    return localStorage.getItem('token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Get session ID from cookie (more secure)
    const sessionId = getSessionIdFromCookie();
    if (sessionId) {
      config.headers['X-Session-Id'] = sessionId;
    }
    
    // Add language header
    const language = localStorage.getItem('language') || 'uz';
    config.headers['Accept-Language'] = language;
    
    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Process failed queue after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Show success messages for specific endpoints
    if (response.config.method !== 'get' && response.data?.message) {
      // Don't show message for auth refresh and all admin endpoints (let components handle their own messages)
      if (!response.config.url.includes('/auth/refresh') && 
          !response.config.url.includes('/admin/')) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  async (error) => {
    // Handle cancelled requests silently
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;

    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 429:
          // Too many requests - Don't show toast for admin endpoints
          if (!originalRequest.url.includes('/admin/')) {
            if (error.response.data.blockMessage) {
              toast.error(i18n.t('errors.tooManyAttempts', { message: error.response.data.blockMessage }));
            } else {
              toast.error(error.response.data.message);
            }
          }
          break;
        case 401:
          // Handle token refresh for 401 errors
          if (!originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
            if (isRefreshing) {
              // Wait for token refresh to complete
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              }).then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
              }).catch(err => {
                return Promise.reject(err);
              });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
              // Try to refresh token
              const response = await api.post('/auth/refresh');
              const { token } = response.data;
              
              // Update token in localStorage
              localStorage.setItem('token', token);
              
              // Update authorization header
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              
              // Process queued requests
              processQueue(null, token);
              
              // Retry original request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            } catch (refreshError) {
              // Refresh failed, redirect to login
              processQueue(refreshError, null);
              localStorage.removeItem('token');
              
              if (error.response.data.sessionExpired) {
                toast.error(i18n.t('errors.deviceChanged'));
              } else {
                toast.error(i18n.t('errors.sessionExpired'));
              }
              window.location.href = '/login';
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          }
          break;
        case 400:
          // Don't show toast for test questions endpoints and admin endpoints - let the component handle it
          if (originalRequest.url.includes('/tests/questions/') || originalRequest.url.includes('/admin/')) {
            break;
          }
          
          if (error.response.data.errors) {
            // Show validation errors
            const validationErrors = error.response.data.errors;
            console.error('Validation errors:', validationErrors);
            validationErrors.forEach(err => {
              toast.error(`${err.path}: ${err.msg}`);
            });
          } else if (error.response.data.message) {
            toast.error(error.response.data.message);
          }
          break;
        case 403:
          // Don't show toast for test endpoints when subscription is required
          if (!originalRequest.url.includes('/tests/')) {
            if (error.response.data.subscriptionRequired) {
              toast(i18n.t('errors.subscriptionRequired') || "Bu bo'lim uchun faol obuna talab qilinadi", { icon: '⚠️' });
            } else if (!originalRequest.url.includes('/admin/')) {
              toast.error(error.response.data.message || i18n.t('errors.unauthorized'));
            }
          }
          break;
        case 404:
          // Don't show toast for notifications endpoint
          if (!originalRequest.url.includes('/notifications')) {
            toast.error(i18n.t('errors.dataNotFound'));
          }
          break;
        case 500:
          toast.error(i18n.t('errors.server'));
          break;
        default:
          // Don't show toast for admin endpoints - let components handle their own messages
          if (error.response.data.message && !originalRequest.url.includes('/admin/')) {
            toast.error(error.response.data.message);
          }
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error:', error);
      toast.error(i18n.t('errors.networkConnection'));
    } else {
      // Something else happened
      // Don't log or show error for cancelled requests
      if (error.code !== 'ERR_CANCELED' && error.name !== 'CanceledError') {
        console.error('Unknown error:', error);
        toast.error(i18n.t('errors.somethingWentWrong'));
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;