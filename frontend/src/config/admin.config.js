// Admin panel configuration
export const ADMIN_CONFIG = {
  // Pagination settings
  pagination: {
    defaultLimit: 10,
    limitOptions: [10, 20, 50, 100],
  },

  // Notification settings
  notifications: {
    fetchLimit: 5,
    refreshInterval: 30000, // 30 seconds
  },

  // File upload settings
  fileUpload: {
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // API request settings
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // Dashboard refresh settings
  dashboard: {
    statsRefreshInterval: 60000, // 1 minute
    chartRefreshInterval: 300000, // 5 minutes
  },

  // Search debounce settings
  search: {
    debounceDelay: 500, // 500ms
  },

  // Export settings
  export: {
    formats: ['csv', 'xlsx', 'pdf'],
    maxRecords: 10000,
  },

  // Session settings
  session: {
    warningTime: 300000, // 5 minutes before expiry
    extendTime: 1800000, // 30 minutes extension
  },
};

export default ADMIN_CONFIG;