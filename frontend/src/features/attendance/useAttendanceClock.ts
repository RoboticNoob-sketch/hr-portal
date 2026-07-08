import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-toastify';

export function useAttendanceClock() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const clockInMutation = useMutation({
    mutationFn: () => apiClient.post('/api/attendance/clock-in'),
    onSuccess: () => {
      invalidate();
      toast.success('Clocked in successfully.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Clock in failed.');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => apiClient.post('/api/attendance/clock-out'),
    onSuccess: () => {
      invalidate();
      toast.success('Clocked out successfully.');
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Clock out failed.');
    },
  });

  return { clockInMutation, clockOutMutation };
}
