import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import testReducer from './slices/testSlice';
import notificationReducer from './slices/notificationSlice';
import paymentReducer from './slices/paymentSlice';
import adminReducer from './slices/adminSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    test: testReducer,
    notification: notificationReducer,
    payment: paymentReducer,
    admin: adminReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled', 'auth/loadUser/fulfilled'],
        ignoredActionPaths: ['payload.user.registeredAt', 'payload.user.lastLogin'],
        ignoredPaths: ['auth.user.registeredAt', 'auth.user.lastLogin'],
      },
    }),
});

// For debugging in development
if (process.env.NODE_ENV === 'development') {
  window.store = store;
}

export default store;
export { store };