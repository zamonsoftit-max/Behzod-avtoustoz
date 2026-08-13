import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchSubscriptionTypes = createAsyncThunk(
  'payment/fetchSubscriptionTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/subscription-types');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching subscription types');
    }
  }
);

export const fetchPaymentHistory = createAsyncThunk(
  'payment/fetchPaymentHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/payments/history');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error fetching payment history');
    }
  }
);

export const createPayment = createAsyncThunk(
  'payment/createPayment',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/payments/create', paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Error creating payment');
    }
  }
);

const initialState = {
  payments: [],
  subscriptionTypes: [],
  currentPayment: null,
  loading: false,
  error: null,
  paymentUrl: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
      state.paymentUrl = null;
    },
    setCurrentPayment: (state, action) => {
      state.currentPayment = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch subscription types
      .addCase(fetchSubscriptionTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptionTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.subscriptionTypes = action.payload;
      })
      .addCase(fetchSubscriptionTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch payment history
      .addCase(fetchPaymentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPayment = action.payload;
        state.paymentUrl = action.payload.paymentUrl;
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentPayment, setCurrentPayment } = paymentSlice.actions;
export default paymentSlice.reducer;