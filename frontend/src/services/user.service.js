import api from './api';

class UserService {
  // Get user profile
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  }

  // Update user profile
  async updateProfile(data) {
    const response = await api.put('/users/profile', data);
    return response.data;
  }

  // Upload profile image
  async uploadProfileImage(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const response = await api.get('/users/dashboard/stats');
    return response.data.data;
  }

  // Get test history
  async getTestHistory(params = {}) {
    const response = await api.get('/users/test-history', { params });
    return response.data;
  }

  // Update language preference
  async updateLanguage(language) {
    const response = await api.put('/users/settings/language', { language });
    return response.data;
  }

  // Update theme preference
  async updateTheme(theme) {
    const response = await api.put('/users/settings/theme', { theme });
    return response.data;
  }

  // Delete account
  async deleteAccount(password) {
    const response = await api.delete('/users/account', { data: { password } });
    return response.data;
  }
}

const userService = new UserService();
export default userService;