'use client';

/**
 * Visual Engine V2 — isolated testing surface for the Visual Content Engine PRD's
 * 4-layer pipeline (content → imagery → brand → typesetting), calling the equally
 * isolated backend module at /social-media/visual-engine/v2/*.
 *
 * Deliberately separate from the production content flow (ContentGeneratorForm /
 * UploadContentForm / DraftCard) so this can be exercised end-to-end on its own
 * before any decision is made about replacing that flow.
 */

import { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import {
  Sparkles,
  Image as ImageIcon,
  Layers,
  ClipboardCheck,
  AlertTriangle,
  Send,
  X,
  ZoomIn,
  Settings,
  Info,
} from 'lucide-react';
import {
  AspectFormat,
  BrandPrefsResult,
  CarouselSlideContent,
  CleanupLevel,
  ImageResult,
  LayerData,
  LogoControlMode,
  LogoPosition,
  NegativeSpace,
  QualityGateResult,
  ReviewQueueItem,
  StyleFamily,
  SupportedPlatform,
  VisualEngineMetrics,
  VisualEngineV2Service,
} from '@/src/api/VisualEngineV2Service';

const PRIMARY = '#CD1B78';
const PRIMARY_DARK = '#C2185B';

const POST_INTENTS = ['sale', 'product', 'announcement', 'testimonial', 'educational'] as const;
const FORMATS: AspectFormat[] = ['1:1', '4:5', '9:16'];
const PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin'];
const NEGATIVE_SPACE_OPTIONS: { value: NegativeSpace; label: string }[] = [
  { value: 'left_third', label: 'Left third' },
  { value: 'right_third', label: 'Right third' },
  { value: 'top_third', label: 'Top third' },
  { value: 'bottom_third', label: 'Bottom third' },
];
const CLEANUP_LEVELS: { value: CleanupLevel; label: string; hint: string }[] = [
  { value: 'none', label: 'None', hint: 'Use the photo as-is (still resized to fit)' },
  {
    value: 'background_removal',
    label: 'Background removal',
    hint: 'Strip the background onto the brand background — recommended',
  },
  { value: 'reframe', label: 'Reframe', hint: 'Smart-crop only, keep the original background' },
  {
    value: 'ai_recomposite',
    label: 'AI re-composite',
    hint: 'Preserve the product exactly, generate a new scene around it — premium, single-post only',
  },
];
const LOGO_POSITIONS: LogoPosition[] = [
  'top_left',
  'top_center',
  'top_right',
  'bottom_left',
  'bottom_center',
  'bottom_right',
  'center',
];
const STYLE_FAMILIES: StyleFamily[] = [
  'bold_modern',
  'minimal_clean',
  'modern_professional',
  'educational',
  'testimonial_social_proof',
  'playful_colorful',
  'elegant_luxury',
];

const tierStyle: Record<string, { bg: string; fg: string; label: string }> = {
  auto: { bg: '#ECFDF5', fg: '#16A34A', label: 'Auto-publish' },
  soft: { bg: '#FFFBEB', fg: '#D97706', label: 'Soft review' },
  mandatory: { bg: '#FEF2F2', fg: '#DC2626', label: 'Mandatory review' },
};

function SectionCard({
  step,
  icon,
  title,
  subtitle,
  disabled,
  children,
}: {
  step: number | string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 mb-5 transition-opacity"
      style={{ opacity: disabled ? 0.55 : 1 }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(205,27,120,0.08)', color: PRIMARY }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: PRIMARY }}>
              {typeof step === 'number' ? `Step ${step}` : step}
            </span>
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
      style={{ background: PRIMARY }}
    >
      {loading && <CircularProgress size={13} style={{ color: '#fff' }} />}
      {children}
    </button>
  );
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object') {
    const withResponse = e as { response?: { data?: { detail?: string } }; message?: string };
    return withResponse.response?.data?.detail || withResponse.message || fallback;
  }
  return fallback;
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg border text-sm font-semibold transition-colors hover:border-pink-500 hover:text-pink-600 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: '#E5E7EB', color: '#374151' }}
    >
      {children}
    </button>
  );
}

