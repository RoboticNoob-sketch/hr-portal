import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, Avatar, IconButton, TextField, InputAdornment, MenuItem, CircularProgress,
  Tooltip, Pagination,
} from '@mui/material';
import { Search, Visibility, Add, Edit } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { tokens } from '@/theme/tokens';
import { useAuth } from '@/context/AuthContext';
import { EmployeeFormDialog } from '@/features/employees/EmployeeFormDialog';
import type { ApiResponse, EmployeeDetailDto, EmployeeListDto, PagedResult, DepartmentDto } from '@/types';
import dayjs from 'dayjs';

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(['Admin', 'HR']);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editEmployee, setEditEmployee] = useState<EmployeeDetailDto | undefined>();

  const { data: departments } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments/active');
      return data.data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<EmployeeListDto>>>('/api/employees', {
        params: { page, pageSize: 10, search: search || undefined, departmentId: deptFilter || undefined },
      });
      return data.data!;
    },
  });

  const openCreate = () => {
    setDialogMode('create');
    setEditEmployee(undefined);
    setDialogOpen(true);
  };

  const openEdit = async (emp: EmployeeListDto) => {
    const { data } = await apiClient.get<ApiResponse<EmployeeDetailDto>>(`/api/employees/${emp.id}`);
    setDialogMode('edit');
    setEditEmployee(data.data!);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditEmployee(undefined);
  };

  return (
    <Box>
      <PageHeader
        title="Employee Directory"
        subtitle={`${data?.totalCount ?? 0} employees`}
        actions={canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Add Employee
          </Button>
        )}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name or employee #…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
          sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }}
        />
        <TextField select size="small" label="Department" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {departments?.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Employee #</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No employees found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.items.map((emp) => (
                      <TableRow key={emp.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${emp.id}`)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: tokens.colors.primary, fontSize: '0.875rem' }}>
                              {emp.firstName[0]}{emp.lastName[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{emp.fullName}</Typography>
                              <Typography variant="caption" color="text.secondary">{emp.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="body2">{emp.employeeNumber}</Typography></TableCell>
                        <TableCell>{emp.departmentName ?? '—'}</TableCell>
                        <TableCell>{emp.positionTitle ?? '—'}</TableCell>
                        <TableCell><StatusChip status={emp.status} /></TableCell>
                        <TableCell><Typography variant="caption">{dayjs(emp.hireDate).format('MMM D, YYYY')}</Typography></TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="View Profile">
                            <IconButton size="small" onClick={() => navigate(`/employees/${emp.id}`)}>
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {canManage && (
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(emp)}>
                                <Edit sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {(data?.totalPages ?? 0) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <Pagination count={data?.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        employee={editEmployee}
        onClose={closeDialog}
        onSuccess={(saved) => {
          if (dialogMode === 'create') navigate(`/employees/${saved.id}`);
        }}
      />
    </Box>
  );
}
