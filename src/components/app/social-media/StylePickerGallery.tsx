'use client';

import { getStylesForIndustry, StyleTemplate, STYLES, getCategorizedStylesForIndustry } from '@/src/data/styleLibrary';
import { Box, Button, Typography, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaPlus, FaTimes } from 'react-icons/fa';
import { MdImage } from 'react-icons/md';
import { CustomVisualGuide, CustomVisualGuideService } from '@/src/api/CustomVisualGuideService';
import CustomGuideUploadModal from './CustomGuideUploadModal';
import CustomGuideInfoTooltip from './CustomGuideInfoTooltip';
import CustomGuidesV2Gallery from './CustomGuidesV2Gallery';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

const MAX_SELECTIONS = 7;

interface StylePickerGalleryProps {
  industry: string;
  selected: string[];
  onChange: (slugs: string[]) => void;
  selectedCustomGuides?: string[]; // custom guide V1 IDs (array)
  onCustomGuideChange?: (guideIds: string[]) => void;
  selectedCustomGuidesV2?: string[]; // custom guide V2 IDs (array)
  onCustomGuideV2Change?: (guideIds: string[]) => void;
  brandId?: string;
}

function StyleCard({
  style,
  isSelected,
  onToggle,
  primary,
}: {
  style: StyleTemplate;
  isSelected: boolean;
  onToggle: () => void;
  primary: string;
}) {
  const [from, to] = style.gradient;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Box
      component="button"
      onClick={onToggle}
      sx={{
        position: 'relative',
        border: isSelected ? `2.5px solid ${primary}` : '2.5px solid transparent',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'none',
        p: 0,
        textAlign: 'left',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : '0 2px 8px rgba(0,0,0,0.10)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isSelected ? `0 4px 16px ${primary}55` : '0 6px 18px rgba(0,0,0,0.16)',
        },
        width: '100%',
      }}
    >
      {/* Image / gradient swatch */}
      <Box sx={{ height: 100, position: 'relative', overflow: 'hidden' }}>
        {!imgFailed ? (
          <Box
            component="img"
            src={style.image}
            alt={style.name}
            onError={() => setImgFailed(true)}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${from}, ${to})` }} />
        )}
        {isSelected && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `${primary}22`,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              p: 1,
            }}
          >
            <FaCheckCircle size={20} color={primary} style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' }} />
          </Box>
        )}
      </Box>

      {/* Info */}
      <Box sx={{ background: '#fff', p: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f', lineHeight: 1.2, mb: 0.5 }}>
          {style.name}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4 }}>{style.description}</Typography>
      </Box>
    </Box>
  );
}

export default function StylePickerGallery({
  industry,
  selected,
  onChange,
  selectedCustomGuides = [],
  onCustomGuideChange,
  selectedCustomGuidesV2 = [],
  onCustomGuideV2Change,
  brandId,
}: StylePickerGalleryProps) {
  const primary = '#CD1B78';
  const [viewAll, setViewAll] = useState(false);
  const [customGuides, setCustomGuides] = useState<CustomVisualGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState<{ id: string; name: string } | null>(null);

  // Load custom guides on mount
  useEffect(() => {
    loadCustomGuides();
  }, []);

  const loadCustomGuides = async () => {
    try {
      setLoadingGuides(true);
      const response = await CustomVisualGuideService.getUserGuides('active');
      if (response.status && response.responseData) {
        setCustomGuides(response.responseData.guides);
      }
    } catch (error) {
      console.error('[StylePickerGallery] Error loading custom guides:', error);
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleUploadSuccess = (newGuides: CustomVisualGuide[]) => {
    setCustomGuides((prev) => [...newGuides, ...prev]);
    setUploadModalOpen(false);
  };

  const handleCustomGuideSelect = (guideId: string) => {
    if (onCustomGuideChange) {
      // Toggle selection
      if (selectedCustomGuides.includes(guideId)) {
        // Deselect
        onCustomGuideChange(selectedCustomGuides.filter((id) => id !== guideId));
      } else {
        // Check if we're at the selection limit
        const currentSelectionCount = selected.length + selectedCustomGuides.length + selectedCustomGuidesV2.length;
        if (currentSelectionCount >= MAX_SELECTIONS) {
          // Already at limit, can't select another
          return;
        }
        // Select
        onCustomGuideChange([...selectedCustomGuides, guideId]);
      }
    }
  };

  const handleDeleteClick = (guide: CustomVisualGuide, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection
    setGuideToDelete({ id: guide.id, name: guide.name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!guideToDelete) return;

    try {
      await CustomVisualGuideService.archiveGuide(guideToDelete.id);
      setCustomGuides((prev) => prev.filter((g) => g.id !== guideToDelete.id));
      // Remove from selection if selected
      if (onCustomGuideChange && selectedCustomGuides.includes(guideToDelete.id)) {
        onCustomGuideChange(selectedCustomGuides.filter((id) => id !== guideToDelete.id));
      }
      ToastService.showToast('Custom guide deleted successfully', ToastTypeEnum.Success);
    } catch (error) {
      console.error('[StylePickerGallery] Error deleting guide:', error);
      ToastService.showToast('Failed to delete custom guide', ToastTypeEnum.Error);
    } finally {
      setDeleteConfirmOpen(false);
      setGuideToDelete(null);
    }
  };

  const industryStyles = getStylesForIndustry(industry || 'general_other');
  const allStyles = STYLES;

  // Separate marketing templates from regular styles
  const marketingTemplates = allStyles.filter((s) => s.styleType === 'marketing_template');
  const regularStyles = allStyles.filter((s) => !s.styleType || s.styleType !== 'marketing_template');

  const styles = viewAll ? regularStyles : industryStyles;

  // Get categorized styles for organized browsing
  const categories = getCategorizedStylesForIndustry(industry || 'general_other');

  // Build selected styles list (from library only, excluding marketing templates)
  const bySlug = Object.fromEntries(STYLES.map((s) => [s.slug, s]));
  const selectedStyles = selected.map((slug) => bySlug[slug]).filter(Boolean);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      // Check total selection count (library styles + custom guides V1 + V2)
      const currentSelectionCount = selected.length + selectedCustomGuides.length + selectedCustomGuidesV2.length;
      if (currentSelectionCount >= MAX_SELECTIONS) {
        // silently enforce limit — caller should show guidance
        return;
      }
      onChange([...selected, slug]);
    }
  };

  return (
    <Box>
      {/* Custom Visual Guides Section */}
      {(customGuides.length > 0 || !loadingGuides) && onCustomGuideChange && (
        <Box sx={{ mb: 4 }}>
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
                Custom
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>Your Visual Guides</Typography>
              <Typography sx={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
                Reference images you've uploaded
              </Typography>
              <CustomGuideInfoTooltip variant="icon" />
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

          {/* Custom Guides Grid */}
          {customGuides.length > 0 ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                gap: 1.5,
              }}
            >
              {customGuides.slice(0, 8).map((guide) => {
                const isSelected = selectedCustomGuides.includes(guide.id);
                return (
                  <Box
                    key={guide.id}
                    component="button"
                    onClick={() => handleCustomGuideSelect(guide.id)}
                    sx={{
                      position: 'relative',
                      border: isSelected ? `2.5px solid ${primary}` : '2.5px solid transparent',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'none',
                      p: 0,
                      textAlign: 'left',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${primary}` : '0 2px 8px rgba(0,0,0,0.10)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: isSelected ? `0 4px 16px ${primary}55` : '0 6px 18px rgba(0,0,0,0.16)',
                      },
                      width: '100%',
                    }}
                  >
                    {/* Image */}
                    <Box
                      sx={{
                        height: 100,
                        background: `url(${guide.original_image_url}) center/cover`,
                        position: 'relative',
                      }}
                    >
                      {/* Delete button */}
                      <IconButton
                        onClick={(e) => handleDeleteClick(guide, e)}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(255,255,255,0.95)',
                          backdropFilter: 'blur(4px)',
                          width: 24,
                          height: 24,
                          zIndex: 2,
                          '&:hover': {
                            background: '#FEE2E2',
                            color: '#EF4444',
                          },
                        }}
                      >
                        <FaTimes size={12} />
                      </IconButton>

                      {isSelected && (
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: `${primary}22`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-end',
                            p: 1,
                          }}
                        >
                          <FaCheckCircle
                            size={20}
                            color={primary}
                            style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' }}
                          />
                        </Box>
                      )}
                      {/* Match outcome badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 6,
                          left: 6,
                          px: 1,
                          py: 0.5,
                          background:
                            guide.match_outcome === 'STRONG_MATCH' || guide.match_outcome === 'DECENT_MATCH'
                              ? '#D1FAE5'
                              : guide.match_outcome === 'WEAK_MATCH'
                                ? '#FEF3C7'
                                : '#FEE2E2',
                          borderRadius: '4px',
                          fontSize: 9,
                          fontWeight: 700,
                          color:
                            guide.match_outcome === 'STRONG_MATCH' || guide.match_outcome === 'DECENT_MATCH'
                              ? '#10B981'
                              : guide.match_outcome === 'WEAK_MATCH'
                                ? '#F59E0B'
                                : '#EF4444',
                          textTransform: 'uppercase',
                          letterSpacing: 0.3,
                        }}
                      >
                        {guide.match_outcome === 'STRONG_MATCH'
                          ? 'Strong'
                          : guide.match_outcome === 'DECENT_MATCH'
                            ? 'Good'
                            : guide.match_outcome === 'WEAK_MATCH'
                              ? 'Weak'
                              : 'No Match'}
                      </Box>
                    </Box>

                    {/* Info */}
                    <Box sx={{ background: '#fff', p: 1.5 }}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0d0e0f',
                          lineHeight: 1.2,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {guide.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: '#6B7280',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {guide.aesthetic_summary?.visual_genre || 'Custom visual style'}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                border: '2px dashed #E5E7EB',
                borderRadius: '12px',
                background: '#F9FAFB',
              }}
            >
              <MdImage size={40} color="#D1D5DB" style={{ marginBottom: 12 }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#6B7280', mb: 1 }}>
                No custom guides yet
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 2 }}>
                Upload reference images to create custom visual guides
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
        </Box>
      )}

      {/* Custom Visual Guides V2 Section */}
      {onCustomGuideV2Change && (
        <Box sx={{ mb: 4 }}>
          <CustomGuidesV2Gallery
            selectedGuideIds={selectedCustomGuidesV2}
            onSelectionChange={onCustomGuideV2Change}
            brandId={brandId}
          />
        </Box>
      )}

      {/* Currently Selected Styles Section */}
      {selectedStyles.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2,
              pb: 1.5,
              borderBottom: `2px solid ${primary}22`,
            }}
          >
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
              Selected
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>
              Currently Selected ({selectedStyles.length})
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>Click to deselect</Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {selectedStyles.map((style) => (
              <StyleCard
                key={style.slug}
                style={style}
                isSelected={true}
                onToggle={() => toggle(style.slug)}
                primary={primary}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>
          {viewAll ? 'All Visual Styles' : 'Styles for Your Industry'}
        </Typography>
        <Box
          component="button"
          onClick={() => setViewAll(!viewAll)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            padding: '6px 12px',
            borderRadius: '8px',
            border: `1px solid ${viewAll ? primary : '#E5E7EB'}`,
            background: viewAll ? `${primary}11` : '#fff',
            color: viewAll ? primary : '#6B7280',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': {
              background: viewAll ? `${primary}22` : '#F9FAFB',
              borderColor: primary,
            },
          }}
        >
          <span>{viewAll ? 'View All Styles' : 'View Industry Styles'}</span>
          <span style={{ fontSize: 10 }}>{viewAll ? '✓' : '◦'}</span>
        </Box>
      </Box>

      {/* Categorized Visual Styles */}
      {!viewAll &&
        categories.map((category) => {
          const categoryStyles = category.styles
            .map((slug) => bySlug[slug])
            .filter(Boolean)
            .filter((s) => !s.styleType || s.styleType !== 'marketing_template');

          if (categoryStyles.length === 0) return null;

          return (
            <Box key={category.id} sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Typography sx={{ fontSize: 24 }}>{category.icon}</Typography>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f', lineHeight: 1.3 }}>
                    {category.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3 }}>
                    {category.description}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1.5,
                }}
              >
                {categoryStyles.map((style) => (
                  <StyleCard
                    key={style.slug}
                    style={style}
                    isSelected={selected.includes(style.slug)}
                    onToggle={() => toggle(style.slug)}
                    primary={primary}
                  />
                ))}
              </Box>
            </Box>
          );
        })}

      {/* Flat Grid for "View All" mode */}
      {viewAll && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
            gap: 1.5,
          }}
        >
          {styles.map((style) => (
            <StyleCard
              key={style.slug}
              style={style}
              isSelected={selected.includes(style.slug)}
              onToggle={() => toggle(style.slug)}
              primary={primary}
            />
          ))}
        </Box>
      )}

      {/* AI Marketing Templates Section */}
      {marketingTemplates.length > 0 && (
        <Box sx={{ mt: 4 }}>
          {/* Section Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 2,
              pb: 1.5,
              borderBottom: `2px solid ${primary}22`,
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${primary}, #FF6B9D)`,
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
              Pro Templates
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>AI Marketing Templates</Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', fontStyle: 'italic' }}>
              Professional prompt-engineered templates
            </Typography>
          </Box>

          {/* Templates Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
              gap: 1.5,
            }}
          >
            {marketingTemplates.map((template) => (
              <StyleCard
                key={template.slug}
                style={template}
                isSelected={selected.includes(template.slug)}
                onToggle={() => toggle(template.slug)}
                primary={primary}
              />
            ))}
          </Box>
        </Box>
      )}

      {selected.length >= MAX_SELECTIONS && (
        <Typography sx={{ fontSize: 11.5, color: '#9CA3AF', mt: 1.5, textAlign: 'center' }}>
          {MAX_SELECTIONS} of {MAX_SELECTIONS} styles selected — deselect one to swap
        </Typography>
      )}

      {/* Upload modal */}
      <CustomGuideUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        brandId={brandId}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600, color: '#0d0e0f', pb: 1 }}>Delete Custom Guide?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>"{guideToDelete?.name}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#6B7280',
              '&:hover': { background: '#F3F4F6' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontSize: 13,
              fontWeight: 600,
              background: '#EF4444',
              color: '#fff',
              '&:hover': { background: '#DC2626' },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
