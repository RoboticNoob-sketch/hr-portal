import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, Typography, Divider,
} from '@mui/material';
import { useEffect } from 'react';
import { useForm, Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { ApiResponse, DepartmentDto, EmployeeDetailDto, EmployeeListDto, PositionDto, UserListDto } from '@/types';
import { EMPLOYMENT_STATUSES } from '@/types';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const baseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  hireDate: z.string().min(1, 'Hire date is required'),
  status: z.enum(EMPLOYMENT_STATUSES),
  employmentType: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  civilStatus: z.string().optional(),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  zipCode: z.string().optional(),
  sssNumber: z.string().optional(),
  philHealthNumber: z.string().optional(),
  pagIbigNumber: z.string().optional(),
  tinNumber: z.string().optional(),
});

const createSchema = baseSchema.extend({
  userId: z.string().min(1, 'User account is required'),
  employeeNumber: z.string().optional(),
});

const updateSchema = baseSchema.extend({
  regularizationDate: z.string().optional(),
  resignationDate: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;
type BaseFormData = z.infer<typeof baseSchema>;

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Intern'] as const;
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
const CIVIL_STATUSES = ['Single', 'Married', 'Widowed', 'Separated', 'Divorced'] as const;

function empty(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function toDate(value?: string) {
  return value ? dayjs(value).toISOString() : undefined;
}

function toFormDate(value?: string) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '';
}

function buildPayload(form: BaseFormData) {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    middleName: empty(form.middleName),
    suffix: empty(form.suffix),
    hireDate: toDate(form.hireDate),
    status: form.status,
    employmentType: empty(form.employmentType),
    departmentId: form.departmentId || null,
    positionId: form.positionId || null,
    managerId: form.managerId || null,
    dateOfBirth: toDate(form.dateOfBirth),
    gender: empty(form.gender),
    civilStatus: empty(form.civilStatus),
    nationality: empty(form.nationality),
    phoneNumber: empty(form.phoneNumber),
    address: empty(form.address),
    city: empty(form.city),
    province: empty(form.province),
    zipCode: empty(form.zipCode),
    sssNumber: empty(form.sssNumber),
    philHealthNumber: empty(form.philHealthNumber),
    pagIbigNumber: empty(form.pagIbigNumber),
    tinNumber: empty(form.tinNumber),
  };
}

interface SharedFormProps {
  register: UseFormRegister<BaseFormData>;
  control: Control<BaseFormData>;
  errors: FieldErrors<BaseFormData>;
  departments?: DepartmentDto[];
  positions?: PositionDto[];
  managers: EmployeeListDto[];
  departmentId?: string;
  excludeManagerId?: string;
}

function SharedEmployeeFields({
  register, control, errors, departments, positions, managers, departmentId, excludeManagerId,
}: SharedFormProps) {
  const managerOptions = managers.filter((m) => m.id !== excludeManagerId);

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary">Employment</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField label="First Name" fullWidth {...register('firstName')} error={!!errors.firstName} helperText={errors.firstName?.message} />
        <TextField label="Last Name" fullWidth {...register('lastName')} error={!!errors.lastName} helperText={errors.lastName?.message} />
        <TextField label="Middle Name" fullWidth {...register('middleName')} />
        <TextField label="Suffix" fullWidth {...register('suffix')} placeholder="Jr., Sr., III" />
        <TextField label="Hire Date" type="date" fullWidth {...register('hireDate')} error={!!errors.hireDate} helperText={errors.hireDate?.message} InputLabelProps={{ shrink: true }} />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select {...field} label="Status">
                {EMPLOYMENT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="employmentType"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Employment Type</InputLabel>
              <Select {...field} label="Employment Type">
                <MenuItem value="">None</MenuItem>
                {EMPLOYMENT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="departmentId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select {...field} label="Department">
                <MenuItem value="">None</MenuItem>
                {departments?.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="positionId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select {...field} label="Position" disabled={!departmentId}>
                <MenuItem value="">None</MenuItem>
                {positions?.map((p) => <MenuItem key={p.id} value={p.id}>{p.title}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="managerId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={{ gridColumn: { sm: '1 / -1' } }}>
              <InputLabel>Manager</InputLabel>
              <Select {...field} label="Manager">
                <MenuItem value="">None</MenuItem>
                {managerOptions.map((m) => <MenuItem key={m.id} value={m.id}>{m.fullName}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
      </Box>

      <Divider />
      <Typography variant="subtitle2" color="text.secondary">Personal</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField label="Date of Birth" type="date" fullWidth {...register('dateOfBirth')} InputLabelProps={{ shrink: true }} />
        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select {...field} label="Gender">
                <MenuItem value="">None</MenuItem>
                {GENDERS.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="civilStatus"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Civil Status</InputLabel>
              <Select {...field} label="Civil Status">
                <MenuItem value="">None</MenuItem>
                {CIVIL_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        />
        <TextField label="Nationality" fullWidth {...register('nationality')} />
        <TextField label="Phone Number" fullWidth {...register('phoneNumber')} />
        <TextField label="Address" fullWidth {...register('address')} sx={{ gridColumn: { sm: '1 / -1' } }} />
        <TextField label="City" fullWidth {...register('city')} />
        <TextField label="Province" fullWidth {...register('province')} />
        <TextField label="Zip Code" fullWidth {...register('zipCode')} />
      </Box>

      <Divider />
      <Typography variant="subtitle2" color="text.secondary">Government IDs</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField label="SSS Number" fullWidth {...register('sssNumber')} />
        <TextField label="PhilHealth Number" fullWidth {...register('philHealthNumber')} />
        <TextField label="Pag-IBIG Number" fullWidth {...register('pagIbigNumber')} />
        <TextField label="TIN Number" fullWidth {...register('tinNumber')} />
      </Box>
    </>
  );
}

function useEmployeeLookups(open: boolean, departmentId?: string) {
  const { data: departments } = useQuery({
    queryKey: ['departments', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<DepartmentDto[]>>('/api/departments/active');
      return data.data ?? [];
    },
    enabled: open,
  });

  const { data: positions } = useQuery({
    queryKey: ['positions', 'active', departmentId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PositionDto[]>>('/api/positions/active', {
        params: { departmentId: departmentId || undefined },
      });
      return data.data ?? [];
    },
    enabled: open,
  });

  const { data: managers = [] } = useQuery({
    queryKey: ['employees', 'managers'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{ items: EmployeeListDto[] }>>('/api/employees', {
        params: { page: 1, pageSize: 100 },
      });
      return data.data?.items ?? [];
    },
    enabled: open,
  });

  return { departments, positions, managers };
}

interface DialogShellProps {
  open: boolean;
  title: string;
  submitLabel: string;
  pending: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

function DialogShell({ open, title, submitLabel, pending, onClose, children }: DialogShellProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="employee-form" variant="contained" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (employee: EmployeeDetailDto) => void;
}

function CreateEmployeeDialog({ open, onClose, onSuccess }: CreateDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { status: 'Active', hireDate: dayjs().format('YYYY-MM-DD') },
  });

  const departmentId = watch('departmentId');
  const selectedUserId = watch('userId');
  const { departments, positions, managers } = useEmployeeLookups(open, departmentId);

  const { data: usersWithoutEmployee } = useQuery({
    queryKey: ['users', 'without-employee'],
    queryFn: async () => {
      const [usersRes, employeesRes] = await Promise.all([
        apiClient.get<ApiResponse<{ items: UserListDto[] }>>('/api/users', { params: { page: 1, pageSize: 100 } }),
        apiClient.get<ApiResponse<{ items: EmployeeListDto[] }>>('/api/employees', { params: { page: 1, pageSize: 100 } }),
      ]);
      const employeeEmails = new Set((employeesRes.data.data?.items ?? []).map((e) => e.email.toLowerCase()));
      return (usersRes.data.data?.items ?? []).filter((u) => u.isActive && !employeeEmails.has(u.email.toLowerCase()));
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    reset({
      userId: '', employeeNumber: '', firstName: '', lastName: '', middleName: '', suffix: '',
      hireDate: dayjs().format('YYYY-MM-DD'), status: 'Active', employmentType: '',
      departmentId: '', positionId: '', managerId: '', dateOfBirth: '', gender: '', civilStatus: '',
      nationality: '', phoneNumber: '', address: '', city: '', province: '', zipCode: '',
      sssNumber: '', philHealthNumber: '', pagIbigNumber: '', tinNumber: '',
    });
  }, [open, reset]);

  useEffect(() => {
    if (!selectedUserId || !usersWithoutEmployee) return;
    const user = usersWithoutEmployee.find((u) => u.id === selectedUserId);
    if (user) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
    }
  }, [selectedUserId, usersWithoutEmployee, setValue]);

  useEffect(() => {
    const currentPositionId = watch('positionId');
    if (departmentId && currentPositionId && positions && !positions.some((p) => p.id === currentPositionId)) {
      setValue('positionId', '');
    }
  }, [departmentId, positions, setValue, watch]);

  const saveMutation = useMutation({
    mutationFn: async (form: CreateFormData) => {
      const { data } = await apiClient.post<ApiResponse<EmployeeDetailDto>>('/api/employees', {
        ...buildPayload(form),
        userId: form.userId,
        employeeNumber: empty(form.employeeNumber),
      });
      return data.data!;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', saved.id] });
      queryClient.invalidateQueries({ queryKey: ['users', 'without-employee'] });
      toast.success('Employee created.');
      onSuccess?.(saved);
      onClose();
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.');
    },
  });

  return (
    <DialogShell
      open={open}
      title="New Employee"
      submitLabel="Create Employee"
      pending={saveMutation.isPending}
      onClose={onClose}
    >
      <Box component="form" id="employee-form" onSubmit={handleSubmit((d) => saveMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
        <Typography variant="subtitle2" color="text.secondary">Account</Typography>
        <Controller
          name="userId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth error={!!errors.userId}>
              <InputLabel>User Account</InputLabel>
              <Select {...field} label="User Account">
                {usersWithoutEmployee?.length === 0 && (
                  <MenuItem disabled value="">No eligible users — create a user first</MenuItem>
                )}
                {usersWithoutEmployee?.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.fullName} ({u.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <TextField label="Employee Number (optional)" fullWidth {...register('employeeNumber')} placeholder="Auto-generated if blank" />
        <Divider />
        <SharedEmployeeFields
          register={register as unknown as UseFormRegister<BaseFormData>}
          control={control as unknown as Control<BaseFormData>}
          errors={errors}
          departments={departments}
          positions={positions}
          managers={managers}
          departmentId={departmentId}
        />
      </Box>
    </DialogShell>
  );
}

interface EditDialogProps {
  open: boolean;
  employee: EmployeeDetailDto;
  onClose: () => void;
  onSuccess?: (employee: EmployeeDetailDto) => void;
}

function EditEmployeeDialog({ open, employee, onClose, onSuccess }: EditDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  });

  const departmentId = watch('departmentId');
  const { departments, positions, managers } = useEmployeeLookups(open, departmentId);

  useEffect(() => {
    if (!open) return;
    reset({
      firstName: employee.firstName,
      lastName: employee.lastName,
      middleName: employee.middleName ?? '',
      suffix: employee.suffix ?? '',
      hireDate: toFormDate(employee.hireDate),
      regularizationDate: toFormDate(employee.regularizationDate),
      resignationDate: toFormDate(employee.resignationDate),
      status: employee.status as typeof EMPLOYMENT_STATUSES[number],
      employmentType: employee.employmentType ?? '',
      departmentId: employee.departmentId ?? '',
      positionId: employee.positionId ?? '',
      managerId: employee.managerId ?? '',
      profilePhotoUrl: employee.profilePhotoUrl ?? '',
      dateOfBirth: toFormDate(employee.dateOfBirth),
      gender: employee.gender ?? '',
      civilStatus: employee.civilStatus ?? '',
      nationality: employee.nationality ?? '',
      phoneNumber: employee.phoneNumber ?? '',
      address: employee.address ?? '',
      city: employee.city ?? '',
      province: employee.province ?? '',
      zipCode: employee.zipCode ?? '',
      sssNumber: employee.sssNumber ?? '',
      philHealthNumber: employee.philHealthNumber ?? '',
      pagIbigNumber: employee.pagIbigNumber ?? '',
      tinNumber: employee.tinNumber ?? '',
    });
  }, [open, employee, reset]);

  useEffect(() => {
    const currentPositionId = watch('positionId');
    if (departmentId && currentPositionId && positions && !positions.some((p) => p.id === currentPositionId)) {
      setValue('positionId', '');
    }
  }, [departmentId, positions, setValue, watch]);

  const saveMutation = useMutation({
    mutationFn: async (form: UpdateFormData) => {
      const { data } = await apiClient.put<ApiResponse<EmployeeDetailDto>>(`/api/employees/${employee.id}`, {
        ...buildPayload(form),
        regularizationDate: toDate(form.regularizationDate),
        resignationDate: toDate(form.resignationDate),
        profilePhotoUrl: empty(form.profilePhotoUrl),
      });
      return data.data!;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', saved.id] });
      toast.success('Employee updated.');
      onSuccess?.(saved);
      onClose();
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed.');
    },
  });

  return (
    <DialogShell
      open={open}
      title="Edit Employee"
      submitLabel="Save Changes"
      pending={saveMutation.isPending}
      onClose={onClose}
    >
      <Box component="form" id="employee-form" onSubmit={handleSubmit((d) => saveMutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 0.5 }}>
        <SharedEmployeeFields
          register={register as unknown as UseFormRegister<BaseFormData>}
          control={control as unknown as Control<BaseFormData>}
          errors={errors}
          departments={departments}
          positions={positions}
          managers={managers}
          departmentId={departmentId}
          excludeManagerId={employee.id}
        />
        <Divider />
        <Typography variant="subtitle2" color="text.secondary">Additional</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Regularization Date" type="date" fullWidth {...register('regularizationDate')} InputLabelProps={{ shrink: true }} />
          <TextField label="Resignation Date" type="date" fullWidth {...register('resignationDate')} InputLabelProps={{ shrink: true }} />
          <TextField label="Profile Photo URL" fullWidth {...register('profilePhotoUrl')} sx={{ gridColumn: { sm: '1 / -1' } }} />
        </Box>
      </Box>
    </DialogShell>
  );
}

interface EmployeeFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  employee?: EmployeeDetailDto;
  onClose: () => void;
  onSuccess?: (employee: EmployeeDetailDto) => void;
}

export function EmployeeFormDialog({ open, mode, employee, onClose, onSuccess }: EmployeeFormDialogProps) {
  if (mode === 'create') {
    return <CreateEmployeeDialog open={open} onClose={onClose} onSuccess={onSuccess} />;
  }

  if (!employee) return null;
  return <EditEmployeeDialog open={open} employee={employee} onClose={onClose} onSuccess={onSuccess} />;
}
