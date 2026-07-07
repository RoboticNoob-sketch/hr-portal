import {
  AppBar,
  Toolbar,
  InputAdornment,
  TextField,
  IconButton,
  Badge,
  Avatar,
  Box,
  Typography,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { Search, Notifications, Settings, Logout, AccountCircle } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { tokens } from '@/theme/tokens';

export function TopNavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ left: tokens.spacing.sidebarWidth, width: `calc(100% - ${tokens.spacing.sidebarWidth}px)` }}>
      <Toolbar sx={{ height: tokens.spacing.topBarHeight, px: 3, gap: 2 }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search employees, files, or reports..."
          sx={{ flexGrow: 1, maxWidth: 420, '& .MuiOutlinedInput-root': { height: 36 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: tokens.colors.textSecondary }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <IconButton size="small" onClick={() => navigate('/notifications')}>
          <Badge badgeContent={3} color="error">
            <Notifications sx={{ color: tokens.colors.textSecondary }} />
          </Badge>
        </IconButton>

        <IconButton size="small" onClick={() => navigate('/settings')}>
          <Settings sx={{ color: tokens.colors.textSecondary }} />
        </IconButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* User Menu */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={handleMenuOpen}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: tokens.colors.primary, fontSize: '0.8rem' }}>
            {user?.firstName[0]}{user?.lastName[0]}
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.colors.textSecondary }}>
              {user?.roles[0]}
            </Typography>
          </Box>
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
            <AccountCircle sx={{ mr: 1 }} /> My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
            <Settings sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <Logout sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
