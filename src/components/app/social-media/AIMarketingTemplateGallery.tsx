'use client';

import { AIMarketingImageService, AIMarketingTemplate, GenerateImageRequest } from '@/src/api/AIMarketingImageService';
import { Box, Typography, TextField, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaImage, FaDownload, FaMagic } from 'react-icons/fa';
import Image from 'next/image';

interface AIMarketingTemplateGalleryProps {
  onTemplateGenerated?: (imageUrl: string) => void;
}

interface TemplateCardProps {
  template: AIMarketingTemplate;
  isSelected: boolean;
  onSelect: () => void;
  primary: string;
}

function TemplateCard({ template, isSelected, onSelect, primary }: TemplateCardProps) {
  const categoryColors = {
    editorial: '#8B5CF6',
    beverage: '#EC4899',
    food: '#F59E0B',
    ecommerce: '#3B82F6',
  };

  const categoryColor = categoryColors[template.category] || primary;

  return (
    <Box
      component="button"
      onClick={onSelect}
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
      {/* Template Preview */}
      <Box
        sx={{
          height: 120,
          background: `linear-gradient(135deg, ${categoryColor}22, ${categoryColor}44)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <FaImage size={32} color={categoryColor} style={{ opacity: 0.5 }} />
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
        {/* Category Badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: categoryColor,
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {template.category}
        </Box>
      </Box>

      {/* Template Info */}
      <Box sx={{ background: '#fff', p: 1.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f', lineHeight: 1.2, mb: 0.5 }}>
          {template.name}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#6B7280', lineHeight: 1.4, mb: 1 }}>
          {template.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {template.variables.slice(0, 3).map((variable) => (
            <Box
              key={variable}
              sx={{
                fontSize: 9,
                px: 0.75,
                py: 0.25,
                borderRadius: '4px',
                background: '#F3F4F6',
                color: '#6B7280',
                fontWeight: 600,
              }}
            >
              [{variable}]
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function AIMarketingTemplateGallery({ onTemplateGenerated }: AIMarketingTemplateGalleryProps) {
  const primary = '#CD1B78';

  const [templates, setTemplates] = useState<AIMarketingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<AIMarketingTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    console.log('🎨 [AIMarketingTemplateGallery] Component mounted, loading templates...');
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    console.log('📡 [AIMarketingTemplateGallery] Starting template fetch...');
    try {
      setLoading(true);
      console.log('📡 [AIMarketingTemplateGallery] Calling AIMarketingImageService.listTemplates()...');
      const response = await AIMarketingImageService.listTemplates();
      console.log('✅ [AIMarketingTemplateGallery] Response received:', response);
      console.log('✅ [AIMarketingTemplateGallery] Response data:', response.data);
      console.log('✅ [AIMarketingTemplateGallery] Response status:', response.data.status);
      console.log('✅ [AIMarketingTemplateGallery] Response data array:', response.data.responseData);

      if (response.data.status) {
        const templates = response.data.responseData || [];
        console.log('✅ [AIMarketingTemplateGallery] Templates loaded:', templates.length, 'templates');
        setTemplates(templates);
      } else {
        console.error('❌ [AIMarketingTemplateGallery] Response status is false:', response.data);
        setError(response.data.responseMessage || 'Failed to load templates');
      }
    } catch (err) {
      console.error('❌ [AIMarketingTemplateGallery] Failed to load templates:', err);
      console.error('❌ [AIMarketingTemplateGallery] Error details:', JSON.stringify(err, null, 2));
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
      console.log('🏁 [AIMarketingTemplateGallery] Loading finished');
    }
  };

  const handleTemplateSelect = (template: AIMarketingTemplate) => {
    setSelectedTemplate(template);
    setGeneratedImageUrl(null);
    setError(null);

    // Initialize variables
    const initialVars: Record<string, string> = {};
    template.variables.forEach((variable) => {
      initialVars[variable] = '';
    });
    setVariables(initialVars);
  };

  const handleGenerateImage = async () => {
    if (!selectedTemplate) return;

    // Validate all variables are filled
    const emptyVars = selectedTemplate.variables.filter((v) => !variables[v]?.trim());
    if (emptyVars.length > 0) {
      setError(`Please fill in: ${emptyVars.join(', ')}`);
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const request: GenerateImageRequest = {
        template_id: selectedTemplate.template_id,
        variables,
        aspect_ratio: selectedTemplate.default_aspect_ratio,
      };

      const response = await AIMarketingImageService.generateImage(request);

      if (response.data.status && response.data.responseData) {
        const imageUrl = response.data.responseData.image_url || response.data.responseData.dalle_url;
        if (imageUrl) {
          setGeneratedImageUrl(imageUrl);
          onTemplateGenerated?.(imageUrl);
        } else {
          setError('Image generated but URL not available');
        }
      } else {
        setError(response.data.responseMessage || 'Generation failed');
      }
    } catch (err) {
      console.error('Failed to generate image:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to generate image. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredTemplates =
    categoryFilter === 'all' ? templates : templates.filter((t) => t.category === categoryFilter);

  const categories = ['all', ...Array.from(new Set(templates.map((t) => t.category)))];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} sx={{ color: primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <FaMagic size={16} color={primary} />
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#0d0e0f' }}>AI Marketing Image Templates</Typography>
        </Box>
        <Typography sx={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
          Generate professional marketing images with AI. Select a template, customize variables, and create stunning
          visuals in seconds.
        </Typography>
      </Box>

      {/* Category Filter */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {categories.map((cat) => (
          <Box
            key={cat}
            component="button"
            onClick={() => setCategoryFilter(cat)}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: '8px',
              border: `1px solid ${categoryFilter === cat ? primary : '#E5E7EB'}`,
              background: categoryFilter === cat ? `${primary}11` : '#fff',
              color: categoryFilter === cat ? primary : '#6B7280',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
              '&:hover': {
                background: categoryFilter === cat ? `${primary}22` : '#F9FAFB',
                borderColor: primary,
              },
            }}
          >
            {cat === 'all' ? 'All Templates' : cat}
          </Box>
        ))}
      </Box>

      {/* Templates Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1.5,
          mb: 3,
        }}
      >
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.template_id}
            template={template}
            isSelected={selectedTemplate?.template_id === template.template_id}
            onSelect={() => handleTemplateSelect(template)}
            primary={primary}
          />
        ))}
      </Box>

      {/* Variable Input Form */}
      {selectedTemplate && (
        <Box
          sx={{
            background: '#fff',
            border: '1px solid #E0DEF7',
            borderRadius: '12px',
            p: 2.5,
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f', mb: 2 }}>
            Customize "{selectedTemplate.name}"
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {selectedTemplate.variables.map((variable) => {
              const labelText = variable
                .replace(/[\[\]]/g, '')
                .replace(/_/g, ' ')
                .toLowerCase()
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              return (
                <Box key={variable}>
                  <Typography
                    sx={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#64748b',
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {labelText}
                  </Typography>
                  <Box
                    component="input"
                    type="text"
                    value={variables[variable] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setVariables({ ...variables, [variable]: e.target.value })
                    }
                    placeholder={`e.g. ${labelText === 'Product' ? 'Bloom Coffee Roasters' : labelText === 'Service' ? 'AI-powered content creation' : 'URISocial'}`}
                    sx={{
                      width: '100%',
                      height: 40,
                      px: 1.5,
                      borderRadius: '10px',
                      border: '1px solid #E0DEF7',
                      background: '#F7F7FD',
                      fontSize: 13.5,
                      color: '#1f2937',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      '&:focus': {
                        borderColor: primary,
                      },
                      '&::placeholder': {
                        color: '#9ca3af',
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>

          {error && (
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: '8px',
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                fontSize: 12,
                color: '#991B1B',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </Box>
          )}

          <Box
            component="button"
            onClick={handleGenerateImage}
            disabled={generating}
            sx={{
              mt: 2,
              width: '100%',
              height: 44,
              borderRadius: '10px',
              border: 'none',
              background: generating ? '#E0DEF7' : primary,
              color: generating ? '#64748b' : '#fff',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: generating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              '&:hover': {
                background: generating ? '#E0DEF7' : `${primary}dd`,
              },
            }}
          >
            {generating ? (
              <>
                <CircularProgress size={14} sx={{ color: '#64748b' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FaMagic size={13} />
                <span>Generate Image</span>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Generated Image Preview */}
      {generatedImageUrl && (
        <Box
          sx={{
            background: '#F9FAFB',
            border: '2px solid ' + primary,
            borderRadius: '12px',
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0d0e0f' }}>Generated Image ✨</Typography>
            <Box
              component="a"
              href={generatedImageUrl}
              download
              target="_blank"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 2,
                py: 0.75,
                borderRadius: '6px',
                background: primary,
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  background: `${primary}dd`,
                },
              }}
            >
              <FaDownload size={10} />
              Download
            </Box>
          </Box>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <Image src={generatedImageUrl} alt="Generated marketing image" fill style={{ objectFit: 'contain' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
