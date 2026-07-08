import {
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Pagination,
} from '@mui/material';
import { Search, Add, Edit, Delete, MoreVert } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { tokens } from '@/theme/tokens';
import type { PagedResult, UserListDto, ApiResponse } from '@/types';
import { toast } from 'react-toastify';
import dayjs from '@/utils/dayjs';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs a digit').regex(/[!@#$%^&*]/, 'Needs special char'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['Admin', 'HR', 'Manager', 'Employee']),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function useUsers(page: number, search: string) {
  return useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<UserListDto>>>('/api/users', {
        params: { page, pageSize: 10, search: search || undefined },
      });
      return data.data!;
    },
  });
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useUsers(page, search);

  const createMutation = useMutation({
    mutationFn: (body: CreateUserForm) => apiClient.post('/api/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully.');
      setCreateOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create user.';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted.');
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'Employee' },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle={`${data?.totalCount ?? 0} total users`}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Add User
          </Button>
        }
      />

      {/* Search */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search users…"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ width: 320 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>,
          }}
        />
        <Button variant="outlined" onClick={handleSearch}>Search</Button>
      </Box>

      {/* Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.items.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: tokens.colors.primary, fontSize: '0.875rem' }}>
                            {user.firstName[0]}{user.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{user.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {user.roles.map((r) => (
                            <Chip key={r} label={r} size="small" variant="outlined" sx={{ fontSize: '0.6875rem', height: 20 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell><StatusChip status={user.isActive ? 'Active' : 'Inactive'} /></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{dayjs(user.createdAt).format('MMM D, YYYY')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {user.lastLoginAt ? dayjs(user.lastLoginAt).fromNow() : 'Never'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(user.id)}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More">
                          <IconButton size="small"><MoreVert sx={{ fontSize: 16 }} /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box component="form" id="create-user-form" onSubmit={handleSubmit((d) => createMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="First Name" fullWidth {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} />
              <TextField label="Last Name" fullWidth {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} />
            </Box>
            <TextField label="Email" fullWidth {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            <TextField label="Password" type="password" fullWidth {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    {['Admin', 'HR', 'Manager', 'Employee'].map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button type="submit" form="create-user-form" variant="contained" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
