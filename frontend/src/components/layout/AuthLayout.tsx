import { Box } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { tokens } from '@/theme/tokens';

export function AuthLayout() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: tokens.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Outlet />
    </Box>
  );
}
