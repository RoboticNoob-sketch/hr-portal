import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  LinearProgress,
  Skeleton,
  Chip,
} from '@mui/material';
import { EventNote, CheckCircle, Announcement, BeachAccess, LocalHospital, AttachMoney } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { useAttendanceClock } from '@/features/attendance/useAttendanceClock';
import { tokens } from '@/theme/tokens';
import type { EmployeeDashboardDto, ApiResponse } from '@/types';
import dayjs from '@/utils/dayjs';

function useEmployeeDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'employee'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<EmployeeDashboardDto>>('/api/dashboard/employee');
      return data.data!;
    },
  });
}

const leaveIcons: Record<string, React.ReactNode> = {
  Vacation: <BeachAccess />,
  Annual: <BeachAccess />,
  Sick: <LocalHospital />,
  Casual: <EventNote />,
};

const categoryColors: Record<string, string> = {
  News: tokens.colors.primary,
  Event: '#1565c0',
  Policy: '#e65100',
  General: tokens.colors.textSecondary,
};

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useEmployeeDashboard();
  const { clockInMutation, clockOutMutation } = useAttendanceClock();
  const isClockedIn = data?.todayAttendance?.isClockedIn;

  const todayDate = dayjs().format('dddd, MMMM D, YYYY');

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h2" fontWeight={700} gutterBottom>
            {isLoading ? <Skeleton width={300} /> : `Good ${getTimeOfDay()}, ${data?.profile.fullName.split(' ')[0] ?? 'there'}! 👋`}
          </Typography>
          <Typography variant="body1" color="text.secondary">{todayDate}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h3" fontWeight={700}>{dayjs().format('HH:mm')}</Typography>
          <Typography variant="body2" color="text.secondary">{dayjs().format('ddd')}</Typography>
        </Box>
      </Box>

      {/* Bento Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '308px 1fr', gap: 3 }}>
        {/* Left Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Profile Card */}
          <Card sx={{ height: 370 }}>
            <CardContent sx={{ p: 3 }}>
              {isLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      src={data?.profile.profilePhotoUrl}
                      sx={{ width: 64, height: 64, bgcolor: tokens.colors.primary, fontSize: '1.25rem' }}
                    >
                      {data?.profile.fullName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h4" fontWeight={700} noWrap>{data?.profile.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>{data?.profile.position}</Typography>
                      <Chip
                        label={data?.profile.employmentStatus}
                        size="small"
                        sx={{ mt: 0.5, backgroundColor: tokens.colors.chipGreen, color: tokens.colors.chipGreenText, fontWeight: 600, fontSize: '0.6875rem' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body2" fontWeight={500}>{data?.profile.department}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Employee #</Typography>
                      <Typography variant="body2" fontWeight={500}>{data?.profile.employeeNumber}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Position</Typography>
                      <Typography variant="body2" fontWeight={500}>{data?.profile.position}</Typography>
                    </Box>
                  </Box>

                  <Button variant="outlined" fullWidth sx={{ borderColor: tokens.colors.divider, color: tokens.colors.textPrimary }} onClick={() => data?.profile.employeeId && navigate(`/employees/${data.profile.employeeId}`)}>
                    View Full Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clock In/Out Card */}
          <Card sx={{ backgroundColor: tokens.colors.primary, color: 'white', height: 272, position: 'relative', overflow: 'hidden' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>Time Tracking</Typography>
                <Chip label="Today" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.75rem' }} />
              </Box>

              {isLoading ? (
                <Skeleton variant="rectangular" height={100} sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
              ) : (
                <>
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>
                      {data?.todayAttendance?.isClockedIn ? 'Clocked In Since' : 'Total Hours'}
                    </Typography>
                    <Typography variant="h1" sx={{ color: 'white', fontWeight: 700, fontSize: '2.5rem' }}>
                      {data?.todayAttendance?.clockIn
                        ? dayjs(data.todayAttendance.clockIn).format('HH:mm')
                        : data?.todayAttendance?.totalHours ?? '0:00'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={isClockedIn ? clockOutMutation.isPending : clockInMutation.isPending}
                      onClick={() => (isClockedIn ? clockOutMutation : clockInMutation).mutate()}
                      sx={{ backgroundColor: 'white', color: tokens.colors.primary, fontWeight: 600, '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' } }}
                    >
                      {isClockedIn ? 'Clock Out' : 'Clock In'}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/attendance')}
                      sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', fontWeight: 600, '&:hover': { borderColor: 'white' } }}
                    >
                      View Attendance
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Leave Balance Cards */}
          {isLoading ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={186} sx={{ borderRadius: `${tokens.borderRadius.card}px` }} />)}
            </Box>
          ) : data?.leaveBalances.length === 0 ? (
            <Card><CardContent sx={{ p: 3 }}><Typography color="text.secondary">No leave balances assigned yet.</Typography></CardContent></Card>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {data?.leaveBalances.map((lb) => (
                <Card key={lb.leaveType}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{ width: 34, height: 42, backgroundColor: 'rgba(183,0,17,0.08)', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colors.primary }}>
                        {leaveIcons[lb.leaveType] ?? <EventNote />}
                      </Box>
                      <Typography variant="h2" fontWeight={700} sx={{ color: tokens.colors.textPrimary }}>
                        {lb.remaining}
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight={600} gutterBottom>{lb.leaveType} Leave</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                      {lb.used} day{lb.used !== 1 ? 's' : ''} used
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={lb.total > 0 ? (lb.used / lb.total) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: tokens.colors.divider,
                        '& .MuiLinearProgress-bar': { backgroundColor: tokens.colors.primary, borderRadius: 3 },
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Bottom Row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {/* Announcements */}
            <Card>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, borderBottom: `1px solid ${tokens.colors.divider}` }}>
                  <Typography variant="h4">Announcements</Typography>
                  <Button size="small" sx={{ color: tokens.colors.primary, fontSize: '0.75rem' }} onClick={() => navigate('/announcements')}>See All</Button>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {isLoading ? (
                    <Skeleton variant="rectangular" height={150} />
                  ) : (
                    (data?.recentAnnouncements ?? []).slice(0, 3).map((ann) => (
                      <Box key={ann.id} sx={{ display: 'flex', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            backgroundColor: 'rgba(183,0,17,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: tokens.colors.primary,
                          }}
                        >
                          <Announcement />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{ann.title}</Typography>
                          <Typography variant="caption" sx={{ color: categoryColors[ann.category] ?? tokens.colors.textSecondary }}>
                            {ann.category}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {dayjs(ann.publishDate).fromNow()}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>Quick Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                  {[
                    { label: 'Apply for Leave', icon: <BeachAccess />, path: '/leave' },
                    { label: 'View Payslip', icon: <AttachMoney />, path: '/payroll' },
                    { label: 'View Attendance', icon: <EventNote />, path: '/attendance' },
                    { label: 'Update Profile', icon: <CheckCircle />, path: data?.profile.employeeId ? `/employees/${data.profile.employeeId}` : '/dashboard/employee' },
                  ].map(({ label, icon, path }) => (
                    <Button
                      key={label}
                      variant="outlined"
                      startIcon={icon}
                      fullWidth
                      onClick={() => navigate(path)}
                      sx={{
                        justifyContent: 'flex-start',
                        borderColor: tokens.colors.divider,
                        color: tokens.colors.textPrimary,
                        fontWeight: 400,
                        fontSize: '0.875rem',
                        '&:hover': { borderColor: tokens.colors.primary, color: tokens.colors.primary, backgroundColor: 'rgba(183,0,17,0.04)' },
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
