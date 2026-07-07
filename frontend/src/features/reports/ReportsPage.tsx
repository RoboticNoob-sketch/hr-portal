// Phase 7 — Reports
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ReportsPage() {
  return (
    <Box>
      <PageHeader title="Reports" subtitle="Attendance, payroll, and employee reports" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Reports and exports coming in Phase 7</Typography>
      </Box>
    </Box>
  );
}
