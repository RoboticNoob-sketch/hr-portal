import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, IconButton, TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, Pagination, FormControlLabel, Switch, MenuItem,
} from '@mui/material';
import { Search, Add, Edit, Delete, WorkOutline } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, DepartmentDto, PositionDto, PagedResult } from '@/types';
import { toast } from 'react-toastify';

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  minSalary: z.coerce.number().min(0),
  maxSalary: z.coerce.number().min(0),
  salaryGrade: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  isActive: z.boolean(),
}).refine((d) => d.maxSalary >= d.minSalary, { message: 'Max must be >= min', path: ['maxSalary'] });

type FormData = z.infer<typeof schema>;

export default function PositionsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['Admin', 'HR']);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PositionDto | null>(null);

  const { data: departments } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments/active');
      return data.data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['positions', page, search, deptFilter],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<PositionDto>>>('/api/positions', {
        params: { page, pageSize: 10, search: search || undefined, departmentId: deptFilter || undefined },
      });
      return data.data!;
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, minSalary: 0, maxSalary: 0 },
  });

  const saveMutation = useMutation({
    mutationFn: (body: FormData) =>
      editItem ? apiClient.put(`/api/positions/${editItem.id}`, body) : apiClient.post('/api/positions', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(editItem ? 'Position updated.' : 'Position created.');
      closeDialog();
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/positions/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['positions'] }); toast.success('Position deleted.'); },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed.');
    },
  });

  const openCreate = () => {
    setEditItem(null);
    reset({ title: '', description: '', minSalary: 0, maxSalary: 0, salaryGrade: '', departmentId: departments?.[0]?.id ?? '', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (item: PositionDto) => {
    setEditItem(item);
    reset({ title: item.title, description: item.description ?? '', minSalary: item.minSalary, maxSalary: item.maxSalary, salaryGrade: item.salaryGrade ?? '', departmentId: item.departmentId, isActive: item.isActive });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  return (
    <Box>
      <PageHeader title="Positions" subtitle={`${data?.totalCount ?? 0} positions`}
        actions={canManage && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Position</Button>} />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search positions…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))} sx={{ width: 280 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
        <TextField select size="small" label="Department" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {departments?.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={() => { setSearch(searchInput); setPage(1); }}>Search</Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box> : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Salary Range</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell>Status</TableCell>
                    {canManage && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.map((pos) => (
                    <TableRow key={pos.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <WorkOutline sx={{ color: 'primary.main', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight={600}>{pos.title}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{pos.departmentName}</TableCell>
                      <TableCell>₱{pos.minSalary.toLocaleString()} – ₱{pos.maxSalary.toLocaleString()}</TableCell>
                      <TableCell>{pos.salaryGrade ?? '—'}</TableCell>
                      <TableCell>{pos.employeeCount}</TableCell>
                      <TableCell><StatusChip status={pos.isActive ? 'Active' : 'Inactive'} /></TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(pos)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(pos.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
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

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Position' : 'New Position'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="pos-form" onSubmit={handleSubmit((d) => saveMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Title" fullWidth {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
            <Controller name="departmentId" control={control} render={({ field }) => (
              <TextField select label="Department" fullWidth {...field} error={!!errors.departmentId} helperText={errors.departmentId?.message}>
                {departments?.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            )} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Min Salary" type="number" fullWidth {...register('minSalary')} error={!!errors.minSalary} />
              <TextField label="Max Salary" type="number" fullWidth {...register('maxSalary')} error={!!errors.maxSalary} helperText={errors.maxSalary?.message} />
            </Box>
            <TextField label="Salary Grade" fullWidth {...register('salaryGrade')} />
            <TextField label="Description" fullWidth multiline rows={2} {...register('description')} />
            <Controller name="isActive" control={control} render={({ field }) => (
              <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Active" />
            )} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit" form="pos-form" variant="contained" disabled={saveMutation.isPending}>{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