function Badge({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}

/** Thumbnail that opens `onPreview(src)` in an enlarged lightbox on click. */
function PreviewableImage({
  src,
  alt,
  className,
  onPreview,
}: {
  src: string;
  alt: string;
  className: string;
  onPreview: (url: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPreview(src)}
      className="group relative block"
      aria-label={`View enlarged: ${alt}`}
    >
      <img src={src} alt={alt} className={className} />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors">
        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
      </span>
    </button>
  );
}

/** Fullscreen enlarged preview — click backdrop or the X to close. */
function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 text-white/80 hover:text-white transition-colors"
        aria-label="Close preview"
      >
        <X className="w-7 h-7" />
      </button>
      <img
        src={url}
        alt="Enlarged preview"
        className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function VisualEngineV2Panel() {
  // Brand preferences — V2-only (style_family override, logo control mode)
  const [brandPrefs, setBrandPrefs] = useState<BrandPrefsResult | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [pendingLogoMode, setPendingLogoMode] = useState<LogoControlMode | null>(null);
  const [logoPositionDraft, setLogoPositionDraft] = useState<LogoPosition>('bottom_right');

  // Step 1: content plan
  const [seedContent, setSeedContent] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [postIntent, setPostIntent] = useState<(typeof POST_INTENTS)[number]>('announcement');
  const [contentLayer, setContentLayer] = useState<LayerData | null>(null);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlideContent[] | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);

  // Step 2: imagery
  const [imageFormat, setImageFormat] = useState<AspectFormat>('1:1');
  const [negativeSpace, setNegativeSpace] = useState<NegativeSpace>('left_third');
  const [cleanupLevel, setCleanupLevel] = useState<CleanupLevel>('background_removal');
  const [recompositeScene, setRecompositeScene] = useState('');
  const [imageryLayer, setImageryLayer] = useState<LayerData | null>(null);
  const [imageryLayers, setImageryLayers] = useState<LayerData[] | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageryNeedsAttention, setImageryNeedsAttention] = useState(false);

  // Success metrics (PRD Section 16)
  const [metrics, setMetrics] = useState<VisualEngineMetrics | null>(null);

  // Step 3: render
  const [selectedFormats, setSelectedFormats] = useState<AspectFormat[]>(['1:1']);
  const [carouselCount, setCarouselCount] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [formatOutputs, setFormatOutputs] = useState<Record<string, string[]>>({});
  const [activeOutputFormat, setActiveOutputFormat] = useState<AspectFormat>('1:1');
  const [qualityGate, setQualityGate] = useState<QualityGateResult | null>(null);
  const [renderCost, setRenderCost] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [styleFamily, setStyleFamily] = useState<string | null>(null);

  // Step 4: publish — bridges into the real posting pipeline
  const [connectedPlatforms, setConnectedPlatforms] = useState<SupportedPlatform[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [publishPlatform, setPublishPlatform] = useState<SupportedPlatform | ''>('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  // Review queue
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [sweeping, setSweeping] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isCarousel = carouselCount > 1;

  useEffect(() => {
    refreshReviewQueue();
    VisualEngineV2Service.getConnectedPlatforms()
      .then((res) => {
        setConnectedPlatforms(res.connected_platforms || []);
        setPublishPlatform(res.connected_platforms?.[0] || '');
      })
      .catch(() => setConnectedPlatforms([]))
      .finally(() => setLoadingConnections(false));
    VisualEngineV2Service.getBrandPrefs()
      .then((res) => {
        setBrandPrefs(res);
        if (res.logo_manual_position) setLogoPositionDraft(res.logo_manual_position);
      })
      .catch(() => setBrandPrefs(null))
      .finally(() => setLoadingPrefs(false));
    VisualEngineV2Service.getMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, []);

  const refreshReviewQueue = () => {
    setLoadingQueue(true);
    VisualEngineV2Service.getReviewQueue()
      .then((res) => setReviewQueue(res.responseData?.pending_reviews || []))
      .catch(() => setReviewQueue([]))
      .finally(() => setLoadingQueue(false));
  };

  const toggleFormat = (fmt: AspectFormat) => {
    setSelectedFormats((prev) =>
      prev.includes(fmt) ? (prev.length > 1 ? prev.filter((f) => f !== fmt) : prev) : [...prev, fmt]
    );
  };

  // Resets downstream state whenever the carousel slide count crosses the
  // single-post/carousel boundary, since the two flows use different content
  // + imagery shapes (flat vs per-slide) that can't carry over.
  const handleCarouselCountChange = (next: number) => {
    const clamped = Math.max(1, Math.min(10, next || 1));
    if (clamped > 1 !== isCarousel) {
      setContentLayer(null);
      setCarouselSlides(null);
      setImageryLayer(null);
      setImageryLayers(null);
    }
    setCarouselCount(clamped);
  };

  const handleLogoModeSelect = (mode: LogoControlMode) => {
    if (mode === 'user' && brandPrefs?.logo_control_mode !== 'user') {
      // Show the tradeoff warning before committing — PRD-driven UX from the
      // earlier logo-toggle design: user control means Orshot renders WITHOUT
      // a logo and we composite it afterward, so template-fit guarantees drop.
      setPendingLogoMode('user');
      return;
    }
    void saveLogoMode(mode, mode === 'user' ? logoPositionDraft : undefined);
  };

  const saveLogoMode = async (mode: LogoControlMode, position?: LogoPosition) => {
    setSavingPrefs(true);
    setError(null);
    try {
      const updated = await VisualEngineV2Service.updateBrandPrefs({
        logo_control_mode: mode,
        ...(position ? { logo_manual_position: position } : {}),
      });
      setBrandPrefs(updated);
      setPendingLogoMode(null);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to update logo preference'));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleStyleFamilyOverride = async (family: StyleFamily) => {
    setSavingPrefs(true);
    setError(null);
    try {
      const updated = await VisualEngineV2Service.updateBrandPrefs({ style_family: family });
      setBrandPrefs(updated);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to update style family'));
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!seedContent.trim()) return;
    setError(null);
    setGeneratingContent(true);
    try {
      if (isCarousel) {
        const result = await VisualEngineV2Service.generateCarouselContentPlan({
          seed_content: seedContent.trim(),
          platforms: [platform],
          post_intent: postIntent,
          carousel_count: carouselCount,
        });
        setContentLayer(result.content_layer);
        setCarouselSlides((result.content_layer.data.slides as CarouselSlideContent[]) || []);
      } else {
        const result = await VisualEngineV2Service.generateContentPlan({
          seed_content: seedContent.trim(),
          platforms: [platform],
          post_intent: postIntent,
        });
        setContentLayer(result.content_layer);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Content plan generation failed'));
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleGenerateImageA = async () => {
    if (!contentLayer) return;
    setError(null);
    setGeneratingImage(true);
    try {
      if (isCarousel && carouselSlides) {
        const result = await VisualEngineV2Service.carouselGenerateImagesPathA({
          image_briefs: carouselSlides.map((s) => s.image_brief),
          format: imageFormat,
          negative_space: negativeSpace,
        });
        setImageryLayers(result.imagery_layers);
        setImageryNeedsAttention(result.imagery_layers.some((l) => !!l.metadata?.needs_attention));
      } else {
        const result: ImageResult = await VisualEngineV2Service.generateImagePathA({
          content_plan: `${contentLayer.data.headline} ${contentLayer.data.subtext}`.trim(),
          format: imageFormat,
          negative_space: negativeSpace,
        });
        setImageryLayer(result.imagery_layer);
        setImageryNeedsAttention(!!result.needs_attention);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Path A image generation failed'));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleUploadImageB = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (isCarousel && cleanupLevel === 'ai_recomposite') {
      setError(
        "AI re-compositing isn't available for carousel uploads yet — use it on a single-post upload, or pick a different cleanup level for this carousel."
      );
      return;
    }
    if (!isCarousel && cleanupLevel === 'ai_recomposite' && !recompositeScene.trim()) {
      setError('Describe the new scene to generate around the product before uploading with AI re-composite.');
      return;
    }
    setError(null);
    setGeneratingImage(true);
    try {
      if (isCarousel) {
        const result = await VisualEngineV2Service.carouselUploadImagesPathB({
          files: Array.from(files),
          carouselCount,
          format: imageFormat,
          cleanupLevel,
        });
        setImageryLayers(result.imagery_layers);
        setImageryNeedsAttention(false);
      } else {
        const result: ImageResult = await VisualEngineV2Service.uploadImagePathB({
          file: files[0],
          format: imageFormat,
          cleanupLevel,
          contentPlan: cleanupLevel === 'ai_recomposite' ? recompositeScene.trim() : undefined,
        });
        setImageryLayer(result.imagery_layer);
        setImageryNeedsAttention(!!result.needs_attention);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Path B upload failed'));
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRender = async () => {
    setError(null);
    setRendering(true);
    setPublishResult(null);
    try {
      if (isCarousel) {
        if (!contentLayer || !imageryLayers) return;
        const result = await VisualEngineV2Service.renderCarousel({
          content_layer: contentLayer,
          imagery_layers: imageryLayers,
          formats: selectedFormats,
          carousel_count: carouselCount,
        });
        setRenderId(result.render_id);
        setFormatOutputs(result.format_outputs);
        setTemplateId(result.template_id);
        setStyleFamily(result.style_family);
        setQualityGate(result.quality_gate);
        setRenderCost(result.total_cost);
      } else {
        if (!contentLayer || !imageryLayer) return;
        const result = await VisualEngineV2Service.render({
          content_layer: contentLayer,
          imagery_layer: imageryLayer,
          formats: selectedFormats,
        });
        setRenderId(result.render_id);
        setFormatOutputs(result.format_outputs);
        setTemplateId(result.template_id);
        setStyleFamily(result.style_family);
        setQualityGate(result.quality_gate);
        setRenderCost(result.total_cost);
      }
      setActiveOutputFormat(selectedFormats[0]);
      refreshReviewQueue();
    } catch (e) {
      setError(getErrorMessage(e, 'Render failed'));
    } finally {
      setRendering(false);
    }
  };

  const handleSweep = async () => {
    setSweeping(true);
    try {
      await VisualEngineV2Service.sweepExpiredReviews();
      refreshReviewQueue();
    } finally {
      setSweeping(false);
    }
  };

  const handlePublish = async (immediate: boolean) => {
    if (!renderId || !publishPlatform) return;
    setError(null);
    setPublishing(true);
    try {
      const iso = !immediate && scheduleAt ? new Date(scheduleAt).toISOString() : undefined;
      const result = await VisualEngineV2Service.publishRender(renderId, publishPlatform, iso);
      setPublishResult(
        immediate
          ? `Published to ${result.platform} (draft ${result.draft_id})`
          : `Scheduled on ${result.platform} for ${scheduleAt} (draft ${result.draft_id})`
      );
    } catch (e) {
      setError(getErrorMessage(e, 'Publish failed'));
    } finally {
      setPublishing(false);
    }
  };

  const tier = qualityGate ? tierStyle[qualityGate.review_tier] : null;
  const canRender = isCarousel ? !!(contentLayer && imageryLayers?.length) : !!(contentLayer && imageryLayer);
  const imageryReadyCount = isCarousel ? imageryLayers?.length || 0 : imageryLayer ? 1 : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-7 h-7" style={{ color: PRIMARY }} />
            <h1 className="text-2xl font-bold text-gray-900">Visual Engine V2</h1>
            <Badge bg="rgba(205,27,120,0.08)" fg={PRIMARY}>
              Beta — isolated testing
            </Badge>
          </div>
          <p className="text-gray-600 text-sm">
            Content → Imagery → Brand → Typesetting, per the Visual Content Engine PRD. Not wired into the main Create
            Content flow yet.
          </p>
          {metrics && metrics.total_renders > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge bg="#F3F4F6" fg="#4B5563">
                {metrics.total_renders} renders
              </Badge>
              {metrics.render_success_rate !== null && (
                <Badge bg="#F3F4F6" fg="#4B5563">
                  {Math.round(metrics.render_success_rate * 100)}% render success
                </Badge>
              )}
              {metrics.auto_publish_rate !== null && (
                <Badge bg="#F3F4F6" fg="#4B5563">
                  {Math.round(metrics.auto_publish_rate * 100)}% auto-publish
                </Badge>
              )}
              {metrics.avg_cost_per_post_usd !== null && (
                <Badge bg="#F3F4F6" fg="#4B5563">
                  avg ${metrics.avg_cost_per_post_usd.toFixed(3)}/post
                </Badge>
              )}
              {metrics.avg_cost_per_carousel_usd !== null && (
                <Badge bg="#F3F4F6" fg="#4B5563">
                  avg ${metrics.avg_cost_per_carousel_usd.toFixed(3)}/carousel
                </Badge>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            className="mb-5 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
            style={{ background: '#FEF2F2', color: '#B91C1C' }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Brand preferences — V2-only style_family + logo control */}
        <SectionCard
          step="Brand"
          icon={<Settings className="w-4 h-4" />}
          title="Brand preferences for this brand"
          subtitle="Stored separately from the shared brand profile — logo control and template style family for Visual Engine V2 only."
        >
          {loadingPrefs ? (
            <div className="flex justify-center py-3">
              <CircularProgress size={16} style={{ color: PRIMARY }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Template style family</p>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_FAMILIES.map((fam) => {
                    const active = brandPrefs?.style_family === fam;
                    return (
                      <button
                        key={fam}
                        onClick={() => handleStyleFamilyOverride(fam)}
                        disabled={savingPrefs}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                        style={{
                          borderColor: active ? PRIMARY : '#E5E7EB',
                          background: active ? 'rgba(205,27,120,0.08)' : '#fff',
                          color: active ? PRIMARY : '#6B7280',
                        }}
                      >
                        {fam.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {brandPrefs?.style_family_override
                    ? 'Manually overridden.'
                    : "Auto-derived from this brand's chosen visual styles."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Logo positioning</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleLogoModeSelect('agent')}
                    disabled={savingPrefs}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandPrefs?.logo_control_mode === 'agent' ? PRIMARY : '#E5E7EB',
                      background: brandPrefs?.logo_control_mode === 'agent' ? 'rgba(205,27,120,0.08)' : '#fff',
                      color: brandPrefs?.logo_control_mode === 'agent' ? PRIMARY : '#6B7280',
                    }}
                  >
                    Let the agent handle it
                  </button>
                  <button
                    onClick={() => handleLogoModeSelect('user')}
                    disabled={savingPrefs}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandPrefs?.logo_control_mode === 'user' ? PRIMARY : '#E5E7EB',
                      background: brandPrefs?.logo_control_mode === 'user' ? 'rgba(205,27,120,0.08)' : '#fff',
                      color: brandPrefs?.logo_control_mode === 'user' ? PRIMARY : '#6B7280',
                    }}
                  >
                    I'll choose the position
                  </button>
                </div>

                {pendingLogoMode === 'user' && (
                  <div
                    className="mt-3 px-3.5 py-3 rounded-lg text-xs"
                    style={{ background: '#FFFBEB', color: '#92400E' }}
                  >
                    <div className="flex items-start gap-2 mb-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>
                        Choosing your own logo position means the template renders <b>without</b> a logo, and we stamp
                        it on afterward at your exact position. This loses the template's guaranteed logo-fit — the logo
                        may sit less precisely than a template built with a logo slot.
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none"
                        value={logoPositionDraft}
                        onChange={(e) => setLogoPositionDraft(e.target.value as LogoPosition)}
                      >
                        {LOGO_POSITIONS.map((p) => (
                          <option key={p} value={p}>
                            {p.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                      <button
                        className="text-xs font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-90"
                        style={{ background: PRIMARY_DARK, color: '#fff' }}
                        onClick={() => saveLogoMode('user', logoPositionDraft)}
                        disabled={savingPrefs}
                      >
                        Confirm
                      </button>
                      <button
                        className="text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors hover:bg-gray-50"
                        style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                        onClick={() => setPendingLogoMode(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {brandPrefs?.logo_control_mode === 'user' && brandPrefs.logo_manual_position && !pendingLogoMode && (
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Logo stamped at: {brandPrefs.logo_manual_position.replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Step 1: Content layer */}
        <SectionCard
          step={1}
          icon={<Sparkles className="w-4 h-4" />}
          title="Content layer"
          subtitle={
            isCarousel
              ? 'One AI call plans the whole carousel narrative arc — hook, body, close.'
              : 'AI text only — headline, subhead, promo, CTA. Never pixels.'
          }
        >
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 mb-3 resize-none"
            style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
            rows={2}
            placeholder="What's this post about? e.g. Weekend sale, 20% off all sauces"
            value={seedContent}
            onChange={(e) => setSeedContent(e.target.value)}
          />
          <div className="flex flex-wrap gap-2.5 mb-4">
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={postIntent}
              onChange={(e) => setPostIntent(e.target.value as (typeof POST_INTENTS)[number])}
            >
              {POST_INTENTS.map((intent) => (
                <option key={intent} value={intent}>
                  {intent}
                  {(intent === 'sale' || intent === 'product') && ' (includes promo)'}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">Carousel slides</label>
              <input
                type="number"
                min={1}
                max={10}
                value={carouselCount}
                onChange={(e) => handleCarouselCountChange(Number(e.target.value))}
                className="w-16 rounded-lg border border-gray-200 px-2.5 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
          <PrimaryButton onClick={handleGenerateContent} disabled={!seedContent.trim()} loading={generatingContent}>
            {generatingContent
              ? 'Generating…'
              : isCarousel
                ? `Plan ${carouselCount}-slide carousel`
                : 'Generate content plan'}
          </PrimaryButton>

          {!isCarousel && contentLayer && (
            <div className="mt-4 p-4 rounded-lg" style={{ background: '#FAFAF8' }}>
              <p className="text-sm font-bold text-gray-900">{contentLayer.data.headline}</p>
              <p className="text-xs text-gray-500 mt-1">{contentLayer.data.subtext}</p>
              <div className="flex items-center gap-2 mt-2.5">
                {contentLayer.data.promo && (
                  <Badge bg="#FFFBEB" fg="#B45309">
                    {contentLayer.data.promo}
                  </Badge>
                )}
                <Badge bg="rgba(205,27,120,0.08)" fg={PRIMARY}>
                  {contentLayer.data.cta}
                </Badge>
              </div>
            </div>
          )}

          {isCarousel && carouselSlides && carouselSlides.length > 0 && (
            <div className="mt-4 space-y-2">
              {carouselSlides.map((slide, i) => (
                <div key={i} className="p-3 rounded-lg flex items-start gap-3" style={{ background: '#FAFAF8' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                    style={{ background: 'rgba(205,27,120,0.1)', color: PRIMARY }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      {slide.headline || <span className="text-gray-300">—</span>}
                    </p>
                    {slide.subtext && <p className="text-xs text-gray-500 mt-0.5">{slide.subtext}</p>}
                    <p className="text-[11px] text-gray-400 mt-1 italic truncate">{slide.image_brief}</p>
                    {(slide.cta || slide.promo) && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {slide.promo && (
                          <Badge bg="#FFFBEB" fg="#B45309">
                            {slide.promo}
                          </Badge>
                        )}
                        {slide.cta && (
                          <Badge bg="rgba(205,27,120,0.08)" fg={PRIMARY}>
                            {slide.cta}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Step 2: Imagery layer */}
        <SectionCard
          step={2}
          icon={<ImageIcon className="w-4 h-4" />}
          title="Imagery layer"
          subtitle={
            isCarousel
              ? 'Path A: one independent image generated per slide brief. Path B: one photo per slide (repeats the last if fewer are uploaded).'
              : 'Path A: generate imagery-only. Path B: your real product photo, cleaned up.'
          }
          disabled={!contentLayer}
        >
          {!loadingPrefs && brandPrefs && !isCarousel && (
            <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              {brandPrefs.has_product_images
                ? 'This brand has product photos on file — Path B is recommended.'
                : 'No product photos on file for this brand yet — Path A (generate) is recommended until you upload one.'}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={imageFormat}
              onChange={(e) => setImageFormat(e.target.value as AspectFormat)}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              value={negativeSpace}
              onChange={(e) => setNegativeSpace(e.target.value as NegativeSpace)}
              title="Where Path A leaves clean space for the template's text/logo"
            >
              {NEGATIVE_SPACE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Text space: {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <SecondaryButton onClick={handleGenerateImageA} disabled={!contentLayer || generatingImage}>
              {generatingImage
                ? 'Generating…'
                : isCarousel
                  ? `Path A: Generate ${carouselCount} slide images`
                  : 'Path A: Generate'}
            </SecondaryButton>
            <label
              className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors hover:border-pink-500 hover:text-pink-600 cursor-pointer ${
                !contentLayer || generatingImage ? 'opacity-40 pointer-events-none' : ''
              }`}
              style={{ borderColor: '#E5E7EB', color: '#374151' }}
            >
              {isCarousel ? `Path B: Upload up to ${carouselCount} photos` : 'Path B: Upload'}
              <input
                type="file"
                hidden
                accept="image/*"
                multiple={isCarousel}
                onChange={(e) => handleUploadImageB(e.target.files)}
              />
            </label>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Path B cleanup level</p>
            <div className="flex flex-wrap gap-1.5">
              {CLEANUP_LEVELS.map((lvl) => {
                const active = cleanupLevel === lvl.value;
                return (
                  <button
                    key={lvl.value}
                    onClick={() => setCleanupLevel(lvl.value)}
                    title={lvl.hint}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={{
                      borderColor: active ? PRIMARY : '#E5E7EB',
                      background: active ? 'rgba(205,27,120,0.08)' : '#fff',
                      color: active ? PRIMARY : '#6B7280',
                    }}
                  >
                    {lvl.label}
                  </button>
                );
              })}
            </div>
            {cleanupLevel === 'ai_recomposite' && isCarousel && (
              <p className="text-[11px] mt-1.5 flex items-center gap-1" style={{ color: '#B45309' }}>
                <Info className="w-3 h-3" /> Not available for carousels yet — switch to a single post (1 slide) to use
                it.
              </p>
            )}
            {cleanupLevel === 'ai_recomposite' && !isCarousel && (
              <div className="mt-2.5">
                <p className="text-[11px] mb-1.5 flex items-start gap-1" style={{ color: '#B45309' }}>
                  <Info className="w-3 h-3 mt-0.5 shrink-0" />
                  The product is cut out and preserved exactly; only the scene around it is regenerated. Always requires
                  mandatory review before publishing.
                </p>
                <textarea
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none resize-none"
                  rows={2}
                  placeholder="Describe the new scene, e.g. a marble kitchen counter with warm morning light"
                  value={recompositeScene}
                  onChange={(e) => setRecompositeScene(e.target.value)}
                />
              </div>
            )}
          </div>

          {imageryNeedsAttention && (
            <div
              className="mb-3 px-3.5 py-2.5 rounded-lg text-xs flex items-start gap-2"
              style={{ background: '#FFFBEB', color: '#92400E' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {isCarousel
                  ? 'One or more slide images failed after a retry — a brand-colored placeholder was used for that slide. This will be flagged for mandatory review.'
                  : 'Generation failed after a retry — a brand-colored placeholder was used instead. This will be flagged for mandatory review.'}
              </span>
            </div>
          )}

          {!isCarousel && imageryLayer && (
            <PreviewableImage
              src={imageryLayer.data.imagery_url as string}
              alt="Generated imagery"
              className="max-w-[200px] rounded-lg border border-gray-200"
              onPreview={setPreviewUrl}
            />
          )}

          {isCarousel && imageryLayers && imageryLayers.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {imageryLayers.map((layer, i) => (
                <PreviewableImage
                  key={i}
                  src={layer.data.imagery_url as string}
                  alt={`Slide ${i + 1} imagery`}
                  className="w-28 rounded-lg border border-gray-200"
                  onPreview={setPreviewUrl}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Step 3: Render */}
        <SectionCard
          step={3}
          icon={<Layers className="w-4 h-4" />}
          title="Render — brand + typesetting"
          subtitle="Exact brand values injected into a locked template. One plan, every format."
          disabled={!canRender}
        >
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Formats to render (PRD Section 14)</p>
            <div className="flex gap-2">
              {FORMATS.map((f) => {
                const active = selectedFormats.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFormat(f)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={{
                      borderColor: active ? PRIMARY : '#E5E7EB',
                      background: active ? 'rgba(205,27,120,0.08)' : '#fff',
                      color: active ? PRIMARY : '#6B7280',
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            {isCarousel && (
              <p className="text-xs text-gray-500">
                {imageryReadyCount}/{carouselCount} slide images ready
              </p>
            )}
            <PrimaryButton onClick={handleRender} disabled={!canRender} loading={rendering}>
              {rendering ? 'Rendering…' : isCarousel ? `Render ${carouselCount}-slide carousel` : 'Render'}
            </PrimaryButton>
          </div>

          {qualityGate && tier && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge bg={tier.bg} fg={tier.fg}>
                {tier.label}
              </Badge>
              <Badge bg="#F3F4F6" fg="#4B5563">
                Confidence {qualityGate.quality_score.toFixed(2)}
              </Badge>
              <Badge bg="#F3F4F6" fg="#4B5563">
                ${renderCost.toFixed(4)}
              </Badge>
              {templateId && (
                <Badge bg="#EEF2FF" fg="#4338CA">
                  Template: {templateId}
                  {styleFamily ? ` (${styleFamily})` : ''}
                </Badge>
              )}
              {qualityGate.issues.length > 0 && (
                <Badge bg="#FEF2F2" fg="#B91C1C">
                  {qualityGate.issues.join(', ')}
                </Badge>
              )}
            </div>
          )}

          {Object.keys(formatOutputs).length > 0 && (
            <div>
              {Object.keys(formatOutputs).length > 1 && (
                <div className="flex gap-1.5 mb-3">
                  {Object.keys(formatOutputs).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setActiveOutputFormat(fmt as AspectFormat)}
                      className="px-3 py-1 rounded-md text-xs font-semibold border transition-colors"
                      style={{
                        borderColor: activeOutputFormat === fmt ? PRIMARY : '#E5E7EB',
                        color: activeOutputFormat === fmt ? PRIMARY : '#9CA3AF',
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                {(formatOutputs[activeOutputFormat] || []).map((url, i) => (
                  <PreviewableImage
                    key={i}
                    src={url}
                    alt={`Render ${i + 1}`}
                    className="w-36 rounded-lg border border-gray-200"
                    onPreview={setPreviewUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Step 4: Publish — bridges into the real posting pipeline */}
        <SectionCard
          step={4}
          icon={<Send className="w-4 h-4" />}
          title="Publish"
          subtitle="Bridges into the existing content_drafts + posting pipeline — no separate posting logic here."
          disabled={!renderId}
        >
          {loadingConnections ? (
            <div className="flex justify-center py-4">
              <CircularProgress size={18} style={{ color: PRIMARY }} />
            </div>
          ) : connectedPlatforms.length === 0 ? (
            <p className="text-xs text-gray-500">
              No connected social accounts found for this brand. Connect one under Connected Accounts first.
            </p>
          ) : (
            <>
              {qualityGate?.requires_review && (
                <div
                  className="mb-3 px-3.5 py-2.5 rounded-lg text-xs flex items-start gap-2"
                  style={{ background: '#FFFBEB', color: '#92400E' }}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>This render needs approval in the review queue below before it can be published.</span>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-2.5 mb-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Platform</label>
                  <select
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none"
                    value={publishPlatform}
                    onChange={(e) => setPublishPlatform(e.target.value as SupportedPlatform)}
                  >
                    {connectedPlatforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <PrimaryButton onClick={() => handlePublish(true)} disabled={!renderId} loading={publishing}>
                  {publishing ? 'Publishing…' : 'Publish now'}
                </PrimaryButton>
              </div>

              <div className="flex flex-wrap items-end gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Or schedule for</label>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
                  />
                </div>
                <SecondaryButton onClick={() => handlePublish(false)} disabled={!renderId || !scheduleAt || publishing}>
                  Schedule
                </SecondaryButton>
              </div>

              {publishResult && (
                <div
                  className="mt-3 px-3.5 py-2.5 rounded-lg text-xs"
                  style={{ background: '#ECFDF5', color: '#166534' }}
                >
                  {publishResult}
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Review queue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(205,27,120,0.08)', color: PRIMARY }}
            >
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">Review queue ({reviewQueue.length})</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Soft-tier items auto-publish if not rejected within their window; mandatory-tier never does.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <SecondaryButton onClick={refreshReviewQueue} disabled={loadingQueue}>
                Refresh
              </SecondaryButton>
              <SecondaryButton onClick={handleSweep} disabled={sweeping}>
                {sweeping ? 'Sweeping…' : 'Sweep expired'}
              </SecondaryButton>
            </div>
          </div>

          {loadingQueue ? (
            <div className="flex justify-center py-6">
              <CircularProgress size={20} style={{ color: PRIMARY }} />
            </div>
          ) : reviewQueue.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Nothing pending review.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviewQueue.map((item) => {
                const itemTier = tierStyle[item.review_tier];
                return (
                  <div key={item.queue_id} className="flex items-center gap-3 py-3">
                    {item.preview_url && (
                      <img
                        src={item.preview_url}
                        alt="preview"
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.content_preview?.headline || item.render_id}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{item.review_reason}</p>
                    </div>
                    <Badge bg={itemTier.bg} fg={itemTier.fg}>
                      {item.review_tier}
                    </Badge>
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-90"
                      style={{ background: PRIMARY_DARK, color: '#fff' }}
                      onClick={() => VisualEngineV2Service.approveReview(item.queue_id).then(refreshReviewQueue)}
                    >
                      Approve
                    </button>
                    <button
                      className="text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                      onClick={() => VisualEngineV2Service.rejectReview(item.queue_id).then(refreshReviewQueue)}
                    >
                      Reject
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Lightbox url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  );
}
