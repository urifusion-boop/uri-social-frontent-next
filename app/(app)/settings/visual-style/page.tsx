'use client';

import { BrandProfileService } from '@/src/api/BrandProfileService';
import DashboardLayout from '@/src/components/app/atoms/DashboardLayout';
import StylePickerGallery from '@/src/components/app/social-media/StylePickerGallery';
import { getStyle } from '@/src/data/styleLibrary';
import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Palette } from 'lucide-react';

const PRIMARY = '#CD1B78';

export default function VisualStylePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [industry, setIndustry] = useState('general_other');
  const [currentSelections, setCurrentSelections] = useState<string[]>([]);
  const [draftSelections, setDraftSelections] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    BrandProfileService.get()
      .then((res) => {
        const p = res.responseData;
        if (p) {
          setIndustry(p.industry || 'general_other');
          setCurrentSelections(p.style_selections || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openDialog = () => {
    setDraftSelections([...currentSelections]);
    setSaved(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await BrandProfileService.save({ style_selections: draftSelections });
      setCurrentSelections(draftSelections);
      setSaved(true);
      setTimeout(() => setDialogOpen(false), 800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
            >
              ← Back to Settings
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Palette className="w-7 h-7" style={{ color: PRIMARY }} />
              <h1 className="text-2xl font-bold text-gray-900">Visual Style</h1>
            </div>
            <p className="text-gray-600 text-sm">
              Choose up to 3 visual styles. Uri rotates through them to keep your content fresh.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <CircularProgress style={{ color: PRIMARY }} />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {currentSelections.length === 0 ? (
                <div className="text-center py-10">
                  <Typography sx={{ fontSize: 14, color: '#6B7280', mb: 2 }}>
                    No visual styles selected yet. Pick up to 3 styles that match your brand.
                  </Typography>
                  <button
                    onClick={openDialog}
                    className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90"
                    style={{ background: PRIMARY }}
                  >
                    Choose Styles
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {currentSelections.map((slug) => {
                      const style = getStyle(slug);
                      if (!style) return null;
                      const [from, to] = style.gradient;
                      return (
                        <div key={slug} className="rounded-xl overflow-hidden border border-gray-200">
                          <div className="h-20" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
                          <div className="p-3">
                            <p className="text-sm font-semibold text-gray-900">{style.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{style.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={openDialog}
                    className="px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors hover:border-pink-500 hover:text-pink-600"
                    style={{ borderColor: PRIMARY, color: PRIMARY }}
                  >
                    Update Styles
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Style picker dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: '#0d0e0f' }}>Choose Visual Styles</Typography>
            <Typography sx={{ fontSize: 12.5, color: '#6B7280' }}>Pick up to 3 styles for your brand</Typography>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <FaTimes size={14} color="#6B7280" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                background: draftSelections.length > 0 ? PRIMARY : '#E5E7EB',
                borderRadius: 99,
                px: 1.5,
                py: 0.375,
                fontSize: 11.5,
                fontWeight: 600,
                color: draftSelections.length > 0 ? '#fff' : '#6B7280',
              }}
            >
              {draftSelections.length}/3 selected
            </Box>
            {draftSelections.length > 0 && (
              <Typography
                component="button"
                onClick={() => setDraftSelections([])}
                sx={{
                  background: 'none',
                  border: 'none',
                  fontSize: 11.5,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  p: 0,
                }}
              >
                Clear all
              </Typography>
            )}
          </Box>

          <StylePickerGallery industry={industry} selected={draftSelections} onChange={setDraftSelections} />

          <Box sx={{ display: 'flex', gap: 1.5, mt: 3, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || draftSelections.length === 0}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Styles'}
            </button>
          </Box>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
