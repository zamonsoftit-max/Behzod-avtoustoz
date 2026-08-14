import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { toast } from 'react-toastify';
import i18n from '../../i18n';

// Load user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;
      
      // Apply user's language preference
      // Priority: localStorage > user.language > default
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      }
      // Don't override localStorage language with user.language
      
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.loadingUser'));
    }
  }
);

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', userData);
      if (response.data.requiresSms) return response.data;
      localStorage.setItem('token', response.data.token);
      
      // Session ID is now handled via secure cookies automatically
      
      // Apply user's language preference after login
      // Priority: localStorage > user.language > default
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      }
      // Don't override localStorage language with user.language
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.loginFailed'));
    }
  }
);

// Login SMS kodini tasdiqlash
export const verifyLogin = createAsyncThunk(
  'auth/verifyLogin',
  async ({ phoneNumber, code }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-login', { phoneNumber, code });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.loginFailed'));
    }
  }
);

// Register
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.requiresSms) return response.data;
      localStorage.setItem('token', response.data.token);
      
      // Session ID is now handled via secure cookies automatically
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.registrationFailed'));
    }
  }
);

export const verifyRegistration = createAsyncThunk(
  'auth/verifyRegistration',
  async ({ phoneNumber, code }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-registration', { phoneNumber, code });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.registrationFailed'));
    }
  }
);

export const resendRegistrationCode = createAsyncThunk(
  'auth/resendRegistrationCode',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-registration-code', { phoneNumber });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.registrationFailed'));
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      return null;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.logoutFailed'));
    }
  }
);

// Update password
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await api.put('/auth/update-password', passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || i18n.t('errors.passwordUpdateFailed'));
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: !!localStorage.getItem('token'), // Only loading if token exists
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresSms) return;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        toast.success(i18n.t('toast.success.login'));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(verifyLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        toast.success(i18n.t('toast.success.login'));
      })
      .addCase(verifyLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresSms) return;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        toast.success(i18n.t('toast.success.register'));
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      .addCase(verifyRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegistration.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        toast.success(i18n.t('toast.success.register'));
      })
      .addCase(verifyRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        toast.info(i18n.t('toast.success.logout'));
      })
      // Update password
      .addCase(updatePassword.fulfilled, (state) => {
        toast.success(i18n.t('toast.success.passwordUpdated'));
      })
      .addCase(updatePassword.rejected, (state, action) => {
        toast.error(action.payload);
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
