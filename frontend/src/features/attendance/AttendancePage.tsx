// Phase 3 — Attendance Management
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function AttendancePage() {
  return (
    <Box>
      <PageHeader title="Attendance" subtitle="Track clock in/out and shifts" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Attendance management coming in Phase 3</Typography>
      </Box>
    </Box>
  );
}
