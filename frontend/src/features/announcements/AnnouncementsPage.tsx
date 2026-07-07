import {
  Box, Button, Card, CardContent, Chip, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, FormControlLabel,
  Switch, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Announcement } from '@mui/icons-material';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/ui/PageHeader';
import { tokens } from '@/theme/tokens';
import type { PagedResult, AnnouncementDto, ApiResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Content is required'),
  category: z.enum(['News', 'Event', 'Policy', 'General'] as const),
  publishDate: z.string(),
  isPublished: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const categoryColors: Record<string, { bg: string; color: string }> = {
  News: { bg: 'rgba(183,0,17,0.08)', color: tokens.colors.primary },
  Event: { bg: '#e3f2fd', color: '#1565c0' },
  Policy: { bg: '#fff3e0', color: '#e65100' },
  General: { bg: tokens.colors.background, color: tokens.colors.textSecondary },
};

export default function AnnouncementsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<AnnouncementDto | null>(null);
  const canManage = hasRole(['Admin', 'HR']);

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PagedResult<AnnouncementDto>>>('/api/announcements', { params: { pageSize: 20 } });
      return data.data!;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: FormData) => apiClient.post('/api/announcements', { ...body, publishDate: new Date(body.publishDate) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement created.'); closeDialog(); },
    onError: () => toast.error('Failed to save announcement.'),
  });

  const updateMutation = useMutation({
    mutationFn: (body: FormData) => apiClient.put(`/api/announcements/${editItem?.id}`, { ...body, publishDate: new Date(body.publishDate) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement updated.'); closeDialog(); },
    onError: () => toast.error('Failed to save announcement.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/announcements/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['announcements'] }); toast.success('Announcement deleted.'); },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'General', isPublished: true, publishDate: dayjs().format('YYYY-MM-DDTHH:mm') },
  });

  const openCreate = () => { setEditItem(null); reset({ category: 'General', isPublished: true, publishDate: dayjs().format('YYYY-MM-DDTHH:mm') }); setDialogOpen(true); };
  const openEdit = (item: AnnouncementDto) => { setEditItem(item); reset({ title: item.title, body: item.body, category: item.category as FormData['category'], publishDate: dayjs(item.publishDate).format('YYYY-MM-DDTHH:mm'), isPublished: item.isPublished }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditItem(null); };

  const onSubmit = (data: FormData) => editItem ? updateMutation.mutate(data) : createMutation.mutate(data);

  return (
    <Box>
      <PageHeader
        title="Announcements"
        subtitle="Company news, events, and policies"
        actions={canManage && <Button variant="contained" startIcon={<Add />} onClick={openCreate}>New Announcement</Button>}
      />

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {data?.items.map((ann) => {
            const cat = categoryColors[ann.category] ?? categoryColors.General;
            return (
              <Card key={ann.id}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 1.5, backgroundColor: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: cat.color }}>
                        <Announcement />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h4">{ann.title}</Typography>
                          <Chip label={ann.category} size="small" sx={{ backgroundColor: cat.bg, color: cat.color, fontWeight: 600, fontSize: '0.6875rem' }} />
                          {!ann.isPublished && <Chip label="Draft" size="small" variant="outlined" />}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ann.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ann.authorName ?? 'HR Department'} · {dayjs(ann.publishDate).format('MMM D, YYYY')}
                        </Typography>
                      </Box>
                    </Box>
                    {canManage && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 2 }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(ann)}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteMutation.mutate(ann.id)}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
          {data?.items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}><Typography color="text.secondary">No announcements yet.</Typography></Box>
          )}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        <DialogContent>
          <Box component="form" id="ann-form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField label="Title" fullWidth {...register('title')} error={!!errors.title} helperText={errors.title?.message} />
            <TextField label="Content" fullWidth multiline rows={4} {...register('body')} error={!!errors.body} helperText={errors.body?.message} />
            <Controller name="category" control={control} render={({ field }) => (
              <TextField select label="Category" fullWidth {...field}>
                {['News', 'Event', 'Policy', 'General'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
            )} />
            <TextField label="Publish Date" type="datetime-local" fullWidth {...register('publishDate')} InputLabelProps={{ shrink: true }} />
            <Controller name="isPublished" control={control} render={({ field }) => (
              <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Published" />
            )} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button type="submit" form="ann-form" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
