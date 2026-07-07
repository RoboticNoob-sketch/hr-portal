import { Alert, Box, Button, Paper, TextField, Typography, Link } from '@mui/material';
import { People } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { tokens } from '@/theme/tokens';

const schema = z.object({
  newPassword: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await apiClient.post('/api/auth/reset-password', { token, ...data });
      setDone(true);
    } catch {
      setError('Invalid or expired reset token.');
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: `${tokens.borderRadius.badge}px`, backgroundColor: tokens.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <People sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Typography variant="h2" fontWeight={700}>Reset Password</Typography>
      </Box>
      <Paper sx={{ width: '100%', borderRadius: `${tokens.borderRadius.card}px`, border: `1px solid ${tokens.colors.divider}`, boxShadow: tokens.shadows.card, p: `${tokens.spacing.formPadding}px` }}>
        {done ? (
          <Alert severity="success">Password reset successfully. <Link component={RouterLink} to="/login">Sign in</Link></Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="New Password" type="password" fullWidth {...register('newPassword')} error={!!errors.newPassword} helperText={errors.newPassword?.message} />
            <TextField label="Confirm Password" type="password" fullWidth {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
            <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: 48 }}>
              {isSubmitting ? 'Resetting…' : 'Reset Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
