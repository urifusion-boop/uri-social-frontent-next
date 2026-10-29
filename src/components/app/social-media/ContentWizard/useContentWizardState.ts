'use client';

import { useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { ContentDraft, SocialMediaAgentService } from '@/src/api/SocialMediaAgentService';
import { BillingService } from '@/src/api/BillingService';
import { BrandProfileService } from '@/src/api/BrandProfileService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { EventBus, EVENTS } from '@/src/services/EventBus';
import { takeContentSeed } from '@/src/utils/contentSeed';
import { buildGenerateContentPayload } from '../generateContentPayload';

export const PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tiktok', label: 'TikTok' },
];

export type PostType = 'feed' | 'carousel' | 'story';

export const MAX_REFERENCE_IMAGES = 10;
const IMAGE_MODEL = 'openai/gpt-image-2';

export interface ReferenceImage {
  dataUrl: string;
  name: string;
  included: boolean;
  label?: string;
  removeBackground?: boolean;
}

function friendlyGenerationError(msg?: string): string {
  if (!msg) return 'Something went wrong — if the issue persists, contact support.';
  const lower = msg.toLowerCase();
  if (
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('unavailable') ||
    lower.includes('failed for all platforms') ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  )
    return 'We are experiencing high demand right now, please try again in a few minutes — if the issue persists, contact support.';
  return 'Something went wrong — if the issue persists, contact support.';
}

