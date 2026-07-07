// Phase 3 — Leave Management
// Figma: Leave Management (1:925)
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function LeavePage() {
  return (
    <Box>
      <PageHeader title="Leave Management" subtitle="Leave requests, balances, and approvals" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Leave management coming in Phase 3</Typography>
      </Box>
    </Box>
  );
}
