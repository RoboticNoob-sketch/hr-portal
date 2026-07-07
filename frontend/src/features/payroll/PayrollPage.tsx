// Phase 4 — Payroll
// Figma: Payroll Overview (1:605)
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function PayrollPage() {
  return (
    <Box>
      <PageHeader title="Payroll" subtitle="Payroll processing, payslips, and history" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Payroll module coming in Phase 4</Typography>
      </Box>
    </Box>
  );
}
