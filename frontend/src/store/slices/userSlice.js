import { createSlice } from '@reduxjs/toolkit';
import {
  fetchUserProfile,
  updateUserProfile,
  uploadProfileImage,
  fetchDashboardStats,
  fetchTestHistory,
  updateLanguage,
  updateTheme,
  deleteAccount
} from './userThunks';

const initialState = {
  profile: null,
  dashboardStats: null,
  testHistory: {
    data: [],
    pagination: null,
  },
  loading: false,
  dashboardLoading: false,
  profileLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.dashboardStats = null;
      state.testHistory = { data: [], pagination: null };
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Upload profile image
    builder
      .addCase(uploadProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch dashboard stats
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.dashboardLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardLoading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.dashboardLoading = false;
        state.error = action.payload;
      });

    // Fetch test history
    builder
      .addCase(fetchTestHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.testHistory = action.payload;
      })
      .addCase(fetchTestHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update language
    builder
      .addCase(updateLanguage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLanguage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.language = action.payload.language;
        }
      })
      .addCase(updateLanguage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update theme
    builder
      .addCase(updateTheme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTheme.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.theme = action.payload.theme;
        }
      })
      .addCase(updateTheme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete account
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        // Clear all user data
        return initialState;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearUserData } = userSlice.actions;
export default userSlice.reducer;