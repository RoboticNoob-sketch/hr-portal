import { Alert, Box, Button, Paper, TextField, Typography, Link } from '@mui/material';
import { Email, People } from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { tokens } from '@/theme/tokens';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await apiClient.post('/api/auth/forgot-password', data);
    setSent(true);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: `${tokens.borderRadius.badge}px`, backgroundColor: tokens.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <People sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Typography variant="h2" fontWeight={700}>Forgot Password</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Enter your email and we'll send you a reset link.
        </Typography>
      </Box>

      <Paper sx={{ width: '100%', borderRadius: `${tokens.borderRadius.card}px`, border: `1px solid ${tokens.colors.divider}`, boxShadow: tokens.shadows.card, p: `${tokens.spacing.formPadding}px` }}>
        {sent ? (
          <Alert severity="success">
            If an account with that email exists, a reset link has been sent. Check your inbox.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body1" fontWeight={600} gutterBottom>Email Address</Typography>
              <TextField
                fullWidth
                placeholder="name@company.com"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{ startAdornment: <Email sx={{ fontSize: 18, color: tokens.colors.textSecondary, mr: 1 }} /> }}
              />
            </Box>
            <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ height: 48 }}>
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </Button>
          </Box>
        )}
      </Paper>

      <Link component={RouterLink} to="/login" variant="body1" sx={{ color: tokens.colors.primary }}>
        ← Back to Login
      </Link>
    </Box>
  );
}
