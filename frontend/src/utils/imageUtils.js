// Image URL sanitization and validation utilities

// Validate if URL is safe and from allowed origins
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    // Check if it's a data URL (base64)
    if (url.startsWith('data:image/')) {
      // Validate data URL format
      const dataUrlRegex = /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,/;
      return dataUrlRegex.test(url);
    }
    
    // Parse URL
    const parsedUrl = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Check if it's from our API
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const apiHost = new URL(apiUrl).host;
    
    // Allow images from our API or trusted CDNs
    const allowedHosts = [
      apiHost,
      // Add other trusted domains if needed
    ];
    
    return allowedHosts.some(host => parsedUrl.host === host || parsedUrl.host.endsWith(`.${host}`));
  } catch {
    return false;
  }
};

// Sanitize image URL
export const sanitizeImageUrl = (url, baseUrl = process.env.REACT_APP_UPLOAD_URL ? (process.env.REACT_APP_UPLOAD_URL.startsWith('http') ? process.env.REACT_APP_UPLOAD_URL.replace('/uploads', '') : window.location.origin) : (process.env.REACT_APP_API_URL || 'http://localhost:5000')) => {
  if (!url) return '';
  
  // If it's already a full URL, validate it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return isValidImageUrl(url) ? url : '';
  }
  
  // If it's a relative path, prepend base URL
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }
  
  // Assume it's a filename in uploads directory
  return `${baseUrl}/uploads/${url}`;
};

// Get safe image URL with fallback
export const getSafeImageUrl = (url, fallback = null) => {
  const sanitized = sanitizeImageUrl(url);
  return isValidImageUrl(sanitized) ? sanitized : fallback;
};

// Default placeholder image as data URL
export const DEFAULT_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"%2F%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-family="system-ui" font-size="16"%3ERasm yuklanmadi%3C%2Ftext%3E%3C%2Fsvg%3E';

// Handle image load error
export const handleImageError = (event, fallback = DEFAULT_PLACEHOLDER) => {
  if (event.target) {
    event.target.onerror = null; // Prevent infinite loop
    event.target.src = fallback;
  }
};