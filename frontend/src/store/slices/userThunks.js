import { createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/user.service';

// Fetch user profile
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Profilni yuklashda xatolik' :
                            lang === 'ru' ? 'Ошибка загрузки профиля' :
                            'Failed to fetch profile';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(data);
      return response.data;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Profilni yangilashda xatolik' :
                            lang === 'ru' ? 'Ошибка обновления профиля' :
                            'Failed to update profile';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Upload profile image
export const uploadProfileImage = createAsyncThunk(
  'user/uploadImage',
  async (file, { rejectWithValue }) => {
    try {
      const response = await userService.uploadProfileImage(file);
      return response.data;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Rasmni yuklashda xatolik' :
                            lang === 'ru' ? 'Ошибка загрузки изображения' :
                            'Failed to upload image';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  'user/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getDashboardStats();
      return response;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Statistikani yuklashda xatolik' :
                            lang === 'ru' ? 'Ошибка загрузки статистики' :
                            'Failed to fetch statistics';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Fetch test history
export const fetchTestHistory = createAsyncThunk(
  'user/fetchTestHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await userService.getTestHistory(params);
      return response;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Test tarixini yuklashda xatolik' :
                            lang === 'ru' ? 'Ошибка загрузки истории тестов' :
                            'Failed to fetch test history';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Update language
export const updateLanguage = createAsyncThunk(
  'user/updateLanguage',
  async (language, { rejectWithValue }) => {
    try {
      const response = await userService.updateLanguage(language);
      localStorage.setItem('language', language);
      return { language, message: response.message };
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Tilni o\'zgartirishda xatolik' :
                            lang === 'ru' ? 'Ошибка изменения языка' :
                            'Failed to update language';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Update theme
export const updateTheme = createAsyncThunk(
  'user/updateTheme',
  async (theme, { rejectWithValue }) => {
    try {
      const response = await userService.updateTheme(theme);
      localStorage.setItem('theme', theme);
      return { theme, message: response.message };
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Mavzuni o\'zgartirishda xatolik' :
                            lang === 'ru' ? 'Ошибка изменения темы' :
                            'Failed to update theme';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);

// Delete account
export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (password, { rejectWithValue }) => {
    try {
      const response = await userService.deleteAccount(password);
      return response;
    } catch (error) {
      const lang = localStorage.getItem('language') || 'uz';
      const defaultMessage = lang === 'uz' ? 'Hisobni o\'chirishda xatolik' :
                            lang === 'ru' ? 'Ошибка удаления аккаунта' :
                            'Failed to delete account';
      return rejectWithValue(error.response?.data?.message || defaultMessage);
    }
  }
);