// Everything ContentGeneratorForm.tsx owns, ported as a hook so the wizard's
// 4 step components can share one real implementation instead of each
// re-deriving the same state/validation/submit logic.
export function useContentWizardState(requireEmailVerification: (callback?: () => void) => boolean) {
  const [seedContent, setSeedContent] = useState('');
  const [expanding, setExpanding] = useState(false);
  const [ideaBeforeExpand, setIdeaBeforeExpand] = useState<string | null>(null);
  const [expandedFrom, setExpandedFrom] = useState<string[]>([]);
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);

  const platformsTouched = useRef(false);
  useEffect(() => {
    BrandProfileService.getTargetPlatformKeys().then((keys) => {
      if (keys.length && !platformsTouched.current) setSelectedPlatforms(keys);
    });
  }, []);

  useEffect(() => {
    const handed = takeContentSeed();
    if (!handed?.seed) return;
    setSeedContent(handed.seed);
    const known = handed.platforms?.filter((p) =>
      ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok'].includes(p)
    );
    if (known?.length) {
      platformsTouched.current = true;
      setSelectedPlatforms(known);
    }
    ToastService.showToast(
      'Brief from your market opportunity is ready — review it and generate.',
      ToastTypeEnum.Success
    );
  }, []);

  const [includeImages, setIncludeImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const isGeneratingRef = useRef(false);
  const [postType, setPostType] = useState<PostType>('feed');
  const [numSlides, setNumSlides] = useState(3);
  const [manualSlideAssignment, setManualSlideAssignment] = useState(false);
  const [slideImageOverrides, setSlideImageOverrides] = useState<Record<number, number | null>>({});
  const [useCustomCta, setUseCustomCta] = useState(false);
  const [customCta, setCustomCta] = useState('');

  const [profileStyles, setProfileStyles] = useState<string[]>([]);
  const [useStyleOverride, setUseStyleOverride] = useState(false);
  const [selectedOverrideStyles, setSelectedOverrideStyles] = useState<string[]>([]);

  const [outOfCreditsOpen, setOutOfCreditsOpen] = useState(false);
  const [lowCreditWarningOpen, setLowCreditWarningOpen] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0);

  const [noImageConfirmOpen, setNoImageConfirmOpen] = useState(false);
  const [incompleteProfileOpen, setIncompleteProfileOpen] = useState(false);
  const [incompleteProfileData, setIncompleteProfileData] = useState<{
    missing_fields?: string[];
    implications?: Record<string, string>;
    can_proceed?: boolean;
  } | null>(null);

  // What step 3/4 produced — the real created drafts, used directly by the
  // Review & Schedule step instead of the old form's blind redirect-and-
  // refetch (generateContent() already returns them; it was just unused).
  const [generatedDrafts, setGeneratedDrafts] = useState<ContentDraft[] | null>(null);

  const showPostTypeSelector = selectedPlatforms.some(
    (p) => p === 'instagram' || p === 'facebook' || p === 'linkedin' || p === 'tiktok'
  );
  useEffect(() => {
    if (!showPostTypeSelector && postType !== 'feed') setPostType('feed');
  }, [showPostTypeSelector, postType]);

  const slideImageIndex = (slideIndex: number): number | null => {
    if (referenceImages.length === 0) return null;
    if (slideIndex in slideImageOverrides) return slideImageOverrides[slideIndex];
    return slideIndex % referenceImages.length;
  };

  const toggleManualSlideAssignment = () => {
    setManualSlideAssignment((prev) => {
      if (prev) setSlideImageOverrides({});
      return !prev;
    });
  };

  const togglePlatform = (key: string) => {
    platformsTouched.current = true;
    setSelectedPlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const processImageFile = (file: File, showSuccessToast = false) => {
    if (!file.type.startsWith('image/')) {
      ToastService.showToast('Please upload an image file', ToastTypeEnum.Error);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      ToastService.showToast('Image must be under 10MB', ToastTypeEnum.Error);
      return;
    }
    if (referenceImages.length >= MAX_REFERENCE_IMAGES) {
      ToastService.showToast(`You can attach up to ${MAX_REFERENCE_IMAGES} reference images`, ToastTypeEnum.Error);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImages((prev) => [...prev, { dataUrl: reader.result as string, name: file.name, included: true }]);
      if (showSuccessToast) ToastService.showToast('Image uploaded successfully', ToastTypeEnum.Success);
    };
    reader.readAsDataURL(file);
  };

  const processImageFiles = (files: File[]) => {
    const room = MAX_REFERENCE_IMAGES - referenceImages.length;
    if (room <= 0) {
      ToastService.showToast(`You can attach up to ${MAX_REFERENCE_IMAGES} reference images`, ToastTypeEnum.Error);
      return;
    }
    files.slice(0, room).forEach((file) => processImageFile(file));
    if (files.length > room) {
      ToastService.showToast(
        `Only the first ${room} image(s) were added (max ${MAX_REFERENCE_IMAGES})`,
        ToastTypeEnum.Warning
      );
    }
  };

  const removeReferenceImageAt = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setSlideImageOverrides({});
  };

  const updateReferenceImageAt = (index: number, patch: Partial<ReferenceImage>) => {
    setReferenceImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  const includedCount = referenceImages.filter((img) => img.included).length;
  const isCombineMode = postType !== 'carousel' && includedCount > 1;

  useEffect(() => {
    BrandProfileService.get()
      .then((res) => setProfileStyles(res.responseData?.style_selections ?? []))
      .catch(() => setProfileStyles([]));
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (
        referenceImages.length < MAX_REFERENCE_IMAGES &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        const items = Array.from(e.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));
        if (imageItem) {
          e.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            const timestamp = new Date().getTime();
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File([file], `pasted-image-${timestamp}.${extension}`, { type: file.type });
            processImageFile(renamedFile, true);
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [referenceImages]);

  const refreshCredits = async () => {
    try {
      const balance = await BillingService.getCreditBalance();
      setCreditsRemaining(balance.credits_remaining);
      if (balance.low_credit_warning && balance.credits_remaining > 0 && balance.credits_remaining <= 3) {
        setLowCreditWarningOpen(true);
      }
    } catch (error) {
      console.error('Failed to check credits:', error);
    }
  };
  useEffect(() => {
    refreshCredits();
  }, []);

  const photosForPost = (postType === 'carousel' ? referenceImages : referenceImages.filter((img) => img.included)).map(
    (img) => img.label?.trim() ?? ''
  );
  const ctaForPost = useCustomCta ? customCta.trim() : '';
  const stylesForPost = useStyleOverride ? selectedOverrideStyles : [];
  const settingsKey = JSON.stringify([
    [...selectedPlatforms].sort(),
    postType,
    postType === 'carousel' ? numSlides : null,
    stylesForPost,
    photosForPost,
    ctaForPost,
  ]);
  const settingsChangedSinceExpand = ideaBeforeExpand !== null && expandedFor !== null && expandedFor !== settingsKey;

  const handleExpand = async (fromIdea?: string) => {
    const idea = (fromIdea ?? seedContent).trim();
    if (idea.length < 3 || expanding) return;
    setExpanding(true);
    try {
      const res = await SocialMediaAgentService.expandPrompt({
        idea,
        platforms: selectedPlatforms,
        post_type: postType,
        ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
        include_images: includeImages,
        ...(stylesForPost.length > 0 ? { style_override: stylesForPost } : {}),
        ...(ctaForPost ? { override_cta: ctaForPost } : {}),
        ...(photosForPost.length > 0 ? { reference_image_labels: photosForPost } : {}),
      });
      if (res.status && res.responseData?.expanded_prompt) {
        setIdeaBeforeExpand(idea);
        setSeedContent(res.responseData.expanded_prompt);
        setExpandedFrom(res.responseData.used ?? []);
        setExpandedFor(settingsKey);
        posthog.capture('prompt_expanded', { platforms: selectedPlatforms, post_type: postType });
      } else {
        ToastService.showToast(res.responseMessage || "Jane couldn't expand that — try again.", ToastTypeEnum.Error);
      }
    } catch (err) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail;
      ToastService.showToast(detail || "Jane couldn't expand that — try again.", ToastTypeEnum.Error);
    } finally {
      setExpanding(false);
    }
  };

  const undoExpand = () => {
    if (ideaBeforeExpand === null) return;
    setSeedContent(ideaBeforeExpand);
    setIdeaBeforeExpand(null);
    setExpandedFrom([]);
    setExpandedFor(null);
  };

  const doGenerate = async (acknowledgedIncomplete = false) => {
    setLoading(true);
    try {
      const payload = buildGenerateContentPayload({
        seedContent,
        selectedPlatforms,
        includeImages,
        imageModel: IMAGE_MODEL,
        postType,
        numSlides,
        acknowledgedIncomplete,
        customCta,
        useCustomCta,
        selectedOverrideStyles,
        useStyleOverride,
        referenceImages,
        slideImageIndex,
      });
      const response = await SocialMediaAgentService.generateContent(payload);

      if (response.status) {
        ToastService.showToast('Content generated — review it below.', ToastTypeEnum.Success);
        posthog.capture('content_generated', {
          platforms: selectedPlatforms,
          post_type: postType,
          include_images: includeImages,
          reference_image_count: referenceImages.length,
          manual_slide_assignment: postType === 'carousel' ? manualSlideAssignment : undefined,
          ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
          source: 'content_wizard',
        });
        setGeneratedDrafts(response.responseData?.drafts ?? []);

        EventBus.emit(EVENTS.CREDIT_CONSUMED, { amount: 1, operation: 'content_generation' });
        const balance = await BillingService.getCreditBalance();
        setCreditsRemaining(balance.credits_remaining);
      } else {
        if (response.responseCode === 'INCOMPLETE_PROFILE') {
          setIncompleteProfileData(
            response.responseData as unknown as {
              missing_fields?: string[];
              implications?: Record<string, string>;
              can_proceed?: boolean;
            } | null
          );
          setIncompleteProfileOpen(true);
        } else if (response.responseCode === 402) {
          posthog.capture('out_of_credits', { source: 'content_generation' });
          setOutOfCreditsOpen(true);
        } else {
          ToastService.showToast(friendlyGenerationError(response.responseMessage), ToastTypeEnum.Error);
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { responseMessage?: string } } };
      if (error?.response?.status === 402) {
        setOutOfCreditsOpen(true);
      } else {
        ToastService.showToast(friendlyGenerationError(error?.response?.data?.responseMessage), ToastTypeEnum.Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    try {
      const canProceed = requireEmailVerification();
      if (!canProceed) return;

      if (seedContent.trim().length < 10) {
        ToastService.showToast('Seed content must be at least 10 characters', ToastTypeEnum.Error);
        return;
      }
      if (selectedPlatforms.length === 0) {
        ToastService.showToast('Select at least one platform', ToastTypeEnum.Error);
        return;
      }

      try {
        const canGenerate = await BillingService.canGenerateContent();
        if (!canGenerate.can_generate || canGenerate.blocked) {
          setOutOfCreditsOpen(true);
          return;
        }
      } catch (error) {
        console.error('Credit check failed:', error);
      }

      if (!includeImages) {
        setNoImageConfirmOpen(true);
        return;
      }

      await doGenerate();
    } finally {
      isGeneratingRef.current = false;
    }
  };

  // Re-pulls the freshly generated drafts from the real drafts list — used by
  // step 4 so edits/approvals made through DraftCard (which calls this after
  // nearly every action) reflect server truth, the same way the Drafts tab does.
  const refreshGeneratedDrafts = async () => {
    if (!generatedDrafts || generatedDrafts.length === 0) return;
    const ids = new Set(generatedDrafts.map((d) => d.id ?? d.draft_id).filter(Boolean));
    try {
      const res = await SocialMediaAgentService.getContentCalendar();
      const all = res.responseData?.drafts ?? [];
      const fresh = all.filter((d) => ids.has(d.id ?? d.draft_id));
      if (fresh.length) setGeneratedDrafts(fresh);
    } catch (error) {
      console.error('Failed to refresh generated drafts:', error);
    }
  };

  const charCount = seedContent.length;
  const isValid = charCount >= 10 && charCount <= 5000 && selectedPlatforms.length > 0;

  return {
    seedContent,
    setSeedContent,
    expanding,
    ideaBeforeExpand,
    expandedFrom,
    settingsChangedSinceExpand,
    handleExpand,
    undoExpand,
    selectedPlatforms,
    togglePlatform,
    includeImages,
    setIncludeImages,
    loading,
    referenceImages,
    processImageFiles,
    removeReferenceImageAt,
    updateReferenceImageAt,
    includedCount,
    isCombineMode,
    postType,
    setPostType,
    numSlides,
    setNumSlides,
    manualSlideAssignment,
    toggleManualSlideAssignment,
    slideImageOverrides,
    setSlideImageOverrides,
    slideImageIndex,
    useCustomCta,
    setUseCustomCta,
    customCta,
    setCustomCta,
    profileStyles,
    useStyleOverride,
    setUseStyleOverride,
    selectedOverrideStyles,
    setSelectedOverrideStyles,
    outOfCreditsOpen,
    setOutOfCreditsOpen,
    lowCreditWarningOpen,
    setLowCreditWarningOpen,
    creditsRemaining,
    refreshCredits,
    noImageConfirmOpen,
    setNoImageConfirmOpen,
    incompleteProfileOpen,
    setIncompleteProfileOpen,
    incompleteProfileData,
    showPostTypeSelector,
    handleGenerate,
    doGenerate,
    generatedDrafts,
    refreshGeneratedDrafts,
    charCount,
    isValid,
  };
}

export type ContentWizardState = ReturnType<typeof useContentWizardState>;
