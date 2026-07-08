import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress, Chip, Pagination, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, IconButton, Tooltip, Grid,
} from '@mui/material';
import { Add, Check, Close, Cancel } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, LeaveBalanceDto, LeaveRequestDto, PagedResult } from '@/types';
import { LEAVE_TYPES, LEAVE_STATUSES } from '@/types';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const leaveSchema = z.object({
  leaveType: z.enum(LEAVE_TYPES),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required').max(1000),
}).refine((d) => d.endDate >= d.startDate, { message: 'End date must be on or after start date', path: ['endDate'] });

type LeaveFormData = z.infer<typeof leaveSchema>;
type LeaveTab = 'mine' | 'pending' | 'history' | 'all';

function LeaveRequestTable({
  rows,
  showEmployee,
  showReview,
  onCancel,
  onReview,
}: {
  rows: LeaveRequestDto[];
  showEmployee?: boolean;
  showReview?: boolean;
  onCancel?: (id: string) => void;
  onReview?: (req: LeaveRequestDto) => void;
}) {
  const colSpan = 5 + (showEmployee ? 1 : 0) + (showReview ? 1 : 0) + (onCancel ? 1 : 0) + (onReview ? 1 : 0);

  return (
    <Table>
      <TableHead>
        <TableRow>
          {showEmployee && <TableCell>Employee</TableCell>}
          <TableCell>Type</TableCell>
          <TableCell>Dates</TableCell>
          <TableCell>Days</TableCell>
          <TableCell>Reason</TableCell>
          <TableCell>Status</TableCell>
          {showReview && <TableCell>Review</TableCell>}
          {(onCancel || onReview) && <TableCell align="right">Actions</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} align="center" sx={{ py: 6 }}>
              <Typography color="text.secondary">No records found</Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((req) => (
            <TableRow key={req.id} hover>
              {showEmployee && (
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{req.employeeName}</Typography>
                  <Typography variant="caption" color="text.secondary">{req.departmentName ?? '—'}</Typography>
                </TableCell>
              )}
              <TableCell><Chip label={req.leaveType} size="small" variant="outlined" /></TableCell>
              <TableCell>{dayjs(req.startDate).format('MMM D')} – {dayjs(req.endDate).format('MMM D, YYYY')}</TableCell>
              <TableCell>{req.totalDays}</TableCell>
              <TableCell><Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{req.reason}</Typography></TableCell>
              <TableCell><StatusChip status={req.status} /></TableCell>
              {showReview && (
                <TableCell>
                  {req.reviewedBy ? (
                    <Box>
                      <Typography variant="caption" display="block">{req.reviewedBy}</Typography>
                      {req.reviewNotes && <Typography variant="caption" color="text.secondary">{req.reviewNotes}</Typography>}
                    </Box>
                  ) : '—'}
                </TableCell>
              )}
              {(onCancel || onReview) && (
                <TableCell align="right">
                  {onCancel && req.status === 'Pending' && (
                    <Tooltip title="Cancel">
                      <IconButton size="small" color="error" onClick={() => onCancel(req.id)}>
                        <Cancel sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onReview && req.status === 'Pending' && (
                    <Tooltip title="Review">
                      <IconButton size="small" color="primary" onClick={() => onReview(req)}>
                        <Check sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default function LeavePage() {
  const { hasRole } = useAuth();
  const canApprove = hasRole(['Admin', 'HR', 'Manager']);
  const canViewAll = hasRole(['Admin', 'HR']);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<LeaveTab>('mine');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<LeaveRequestDto | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['leave', 'balances'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<LeaveBalanceDto[]>>('/api/leave/balances/me');
      return data.data ?? [];
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['leave', 'requests', 'me', page],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<LeaveRequestDto>>>('/api/leave/requests/me', {
        params: { page, pageSize: 10 },
      });
      return data.data!;
    },
    enabled: tab === 'mine',
  });

  const { data: pending, isLoading: pendingLoading } = useQuery({
    queryKey: ['leave', 'pending', page],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<LeaveRequestDto>>>('/api/leave/requests/pending', {
        params: { page, pageSize: 10 },
      });
      return data.data!;
    },
    enabled: canApprove && tab === 'pending',
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['leave', 'reviewed', page],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<LeaveRequestDto>>>('/api/leave/requests/reviewed', {
        params: { page, pageSize: 10 },
      });
      return data.data!;
    },
    enabled: canApprove && tab === 'history',
  });

  const { data: allRequests, isLoading: allLoading } = useQuery({
    queryKey: ['leave', 'all', page, statusFilter],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<LeaveRequestDto>>>('/api/leave/requests/all', {
        params: { page, pageSize: 10, status: statusFilter || undefined },
      });
      return data.data!;
    },
    enabled: canViewAll && tab === 'all',
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<LeaveFormData>({
    resolver: zodResolver(leaveSchema),
    defaultValues: { leaveType: 'Vacation', startDate: '', endDate: '', reason: '' },
  });

  const invalidateLeave = () => {
    queryClient.invalidateQueries({ queryKey: ['leave'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const createMutation = useMutation({
    mutationFn: (body: LeaveFormData) => apiClient.post('/api/leave/requests', {
      leaveType: body.leaveType,
      startDate: dayjs(body.startDate).toISOString(),
      endDate: dayjs(body.endDate).toISOString(),
      reason: body.reason,
    }),
    onSuccess: () => {
      invalidateLeave();
      toast.success('Leave request submitted.');
      setDialogOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submit failed.');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiClient.post(`/api/leave/requests/${id}/review`, { approve, reviewNotes: reviewNotes || undefined }),
    onSuccess: (_, { approve }) => {
      invalidateLeave();
      toast.success(approve ? 'Leave approved.' : 'Leave rejected.');
      setReviewOpen(false);
      setReviewTarget(null);
      setReviewNotes('');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Review failed.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/leave/requests/${id}/cancel`),
    onSuccess: () => {
      invalidateLeave();
      toast.success('Leave request cancelled.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Cancel failed.');
    },
  });

  const switchTab = (value: LeaveTab) => {
    setTab(value);
    setPage(1);
  };

  const activeData = tab === 'mine' ? requests : tab === 'pending' ? pending : tab === 'history' ? history : allRequests;
  const isLoading = tab === 'mine' ? requestsLoading : tab === 'pending' ? pendingLoading : tab === 'history' ? historyLoading : allLoading;

  return (
    <Box>
      <PageHeader
        title="Leave Management"
        subtitle="Leave balances, requests, and approvals"
        actions={tab === 'mine' && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { reset({ leaveType: 'Vacation', startDate: '', endDate: '', reason: '' }); setDialogOpen(true); }}>
            Request Leave
          </Button>
        )}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {balancesLoading ? (
          <Grid item xs={12}><Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box></Grid>
        ) : balances?.length === 0 ? (
          <Grid item xs={12}><Typography color="text.secondary">No leave balances available for your account.</Typography></Grid>
        ) : (
          balances?.map((b) => (
            <Grid item xs={12} sm={6} md={4} key={b.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="overline" color="text.secondary">{b.leaveType}</Typography>
                  <Typography variant="h3" fontWeight={700} color="primary.main">{b.remainingDays}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    remaining of {b.totalEntitlement} · used {b.usedDays}{b.pendingDays > 0 ? ` · pending ${b.pendingDays}` : ''}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => switchTab(v)} sx={{ mb: 2 }}>
        <Tab value="mine" label="My Requests" />
        {canApprove && <Tab value="pending" label={`Pending${pending?.totalCount ? ` (${pending.totalCount})` : ''}`} />}
        {canApprove && <Tab value="history" label="Review History" />}
        {canViewAll && <Tab value="all" label="All Requests" />}
      </Tabs>

      {tab === 'all' && (
        <Box sx={{ mb: 2 }}>
          <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All</MenuItem>
            {LEAVE_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <LeaveRequestTable
                rows={activeData?.items ?? []}
                showEmployee={tab !== 'mine'}
                showReview={tab === 'mine' || tab === 'history' || tab === 'all'}
                onCancel={tab === 'mine' ? (id) => cancelMutation.mutate(id) : undefined}
                onReview={tab === 'pending' ? (req) => { setReviewTarget(req); setReviewNotes(''); setReviewOpen(true); } : undefined}
              />
              {(activeData?.totalPages ?? 0) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Pagination count={activeData?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Box component="form" id="leave-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Controller name="leaveType" control={control} render={({ field }) => (
              <TextField select label="Leave Type" fullWidth {...field} error={!!errors.leaveType}>
                {LEAVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            )} />
            <TextField label="Start Date" type="date" fullWidth {...register('startDate')} error={!!errors.startDate} helperText={errors.startDate?.message} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" fullWidth {...register('endDate')} error={!!errors.endDate} helperText={errors.endDate?.message} InputLabelProps={{ shrink: true }} />
            <TextField label="Reason" fullWidth multiline rows={3} {...register('reason')} error={!!errors.reason} helperText={errors.reason?.message} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button type="submit" form="leave-form" variant="contained" disabled={createMutation.isPending}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Leave Request</DialogTitle>
        <DialogContent>
          {reviewTarget && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" gutterBottom><strong>{reviewTarget.employeeName}</strong> — {reviewTarget.leaveType}</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {dayjs(reviewTarget.startDate).format('MMM D')} – {dayjs(reviewTarget.endDate).format('MMM D, YYYY')} ({reviewTarget.totalDays} days)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>{reviewTarget.reason}</Typography>
              <TextField label="Review Notes (optional)" fullWidth multiline rows={2} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setReviewOpen(false)}>Cancel</Button>
          <Button color="error" startIcon={<Close />} disabled={reviewMutation.isPending} onClick={() => reviewTarget && reviewMutation.mutate({ id: reviewTarget.id, approve: false })}>Reject</Button>
          <Button variant="contained" startIcon={<Check />} disabled={reviewMutation.isPending} onClick={() => reviewTarget && reviewMutation.mutate({ id: reviewTarget.id, approve: true })}>Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
