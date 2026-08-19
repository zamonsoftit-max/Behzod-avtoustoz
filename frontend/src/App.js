import React, { useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Layout components
import PublicLayout from './components/layout/PublicLayout';
import StudentLayout from './components/layout/StudentLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DemoTestPage from './pages/public/DemoTestPage';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import TestsPage from './pages/student/TestsPage';
import TestPage from './pages/student/TestPage';
import ResultsPage from './pages/student/ResultsPage';
import StatisticsPage from './pages/student/StatisticsPage';
import PaymentsPage from './pages/student/PaymentsPage';
import ProfilePage from './pages/student/ProfilePage';
import NotificationsPage from './pages/student/NotificationsPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import UsersManagement from './pages/admin/UsersPage';
import UserDetailsPage from './pages/admin/UserDetailsPage';
import UserEditPage from './pages/admin/UserEditPage';
import QuestionsManagement from './pages/admin/QuestionsPage';
import TopicsManagement from './pages/admin/TopicsPage';
import TicketsManagement from './pages/admin/TicketsPage';
import PaymentsManagement from './pages/admin/PaymentsPage';
import ReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Components
import PrivateRoute from './components/common/PrivateRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Actions
import { loadUser } from './store/slices/authSlice';
import { fetchNotifications } from './store/slices/notificationSlice';
import socketService from './services/socket.service';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const { i18n } = useTranslation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    let mounted = true;
    
    if (isAuthenticated && user && mounted) {
      socketService.connect();
      // Load notifications
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
      
      // Set user language from server
      // Priority: localStorage > user.language > default
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && savedLanguage !== i18n.language) {
        i18n.changeLanguage(savedLanguage);
      } else if (user.language && user.language !== i18n.language) {
        i18n.changeLanguage(user.language);
        localStorage.setItem('language', user.language);
      }
    }
    
    // Cleanup on unmount
    return () => {
      mounted = false;
      if (isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, user, dispatch, i18n]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} />} />
          <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/student" />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/student" />} />
          <Route path="/demo-test" element={<DemoTestPage />} />
        </Route>

        {/* Student routes */}
        <Route element={<PrivateRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/tests" element={<TestsPage />} />
            <Route path="/student/test/:type" element={<TestPage />} />
            <Route path="/student/results/:id" element={<ResultsPage />} />
            <Route path="/student/statistics" element={<StatisticsPage />} />
            <Route path="/student/payments" element={<PaymentsPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
            <Route path="/admin" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
            <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
            <Route path="/admin/users" element={<ErrorBoundary><UsersManagement /></ErrorBoundary>} />
            <Route path="/admin/users/:id" element={<ErrorBoundary><UserDetailsPage /></ErrorBoundary>} />
            <Route path="/admin/users/:id/edit" element={<ErrorBoundary><UserEditPage /></ErrorBoundary>} />
            <Route path="/admin/questions" element={<ErrorBoundary><QuestionsManagement /></ErrorBoundary>} />
            <Route path="/admin/topics" element={<ErrorBoundary><TopicsManagement /></ErrorBoundary>} />
            <Route path="/admin/tickets" element={<ErrorBoundary><TicketsManagement /></ErrorBoundary>} />
            <Route path="/admin/payments" element={<ErrorBoundary><PaymentsManagement /></ErrorBoundary>} />
            <Route path="/admin/reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
            <Route path="/admin/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: localStorage.getItem('theme') === 'dark' ? '#374151' : '#fff',
            color: localStorage.getItem('theme') === 'dark' ? '#fff' : '#374151',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              background: localStorage.getItem('theme') === 'dark' ? '#1F2937' : '#FEF2F2',
              color: localStorage.getItem('theme') === 'dark' ? '#F87171' : '#991B1B',
              border: localStorage.getItem('theme') === 'dark' ? '1px solid #374151' : '1px solid #FCA5A5',
            },
          },
        }}
      />
      </div>
    </Suspense>
    </ErrorBoundary>
  );
}

export default App;