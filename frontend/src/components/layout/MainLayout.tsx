import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopNavBar } from './TopNavBar';
import { tokens } from '@/theme/tokens';

export function MainLayout() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: tokens.colors.background }}>
      <SideNav />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          ml: `${tokens.spacing.sidebarWidth}px`,
        }}
      >
        <TopNavBar />
        <Box sx={{ flexGrow: 1, p: `${tokens.spacing.contentPadding}px`, mt: `${tokens.spacing.topBarHeight}px` }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
