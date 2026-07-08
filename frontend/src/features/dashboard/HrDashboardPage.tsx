import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  People,
  WorkOutline,
  AttachMoney,
  CheckCircle,
  PersonAdd,
  Event,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { tokens } from '@/theme/tokens';
import type { HrDashboardDto, ApiResponse } from '@/types';
import { toast } from 'react-toastify';

function useHrDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'hr'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<HrDashboardDto>>('/api/dashboard/hr');
      return data.data!;
    },
  });
}

const emptyDashboard: HrDashboardDto = {
  totalEmployees: 0,
  activeHirings: 0,
  pendingLeaveRequests: 0,
  payrollStatus: '—',
  recentActivities: [],
  pendingApprovals: [],
  attendanceSummary: { bars: [] },
};

const activityIconMap: Record<string, React.ReactNode> = {
  person: <PersonAdd sx={{ fontSize: 16 }} />,
  check: <CheckCircle sx={{ fontSize: 16 }} />,
  payments: <AttachMoney sx={{ fontSize: 16 }} />,
  event: <Event sx={{ fontSize: 16 }} />,
};

export default function HrDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: rawData, isLoading, isError } = useHrDashboard();
  const data = rawData ?? emptyDashboard;
  const chartBars = data.attendanceSummary?.bars ?? [];
  const recentActivities = data.recentActivities ?? [];
  const pendingApprovals = data.pendingApprovals ?? [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.post(`/api/leave/requests/${id}/review`, { approve }),
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leave'] });
      toast.success(approve ? 'Leave approved.' : 'Leave rejected.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Review failed.');
    },
  });

  return (
    <Box>
      <PageHeader
        title="System Overview"
        subtitle={isError ? 'Unable to load dashboard data. Showing empty state.' : "Welcome back. Here's what's happening today."}
      />

      {/* Stat Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={170} sx={{ borderRadius: `${tokens.borderRadius.card}px` }} />
          ))
        ) : (
          <>
            <StatCard
              title="TOTAL EMPLOYEES"
              value={data?.totalEmployees?.toLocaleString() ?? '—'}
              icon={<People />}
              trend={{ value: '+2.5%', isUp: true }}
            />
            <StatCard
              title="ACTIVE HIRINGS"
              value={data?.activeHirings ?? '—'}
              icon={<PersonAdd />}
              trend={{ value: '+8%', isUp: true }}
            />
            <StatCard
              title="LEAVE REQUESTS"
              value={data?.pendingLeaveRequests ?? '—'}
              icon={<WorkOutline />}
              trend={{ value: '3 new', isUp: false }}
            />
            <StatCard
              title="PAYROLL STATUS"
              value={data?.payrollStatus ?? '—'}
              icon={<AttachMoney />}
            />
          </>
        )}
      </Box>

      {/* Main Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 3 }}>
        {/* Attendance Chart Placeholder */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h4" gutterBottom>Attendance Overview</Typography>
                <Typography variant="body2" color="text.secondary">Monthly attendance trends</Typography>
              </Box>
              <Button size="small" variant="outlined" sx={{ fontSize: '0.75rem', height: 32 }}>This Year</Button>
            </Box>
            {isLoading ? (
              <Skeleton variant="rectangular" height={230} />
            ) : chartBars.length === 0 ? (
              <Box sx={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No attendance data yet.</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 230 }}>
                {chartBars.map((bar) => {
                  const presentHeight = Math.max(4, Math.round((bar.present / 100) * 180));
                  const absentHeight = Math.max(4, Math.round((bar.absent / 100) * 180));
                  return (
                  <Box key={bar.month} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1, justifyContent: 'flex-end' }}>
                      <Box sx={{ width: '40%', mx: 'auto', height: `${presentHeight}px`, backgroundColor: tokens.colors.primary, borderRadius: '3px 3px 0 0' }} />
                      <Box sx={{ width: '40%', mx: 'auto', height: `${absentHeight}px`, backgroundColor: tokens.colors.divider, borderRadius: '3px 3px 0 0' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">{bar.month}</Typography>
                  </Box>
                  );
                })}
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: tokens.colors.primary }} />
                <Typography variant="caption">Present</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: 0.5, backgroundColor: tokens.colors.divider }} />
                <Typography variant="caption">Absent</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">Recent Activity</Typography>
              <Button size="small" sx={{ color: tokens.colors.primary, fontSize: '0.75rem' }} onClick={() => navigate('/leave')}>View All</Button>
            </Box>
            {isLoading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : (
              <Box sx={{ position: 'relative', pl: 2.5 }}>
                <Box sx={{ position: 'absolute', left: 9, top: 0, bottom: 0, width: 2, backgroundColor: tokens.colors.divider }} />
                {recentActivities.length === 0 ? (
                  <Typography color="text.secondary">No recent activity.</Typography>
                ) : recentActivities.map((act, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 3, position: 'relative' }}>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -16,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: `2px solid ${tokens.colors.divider}`,
                        backgroundColor: tokens.colors.paper,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: tokens.colors.textSecondary,
                      }}
                    >
                      {activityIconMap[act.iconType] ?? <Event sx={{ fontSize: 16 }} />}
                    </Box>
                    <Box sx={{ pl: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{act.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{act.description}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: tokens.colors.primary, mt: 0.25 }}>{act.timeAgo}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Pending Approvals Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
            <Typography variant="h4">Pending Approvals</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" size="small" onClick={() => navigate('/leave')}>View All</Button>
            </Box>
          </Box>
          {isLoading ? (
            <Box sx={{ p: 3 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingApprovals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No pending approvals</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingApprovals.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, backgroundColor: tokens.colors.primary, fontSize: '0.75rem' }}>
                            {row.employeeAvatar}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{row.employeeName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{row.department}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{row.type}</Typography></TableCell>
                      <TableCell><StatusChip status={row.status} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="text" sx={{ color: tokens.colors.primary, mr: 0.5, fontSize: '0.75rem' }} disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: row.id, approve: true })}>Approve</Button>
                        <Button size="small" variant="text" color="error" sx={{ fontSize: '0.75rem' }} disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: row.id, approve: false })}>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
