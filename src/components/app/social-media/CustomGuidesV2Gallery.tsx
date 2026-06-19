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

  const primary = '#CD1B78'; // Brand pink

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
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1.5,
          borderBottom: `2px solid ${primary}22`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${primary}, #9B1460)`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              px: 1.5,
              py: 0.5,
              borderRadius: '6px',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            V2
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>Advanced Style Transfer</Typography>
          <Typography sx={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
            GPT-4o Vision • Reference images used directly
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<FaPlus />}
          onClick={() => setUploadModalOpen(true)}
          sx={{
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 600,
            color: primary,
            '&:hover': {
              background: `${primary}10`,
            },
          }}
        >
          Upload
        </Button>
      </Box>

      {/* Empty state */}
      {guides.length === 0 && (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed #E5E7EB',
            borderRadius: '12px',
            background: '#F9FAFB',
          }}
        >
          <MdImage size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B7280', mb: 1.5 }}>No V2 guides yet</Typography>
          <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 2 }}>
            GPT-4o Vision analyzes reference images & applies style while protecting your identity
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FaPlus />}
            onClick={() => setUploadModalOpen(true)}
            sx={{
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 600,
              borderColor: primary,
              color: primary,
              '&:hover': {
                borderColor: primary,
                background: `${primary}10`,
              },
            }}
          >
            Upload Your First Guide
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
                cursor: selectable || onSelectionChange ? 'pointer' : 'default',
                border:
                  (selectable && selectedGuideId === guide.id) || selectedGuideIds.includes(guide.id)
                    ? `2px solid ${primary}`
                    : 'none',
                borderRadius: '12px',
                transition: 'all 0.2s',
                '&:hover':
                  selectable || onSelectionChange
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
