import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  People,
} from '@mui/icons-material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { tokens } from '@/theme/tokens';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid email or password.');
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 440,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        alignItems: 'center',
      }}
    >
      {/* Branding */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: `${tokens.borderRadius.badge}px`,
            backgroundColor: tokens.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <People sx={{ color: 'white', fontSize: 28 }} />
        </Box>
        <Typography
          variant="h1"
          sx={{ fontWeight: 700, fontSize: '2rem', color: tokens.colors.textPrimary, letterSpacing: '-0.8px' }}
        >
          HRMS Portal
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.colors.textSecondary }}>
          Sign in to manage your workspace
        </Typography>
      </Box>

      {/* Login Card */}
      <Paper
        sx={{
          width: '100%',
          borderRadius: `${tokens.borderRadius.card}px`,
          border: `1px solid ${tokens.colors.divider}`,
          boxShadow: tokens.shadows.card,
          p: `${tokens.spacing.formPadding}px`,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Email */}
          <Box>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Email Address
            </Typography>
            <TextField
              fullWidth
              placeholder="name@company.com"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ fontSize: 18, color: tokens.colors.textSecondary }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Password */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body1" fontWeight={600}>
                Password
              </Typography>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="caption"
                sx={{ color: tokens.colors.primary, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Forgot Password?
              </Link>
            </Box>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 18, color: tokens.colors.textSecondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Remember Me */}
          <FormControlLabel
            control={<Checkbox size="small" {...register('rememberMe')} />}
            label={<Typography variant="body1" sx={{ color: tokens.colors.textSecondary }}>Remember this device</Typography>}
          />

          {/* Login Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            endIcon={<LoginIcon />}
            sx={{ height: 48, fontSize: '1rem', fontWeight: 700 }}
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </Button>

          {/* SSO Divider */}
          <Box sx={{ position: 'relative', textAlign: 'center', py: 0.5 }}>
            <Divider />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: tokens.colors.paper,
                px: 2,
              }}
            >
              <Typography variant="caption" sx={{ color: tokens.colors.textSecondary, fontWeight: 500, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                or continue with
              </Typography>
            </Box>
          </Box>

          {/* SSO Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                height: 44,
                borderColor: tokens.colors.divider,
                color: tokens.colors.textPrimary,
                fontWeight: 400,
                '&:hover': { borderColor: tokens.colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>G</Box>
              Google
            </Button>
            <Button
              variant="outlined"
              fullWidth
              sx={{
                height: 44,
                borderColor: tokens.colors.divider,
                color: tokens.colors.textPrimary,
                fontWeight: 400,
                '&:hover': { borderColor: tokens.colors.textSecondary, backgroundColor: 'rgba(0,0,0,0.02)' },
              }}
            >
              <Box component="span" sx={{ mr: 1, fontSize: '1rem' }}>⊞</Box>
              Microsoft
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Footer */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body1" sx={{ color: tokens.colors.textSecondary }}>
          New to the portal?{' '}
          <Box component="span" sx={{ color: tokens.colors.primary, fontWeight: 600, cursor: 'pointer' }}>
            Contact HR Admin
          </Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 0.5 }}>
          <Link href="#" variant="body1" sx={{ color: 'rgba(94,94,94,0.6)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Typography sx={{ color: 'rgba(94,94,94,0.6)' }}>•</Typography>
          <Link href="#" variant="body1" sx={{ color: 'rgba(94,94,94,0.6)', textDecoration: 'none' }}>Terms of Service</Link>
        </Box>
      </Box>
    </Box>
  );
}
