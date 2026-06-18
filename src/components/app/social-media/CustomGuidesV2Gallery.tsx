'use client';

import { CustomVisualGuideV2, CustomVisualGuideV2Service } from '@/src/api/CustomVisualGuideV2Service';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { Box, Button, CircularProgress, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { FaEllipsisV, FaPlus, FaTrash } from 'react-icons/fa';
import { MdImage } from 'react-icons/md';
import CustomGuideV2PreviewCard from './CustomGuideV2PreviewCard';
import CustomGuideV2UploadModal from './CustomGuideV2UploadModal';

interface CustomGuidesV2GalleryProps {
  brandId?: string;
  onGuideSelect?: (guide: CustomVisualGuideV2) => void;
  selectable?: boolean;
  selectedGuideId?: string;
  selectedGuideIds?: string[];
  onSelectionChange?: (guideIds: string[]) => void;
}

export default function CustomGuidesV2Gallery({
  brandId,
  onGuideSelect,
  selectable = false,
  selectedGuideId,
  selectedGuideIds = [],
  onSelectionChange,
}: CustomGuidesV2GalleryProps) {
  const [guides, setGuides] = useState<CustomVisualGuideV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; guideId: string } | null>(null);

  const primary = '#8B5CF6'; // Purple for V2

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      setLoading(true);
      const response = await CustomVisualGuideV2Service.getUserGuidesV2('active');
      if (response.status && response.responseData) {
        // Response is an array directly
        setGuides(Array.isArray(response.responseData) ? response.responseData : []);
      }
    } catch (error: unknown) {
      console.error('[V2Gallery] Error loading guides:', error);
      ToastService.showToast('Failed to load V2 style guides', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newGuides: CustomVisualGuideV2[]) => {
    setGuides((prev) => [...newGuides, ...prev]);
    setUploadModalOpen(false);
  };

  const handleArchive = async (guideId: string) => {
    try {
      setMenuAnchor(null);
      await CustomVisualGuideV2Service.archiveGuideV2(guideId);
      setGuides((prev) => prev.filter((g) => g.id !== guideId));
      ToastService.showToast('V2 Style Guide archived successfully', ToastTypeEnum.Success);
    } catch (error: unknown) {
      console.error('[V2Gallery] Error archiving guide:', error);
      ToastService.showToast('Failed to archive V2 guide', ToastTypeEnum.Error);
    }
  };

  const handleGuideClick = (guide: CustomVisualGuideV2) => {
    if (selectable && onGuideSelect) {
      onGuideSelect(guide);
    } else if (onSelectionChange) {
      // Toggle selection
      if (selectedGuideIds.includes(guide.id)) {
        onSelectionChange(selectedGuideIds.filter((id) => id !== guide.id));
      } else {
        onSelectionChange([...selectedGuideIds, guide.id]);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#0d0e0f' }}>
              Custom Style Guides V2
            </Typography>
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              ADVANCED
            </Box>
          </Box>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            Advanced style transfer with GPT-4o Vision • Reference images used directly
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<FaPlus />}
          onClick={() => setUploadModalOpen(true)}
          sx={{
            background: `linear-gradient(135deg, ${primary} 0%, #EC4899 100%)`,
            color: '#fff',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            px: 3,
            '&:hover': { opacity: 0.9 },
          }}
        >
          Upload Style Reference
        </Button>
      </Box>

      {/* Empty state */}
      {guides.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            border: `2px dashed ${primary}30`,
            borderRadius: '16px',
            background: `${primary}05`,
          }}
        >
          <MdImage size={64} color={primary} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#374151', mb: 1 }}>
            No V2 Style Guides Yet
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#6B7280', mb: 3, maxWidth: 450, mx: 'auto' }}>
            Upload reference images to create advanced style transfer guides. GPT-4o Vision analyzes your reference and
            applies the style to your brand content while protecting identity.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FaPlus />}
            onClick={() => setUploadModalOpen(true)}
            sx={{
              background: `linear-gradient(135deg, ${primary} 0%, #EC4899 100%)`,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              px: 4,
              py: 1.5,
              '&:hover': { opacity: 0.9 },
            }}
          >
            Upload Your First Style Reference
          </Button>
        </Box>
      )}

      {/* Guides grid */}
      {guides.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {guides.map((guide) => (
            <Box
              key={guide.id}
              sx={{
                position: 'relative',
                cursor: (selectable || onSelectionChange) ? 'pointer' : 'default',
                border: (selectable && selectedGuideId === guide.id) || selectedGuideIds.includes(guide.id)
                  ? `2px solid ${primary}`
                  : 'none',
                borderRadius: '12px',
                transition: 'all 0.2s',
                '&:hover': (selectable || onSelectionChange)
                  ? {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${primary}30`,
                    }
                  : {},
              }}
              onClick={() => handleGuideClick(guide)}
            >
              {/* Menu button */}
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAnchor({ element: e.currentTarget, guideId: guide.id });
                }}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 3,
                  '&:hover': {
                    background: '#fff',
                  },
                }}
              >
                <FaEllipsisV size={14} />
              </IconButton>

              <CustomGuideV2PreviewCard guide={guide} />
            </Box>
          ))}
        </Box>
      )}

      {/* Context menu */}
      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: '10px',
            minWidth: 180,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor) handleArchive(menuAnchor.guideId);
          }}
          sx={{
            fontSize: 14,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: '#EF4444',
          }}
        >
          <FaTrash size={14} />
          Archive Style Guide
        </MenuItem>
      </Menu>

      {/* Upload modal */}
      <CustomGuideV2UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        brandId={brandId}
      />
    </Box>
  );
}
