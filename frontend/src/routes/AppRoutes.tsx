import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'));

// Dashboard
const HrDashboardPage = lazy(() => import('@/features/dashboard/HrDashboardPage'));
const EmployeeDashboardPage = lazy(() => import('@/features/dashboard/EmployeeDashboardPage'));

// Users
const UserManagementPage = lazy(() => import('@/features/users/UserManagementPage'));

// Announcements
const AnnouncementsPage = lazy(() => import('@/features/announcements/AnnouncementsPage'));

// Phase 2+ placeholders
const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage'));
const AttendancePage = lazy(() => import('@/features/attendance/AttendancePage'));
const LeavePage = lazy(() => import('@/features/leave/LeavePage'));
const PayrollPage = lazy(() => import('@/features/payroll/PayrollPage'));
const RecruitmentPage = lazy(() => import('@/features/recruitment/RecruitmentPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));

const Loader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress color="primary" />
  </Box>
);

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !hasRole(roles)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function DashboardRedirect() {
  const { hasRole } = useAuth();
  if (hasRole(['Admin', 'HR', 'Manager'])) return <Navigate to="/dashboard/hr" replace />;
  return <Navigate to="/dashboard/employee" replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route
            path="/dashboard/hr"
            element={
              <ProtectedRoute roles={['Admin', 'HR', 'Manager']}>
                <HrDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/employee" element={<EmployeeDashboardPage />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['Admin', 'HR']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
