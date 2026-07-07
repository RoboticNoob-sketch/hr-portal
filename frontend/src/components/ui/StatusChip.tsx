import { Chip } from '@mui/material';
import { tokens } from '@/theme/tokens';

interface StatusChipProps {
  status: string;
}

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  Active: { bg: tokens.colors.chipGreen, color: tokens.colors.chipGreenText, label: 'Active' },
  Inactive: { bg: tokens.colors.chipRed, color: tokens.colors.chipRedText, label: 'Inactive' },
  Pending: { bg: tokens.colors.chipOrange, color: tokens.colors.chipOrangeText, label: 'Pending' },
  Approved: { bg: tokens.colors.chipGreen, color: tokens.colors.chipGreenText, label: 'Approved' },
  Rejected: { bg: tokens.colors.chipRed, color: tokens.colors.chipRedText, label: 'Rejected' },
  Ready: { bg: tokens.colors.chipGreen, color: tokens.colors.chipGreenText, label: 'Ready' },
};

export function StatusChip({ status }: StatusChipProps) {
  const config = statusConfig[status] ?? {
    bg: 'rgba(0,0,0,0.08)',
    color: tokens.colors.textSecondary,
    label: status,
  };

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.6875rem',
        borderRadius: '4px',
      }}
    />
  );
}
