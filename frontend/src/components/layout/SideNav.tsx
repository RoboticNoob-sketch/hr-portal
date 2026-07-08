import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  People,
  AttachMoney,
  EventNote,
  WorkOutline,
  BarChart,
  Settings,
  Logout,
  Announcement,
  PersonAdd,
  Business,
  Badge,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { tokens } from '@/theme/tokens';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
  { label: 'Employees', path: '/employees', icon: <People />, roles: ['Admin', 'HR', 'Manager'] },
  { label: 'Departments', path: '/departments', icon: <Business />, roles: ['Admin', 'HR'] },
  { label: 'Positions', path: '/positions', icon: <Badge />, roles: ['Admin', 'HR'] },
  { label: 'Attendance', path: '/attendance', icon: <EventNote /> },
  { label: 'Leave', path: '/leave', icon: <WorkOutline /> },
  { label: 'Payroll', path: '/payroll', icon: <AttachMoney /> },
  { label: 'Recruitment', path: '/recruitment', icon: <PersonAdd />, roles: ['Admin', 'HR'] },
  { label: 'Announcements', path: '/announcements', icon: <Announcement /> },
  { label: 'Reports', path: '/reports', icon: <BarChart />, roles: ['Admin', 'HR', 'Manager'] },
  { label: 'Users', path: '/users', icon: <Settings />, roles: ['Admin', 'HR'] },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole, logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname.startsWith('/dashboard');
    if (path === '/employees') return location.pathname.startsWith('/employees');
    return location.pathname.startsWith(path);
  };

  const visibleItems = navItems.filter((item) => !item.roles || hasRole(item.roles));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: tokens.spacing.sidebarWidth,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        '& .MuiDrawer-paper': {
          width: tokens.spacing.sidebarWidth,
          position: 'fixed',
          height: '100vh',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: `${tokens.borderRadius.badge}px`,
            backgroundColor: tokens.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <People sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ color: tokens.colors.textPrimary, lineHeight: 1.2 }}>
            HRMS
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.colors.textSecondary }}>
            Portal
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* User Info */}
      {user && (
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: tokens.colors.primary, fontSize: '0.875rem' }}>
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {user.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.colors.textSecondary }}>
                {user.roles[0]}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, pt: 1, px: 0 }}>
        {visibleItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={isActive(item.path)}
            onClick={() => navigate(item.path)}
            sx={{ mb: 0.25 }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? tokens.colors.primary : tokens.colors.textSecondary }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9375rem',
                fontWeight: isActive(item.path) ? 600 : 400,
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Bottom Actions */}
      <List sx={{ py: 1, px: 0 }}>
        <ListItemButton onClick={() => navigate('/settings')} sx={{ mb: 0.25 }}>
          <ListItemIcon sx={{ color: tokens.colors.textSecondary }}>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.9375rem' }} />
        </ListItemButton>
        <ListItemButton onClick={logout}>
          <ListItemIcon sx={{ color: tokens.colors.textSecondary }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.9375rem' }} />
        </ListItemButton>
      </List>
    </Drawer>
  );
}
