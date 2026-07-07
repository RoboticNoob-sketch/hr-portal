// Phase 5 — Recruitment
// Figma: Recruitment Pipeline (1:1306)
import { Box, Typography } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';

export default function RecruitmentPage() {
  return (
    <Box>
      <PageHeader title="Recruitment" subtitle="Applicant pipeline and hiring" />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Typography color="text.secondary">Recruitment module coming in Phase 5</Typography>
      </Box>
    </Box>
  );
}
