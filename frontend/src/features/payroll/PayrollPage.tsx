import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, CircularProgress, Pagination, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid,
} from '@mui/material';
import { PlayArrow, Visibility, Paid } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { StatusChip } from '@/components/ui/StatusChip';
import { useAuth } from '@/context/AuthContext';
import { tokens } from '@/theme/tokens';
import type { ApiResponse, PayrollRecordDto, PayrollSummaryDto, PagedResult } from '@/types';
import { PAYROLL_STATUSES } from '@/types';
import { toast } from 'react-toastify';
import dayjs from '@/utils/dayjs';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function periodLabel(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`;
}

function PayslipDetail({ record }: { record: PayrollRecordDto }) {
  const rows = [
    ['Basic Salary', record.basicSalary],
    ['Allowances', record.allowances],
    ['Overtime Pay', record.overtimePay],
    ['SSS', -record.sssDeduction],
    ['PhilHealth', -record.philHealthDeduction],
    ['Pag-IBIG', -record.pagIbigDeduction],
    ['Withholding Tax', -record.taxDeduction],
    ['Other Deductions', -record.otherDeductions],
  ];

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {record.employeeName} · {record.employeeNumber ?? '—'} · {periodLabel(record.periodYear, record.periodMonth)}
      </Typography>
      <Table size="small" sx={{ mt: 2 }}>
        <TableBody>
          {rows.map(([label, amount]) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              <TableCell align="right" sx={{ color: (amount as number) < 0 ? tokens.colors.error : 'inherit' }}>
                {formatMoney(Math.abs(amount as number))}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell><strong>Gross Pay</strong></TableCell>
            <TableCell align="right"><strong>{formatMoney(record.grossPay)}</strong></TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Net Pay</strong></TableCell>
            <TableCell align="right"><strong>{formatMoney(record.netPay)}</strong></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <StatusChip status={record.status} />
        {record.paidAt && (
          <Typography variant="caption" color="text.secondary">
            Paid {dayjs(record.paidAt).format('MMM D, YYYY')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function PayrollPage() {
  const { hasRole } = useAuth();
  const isHr = hasRole(['Admin', 'HR']);
  const queryClient = useQueryClient();
  const now = dayjs();
  const [tab, setTab] = useState<'overview' | 'records' | 'mine'>(isHr ? 'overview' : 'mine');
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [statusFilter, setStatusFilter] = useState('');
  const [processOpen, setProcessOpen] = useState(false);
  const [processYear, setProcessYear] = useState(now.year());
  const [processMonth, setProcessMonth] = useState(now.month() + 1);
  const [detail, setDetail] = useState<PayrollRecordDto | null>(null);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['payroll', 'summary', year, month],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PayrollSummaryDto>>('/api/payroll/summary', {
        params: { year, month },
      });
      return data.data!;
    },
    enabled: isHr,
  });

  const recordsEndpoint = tab === 'mine' ? '/api/payroll/payslips/me' : '/api/payroll/records';
  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['payroll', 'records', tab, page, year, month, statusFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize: 10 };
      if (tab === 'records') {
        params.year = year;
        params.month = month;
        if (statusFilter) params.status = statusFilter;
      }
      const { data } = await apiClient.get<ApiResponse<PagedResult<PayrollRecordDto>>>(recordsEndpoint, { params });
      return data.data!;
    },
    enabled: tab !== 'overview',
  });

  const processMutation = useMutation({
    mutationFn: () => apiClient.post('/api/payroll/process', { year: processYear, month: processMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setProcessOpen(false);
      toast.success('Payroll processed successfully.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Payroll processing failed.');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/payroll/records/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll marked as paid.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed.');
    },
  });

  const showEmployee = tab === 'records';

  return (
    <Box>
      <PageHeader
        title="Payroll"
        subtitle={isHr ? 'Process payroll, review records, and manage payouts' : 'View your payslips and payment history'}
        actions={isHr ? (
          <Button variant="contained" startIcon={<PlayArrow />} onClick={() => setProcessOpen(true)}>
            Process Payroll
          </Button>
        ) : undefined}
      />

      <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(1); }} sx={{ mb: 3 }}>
        {isHr && <Tab value="overview" label="Overview" />}
        {isHr && <Tab value="records" label="All Records" />}
        <Tab value="mine" label={isHr ? 'My Payslips' : 'My Payslips'} />
      </Tabs>

      {tab === 'overview' && isHr && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField select label="Year" size="small" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }}>
              {[now.year() - 1, now.year(), now.year() + 1].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Month" size="small" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ width: 160 }}>
              {MONTHS.map((label, idx) => (
                <MenuItem key={label} value={idx + 1}>{label}</MenuItem>
              ))}
            </TextField>
          </Box>

          {summaryLoading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="ACTIVE EMPLOYEES" value={summary?.totalEmployees ?? 0} icon={<Visibility />} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="PROCESSED" value={summary?.processedCount ?? 0} icon={<PlayArrow />} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="PAID" value={summary?.paidCount ?? 0} icon={<Paid />} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard title="TOTAL NET PAY" value={`₱${formatMoney(summary?.totalNetPay ?? 0)}`} icon={<Paid />} />
              </Grid>
            </Grid>
          )}

          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>{periodLabel(year, month)} Summary</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gross pay: ₱{formatMoney(summary?.totalGrossPay ?? 0)} · Deductions: ₱{formatMoney(summary?.totalDeductions ?? 0)} · Net pay: ₱{formatMoney(summary?.totalNetPay ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {(tab === 'records' || tab === 'mine') && (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {tab === 'records' && (
              <Box sx={{ display: 'flex', gap: 2, p: 3, pb: 0, flexWrap: 'wrap' }}>
                <TextField select label="Year" size="small" value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }} sx={{ width: 120 }}>
                  {[now.year() - 1, now.year(), now.year() + 1].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Month" size="small" value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }} sx={{ width: 160 }}>
                  {MONTHS.map((label, idx) => (
                    <MenuItem key={label} value={idx + 1}>{label}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Status" size="small" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} sx={{ width: 160 }}>
                  <MenuItem value="">All</MenuItem>
                  {PAYROLL_STATUSES.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Box>
            )}

            {recordsLoading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      {showEmployee && <TableCell>Employee</TableCell>}
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">Deductions</TableCell>
                      <TableCell align="right">Net Pay</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(records?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showEmployee ? 7 : 6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">No payroll records found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      records?.items.map((row) => (
                        <TableRow key={row.id} hover>
                          {showEmployee && (
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{row.employeeName}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.departmentName ?? '—'}</Typography>
                            </TableCell>
                          )}
                          <TableCell>{periodLabel(row.periodYear, row.periodMonth)}</TableCell>
                          <TableCell align="right">₱{formatMoney(row.grossPay)}</TableCell>
                          <TableCell align="right">₱{formatMoney(row.totalDeductions)}</TableCell>
                          <TableCell align="right">₱{formatMoney(row.netPay)}</TableCell>
                          <TableCell><StatusChip status={row.status} /></TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => setDetail(row)}>View</Button>
                            {isHr && row.status === 'Processed' && (
                              <Button size="small" color="success" disabled={markPaidMutation.isPending} onClick={() => markPaidMutation.mutate(row.id)}>
                                Mark Paid
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {(records?.totalPages ?? 0) > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <Pagination count={records?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={processOpen} onClose={() => setProcessOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Process Payroll</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField select label="Year" value={processYear} onChange={(e) => setProcessYear(Number(e.target.value))}>
            {[now.year() - 1, now.year(), now.year() + 1].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Month" value={processMonth} onChange={(e) => setProcessMonth(Number(e.target.value))}>
            {MONTHS.map((label, idx) => (
              <MenuItem key={label} value={idx + 1}>{label}</MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Generates payroll for all active employees using position salary midpoints and simplified PH deductions (SSS, PhilHealth, Pag-IBIG, tax).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={processMutation.isPending} onClick={() => processMutation.mutate()}>
            Process
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Payslip Details</DialogTitle>
        <DialogContent>{detail && <PayslipDetail record={detail} />}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
