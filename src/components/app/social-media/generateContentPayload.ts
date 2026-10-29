import { GenerateContentPayload } from '@/src/api/SocialMediaAgentService';

export interface ReferenceImageInput {
  dataUrl: string;
  included: boolean;
  label?: string;
  removeBackground?: boolean;
}

export interface BuildGenerateContentPayloadParams {
  seedContent: string;
  selectedPlatforms: string[];
  includeImages: boolean;
  imageModel: string;
  postType: 'feed' | 'carousel' | 'story';
  numSlides: number;
  acknowledgedIncomplete: boolean;
  customCta: string;
  useCustomCta: boolean;
  selectedOverrideStyles: string[];
  useStyleOverride: boolean;
  referenceImages: ReferenceImageInput[];
  /** Which reference image (index) a given carousel slide uses — same resolution rule
   * ContentGeneratorForm's `slideImageIndex` uses (manual override, else auto-cycle). */
  slideImageIndex: (slideIndex: number) => number | null;
}

// The exact payload-construction logic from ContentGeneratorForm.tsx's doGenerate —
// extracted so both the original form and the new Create Content wizard call one real
// implementation instead of keeping two copies in sync by hand.
export function buildGenerateContentPayload(params: BuildGenerateContentPayloadParams): GenerateContentPayload {
  const {
    seedContent,
    selectedPlatforms,
    includeImages,
    imageModel,
    postType,
    numSlides,
    acknowledgedIncomplete,
    customCta,
    useCustomCta,
    selectedOverrideStyles,
    useStyleOverride,
    referenceImages,
    slideImageIndex,
  } = params;

  const payload: GenerateContentPayload = {
    seed_content: seedContent.trim(),
    platforms: selectedPlatforms,
    include_images: includeImages,
    ...(includeImages ? { image_model: imageModel } : {}),
    post_type: postType,
    ...(postType === 'carousel' ? { num_slides: numSlides } : {}),
    acknowledged_incomplete_profile: acknowledgedIncomplete,
    ...(useCustomCta && customCta.trim() ? { override_cta: customCta.trim() } : {}),
    ...(useStyleOverride && selectedOverrideStyles.length > 0 ? { style_override: selectedOverrideStyles } : {}),
  };

  if (referenceImages.length > 0) {
    if (postType === 'carousel') {
      // Carousel keeps its own existing per-slide assignment system untouched —
      // every upload stays available to the slide picker regardless of the
      // "Include" tick, which is specifically for the single/combine case below.
      payload.reference_images = referenceImages.map((img) => img.dataUrl);
      payload.slide_image_map = Array.from({ length: numSlides }, (_, i) => slideImageIndex(i));
    } else {
      const included = referenceImages.filter((img) => img.included);
      payload.reference_images = included.map((img) => img.dataUrl);
      if (included.length > 1) {
        // Combine mode: only meaningful with 2+ images, so only send per-image
        // meta then — a single image behaves exactly as before.
        payload.reference_image_meta = included.map((img) => ({
          ...(img.label?.trim() ? { label: img.label.trim() } : {}),
          ...(img.removeBackground !== undefined ? { remove_background: img.removeBackground } : {}),
        }));
      }
    }
  }

  return payload;
}
