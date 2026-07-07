// Phase 2 — Employee Management
// Figma: Employee Directory (1:1936), Employee Profile (1:414)
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function EmployeesPage() {
  return (
    <Box>
      <PageHeader title="Employees" subtitle="Employee directory and profiles" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Employee management coming in Phase 2</Typography>
      </Box>
    </Box>
  );
}
