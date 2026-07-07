import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { tokens } from '@/theme/tokens';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; isUp: boolean };
  iconBgColor?: string;
}

export function StatCard({ title, value, icon, trend, iconBgColor = 'rgba(183,0,17,0.08)' }: StatCardProps) {
  return (
    <Card sx={{ height: 170, position: 'relative' }}>
      <CardContent sx={{ p: `${tokens.spacing.cardPadding}px !important` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: iconBgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.colors.primary,
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              icon={trend.isUp ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
              label={trend.value}
              size="small"
              sx={{
                backgroundColor: trend.isUp ? tokens.colors.chipGreen : tokens.colors.chipRed,
                color: trend.isUp ? tokens.colors.chipGreenText : tokens.colors.chipRedText,
                fontWeight: 600,
                fontSize: '0.6875rem',
                height: 20,
                '& .MuiChip-icon': { color: 'inherit' },
              }}
            />
          )}
        </Box>
        <Typography
          variant="overline"
          sx={{ color: tokens.colors.textSecondary, display: 'block', mb: 0.5, fontWeight: 500 }}
        >
          {title}
        </Typography>
        <Typography variant="h2" sx={{ fontWeight: 700, fontSize: '2rem', color: tokens.colors.textPrimary }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}
