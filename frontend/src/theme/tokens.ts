// Figma Red Theme design tokens
// Source: https://www.figma.com/design/mGO3ibXYKaqOO3EZyegfLG/hr-portal (node 0:1)

export const tokens = {
  colors: {
    primary: '#b70011',
    primaryDark: '#8b000d',
    primaryLight: '#e8002a',
    background: '#f8f9fa',
    paper: '#ffffff',
    textPrimary: '#191c1d',
    textSecondary: '#5e5e5e',
    textDisabled: 'rgba(94,94,94,0.5)',
    divider: '#e1e3e4',
    sidebar: '#ffffff',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
    chipGreen: '#e8f5e9',
    chipGreenText: '#2e7d32',
    chipRed: '#ffebee',
    chipRedText: '#c62828',
    chipOrange: '#fff3e0',
    chipOrangeText: '#e65100',
  },
  spacing: {
    sidebarWidth: 260,
    topBarHeight: 64,
    contentPadding: 24,
    cardPadding: 25,
    formPadding: 41,
  },
  borderRadius: {
    input: 8,
    card: 12,
    button: 8,
    avatar: 50,
    badge: 12,
    chip: 4,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightSemiBold: 600,
    fontWeightBold: 700,
  },
  shadows: {
    card: '0px 1px 3px 0px rgba(0,0,0,0.05), 0px 1px 2px -1px rgba(0,0,0,0.05)',
    button: '0px 1px 3px 0px rgba(183,0,17,0.2)',
  },
} as const;
