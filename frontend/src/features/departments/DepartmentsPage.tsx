import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableHead, TableRow,
  Typography, Chip, IconButton, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Tooltip, Pagination, FormControlLabel, Switch,
} from '@mui/material';
import { Search, Add, Edit, Delete, Business } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useAuth } from '@/context/AuthContext';
import type { ApiResponse, DepartmentDto, PagedResult } from '@/types';
import { toast } from 'react-toastify';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['Admin', 'HR']);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<DepartmentDto | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<DepartmentDto>>>('/api/departments', {
        params: { page, pageSize: 10, search: search || undefined },
      });
      return data.data!;
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true },
  });

  const saveMutation = useMutation({
    mutationFn: (body: FormData) =>
      editItem
        ? apiClient.put(`/api/departments/${editItem.id}`, { ...body, headEmployeeId: editItem.headEmployeeId ?? null })
        : apiClient.post('/api/departments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(editItem ? 'Department updated.' : 'Department created.');
      closeDialog();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted.');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Delete failed.';
      toast.error(msg);
    },
  });

  const openCreate = () => { setEditItem(null); reset({ name: '', code: '', description: '', isActive: true }); setDialogOpen(true); };
  const openEdit = (item: DepartmentDto) => {
    setEditItem(item);
    reset({ name: item.name, code: item.code ?? '', description: item.description ?? '', isActive: item.isActive });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  return (
    <Box>
      <PageHeader
        title="Departments"
        subtitle={`${data?.totalCount ?? 0} departments`}
        actions={canManage && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Department</Button>}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField size="small" placeholder="Search departments…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (setSearch(searchInput), setPage(1))} sx={{ width: 320 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} />
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
                    <TableCell>Department</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Employees</TableCell>
                    <TableCell>Positions</TableCell>
                    <TableCell>Status</TableCell>
                    {canManage && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.map((dept) => (
                    <TableRow key={dept.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(183,0,17,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                            <Business sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{dept.name}</Typography>
                            {dept.description && <Typography variant="caption" color="text.secondary">{dept.description}</Typography>}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{dept.code ? <Chip label={dept.code} size="small" variant="outlined" /> : '—'}</TableCell>
                      <TableCell>{dept.employeeCount}</TableCell>
                      <TableCell>{dept.positionCount}</TableCell>
                      <TableCell><StatusChip status={dept.isActive ? 'Active' : 'Inactive'} /></TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(dept)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(dept.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
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
        <DialogTitle>{editItem ? 'Edit Department' : 'New Department'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="dept-form" onSubmit={handleSubmit((d) => saveMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Name" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Code" fullWidth {...register('code')} placeholder="e.g. HR, ENG" />
            <TextField label="Description" fullWidth multiline rows={2} {...register('description')} />
            <Controller name="isActive" control={control} render={({ field }) => (
              <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Active" />
            )} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit" form="dept-form" variant="contained" disabled={saveMutation.isPending}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
