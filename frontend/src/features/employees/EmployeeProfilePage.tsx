import {
  Box, Button, Card, CardContent, Typography, Avatar, Divider, CircularProgress,
  Chip, IconButton,
} from '@mui/material';
import { ArrowBack, Edit, Email, Phone, LocationOn, Badge, Business, WorkOutline } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EmployeeFormDialog } from '@/features/employees/EmployeeFormDialog';
import { apiClient } from '@/services/apiClient';
import { StatusChip } from '@/components/ui/StatusChip';
import { tokens } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, EmployeeDetailDto } from '@/types';
import dayjs from 'dayjs';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: `1px solid ${tokens.colors.divider}` }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
    </Box>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole(['Admin', 'HR']);
  const [editOpen, setEditOpen] = useState(false);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EmployeeDetailDto>>(`/api/employees/${id}`);
      return data.data!;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  if (error || !employee) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography color="error" gutterBottom>Employee not found</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/employees')}>Back to Directory</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/employees')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h2" fontWeight={700}>Employee Profile</Typography>
          <Typography variant="body2" color="text.secondary">{employee.employeeNumber}</Typography>
        </Box>
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Profile Header Card */}
        <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar
                src={employee.profilePhotoUrl}
                sx={{ width: 96, height: 96, mx: 'auto', mb: 2, bgcolor: tokens.colors.primary, fontSize: '2rem' }}
              >
                {employee.firstName[0]}{employee.lastName[0]}
              </Avatar>
              <Typography variant="h3" fontWeight={700} gutterBottom>{employee.fullName}</Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>{employee.positionTitle ?? 'No position assigned'}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1, mb: 3 }}>
                <StatusChip status={employee.status} />
                {employee.departmentName && (
                  <Chip icon={<Business sx={{ fontSize: '14px !important' }} />} label={employee.departmentName} size="small" variant="outlined" />
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2">{employee.email}</Typography>
                </Box>
                {employee.phoneNumber && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2">{employee.phoneNumber}</Typography>
                  </Box>
                )}
                {employee.address && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary', mt: 0.25 }} />
                    <Typography variant="body2">{[employee.address, employee.city, employee.province].filter(Boolean).join(', ')}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

        {/* Details */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <WorkOutline sx={{ color: 'primary.main' }} />
                  <Typography variant="h4">Employment Information</Typography>
                </Box>
                <InfoRow label="Employee Number" value={employee.employeeNumber} />
                <InfoRow label="Department" value={employee.departmentName} />
                <InfoRow label="Position" value={employee.positionTitle} />
                <InfoRow label="Manager" value={employee.managerName} />
                <InfoRow label="Employment Type" value={employee.employmentType} />
                <InfoRow label="Hire Date" value={dayjs(employee.hireDate).format('MMMM D, YYYY')} />
                <InfoRow label="Regularization Date" value={employee.regularizationDate ? dayjs(employee.regularizationDate).format('MMMM D, YYYY') : undefined} />
                <InfoRow label="Status" value={employee.status} />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Badge sx={{ color: 'primary.main' }} />
                  <Typography variant="h4">Personal Information</Typography>
                </Box>
                <InfoRow label="Date of Birth" value={employee.dateOfBirth ? dayjs(employee.dateOfBirth).format('MMMM D, YYYY') : undefined} />
                <InfoRow label="Gender" value={employee.gender} />
                <InfoRow label="Civil Status" value={employee.civilStatus} />
                <InfoRow label="Nationality" value={employee.nationality} />
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Government IDs</Typography>
                <InfoRow label="SSS Number" value={employee.sssNumber} />
                <InfoRow label="PhilHealth Number" value={employee.philHealthNumber} />
                <InfoRow label="Pag-IBIG Number" value={employee.pagIbigNumber} />
                <InfoRow label="TIN Number" value={employee.tinNumber} />
              </CardContent>
            </Card>
        </Box>
      </Box>

      {employee && (
        <EmployeeFormDialog
          open={editOpen}
          mode="edit"
          employee={employee}
          onClose={() => setEditOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['employee', id] })}
        />
      )}
    </Box>
  );
}
