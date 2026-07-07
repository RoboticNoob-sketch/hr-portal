import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.colors.primary,
      dark: tokens.colors.primaryDark,
      light: tokens.colors.primaryLight,
      contrastText: '#ffffff',
    },
    background: {
      default: tokens.colors.background,
      paper: tokens.colors.paper,
    },
    text: {
      primary: tokens.colors.textPrimary,
      secondary: tokens.colors.textSecondary,
      disabled: tokens.colors.textDisabled,
    },
    divider: tokens.colors.divider,
    error: { main: tokens.colors.error },
    success: { main: tokens.colors.success },
    warning: { main: tokens.colors.warning },
    info: { main: tokens.colors.info },
  },
  typography: {
    fontFamily: tokens.typography.fontFamily,
    fontWeightRegular: tokens.typography.fontWeightRegular,
    fontWeightMedium: tokens.typography.fontWeightMedium,
    fontWeightBold: tokens.typography.fontWeightBold,
    h1: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.8px' },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    h5: { fontSize: '0.875rem', fontWeight: 600 },
    h6: { fontSize: '0.75rem', fontWeight: 600 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    overline: { fontSize: '0.625rem', fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase' },
  },
  shape: {
    borderRadius: tokens.borderRadius.input,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.colors.background,
        },
        '*': { boxSizing: 'border-box' },
        '::-webkit-scrollbar': { width: 6 },
        '::-webkit-scrollbar-track': { background: tokens.colors.background },
        '::-webkit-scrollbar-thumb': { background: tokens.colors.divider, borderRadius: 3 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.button,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
        },
        containedPrimary: {
          backgroundColor: tokens.colors.primary,
          '&:hover': { backgroundColor: tokens.colors.primaryDark },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'medium' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.borderRadius.input,
            backgroundColor: tokens.colors.paper,
            '& fieldset': { borderColor: tokens.colors.divider },
            '&:hover fieldset': { borderColor: tokens.colors.primary },
            '&.Mui-focused fieldset': { borderColor: tokens.colors.primary },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.card,
          border: `1px solid ${tokens.colors.divider}`,
          boxShadow: tokens.shadows.card,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          width: tokens.spacing.sidebarWidth,
          borderRight: `1px solid ${tokens.colors.divider}`,
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.colors.paper,
          color: tokens.colors.textPrimary,
          boxShadow: 'none',
          borderBottom: `1px solid ${tokens.colors.divider}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.borderRadius.chip,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '0 8px',
          width: 'calc(100% - 16px)',
          '&.Mui-selected': {
            backgroundColor: 'rgba(183,0,17,0.08)',
            color: tokens.colors.primary,
            borderLeft: `3px solid ${tokens.colors.primary}`,
            paddingLeft: '13px',
            '& .MuiListItemIcon-root': { color: tokens.colors.primary },
            '&:hover': { backgroundColor: 'rgba(183,0,17,0.12)' },
          },
          '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 40 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: tokens.colors.background,
          fontWeight: 600,
          fontSize: '0.75rem',
          color: tokens.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        },
      },
    },
  },
});
