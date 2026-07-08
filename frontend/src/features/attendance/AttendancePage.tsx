import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress, Chip, Pagination, Tabs, Tab, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Tooltip,
} from '@mui/material';
import { Login, Logout, Schedule, Edit } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useAttendanceClock } from '@/features/attendance/useAttendanceClock';
import type { ApiResponse, AttendanceDto, PagedResult, TodayAttendanceStatusDto } from '@/types';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

export default function AttendancePage() {
  const { hasRole } = useAuth();
  const canViewTeam = hasRole(['Admin', 'HR', 'Manager']);
  const canCorrect = hasRole(['Admin', 'HR']);
  const queryClient = useQueryClient();
  const { clockInMutation, clockOutMutation } = useAttendanceClock();
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const [teamPage, setTeamPage] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [teamDate, setTeamDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AttendanceDto | null>(null);
  const [editClockIn, setEditClockIn] = useState('');
  const [editClockOut, setEditClockOut] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data: todayStatus, isLoading: todayLoading } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<TodayAttendanceStatusDto>>('/api/attendance/today');
      return data.data!;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['attendance', 'me', page, fromDate, toDate],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/attendance/me', {
        params: {
          page,
          pageSize: 10,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });
      return data.data!;
    },
  });

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['attendance', 'team', teamPage, teamDate],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<AttendanceDto>>>('/api/attendance/team', {
        params: { page: teamPage, pageSize: 20, date: teamDate },
      });
      return data.data!;
    },
    enabled: canViewTeam && tab === 1,
  });

  const correctMutation = useMutation({
    mutationFn: () => apiClient.put(`/api/attendance/${editTarget!.id}`, {
      clockIn: editClockIn ? dayjs(`${editTarget!.date.split('T')[0]}T${editClockIn}`).toISOString() : null,
      clockOut: editClockOut ? dayjs(`${editTarget!.date.split('T')[0]}T${editClockOut}`).toISOString() : null,
      notes: editNotes || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated.');
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed.');
    },
  });

  const openEdit = (row: AttendanceDto) => {
    setEditTarget(row);
    setEditClockIn(row.clockIn ? dayjs(row.clockIn).format('HH:mm') : '');
    setEditClockOut(row.clockOut ? dayjs(row.clockOut).format('HH:mm') : '');
    setEditNotes(row.notes ?? '');
    setEditOpen(true);
  };

  const today = todayStatus?.today;

  const historyTable = (
    <>
      <Box sx={{ display: 'flex', gap: 2, p: 2, flexWrap: 'wrap' }}>
        <TextField label="From" type="date" size="small" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" size="small" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} InputLabelProps={{ shrink: true }} />
        <Button size="small" onClick={() => { setFromDate(''); setToDate(''); setPage(1); }}>Clear</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Clock In</TableCell>
            <TableCell>Clock Out</TableCell>
            <TableCell>Hours</TableCell>
            <TableCell>OT</TableCell>
            <TableCell>Status</TableCell>
            {canCorrect && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {history?.items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canCorrect ? 7 : 6} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">No attendance records yet</Typography>
              </TableCell>
            </TableRow>
          ) : (
            history?.items.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{dayjs(row.date).format('MMM D, YYYY')}</TableCell>
                <TableCell>{row.clockIn ? dayjs(row.clockIn).format('h:mm A') : '—'}</TableCell>
                <TableCell>{row.clockOut ? dayjs(row.clockOut).format('h:mm A') : '—'}</TableCell>
                <TableCell>{row.totalHours ?? '—'}</TableCell>
                <TableCell>{row.overtimeHours ?? '—'}</TableCell>
                <TableCell>
                  {row.isLate ? <Chip label="Late" size="small" color="warning" /> : <Chip label="On Time" size="small" color="success" variant="outlined" />}
                </TableCell>
                {canCorrect && (
                  <TableCell align="right">
                    <Tooltip title="Correct">
                      <IconButton size="small" onClick={() => openEdit(row)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {(history?.totalPages ?? 0) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <Pagination count={history?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </>
  );

  return (
    <Box>
      <PageHeader title="Attendance" subtitle="Track clock in/out and view history" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {todayLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={28} /></Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(183,0,17,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                  <Schedule />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>Today — {dayjs().format('MMMM D, YYYY')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {today?.clockIn
                      ? `In: ${dayjs(today.clockIn).format('h:mm A')}${today.clockOut ? ` · Out: ${dayjs(today.clockOut).format('h:mm A')}` : ''}${today.totalHours ? ` · ${today.totalHours}` : ''}`
                      : 'Not clocked in yet'}
                  </Typography>
                  {today?.isLate && <Chip label="Late" color="warning" size="small" sx={{ mt: 0.5 }} />}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button variant="contained" startIcon={<Login />} disabled={!todayStatus?.canClockIn || clockInMutation.isPending} onClick={() => clockInMutation.mutate()}>
                  Clock In
                </Button>
                <Button variant="outlined" startIcon={<Logout />} disabled={!todayStatus?.canClockOut || clockOutMutation.isPending} onClick={() => clockOutMutation.mutate()}>
                  Clock Out
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {canViewTeam && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="My History" />
          <Tab label="Team Attendance" />
        </Tabs>
      )}

      {(tab === 0 || !canViewTeam) && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {historyLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : historyTable}
          </CardContent>
        </Card>
      )}

      {canViewTeam && tab === 1 && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'center' }}>
              <TextField label="Date" type="date" size="small" value={teamDate} onChange={(e) => { setTeamDate(e.target.value); setTeamPage(1); }} InputLabelProps={{ shrink: true }} />
            </Box>
            {teamLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Clock In</TableCell>
                      <TableCell>Clock Out</TableCell>
                      <TableCell>Hours</TableCell>
                      {canCorrect && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {team?.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={canCorrect ? 6 : 5} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No team attendance for this date</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      team?.items.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{row.employeeName}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.employeeNumber}</Typography>
                          </TableCell>
                          <TableCell>{row.departmentName ?? '—'}</TableCell>
                          <TableCell>{row.clockIn ? dayjs(row.clockIn).format('h:mm A') : '—'}</TableCell>
                          <TableCell>{row.clockOut ? dayjs(row.clockOut).format('h:mm A') : '—'}</TableCell>
                          <TableCell>{row.totalHours ?? '—'}</TableCell>
                          {canCorrect && (
                            <TableCell align="right">
                              <Tooltip title="Correct">
                                <IconButton size="small" onClick={() => openEdit(row)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {(team?.totalPages ?? 0) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={team?.totalPages} page={teamPage} onChange={(_, p) => setTeamPage(p)} color="primary" />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Correct Attendance</DialogTitle>
        <DialogContent>
          {editTarget && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">{editTarget.employeeName} · {dayjs(editTarget.date).format('MMM D, YYYY')}</Typography>
              <TextField label="Clock In" type="time" fullWidth value={editClockIn} onChange={(e) => setEditClockIn(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Clock Out" type="time" fullWidth value={editClockOut} onChange={(e) => setEditClockOut(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Notes" fullWidth multiline rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={correctMutation.isPending} onClick={() => correctMutation.mutate()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
